import { Head } from "@inertiajs/react";
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import TenantPageTitle from "@/components/layouts/TenantPageTitle";
import DeleteModal from "@/components/ui/DeleteModal";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import { HeaderCheckboxDropdownFilter, HeaderTextFilter, SortableHeader } from "@/features/master-data/components/gridFilters";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { Category, MasterDataModule, MasterDataPermissions, PaginationMeta, SortDirection } from "@/features/master-data/types";
import { syncMasterDataQuery } from "@/features/master-data/utils/queryString";
import TenantLayout from "@/layouts/TenantLayout";

const CategoriesWidgets = lazy(() => import("./components/CategoriesWidgets"));
const CategoryModal = lazy(() => import("./components/CategoryModal"));

interface CategoriesProps {
    categories: Category[];
    pagination: PaginationMeta;
    filters: {
        name?: string;
        description?: string;
        module?: string[];
        sub_type?: string[];
        status?: string[];
    };
    sort?: {
        by?: string;
        direction?: SortDirection;
    };
    stats: {
        total: number;
        finance: number;
        grocery: number;
        task: number;
    };
    modules: MasterDataModule[];
    permissions: MasterDataPermissions;
}

const CategoriesWidgetsFallback = () => null;

const flattenCategories = (items: Category[], depth = 0): Array<Category & { depth: number }> => {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.flatMap((item) => {
        const current = { ...item, depth };
        const children = flattenCategories(Array.isArray(item.children) ? item.children : [], depth + 1);

        return [current, ...children];
    });
};

const mergeUniqueCategories = (existing: Category[], incoming: Category[]) => {
    const merged = new Map<number, Category>();
    [...existing, ...incoming].forEach((category) => {
        merged.set(category.id, category);
    });

    return Array.from(merged.values());
};

