import { Head } from "@inertiajs/react";
import axios from "axios";
import React, { useMemo, useState } from "react";
import { Container, Card, Row, Col, Badge, Tabs, Tab, Button, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import DeleteModal from "../../../../Components/Common/DeleteModal";
import TableContainer from "../../../../Components/Common/TableContainer";
import TenantPageTitle from "../../../../Components/Common/TenantPageTitle";
import TenantLayout from "../../../../Layouts/TenantLayout";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

import CategoryModal from "./components/CategoryModal";

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

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.module === activeTab);
  }, [categories, activeTab]);

  const fetchCategories = async () => {
    try {
        const res = await axios.get(tenantRoute.apiTo("/finance/categories"));
        setCategories(res.data.data || res.data);
    } catch {
        console.error("Failed to refresh categories");
    }
  };

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
      await axios.delete(tenantRoute.apiTo(`/finance/categories/${selectedCategory.id}`));
      notify.success(t("master.categories.messages.delete_success"));
      fetchCategories();
      setShowDeleteModal(false);
    } catch {
      notify.error(t("master.categories.messages.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: t("master.categories.headers.name"),
      accessorKey: "name",
      cell: (info: any) => {
        const row = info.row.original;
        return (
          <div className="d-flex align-items-center">
            {row.icon && (
                <div className="avatar-xxs me-2 text-center">
                    <span className={`avatar-title bg-soft-${row.color || 'primary'} text-${row.color || 'primary'} rounded fs-12 px-1`}>
                        <i className={row.icon}></i>
                    </span>
                </div>
            )}
            <span className="fw-semibold">{info.getValue()}</span>
            {row.is_default && <Badge bg="light" className="text-muted ms-2 px-1">{t("master.common.status.system")}</Badge>}
          </div>
        );
      },
    },
    {
        header: t("master.categories.headers.type"),
        accessorKey: "sub_type",
        cell: (info: any) => <span className="text-capitalize">{info.getValue() || t("master.categories.types.generic")}</span>,
    },
    {
        header: t("master.common.headers.status"),
        accessorKey: "is_active",
        cell: (info: any) => (
            <span className={`badge bg-${info.getValue() ? 'success' : 'danger'}`}>
                {info.getValue() ? t("master.common.status.active") : t("master.common.status.inactive")}
            </span>
        )
    },
    {
        header: t("master.common.headers.action"),
        id: "actions",
        cell: (info: any) => {
            const row = info.row.original;
            if (row.is_default) return null;
            return (
                <Dropdown>
                    <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none">
                        <i className="ri-more-fill align-middle"></i>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown-menu-end">
                        <Dropdown.Item onClick={() => handleEdit(row)}>
                            <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger" onClick={() => handleDelete(row)}>
                            <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            );
        }
    }
  ], [t]);

  return (
    <>
      <Head title={t("master.categories.title")} />
      <TenantPageTitle title={t("master.categories.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

      <Row>
        <Col lg={12}>
          <Card>
                <Card.Header className="border-0 pt-4 px-4 bg-transparent">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <nav>
                        <Tabs
                          activeKey={activeTab}
                          onSelect={(k: any) => setActiveTab(k)}
                          className="nav-tabs-custom card-header-tabs border-bottom-0"
                        >
                          {modules.map(mod => (
                            <Tab eventKey={mod} title={mod.toUpperCase()} key={mod} />
                          ))}
                        </Tabs>
                      </nav>
                    </div>
                    {permissions.create && (
                       <div className="flex-shrink-0">
                          <Button 
                            variant="primary" 
                            className="btn-sm"
                            onClick={() => {
                                setSelectedCategory(null);
                                setShowModal(true);
                            }}
                          >
                            <i className="ri-add-line align-bottom me-1"></i> {t("master.categories.add_new")}
                          </Button>
                       </div>
                    )}
                  </div>
                </Card.Header>
              <Card.Body className="p-4">
                <TableContainer
                  columns={columns}
                  data={filteredCategories}
                  isGlobalFilter={true}
                  SearchPlaceholder={t("master.common.search_placeholder")}
                  customPageSize={20}
                  divClass="table-responsive"
                  tableClass="align-middle table-nowrap"
                  theadClass="table-light"
                />
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
            parents={categories.filter(c => c.module === activeTab && !c.parent_id)}
        />

        <DeleteModal
            show={showDeleteModal}
            onCloseClick={() => setShowDeleteModal(false)}
            onDeleteClick={confirmDelete}
            loading={isDeleting}
        />
    </>
  );
};

CategoriesIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default CategoriesIndex;

