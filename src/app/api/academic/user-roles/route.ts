import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiRole, parseBody } from "@/lib/rbac";
import { handleApiError } from "@/lib/api";
import { roleValues } from "@/lib/validation";

const grantInput = z.object({
  userId: z.string().min(1),
  role: z.enum(roleValues),
});

export async function POST(req: NextRequest) {
  const authz = await requireApiRole("SUPER_ADMIN");
  if (authz.error) return authz.error;

  const parsed = parseBody(grantInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    const role = await prisma.userRole.upsert({
      where: {
        userId_role: { userId: parsed.data.userId, role: parsed.data.role },
      },
      create: { userId: parsed.data.userId, role: parsed.data.role },
      update: {},
    });

    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  const authz = await requireApiRole("SUPER_ADMIN");
  if (authz.error) return authz.error;

  const parsed = parseBody(grantInput, await req.json());
  if (parsed.error) return parsed.error;

  try {
    await prisma.userRole.delete({
      where: {
        userId_role: { userId: parsed.data.userId, role: parsed.data.role },
      },
    });

    return NextResponse.json({ message: "Peran dicabut" });
  } catch (error) {
    return handleApiError(error);
  }
}
