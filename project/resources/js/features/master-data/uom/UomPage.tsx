import { Head } from "@inertiajs/react";
import React, { Suspense, lazy, useMemo, useState } from "react";
import { Card, Row, Col, Badge, Button, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import TenantPageTitle from "@/components/layouts/TenantPageTitle";
import DeleteModal from "@/components/ui/DeleteModal";
import Pagination from "@/components/ui/Pagination";
import { notify } from "@/core/lib/notify";
import { useMasterData } from "@/features/master-data/hooks/useMasterData";
import { MasterDataPermissions, Uom } from "@/features/master-data/types";
import TenantLayout from "@/layouts/TenantLayout";


const UomModal = lazy(() => import("./components/UomModal"));

interface UomProps {
  units: Uom[];
  dimensionTypes: string[];
  permissions: MasterDataPermissions;
}

const UomIndex = ({ units: initialUnits, dimensionTypes, permissions }: UomProps) => {
  const { t } = useTranslation();
  const { refreshUom, removeUom } = useMasterData();
  const [units, setUnits] = useState(initialUnits);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Uom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchUnits = async () => {
    try {
      const nextUnits = await refreshUom();
      setUnits(nextUnits);
    } catch {
      console.error("Failed to refresh units");
    }
  };

  const handleEdit = (unit: Uom) => {
    setSelectedUnit(unit);
    setShowModal(true);
  };

  const handleDelete = (unit: Uom) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedUnit) return;
    setIsDeleting(true);
    try {
      await removeUom(selectedUnit.id);
      notify.success(t("master.uom.messages.delete_success"));
      fetchUnits();
      setShowDeleteModal(false);
    } catch {
      notify.error(t("master.uom.messages.delete_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchesSearch = !searchTerm || 
        u.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDimension = dimensionFilter === "all" || u.dimension_type === dimensionFilter;
      return matchesSearch && matchesDimension;
    });
  }, [units, searchTerm, dimensionFilter]);

  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUnits.slice(startIndex, startIndex + pageSize);
  }, [filteredUnits, currentPage, pageSize]);



  return (
    <>
      <Head title={t("master.uom.title")} />
      <TenantPageTitle title={t("master.uom.title")} parentLabel={t("layout.shell.nav.items.master_data")} />

      <Row>
        <Col lg={12}>
          <Card id="uomList">
            <Card.Header className="border-0 align-items-center d-flex">
              <h4 className="card-title mb-0 flex-grow-1">{t("master.uom.title")}</h4>
              {permissions.create && (
                <div className="flex-shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
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

            <Card.Body className="border border-dashed border-start-0 border-end-0">
              <Row className="g-3">
                <Col md={8}>
                  <div className="search-box">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t("master.uom.search_placeholder")}
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
                  <select
                    className="form-select"
                    value={dimensionFilter}
                    onChange={(e) => {
                      setDimensionFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Dimensions</option>
                    {dimensionTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
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
                <table className="table align-middle table-nowrap table-striped table-hover" id="uomTable">
                  <thead className="table-light text-muted text-uppercase">
                    <tr>
                      <th className="sort">{t("master.common.headers.code")}</th>
                      <th className="sort">{t("master.common.headers.name")}</th>
                      <th className="sort">{t("master.uom.headers.symbol")}</th>
                      <th className="sort">{t("master.uom.headers.dimension")}</th>
                      <th className="sort">{t("master.uom.headers.factor")}</th>
                      <th className="sort">{t("master.common.headers.status")}</th>
                      <th className="sort">{t("master.common.headers.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="list">
                    {paginatedUnits.map((unit, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold">{unit.code}</td>
                        <td>{unit.name}</td>
                        <td><Badge bg="light" className="text-body">{unit.abbreviation}</Badge></td>
                        <td className="text-capitalize">{unit.dimension_type}</td>
                        <td>{unit.base_factor}</td>
                        <td>
                          <span className={`badge bg-${unit.is_active ? 'success' : 'danger'}`}>
                            {unit.is_active ? t("master.common.status.active") : t("master.common.status.inactive")}
                          </span>
                        </td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none p-0">
                              <i className="ri-more-fill align-middle"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="dropdown-menu-end">
                              <Dropdown.Item onClick={() => handleEdit(unit)}>
                                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" onClick={() => handleDelete(unit)}>
                                <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                    {paginatedUnits.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4">No results found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
                <Col sm>
                  <div className="text-muted">
                    Showing <span className="fw-semibold">{paginatedUnits.length}</span> of <span className="fw-semibold">{filteredUnits.length}</span> Results
                  </div>
                </Col>
                <Col sm="auto">
                  <Pagination
                    totalItems={filteredUnits.length}
                    currentPage={currentPage}
                    perPageData={pageSize}
                    setCurrentPage={setCurrentPage}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

        {showModal ? (
          <Suspense fallback={null}>
            <UomModal
              show={showModal}
              onClose={() => setShowModal(false)}
              onSuccess={fetchUnits}
              unit={selectedUnit}
              dimensionTypes={dimensionTypes}
              units={units}
            />
          </Suspense>
        ) : null}

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
