import { FinanceCategoryBreakdownItem, FinanceTransaction } from "../../types";

export const buildCategoryBreakdown = ({
    transactions,
    statsMetric,
    uncategorizedLabel,
}: {
    transactions: FinanceTransaction[];
    statsMetric: "expense" | "income";
    uncategorizedLabel: string;
}): FinanceCategoryBreakdownItem[] => {
    const targetType = statsMetric === "expense" ? "pengeluaran" : "pemasukan";
    const grouped = new Map<string, { name: string; amount: number }>();

    transactions
        .filter((transaction) => transaction.type === targetType)
        .forEach((transaction) => {
            const key = transaction.category?.name || uncategorizedLabel;
            const current = grouped.get(key) || { name: key, amount: 0 };
            current.amount += Number(transaction.amount_base || 0);
            grouped.set(key, current);
        });

    return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount);
};

export const buildCategoryChartOptions = (categoryBreakdown: FinanceCategoryBreakdownItem[]): ApexCharts.ApexOptions => ({
    chart: { type: "donut", toolbar: { show: false } },
    labels: categoryBreakdown.map((item) => item.name),
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    colors: ["#ff7a6b", "#4ba3ff", "#ffbf69", "#7bd389", "#b388eb", "#4ecdc4"],
    plotOptions: { pie: { donut: { size: "72%" } } },
});
