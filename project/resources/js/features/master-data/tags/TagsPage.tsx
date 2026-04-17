import { Head } from "@inertiajs/react";
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Col, Dropdown, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import TenantPageTitle from "@/components/layouts/TenantPageTitle";
import DeleteModal from "@/components/ui/DeleteModal";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import { HeaderNumberExpressionFilter, HeaderTextFilter, SortableHeader } from "@/features/master-data/components/gridFilters";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { MasterDataPermissions, PaginationMeta, SortDirection, Tag } from "@/features/master-data/types";
import { syncMasterDataQuery } from "@/features/master-data/utils/queryString";
import TenantLayout from "@/layouts/TenantLayout";

const TagModal = lazy(() => import("./components/TagModal"));

interface TagsProps {
    tags: Tag[];
    pagination: PaginationMeta;
    filters: {
        name?: string;
        usage?: string;
    };
    sort?: {
        by?: string;
        direction?: SortDirection;
    };
    permissions: MasterDataPermissions;
}

const mergeUniqueTags = (existing: Tag[], incoming: Tag[]) => {
    const merged = new Map<number, Tag>();
    [...existing, ...incoming].forEach((tag) => merged.set(tag.id, tag));
    return Array.from(merged.values());
};

const TagsIndex = ({ tags: initialTags, pagination: initialPagination, filters, sort, permissions }: TagsProps) => {
    const { t } = useTranslation();
    const { refreshTags, removeTag, removeTags } = useMasterData();
    const [tags, setTags] = useState(initialTags);
    const [pagination, setPagination] = useState(initialPagination);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const [nameFilter, setNameFilter] = useState(filters.name || "");
    const [usageFilter, setUsageFilter] = useState(String(filters.usage || ""));
    const [sortBy, setSortBy] = useState(sort?.by || "name");
    const [sortDirection, setSortDirection] = useState<SortDirection>(sort?.direction || "asc");

    const debouncedName = useDebouncedValue(nameFilter, 300);
    const debouncedUsageFilter = useDebouncedValue(usageFilter, 300);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const hydratedRef = useRef(false);

    const fetchTagsPage = useCallback(async (page = 1, options?: { replace?: boolean }) => {
        const replace = options?.replace ?? page === 1;
        const response = await refreshTags({
            page,
            name: debouncedName || undefined,
            usage: debouncedUsageFilter || undefined,
            sortBy,
            sortDirection,
        });

        setTags((previous) => replace ? response.items : mergeUniqueTags(previous, response.items));
        setPagination(response.pagination);
    }, [debouncedName, debouncedUsageFilter, refreshTags, sortBy, sortDirection]);

    useEffect(() => {
        syncMasterDataQuery({
            name: debouncedName || undefined,
            usage: debouncedUsageFilter || undefined,
            sort_by: sortBy !== "name" ? sortBy : undefined,
            sort_direction: sortDirection !== "asc" ? sortDirection : undefined,
        });
    }, [debouncedName, debouncedUsageFilter, sortBy, sortDirection]);

    useEffect(() => {
        if (!hydratedRef.current) {
            hydratedRef.current = true;
            return;
        }

        setIsRefreshing(true);
        void fetchTagsPage(1, { replace: true }).finally(() => {
            setIsRefreshing(false);
        });
    }, [fetchTagsPage]);

    useEffect(() => {
        if (!loadMoreRef.current || !pagination.has_more) {
            return;
        }

        const node = loadMoreRef.current;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingMore) {
                setLoadingMore(true);
                void fetchTagsPage(pagination.current_page + 1, { replace: false }).finally(() => setLoadingMore(false));
            }
        }, { rootMargin: "240px 0px" });

        observer.observe(node);
        return () => observer.disconnect();
    }, [fetchTagsPage, loadingMore, pagination.current_page, pagination.has_more]);

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

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            if (isBulkDelete) {
                const response = await removeTags(selectedRows);
                const results = response.results || [];
                const failed = results.filter((r: any) => !r.ok);
                
                if (failed.length > 0) {
                    const errorDetail = failed.map((r: any) => {
                        const errorMsg = r.error_code ? t(`master.tags.errors.${r.error_code}`) : t("master.tags.messages.delete_error");
                        return `${r.name}: ${errorMsg}`;
                    }).join("\n");

                    notify.error({
                        title: t("master.tags.messages.bulk_delete_partial_error"),
                        detail: errorDetail,
                    });
                } else {
                    notify.success(t("master.tags.messages.delete_success"));
                }
            } else if (selectedTag) {
                await removeTag(selectedTag.id);
                notify.success(t("master.tags.messages.delete_success"));
            }
            
            await fetchTagsPage(1, { replace: true });
            setShowDeleteModal(false);
            setSelectedRows([]);
        } catch (error: any) {
            const parsed = parseApiError(error, t("master.tags.messages.delete_error"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedRows(tags.map((t) => t.id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedRows((prev) => [...prev, id]);
        } else {
            setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
        }
    };

    return (
        <>
            <Head title={t("master.tags.title")} />
            <TenantPageTitle title={t("master.tags.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

            <Row>
                <Col lg={12}>
                    <Card id="tagsList">
                        <Card.Header className="border-0 align-items-center d-flex">
                            <h4 className="card-title mb-0 flex-grow-1">{t("master.tags.title")}</h4>
                            <div className="d-flex gap-2">
                                {selectedRows.length > 1 && permissions.delete ? (
                                    <Button
                                        variant="soft-danger"
                                        size="sm"
                                        onClick={() => {
                                            setIsBulkDelete(true);
                                            setSelectedTag(null);
                                            setShowDeleteModal(true);
                                        }}
                                        data-testid="bulk-delete-btn"
                                    >
                                        <i className="ri-delete-bin-line align-bottom me-1"></i>
                                        {t("master.common.buttons.delete_selected")} ({selectedRows.length})
                                    </Button>
                                ) : null}
                                {permissions.create ? (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => { setSelectedTag(null); setShowModal(true); }}
                                        data-testid="add-btn"
                                    >
                                        <i className="ri-add-line align-bottom me-1"></i> {t("master.tags.add_new")}
                                    </Button>
                                ) : null}
                            </div>
                        </Card.Header>

                        <Card.Body>
                            <div className="table-responsive table-card mb-3">
                                <table className="table align-middle table-nowrap table-striped table-hover" id="tagTable" style={{ tableLayout: "fixed", minWidth: "560px" }}>
                                    <thead className="table-light text-muted">
                                        <tr className="text-uppercase">
                                            <th style={{ width: "40px" }}>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={tags.length > 0 && selectedRows.length === tags.length}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </div>
                                            </th>
                                            <th style={{ width: "40%" }}><SortableHeader label={t("master.tags.headers.name")} isActive={sortBy === "name"} direction={sortDirection} onToggle={() => handleSort("name")} /></th>
                                            <th style={{ width: "36%" }}><SortableHeader label={t("master.tags.headers.usage")} isActive={sortBy === "usage_count"} direction={sortDirection} onToggle={() => handleSort("usage_count")} /></th>
                                            <th style={{ width: "96px" }}>{t("master.common.headers.action")}</th>
                                        </tr>
                                        <tr>
                                            <th></th>
                                            <th><HeaderTextFilter value={nameFilter} placeholder={t("master.common.search_placeholder")} onChange={setNameFilter} data-testid="tag-name-filter" /></th>
                                            <th><HeaderNumberExpressionFilter value={usageFilter} placeholder={t("master.common.filters.number_expression")} onChange={setUsageFilter} data-testid="tag-usage-filter" /></th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="list">
                                        {tags.map((tag) => (
                                            <tr key={tag.id} data-testid="tag-row">
                                                <td>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedRows.includes(tag.id)}
                                                            onChange={(e) => handleSelectRow(tag.id, e.target.checked)}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span 
                                                        className="badge"
                                                        style={{ 
                                                            backgroundColor: tag.color || "#677abd", 
                                                            color: "#fff", 
                                                            fontSize: "0.85rem", 
                                                            padding: "0.35em 0.65em" 
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </span>
                                                </td>
                                                <td><span className="text-muted">{t("master.tags.usage_template", { count: Math.max(0, Number(tag.usage_count || 0)) })}</span></td>
                                                <td>
                                                    <Dropdown>
                                                        <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none p-0">
                                                            <i className="ri-more-fill align-middle"></i>
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu className="dropdown-menu-end">
                                                            <Dropdown.Item onClick={() => { setSelectedTag(tag); setIsBulkDelete(false); setShowModal(true); }} data-testid="edit-btn">
                                                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> {t("master.categories.actions.edit")}
                                                            </Dropdown.Item>
                                                            <Dropdown.Divider />
                                                            <Dropdown.Item className="text-danger" onClick={() => { setSelectedTag(tag); setIsBulkDelete(false); setShowDeleteModal(true); }} data-testid="delete-btn">
                                                                <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> {t("master.categories.actions.delete")}
                                                            </Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </td>
                                            </tr>
                                        ))}
                                        {tags.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4">{t("master.categories.messages.no_result")}</td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>

                            <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                <Col sm>
                                    <div className="text-muted">
                                        {t("master.common.pagination.loaded_of_total", { loaded: tags.length, total: pagination.total })}
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
                    <TagModal show={showModal} onClose={() => setShowModal(false)} onSuccess={() => fetchTagsPage(1, { replace: true })} tag={selectedTag} />
                </Suspense>
            ) : null}

            <DeleteModal 
                show={showDeleteModal} 
                onCloseClick={() => setShowDeleteModal(false)} 
                onDeleteClick={confirmDelete} 
                loading={isDeleting} 
                message={isBulkDelete ? t("master.tags.messages.bulk_delete_confirm", { count: selectedRows.length }) : undefined}
            />
        </>
    );
};

TagsIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default TagsIndex;
