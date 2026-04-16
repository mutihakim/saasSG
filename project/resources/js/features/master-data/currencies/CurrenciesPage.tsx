import { Head } from "@inertiajs/react";
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Col, Dropdown, Form, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import TenantPageTitle from "@/components/layouts/TenantPageTitle";
import DeleteModal from "@/components/ui/DeleteModal";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import { HeaderCheckboxDropdownFilter, HeaderTextFilter, SortableHeader } from "@/features/master-data/components/gridFilters";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { Currency, MasterDataPermissions, PaginationMeta, SortDirection } from "@/features/master-data/types";
import { syncMasterDataQuery } from "@/features/master-data/utils/queryString";
import TenantLayout from "@/layouts/TenantLayout";

const CurrencyModal = lazy(() => import("./components/CurrencyModal"));

interface CurrenciesProps {
    currencies: Currency[];
    pagination: PaginationMeta;
    filters: {
        code?: string;
        name?: string;
        symbol?: string;
        symbol_position?: string[];
        status?: string[];
    };
    sort?: {
        by?: string;
        direction?: SortDirection;
    };
    permissions: MasterDataPermissions;
}

const mergeUniqueCurrencies = (existing: Currency[], incoming: Currency[]) => {
    const merged = new Map<number, Currency>();
    [...existing, ...incoming].forEach((currency) => merged.set(currency.id, currency));
    return Array.from(merged.values());
};

const statusOptions = [
    { label: "Aktif", value: "active" },
    { label: "Nonaktif", value: "inactive" },
];

const positionOptions = [
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
];

