// src/components/CourseForm.tsx
"use client";

import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import { useSession } from "next-auth/react";

type TagOption = { label: string; value: string };
type Course = {
  id: string;
  title: string;
  dayOfWeek: number;
  period: number;
  credits: number;
  tags: string[];
};

export default function CourseForm() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p>読み込み中…</p>;
  if (!session) return <p>ログインしてください</p>;

  const [title, setTitle] = useState("");
  const [day, setDay] = useState(1);
  const [period, setPeriod] = useState(1);
  const [credits, setCredits] = useState(2);

  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/courses?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } else {
      console.error("削除に失敗しました");
    }
  };

  // タグ一覧取得
  useEffect(() => {
    fetch("/api/tags", { credentials: "include" })
      .then((res) => res.json())
      .then((tags: { name: string }[]) =>
        setAllTags(tags.map((t) => ({ label: t.name, value: t.name })))
      );
  }, []);

  // 授業一覧取得
  useEffect(() => {
    fetch("/api/courses", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCourses(data));
  }, []);

  const addCourse = async () => {
    const tags = selectedTags.map((t) => t.value);
    const res = await fetch("/api/courses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dayOfWeek: day, period, credits, tags }),
    });

    if (res.ok) {
      const created = await res.json();
      setCourses((prev) => [...prev, created]);
      setTitle("");
      setDay(1);
      setPeriod(1);
      setCredits(2);
      setSelectedTags([]);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2>授業を追加</h2>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          placeholder="科目名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <select
          value={day}
          onChange={(e) => setDay(+e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <option key={d} value={d}>
              {["日", "月", "火", "水", "木", "金", "土"][d]}曜日
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => setPeriod(+e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {[1, 2, 3, 4, 5].map((p) => (
            <option key={p} value={p}>
              {p}時限
            </option>
          ))}
        </select>
        <select
          value={credits}
          onChange={(e) => setCredits(+e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {[1, 2, 3, 4, 5].map((c) => (
            <option key={c} value={c}>
              {c}単位
            </option>
          ))}
        </select>

        {/* Creatable タグ入力 */}
        <div className="min-w-[200px] flex-1">
          <CreatableSelect
            isMulti
            options={allTags}
            value={selectedTags}
            onChange={(v) => setSelectedTags(v as TagOption[])}
            placeholder="タグを入力して Enter（複数可）"
          />
        </div>

        <button
          onClick={addCourse}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          追加
        </button>
      </div>
      <ul className="list-disc pl-5 space-y-1">
        {courses.map((c) => (
          <li key={c.id} className="flex justify-between items-center">
            <div>
              {c.title} —{" "}
              {["日", "月", "火", "水", "木", "金", "土"][c.dayOfWeek]}曜{" "}
              {c.period}時限（{c.credits}単位）
              {c.tags.length > 0 && <> {c.tags.join(", ")} </>}
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="ml-4 text-sm text-red-600 border border-red-400 rounded px-2 py-1 hover:bg-red-50"
            >
              削除
            </button>
          </li>
        ))}
      </ul>

      <h3>登録済み授業</h3>
      <ul className="list-disc pl-5 space-y-1">
        {courses.map((c) => (
          <li key={c.id}>
            {c.title} —{" "}
            {["日", "月", "火", "水", "木", "金", "土"][c.dayOfWeek]}曜{" "}
            {c.period}時限（{c.credits}単位）
            {c.tags?.length > 0 && <> タグ: {c.tags.join(", ")} </>}
          </li>
        ))}
      </ul>
    </div>
  );
}
