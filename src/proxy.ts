import { NextResponse } from "next/server";
import { auth } from "../auth";

// Aturan akses berbasis prefiks rute. `roles` kosong = cukup login.
const rbacRules: { prefix: string; roles: string[] }[] = [
  { prefix: "/super-admin", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN", "REVIEWER"] },
  { prefix: "/staf", roles: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/guru", roles: ["TEACHER", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/siswa", roles: ["STUDENT", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/wali", roles: ["GUARDIAN", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/notifikasi", roles: [] },
  { prefix: "/dashboard", roles: [] },
];

function matchRule(pathname: string) {
  return rbacRules.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
}

export default auth((req) => {
  const { nextUrl } = req;
  const rule = matchRule(nextUrl.pathname);

  if (!rule) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  if (rule.roles.length > 0) {
    const owned = new Set([user.role, ...(user.roles ?? [])]);
    if (!rule.roles.some((role) => owned.has(role))) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/super-admin/:path*",
    "/staf/:path*",
    "/guru/:path*",
    "/siswa/:path*",
    "/wali/:path*",
    "/notifikasi/:path*",
  ],
};
