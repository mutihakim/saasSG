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

import UomModal from "./components/UomModal";

interface UomProps {
  units: any[];
  dimensionTypes: string[];
  permissions: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

const UomIndex = ({ units: initialUnits, dimensionTypes, permissions }: UomProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const [units, setUnits] = useState(initialUnits);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUnits = async () => {
    try {
      const res = await axios.get(tenantRoute.apiTo("/master/uom"));
      setUnits(res.data.data || res.data);
    } catch {
      console.error("Failed to refresh units");
    }
  };

  const handleEdit = (unit: any) => {
    setSelectedUnit(unit);
    setShowModal(true);
  };

  const handleDelete = (unit: any) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUnit) return;
    setIsDeleting(true);
    try {
      await axios.delete(tenantRoute.apiTo(`/master/uom/${selectedUnit.code}`));
      notify.success(t("master.uom.messages.delete_success"));
      fetchUnits();
      setShowDeleteModal(false);
    } catch {
      notify.error(t("master.uom.messages.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: t("master.common.headers.code"),
      accessorKey: "code",
      cell: (info: any) => <span className="fw-bold">{info.getValue()}</span>,
    },
    {
      header: t("master.common.headers.name"),
      accessorKey: "name",
    },
    {
      header: t("master.uom.headers.symbol"),
      accessorKey: "abbreviation",
      cell: (info: any) => <Badge bg="light" className="text-body">{info.getValue()}</Badge>,
    },
    {
      header: t("master.uom.headers.dimension"),
      accessorKey: "dimension_type",
      cell: (info: any) => <span className="text-capitalize">{info.getValue()}</span>,
    },
    {
      header: t("master.uom.headers.factor"),
      accessorKey: "base_factor",
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
      <Head title={t("master.uom.title")} />
      <TenantPageTitle title={t("master.uom.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

      <Row>
        <Col lg={12}>
          <Card>
              <Card.Header className="d-flex align-items-center border-0 pt-4 px-4 bg-transparent">
                <h5 className="card-title mb-0 flex-grow-1">{t("master.uom.subtitle")}</h5>
                {permissions.create && (
                  <div className="flex-shrink-0">
                    <Button
                      variant="primary"
                      className="btn-sm"
                      onClick={() => {
                        setSelectedUnit(null);
                        setShowModal(true);
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> {t("master.uom.add_new")}
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body className="p-4">
                <TableContainer
                  columns={columns}
                  data={units}
                  isGlobalFilter={true}
                  SearchPlaceholder={t("master.uom.search_placeholder")}
                  customPageSize={20}
                  divClass="table-responsive"
                  tableClass="align-middle table-nowrap"
                  theadClass="table-light"
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <UomModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={fetchUnits}
          unit={selectedUnit}
          dimensionTypes={dimensionTypes}
          units={units}
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

UomIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default UomIndex;
