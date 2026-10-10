"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; label: string };

type Props = {
  programs: Option[];
  years: Option[];
  terms: Option[];
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Gagal (${res.status})`);
  }
  return data;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function AdminForms({ programs, years, terms }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [yearName, setYearName] = useState("");
  const [termYearId, setTermYearId] = useState(years[0]?.id ?? "");
  const [termName, setTermName] = useState("Ganjil");
  const [programName, setProgramName] = useState("");
  const [programType, setProgramType] = useState("SEKOLAH");
  const [classForm, setClassForm] = useState({
    name: "",
    programId: programs[0]?.id ?? "",
    termId: terms[0]?.id ?? "",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setStatus(null);
    setError(null);
    try {
      await action();
      setStatus(successMessage);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  }

  return (
    <div className="space-y-8">
      {status && (
        <p className="rounded-lg bg-green-50 text-green-700 px-4 py-2 text-sm">
          {status}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Tahun Ajaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Field label="Nama (contoh 2025/2026)">
            <input
              className={inputClass}
              value={yearName}
              onChange={(e) => setYearName(e.target.value)}
            />
          </Field>
          <button
            className="btn-primary"
            onClick={() =>
              run(
                () => postJson("/api/academic/years", { name: yearName }),
                "Tahun ajaran dibuat."
              ).then(() => setYearName(""))
            }
          >
            Tambah Tahun Ajaran
          </button>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Term / Semester</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Field label="Tahun ajaran">
            <select
              className={inputClass}
              value={termYearId}
              onChange={(e) => setTermYearId(e.target.value)}
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nama term">
            <input
              className={inputClass}
              value={termName}
              onChange={(e) => setTermName(e.target.value)}
            />
          </Field>
          <button
            className="btn-primary"
            onClick={() =>
              run(
                () =>
                  postJson("/api/academic/terms", {
                    academicYearId: termYearId,
                    name: termName,
                  }),
                "Term dibuat."
              )
            }
          >
            Tambah Term
          </button>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Program</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Field label="Nama program">
            <input
              className={inputClass}
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
            />
          </Field>
          <Field label="Jenis">
            <select
              className={inputClass}
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
            >
              <option value="SEKOLAH">Sekolah</option>
              <option value="BIMBEL">Bimbel</option>
              <option value="KULIAH">Kuliah</option>
            </select>
          </Field>
          <button
            className="btn-primary"
            onClick={() =>
              run(
                () =>
                  postJson("/api/academic/programs", {
                    name: programName,
                    type: programType,
                  }),
                "Program dibuat."
              ).then(() => setProgramName(""))
            }
          >
            Tambah Program
          </button>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Kelas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Field label="Nama kelas">
            <input
              className={inputClass}
              value={classForm.name}
              onChange={(e) =>
                setClassForm({ ...classForm, name: e.target.value })
              }
            />
          </Field>
          <Field label="Program">
            <select
              className={inputClass}
              value={classForm.programId}
              onChange={(e) =>
                setClassForm({ ...classForm, programId: e.target.value })
              }
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Term">
            <select
              className={inputClass}
              value={classForm.termId}
              onChange={(e) =>
                setClassForm({ ...classForm, termId: e.target.value })
              }
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <button
            className="btn-primary"
            onClick={() =>
              run(
                () => postJson("/api/academic/classes", classForm),
                "Kelas dibuat."
              ).then(() => setClassForm({ ...classForm, name: "" }))
            }
          >
            Tambah Kelas
          </button>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Pengguna (Siswa/Guru/Wali/Staf)</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Field label="Nama">
            <input
              className={inputClass}
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
            />
          </Field>
          <Field label="Peran">
            <select
              className={inputClass}
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            >
              <option value="STUDENT">Siswa</option>
              <option value="TEACHER">Guru</option>
              <option value="GUARDIAN">Wali</option>
              <option value="STAFF">Staf</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <button
            className="btn-primary"
            onClick={() =>
              run(
                () => postJson("/api/academic/users", userForm),
                "Pengguna dibuat."
              ).then(() =>
                setUserForm({ name: "", email: "", password: "", role: "STUDENT" })
              )
            }
          >
            Tambah Pengguna
          </button>
        </div>
      </section>
    </div>
  );
}
