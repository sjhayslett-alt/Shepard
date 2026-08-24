import { useState, useMemo } from "react";
import { PLANNER_KEYS, getPlanner, type PlannerDefinition } from "~/specialized-planners";

const CATEGORY_ICONS: Record<string, string> = {
  Setup: "🧩",
  "Day-of": "🎯",
  "Follow-up": "📮",
  Promotion: "📣",
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-warm-200 px-2.5 py-1 text-xs font-medium text-warm-600 transition hover:bg-teal-50 hover:border-teal-300"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function SectionCard({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-warm-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-warm-50 transition"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-warm-900">
          <span className="text-base">{icon}</span> {title}
        </span>
        <svg
          className={`h-4 w-4 text-warm-400 transition ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="border-t border-warm-100 px-4 pb-4">{children}</div>}
    </div>
  );
}

function TimelineView({ planner }: { planner: PlannerDefinition }) {
  return (
    <div className="divide-y divide-warm-100 pt-2">
      {planner.timeline.map((t, i) => (
        <div key={i} className="flex items-start gap-3 py-2.5">
          <span className="text-xs font-bold text-teal-700 w-24 shrink-0">{t.time}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-warm-900">{t.activity}</p>
            {t.owner && <span className="text-xs text-warm-500">👤 {t.owner}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistView({ planner }: { planner: PlannerDefinition }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // Group by category preserving order
  const categories = useMemo(() => {
    const order: string[] = [];
    planner.checklist.forEach((c) => {
      if (!order.includes(c.category)) order.push(c.category);
    });
    return order;
  }, [planner]);

  const done = checked.size;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-warm-600">
          {done}/{planner.checklist.length} completed
        </span>
      </div>
      {categories.map((cat) => (
        <div key={cat} className="mb-4">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wide mb-1.5">
            {CATEGORY_ICONS[cat] ?? "•"} {cat}
          </p>
          <div className="space-y-1.5">
            {planner.checklist
              .map((c, i) => ({ c, i }))
              .filter(({ c }) => c.category === cat)
              .map(({ c, i }) => (
                <label key={i} className="flex items-start gap-2.5 py-1 cursor-pointer hover:bg-warm-50 rounded px-1 transition">
                  <input
                    type="checkbox"
                    checked={checked.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-0.5 rounded border-warm-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={`text-sm ${checked.has(i) ? "line-through text-warm-400" : "text-warm-800"}`}>
                    {c.label}
                  </span>
                </label>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetView({ planner }: { planner: PlannerDefinition }) {
  const total = planner.budget.reduce((s, b) => s + b.pct, 0);
  return (
    <div className="pt-2 space-y-3">
      {planner.budget.map((b, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-warm-800">{b.category}</span>
            <span className="font-semibold text-teal-700">{b.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-warm-100 overflow-hidden">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${b.pct}%` }} />
          </div>
          {b.note && <p className="text-xs text-warm-500 mt-0.5">{b.note}</p>}
        </div>
      ))}
      <p className="text-xs text-warm-400">Suggested allocation — total {total}% across {planner.budget.length} categories.</p>
    </div>
  );
}

function PromptsView({ planner }: { planner: PlannerDefinition }) {
  return (
    <div className="pt-2 space-y-2">
      <p className="text-xs text-warm-500">
        These are the exact prompts a connected AI model would receive to generate tailored content for this event type.
      </p>
      {planner.prompts.map((p, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-warm-200 bg-warm-50 p-3">
          <span className="text-xs font-bold text-teal-600 w-5 shrink-0">{i + 1}.</span>
          <span className="text-sm text-warm-800 flex-1">{p}</span>
          <CopyBtn text={p} />
        </div>
      ))}
    </div>
  );
}

export function SpecializedPlannersPanel({ defaultType }: { defaultType?: string }) {
  const [type, setType] = useState<string>(defaultType && PLANNERS[defaultType] ? defaultType : "vbs");
  const planner = getPlanner(type);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🗂️</span>
        <h3 className="text-lg font-bold text-teal-700">Specialized Event Planner</h3>
      </div>

      {/* Type selector */}
      <div className="rounded-xl border border-warm-200 bg-white p-3">
        <label className="text-xs font-semibold text-warm-600 block mb-2">Choose event type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm font-medium text-warm-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {PLANNER_KEYS.map((k) => (
            <option key={k} value={k}>
              {PLANNERS[k].icon} {PLANNERS[k].title}
            </option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div className="rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 text-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{planner.icon}</span>
          <h4 className="text-lg font-bold">{planner.title}</h4>
        </div>
        <p className="text-sm font-medium text-teal-100">{planner.tagline}</p>
        <p className="text-sm text-teal-50/90 mt-2">{planner.description}</p>
      </div>

      {/* Content */}
      <SectionCard title="Timeline" icon="📅">
        <TimelineView planner={planner} />
      </SectionCard>

      <SectionCard title="Checklist" icon="✅">
        <ChecklistView planner={planner} />
      </SectionCard>

      <SectionCard title="Budget Allocation" icon="💰" defaultOpen={false}>
        <BudgetView planner={planner} />
      </SectionCard>

      <SectionCard title="AI Prompts" icon="✨" defaultOpen={false}>
        <PromptsView planner={planner} />
      </SectionCard>
    </div>
  );
}