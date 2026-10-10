"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Person = { id: string; name: string; email: string };

type Props = {
  classId: string;
  students: Person[];
  teachers: Person[];
  enrolled: { id: string; studentId: string; name: string; email: string }[];
  assignments: {
    id: string;
    teacherId: string;
    name: string;
    subject: string | null;
  }[];
};

const inputClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm";

export default function ClassManager({
  classId,
  students,
  teachers,
  enrolled,
  assignments,
}: Props) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  async function send(url: string, method: string, body?: unknown) {
    setError(null);
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `Gagal (${res.status})`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Siswa Terdaftar</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className={inputClass}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={() =>
              send(`/api/academic/classes/${classId}/enrollments`, "POST", {
                studentId,
              })
            }
          >
            Tambahkan
          </button>
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {enrolled.map((e) => (
            <li key={e.id} className="py-2 flex justify-between items-center">
              <span className="text-sm">
                {e.name}{" "}
                <span className="text-gray-400">({e.email})</span>
              </span>
              <button
                className="text-red-600 text-sm hover:underline"
                onClick={() =>
                  send(
                    `/api/academic/classes/${classId}/enrollments`,
                    "DELETE",
                    { studentId: e.studentId }
                  )
                }
              >
                Keluarkan
              </button>
            </li>
          ))}
          {enrolled.length === 0 && (
            <li className="py-2 text-sm text-gray-500">Belum ada siswa.</li>
          )}
        </ul>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">Guru Pengampu</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className={inputClass}
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={() =>
              send(`/api/academic/classes/${classId}/assignments`, "POST", {
                teacherId,
              })
            }
          >
            Tugaskan
          </button>
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {assignments.map((a) => (
            <li key={a.id} className="py-2 flex justify-between items-center">
              <span className="text-sm">
                {a.name}
                {a.subject ? ` — ${a.subject}` : ""}
              </span>
              <button
                className="text-red-600 text-sm hover:underline"
                onClick={() =>
                  send(
                    `/api/academic/classes/${classId}/assignments?assignmentId=${a.id}`,
                    "DELETE"
                  )
                }
              >
                Hapus
              </button>
            </li>
          ))}
          {assignments.length === 0 && (
            <li className="py-2 text-sm text-gray-500">Belum ada guru.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
