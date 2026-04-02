import { Head } from "@inertiajs/react";
import axios from "axios";
import React, { useMemo, useState, useEffect } from "react";
import {
    Container,
    Card,
    Row,
    Col,
    Badge,
    Button,
    Form
} from "react-bootstrap";
import { useTranslation } from "react-i18next";

import DeleteModal from "../../../../Components/Common/DeleteModal";
import TenantPageTitle from "../../../../Components/Common/TenantPageTitle";
import TenantLayout from "../../../../Layouts/TenantLayout";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";
import { parseApiError } from "../../../../common/apiError";

import CategoryModal from "./components/CategoryModal";
import CategoriesWidgets from "./components/CategoriesWidgets";

interface CategoriesProps {
    categories: any[];
    modules: string[];
    permissions: {
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

const CategoriesIndex = ({ categories: initialCategories, modules, permissions }: CategoriesProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    
    const [activeTab, setActiveTab] = useState(modules[0] || "finance");
    const [categories, setCategories] = useState(initialCategories);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(tenantRoute.apiTo("/master/categories"), {
                params: { module: activeTab }
            });
            const data = res.data.data;
            if (data && data.categories) {
                setCategories(data.categories);
            }
        } catch (err: any) {
            console.error("Failed to refresh categories", err);
        }
    };

    // Flattening logic for nested display
    const flattenCategories = (items: any[], depth = 0): any[] => {
        if (!Array.isArray(items)) return [];
        let result: any[] = [];
        items.forEach(item => {
            result.push({ ...item, depth });
            if (item.children && item.children.length > 0) {
                result = [...result, ...flattenCategories(item.children, depth + 1)];
            }
        });
        return result;
    };

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
    }, [categories, searchTerm]);

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

    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setShowModal(true);
    };

    const handleDelete = (category: any) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedCategory) return;
        setIsDeleting(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/master/categories/${selectedCategory.id}`), {
                data: { row_version: selectedCategory.row_version }
            });
            notify.success("Category deleted successfully");
            fetchCategories();
            setShowDeleteModal(false);
        } catch (err: any) {
            const parsed = parseApiError(err, "Failed to delete category");
            notify.error({
                title: parsed.title,
                detail: parsed.detail
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} items?`)) return;

        try {
            await axios.delete(tenantRoute.apiTo("/master/categories"), {
                data: { ids: selectedRows }
            });
            notify.success("Bulk delete successful");
            setSelectedRows([]);
            fetchCategories();
        } catch {
            notify.error("Bulk delete failed");
        }
    };

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
            <Head title="Master Data Categories" />
            <TenantPageTitle title="Categories" parentLabel="Master Data" />

                    <CategoriesWidgets {...stats} />

                    <Row>
                        <Col lg={12}>
                            <Card id="categoryList">
                        <Card.Header className="border-0 align-items-center d-flex">
                            <h4 className="card-title mb-0 flex-grow-1">Categories</h4>
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
                                        <i className="ri-add-line align-bottom me-1"></i> Create Category
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
                                            placeholder="Search for category or something..."
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
                                        {modules.map(mod => (
                                            <option key={mod} value={mod}>{mod.toUpperCase()}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Button variant="primary" className="w-100">
                                        <i className="ri-equalizer-fill me-1 align-bottom"></i> Filters
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
                                            <th className="sort" data-sort="name">Category Name</th>
                                            <th className="sort" data-sort="module">Module</th>
                                            <th className="sort" data-sort="type">Type</th>
                                            <th className="sort" data-sort="status">Status</th>
                                            <th className="sort" data-sort="action">Action</th>
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
                                                                {category.is_default && <Badge bg="light" className="text-muted ms-2 px-1">System</Badge>}
                                                            </div>
                                                        </td>
                                                        <td className="module">{category.module}</td>
                                                        <td className="type">
                                                            <span className="text-capitalize">{category.sub_type || "-"}</span>
                                                        </td>
                                                        <td className="status">
                                                            <Badge bg={category.is_active ? "success" : "danger"} className={category.is_active ? "badge-soft-success" : "badge-soft-danger"}>
                                                                {category.is_active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <ul className="list-inline hstack gap-2 mb-0">
                                                                <li className="list-inline-item edit" title="Edit">
                                                                    <button className="btn btn-sm btn-soft-primary" onClick={() => handleEdit(category)}>
                                                                        <i className="ri-pencil-fill align-bottom"></i>
                                                                    </button>
                                                                </li>
                                                                {!category.is_default && (
                                                                    <li className="list-inline-item" title="Remove">
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
                                                    <h5 className="mt-2">Sorry! No Result Found</h5>
                                                    <p className="text-muted mb-0">We've searched all categories but did not find any matching your search.</p>
                                                </div>
                                            </div>
                                        )}
                                     </div>

                                    {/* Pagination Controls */}
                                    <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                                        <Col sm>
                                            <div className="text-muted">
                                                Showing <span className="fw-semibold">{paginatedCategories.length}</span> of <span className="fw-semibold">{filteredCategories.length}</span> Results
                                            </div>
                                        </Col>
                                        <Col sm="auto">
                                            <ul className="pagination pagination-separated pagination-sm justify-content-center justify-content-sm-start mb-0">
                                                <li className={currentPage <= 1 ? "page-item disabled" : "page-item"}>
                                                    <Button variant="link" className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</Button>
                                                </li>
                                                {/* Logic for direct page numbers if needed, for now just 1...N */}
                                                {Array.from({ length: Math.ceil(filteredCategories.length / pageSize) }).map((_, idx) => (
                                                    <li key={idx} className={currentPage === idx + 1 ? "page-item active" : "page-item"}>
                                                        <Button variant="link" className="page-link" onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</Button>
                                                    </li>
                                                ))}
                                                <li className={currentPage >= Math.ceil(filteredCategories.length / pageSize) ? "page-item disabled" : "page-item"}>
                                                    <Button variant="link" className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                                                </li>
                                            </ul>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

            <CategoryModal 
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchCategories}
                category={selectedCategory}
                module={activeTab}
                parents={flattenCategories(categories.filter(c => c.module === activeTab)).filter(p => !selectedCategory || p.id !== selectedCategory.id)}
            />

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
