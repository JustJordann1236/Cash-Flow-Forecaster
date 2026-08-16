import type { FastifyInstance } from "fastify";
import { getItems, addItem, deleteItem } from "./store.js";
import { buildForecast } from "./forecast.js";
import { newItemSchema, forecastQuerySchema } from "./schemas.js";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10); 
}

export async function routes(app: FastifyInstance) {
    app.get("/items", async () => {
        return getItems();
    });

    app.post("/items", async (req, reply) => {
        const parsed = newItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() }); 
        }
        const item = await addItem(parsed.data);
        return reply.status(201).send(item);
    });

    app.delete("/items/:id", async (req, reply) => {
        const { id } = req.params as { id: string };
        const removed = await deleteItem(id);
        if (!removed) {
            return reply.status(404).send({ error: "Item not found" });
        }
        return reply.status(204).send();
    });

    app.get("/forecast", async (req, reply) => {
        const parsed = forecastQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() });
        }
        const { startingDate, months } = parsed.data;
        const items = await getItems();
        const result = buildForecast(items, startingBalance, startDate ?? todayISO(), days ?? 30);
        return result;
    });
}
