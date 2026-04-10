const OPERATOR_PRECEDENCE: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
};

const normalizeExpression = (expression: string): string =>
    expression
        .replace(/\s+/g, "")
        .replace(/,/g, ".")
        .replace(/[xX×]/g, "*")
        .replace(/[÷]/g, "/")
        .replace(/[−]/g, "-");

const isOperator = (token: string): boolean => ["+", "-", "*", "/"].includes(token);

const formatResult = (value: number): string => {
    if (!Number.isFinite(value)) {
        return "0";
    }

    return value.toFixed(6).replace(/\.?0+$/, "");
};

const validateCharacters = (expression: string): boolean => /^[0-9+\-*/%.]*$/.test(expression);

const trimIncompleteTail = (expression: string): string => {
    let trimmed = expression;

    while (trimmed && (isOperator(trimmed.slice(-1)) || trimmed.endsWith("."))) {
        trimmed = trimmed.slice(0, -1);
    }

    if (trimmed === "-") {
        return "";
    }

    return trimmed;
};

const evaluateResolvedExpression = (expression: string): number => {
    const tokens: string[] = [];
    let current = "";

    for (let index = 0; index < expression.length; index += 1) {
        const char = expression[index];

        if (/[0-9.]/.test(char)) {
            current += char;
            continue;
        }

        if (char === "%") {
            if (current === "" || current === "-") {
                throw new Error("invalid");
            }

            tokens.push(current, "%");
            current = "";
            continue;
        }

        if (char === "-" && current === "" && (tokens.length === 0 || isOperator(tokens[tokens.length - 1]))) {
            current += char;
            continue;
        }

        if (isOperator(char)) {
            if (current === "" || current === "-") {
                throw new Error("invalid");
            }

            tokens.push(current, char);
            current = "";
            continue;
        }

        throw new Error("invalid");
    }

    if (current === "" || current === "-") {
        throw new Error("invalid");
    }

    tokens.push(current);

    const values: number[] = [];
    const operators: string[] = [];

    const reduce = () => {
        const operator = operators.pop();
        const right = values.pop();
        const left = values.pop();

        if (!operator || left === undefined || right === undefined) {
            throw new Error("invalid");
        }

        if (operator === "/" && right === 0) {
            throw new Error("divide-by-zero");
        }

        switch (operator) {
            case "+":
                values.push(left + right);
                break;
            case "-":
                values.push(left - right);
                break;
            case "*":
                values.push(left * right);
                break;
            case "/":
                values.push(left / right);
                break;
            default:
                throw new Error("invalid");
        }
    };

    const resolvePercentValue = (rawValue: number): number => {
        const operator = operators[operators.length - 1];
        const base = values[values.length - 1];

        if ((operator === "+" || operator === "-") && base !== undefined) {
            return (base * rawValue) / 100;
        }

        return rawValue / 100;
    };

    tokens.forEach((token) => {
        if (token === "%") {
            const currentValue = values.pop();
            if (currentValue === undefined) {
                throw new Error("invalid");
            }

            values.push(resolvePercentValue(currentValue));
            return;
        }

        if (isOperator(token)) {
            while (
                operators.length > 0 &&
                OPERATOR_PRECEDENCE[operators[operators.length - 1]] >= OPERATOR_PRECEDENCE[token]
            ) {
                reduce();
            }

            operators.push(token);
            return;
        }

        const value = Number(token);
        if (!Number.isFinite(value)) {
            throw new Error("invalid");
        }

        values.push(value);
    });

    while (operators.length > 0) {
        reduce();
    }

    const value = values[0];
    if (!Number.isFinite(value)) {
        throw new Error("invalid");
    }

    return value;
};

export type CalculatorResult = {
    status: "empty" | "pending" | "resolved" | "invalid";
    value: number;
    display: string;
    error?: string;
};

