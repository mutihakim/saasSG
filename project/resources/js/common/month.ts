export function shiftMonthValue(value: string, delta: number): string {
    const [yearRaw, monthRaw] = value.split("-").map(Number);
    const totalMonths = (yearRaw * 12) + (monthRaw - 1) + delta;
    const nextYear = Math.floor(totalMonths / 12);
    const nextMonth = (totalMonths % 12) + 1;

    return `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}`;
}

export function currentMonthValue(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
