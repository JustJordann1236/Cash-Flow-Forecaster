"use strict";
// Frontend logic. Talks to the Fastify API for everything - the backend
// is the source of truth, this file only renders what it gets back.
const API_BASE = ""; // same origin - Fastify serves both the API and this file
// --- DOM references -------------------------------------------------
const itemForm = document.getElementById("item-form");
const labelInput = document.getElementById("label");
const typeSelect = document.getElementById("type");
const amountInput = document.getElementById("amount");
const cycleSelect = document.getElementById("cycle");
const startDateInput = document.getElementById("startDate");
const itemListEl = document.getElementById("item-list");
const startingBalanceInput = document.getElementById("startingBalance");
const forecastDaysInput = document.getElementById("forecastDays");
const lowestCalloutEl = document.getElementById("lowest-callout");
const chartEl = document.getElementById("forecast-chart");
const tableBodyEl = document.querySelector("#forecast-table tbody");
startDateInput.valueAsDate = new Date();
async function fetchItems() {
    const res = await fetch(`${API_BASE}/items`);
    if (!res.ok)
        throw new Error("Failed to load items");
    return res.json();
}
async function createItem(input) {
    const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => { });
        throw new Error(body.error ? JSON.stringify(body.error) : "Failed to add item");
    }
}
async function removeItem(id) {
    const res = await fetch(`${API_BASE}/items/${id}`, { method: "DELETE" });
    if (!res.ok)
        throw new Error("Failed to delete item");
}
async function fetchForecast(startingBalance, days) {
    const params = new URLSearchParams({
        startingBalance: String(startingBalance),
        days: String(days),
    });
    const res = await fetch(`${API_BASE}/forecast?${params.toString()}`);
    if (!res.ok)
        throw new Error("Failed to load forecast");
    return res.json();
}
function renderItems(items) {
    itemListEl.innerHTML = "";
    if (items.length === 0) {
        itemListEl.innerHTML = `<li class="empty-state">No items yet - add income or a recurring bill to get started.</li>`;
        return;
    }
    for (const item of items) {
        const li = document.createElement("li");
        li.className = "item-row";
        li.innerHTML = `
      <span>
        <strong>${escapeHtml(item.label)}</strong>
        <span class="meta"> · ${item.cycle} · from ${item.startDate}</span>
      </span>
      <span>
        <span class="amount ${item.type}">${item.type === "income" ? "+" : "-"}RM${item.amount.toFixed(2)}</span>
        <button data-id="${item.id}" title="Delete">✕</button>
      </span>
    `;
        itemListEl.appendChild(li);
    }
    itemListEl.querySelectorAll("button[data-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            await removeItem(id);
            await refreshAll();
        });
    });
}
function renderForecast(result) {
    lowestCalloutEl.textContent =
        `Lowest projected balance: RM${result.lowestBalance.balance.toFixed(2)} on ${result.lowestBalance.date}`;
    // Chart: one bar per day, height scaled to the range of balances seen.
    chartEl.innerHTML = "";
    const balances = result.days.map((d) => d.balance);
    const max = Math.max(...balances, 0);
    const min = Math.min(...balances, 0);
    const range = max - min || 1;
    for (const day of result.days) {
        const bar = document.createElement("div");
        const heightPct = Math.max(4, ((day.balance - min) / range) * 100);
        bar.className = "bar" + (day.date === result.lowestBalance.date ? " low" : "");
        bar.style.height = `${heightPct}%`;
        bar.title = `${day.date}: RM${day.balance.toFixed(2)}`;
        chartEl.appendChild(bar);
    }
    // Table: full day-by-day breakdown.
    tableBodyEl.innerHTML = "";
    for (const day of result.days) {
        const tr = document.createElement("tr");
        if (day.date === result.lowestBalance.date)
            tr.className = "low-day";
        const eventsText = day.events.length
            ? day.events.map((e) => `${e.label} (${e.type === "income" ? "+" : "-"}RM${e.amount.toFixed(2)})`).join(", ")
            : "—";
        tr.innerHTML = `
      <td>${day.date}</td>
      <td>${escapeHtml(eventsText)}</td>
      <td>RM${day.balance.toFixed(2)}</td>
    `;
        tableBodyEl.appendChild(tr);
    }
}
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
async function refreshAll() {
    const [items, forecast] = await Promise.all([
        fetchItems(),
        fetchForecast(Number(startingBalanceInput.value) || 0, Number(forecastDaysInput.value) || 30),
    ]);
    renderItems(items);
    renderForecast(forecast);
}
itemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        await createItem({
            label: labelInput.value.trim(),
            type: typeSelect.value,
            amount: Number(amountInput.value),
            cycle: cycleSelect.value,
            startDate: startDateInput.value,
        });
        itemForm.reset();
        startDateInput.valueAsDate = new Date();
        cycleSelect.value = "monthly";
        await refreshAll();
    }
    catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong");
    }
});
startingBalanceInput.addEventListener("change", refreshAll);
forecastDaysInput.addEventListener("change", refreshAll);
refreshAll().catch((err) => {
    console.error(err);
    lowestCalloutEl.textContent = "Could not load forecast - is the server running?";
});
