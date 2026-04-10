import { Head } from "@inertiajs/react";
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import {
    Card,
    Row,
    Col,
    Badge,
    Button,
    Form
} from "react-bootstrap";
import { useTranslation } from "react-i18next";

import TenantPageTitle from "@/components/layouts/TenantPageTitle";
import DeleteModal from "@/components/ui/DeleteModal";
import Pagination from "@/components/ui/Pagination";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { Category, MasterDataPermissions, MasterDataModule } from "@/features/master-data/types";
import TenantLayout from "@/layouts/TenantLayout";


const CategoriesWidgets = lazy(() => import("./components/CategoriesWidgets"));
const CategoryModal = lazy(() => import("./components/CategoryModal"));

interface CategoriesProps {
    categories: Category[];
    modules: MasterDataModule[];
    permissions: MasterDataPermissions;
}

const truncateText = (value: string | null | undefined, max = 96) => {
    const normalized = (value || "").trim();
    if (normalized.length <= max) {
        return normalized;
    }

    return `${normalized.slice(0, max - 1)}...`;
};

const CategoriesIndex = ({ categories: initialCategories, modules, permissions }: CategoriesProps) => {
    const { t } = useTranslation();
    const { refreshCategories, removeCategory } = useMasterData();
    
    const [activeTab, setActiveTab] = useState("all"); // Changed from modules[0] to "all"
    const [categories, setCategories] = useState(initialCategories);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const fetchCategories = useCallback(async () => {
        try {
            const module = activeTab !== "all" ? activeTab : undefined;
            const nextCategories = await refreshCategories(module);
            setCategories(nextCategories);
        } catch (err: any) {
            console.error("Failed to refresh categories", err);
        }
    }, [activeTab, refreshCategories]);

    // Fetch categories when activeTab changes
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Flattening logic for nested display
    const flattenCategories = useCallback((items: any[], depth = 0): any[] => {
        if (!Array.isArray(items)) return [];
        let result: any[] = [];
        items.forEach(item => {
            result.push({ ...item, depth });
            if (item.children && item.children.length > 0) {
                result = [...result, ...flattenCategories(item.children, depth + 1)];
            }
        });
        return result;
    }, []);

    const filteredCategories = useMemo(() => {
        if (!Array.isArray(categories)) return [];
        
        const flattened = flattenCategories(categories);
        
        let filtered = flattened;
        if (searchTerm) {
            filtered = flattened.filter(c => 
                c.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [categories, flattenCategories, searchTerm]);

    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredCategories.slice(startIndex, startIndex + pageSize);
    }, [filteredCategories, currentPage, pageSize]);

    // Statistics for widgets
    const stats = useMemo(() => {
        if (!Array.isArray(categories)) return { total: 0, finance: 0, grocery: 0, task: 0 };
        return {
            total: categories.length,
            finance: categories.filter(c => c.module === 'finance').length,
            grocery: categories.filter(c => c.module === 'grocery').length,
            task: categories.filter(c => c.module === 'task').length,
        };
    }, [categories]);

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    const handleDelete = (category: Category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = useCallback(async () => {
        if (!selectedCategory) return;
        setIsDeleting(true);
        try {
            await removeCategory(selectedCategory.id, selectedCategory.row_version);
            notify.success(t("master.categories.messages.delete_success"));
            fetchCategories();
            setShowDeleteModal(false);
        } catch (err: any) {
            const parsed = parseApiError(err, t("master.categories.messages.delete_failed"));
            notify.error({
                title: parsed.title,
                detail: parsed.detail
            });
        } finally {
            setIsDeleting(false);
        }
    }, [fetchCategories, removeCategory, selectedCategory, t]);

    const handleSelectRow = (id: number) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleSelectAll = (e: any) => {
        if (e.target.checked) {
            setSelectedRows(filteredCategories.map(c => c.id));
        } else {
            setSelectedRows([]);
        }
    };

    return (
        <React.Fragment>
            <Head title={t("master.categories.title")} />
            <TenantPageTitle title={t("master.categories.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

                    <Suspense fallback={null}>
                        <CategoriesWidgets {...stats} />
                    </Suspense>

                    <Row>
                        <Col lg={12}>
                            <Card id="categoryList">
                        <Card.Header className="border-0 align-items-center d-flex">
                            <h4 className="card-title mb-0 flex-grow-1">{t("master.categories.title")}</h4>
                            {permissions.create && (
                                <div className="flex-shrink-0">
                                    <Button
                                        variant="danger"
                                        className="add-btn"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setShowModal(true);
                                        }}
                                    >
                                        <i className="ri-add-line align-bottom me-1"></i> {t("master.categories.actions.create")}
                                    </Button>
                                </div>
                            )}
                        </Card.Header>

                        <Card.Body className="border border-dashed border-start-0 border-end-0">
                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="search-box">
                                        <Form.Control
                                            type="text"
                                            className="form-control"
                                            placeholder={t("master.categories.search_placeholder")}
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        />
                                        <i className="ri-search-line search-icon"></i>
                                    </div>
                                </Col>
                                <Col md={4}>
                                    <Form.Select
                                        value={activeTab}
                                        onChange={(e) => {
                                            setActiveTab(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value="all">{t("master.categories.filter.show_all")}</option>
                                        {modules.map(mod => (
                                            <option key={mod} value={mod}>{t(`master.categories.modules.${mod}`)}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Button variant="primary" className="w-100">
                                        <i className="ri-equalizer-fill me-1 align-bottom"></i> {t("master.common.buttons.filters")}
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>

                        <Card.Body>
                             <div className="table-responsive table-card">
                                <table className="table align-middle table-nowrap table-striped table-hover" id="categoryTable">
                                    <thead className="table-light text-muted text-uppercase">
                                        <tr>
                                            <th scope="col" style={{ width: "40px" }}>
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="checkAll"
                                                        onChange={handleSelectAll}
                                                        checked={selectedRows.length === paginatedCategories.length && paginatedCategories.length > 0}
                                                    />
                                                </div>
                                            </th>
                                            <th className="sort" data-sort="name">{t("master.categories.headers.name")}</th>
                                            <th className="sort" data-sort="description">{t("master.categories.headers.description")}</th>
                                            <th className="sort" data-sort="module">{t("master.categories.headers.module")}</th>
                                            <th className="sort" data-sort="type">{t("master.categories.headers.type")}</th>
                                            <th className="sort" data-sort="status">{t("master.categories.headers.status")}</th>
                                            <th className="sort" data-sort="action">{t("master.common.headers.action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="list form-check-all">
                                        {paginatedCategories.map((category) => (
                                                    <tr key={category.id}>
                                                        <th scope="row">
                                                            <div className="form-check">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    name="checkAll"
                                                                    value={category.id}
                                                                    checked={selectedRows.includes(category.id)}
                                                                    onChange={() => handleSelectRow(category.id)}
                                                                />
                                                            </div>
                                                        </th>
                                                        <td className="name">
                                                            <div className="d-flex align-items-center" style={{ marginLeft: `${category.depth * 24}px` }}>
                                                                {category.depth > 0 && <i className="ri-corner-down-right-line me-2 text-muted"></i>}
                                                                <div className="flex-shrink-0 me-2 text-center" style={{ width: "24px" }}>
                                                                    <i className={`${category.icon || 'ri-price-tag-3-line'} fs-17 text-${category.color || 'primary'}`}></i>
                                                                </div>
                                                                <div>
                                                                    <h5 className="fs-14 mb-0">
                                                                        <span className="text-reset fw-medium">{category.name}</span>
                                                                    </h5>
                                                                </div>
                                                                {category.is_default && <Badge bg="light" className="text-muted ms-2 px-1">{t("master.categories.badges.system")}</Badge>}
                                                            </div>
                                                        </td>
                                                        <td className="description text-muted">
                                                            {category.description ? (
                                                                <span title={category.description}>{truncateText(category.description)}</span>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                        <td className="module">{category.module}</td>
                                                        <td className="type">
                                                            <span className="text-capitalize">{category.sub_type || "-"}</span>
                                                        </td>
                                                        <td className="status">
                                                            <Badge bg={category.is_active ? "success" : "danger"} className={category.is_active ? "badge-soft-success" : "badge-soft-danger"}>
                                                                {category.is_active ? t("master.categories.status.active") : t("master.categories.status.inactive")}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <ul className="list-inline hstack gap-2 mb-0">
                                                                <li className="list-inline-item edit" title={t("master.categories.actions.edit")}>
                                                                    <button className="btn btn-sm btn-soft-primary" onClick={() => handleEdit(category)}>
                                                                        <i className="ri-pencil-fill align-bottom"></i>
                                                                    </button>
                                                                </li>
                                                                {!category.is_default && (
                                                                    <li className="list-inline-item" title={t("master.categories.actions.delete")}>
                                                                        <button className="btn btn-sm btn-soft-danger" onClick={() => handleDelete(category)}>
                                                                            <i className="ri-delete-bin-fill align-bottom"></i>
                                                                        </button>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredCategories.length === 0 && (
                                            <div className="noresult" style={{ display: "block" }}>
                                                <div className="text-center py-4">
                                                    <i className="ri-search-line display-4 text-muted"></i>
                                                    <h5 className="mt-2">{t("master.categories.messages.no_result")}</h5>
                                                    <p className="text-muted mb-0">{t("master.categories.messages.no_result_detail")}</p>
                                                </div>
                                            </div>
                                        )}
                                     </div>

                                    {/* Pagination Controls */}
                                    <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                        <Col sm>
                                            <div className="text-muted">
                                                {t("master.common.pagination.showing")} <span className="fw-semibold">{paginatedCategories.length}</span> {t("master.common.pagination.of")} <span className="fw-semibold">{filteredCategories.length}</span> {t("master.common.pagination.results")}
                                            </div>
                                        </Col>
                                        <Col sm="auto">
                                            <Pagination
                                                totalItems={filteredCategories.length}
                                                currentPage={currentPage}
                                                perPageData={pageSize}
                                                setCurrentPage={setCurrentPage}
                                                previousLabel={t("master.common.pagination.previous")}
                                                nextLabel={t("master.common.pagination.next")}
                                            />
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

            {showModal ? (
                <Suspense fallback={null}>
                    <CategoryModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        onSuccess={fetchCategories}
                        category={selectedCategory}
                        module={activeTab}
                        parents={flattenCategories(categories.filter(c => c.module === activeTab)).filter(p => !selectedCategory || p.id !== selectedCategory.id)}
                    />
                </Suspense>
            ) : null}

            <DeleteModal
                show={showDeleteModal}
                onCloseClick={() => setShowDeleteModal(false)}
                onDeleteClick={confirmDelete}
                loading={isDeleting}
            />
        </React.Fragment>
    );
};

CategoriesIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default CategoriesIndex;
