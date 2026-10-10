import { describe, expect, it } from "vitest";
import { collectRoles, userHasRole } from "./roles";

describe("userHasRole", () => {
  const user = { role: "STUDENT", roles: ["STUDENT", "GUARDIAN"] };

  it("mendeteksi peran yang dimiliki (multi-peran)", () => {
    expect(userHasRole(user, "GUARDIAN")).toBe(true);
    expect(userHasRole(user, "STUDENT")).toBe(true);
    expect(userHasRole(user, "TEACHER")).toBe(false);
  });

  it("true bila tidak ada peran yang diminta", () => {
    expect(userHasRole(user)).toBe(true);
  });

  it("user null selalu false", () => {
    expect(userHasRole(null, "ADMIN")).toBe(false);
    expect(userHasRole(undefined)).toBe(false);
  });

  it("collectRoles menggabungkan peran utama dan daftar peran", () => {
    const roles = collectRoles({ role: "ADMIN", roles: ["TEACHER"] });
    expect([...roles].sort()).toEqual(["ADMIN", "TEACHER"]);
  });
});
