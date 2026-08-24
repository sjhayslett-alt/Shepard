import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { getAuthState, clearSessionCookie, logoutFn, type SessionUser } from "~/auth";
import {
  getBudgets,
  saveBudget,
  deleteBudget,
  autoAllocate,
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
  type Budget,
  type BudgetAllocation,
  type BudgetCategory,
} from "~/budgets";

export const Route = createFileRoute("/dashboard/budget")({
  beforeLoad: async () => {
    const { user } = await getAuthState();
    if (!user) throw redirect({ to: "/login" });
    return { user };
  },
  component: BudgetPage,
});

function BudgetPage() {
  const { user } = Route.useLoaderData() as { user: SessionUser };
  const router = useRouter();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Budget editor state
  const [budgetName, setBudgetName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Saved budgets list
  const [savedMsg, setSavedMsg] = useState("");

  const fetchBudgets = async () => {
    try {
      const data = await getBudgets();
      setBudgets(data);
    } catch (err: any) {
      // ignore on first load
    }
  };

  useEffect(() => {
    fetchBudgets();
    setLoading(false);
  }, []);

  // Auto-allocate when total changes
  const handleTotalChange = (value: string) => {
    setTotalAmount(value);
    const num = parseFloat(value);
    if (num > 0) {
      setAllocations(autoAllocate(num));
    } else {
      setAllocations([]);
    }
    setSaveSuccess(false);
  };

  // Update a single line item
  const handleAllocationChange = (category: BudgetCategory, amountStr: string) => {
    const amount = parseFloat(amountStr) || 0;
    const total = parseFloat(totalAmount) || 0;

    setAllocations((prev) => {
      const updated = prev.map((a) =>
        a.category === category
          ? { ...a, amount, percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0 }
          : a,
      );
      return updated;
    });
    setSaveSuccess(false);
  };

  // Compute summary
  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
  const totalNum = parseFloat(totalAmount) || 0;
  const remaining = Math.round((totalNum - allocatedTotal) * 100) / 100;
  const pctUsed = totalNum > 0 ? Math.min(100, Math.round((allocatedTotal / totalNum) * 100)) : 0;

  const handleAutoAllocate = () => {
    const num = parseFloat(totalAmount);
    if (num > 0) {
      setAllocations(autoAllocate(num));
    }
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!budgetName.trim()) return;
    const total = parseFloat(totalAmount);
    if (!total || total <= 0) return;

    setSaving(true);
    setSavedMsg("");
    try {
      const result = await saveBudget({
        name: budgetName,
        total_amount: total,
        allocations,
      });
      if (result.success) {
        setSaveSuccess(true);
        setSavedMsg("Budget saved!");
        await fetchBudgets();
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch (err: any) {
      setSavedMsg("Error: " + (err.message || "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (b: Budget) => {
    if (!confirm(`Delete "${b.name}"?`)) return;
    try {
      await deleteBudget({ budgetId: b.id });
      await fetchBudgets();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleLogout = async () => {
    await logoutFn();
    clearSessionCookie();
    router.navigate({ to: "/" });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const barColor = pctUsed >= 100 ? "bg-red-500" : pctUsed >= 80 ? "bg-amber-500" : "bg-teal-500";

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-warm-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="flex items-center gap-2 text-teal-700">
              <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5" />
                <path d="M20 8c-4 4-8 16-4 22 2 3 6 3 8 0 4-6 0-18-4-22z" fill="currentColor" opacity="0.7" />
                <path d="M20 8v8M16 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-xl font-bold tracking-tight">Shepherd</span>
            </a>
            <span className="hidden text-sm text-warm-700 sm:inline">/</span>
            <span className="hidden text-sm font-semibold text-warm-900 sm:inline">Budget</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-warm-200 px-4 py-2 text-sm font-semibold text-warm-700 transition hover:bg-warm-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-warm-900">Budget Planner</h1>
          <p className="mt-1 text-warm-700">{user.churchName}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Budget editor */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-warm-200/60 bg-white p-6">
              <h2 className="text-lg font-bold text-warm-900 mb-4">Create Budget</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-warm-800 mb-1">
                    Budget Name
                  </label>
                  <input
                    type="text"
                    value={budgetName}
                    onChange={(e) => {
                      setBudgetName(e.target.value);
                      setSaveSuccess(false);
                    }}
                    placeholder='e.g., "Easter Service 2026"'
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-warm-800 mb-1">
                    Total Budget ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                </div>
              </div>

              {totalNum > 0 && (
                <>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={handleAutoAllocate}
                      className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
                    >
                      AI Auto-Allocate
                    </button>
                    <span className="text-xs text-warm-500">
                      Automatically splits your budget across 8 categories
                    </span>
                  </div>

                  {/* Allocation table */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-warm-200 text-left">
                          <th className="pb-2 font-semibold text-warm-700">Category</th>
                          <th className="pb-2 font-semibold text-warm-700 text-right">Amount</th>
                          <th className="pb-2 font-semibold text-warm-700 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map((a) => (
                          <tr key={a.category} className="border-b border-warm-100">
                            <td className="py-2 text-warm-800">
                              {BUDGET_CATEGORY_LABELS[a.category]}
                            </td>
                            <td className="py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={a.amount}
                                onChange={(e) =>
                                  handleAllocationChange(a.category, e.target.value)
                                }
                                className="w-28 rounded border border-warm-200 bg-white px-2 py-1 text-right text-sm text-warm-800 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                              />
                            </td>
                            <td className="py-2 text-right text-warm-600 tabular-nums">
                              {a.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary bar */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-warm-800">Allocated</span>
                      <span className="text-warm-700 tabular-nums">
                        {formatCurrency(allocatedTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-warm-800">Remaining</span>
                      <span
                        className={`tabular-nums font-semibold ${
                          remaining < 0 ? "text-red-600" : "text-teal-700"
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-warm-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${pctUsed}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-warm-500">
                      <span>{pctUsed}% used</span>
                      <span>Total: {formatCurrency(totalNum)}</span>
                    </div>
                  </div>

                  {/* Save */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || !budgetName.trim() || totalNum <= 0}
                      className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Budget"}
                    </button>
                    {saveSuccess && (
                      <span className="text-sm font-semibold text-teal-700">✓ Saved</span>
                    )}
                    {savedMsg && !saveSuccess && (
                      <span className="text-sm text-red-600">{savedMsg}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Saved budgets sidebar */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-warm-200/60 bg-white p-5">
              <h3 className="text-lg font-bold text-warm-900 mb-4">Saved Budgets</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-teal-200 border-t-teal-600" />
                </div>
              ) : budgets.length === 0 ? (
                <p className="text-sm text-warm-500 py-8 text-center">
                  No saved budgets yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {budgets.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-warm-100 p-3 hover:border-teal-200 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-warm-900">{b.name}</h4>
                          <p className="text-xs text-warm-500 mt-0.5">
                            {formatCurrency(Number(b.total_amount))} total
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteBudget(b)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                      {/* Mini bar */}
                      {b.allocations && b.allocations.length > 0 && (
                        <div className="mt-2 flex h-1.5 w-full rounded-full overflow-hidden">
                          {b.allocations.map((a, i) => {
                            const colors = [
                              "bg-teal-500", "bg-amber-400", "bg-indigo-400", "bg-pink-400",
                              "bg-emerald-400", "bg-cyan-400", "bg-purple-400", "bg-gray-400",
                            ];
                            return (
                              <div
                                key={a.category}
                                className={`${colors[i % colors.length]}`}
                                style={{ width: `${a.percentage}%` }}
                                title={`${BUDGET_CATEGORY_LABELS[a.category]}: ${formatCurrency(a.amount)}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
