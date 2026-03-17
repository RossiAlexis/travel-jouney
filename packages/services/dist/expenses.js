import { db } from "@repo/db";
import { ServiceError } from "./api.js";
export async function listExpenses(tripId, userId) {
    const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip)
        throw new ServiceError(404, "Trip not found");
    const expenses = await db.expense.findMany({
        where: { tripId, userId },
        orderBy: { date: "desc" },
    });
    const totals = expenses.reduce((acc, e) => {
        const cat = e.category ?? "other";
        acc[cat] = (acc[cat] ?? 0) + e.amount;
        return acc;
    }, {});
    return { expenses, totals };
}
export async function createExpense(tripId, userId, data) {
    const trip = await db.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip)
        throw new ServiceError(404, "Trip not found");
    return db.expense.create({
        data: {
            tripId,
            userId,
            description: data.description,
            amount: data.amount,
            currency: data.currency,
            date: new Date(data.date),
            category: (data.category ?? "OTHER"),
            memoryId: data.memoryId ?? null,
        },
    });
}
export async function deleteExpense(expenseId, tripId, userId) {
    const expense = await db.expense.findFirst({ where: { id: expenseId, tripId, userId } });
    if (!expense)
        throw new ServiceError(404, "Expense not found");
    return db.expense.delete({ where: { id: expenseId } });
}
