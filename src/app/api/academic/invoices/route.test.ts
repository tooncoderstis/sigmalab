import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireApiRole, userHasRole, invoiceCreate, notifyUser, recordAudit } =
  vi.hoisted(() => ({
    requireApiRole: vi.fn(),
    userHasRole: vi.fn(),
    invoiceCreate: vi.fn(),
    notifyUser: vi.fn(),
    recordAudit: vi.fn(),
  }));

vi.mock("@/lib/rbac", () => ({
  requireApiRole,
  userHasRole,
  parseBody: (
    schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } },
    body: unknown
  ) => {
    const result = schema.safeParse(body);
    if (!result.success) return { error: new Response("bad", { status: 400 }) };
    return { data: result.data };
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { invoice: { create: invoiceCreate } },
}));

vi.mock("@/lib/notify", () => ({ notifyUser, notifyUsers: vi.fn() }));
vi.mock("@/lib/audit", () => ({ recordAudit }));

import { POST } from "./route";

function jsonReq(body: unknown) {
  return new NextRequest("http://localhost/api/academic/invoices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BODY = { studentId: "s1", title: "SPP Juli", amount: 250000 };

describe("POST /api/academic/invoices", () => {
  beforeEach(() => {
    requireApiRole.mockReset();
    userHasRole.mockReset();
    invoiceCreate.mockReset();
    notifyUser.mockReset();
    recordAudit.mockReset();
  });

  it("403 bila bukan manager", async () => {
    requireApiRole.mockResolvedValueOnce({
      error: new Response(null, { status: 403 }),
    });
    const res = await POST(jsonReq(BODY));
    expect(res.status).toBe(403);
    expect(invoiceCreate).not.toHaveBeenCalled();
  });

  it("201 membuat tagihan, mengirim notifikasi & audit", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    invoiceCreate.mockResolvedValueOnce({
      id: "inv1",
      studentId: "s1",
      title: "SPP Juli",
      amount: 250000,
    });

    const res = await POST(jsonReq(BODY));

    expect(res.status).toBe(201);
    expect(invoiceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "s1",
          status: "UNPAID",
          createdById: "a1",
        }),
      })
    );
    expect(notifyUser).toHaveBeenCalledTimes(1);
    expect(recordAudit).toHaveBeenCalledTimes(1);
  });

  it("400 bila amount negatif", async () => {
    requireApiRole.mockResolvedValueOnce({
      user: { id: "a1", role: "ADMIN", roles: ["ADMIN"] },
    });
    const res = await POST(jsonReq({ ...BODY, amount: -5 }));
    expect(res.status).toBe(400);
    expect(invoiceCreate).not.toHaveBeenCalled();
  });
});
