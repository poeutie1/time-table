// src/components/CourseForm.tsx
"use client";
import { useState, useEffect } from "react";

type Course = {
  id: string;
  title: string;
  dayOfWeek: number;
  period: number;
  credits: number;
  tags: string;
};

export default function CourseForm() {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(1);
  const [period, setPeriod] = useState(1);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [credits, setCredits] = useState(2); // ← 新規：デフォルト2単位
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/courses", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          setCourses([]);
          setError(data.error || "Unknown error");
        }
      })
      .catch(() => {
        setCourses([]);
        setError("通信エラー");
      });
  }, []);

  useEffect(() => {
    fetch("/api/tags", { credentials: "include" })
      .then((res) => res.json())
      .then((tags: { name: string }[]) => setAllTags(tags.map((t) => t.name)));
  }, []);

  const addCourse = async () => {
    const res = await fetch("/api/courses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dayOfWeek: day, period, credits }),
    });
    const created = await res.json();
    if (res.ok) {
      setCourses((prev) => (prev ? [...prev, created] : [created]));
      setTitle("");
      setError(null);
    } else {
      setError(created.error || "作成に失敗しました");
    }
  };

  return (
    <div>
      <h2>授業を追加</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="科目名"
      />
      <select value={day} onChange={(e) => setDay(+e.target.value)}>
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <option key={d} value={d}>
            {["月", "火", "水", "木", "金", "土"][d]}曜日
          </option>
        ))}
      </select>
      <select value={period} onChange={(e) => setPeriod(+e.target.value)}>
        {[1, 2, 3, 4, 5, 6].map((p) => (
          <option key={p} value={p}>
            {p}限
          </option>
        ))}
      </select>
      <select value={credits} onChange={(e) => setCredits(+e.target.value)}>
        {[1, 2, 3, 4, 5].map((c) => (
          <option key={c} value={c}>
            {c}単位
          </option>
        ))}
      </select>
      <select
        multiple
        value={selectedTags}
        onChange={(e) =>
          setSelectedTags(
            Array.from(e.target.selectedOptions).map((opt) => opt.value)
          )
        }
        className="border px-2 py-1 rounded h-[6rem] min-w-[150px]"
      >
        {allTags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
      <button onClick={addCourse}>追加</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>登録済み授業</h3>
      <ul>
        {/* ① 読み込み中 */}
        {courses === null && <li key="loading">読み込み中…</li>}

        {/* ② 正常取得時 */}
        {Array.isArray(courses) &&
          courses.map((c) => (
            <li key={c.id}>
              {c.title} — {c.dayOfWeek}曜日 {c.period}時限
            </li>
          ))}

        {/* ③ エラーor配列以外 */}
        {courses !== null && !Array.isArray(courses) && (
          <li key="error">データが取得できませんでした</li>
        )}
      </ul>
    </div>
  );
}
