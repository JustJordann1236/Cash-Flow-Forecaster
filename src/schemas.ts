import { z } from "zod";

export const cycleSchema = z.enum(["one-off", "weekly", "monthly", "annual"]);
export const itemTypeSchema = z.enum(["income", "expense"]);

const isoDateSchema = z.string().regex(/^\d{4}- \d{2}- \d{2}$/, "Expected date format: YYYY-MM-DD"); 

export const newItemSchema = z.object({
    label: z.string().min(1, "Label is required").max(100),
    type: itemTypeSchema,
    amount: z.number().positive("Amount must be greater than 0"),
    cycle: cycleSchema,
    startDate: isoDateSchema,
});

export const forecastQuerySchema = z.object({
    startingBalance: z.coerce.number(),
    startDate: isoDateSchema.optional(),
    days: z.coerce.number().int().positive().max(366).optional(),
});
