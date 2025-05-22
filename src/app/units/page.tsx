"use client";

import { useEffect, useState } from "react";

type Course = {
  id: string;
  credits: number;
  tags: string[];
};

type Requirement = {
  tag: string;
  required: number;
};

export default function UnitsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  const [inputTag, setInputTag] = useState("");
  const [inputCredits, setInputCredits] = useState(0);

  // 🔽 授業一覧を取得
  useEffect(() => {
    fetch("/api/courses", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCourses(data))
      .catch((err) => console.error("授業取得失敗:", err));
  }, []);

  // 🔽 初回のみ localStorage から復元
  useEffect(() => {
    const saved = localStorage.getItem("graduation-requirements");

    if (saved) {
      setRequirements(JSON.parse(saved));
    }
  }, []);

  // 🔽 requirements が変わるたびに localStorage に保存
  useEffect(() => {
    localStorage.setItem(
      "graduation-requirements",
      JSON.stringify(requirements)
    );
  }, [requirements]);

  // 🔽 タグごとの取得単位を集計
  const tagCreditsMap: Record<string, number> = {};
  for (const course of courses) {
    for (const tag of course.tags) {
      tagCreditsMap[tag] = (tagCreditsMap[tag] ?? 0) + course.credits;
    }
  }

  // 🔽 要件の追加・更新
  const handleAdd = () => {
    if (!inputTag.trim() || inputCredits <= 0) return;
    setRequirements((prev) => {
      const exists = prev.find((r) => r.tag === inputTag.trim());
      if (exists) {
        return prev.map((r) =>
          r.tag === inputTag.trim() ? { ...r, required: inputCredits } : r
        );
      } else {
        return [...prev, { tag: inputTag.trim(), required: inputCredits }];
      }
    });
    setInputTag("");
    setInputCredits(0);
  };

  // 🔽 要件の削除
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
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-2 py-1">タグ名</th>
              <th className="px-2 py-1">現在の取得単位</th>
              <th className="px-2 py-1">必要単位</th>
              <th className="px-2 py-1">達成状況</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => {
              const current = tagCreditsMap[r.tag] ?? 0;
              const ok = current >= r.required;
              return (
                <tr key={r.tag} className="border-t">
                  <td className="px-2 py-1">{r.tag}</td>
                  <td className="px-2 py-1">{current}</td>
                  <td className="px-2 py-1">{r.required}</td>
                  <td
                    className={`px-2 py-1 font-semibold ${
                      ok ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {ok ? "OK" : "不足"}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(r.tag)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