const CurrenciesIndex = ({ currencies: initialCurrencies, pagination: initialPagination, filters, sort, permissions }: CurrenciesProps) => {
    const { t } = useTranslation();
    const { refreshCurrencies, removeCurrency, removeCurrencies } = useMasterData();
    const [currencies, setCurrencies] = useState(initialCurrencies);
    const [pagination, setPagination] = useState(initialPagination);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    const [codeFilter, setCodeFilter] = useState(filters.code || "");
    const [nameFilter, setNameFilter] = useState(filters.name || "");
    const [symbolFilter, setSymbolFilter] = useState(filters.symbol || "");
    const [positionFilters, setPositionFilters] = useState<string[]>(filters.symbol_position || []);
    const [statusFilters, setStatusFilters] = useState<string[]>(filters.status || []);
    const [sortBy, setSortBy] = useState(sort?.by || "code");
    const [sortDirection, setSortDirection] = useState<SortDirection>(sort?.direction || "asc");

    const debouncedCode = useDebouncedValue(codeFilter, 300);
    const debouncedName = useDebouncedValue(nameFilter, 300);
    const debouncedSymbol = useDebouncedValue(symbolFilter, 300);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const hydratedRef = useRef(false);

    const fetchCurrenciesPage = useCallback(async (page = 1, options?: { replace?: boolean }) => {
        const replace = options?.replace ?? page === 1;
        const response = await refreshCurrencies({
            page,
            code: debouncedCode || undefined,
            name: debouncedName || undefined,
            symbol: debouncedSymbol || undefined,
            symbolPositions: positionFilters,
            statuses: statusFilters as Array<"active" | "inactive">,
            sortBy,
            sortDirection,
        });

        setCurrencies((previous) => replace ? response.items : mergeUniqueCurrencies(previous, response.items));
        setPagination(response.pagination);
    }, [debouncedCode, debouncedName, debouncedSymbol, positionFilters, refreshCurrencies, sortBy, sortDirection, statusFilters]);

    useEffect(() => {
        syncMasterDataQuery({
            code: debouncedCode || undefined,
            name: debouncedName || undefined,
            symbol: debouncedSymbol || undefined,
            symbol_position: positionFilters,
            status: statusFilters,
            sort_by: sortBy !== "code" ? sortBy : undefined,
            sort_direction: sortDirection !== "asc" ? sortDirection : undefined,
        });
    }, [debouncedCode, debouncedName, debouncedSymbol, positionFilters, sortBy, sortDirection, statusFilters]);

    useEffect(() => {
        if (!hydratedRef.current) {
            hydratedRef.current = true;
            return;
        }

        setIsRefreshing(true);
        void fetchCurrenciesPage(1, { replace: true }).finally(() => setIsRefreshing(false));
    }, [fetchCurrenciesPage]);

    useEffect(() => {
        if (!loadMoreRef.current || !pagination.has_more) {
            return;
        }

        const node = loadMoreRef.current;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingMore) {
                setLoadingMore(true);
                void fetchCurrenciesPage(pagination.current_page + 1, { replace: false }).finally(() => setLoadingMore(false));
            }
        }, { rootMargin: "240px 0px" });

        observer.observe(node);
        return () => observer.disconnect();
    }, [fetchCurrenciesPage, loadingMore, pagination.current_page, pagination.has_more]);

    const handleSort = (column: string) => {
        if (sortBy !== column) {
            setSortBy(column);
            setSortDirection("asc");
            return;
        }

        if (sortDirection === "asc") {
            setSortDirection("desc");
            return;
        }

        setSortBy("code");
        setSortDirection("asc");
    };

    const toggleRow = (id: number) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleAllRows = () => {
        if (selectedRows.length === currencies.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(currencies.map((c) => c.id));
        }
    };

    const confirmDelete = async () => {
        if (!isBulkDelete && !selectedCurrency) {
            return;
        }

        setIsDeleting(true);
        try {
            if (isBulkDelete) {
                const response = await removeCurrencies(selectedRows);
                
                // Jika ada kegagalan sebagian/seluruhnya
                if (response.summary?.failed > 0) {
                    const failedItems = response.results.filter((r: any) => !r.ok);
                    const detail = (
                        <div className="mt-1">
                            {failedItems.map((r: any, idx: number) => (
                                <div key={idx} className="small text-muted">
                                    {r.name || r.id}: {t(`master.currencies.errors.${r.error_code}`)}
                                </div>
                            ))}
                        </div>
                    );
                    
                    notify.error({ 
                        title: t("master.currencies.messages.bulk_report_title"), 
                        detail: detail 
                    });
                } else if (response.summary?.deleted > 0) {
                    notify.success(t("master.currencies.messages.delete_success"));
                }
            } else if (selectedCurrency) {
                await removeCurrency(selectedCurrency.id);
                notify.success(t("master.currencies.messages.delete_success"));
            }

            await fetchCurrenciesPage(1, { replace: true });
            setSelectedRows([]);
            setShowDeleteModal(false);
        } catch (error: any) {
            const parsed = parseApiError(error, t("master.currencies.messages.delete_error"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setIsDeleting(false);
            setIsBulkDelete(false);
        }
    };

    return (
        <>
            <Head title={t("master.currencies.title")} />
            <TenantPageTitle title={t("master.currencies.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

            <Row>
                <Col lg={12}>
                    <Card id="currenciesList">
                        <Card.Header className="border-0 align-items-center d-flex">
                            <h4 className="card-title mb-0 flex-grow-1">{t("master.currencies.title")}</h4>
                            <div className="d-flex gap-2">
                                {selectedRows.length > 1 && permissions.delete ? (
                                    <Button
                                        variant="soft-danger"
                                        size="sm"
                                        data-testid="bulk-delete-btn"
                                        onClick={() => {
                                            setIsBulkDelete(true);
                                            setSelectedCurrency(null);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <i className="ri-delete-bin-line align-bottom me-1"></i>
                                        {t("master.common.buttons.delete_selected")} ({selectedRows.length})
                                    </Button>
                                ) : null}
                                {permissions.create ? (
                                    <Button 
                                        variant="danger" 
                                        size="sm" 
                                        data-testid="add-btn"
                                        onClick={() => { setSelectedCurrency(null); setShowModal(true); }}
                                    >
                                        <i className="ri-add-line align-bottom me-1"></i> {t("master.currencies.add_new")}
                                    </Button>
                                ) : null}
                            </div>
                        </Card.Header>

                        <Card.Body>
                            <div className="table-responsive table-card mb-3">
                                <table className="table align-middle table-nowrap table-striped table-hover" id="currencyTable" style={{ tableLayout: "fixed", minWidth: "900px" }}>
                                    <thead className="table-light text-muted">
                                        <tr className="text-uppercase">
                                            <th style={{ width: "40px" }}>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={currencies.length > 0 && selectedRows.length === currencies.length}
                                                    onChange={toggleAllRows}
                                                />
                                            </th>
                                            <th style={{ width: "14%" }}><SortableHeader label={t("master.common.headers.code")} isActive={sortBy === "code"} direction={sortDirection} onToggle={() => handleSort("code")} /></th>
                                            <th style={{ width: "24%" }}><SortableHeader label={t("master.common.headers.name")} isActive={sortBy === "name"} direction={sortDirection} onToggle={() => handleSort("name")} /></th>
                                            <th style={{ width: "12%" }}><SortableHeader label={t("master.currencies.headers.symbol")} isActive={sortBy === "symbol"} direction={sortDirection} onToggle={() => handleSort("symbol")} /></th>
                                            <th style={{ width: "18%" }}><SortableHeader label={t("master.currencies.headers.position")} isActive={sortBy === "symbol_position"} direction={sortDirection} onToggle={() => handleSort("symbol_position")} /></th>
                                            <th style={{ width: "14%" }}><SortableHeader label={t("master.common.headers.status")} isActive={sortBy === "is_active"} direction={sortDirection} onToggle={() => handleSort("is_active")} /></th>
                                            <th style={{ width: "96px" }}>{t("master.common.headers.action")}</th>
                                        </tr>
                                        <tr>
                                            <th></th>
                                            <th><HeaderTextFilter value={codeFilter} placeholder={t("master.common.search_placeholder")} onChange={setCodeFilter} /></th>
                                            <th><HeaderTextFilter value={nameFilter} placeholder={t("master.common.search_placeholder")} onChange={setNameFilter} /></th>
                                            <th><HeaderTextFilter value={symbolFilter} placeholder={t("master.common.search_placeholder")} onChange={setSymbolFilter} /></th>
                                            <th><HeaderCheckboxDropdownFilter title={t("master.currencies.headers.position")} allLabel={t("master.common.filters.all")} selectedValues={positionFilters} options={positionOptions.map((option) => ({ ...option, label: t(`master.currencies.positions.${option.value}`) }))} onChange={setPositionFilters} clearLabel={t("master.common.buttons.clear")} /></th>
                                            <th><HeaderCheckboxDropdownFilter title={t("master.common.headers.status")} allLabel={t("master.common.filters.all")} selectedValues={statusFilters} options={statusOptions.map((option) => ({ ...option, label: option.value === "active" ? t("master.common.status.active") : t("master.common.status.inactive") }))} onChange={setStatusFilters} clearLabel={t("master.common.buttons.clear")} /></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="list">
                                        {currencies.map((currency) => (
                                            <tr key={currency.id}>
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedRows.includes(currency.id)}
                                                        onChange={() => toggleRow(currency.id)}
                                                    />
                                                </td>
                                                <td className="fw-bold">{currency.code}</td>
                                                <td>{currency.name}</td>
                                                <td>{currency.symbol}</td>
                                                <td className="text-capitalize">{currency.symbol_position}</td>
                                                <td>
                                                    <span className={`badge bg-${currency.is_active ? "success" : "danger"}`}>
                                                        {currency.is_active ? t("master.common.status.active") : t("master.common.status.inactive")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Dropdown>
                                                        <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none p-0">
                                                            <i className="ri-more-fill align-middle"></i>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu className="dropdown-menu-end">
                                                            <Dropdown.Item onClick={() => { setSelectedCurrency(currency); setShowModal(true); }} data-testid="edit-btn">
                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> {t("master.categories.actions.edit")}
                                                             </Dropdown.Item>
                                                             <Dropdown.Divider />
                                                             <Dropdown.Item className="text-danger" onClick={() => { setSelectedCurrency(currency); setShowDeleteModal(true); }} data-testid="delete-btn">
                                                                 <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> {t("master.categories.actions.delete")}
                                                             </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))}
                                        {currencies.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4">{t("master.categories.messages.no_result")}</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>

                            <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                <Col sm>
                                    <div className="text-muted">
                                        {t("master.common.pagination.loaded_of_total", { loaded: currencies.length, total: pagination.total })}
                                        {isRefreshing ? ` ${t("master.common.pagination.refreshing")}` : ""}
                                    </div>
                                </Col>
                                <Col sm="auto">
                                    {loadingMore ? <span className="text-muted small">{t("master.common.pagination.loading_more")}</span> : null}
                                </Col>
                            </Row>

                            {pagination.has_more ? <div ref={loadMoreRef} style={{ height: "1px" }} aria-hidden="true" /> : null}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {showModal ? (
                <Suspense fallback={null}>
                    <CurrencyModal show={showModal} onClose={() => setShowModal(false)} onSuccess={() => fetchCurrenciesPage(1, { replace: true })} currency={selectedCurrency} />
                </Suspense>
            ) : null}

            <DeleteModal show={showDeleteModal} onCloseClick={() => setShowDeleteModal(false)} onDeleteClick={confirmDelete} loading={isDeleting} />
        </>
    );
};

CurrenciesIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default CurrenciesIndex;
