import { prisma } from "@/lib/prisma";

export type AuditInput = {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
};

/** Mencatat audit trail (best-effort; kegagalan tidak menggagalkan aksi utama). */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? undefined) as never,
      },
    });
  } catch {
    // diabaikan sengaja
  }
}