const truncateText = (value: string | null | undefined, max = 96) => {
    const normalized = (value || "").trim();
    if (normalized.length <= max) {
        return normalized;
    }

    return `${normalized.slice(0, max - 1)}...`;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokenizeSearch = (value: string) => value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

const matchesAllTerms = (value: string | null | undefined, terms: string[]) => {
    if (terms.length === 0) {
        return false;
    }

    const normalized = (value || "").toLowerCase();
    return terms.every((term) => normalized.includes(term));
};

const renderHighlightedText = (value: string | null | undefined, terms: string[]) => {
    const text = value || "";
    if (text === "" || terms.length === 0) {
        return text || "-";
    }

    const pattern = new RegExp(`(${terms.map((term) => escapeRegExp(term)).join("|")})`, "gi");
    const parts = text.split(pattern);

    return parts.map((part, index) => (
        terms.some((term) => part.toLowerCase() === term.toLowerCase())
            ? <mark key={`${part}-${index}`} className="px-0 bg-warning-subtle rounded-1">{part}</mark>
            : <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ));
};

const typeOptions = [
    { label: "Pemasukan", value: "pemasukan" },
    { label: "Pengeluaran", value: "pengeluaran" },
];

const statusOptions = [
    { label: "Aktif", value: "active" },
    { label: "Nonaktif", value: "inactive" },
];

const CategoriesIndex = ({ categories: initialCategories, pagination: initialPagination, filters, sort, stats: initialStats, modules, permissions }: CategoriesProps) => {
    const { t } = useTranslation();
    const { refreshCategories, removeCategory, removeCategories } = useMasterData();
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
    const [stats, setStats] = useState(initialStats);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const [nameFilter, setNameFilter] = useState(filters.name || "");
    const [descriptionFilter, setDescriptionFilter] = useState(filters.description || "");
    const [moduleFilters, setModuleFilters] = useState<string[]>(filters.module || []);
    const [typeFilters, setTypeFilters] = useState<string[]>(filters.sub_type || []);
    const [statusFilters, setStatusFilters] = useState<string[]>(filters.status || []);
    const [sortBy, setSortBy] = useState(sort?.by || "name");
    const [sortDirection, setSortDirection] = useState<SortDirection>(sort?.direction || "asc");

    const debouncedName = useDebouncedValue(nameFilter, 300);
    const debouncedDescription = useDebouncedValue(descriptionFilter, 300);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const hydratedRef = useRef(false);

    const flattenedCategories = useMemo(() => flattenCategories(categories), [categories]);
    const nameTerms = useMemo(() => tokenizeSearch(debouncedName), [debouncedName]);
    const descriptionTerms = useMemo(() => tokenizeSearch(debouncedDescription), [debouncedDescription]);

    const fetchCategoriesPage = useCallback(async (page = 1, options?: { replace?: boolean }) => {
        const replace = options?.replace ?? page === 1;
        const response = await refreshCategories({
            page,
            name: debouncedName || undefined,
            description: debouncedDescription || undefined,
            modules: moduleFilters,
            subTypes: typeFilters,
            statuses: statusFilters as Array<"active" | "inactive">,
            sortBy,
            sortDirection,
        });

        setCategories((previous) => replace ? response.items : mergeUniqueCategories(previous, response.items));
        setPagination(response.pagination);
        if (response.stats) {
            setStats({
                total: Number(response.stats.total || 0),
                finance: Number(response.stats.finance || 0),
                grocery: Number(response.stats.grocery || 0),
                task: Number(response.stats.task || 0),
            });
        }
    }, [debouncedDescription, debouncedName, moduleFilters, refreshCategories, sortBy, sortDirection, statusFilters, typeFilters]);

    useEffect(() => {
        syncMasterDataQuery({
            name: debouncedName || undefined,
            description: debouncedDescription || undefined,
            module: moduleFilters,
            sub_type: typeFilters,
            status: statusFilters,
            sort_by: sortBy !== "name" ? sortBy : undefined,
            sort_direction: sortDirection !== "asc" ? sortDirection : undefined,
        });
    }, [debouncedDescription, debouncedName, moduleFilters, sortBy, sortDirection, statusFilters, typeFilters]);

    useEffect(() => {
        if (!hydratedRef.current) {
            hydratedRef.current = true;
            return;
        }

        setIsRefreshing(true);
        void fetchCategoriesPage(1, { replace: true }).finally(() => setIsRefreshing(false));
    }, [fetchCategoriesPage]);

    useEffect(() => {
        if (!loadMoreRef.current || !pagination.has_more) {
            return;
        }

        const node = loadMoreRef.current;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingMore) {
                setLoadingMore(true);
                void fetchCategoriesPage(pagination.current_page + 1, { replace: false }).finally(() => setLoadingMore(false));
            }
        }, { rootMargin: "240px 0px" });

        observer.observe(node);
        return () => observer.disconnect();
    }, [fetchCategoriesPage, loadingMore, pagination.current_page, pagination.has_more]);

    useEffect(() => {
        setSelectedRows((previous) => previous.filter((id) => flattenedCategories.some((category) => category.id === id)));
    }, [flattenedCategories]);

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

        setSortBy("name");
        setSortDirection("asc");
    };

    const handleSelectAllLoaded = (checked: boolean) => {
        if (checked) {
            setSelectedRows(flattenedCategories.map((category) => category.id));
            return;
        }

        setSelectedRows([]);
    };

    const confirmDelete = useCallback(async () => {
        if (!isBulkDelete && !selectedCategory) {
            return;
        }

        if (isBulkDelete && selectedRows.length === 0) {
            return;
        }

        setIsDeleting(true);
        try {
            if (isBulkDelete) {
                const response = await removeCategories(selectedRows);
                
                // Jika ada kegagalan sebagian/seluruhnya
                if (response.summary?.failed > 0) {
                    const failedItems = response.results.filter((r: any) => !r.ok);
                    const detail = (
                        <div className="mt-1">
                            {failedItems.map((r: any, idx: number) => (
                                <div key={idx} className="small text-muted">
                                    {r.name}: {t(`master.categories.errors.${r.error_code}`)}
                                </div>
                            ))}
                        </div>
                    );
                    
                    notify.error({ 
                        title: t("master.categories.messages.bulk_report_title"), 
                        detail: detail 
                    });
                } else if (response.summary?.deleted > 0) {
                    notify.success(t("master.categories.messages.bulk_delete_success"));
                }
                
                setSelectedRows([]);
            } else if (selectedCategory) {
                await removeCategory(selectedCategory.id, selectedCategory.row_version);
                notify.success(t("master.categories.messages.delete_success"));
            }

            await fetchCategoriesPage(1, { replace: true });
            setShowDeleteModal(false);
        } catch (error: any) {
            const parsed = parseApiError(error, t("master.categories.messages.delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setIsDeleting(false);
            setIsBulkDelete(false);
        }
    }, [fetchCategoriesPage, isBulkDelete, removeCategories, removeCategory, selectedCategory, selectedRows, t]);

    return (
        <React.Fragment>
            <Head title={t("master.categories.title")} />
            <TenantPageTitle title={t("master.categories.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

            <Suspense fallback={<CategoriesWidgetsFallback />}>
                <CategoriesWidgets {...stats} />
            </Suspense>

            <Row>
                <Col lg={12}>
                    <Card id="categoryList">
                        <Card.Header className="border-0 align-items-center d-flex">
                            <h4 className="card-title mb-0 flex-grow-1">{t("master.categories.title")}</h4>
                            <div className="d-flex gap-2">
                                {selectedRows.length > 1 && permissions.delete ? (
                                    <Button
                                        variant="soft-danger"
                                        size="sm"
                                        data-testid="bulk-delete-btn"
                                        onClick={() => {
                                            setIsBulkDelete(true);
                                            setSelectedCategory(null);
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
                                        className="add-btn"
                                        size="sm"
                                        data-testid="add-btn"
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setShowModal(true);
                                        }}
                                    >
                                        <i className="ri-add-line align-bottom me-1"></i>
                                        {t("master.categories.actions.create")}
                                    </Button>
                                ) : null}
                            </div>
                        </Card.Header>

                        <Card.Body>
                            <div className="table-responsive table-card">
                                <table className="table align-middle table-nowrap table-striped table-hover" id="categoryTable" style={{ tableLayout: "fixed", minWidth: "1080px" }}>
                                    <thead className="table-light text-muted">
                                        <tr className="text-uppercase">
                                            <th style={{ width: "40px" }}>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={flattenedCategories.length > 0 && selectedRows.length === flattenedCategories.length}
                                                        onChange={(event) => handleSelectAllLoaded(event.target.checked)}
                                                    />
                                                </div>
                                            </th>
                                            <th style={{ width: "28%" }}><SortableHeader label={t("master.categories.headers.name")} isActive={sortBy === "name"} direction={sortDirection} onToggle={() => handleSort("name")} /></th>
                                            <th style={{ width: "32%" }}><SortableHeader label={t("master.categories.headers.description")} isActive={sortBy === "description"} direction={sortDirection} onToggle={() => handleSort("description")} /></th>
                                            <th style={{ width: "14%" }}><SortableHeader label={t("master.categories.headers.module")} isActive={sortBy === "module"} direction={sortDirection} onToggle={() => handleSort("module")} /></th>
                                            <th style={{ width: "12%" }}><SortableHeader label={t("master.categories.headers.type")} isActive={sortBy === "sub_type"} direction={sortDirection} onToggle={() => handleSort("sub_type")} /></th>
                                            <th style={{ width: "10%" }}><SortableHeader label={t("master.categories.headers.status")} isActive={sortBy === "is_active"} direction={sortDirection} onToggle={() => handleSort("is_active")} /></th>
                                            <th style={{ width: "96px" }}>{t("master.common.headers.action")}</th>
                                        </tr>
                                        <tr>
                                            <th></th>
                                            <th><HeaderTextFilter value={nameFilter} placeholder={t("master.common.search_placeholder")} onChange={setNameFilter} /></th>
                                            <th><HeaderTextFilter value={descriptionFilter} placeholder={t("master.common.search_placeholder")} onChange={setDescriptionFilter} /></th>
                                            <th>
                                                <HeaderCheckboxDropdownFilter
                                                    title={t("master.categories.fields.module")}
                                                    allLabel={t("master.common.filters.all")}
                                                    selectedValues={moduleFilters}
                                                    options={modules.map((moduleOption) => ({
                                                        label: t(`master.categories.modules.${moduleOption}`),
                                                        value: moduleOption,
                                                    }))}
                                                    onChange={setModuleFilters}
                                                    clearLabel={t("master.common.buttons.clear")}
                                                />
                                            </th>
                                            <th>
                                                <HeaderCheckboxDropdownFilter
                                                    title={t("master.categories.fields.type")}
                                                    allLabel={t("master.common.filters.all")}
                                                    selectedValues={typeFilters}
                                                    options={typeOptions.map((option) => ({
                                                        value: option.value,
                                                        label: option.value === "pemasukan" ? t("master.categories.types.income") : t("master.categories.types.expense"),
                                                    }))}
                                                    onChange={setTypeFilters}
                                                    clearLabel={t("master.common.buttons.clear")}
                                                />
                                            </th>
                                            <th>
                                                <HeaderCheckboxDropdownFilter
                                                    title={t("master.categories.headers.status")}
                                                    allLabel={t("master.common.filters.all")}
                                                    selectedValues={statusFilters}
                                                    options={statusOptions.map((option) => ({
                                                        ...option,
                                                        label: option.value === "active" ? t("master.categories.status.active") : t("master.categories.status.inactive"),
                                                    }))}
                                                    onChange={setStatusFilters}
                                                    clearLabel={t("master.common.buttons.clear")}
                                                />
                                            </th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="list form-check-all">
                                        {flattenedCategories.map((category) => (
                                            <tr
                                                key={category.id}
                                                data-testid={`category-row-${category.id}`}
                                                data-has-children={(category.children_count || 0) > 0}
                                                className={matchesAllTerms(category.name, nameTerms) || matchesAllTerms(category.description, descriptionTerms) ? "table-warning" : undefined}
                                            >
                                                <td>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedRows.includes(category.id)}
                                                            onChange={() => setSelectedRows((previous) => previous.includes(category.id) ? previous.filter((id) => id !== category.id) : [...previous, category.id])}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ width: "28%" }}>
                                                    <div className="d-flex align-items-center" style={{ marginLeft: `${category.depth * 24}px` }}>
                                                        {category.depth > 0 ? <i className="ri-corner-down-right-line me-2 text-muted"></i> : null}
                                                        <div className="flex-shrink-0 me-2 text-center" style={{ width: "24px" }}>
                                                            <i className={`${String(category.icon || "ri-price-tag-3-line")} fs-17 text-${String(category.color || "primary")}`}></i>
                                                        </div>
                                                        <div>
                                                            <div className="fw-medium">{renderHighlightedText(category.name, nameTerms)}</div>
                                                        </div>
                                                        {category.is_default ? <Badge bg="light" className="text-muted ms-2 px-1">{t("master.categories.badges.system")}</Badge> : null}
                                                    </div>
                                                </td>
                                                <td className="text-muted" style={{ width: "32%" }}>
                                                    {category.description ? <span title={category.description}>{renderHighlightedText(truncateText(category.description), descriptionTerms)}</span> : <span className="text-muted">-</span>}
                                                </td>
                                                <td>{t(`master.categories.modules.${category.module}`)}</td>
                                                <td>{category.sub_type ? t(category.sub_type === "pemasukan" ? "master.categories.types.income" : "master.categories.types.expense") : "-"}</td>
                                                <td>
                                                    <Badge bg={category.is_active ? "success" : "danger"} className={category.is_active ? "badge-soft-success" : "badge-soft-danger"}>
                                                        {category.is_active ? t("master.categories.status.active") : t("master.categories.status.inactive")}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <ul className="list-inline hstack gap-2 mb-0">
                                                        <li className="list-inline-item">
                                                            <button 
                                                                className="btn btn-sm btn-soft-primary" 
                                                                data-testid="edit-btn"
                                                                onClick={() => {
                                                                    setSelectedCategory(category);
                                                                    setShowModal(true);
                                                                }}
                                                            >
                                                                <i className="ri-pencil-fill align-bottom"></i>
                                                            </button>
                                                        </li>
                                                        {!category.is_default && (!category.children || category.children.length === 0) && (category.children_count || 0) === 0 ? (
                                                            <li className="list-inline-item">
                                                                <button 
                                                                    className="btn btn-sm btn-soft-danger" 
                                                                    data-testid="delete-btn"
                                                                    onClick={() => {
                                                                        setSelectedCategory(category);
                                                                        setShowDeleteModal(true);
                                                                    }}
                                                                >
                                                                    <i className="ri-delete-bin-fill align-bottom"></i>
                                                                </button>
                                                            </li>
                                                        ) : null}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                        {flattenedCategories.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-4">
                                                    <i className="ri-search-line display-6 text-muted d-block mb-2"></i>
                                                    {t("master.categories.messages.no_result")}
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>

                            <Row className="align-items-center mt-3 g-3 text-center text-sm-start">
                                <Col sm>
                                    <div className="text-muted">
                                        {t("master.common.pagination.loaded_of_total", {
                                            loaded: categories.length,
                                            total: pagination.total,
                                        })}
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
                    <CategoryModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => fetchCategoriesPage(1, { replace: true })}
                        category={selectedCategory}
                        module=""
                        modules={modules}
                    />
                </Suspense>
            ) : null}

            <DeleteModal
                show={showDeleteModal}
                onCloseClick={() => setShowDeleteModal(false)}
                onDeleteClick={confirmDelete}
                loading={isDeleting}
                title={isBulkDelete ? t("master.categories.actions.delete") : undefined}
                message={isBulkDelete ? t("master.categories.messages.confirm_bulk_delete", { count: selectedRows.length }) : undefined}
            />
        </React.Fragment>
    );
};

CategoriesIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default CategoriesIndex;
