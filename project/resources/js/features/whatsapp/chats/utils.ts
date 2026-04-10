export function formatTime(input?: string | null) {
    if (!input) return "-";

    return new Date(input).toLocaleString();
}

export function initialsFromName(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
