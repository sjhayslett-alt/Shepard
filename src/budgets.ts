import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { getAuthState } from "~/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const BUDGET_CATEGORIES = [
  "decorations",
  "marketing",
  "food",
  "equipment",
  "rentals",
  "speakers_entertainment",
  "insurance",
  "miscellaneous",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  decorations: "Decorations",
  marketing: "Marketing",
  food: "Food & Beverage",
  equipment: "Equipment",
  rentals: "Rentals",
  speakers_entertainment: "Speakers / Entertainment",
  insurance: "Insurance",
  miscellaneous: "Miscellaneous",
};

export interface BudgetAllocation {
  category: BudgetCategory;
  amount: number;
  percentage: number;
}

export interface Budget {
  id: string;
  church_id: string;
  event_id: string | null;
  name: string;
  total_amount: number;
  allocations: BudgetAllocation[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// AI auto-allocation — default splits for church events
// ---------------------------------------------------------------------------

const DEFAULT_SPLITS: Record<BudgetCategory, number> = {
  decorations: 0.15,
  marketing: 0.10,
  food: 0.30,
  equipment: 0.10,
  rentals: 0.15,
  speakers_entertainment: 0.10,
  insurance: 0.05,
  miscellaneous: 0.05,
};

export function autoAllocate(totalAmount: number): BudgetAllocation[] {
  const allocations: BudgetAllocation[] = BUDGET_CATEGORIES.map((cat) => {
    const raw = totalAmount * DEFAULT_SPLITS[cat];
    const amount = Math.round(raw * 100) / 100;
    return {
      category: cat,
      amount,
      percentage: Math.round(DEFAULT_SPLITS[cat] * 10000) / 100,
    };
  });

  // Adjust rounding so total matches exactly
  const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  const diff = Math.round((totalAmount - allocated) * 100) / 100;
  if (diff !== 0) {
    allocations[allocations.length - 1].amount = Math.round(
      (allocations[allocations.length - 1].amount + diff) * 100,
    ) / 100;
  }

  return allocations;
}

// ---------------------------------------------------------------------------
// getBudgets
// ---------------------------------------------------------------------------

export const getBudgets = createServerFn({ method: "GET" })
  .handler(async () => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const rows = await sql.query(
      `SELECT * FROM budgets
       WHERE church_id = $1
       ORDER BY created_at DESC`,
      [user.churchId],
    );
    return rows as Budget[];
  });

// ---------------------------------------------------------------------------
// saveBudget
// ---------------------------------------------------------------------------

export const saveBudget = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as {
      name?: string;
      event_id?: string;
      total_amount?: number;
      allocations?: BudgetAllocation[];
    };
    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Budget name is required.";
    if (!data.total_amount || data.total_amount <= 0)
      errors.total_amount = "Total must be greater than zero.";
    if (!data.allocations || data.allocations.length === 0)
      errors.allocations = "Allocations are required.";
    return {
      name: data.name?.trim() ?? "",
      event_id: data.event_id || null,
      total_amount: data.total_amount ?? 0,
      allocations: data.allocations ?? [],
      errors,
    };
  })
  .handler(async ({ data }) => {
    if (Object.keys(data.errors).length > 0) {
      return { success: false, errors: data.errors };
    }

    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const allocationsJson = JSON.stringify(data.allocations);

    const rows = await sql.query(
      `INSERT INTO budgets (church_id, event_id, name, total_amount, allocations)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING *`,
      [
        user.churchId,
        data.event_id,
        data.name,
        data.total_amount,
        allocationsJson,
      ],
    );
    return { success: true, budget: rows[0] as Budget };
  });

// ---------------------------------------------------------------------------
// deleteBudget
// ---------------------------------------------------------------------------

export const deleteBudget = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { budgetId?: string };
    if (!data.budgetId) throw new Error("Budget ID is required");
    return { budgetId: data.budgetId };
  })
  .handler(async ({ data }) => {
    const { user } = await getAuthState();
    if (!user) throw new Error("Unauthorized");

    const result = await sql.query(
      "DELETE FROM budgets WHERE id = $1 AND church_id = $2 RETURNING id",
      [data.budgetId, user.churchId],
    );
    if (result.length === 0) throw new Error("Budget not found");
    return { success: true };
  });
