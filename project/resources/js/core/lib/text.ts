export function humanizeCode(value: string): string {
    return value
        .replace(/_/g, " ")
        .split(".")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
}
