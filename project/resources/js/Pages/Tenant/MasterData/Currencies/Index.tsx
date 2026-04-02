import { Head } from "@inertiajs/react";
import axios from "axios";
import React, { useMemo, useState } from "react";
import { Container, Card, Row, Col, Button, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import DeleteModal from "../../../../Components/Common/DeleteModal";
import TableContainer from "../../../../Components/Common/TableContainer";
import TenantPageTitle from "../../../../Components/Common/TenantPageTitle";
import TenantLayout from "../../../../Layouts/TenantLayout";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

import CurrencyModal from "./components/CurrencyModal";

interface CurrenciesProps {
  currencies: any[];
  permissions: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

const CurrenciesIndex = ({ currencies: initialCurrencies, permissions }: CurrenciesProps) => {
  const { t } = useTranslation();
  const tenantRoute = useTenantRoute();
  const [currencies, setCurrencies] = useState(initialCurrencies);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCurrencies = async () => {
    try {
      const res = await axios.get(tenantRoute.apiTo("/master/currencies"));
      setCurrencies(res.data.data || res.data);
    } catch {
      console.error("Failed to refresh currencies");
    }
  };

  const handleEdit = (currency: any) => {
    setSelectedCurrency(currency);
    setShowModal(true);
  };

  const handleDelete = (currency: any) => {
    setSelectedCurrency(currency);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedCurrency) return;
    setIsDeleting(true);
    try {
      await axios.delete(tenantRoute.apiTo(`/master/currencies/${selectedCurrency.code}`));
      notify.success(t("master.currencies.messages.delete_success"));
      fetchCurrencies();
      setShowDeleteModal(false);
    } catch {
      notify.error(t("master.currencies.messages.delete_error"));
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
      header: t("master.currencies.headers.symbol"),
      accessorKey: "symbol",
    },
    {
      header: t("master.currencies.headers.position"),
      accessorKey: "symbol_position",
      cell: (info: any) => <span className="text-capitalize">{info.getValue()}</span>,
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
      <Head title={t("master.currencies.title")} />
      <TenantPageTitle title={t("master.currencies.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

      <Row>
        <Col lg={12}>
          <Card>
              <Card.Header className="d-flex align-items-center border-0 pt-4 px-4 bg-transparent">
                <h5 className="card-title mb-0 flex-grow-1">{t("master.currencies.subtitle")}</h5>
                {permissions.create && (
                  <div className="flex-shrink-0">
                    <Button
                      variant="primary"
                      className="btn-sm"
                      onClick={() => {
                        setSelectedCurrency(null);
                        setShowModal(true);
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i> {t("master.currencies.add_new")}
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body className="p-4">
                <TableContainer
                  columns={columns}
                  data={currencies}
                  isGlobalFilter={true}
                  SearchPlaceholder={t("master.currencies.search_placeholder")}
                  customPageSize={20}
                  divClass="table-responsive"
                  tableClass="align-middle table-nowrap"
                  theadClass="table-light"
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <CurrencyModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={fetchCurrencies}
          currency={selectedCurrency}
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

CurrenciesIndex.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default CurrenciesIndex;
