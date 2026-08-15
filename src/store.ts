import {readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { CashFlowItem, NewCashFlowItem } from "./types.js";

const DATA_FILE = new URL("../data.json", import.meta.url); 

async function readAll(): Promise<CashFlowItem[]> { 
    try {
        const raw = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(raw) as CashFlowItem[];
    } catch (error: any) {
        if(error.code === "ENOENT") return [];
        throw error;
    }
}

async function writeAll(items: CashFlowItem[]): Promise<void> {
    await writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export async function getItems(): Promise<CashFlowItem[]> {
    return readAll();
}

export async function addItem(input: NewCashFlowItem): Promise<CashFlowItem> {
    const items = await readAll();
    const item: CashFlowItem = { id: randomUUID(), ...input };
    items.push(item);
    await writeAll(items);
    return item;
}

export async function deleteItem(id: string): Promise<boolean> {
    const items = await readAll();
    const next = items.filter((i) => i.id !== id); 
    if (next.length === items.length) return false; 
    await writeAll(next);
    return true;
} 
