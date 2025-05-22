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
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
  });

  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = token.sub;

  const courses = await prisma.course.findMany({
    where: { userId },
    include: {
      coursesTags: {
        include: { tag: true },
      },
    },
  });

  // タグを name だけの配列に変換して返す
  const formatted = courses.map((course) => ({
    id: course.id,
    title: course.title,
    dayOfWeek: course.dayOfWeek,
    period: course.period,
    credits: course.credits,
    tags: course.coursesTags.map((ct) => ct.tag.name),
  }));

  return NextResponse.json(formatted);
}
export async function DELETE(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false,
  });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = token.sub;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("id");

  if (!courseId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // ユーザに属する授業のみ削除可能にする
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course || course.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.course.delete({
    where: { id: courseId },
  });

  return NextResponse.json({ success: true });
}
