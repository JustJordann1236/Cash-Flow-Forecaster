export type Cycle = "one-off" | "weekly" | "monthly" | "annual";
export type ItemType = "income" | "expense";

export interface CashFlowItem {
    id: string;
    label: string;
    type: ItemType;
    amount: number;
    cycle: Cycle;   
    startDate: string;
}

export type NewCashFlowItem = Omit<CashFlowItem, "id">;

export interface ForecastEvent {
    label: string;
    type: ItemType;
    amount: number;
}

export interface ForecastDay {
    date: string;
    balance: number;
    events: ForecastEvent[];
}

export interface ForecastResult {
    startingBalance: number;
    endingBalance: number;
    days: ForecastDay[];
    lowestBalance: {
        date: string;
        balance: number;
    }
}