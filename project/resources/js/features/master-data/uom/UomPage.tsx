import { Head } from "@inertiajs/react";
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Col, Dropdown, Form, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import TenantPageTitle from "@/components/layouts/TenantPageTitle";
import DeleteModal from "@/components/ui/DeleteModal";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import { HeaderCheckboxDropdownFilter, HeaderNumberExpressionFilter, HeaderTextFilter, SortableHeader } from "@/features/master-data/components/gridFilters";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { MasterDataPermissions, PaginationMeta, SortDirection, Uom } from "@/features/master-data/types";
import { syncMasterDataQuery } from "@/features/master-data/utils/queryString";
import TenantLayout from "@/layouts/TenantLayout";

const UomModal = lazy(() => import("./components/UomModal"));

interface UomProps {
    units: Uom[];
    pagination: PaginationMeta;
    filters: {
        code?: string;
        name?: string;
        abbreviation?: string;
        dimension_type?: string[];
        status?: string[];
        base_factor?: string;
    };
    sort?: {
        by?: string;
        direction?: SortDirection;
    };
    dimensionTypes: string[];
    permissions: MasterDataPermissions;
}

const mergeUniqueUnits = (existing: Uom[], incoming: Uom[]) => {
    const merged = new Map<number, Uom>();
    [...existing, ...incoming].forEach((unit) => merged.set(unit.id, unit));
    return Array.from(merged.values());
};

const flattenUoms = (items: Uom[]) => {
    const roots = items.filter(u => !u.base_unit_code);
    const result: (Uom & { depth: number })[] = [];

    roots.forEach(root => {
        result.push({ ...root, depth: 0 });
        const children = items.filter(u => u.base_unit_code === root.code);
        children.forEach(child => {
            result.push({ ...child, depth: 1 });
        });
    });

    // If there are any orphans (base unit not in current list), add them at the end
    const listedIds = new Set(result.map(r => r.id));
    items.filter(u => !listedIds.has(u.id)).forEach(orphan => {
        result.push({ ...orphan, depth: 0 });
    });

    return result;
};

const statusOptions = [
    { label: "Aktif", value: "active" },
    { label: "Nonaktif", value: "inactive" },
];

