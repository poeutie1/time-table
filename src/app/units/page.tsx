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
    <div className="border rounded p-3 mb-3 bg-white">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="font-bold text-lg">
          {tag}：{current} / {required} 単位
        </div>
        <div
          className={`font-semibold ${ok ? "text-green-600" : "text-red-600"}`}
        >
          {ok ? "OK" : "不足"}
        </div>
      </div>

      {open && (
        <ul className="mt-2 pl-4 text-sm text-gray-700 list-disc">
          {courses.map((c, idx) => (
            <li key={idx}>
              {c.title}（{c.credits}単位）
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onDelete}
        className="text-sm text-red-500 mt-2 hover:underline"
      >
        要件を削除
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
      .then((data) => setCourses(data))
      .catch((err) => console.error("授業取得失敗:", err));
  }, []);

  // 初回のみ localStorage から復元
  useEffect(() => {
    const saved = localStorage.getItem("graduation-requirements");
    if (saved) {
      setRequirements(JSON.parse(saved));
    }
  }, []);

  // requirements が変わるたびに localStorage に保存
  useEffect(() => {
    localStorage.setItem(
      "graduation-requirements",
      JSON.stringify(requirements)
    );
  }, [requirements]);

  // タグごとの取得単位を集計
  const tagCreditsMap: Record<string, number> = {};
  for (const course of courses) {
    for (const tag of course.tags) {
      tagCreditsMap[tag] = (tagCreditsMap[tag] ?? 0) + course.credits;
    }
  }

  // 要件の追加・更新
  const handleAdd = () => {
    const tag = inputTag.trim();
    if (!tag || inputCredits <= 0) return;
    setRequirements((prev) => {
      const exists = prev.find((r) => r.tag === tag);
      if (exists) {
        return prev.map((r) =>
          r.tag === tag ? { ...r, required: inputCredits } : r
        );
      } else {
        return [...prev, { tag, required: inputCredits }];
      }
    });
    setInputTag("");
    setInputCredits(0);
  };

  // 要件の削除
  const handleDelete = (tag: string) => {
    setRequirements((prev) => prev.filter((r) => r.tag !== tag));
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">単位計算ページ</h2>

      {/* 要件入力欄 */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          placeholder="タグ名（例: 一般教養）"
          value={inputTag}
          onChange={(e) => setInputTag(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="number"
          min={1}
          value={inputCredits}
          onChange={(e) => setInputCredits(Number(e.target.value))}
          placeholder="必要単位数"
          className="border px-2 py-1 rounded w-24"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          要件追加・更新
        </button>
      </div>

      {/* 要件リストと進捗表示 */}
      {requirements.length === 0 ? (
        <p className="text-gray-500">まだ要件が追加されていません。</p>
      ) : (
        <div>
          {requirements.map((r) => (
            <TagSection
              key={r.tag}
              tag={r.tag}
              required={r.required}
              current={tagCreditsMap[r.tag] ?? 0}
              courses={courses.filter((c) => c.tags.includes(r.tag))}
              onDelete={() => handleDelete(r.tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
