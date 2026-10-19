import type { CashFlowItem, ForecastResult, ForecastDay, ForecastEvent } from "./types.js";

function parseISO(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00Z`);
}

function formatISO(date:Date): string {
    return date.toISOString().slice(0, 10);
}

function addDays(date: Date, n: number): Date {
    const copy = new Date(date.getTime());
    copy.setUTCDate(copy.getUTCDate() + n);
    return copy;
}

function sameDay(a: Date, b: Date): boolean {
    return a.getTime() === b.getTime();
}

function addMonthsClamped(date: Date, n: number): Date {
    const totalMonths = date.getUTCMonth() + n;
    const year = date.getUTCFullYear() + Math.floor(totalMonths / 12);
    const month = ((totalMonths % 12) + 12) % 12;

    const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = Math.min(date.getUTCDate(), lastDayOfTargetMonth);

    return new Date(Date.UTC(year, month, day));
}

export function generateOccurences (
    item: Pick<CashFlowItem, "cycle" | "startDate">,
    windowStart: Date,
    windowEnd: Date,
) : Date [] {
    const start = parseISO(item.startDate);
    const occurences: Date[] = [];

    if (item.cycle === "one-off") {
        if (start >= windowStart && start <= windowEnd) {
            occurences.push(start);
        }
    return occurences;
    }

    let n = 0;
    while (true) {
        let candiate: Date;
        if (item.cycle === "weekly") {
            candiate = addDays(start, n * 7);
        } else if (item.cycle === "monthly") {
            candiate = addMonthsClamped(start, n);
        } else {
            candiate = addMonthsClamped(start, n * 12);
        }

        if (candiate > windowEnd) {
            break;
        }
        
        if (candiate >= windowStart) {
            occurences.push(candiate);
        }
        n++;
    }
    return occurences;
}
    
export function buildForecast(
    items: CashFlowItem[],
    startingBalance: number,
    startDateStr: string,
    numDays: number 
): ForecastResult {
    const windowStart = parseISO(startDateStr);
    const windowEnd = addDays(windowStart, numDays - 1);

    type TimedEvent = ForecastEvent & { date: Date };
    const events: TimedEvent[] = [];

    for (const item of items) {
        const occurences = generateOccurences(item, windowStart, windowEnd);
        for (const date of occurences) {
            events.push({ date, label: item.label, type: item.type, amount: item.amount });
        }
    }

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = startingBalance;
    const days: ForecastDay[] = [];

    let lowest = { date: formatISO(windowStart), balance: Infinity };
    let eventIndex = 0;

    for (let cursor = windowStart; cursor <= windowEnd; cursor = addDays(cursor, 1)) {
        const todaysEvents: ForecastEvent[] = [];

        while (eventIndex < events.length && sameDay(events[eventIndex].date, cursor)) {
            const e = events[eventIndex];
            balance += e.type === "income" ? e.amount : -e.amount;
            todaysEvents.push({ label: e.label, type: e.type, amount: e.amount });
            eventIndex++;
        }

        days.push({ date: formatISO(cursor), balance, events: todaysEvents });

        if (balance < lowest.balance) {
            lowest = { date: formatISO(cursor), balance };
        }
    }

    return {
        startingBalance, 
        endingBalance: balance,
        days,
        lowestBalance: lowest,
    };
}