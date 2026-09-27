import { beforeEach, describe, expect, it, vi } from "vitest";

const { paymentFindUnique, paymentUpdate, enrollmentUpsert } = vi.hoisted(
  () => ({
    paymentFindUnique: vi.fn(),
    paymentUpdate: vi.fn(),
    enrollmentUpsert: vi.fn(),
  })
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    payment: { findUnique: paymentFindUnique, update: paymentUpdate },
    enrollment: { upsert: enrollmentUpsert },
  },
}));

import { POST } from "./route";

const PAYMENT = {
  id: "pay_1",
  userId: "user_1",
  courseId: "course_1",
};

function postWebhook(payload: unknown) {
  return POST(
    new Request("http://localhost/api/webhooks/mayar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

describe("POST /api/webhooks/mayar", () => {
  beforeEach(() => {
    paymentFindUnique.mockReset();
    paymentUpdate.mockReset();
    enrollmentUpsert.mockReset();
  });

  it("mengabaikan payload tanpa merchantRefId", async () => {
    const res = await postWebhook({ data: {} });

    expect(res.status).toBe(200);
    expect(paymentFindUnique).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toMatchObject({
      received: true,
      note: expect.stringContaining("merchantRefId"),
    });
  });

  it("mengabaikan bila payment tidak ditemukan", async () => {
    paymentFindUnique.mockResolvedValueOnce(null);

    const res = await postWebhook({
      data: { extraData: { merchantRefId: "pay_x" } },
    });

    expect(res.status).toBe(200);
    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  it("menandai SUCCESS dan mengaktifkan enrollment saat status paid", async () => {
    paymentFindUnique.mockResolvedValueOnce(PAYMENT);
    paymentUpdate.mockResolvedValueOnce({});
    enrollmentUpsert.mockResolvedValueOnce({});

    const res = await postWebhook({
      data: {
        status: "SUCCESS",
        extraData: { merchantRefId: PAYMENT.id },
      },
    });

    expect(res.status).toBe(200);
    expect(paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PAYMENT.id },
        data: expect.objectContaining({ status: "SUCCESS" }),
      })
    );
    expect(enrollmentUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_courseId: {
            userId: PAYMENT.userId,
            courseId: PAYMENT.courseId,
          },
        },
      })
    );
  });

  it("tidak mengubah apa pun saat status belum dibayar", async () => {
    paymentFindUnique.mockResolvedValueOnce(PAYMENT);

    const res = await postWebhook({
      data: {
        status: "PENDING",
        extraData: { merchantRefId: PAYMENT.id },
      },
    });

    expect(res.status).toBe(200);
    expect(paymentUpdate).not.toHaveBeenCalled();
    expect(enrollmentUpsert).not.toHaveBeenCalled();
  });
});
