import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { managedUserInput } from "@/lib/validation";

const MANAGER = ["ADMIN", "SUPER_ADMIN"] as const;

export async function GET(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const role = req.nextUrl.searchParams.get("role") ?? undefined;
  const search = req.nextUrl.searchParams.get("search") ?? undefined;

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { roles: { some: { role: role as Role } } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roles: { select: { role: true } },
      studentProfile: true,
      teacherProfile: true,
      staffProfile: true,
      guardianProfile: true,
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const authz = await requireApiRole(...MANAGER);
  if (authz.error) return authz.error;

  const parsed = parseBody(managedUserInput, await req.json());
  if (parsed.error) return parsed.error;

  const { name, email, password, role, ...profile } = parsed.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        roles: { create: { role } },
        ...(role === "STUDENT"
          ? {
              studentProfile: {
                create: {
                  nis: profile.nis,
                  nisn: profile.nisn,
                  programId: profile.programId,
                  guardianId: profile.guardianId,
                },
              },
            }
          : {}),
        ...(role === "TEACHER"
          ? {
              teacherProfile: {
                create: { nip: profile.nip, specialty: profile.specialty },
              },
            }
          : {}),
        ...(role === "GUARDIAN"
          ? {
              guardianProfile: {
                create: { phone: profile.phone, occupation: profile.occupation },
              },
            }
          : {}),
        ...(role === "STAFF"
          ? {
              staffProfile: {
                create: { position: profile.position, department: profile.department },
              },
            }
          : {}),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
