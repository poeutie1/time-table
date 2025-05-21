// src/components/AuthButton.tsx
"use client";
import { signIn, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  if (status === "loading") return <div>Loading...</div>;
  if (session) return <div>既にログイン済み</div>;

  return (
    <button onClick={() => signIn("github", { callbackUrl: "/" })}>
      GitHubでサインイン
    </button>
  );
}
