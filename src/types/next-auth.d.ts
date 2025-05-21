// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // ここで id を追加
    } & DefaultSession["user"];
  }

  // 任意ですが、User モデルにも id を追加しておくと安全です
  interface User {
    id: string;
  }
}
