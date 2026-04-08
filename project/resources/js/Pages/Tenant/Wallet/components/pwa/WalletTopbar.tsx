import { Link } from "@inertiajs/react";
import React from "react";
import { Dropdown, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

type Props = {
    title: string;
    entityLabel: string;
    searchOpen: boolean;
    searchValue: string;
    onToggleSearch: () => void;
    onSearchChange: (value: string) => void;
};

const WalletTopbar = ({
    title,
    entityLabel,
    searchOpen,
    searchValue,
    onToggleSearch,
    onSearchChange,
}: Props) => {
    const { t } = useTranslation();

    return (
        <div className="position-sticky top-0 z-3 mb-3" style={{ paddingTop: "max(8px, env(safe-area-inset-top))", zIndex: 1050 }}>
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
                            <div className="small text-muted">{entityLabel}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2" style={{ minWidth: 92, justifyContent: "end" }}>
                            <button type="button" className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center" style={{ width: 42, height: 42 }} onClick={onToggleSearch}>
                                <i className="ri-search-line fs-5 text-dark"></i>
                            </button>
                            <Dropdown align="end">
                                <Dropdown.Toggle 
                                    as="button" 
                                    type="button" 
                                    className="btn btn-light rounded-circle border-0 shadow-sm d-inline-flex align-items-center justify-content-center arrow-none" 
                                    style={{ width: 42, height: 42, zIndex: 1060 }}
                                >
                                    <i className="ri-settings-3-line fs-5 text-dark"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu 
                                    className="border-0 shadow-lg rounded-4 p-2" 
                                    style={{ zIndex: 1070, position: 'absolute' }}
                                    popperConfig={{
                                        modifiers: [
                                            {
                                                name: 'offset',
                                                options: {
                                                    offset: [0, 8],
                                                },
                                            },
                                        ],
                                    }}
                                >
                                    <Dropdown.Item className="rounded-3 py-2 px-3 fw-medium">
                                        <i className="ri-user-settings-line me-2 align-middle text-muted"></i> Manage accounts
                                    </Dropdown.Item>
                                    <Dropdown.Item className="rounded-3 py-2 px-3 fw-medium">
                                        <i className="ri-list-ordered-2 me-2 align-middle text-muted"></i> Reorder accounts tabs
                                    </Dropdown.Item>
                                    <Dropdown.Item className="rounded-3 py-2 px-3 fw-medium">
                                        <i className="ri-arrow-up-down-line me-2 align-middle text-muted"></i> Reorder wallets
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>

                    {searchOpen && (
                        <div className="mt-2">
                            <div className="input-group shadow-sm rounded-4 overflow-hidden">
                                <span className="input-group-text bg-white border-0"><i className="ri-search-line"></i></span>
                                <Form.Control
                                    value={searchValue}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="border-0"
                                    placeholder={t("wallet.search_placeholder")}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletTopbar;
