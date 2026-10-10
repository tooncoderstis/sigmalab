"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type User = { id: string; name: string; email: string; roles: string[] };

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "LEARNER",
  "REVIEWER",
];

export default function RoleManager({ users }: { users: User[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function send(method: "POST" | "DELETE", userId: string, role: string) {
    setError(null);
    const res = await fetch("/api/academic/user-roles", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? `Gagal (${res.status})`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </p>
      )}

      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {users.map((user) => (
          <li key={user.id} className="py-3 space-y-2">
            <div className="text-sm">
              <span className="font-medium">{user.name}</span>{" "}
              <span className="text-gray-400">({user.email})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const has = user.roles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => send(has ? "DELETE" : "POST", user.id, role)}
                    className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                      has
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
