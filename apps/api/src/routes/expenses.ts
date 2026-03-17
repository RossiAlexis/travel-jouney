import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@repo/db";
import { authMiddleware } from "../middleware/auth.js";
import type { TokenPayload } from "../lib/jwt.js";

type Variables = { user: TokenPayload };

const expenses = new Hono<{ Variables: Variables }>();

expenses.use("*", authMiddleware);

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  category: z.enum([
    "ACCOMMODATION",
    "FOOD",
    "TRANSPORT",
    "ACTIVITIES",
    "SHOPPING",
    "OTHER",
  ]),
  description: z.string().min(1).max(500),
  date: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date",
  }),
  memoryId: z.string().optional(),
});

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

expenses.post("/", zValidator("json", createExpenseSchema), async (c) => {
  const user = c.get("user");
  const { tripId } = c.req.param();

  const trip = await db.trip.findFirst({
    where: { id: tripId, userId: user.id },
  });
  if (!trip) return c.json({ error: "Trip not found" }, 404);

  const body = c.req.valid("json");

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
