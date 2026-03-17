import { Hono } from "hono";
import { db } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
import type { TokenPayload } from "../lib/jwt.js";

type Variables = { user: TokenPayload };

const expenses = new Hono<{ Variables: Variables }>();

expenses.use("*", authMiddleware);

expenses.get("/", async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });
  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const data = await db.expense.findMany({
    where: { tripId, userId: user.id },
    orderBy: { date: "desc" },
  });

  // Compute totals by category
  const totals: Record<string, number> = {};
  for (const expense of data) {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
  }

  return c.json({ expenses: data, totals });
});

expenses.post("/", async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });
  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const body = await c.req.json<{
    amount: number;
    currency: string;
    category: string;
    description: string;
    date: string;
    memoryId?: string;
  }>();

  if (!body.amount || !body.currency || !body.category || !body.description || !body.date) {
    return c.json(
      { error: "amount, currency, category, description, and date are required" },
      400,
    );
  }

  const expense = await db.expense.create({
    data: {
      tripId,
      userId: user.id,
      amount: body.amount,
      currency: body.currency,
      category: body.category as never,
      description: body.description,
      date: new Date(body.date),
      memoryId: body.memoryId,
    },
  });

  return c.json(expense, 201);
});

expenses.delete("/:expenseId", async (c) => {
  const user = c.get("user");
  const { tripId, expenseId } = c.req.param();

  const existing = await db.expense.findFirst({
    where: { id: expenseId, tripId, userId: user.id },
  });
  if (!existing) return c.json({ error: "Expense not found" }, 404);

  await db.expense.delete({ where: { id: expenseId } });
  return c.json({ success: true });
});

export { expenses };
