import { useState, useCallback } from "react";
import type { EventType } from "~/events";
import { PromoFollowUpPanel } from "~/components/PromoFollowUp";
import {
  generateTimeline,
  generateChecklist,
  generateBudget,
  generateVolunteerAssignments,
  generateShoppingList,
  generateRiskPlan,
  generateSetupBreakdown,
  generateContent,
} from "~/ai";
import type {
  TimelineResult,
  ChecklistResult,
  BudgetResult,
  BudgetCategory,
  VolunteerAssignmentResult,
  ShoppingListResult,
  RiskPlanResult,
  SetupBreakdownResult,
  SetupBreakdownTask,
  ContentResult,
  FacebookPost,
  InstagramCaption,
  EmailTemplate,
} from "~/ai";

// ---------------------------------------------------------------------------
// Shared icons
// ---------------------------------------------------------------------------

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Collapsible section wrapper
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-warm-200/60 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-warm-50/50 transition rounded-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-teal-600">{icon}</span>
          <span className="text-base font-bold text-warm-900">{title}</span>
        </div>
        <ChevronDown open={open} />
      </button>
      {open && <div className="border-t border-warm-100 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Timeline Tool
// ---------------------------------------------------------------------------

function TimelineTool({ eventId }: { eventId: string }) {
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await generateTimeline({ eventId });
      setTimeline(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate timeline");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  return (
    <CollapsibleSection
      title="AI Event Timeline"
      icon={<SparkleIcon />}
      defaultOpen
    >
      <p className="text-sm text-warm-600 mb-4">
        Generate an event-type-specific timeline with minute-by-minute scheduling.
      </p>

      {!timeline && (
        <button
          onClick={loadTimeline}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : "Generate Timeline"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {timeline && (
        <div>
          <div className="relative ml-3">
            {/* Vertical line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-teal-200" />

            <div className="space-y-4">
              {timeline.blocks.map((block, i) => (
                <div key={i} className="relative flex gap-4 pl-6">
                  {/* Dot */}
                  <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-teal-500 bg-white" />
                  <div className="min-w-[90px] sm:min-w-[110px]">
                    <span className="text-sm font-bold text-teal-700">{block.time}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-900">{block.activity}</p>
                    {block.notes && (
                      <p className="text-xs text-warm-500 mt-0.5">{block.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={loadTimeline}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// 2. Checklist Tool
// ---------------------------------------------------------------------------

function ChecklistTool({ eventId }: { eventId: string }) {
  const [checklist, setChecklist] = useState<ChecklistResult | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadChecklist = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await generateChecklist({ eventId });
      setChecklist(result);
      setChecked({});
    } catch (err: any) {
      setError(err.message || "Failed to generate checklist");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const toggleItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = checklist
    ? checklist.phases.reduce((sum, p) => sum + p.items.length, 0)
    : 0;
  const completedCount = checklist
    ? checklist.phases.reduce(
        (sum, p) => sum + p.items.filter((it) => checked[it.id]).length,
        0,
      )
    : 0;
  const progressPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <CollapsibleSection
      title="AI Planning Checklist"
      icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>}
    >
      <p className="text-sm text-warm-600 mb-4">
        A phased planning checklist from 4 weeks before through post-event follow-up.
      </p>

      {!checklist && (
        <button
          onClick={loadChecklist}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : "Generate Checklist"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {checklist && (
        <div>
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-warm-700">
                {completedCount} of {totalItems} completed
              </span>
              <span className="text-sm font-bold text-teal-700">{progressPct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-warm-100">
              <div
                className="h-2.5 rounded-full bg-teal-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-5">
            {checklist.phases.map((phase, pi) => {
              const phaseCompleted = phase.items.filter((it) => checked[it.id]).length;
              const phaseTotal = phase.items.length;
              return (
                <div key={pi}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold text-warm-900">{phase.phase}</h4>
                    <span className="text-xs text-warm-400">
                      {phaseCompleted}/{phaseTotal}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {phase.items.map((item) => (
                      <li key={item.id}>
                        <label className="flex items-start gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={!!checked[item.id]}
                            onChange={() => toggleItem(item.id)}
                            className="mt-0.5 h-4 w-4 rounded border-warm-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <span
                            className={`text-sm transition ${
                              checked[item.id]
                                ? "text-warm-400 line-through"
                                : "text-warm-700 group-hover:text-warm-900"
                            }`}
                          >
                            {item.text}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <button
              onClick={loadChecklist}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// 3. Budget Tool
// ---------------------------------------------------------------------------

function BudgetTool({ eventId }: { eventId: string }) {
  const [budget, setBudget] = useState<BudgetResult | null>(null);
  const [categories, setCategories] = useState<BudgetCategory[] | null>(null);
  const [totalBudgetInput, setTotalBudgetInput] = useState("500");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBudget = useCallback(async (total: number) => {
    setLoading(true);
    setError("");
    try {
      const result = await generateBudget({ eventId, totalBudget: total });
      setBudget(result);
      setCategories(result.categories);
    } catch (err: any) {
      setError(err.message || "Failed to generate budget");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const handleGenerate = () => {
    const total = parseFloat(totalBudgetInput);
    if (isNaN(total) || total <= 0) {
      setError("Please enter a valid budget amount");
      return;
    }
    loadBudget(total);
  };

  const updateCategory = (index: number, newAmount: number) => {
    if (!categories || !budget) return;
    const updated = [...categories];
    updated[index] = { ...updated[index], amount: Math.max(0, newAmount) };

    const totalAllocated = updated.reduce((sum, c) => sum + c.amount, 0);
    const totalBudget = budget.totalBudget;

    updated.forEach((cat) => {
      cat.percentage = totalBudget > 0 ? Math.round((cat.amount / totalBudget) * 10000) / 100 : 0;
    });

    setCategories(updated);
  };

  const totalAllocated = categories ? categories.reduce((sum, c) => sum + c.amount, 0) : 0;
  const remaining = budget ? budget.totalBudget - totalAllocated : 0;

  return (
    <CollapsibleSection
      title="AI Budget Worksheet"
      icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>}
    >
      <p className="text-sm text-warm-600 mb-4">
        Enter a total budget and get event-type-specific category allocations. Adjust line items — the worksheet recalculates automatically.
      </p>

      {/* Input row */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-warm-400 mb-1">
            Total Budget ($)
          </label>
          <input
            type="number"
            min="1"
            step="any"
            value={totalBudgetInput}
            onChange={(e) => setTotalBudgetInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
            className="w-40 rounded-lg border border-warm-200 px-3 py-2 text-sm font-medium text-warm-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="e.g. 500"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : categories ? "Regenerate" : "Allocate Budget"}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {categories && (
        <div>
          {/* Summary bar */}
          <div className="mb-4 flex flex-wrap gap-3 rounded-lg bg-warm-50 px-4 py-3">
            <div>
              <span className="text-xs text-warm-400">Total Budget</span>
              <p className="text-sm font-bold text-warm-900">${budget!.totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-warm-400">Allocated</span>
              <p className="text-sm font-bold text-teal-700">${totalAllocated.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-warm-400">Remaining</span>
              <p className={`text-sm font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${remaining.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Category rows */}
          <div className="space-y-2">
            {/* Header */}
            <div className="hidden sm:flex items-center gap-3 px-2 text-xs font-semibold uppercase tracking-wider text-warm-400">
              <span className="flex-1">Category</span>
              <span className="w-28 text-right">Amount</span>
              <span className="w-12 text-right">%</span>
            </div>
            {categories.map((cat, i) => (
              <div
                key={i}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-lg border border-warm-100 px-3 py-2.5 hover:border-warm-200 transition"
              >
                <span className="flex-1 text-sm font-medium text-warm-900 min-w-[120px]">
                  {cat.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-warm-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cat.amount}
                    onChange={(e) => updateCategory(i, parseFloat(e.target.value) || 0)}
                    className="w-24 rounded border border-warm-200 px-2 py-1 text-sm text-right font-medium text-warm-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-warm-500">
                  {cat.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Visual bar chart */}
          <div className="mt-4 flex h-4 w-full rounded-full overflow-hidden">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="h-full transition-all"
                style={{
                  width: `${Math.max(cat.percentage, 1)}%`,
                  backgroundColor: [
                    "#14b8a6", "#0d9488", "#5eead4", "#2dd4bf",
                    "#f59e0b", "#d97706", "#fbbf24", "#fcd34d",
                  ][i % 8],
                }}
                title={`${cat.name}: ${cat.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-warm-500">
                <span
                  className="h-2.5 w-2.5 rounded-full inline-block"
                  style={{
                    backgroundColor: [
                      "#14b8a6", "#0d9488", "#5eead4", "#2dd4bf",
                      "#f59e0b", "#d97706", "#fbbf24", "#fcd34d",
                    ][i % 8],
                  }}
                />
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// 4. Volunteer Assignment Tool
// ---------------------------------------------------------------------------

function VolunteerTool({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<VolunteerAssignmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await generateVolunteerAssignments({ eventId });
      setResult(r);
    } catch (err: any) {
      setError(err.message || "Failed to generate volunteer assignments");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const roleLabels: Record<string, string> = {
    greeter: "Greeter",
    parking: "Parking",
    hospitality: "Hospitality",
    childrens_ministry: "Children's Ministry",
    security: "Security",
    cleanup: "Cleanup",
    registration: "Registration",
    floater: "Floater",
    worship_team: "Worship Team",
  };

  return (
    <CollapsibleSection
      title="AI Volunteer Assignments"
      icon={<SparkleIcon />}
    >
      <p className="text-sm text-warm-600 mb-4">
        Smart volunteer role assignments based on event type and your church's volunteer database.
      </p>

      {!result && (
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : "Assign Volunteers"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div>
          {result.isSampleData && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                <span className="font-bold">Sample data:</span> No volunteers found in your church database yet. 
                These are sample assignments to show what the tool can do. Add volunteers in your church settings to get real assignments.
              </p>
            </div>
          )}

          {result.assignments.length === 0 ? (
            <p className="text-sm text-warm-500">No assignments generated. Add volunteers to your church database first.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.assignments.map((a) => (
                <div key={a.id} className="rounded-lg border border-warm-100 bg-warm-50/50 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-warm-900">{a.name}</p>
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                        {roleLabels[a.role] || a.role}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-warm-500 leading-relaxed">{a.reason}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// 5. Shopping List Tool
// ---------------------------------------------------------------------------

function ShoppingListTool({ eventId }: { eventId: string }) {
  const [list, setList] = useState<ShoppingListResult | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await generateShoppingList({ eventId });
      setList(r);
      setChecked({});
    } catch (err: any) {
      setError(err.message || "Failed to generate shopping list");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalItems = list ? list.categories.reduce((sum, c) => sum + c.items.length, 0) : 0;
  const completed = list ? list.categories.reduce((sum, c) => sum + c.items.filter((it) => checked[it.id]).length, 0) : 0;
  const pct = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;

  return (
    <CollapsibleSection
      title="AI Shopping List"
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
      }
    >
      <p className="text-sm text-warm-600 mb-4">
        Event-type-aware shopping list organized by category with suggested quantities.
      </p>

      {!list && (
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : "Generate Shopping List"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {list && (
        <div>
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-warm-700">{completed} of {totalItems} items</span>
              <span className="text-sm font-bold text-teal-700">{pct}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-warm-100">
              <div className="h-2.5 rounded-full bg-teal-500 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="space-y-5">
            {list.categories.map((cat, ci) => (
              <div key={ci}>
                <h4 className="text-sm font-bold text-warm-900 mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  {cat.category}
                  <span className="text-xs text-warm-400 font-normal">({cat.items.length} items)</span>
                </h4>
                <ul className="space-y-1.5">
                  {cat.items.map((item) => (
                    <li key={item.id}>
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={!!checked[item.id]}
                          onChange={() => toggle(item.id)}
                          className="mt-0.5 h-4 w-4 rounded border-warm-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <div>
                          <span className={`text-sm transition ${checked[item.id] ? "text-warm-400 line-through" : "text-warm-700 group-hover:text-warm-900"}`}>
                            {item.name}
                          </span>
                          <span className={`ml-2 text-xs ${checked[item.id] ? "text-warm-300" : "text-warm-400"}`}>
                            — {item.quantity}
                          </span>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// 6. Risk Checklist + Rain Plan Tool
// ---------------------------------------------------------------------------

function RiskTool({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<RiskPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await generateRiskPlan({ eventId });
      setResult(r);
    } catch (err: any) {
      setError(err.message || "Failed to generate risk plan");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const severityColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-700";
      case "high": return "bg-orange-100 text-orange-700";
      case "medium": return "bg-amber-100 text-amber-700";
      case "low": return "bg-green-100 text-green-700";
      case "very low": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const likelihoodColor = (l: string) => {
    switch (l.toLowerCase()) {
      case "very high": return "text-red-600 font-bold";
      case "high": return "text-orange-600 font-bold";
      case "medium": return "text-amber-600 font-semibold";
      case "low": return "text-green-600";
      case "very low": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  return (
    <CollapsibleSection
      title="AI Risk Plan"
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      }
    >
      <p className="text-sm text-warm-600 mb-4">
        Event-type-specific risk assessment with likelihood, severity, and mitigation strategies.
      </p>

      {!result && (
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : "Generate Risk Plan"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div>
          {/* Risk table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-200">
                  <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider text-warm-400">Risk</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider text-warm-400 w-[80px]">Likelihood</th>
                  <th className="text-left py-2 pr-3 text-xs font-semibold uppercase tracking-wider text-warm-400 w-[80px]">Severity</th>
                  <th className="text-left py-2 text-xs font-semibold uppercase tracking-wider text-warm-400">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {result.risks.map((r) => (
                  <tr key={r.id} className="border-b border-warm-100/50">
                    <td className="py-2.5 pr-3 font-medium text-warm-900">{r.risk}</td>
                    <td className={`py-2.5 pr-3 text-xs ${likelihoodColor(r.likelihood)}`}>{r.likelihood}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${severityColor(r.severity)}`}>{r.severity}</span>
                    </td>
                    <td className="py-2.5 text-xs text-warm-600 leading-relaxed">{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rain plan */}
          {result.rainPlan && (
            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 007.92 12.446A9 9 0 1112 2.992zM15.375 14.25c-2.25 3.75-6.75 3.75-6.75 0" />
                </svg>
                <span className="text-sm font-bold text-blue-800">Rain Plan</span>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed">{result.rainPlan}</p>
            </div>
          )}

          {result.isOutdoorEvent && !result.rainPlan && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                This event may have outdoor components. Consider preparing a rain contingency plan.
              </p>
            </div>
          )}

          <div className="mt-5">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// 7. Setup & Breakdown Tool
// ---------------------------------------------------------------------------

function SetupBreakdownTool({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<SetupBreakdownResult | null>(null);
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await generateSetupBreakdown({ eventId });
      setResult(r);
      setAssignees({});
    } catch (err: any) {
      setError(err.message || "Failed to generate setup/breakdown schedule");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const updateAssignee = (id: string, value: string) => {
    setAssignees((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <CollapsibleSection
      title="AI Setup & Breakdown Schedule"
      icon={
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      <p className="text-sm text-warm-600 mb-4">
        Time-blocked setup tasks working backward from event start, plus post-event breakdown checklist.
      </p>

      {!result && (
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : "Generate Schedule"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div>
          {/* Setup section */}
          <h4 className="text-sm font-bold text-teal-700 mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
            Setup ({result.setupTasks.length} tasks)
          </h4>
          <div className="relative ml-3 mb-6">
            <div className="absolute left-0 top-2 bottom-2 w-px bg-teal-200" />
            <div className="space-y-3">
              {result.setupTasks.map((t) => (
                <div key={t.id} className="relative flex gap-4 pl-6">
                  <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-teal-500 bg-white" />
                  <div className="min-w-[80px]">
                    <span className="text-sm font-bold text-teal-700">{t.time}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-warm-900">{t.task}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-warm-400">{t.duration}</span>
                      <input
                        type="text"
                        value={assignees[t.id] || ""}
                        onChange={(e) => updateAssignee(t.id, e.target.value)}
                        placeholder="Assign to..."
                        className="text-xs rounded border border-warm-200 px-2 py-0.5 w-32 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown section */}
          <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
            Breakdown ({result.breakdownTasks.length} tasks)
          </h4>
          <div className="space-y-2">
            {result.breakdownTasks.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-warm-100 px-3 py-2.5 hover:border-warm-200 transition">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-warm-900">{t.task}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-warm-400">{t.duration}</span>
                    <input
                      type="text"
                      value={assignees[t.id] || ""}
                      onChange={(e) => updateAssignee(t.id, e.target.value)}
                      placeholder="Assign to..."
                      className="text-xs rounded border border-warm-200 px-2 py-0.5 w-32 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {loading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// 8. AI Content Generator Tool
// ---------------------------------------------------------------------------

type ContentTab =
  | "facebook"
  | "instagram"
  | "website"
  | "email"
  | "bulletin"
  | "push"
  | "sms"
  | "volunteer"
  | "sponsor"
  | "press";

const CONTENT_TAB_LABELS: Record<ContentTab, string> = {
  facebook: "Facebook Posts",
  instagram: "Instagram Captions",
  website: "Website Blurb",
  email: "Email Newsletter",
  bulletin: "Bulletin Insert",
  push: "Push Notifications",
  sms: "SMS Reminders",
  volunteer: "Volunteer Email",
  sponsor: "Sponsor Letter",
  press: "Press Release",
};

const CONTENT_TAB_ICONS: Record<ContentTab, string> = {
  facebook: "📘",
  instagram: "📸",
  website: "🌐",
  email: "📧",
  bulletin: "📄",
  push: "🔔",
  sms: "💬",
  volunteer: "🤝",
  sponsor: "💼",
  press: "📰",
};

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
}

function ContentTool({ eventId }: { eventId: string }) {
  const [result, setResult] = useState<ContentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ContentTab>("facebook");
  const [copiedLabel, setCopiedLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await generateContent({ eventId });
      setResult(r);
      setActiveTab("facebook");
    } catch (err: any) {
      setError(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(""), 2000);
  };

  if (!result) {
    return (
      <CollapsibleSection
        title="AI Content Generator"
        icon={<SparkleIcon />}
        defaultOpen
      >
        <p className="text-sm text-warm-600 mb-4">
          Generate a complete communications kit — social media posts, emails, SMS, bulletin insert, press release, and more — all tailored to this event.
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          <SparkleIcon />
          {loading ? "Generating..." : "Generate Content Kit"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </CollapsibleSection>
    );
  }

  // Helper: render a content card for the grid
  const cardPreviews: { tab: ContentTab; preview: string }[] = [
    { tab: "facebook", preview: result.facebookPosts.map((p) => p.label).join(" • ") },
    { tab: "instagram", preview: result.instagramCaptions.map((c) => c.label).join(" • ") },
    { tab: "website", preview: result.websiteAnnouncement.slice(0, 100) + "..." },
    { tab: "email", preview: result.emailNewsletter.subject },
    { tab: "bulletin", preview: result.bulletinInsert.slice(0, 80) + "..." },
    { tab: "push", preview: result.pushNotifications[0].slice(0, 80) + "..." },
    { tab: "sms", preview: result.smsReminders[0].slice(0, 80) + "..." },
    { tab: "volunteer", preview: result.volunteerEmail.subject },
    { tab: "sponsor", preview: result.sponsorRequestLetter.slice(0, 80) + "..." },
    { tab: "press", preview: result.pressRelease.slice(0, 80) + "..." },
  ];

  // Helper: render tab content
  const renderTabContent = (tab: ContentTab) => {
    switch (tab) {
      case "facebook":
        return (
          <div className="space-y-6">
            {result.facebookPosts.map((post, i) => (
              <div key={i} className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold text-teal-700">{post.label}</h5>
                  <button
                    onClick={() => handleCopy(post.body, `fb-${i}`)}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    {copiedLabel === `fb-${i}` ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{post.body}</pre>
                <div className="mt-3 rounded-md bg-blue-50 border border-blue-100 px-3 py-2">
                  <span className="text-xs font-semibold text-blue-600">🖼 Suggested Image:</span>
                  <p className="mt-0.5 text-xs text-blue-700">{post.imageDescription}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case "instagram":
        return (
          <div className="space-y-6">
            {result.instagramCaptions.map((cap, i) => (
              <div key={i} className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold text-teal-700">{cap.label}</h5>
                  <button
                    onClick={() => handleCopy(`${cap.body}\n\n${cap.hashtags}`, `ig-${i}`)}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    {copiedLabel === `ig-${i}` ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{cap.body}</pre>
                <div className="mt-3 rounded-md bg-purple-50 border border-purple-100 px-3 py-2">
                  <span className="text-xs font-semibold text-purple-600">🏷 Hashtags:</span>
                  <p className="mt-0.5 text-xs text-purple-700">{cap.hashtags}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case "website":
        return (
          <div className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-teal-700">Website Announcement</h5>
              <button
                onClick={() => handleCopy(result.websiteAnnouncement, "website")}
                className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                {copiedLabel === "website" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{result.websiteAnnouncement}</pre>
          </div>
        );

      case "email":
        return (
          <div className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-sm font-bold text-teal-700">Email Newsletter</h5>
                <p className="text-xs text-warm-500 mt-0.5">Subject: {result.emailNewsletter.subject}</p>
              </div>
              <button
                onClick={() => handleCopy(`Subject: ${result.emailNewsletter.subject}\n\n${result.emailNewsletter.body}`, "email")}
                className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                {copiedLabel === "email" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{result.emailNewsletter.body}</pre>
          </div>
        );

      case "bulletin":
        return (
          <div className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-teal-700">Bulletin Insert</h5>
              <button
                onClick={() => handleCopy(result.bulletinInsert, "bulletin")}
                className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                {copiedLabel === "bulletin" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{result.bulletinInsert}</pre>
          </div>
        );

      case "push":
        return (
          <div className="space-y-4">
            {result.pushNotifications.map((text, i) => (
              <div key={i} className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-bold text-teal-700">
                    {i === 0 ? "Initial Notification" : "Reminder Notification"}
                  </h5>
                  <button
                    onClick={() => handleCopy(text, `push-${i}`)}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    {copiedLabel === `push-${i}` ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{text}</pre>
                <p className="mt-1 text-xs text-warm-400">{text.length} characters (limit: 140)</p>
              </div>
            ))}
          </div>
        );

      case "sms":
        return (
          <div className="space-y-4">
            {result.smsReminders.map((text, i) => (
              <div key={i} className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-bold text-teal-700">
                    {i === 0 ? "Initial SMS" : "Reminder SMS"}
                  </h5>
                  <button
                    onClick={() => handleCopy(text, `sms-${i}`)}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    {copiedLabel === `sms-${i}` ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{text}</pre>
                <p className="mt-1 text-xs text-warm-400">{text.length} characters (limit: 160)</p>
              </div>
            ))}
          </div>
        );

      case "volunteer":
        return (
          <div className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-sm font-bold text-teal-700">Volunteer Recruitment Email</h5>
                <p className="text-xs text-warm-500 mt-0.5">Subject: {result.volunteerEmail.subject}</p>
              </div>
              <button
                onClick={() => handleCopy(`Subject: ${result.volunteerEmail.subject}\n\n${result.volunteerEmail.body}`, "volunteer")}
                className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                {copiedLabel === "volunteer" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{result.volunteerEmail.body}</pre>
          </div>
        );

      case "sponsor":
        return (
          <div className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-teal-700">Sponsor Request Letter</h5>
              <button
                onClick={() => handleCopy(result.sponsorRequestLetter, "sponsor")}
                className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                {copiedLabel === "sponsor" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{result.sponsorRequestLetter}</pre>
          </div>
        );

      case "press":
        return (
          <div className="rounded-lg border border-warm-100 bg-warm-50/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-teal-700">Press Release</h5>
              <button
                onClick={() => handleCopy(result.pressRelease, "press")}
                className="inline-flex items-center gap-1 rounded-md border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                {copiedLabel === "press" ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-warm-700 font-sans leading-relaxed">{result.pressRelease}</pre>
          </div>
        );

      default:
        return null;
    }
  };

  const tabs: ContentTab[] = [
    "facebook", "instagram", "website", "email", "bulletin",
    "push", "sms", "volunteer", "sponsor", "press",
  ];

  return (
    <CollapsibleSection
      title="AI Content Generator"
      icon={<SparkleIcon />}
      defaultOpen
    >
      <p className="text-sm text-warm-600 mb-4">
        Complete communications kit — social posts, emails, SMS, bulletin, press release, and more. Click any card to view details and copy.
      </p>

      <button
        onClick={load}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50 mb-5"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
        {loading ? "Regenerating..." : "Regenerate Kit"}
      </button>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {/* Card grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
        {cardPreviews.map(({ tab, preview }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl border p-4 text-left transition hover:shadow-md ${
              activeTab === tab
                ? "border-teal-300 bg-teal-50 ring-1 ring-teal-200"
                : "border-warm-200/60 bg-white hover:border-teal-200"
            }`}
          >
            <div className="text-2xl mb-1">{CONTENT_TAB_ICONS[tab]}</div>
            <h5 className="text-sm font-bold text-warm-900">{CONTENT_TAB_LABELS[tab]}</h5>
            <p className="mt-1 text-xs text-warm-500 line-clamp-2">{preview}</p>
          </button>
        ))}
      </div>

      {/* Detail view */}
      <div className="rounded-xl border border-warm-200/60 bg-white">
        {/* Tab bar — horizontal scroll on mobile */}
        <div className="flex overflow-x-auto border-b border-warm-100 px-2 py-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeTab === tab
                  ? "bg-teal-600 text-white"
                  : "text-warm-600 hover:bg-warm-50 hover:text-warm-900"
              }`}
            >
              {CONTENT_TAB_ICONS[tab]} {CONTENT_TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          <h4 className="text-base font-bold text-warm-900 mb-3">
            {CONTENT_TAB_ICONS[activeTab]} {CONTENT_TAB_LABELS[activeTab]}
          </h4>
          {renderTabContent(activeTab)}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// Main export — renders all eight tools
// ---------------------------------------------------------------------------

export function AiToolsPanel({ eventId }: { eventId: string }) {
  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <SparkleIcon />
        <h3 className="text-lg font-bold text-teal-700">AI Tools</h3>
      </div>
      <TimelineTool eventId={eventId} />
      <ChecklistTool eventId={eventId} />
      <BudgetTool eventId={eventId} />
      <VolunteerTool eventId={eventId} />
      <ShoppingListTool eventId={eventId} />
      <RiskTool eventId={eventId} />
      <SetupBreakdownTool eventId={eventId} />
      <PromoFollowUpPanel eventId={eventId} />
    </div>
  );
}
