"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Course = {
  id: string;
  title: string;
  dayOfWeek: number;
  period: number;
};

export default function CourseForm() {
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(1);
  const [period, setPeriod] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const { data: session, status } = useSession();
  if (status === "loading") return <p>読み込み中…</p>;
  if (!session) return <p>授業を確認するにはログインしてください。</p>;

  useEffect(() => {
    fetch("/api/courses", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        console.log("API /api/courses returned:", data);
        setCourses(data);
      });
  }, []);

  const addCourse = async () => {
    const res = await fetch("/api/courses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dayOfWeek: day, period }),
    });
    const created: Course = await res.json();
    setCourses((prev) => [...prev, created]);
    setTitle("");
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
            {["日", "月", "火", "水", "木", "金", "土"][d]}曜日
          </option>
        ))}
      </select>
      <select value={period} onChange={(e) => setPeriod(+e.target.value)}>
        {[1, 2, 3, 4, 5, 6].map((p) => (
          <option key={p} value={p}>
            {p}時限
          </option>
        ))}
      </select>
      <button onClick={addCourse}>追加</button>

      <h3>登録済み授業</h3>
      <ul>
        {Array.isArray(courses) ? (
          courses.map((c) => (
            <li key={c.id}>
              {c.title} — {c.dayOfWeek}曜日 {c.period}時限
            </li>
          ))
        ) : (
          <li>データがありません</li>
        )}
      </ul>
    </div>
  );
}
