import type { MemoryCategory, ExpenseCategory } from "~/types";

// ---------------------------------------------------------------------------
// Memory categories
// ---------------------------------------------------------------------------

export const MEMORY_CATEGORY_OPTIONS: {
  value: MemoryCategory;
  label: string;
  icon: string;
}[] = [
  { value: "ACCOMMODATION", label: "Accommodation", icon: "🏨" },
  { value: "FOOD", label: "Food & Dining", icon: "🍽️" },
  { value: "ACTIVITY", label: "Activity", icon: "🎯" },
  { value: "TRANSPORT", label: "Transport", icon: "🚗" },
  { value: "REFLECTION", label: "Reflection", icon: "💭" },
  { value: "OTHER", label: "Other", icon: "📝" },
];

export const MEMORY_CATEGORY_ICONS: Record<MemoryCategory, string> = {
  ACCOMMODATION: "🏨",
  FOOD: "🍽️",
  ACTIVITY: "🎯",
  TRANSPORT: "🚗",
  REFLECTION: "💭",
  OTHER: "📝",
};

export const MEMORY_CATEGORY_LABELS: Record<MemoryCategory, string> = {
  ACCOMMODATION: "Accommodation",
  FOOD: "Food & Dining",
  ACTIVITY: "Activity",
  TRANSPORT: "Transport",
  REFLECTION: "Reflection",
  OTHER: "Other",
};

// ---------------------------------------------------------------------------
// Expense categories
// ---------------------------------------------------------------------------

export const EXPENSE_CATEGORY_OPTIONS: {
  value: ExpenseCategory;
  label: string;
  icon: string;
}[] = [
  { value: "ACCOMMODATION", label: "Accommodation", icon: "🏨" },
  { value: "FOOD", label: "Food & Dining", icon: "🍽️" },
  { value: "TRANSPORT", label: "Transport", icon: "🚗" },
  { value: "ACTIVITY", label: "Activity", icon: "🎯" },
  { value: "SHOPPING", label: "Shopping", icon: "🛍️" },
  { value: "OTHER", label: "Other", icon: "💳" },
];

export const EXPENSE_CATEGORY_INFO: Record<
  ExpenseCategory,
  { label: string; icon: string }
> = {
  ACCOMMODATION: { label: "Accommodation", icon: "🏨" },
  FOOD: { label: "Food & Dining", icon: "🍽️" },
  TRANSPORT: { label: "Transport", icon: "🚗" },
  ACTIVITY: { label: "Activity", icon: "🎯" },
  SHOPPING: { label: "Shopping", icon: "🛍️" },
  OTHER: { label: "Other", icon: "💳" },
};
