import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody, userHasRole } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { teacherAttendanceInput } from "@/lib/validation";

function startOfDayUtc(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

export async function GET(req: NextRequest) {
  const authz = await requireApiRole();
  if (authz.error) return authz.error;

  const isManager = userHasRole(authz.user, "ADMIN", "SUPER_ADMIN");
  const requested = req.nextUrl.searchParams.get("teacherId") ?? undefined;
  const teacherId = isManager ? requested : authz.user.id;

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const records = await prisma.teacherAttendance.findMany({
    where: {
      ...(teacherId ? { teacherId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: startOfDayUtc(new Date(from)) } : {}),
              ...(to ? { lte: startOfDayUtc(new Date(to)) } : {}),
            },
          }
        : {}),
    },
    include: { teacher: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json({ data: records });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole("TEACHER", "ADMIN", "SUPER_ADMIN");
  if (authz.error) return authz.error;

  const parsed = parseBody(teacherAttendanceInput, await req.json());
  if (parsed.error) return parsed.error;

  const teacherId = authz.user.id;
  const date = startOfDayUtc(parsed.data.date ?? new Date());
  const now = new Date();
  const action = parsed.data.action;

  try {
    const data =
      action === "check-in"
        ? { checkInAt: now, status: parsed.data.status ?? "PRESENT", note: parsed.data.note }
        : action === "check-out"
          ? { checkOutAt: now, status: parsed.data.status ?? "PRESENT", note: parsed.data.note }
          : { status: parsed.data.status, note: parsed.data.note };

    const record = await prisma.teacherAttendance.upsert({
      where: { teacherId_date: { teacherId, date } },
      create: { teacherId, date, ...data },
      update: data,
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    return handleApiError(error);
  }
}
