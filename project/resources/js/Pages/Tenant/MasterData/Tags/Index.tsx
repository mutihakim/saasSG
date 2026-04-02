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
          <Card>
              <Card.Header className="d-flex align-items-center border-0 pt-4 px-4 bg-transparent">
                <h5 className="card-title mb-0 flex-grow-1">{t("master.tags.subtitle")}</h5>
                {permissions.create && (
                  <div className="flex-shrink-0">
                    <Button 
                        variant="primary" 
                        className="btn-sm"
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
              <Card.Body className="p-4">
                <TableContainer
                  columns={columns}
                  data={tags}
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
