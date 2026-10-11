"use client";

export type Target = {
  role?: string;
  classId?: string;
  programId?: string;
};

export type AudienceValue = {
  audienceAll: boolean;
  targets: Target[];
};

type Option = { value: string; label: string };

export function targetLabel(
  target: Target,
  opts: { roles: Option[]; classes: Option[]; programs: Option[] }
): string {
  if (target.role) {
    const r = opts.roles.find((o) => o.value === target.role);
    return `Peran: ${r?.label ?? target.role}`;
  }
  if (target.classId) {
    const c = opts.classes.find((o) => o.value === target.classId);
    return `Kelas: ${c?.label ?? target.classId}`;
  }
  if (target.programId) {
    const p = opts.programs.find((o) => o.value === target.programId);
    return `Program: ${p?.label ?? target.programId}`;
  }
  return "Target";
}

const selectClass =
  "rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm";

export default function AudienceEditor({
  value,
  onChange,
  options,
}: {
  value: AudienceValue;
  onChange: (value: AudienceValue) => void;
  options: { roles: Option[]; classes: Option[]; programs: Option[] };
}) {
  function add(target: Target) {
    onChange({ ...value, targets: [...value.targets, target] });
  }

  function remove(index: number) {
    onChange({
      ...value,
      targets: value.targets.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={value.audienceAll}
          onChange={(e) => onChange({ ...value, audienceAll: e.target.checked })}
        />
        Semua audiens
      </label>

      <div className="flex flex-wrap gap-2">
        <select
          className={selectClass}
          value=""
          disabled={value.audienceAll}
          onChange={(e) => e.target.value && add({ role: e.target.value })}
        >
          <option value="">+ Peran…</option>
          {options.roles.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value=""
          disabled={value.audienceAll}
          onChange={(e) => e.target.value && add({ classId: e.target.value })}
        >
          <option value="">+ Kelas…</option>
          {options.classes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value=""
          disabled={value.audienceAll}
          onChange={(e) => e.target.value && add({ programId: e.target.value })}
        >
          <option value="">+ Program…</option>
          {options.programs.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {value.targets.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.targets.map((target, index) => (
            <li
              key={`${JSON.stringify(target)}-${index}`}
              className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-3 py-1 text-xs"
            >
              {targetLabel(target, options)}
              <button
                type="button"
                className="text-teal-700 dark:text-teal-300"
                onClick={() => remove(index)}
                aria-label="Hapus target"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {!value.audienceAll && value.targets.length === 0 && (
        <p className="text-xs text-gray-500">
          Pilih &quot;Semua audiens&quot; atau tambahkan minimal satu target.
        </p>
      )}
    </div>
  );
}