export const evaluateCalculatorExpression = (expression: string): CalculatorResult => {
    const normalized = normalizeExpression(expression);

    if (!normalized) {
        return { status: "empty", value: 0, display: "0" };
    }

    if (!validateCharacters(normalized)) {
        return { status: "invalid", value: 0, display: "0", error: "character" };
    }

    const hasPendingTail = isOperator(normalized.slice(-1)) || normalized.endsWith(".") || normalized === "-";
    const candidate = hasPendingTail ? trimIncompleteTail(normalized) : normalized;

    if (!candidate) {
        return { status: hasPendingTail ? "pending" : "empty", value: 0, display: "0" };
    }

    try {
        const value = evaluateResolvedExpression(candidate);
        return {
            status: hasPendingTail ? "pending" : "resolved",
            value,
            display: formatResult(value),
        };
    } catch (error: any) {
        return {
            status: "invalid",
            value: 0,
            display: "0",
            error: error?.message || "invalid",
        };
    }
};

export const appendCalculatorToken = (expression: string, token: string): string => {
    const normalizedExpression = expression ?? "";
    const normalizedToken = token === "×" ? "*" : token === "÷" ? "/" : token;

    if (!normalizedExpression && ["+", "*", "/", "%"].includes(normalizedToken)) {
        return normalizedExpression;
    }

    if (normalizedToken === ".") {
        const lastNumber = normalizedExpression.split(/[+\-*/]/).pop() ?? "";
        if (lastNumber.includes(".")) {
            return normalizedExpression;
        }
    }

    if (normalizedToken === "%") {
        const lastChar = normalizedExpression.slice(-1);
        if (!lastChar || isOperator(lastChar) || lastChar === "%" || lastChar === ".") {
            return normalizedExpression;
        }

        return normalizedExpression + normalizedToken;
    }

    if (isOperator(normalizedToken)) {
        if (!normalizedExpression && normalizedToken !== "-") {
            return normalizedExpression;
        }

        const lastChar = normalizedExpression.slice(-1);
        if (isOperator(lastChar)) {
            if (normalizedToken === "-" && lastChar !== "-") {
                return normalizedExpression + normalizedToken;
            }

            return normalizedExpression.slice(0, -1) + normalizedToken;
        }
    }

    return normalizedExpression + normalizedToken;
};

export const normalizeCalculatorSeed = (value?: string | number | null): string => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
};

export const toggleCalculatorSign = (expression: string): string => {
    const normalizedExpression = expression ?? "";
    if (!normalizedExpression) {
        return "-";
    }

    const match = normalizedExpression.match(/(-?\d*\.?\d+)(%?)$/);
    if (!match || match.index === undefined) {
        return normalizedExpression;
    }

    const currentValue = match[1];
    const suffix = match[2] ?? "";
    const startIndex = match.index;
    const replacement = currentValue.startsWith("-") ? currentValue.slice(1) : `-${currentValue}`;

    return `${normalizedExpression.slice(0, startIndex)}${replacement}${suffix}`;
};

export const applyPercentToExpression = (expression: string): string => {
    const normalizedExpression = normalizeExpression(expression ?? "");
    const operandMatch = normalizedExpression.match(/(\d*\.?\d+)$/);

    if (!operandMatch || operandMatch.index === undefined) {
        return normalizedExpression;
    }

    const rawOperand = operandMatch[1];
    const prefix = normalizedExpression.slice(0, operandMatch.index);
    const operand = Number(rawOperand);
    if (!Number.isFinite(operand)) {
        return normalizedExpression;
    }

    const operator = prefix.slice(-1);
    let nextOperand = operand / 100;

    if ((operator === "+" || operator === "-") && prefix.length > 1) {
        const baseExpression = prefix.slice(0, -1);
        try {
            const base = evaluateResolvedExpression(trimIncompleteTail(baseExpression));
            nextOperand = (base * operand) / 100;
        } catch {
            nextOperand = operand / 100;
        }
    }

    return `${prefix}${formatResult(nextOperand)}`;
};

export const formatCalculatorExpression = (expression: string): string =>
    (expression ?? "").replace(/\*/g, "×").replace(/\//g, "÷");
