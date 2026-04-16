import React, { useMemo } from "react";
import { Accordion, Badge, ListGroup } from "react-bootstrap";

export interface HistoryItem {
    id: number | string;
    finished_at: string | null;
    score_percent: number;
    correct_count: number;
    wrong_count: number;
    question_count: number;
    duration_seconds: number;
    best_streak: number;
    [key: string]: any;
}

type Props<T extends HistoryItem> = {
    history: T[];
    isLoading: boolean;
    emptyMessage: string;
    renderSubGroupKey: (item: T) => string;
    renderSubGroupHeader: (item: T) => React.ReactNode;
    renderSummaryBadges?: (item: T) => React.ReactNode;
    onItemClick?: (item: T) => void;
};

const groupDateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

const startOfDay = (date: Date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
};

const formatGroupDate = (dateStr: string | null) => {
    if (!dateStr) return "Tanggal tidak tersedia";

    const date = startOfDay(new Date(dateStr));
    const today = startOfDay(new Date());
    const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return "Hari Ini";
    if (diffDays === 1) return "Kemarin";
    return groupDateFormatter.format(date);
};

const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--:--";
    return timeFormatter.format(new Date(dateStr));
};

function GameHistoryView<T extends HistoryItem>({
    history,
    isLoading,
    emptyMessage,
    renderSubGroupKey,
    renderSubGroupHeader,
    renderSummaryBadges,
    onItemClick,
}: Props<T>) {
    const groupedHistory = useMemo(() => {
        const dateGroups: Record<string, Record<string, T[]>> = {};

        history.forEach((item) => {
            const dateKey = item.finished_at
                ? dayKeyFormatter.format(new Date(item.finished_at))
                : "unknown-date";
            const subKey = renderSubGroupKey(item);

            if (!dateGroups[dateKey]) dateGroups[dateKey] = {};
            if (!dateGroups[dateKey][subKey]) dateGroups[dateKey][subKey] = [];
            
            dateGroups[dateKey][subKey].push(item);
        });

        return Object.entries(dateGroups).sort(([a], [b]) => b.localeCompare(a));
    }, [history, renderSubGroupKey]);

    if (isLoading) {
        return <div className="text-center py-5 text-muted">Memuat riwayat...</div>;
    }

    if (history.length === 0) {
        return <div className="text-center py-5 text-muted small">{emptyMessage}</div>;
    }

    return (
        <Accordion defaultActiveKey="0" className="game-history-accordion">
            {groupedHistory.map(([dateKey, subGroups], dateIdx) => (
                <Accordion.Item eventKey={String(dateIdx)} key={dateKey} className="border-0 shadow-sm mb-3">
                    <Accordion.Header className="rounded shadow-none border-bottom-0">
                        <div className="d-flex justify-content-between align-items-center w-100 me-3">
                            <span className="fw-bold text-primary">{formatGroupDate(dateKey)}</span>
                            <Badge bg="light" text="dark" className="border">
                                {Object.values(subGroups).flat().length} Sesi
                            </Badge>
                        </div>
                    </Accordion.Header>
                    <Accordion.Body className="p-2 bg-light">
                        <Accordion className="nested-accordion" defaultActiveKey="0">
                            {Object.entries(subGroups).map(([subKey, items], subIdx) => (
                                <Accordion.Item eventKey={String(subIdx)} key={subKey} className="border-0 mb-2 shadow-sm">
                                    <Accordion.Header className="shadow-none py-1">
                                        <div className="d-flex align-items-center gap-2 small fw-semibold text-dark opacity-75">
                                            <i className="ri-folder-line"></i>
                                            {renderSubGroupHeader(items[0])}
                                            <span className="badge bg-secondary-subtle text-secondary rounded-pill ms-2">
                                                {items.length}
                                            </span>
                                        </div>
                                    </Accordion.Header>
                                    <Accordion.Body className="p-0">
                                        <ListGroup variant="flush">
                                            {items.map((item) => (
                                                <ListGroup.Item
                                                    key={item.id}
                                                    className={`d-flex flex-wrap justify-content-between align-items-center py-2 px-3 border-light small${onItemClick ? " game-history-item game-history-item--clickable" : ""}`}
                                                    onClick={() => onItemClick?.(item)}
                                                >
                                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                                        <div className="text-muted fw-bold game-history-item__time">
                                                            {formatTime(item.finished_at)}
                                                        </div>
                                                        <div className="fw-bold d-flex align-items-center gap-2 game-history-item__score">
                                                            <span className={item.score_percent >= 80 ? "text-success" : item.score_percent >= 60 ? "text-warning" : "text-danger"}>
                                                                {Math.round(item.score_percent)}%
                                                            </span>
                                                            <span className="text-muted fw-normal game-history-xsmall">
                                                                ({item.correct_count}/{item.question_count})
                                                            </span>
                                                        </div>
                                                        {renderSummaryBadges && (
                                                            <div className="d-flex gap-1 align-items-center">
                                                                {renderSummaryBadges(item)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="text-muted d-flex align-items-center gap-1" title="Durasi (detik)">
                                                            <i className="ri-timer-line"></i> {item.duration_seconds}s
                                                        </div>
                                                        <div className="text-success fw-bold d-flex align-items-center gap-1" title="Best Streak">
                                                            <i className="ri-fire-line"></i> {item.best_streak}x
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Accordion.Body>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    </Accordion.Body>
                </Accordion.Item>
            ))}
        </Accordion>
    );
}

export default GameHistoryView;
