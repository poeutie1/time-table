"use client";

import { useEffect, useState } from "react";

type Course = {
  id: string;
  credits: number;
  tags: string[];
  title: string;
};

type Requirement = {
  tag: string;
  required: number;
};

type TagSectionProps = {
  tag: string;
  required: number;
  current: number;
  courses: Course[];
  onDelete: () => void;
};

function TagSection({
  tag,
  required,
  current,
  courses,
  onDelete,
}: TagSectionProps) {
  const [open, setOpen] = useState(false);
  const ok = current >= required;
  return (
    <div className="border rounded p-4 mb-4 bg-white shadow">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="font-bold text-lg">
          {tag} : {current} / {required} 単位
        </div>
        <div
          className={`font-semibold ${ok ? "text-green-600" : "text-red-600"}`}
        >
          {ok ? "✔︎" : "✖︎"}
        </div>
      </div>
      {open && (
        <ul className="mt-3 pl-5 text-sm text-gray-700 list-disc space-y-1">
          {courses.map((c) => (
            <li key={c.id} className="hover:bg-gray-100 rounded px-2 py-1">
              {c.title}（{c.credits}単位）
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={onDelete}
        className="mt-2 text-sm text-red-500 hover:underline"
      >
        この要件を削除
      </button>
    </div>
  );
}

export default function UnitsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [inputTag, setInputTag] = useState("");
  const [inputCredits, setInputCredits] = useState(0);

  // 授業一覧を取得
  useEffect(() => {
    fetch("/api/courses", { credentials: "include" })
      .then((res) => res.json())
      .then(setCourses)
      .catch((err) => console.error("授業取得に失敗しました:", err));
  }, []);

  // 初回マウント時に localStorage から要件を復元
  useEffect(() => {
    const saved = localStorage.getItem("graduation-requirements");
    if (saved) setRequirements(JSON.parse(saved));
  }, []);

  // 要件が変わるたびに localStorage に保存
  useEffect(() => {
    localStorage.setItem(
      "graduation-requirements",
      JSON.stringify(requirements)
    );
  }, [requirements]);

  // タグごとの取得単位を集計
  const tagCreditsMap: Record<string, number> = {};
  courses.forEach((course) => {
    course.tags.forEach((tag) => {
      tagCreditsMap[tag] = (tagCreditsMap[tag] || 0) + course.credits;
    });
  });

  // 新しい要件を追加または更新
  const handleAdd = () => {
    const trimmedTag = inputTag.trim();
    if (!trimmedTag || inputCredits <= 0) return;
    setRequirements((prev) => {
      const exists = prev.find((r) => r.tag === trimmedTag);
      if (exists) {
        return prev.map((r) =>
          r.tag === trimmedTag ? { ...r, required: inputCredits } : r
        );
      }
      return [...prev, { tag: trimmedTag, required: inputCredits }];
    });
    setInputTag("");
    setInputCredits(0);
  };

  // 要件を削除
  const handleDelete = (tag: string) => {
    setRequirements((prev) => prev.filter((r) => r.tag !== tag));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-4">単位計算</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="タグ名（例: 一般教養）"
          value={inputTag}
          onChange={(e) => setInputTag(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <input
          type="number"
          min={1}
          placeholder="必要単位数"
          value={inputCredits}
          onChange={(e) => setInputCredits(Number(e.target.value))}
          className="w-24 border rounded px-3 py-2"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white rounded px-5 py-2 hover:bg-blue-700"
        >
          要件を追加
        </button>
      </div>
      {requirements.length === 0 ? (
        <p className="text-gray-500">
          要件がまだありません。上で追加してください。
        </p>
      ) : (
        <div className="space-y-4">
          {requirements.map((r) => (
            <TagSection
              key={r.tag}
              tag={r.tag}
              required={r.required}
              current={tagCreditsMap[r.tag] || 0}
              courses={courses.filter((c) => c.tags.includes(r.tag))}
              onDelete={() => handleDelete(r.tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
