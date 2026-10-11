// Logika tagihan SPP (murni). Lihat ADR-0014.

export function isInvoiceOverdue(
  status: string,
  dueAt: Date | null | undefined,
  now = new Date()
): boolean {
  return status === "UNPAID" && Boolean(dueAt && dueAt.getTime() < now.getTime());
}

export type InvoiceSummary = {
  count: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
};

/** Rekap tagihan: total, terbayar, belum terbayar (Rupiah). */
export function summarizeInvoices(
  invoices: { status: string; amount: number }[]
): InvoiceSummary {
  const summary: InvoiceSummary = {
    count: invoices.length,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  };
  for (const invoice of invoices) {
    summary.totalAmount += invoice.amount;
    if (invoice.status === "PAID") summary.paidAmount += invoice.amount;
    else if (invoice.status === "UNPAID") summary.unpaidAmount += invoice.amount;
  }
  return summary;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
