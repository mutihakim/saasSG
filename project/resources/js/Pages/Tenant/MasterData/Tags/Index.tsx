import { Head } from "@inertiajs/react";
import axios from "axios";
import React, { useMemo, useState } from "react";
import { Container, Card, Row, Col, Badge, Button, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import DeleteModal from "../../../../Components/Common/DeleteModal";
import TableContainer from "../../../../Components/Common/TableContainer";
import TenantPageTitle from "../../../../Components/Common/TenantPageTitle";
import TenantLayout from "../../../../Layouts/TenantLayout";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

import TagModal from "./components/TagModal";

interface TagsProps {
  tags: any[];
  permissions: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

const TagsIndex = ({ tags: initialTags, permissions }: TagsProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const [tags, setTags] = useState(initialTags);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchTags = async () => {
    try {
        const res = await axios.get(tenantRoute.apiTo("/finance/tags/suggest"));
        setTags(res.data.data.tags || []);
    } catch {
        console.error("Failed to refresh tags");
    }
  };

  const handleEdit = (tag: any) => {
    setSelectedTag(tag);
    setShowModal(true);
  };

  const handleDelete = (tag: any) => {
    setSelectedTag(tag);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTag) return;
    setIsDeleting(true);
    try {
      await axios.delete(tenantRoute.apiTo(`/finance/tags/${selectedTag.id}`));
      notify.success(t("master.tags.messages.delete_success"));
      fetchTags();
      setShowDeleteModal(false);
    } catch {
      notify.error(t("master.tags.messages.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTags = useMemo(() => {
    if (!searchTerm) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tags, searchTerm]);

  const paginatedTags = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTags.slice(startIndex, startIndex + pageSize);
  }, [filteredTags, currentPage, pageSize]);

  const columns = useMemo(() => [
    {
      header: t("master.tags.headers.name"),
      accessorKey: "name",
      cell: (info: any) => {
        const row = info.row.original;
        return (
          <Badge 
            style={{ 
                backgroundColor: row.color || '#677abd',
                color: '#fff',
                fontSize: '0.85rem',
                padding: '0.35em 0.65em'
            }}
          >
            {info.getValue()}
          </Badge>
        );
      },
    },
    {
      header: t("master.tags.headers.usage"),
      accessorKey: "usage_count",
      cell: (info: any) => <span className="text-muted">{t("master.tags.usage_template", { count: info.getValue() })}</span>,
    },
    {
        header: t("master.common.headers.action"),
        id: "actions",
        cell: (info: any) => {
            const row = info.row.original;
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
      <Head title={t("master.tags.title")} />
      <TenantPageTitle title={t("master.tags.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

      <Row>
        <Col lg={12}>
          <Card id="tagsList">
            <Card.Header className="border-0 align-items-center d-flex">
              <h4 className="card-title mb-0 flex-grow-1">{t("master.tags.title")}</h4>
              {permissions.create && (
                <div className="flex-shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setSelectedTag(null);
                      setShowModal(true);
                    }}
                  >
                    <i className="ri-add-line align-bottom me-1"></i> {t("master.tags.add_new")}
                  </Button>
                </div>
              )}
            </Card.Header>

            <Card.Body className="border border-dashed border-start-0 border-end-0">
              <Row className="g-3">
                <Col md={10}>
                  <div className="search-box">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("master.common.search_placeholder")}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                    <i className="ri-search-line search-icon"></i>
                  </div>
                </Col>
                <Col md={2}>
                  <Button variant="primary" className="w-100">
                    <i className="ri-equalizer-fill me-1 align-bottom"></i> Filters
                  </Button>
                </Col>
              </Row>
            </Card.Body>

            <Card.Body>
              <div className="table-responsive table-card mb-3">
                <table className="table align-middle table-nowrap table-striped table-hover" id="tagTable">
                  <thead className="table-light text-muted text-uppercase">
                    <tr>
                      <th className="sort">{t("master.tags.headers.name")}</th>
                      <th className="sort">{t("master.tags.headers.usage")}</th>
                      <th className="sort">{t("master.common.headers.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="list">
                    {paginatedTags.map((tag, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge 
                            style={{ 
                                backgroundColor: tag.color || '#677abd',
                                color: '#fff',
                                fontSize: '0.85rem',
                                padding: '0.35em 0.65em'
                            }}
                          >
                            {tag.name}
                          </Badge>
                        </td>
                        <td>
                          <span className="text-muted">{t("master.tags.usage_template", { count: tag.usage_count })}</span>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none p-0">
                              <i className="ri-more-fill align-middle"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="dropdown-menu-end">
                              <Dropdown.Item onClick={() => handleEdit(tag)}>
                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" onClick={() => handleDelete(tag)}>
                                <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                    {paginatedTags.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-4">No results found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                <Col sm>
                  <div className="text-muted">
                    Showing <span className="fw-semibold">{paginatedTags.length}</span> of <span className="fw-semibold">{filteredTags.length}</span> Results
                  </div>
                </Col>
                <Col sm="auto">
                  <ul className="pagination pagination-separated pagination-sm justify-content-center justify-content-sm-start mb-0">
                    <li className={currentPage <= 1 ? "page-item disabled" : "page-item"}>
                      <Button variant="link" className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</Button>
                    </li>
                    {Array.from({ length: Math.ceil(filteredTags.length / pageSize) }).map((_, idx) => (
                      <li key={idx} className={currentPage === idx + 1 ? "page-item active" : "page-item"}>
                        <Button variant="link" className="page-link" onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</Button>
                      </li>
                    ))}
                    <li className={currentPage >= Math.ceil(filteredTags.length / pageSize) ? "page-item disabled" : "page-item"}>
                      <Button variant="link" className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                    </li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

        <TagModal 
            show={showModal}
            onClose={() => setShowModal(false)}
            onSuccess={fetchTags}
            tag={selectedTag}
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

TagsIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default TagsIndex;
