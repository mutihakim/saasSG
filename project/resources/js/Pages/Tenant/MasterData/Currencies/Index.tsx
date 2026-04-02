import { Head } from "@inertiajs/react";
import axios from "axios";
import React, { useMemo, useState } from "react";
import { Card, Row, Col, Button, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import DeleteModal from "../../../../Components/Common/DeleteModal";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

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
      await axios.delete(tenantRoute.apiTo(`/master/currencies/${selectedCurrency.id}`));
      notify.success(t("master.currencies.messages.delete_success"));
      fetchCurrencies();
      setShowDeleteModal(false);
    } catch {
      notify.error(t("master.currencies.messages.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCurrencies = useMemo(() => {
    if (!searchTerm) return currencies;
    return currencies.filter(c => 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currencies, searchTerm]);

  const paginatedCurrencies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCurrencies.slice(startIndex, startIndex + pageSize);
  }, [filteredCurrencies, currentPage, pageSize]);



  return (
    <>
      <Head title={t("master.currencies.title")} />
      <TenantPageTitle title={t("master.currencies.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

      <Row>
        <Col lg={12}>
          <Card id="currenciesList">
            <Card.Header className="border-0 align-items-center d-flex">
              <h4 className="card-title mb-0 flex-grow-1">{t("master.currencies.title")}</h4>
              {permissions.create && (
                <div className="flex-shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
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

            <Card.Body className="border border-dashed border-start-0 border-end-0">
              <Row className="g-3">
                <Col md={10}>
                  <div className="search-box">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("master.currencies.search_placeholder")}
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
                <table className="table align-middle table-nowrap table-striped table-hover" id="currencyTable">
                  <thead className="table-light text-muted text-uppercase">
                    <tr>
                      <th className="sort">{t("master.common.headers.code")}</th>
                      <th className="sort">{t("master.common.headers.name")}</th>
                      <th className="sort">{t("master.currencies.headers.symbol")}</th>
                      <th className="sort">{t("master.currencies.headers.position")}</th>
                      <th className="sort">{t("master.common.headers.status")}</th>
                      <th className="sort">{t("master.common.headers.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="list">
                    {paginatedCurrencies.map((currency, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold">{currency.code}</td>
                        <td>{currency.name}</td>
                        <td>{currency.symbol}</td>
                        <td className="text-capitalize">{currency.symbol_position}</td>
                        <td>
                          <span className={`badge bg-${currency.is_active ? 'success' : 'danger'}`}>
                            {currency.is_active ? t("master.common.status.active") : t("master.common.status.inactive")}
                          </span>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none p-0">
                              <i className="ri-more-fill align-middle"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="dropdown-menu-end">
                              <Dropdown.Item onClick={() => handleEdit(currency)}>
                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" onClick={() => handleDelete(currency)}>
                                <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                    {paginatedCurrencies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-4">No results found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                <Col sm>
                  <div className="text-muted">
                    Showing <span className="fw-semibold">{paginatedCurrencies.length}</span> of <span className="fw-semibold">{filteredCurrencies.length}</span> Results
                  </div>
                </Col>
                <Col sm="auto">
                  <ul className="pagination pagination-separated pagination-sm justify-content-center justify-content-sm-start mb-0">
                    <li className={currentPage <= 1 ? "page-item disabled" : "page-item"}>
                      <Button variant="link" className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</Button>
                    </li>
                    {Array.from({ length: Math.ceil(filteredCurrencies.length / pageSize) }).map((_, idx) => (
                      <li key={idx} className={currentPage === idx + 1 ? "page-item active" : "page-item"}>
                        <Button variant="link" className="page-link" onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</Button>
                      </li>
                    ))}
                    <li className={currentPage >= Math.ceil(filteredCurrencies.length / pageSize) ? "page-item disabled" : "page-item"}>
                      <Button variant="link" className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                    </li>
                  </ul>
                </Col>
              </Row>
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
