// src/app/api/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // 1) JWT から userId を取り出し
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
  });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = token.sub;

  // 2) ボディを parse & バリデーション
  const { title, dayOfWeek, period, credits, tags } = await request.json();
  if (
    !title ||
    dayOfWeek == null ||
    period == null ||
    credits == null ||
    !Array.isArray(tags)
  ) {
    return NextResponse.json(
      { error: "title, dayOfWeek, period, credits, tags[] are required" },
      { status: 400 }
    );
  }

  // 3) トランザクションでまとめて作成
  const course = await prisma.$transaction(async (tx) => {
    // 3-1: 授業レコードを作成
    const newCourse = await tx.course.create({
      data: { userId, title, dayOfWeek, period, credits },
    });

    // 3-2: タグを upsert して、Tag レコードを取得
    const tagRecords = await Promise.all(
      tags.map((name: string) =>
        tx.tag.upsert({
          where: { userId_name: { userId, name } },
          create: { userId, name },
          update: {},
        })
      )
    );

    // 3-3: 中間テーブルに紐付け
    await Promise.all(
      tagRecords.map((tag) =>
        tx.courseTag.create({
          data: { courseId: newCourse.id, tagId: tag.id },
        })
      )
    );

    return newCourse;
  });

  // 4) フロント向けに tags をそのまま文字列配列で返却
  return NextResponse.json(
    {
      ...course,
      tags, // リクエストで渡した順序そのまま
    },
    { status: 201 }
  );
}
