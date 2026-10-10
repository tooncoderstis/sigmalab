#!/usr/bin/env node
// Beri/ubah peran (UserRole) untuk seorang user berdasarkan email.
// Pakai: node scripts/grant-role.mjs <email> <ROLE> [--primary]
// Contoh: node scripts/grant-role.mjs admin@sekolah.id SUPER_ADMIN --primary

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const role = (process.argv[3] ?? "SUPER_ADMIN").toUpperCase();
  const makePrimary = process.argv.includes("--primary");

  if (!email) {
    console.error("Usage: node scripts/grant-role.mjs <email> <ROLE> [--primary]");
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User dengan email ${email} tidak ditemukan.`);
    process.exitCode = 1;
    return;
  }

  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role } },
    create: { userId: user.id, role },
    update: {},
  });

  if (makePrimary) {
    await prisma.user.update({ where: { id: user.id }, data: { role } });
  }

  console.log(
    `OK  ${email}: peran ${role} diberikan${makePrimary ? " (peran utama)" : ""}.`
  );
}

main()
  .catch((error) => {
    console.error("Gagal:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
