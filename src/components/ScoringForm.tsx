"use client";

import { useState, useTransition } from "react";
import { Save, Plus, X } from "lucide-react";
import { updateScoringConfig } from "@/lib/actions";
import type { ScoringConfig } from "@/lib/types";
import { inputClass } from "./RecordDialog";

export function ScoringForm({ initial }: { initial: ScoringConfig }) {
  const [config, setConfig] = useState<ScoringConfig>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const onSave = () => {
    startTransition(() => {
      updateScoringConfig(config).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      });
    });
  };

  return (
    <div className="space-y-5">
      <WeightTable
        title="Industry"
        description="Bonus points by industry. Match is exact (case-sensitive)."
        entries={config.industry}
        onChange={(industry) => setConfig({ ...config, industry })}
      />
      <WeightTable
        title="Company size"
        description="Bonus points by company size bucket."
        entries={config.size}
        onChange={(size) => setConfig({ ...config, size })}
      />
      <WeightTable
        title="Location"
        description="Bonus points if the contact's company location contains this string."
        entries={config.location}
        onChange={(location) => setConfig({ ...config, location })}
      />
      <RolePatternsTable
        patterns={config.rolePatterns}
        onChange={(rolePatterns) => setConfig({ ...config, rolePatterns })}
      />
      <section className="rounded-xl border border-[var(--border)] bg-white">
        <Header
          title="Intent"
          description="Bonus if last_engaged_at is within the recent window."
        />
        <div className="grid grid-cols-2 gap-3 px-4 py-3">
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--muted-foreground)]">Recent window (days)</span>
            <input
              type="number"
              min={1}
              value={config.intent.recentEngagedDays}
              onChange={(e) =>
                setConfig({
                  ...config,
                  intent: { ...config.intent, recentEngagedDays: Number(e.target.value) },
                })
              }
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--muted-foreground)]">Bonus weight</span>
            <input
              type="number"
              value={config.intent.weight}
              onChange={(e) =>
                setConfig({
                  ...config,
                  intent: { ...config.intent, weight: Number(e.target.value) },
                })
              }
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white">
        <Header
          title="Tier thresholds"
          description="A and B minimum scores. Below B is tier C."
        />
        <div className="grid grid-cols-2 gap-3 px-4 py-3">
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--muted-foreground)]">Tier A (min score)</span>
            <input
              type="number"
              value={config.tiers.A}
              onChange={(e) =>
                setConfig({
                  ...config,
                  tiers: { ...config.tiers, A: Number(e.target.value) },
                })
              }
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px]">
            <span className="text-[var(--muted-foreground)]">Tier B (min score)</span>
            <input
              type="number"
              value={config.tiers.B}
              onChange={(e) =>
                setConfig({
                  ...config,
                  tiers: { ...config.tiers, B: Number(e.target.value) },
                })
              }
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <div className="sticky bottom-0 -mx-6 -mb-5 mt-6 flex items-center justify-end gap-3 border-t border-[var(--border)] bg-white px-6 py-3">
        {saved && <span className="text-[12px] text-emerald-600">Saved</span>}
        <button
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-black disabled:opacity-50"
        >
          <Save size={12} />
          Save scoring rules
        </button>
      </div>
    </div>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-[var(--border)] px-4 py-2.5">
      <h2 className="text-[13px] font-medium">{title}</h2>
      <p className="text-[11.5px] text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

function WeightTable({
  title,
  description,
  entries,
  onChange,
}: {
  title: string;
  description: string;
  entries: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  const [newKey, setNewKey] = useState("");
  const [newWeight, setNewWeight] = useState<number>(0);
  const ordered = Object.entries(entries);

  const add = () => {
    if (!newKey) return;
    onChange({ ...entries, [newKey]: newWeight });
    setNewKey("");
    setNewWeight(0);
  };

  const update = (k: string, weight: number) => onChange({ ...entries, [k]: weight });
  const remove = (k: string) => {
    const next = { ...entries };
    delete next[k];
    onChange(next);
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white">
      <Header title={title} description={description} />
      <ul>
        {ordered.map(([k, v]) => (
          <li
            key={k}
            className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border)] last:border-b-0"
          >
            <span className="text-[13px] flex-1 truncate">{k}</span>
            <input
              type="number"
              value={v}
              onChange={(e) => update(k, Number(e.target.value))}
              className="w-20 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] tabular-nums text-right outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={() => remove(k)}
              className="rounded p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--sidebar)] px-4 py-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Add new..."
          className="flex-1 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] outline-none focus:border-[var(--accent)]"
        />
        <input
          type="number"
          value={newWeight}
          onChange={(e) => setNewWeight(Number(e.target.value))}
          className="w-20 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] tabular-nums text-right outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={add}
          className="rounded-md border border-[var(--border)] bg-white p-1 text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]"
          aria-label="Add"
        >
          <Plus size={12} />
        </button>
      </div>
    </section>
  );
}

function RolePatternsTable({
  patterns,
  onChange,
}: {
  patterns: { pattern: string; weight: number }[];
  onChange: (next: { pattern: string; weight: number }[]) => void;
}) {
  const [newPattern, setNewPattern] = useState("");
  const [newWeight, setNewWeight] = useState(0);

  const add = () => {
    if (!newPattern) return;
    onChange([...patterns, { pattern: newPattern, weight: newWeight }]);
    setNewPattern("");
    setNewWeight(0);
  };

  const update = (i: number, patch: Partial<{ pattern: string; weight: number }>) => {
    const next = patterns.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const remove = (i: number) => onChange(patterns.filter((_, idx) => idx !== i));

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white">
      <Header
        title="Role patterns"
        description="Regex-style patterns matched against the contact's role (case-insensitive)."
      />
      <ul>
        {patterns.map((p, i) => (
          <li
            key={i}
            className="flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border)] last:border-b-0"
          >
            <input
              value={p.pattern}
              onChange={(e) => update(i, { pattern: e.target.value })}
              className="flex-1 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] outline-none focus:border-[var(--accent)] font-mono"
            />
            <input
              type="number"
              value={p.weight}
              onChange={(e) => update(i, { weight: Number(e.target.value) })}
              className="w-20 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] tabular-nums text-right outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={() => remove(i)}
              className="rounded p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--sidebar)] px-4 py-2">
        <input
          value={newPattern}
          onChange={(e) => setNewPattern(e.target.value)}
          placeholder="e.g. VP|Head of"
          className="flex-1 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] outline-none focus:border-[var(--accent)] font-mono"
        />
        <input
          type="number"
          value={newWeight}
          onChange={(e) => setNewWeight(Number(e.target.value))}
          className="w-20 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] tabular-nums text-right outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={add}
          className="rounded-md border border-[var(--border)] bg-white p-1 text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]"
          aria-label="Add"
        >
          <Plus size={12} />
        </button>
      </div>
    </section>
  );
}
