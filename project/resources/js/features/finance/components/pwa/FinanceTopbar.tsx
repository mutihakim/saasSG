import { Link } from "@inertiajs/react";
import React from "react";
import { Badge, Form } from "react-bootstrap";

import { FINANCE_TOPBAR_HEIGHT } from "./types";

interface FinanceTopbarProps {
    title: string;
    subtitle: string;
    searchOpen: boolean;
    draftSearch: string;
    onToggleSearch: () => void;
    onDraftSearchChange: (value: string) => void;
    onApplySearch: () => void;
    onOpenFilter: () => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    filterOwnerLabel?: string | null;
    filterKindLabel?: string | null;
}

const FinanceTopbar = ({
    title,
    subtitle,
    searchOpen,
    draftSearch,
    onToggleSearch,
    onDraftSearchChange,
    onApplySearch,
    onOpenFilter,
    onPrevMonth,
    onNextMonth,
    filterOwnerLabel,
    filterKindLabel,
}: FinanceTopbarProps) => {
    return (
        <div
            className="position-sticky top-0 z-3 mb-3"
            style={{
                paddingTop: "max(8px, env(safe-area-inset-top))",
                zIndex: 1050,
            }}
        >
            <div
                style={{
                    background: "rgba(248, 249, 250, 0.82)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    marginInline: 12,
                }}
            >
                <div className="px-3 pt-2 pb-2">
                    <div className="d-flex align-items-center justify-content-between">
                        <div style={{ width: 42 }}>
                            <Link
                                href="/hub"
                                className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center"
                                style={{ width: 42, height: 42 }}
                            >
                                <i className="ri-arrow-left-line fs-5 text-dark"></i>
                            </Link>
                        </div>
                        <div className="text-center flex-grow-1">
                            <div className="fw-semibold fs-6 text-dark">{title}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2" style={{ width: 92, justifyContent: "end" }}>
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }} onClick={onToggleSearch}>
                                <i className="ri-search-line fs-5 text-dark"></i>
                            </button>
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }} onClick={onOpenFilter}>
                                <i className="ri-filter-3-line fs-5 text-dark"></i>
                            </button>
                        </div>
                    </div>

                    {searchOpen && (
                        <div className="mt-2">
                            <div className="input-group shadow-sm rounded-4 overflow-hidden">
                                <span className="input-group-text bg-white border-0"><i className="ri-search-line"></i></span>
                                <Form.Control
                                    value={draftSearch}
                                    onChange={(e) => onDraftSearchChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            onApplySearch();
                                        }
                                    }}
                                    className="border-0"
                                    placeholder="Search transactions"
                                />
                                <button type="button" className="btn btn-white border-0" onClick={onApplySearch}>
                                    <i className="ri-arrow-right-line"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div
                style={{
                    background: "rgba(255, 255, 255, 0.94)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                    minHeight: FINANCE_TOPBAR_HEIGHT,
                    marginInline: 12,
                }}
            >
                <div className="px-3 py-2">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }} onClick={onPrevMonth}>
                                <i className="ri-arrow-left-s-line"></i>
                            </button>
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }} onClick={onNextMonth}>
                                <i className="ri-arrow-right-s-line"></i>
                            </button>
                        </div>
                        <div className="text-center flex-grow-1 fw-semibold text-dark text-truncate">{subtitle}</div>
                        <div className="small text-muted text-truncate text-end flex-shrink-1" style={{ maxWidth: 116 }}>
                            {filterOwnerLabel || filterKindLabel || ""}
                        </div>
                    </div>
                    {filterKindLabel && (
                        <div className="d-flex justify-content-end mt-1">
                            <Badge bg="info-subtle" text="info" className="rounded-pill px-3 py-1">{filterKindLabel}</Badge>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceTopbar;