const UomIndex = ({ units: initialUnits, pagination: initialPagination, filters, sort, dimensionTypes, permissions }: UomProps) => {
    const { t } = useTranslation();
    const { refreshUom, removeUom, removeUoms } = useMasterData();
    const [units, setUnits] = useState(initialUnits);
    const [pagination, setPagination] = useState(initialPagination);
    const [selectedUnit, setSelectedUnit] = useState<Uom | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    const [codeFilter, setCodeFilter] = useState(filters.code || "");
    const [nameFilter, setNameFilter] = useState(filters.name || "");
    const [abbreviationFilter, setAbbreviationFilter] = useState(filters.abbreviation || "");
    const [dimensionFilters, setDimensionFilters] = useState<string[]>(filters.dimension_type || []);
    const [statusFilters, setStatusFilters] = useState<string[]>(filters.status || []);
    const [baseFactorFilter, setBaseFactorFilter] = useState(String(filters.base_factor || ""));
    const [sortBy, setSortBy] = useState(sort?.by || "code");
    const [sortDirection, setSortDirection] = useState<SortDirection>(sort?.direction || "asc");

    const debouncedCode = useDebouncedValue(codeFilter, 300);
    const debouncedName = useDebouncedValue(nameFilter, 300);
    const debouncedAbbreviation = useDebouncedValue(abbreviationFilter, 300);
    const debouncedBaseFactorFilter = useDebouncedValue(baseFactorFilter, 300);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const hydratedRef = useRef(false);

    const flattenedUnits = useMemo(() => flattenUoms(units), [units]);

    const fetchUnitsPage = useCallback(async (page = 1, options?: { replace?: boolean }) => {
        const replace = options?.replace ?? page === 1;
        const response = await refreshUom({
            page,
            code: debouncedCode || undefined,
            name: debouncedName || undefined,
            abbreviation: debouncedAbbreviation || undefined,
            dimensionTypes: dimensionFilters,
            statuses: statusFilters as Array<"active" | "inactive">,
            baseFactor: debouncedBaseFactorFilter || undefined,
            sortBy,
            sortDirection,
        });

        setUnits((previous) => replace ? response.items : mergeUniqueUnits(previous, response.items));
        setPagination(response.pagination);
    }, [debouncedAbbreviation, debouncedBaseFactorFilter, debouncedCode, debouncedName, dimensionFilters, refreshUom, sortBy, sortDirection, statusFilters]);

    useEffect(() => {
        syncMasterDataQuery({
            code: debouncedCode || undefined,
            name: debouncedName || undefined,
            abbreviation: debouncedAbbreviation || undefined,
            dimension_type: dimensionFilters,
            status: statusFilters,
            base_factor: debouncedBaseFactorFilter || undefined,
            sort_by: sortBy !== "code" ? sortBy : undefined,
            sort_direction: sortDirection !== "asc" ? sortDirection : undefined,
        });
    }, [debouncedAbbreviation, debouncedBaseFactorFilter, debouncedCode, debouncedName, dimensionFilters, sortBy, sortDirection, statusFilters]);

    useEffect(() => {
        if (!hydratedRef.current) {
            hydratedRef.current = true;
            return;
        }

        setIsRefreshing(true);
        void fetchUnitsPage(1, { replace: true }).finally(() => setIsRefreshing(false));
    }, [fetchUnitsPage]);

    useEffect(() => {
        if (!loadMoreRef.current || !pagination.has_more) {
            return;
        }

        const node = loadMoreRef.current;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingMore) {
                setLoadingMore(true);
                void fetchUnitsPage(pagination.current_page + 1, { replace: false }).finally(() => setLoadingMore(false));
            }
        }, { rootMargin: "240px 0px" });

        observer.observe(node);
        return () => observer.disconnect();
    }, [fetchUnitsPage, loadingMore, pagination.current_page, pagination.has_more]);

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
        if (selectedRows.length === units.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(units.map((u) => u.id));
        }
    };

    const confirmDelete = async () => {
        if (!isBulkDelete && !selectedUnit) {
            return;
        }

        setIsDeleting(true);
        try {
            if (isBulkDelete) {
                const response = await removeUoms(selectedRows);
                setShowDeleteModal(false); // Close early
                
                if (response.summary?.failed > 0) {
                    const failedItems = response.results.filter((r: any) => !r.ok);
                    const detail = (
                        <div className="mt-1">
                            {failedItems.map((r: any, idx: number) => (
                                <div key={idx} className="small text-muted">
                                    {r.name || r.id}: {t(`api.error.${r.code || r.error_code}.detail`, { defaultValue: t("master.uom.messages.error") })}
                                </div>
                            ))}
                        </div>
                    );
                    
                    notify.error({ 
                        title: t("master.uom.messages.bulk_report_title"), 
                        detail: detail 
                    });
                } else if (response.summary?.deleted > 0) {
                    notify.success(t("master.uom.messages.delete_success"));
                }
            } else if (selectedUnit) {
                await removeUom(selectedUnit.id);
                setShowDeleteModal(false); // Close early
                notify.success(t("master.uom.messages.delete_success"));
            }

            await fetchUnitsPage(1, { replace: true });
            setSelectedRows([]);
        } catch (error: any) {
            const parsed = parseApiError(error, t("master.uom.messages.delete_error"));
            setShowDeleteModal(false); // Close early
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setIsDeleting(false);
            setIsBulkDelete(false);
        }
    };

    return (
        <>
            <Head title={t("master.uom.title")} />
            <TenantPageTitle title={t("master.uom.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

            <Row>
                <Col lg={12}>
                    <Card id="uomList">
                        <Card.Header className="border-0 align-items-center d-flex">
                            <h4 className="card-title mb-0 flex-grow-1">{t("master.uom.title")}</h4>
                            <div className="d-flex gap-2">
                                {selectedRows.length > 1 && permissions.delete ? (
                                    <Button
                                        variant="soft-danger"
                                        size="sm"
                                        data-testid="bulk-delete-btn"
                                        onClick={() => {
                                            setIsBulkDelete(true);
                                            setSelectedUnit(null);
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
                                        onClick={() => { setSelectedUnit(null); setShowModal(true); }}
                                    >
                                        <i className="ri-add-line align-bottom me-1"></i> {t("master.uom.add_new")}
                                    </Button>
                                ) : null}
                            </div>
                        </Card.Header>

                        <Card.Body>
                            <div className="table-responsive table-card mb-3">
                                <table className="table align-middle table-nowrap table-striped table-hover" id="uomTable" style={{ tableLayout: "fixed", minWidth: "980px" }}>
                                    <thead className="table-light text-muted">
                                        <tr className="text-uppercase">
                                            <th style={{ width: "40px" }}>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={units.length > 0 && selectedRows.length === units.length}
                                                    onChange={toggleAllRows}
                                                />
                                            </th>
                                            <th style={{ width: "16%" }}><SortableHeader label={t("master.common.headers.code")} isActive={sortBy === "code"} direction={sortDirection} onToggle={() => handleSort("code")} /></th>
                                            <th style={{ width: "22%" }}><SortableHeader label={t("master.common.headers.name")} isActive={sortBy === "name"} direction={sortDirection} onToggle={() => handleSort("name")} /></th>
                                            <th style={{ width: "12%" }}><SortableHeader label={t("master.uom.headers.symbol")} isActive={sortBy === "abbreviation"} direction={sortDirection} onToggle={() => handleSort("abbreviation")} /></th>
                                            <th style={{ width: "16%" }}><SortableHeader label={t("master.uom.headers.dimension")} isActive={sortBy === "dimension_type"} direction={sortDirection} onToggle={() => handleSort("dimension_type")} /></th>
                                            <th style={{ width: "14%" }}><SortableHeader label={t("master.uom.headers.factor")} isActive={sortBy === "base_factor"} direction={sortDirection} onToggle={() => handleSort("base_factor")} /></th>
                                            <th style={{ width: "12%" }}><SortableHeader label={t("master.common.headers.status")} isActive={sortBy === "is_active"} direction={sortDirection} onToggle={() => handleSort("is_active")} /></th>
                                            <th style={{ width: "96px" }}>{t("master.common.headers.action")}</th>
                                        </tr>
                                        <tr>
                                            <th></th>
                                            <th><HeaderTextFilter value={codeFilter} placeholder={t("master.common.search_placeholder")} onChange={setCodeFilter} /></th>
                                            <th><HeaderTextFilter value={nameFilter} placeholder={t("master.common.search_placeholder")} onChange={setNameFilter} /></th>
                                            <th><HeaderTextFilter value={abbreviationFilter} placeholder={t("master.common.search_placeholder")} onChange={setAbbreviationFilter} /></th>
                                            <th><HeaderCheckboxDropdownFilter title={t("master.uom.headers.dimension")} allLabel={t("master.common.filters.all")} selectedValues={dimensionFilters} options={dimensionTypes.map((type) => ({ label: t(`master.uom.dimension_types.${type}`), value: type }))} onChange={setDimensionFilters} clearLabel={t("master.common.buttons.clear")} /></th>
                                            <th><HeaderNumberExpressionFilter value={baseFactorFilter} placeholder={t("master.common.filters.number_expression")} onChange={setBaseFactorFilter} /></th>
                                            <th><HeaderCheckboxDropdownFilter title={t("master.common.headers.status")} allLabel={t("master.common.filters.all")} selectedValues={statusFilters} options={statusOptions.map((option) => ({ ...option, label: option.value === "active" ? t("master.common.status.active") : t("master.common.status.inactive") }))} onChange={setStatusFilters} clearLabel={t("master.common.buttons.clear")} /></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="list">
                                        {flattenedUnits.map((unit) => (
                                            <tr key={unit.id}>
                                                <td>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedRows.includes(unit.id)}
                                                        onChange={() => toggleRow(unit.id)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center" style={{ marginLeft: `${unit.depth * 24}px` }}>
                                                        {unit.depth > 0 ? <i className="ri-corner-down-right-line me-2 text-muted"></i> : null}
                                                        <span className="fw-bold">{unit.code}</span>
                                                    </div>
                                                </td>
                                                <td>{unit.name}</td>
                                                <td><Badge bg="light" className="text-body">{unit.abbreviation}</Badge></td>
                                                <td className="text-capitalize">{unit.dimension_type}</td>
                                                <td>
                                                    {unit.base_unit_code ? (
                                                        <span>{unit.base_factor} <small className="text-muted">({unit.base_unit_code})</small></span>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${unit.is_active ? "success" : "danger"}`}>
                                                        {unit.is_active ? t("master.common.status.active") : t("master.common.status.inactive")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Dropdown>
                                                        <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none p-0">
                                                            <i className="ri-more-fill align-middle"></i>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu className="dropdown-menu-end">
                                                            <Dropdown.Item onClick={() => { setSelectedUnit(unit); setShowModal(true); }} data-testid="edit-btn">
                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> {t("master.categories.actions.edit")}
                                                            </Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item className="text-danger" onClick={() => { setSelectedUnit(unit); setShowDeleteModal(true); }} data-testid="delete-btn">
                                                                <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> {t("master.categories.actions.delete")}
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))}
                                        {flattenedUnits.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-4">{t("master.categories.messages.no_result")}</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>

                            <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                <Col sm>
                                    <div className="text-muted">
                                        {t("master.common.pagination.loaded_of_total", { loaded: units.length, total: pagination.total })}
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
                    <UomModal show={showModal} onClose={() => setShowModal(false)} onSuccess={() => fetchUnitsPage(1, { replace: true })} unit={selectedUnit} dimensionTypes={dimensionTypes} />
                </Suspense>
            ) : null}

            <DeleteModal show={showDeleteModal} onCloseClick={() => setShowDeleteModal(false)} onDeleteClick={confirmDelete} loading={isDeleting} />
        </>
    );
};

UomIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default UomIndex;
