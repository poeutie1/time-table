// src/app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import AuthButton from "@/components/AuthButton";
import CourseForm from "@/components/CourseForm";

export default function HomePage() {
  const { data: session, status } = useSession();

  // 読み込み中は何も表示しない（またはローディング表示）
  if (status === "loading") return <p>読み込み中…</p>;

  return (
    <main className="p-4">
      <h1 className="text-2xl mb-4">時間割アプリ</h1>

      {/* いつでもログインボタンだけは見える */}
      <AuthButton />

      {/* 認証済みなら CourseForm を表示 */}
      {session ? (
        <CourseForm />
      ) : (
        <p>授業データを見るには、まずログインしてください。</p>
      )}
    </main>
  );
}
