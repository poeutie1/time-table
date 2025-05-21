import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/courses — ログインユーザの授業一覧を返す

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 必ず user.id があると信じるなら non-null assertion で !
  const userId = session.user.id!;
  const courses = await prisma.course.findMany({
    where: { userId: session.user.id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(courses);
}

// POST /api/courses — ボディで渡された授業を作成
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, dayOfWeek, period } = await request.json();
  if (!title || dayOfWeek == null || period == null) {
    return NextResponse.json(
      { error: "title, dayOfWeek, period are required" },
      { status: 400 }
    );
  }

  const newCourse = await prisma.course.create({
    data: {
      userId: session.user.id,
      title,
      dayOfWeek,
      period,
    },
  });
  return NextResponse.json(newCourse, { status: 201 });
}
