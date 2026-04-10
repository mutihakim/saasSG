import React, { Suspense } from "react";

const ApexChart = React.lazy(() => import("react-apexcharts"));

type LazyApexChartProps = Record<string, unknown> & {
    height?: number | string;
    className?: string;
    fallbackHeight?: number | string;
    fallbackClassName?: string;
};

export default function LazyApexChart({
    fallbackHeight,
    fallbackClassName,
    ...chartProps
}: LazyApexChartProps) {
    const height = fallbackHeight ?? chartProps.height ?? 220;
    const className = fallbackClassName ?? (typeof chartProps.className === "string" ? chartProps.className : "");

    return (
        <Suspense
            fallback={(
                <div
                    className={className}
                    style={{ minHeight: typeof height === "number" ? `${height}px` : String(height) }}
                />
            )}
        >
            <ApexChart {...(chartProps as any)} />
        </Suspense>
    );
}
