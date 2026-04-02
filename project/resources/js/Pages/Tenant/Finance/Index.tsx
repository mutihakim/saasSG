import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Col, Form, Modal, Row, Dropdown, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import TableContainer from '../../../Components/Common/TableContainer';
import DeleteModal from '../../../Components/Common/DeleteModal';
import { notify } from '../../../common/notify';
import { useTenantRoute } from '../../../common/tenantRoute';
import { TransactionDate, Category, Description, Amount, PaymentMethod, Tags, Actions } from './components/FinanceCol';
import TransactionModal from './components/TransactionModal';

interface FinanceProps {
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
    permissions: {
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

const FinanceIndex = ({
    categories,
    currencies,
    defaultCurrency,
    paymentMethods,
    permissions
}: FinanceProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [transaction, setTransaction] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const toggle = useCallback(() => {
        if (modal) {
            setModal(false);
            setTransaction(null);
        } else {
            setModal(true);
            setTransaction(null);
        }
    }, [modal]);

    // Fetch data
    const fetchFinanceData = useCallback(async () => {
        try {
            const [transRes] = await Promise.all([
                axios.get(tenantRoute.apiTo("/finance/transactions"))
            ]);
            setTransactions(transRes.data.data?.transactions || []);
        } catch (error: any) {
            if (error.response?.status !== 429) {
                console.error("Error fetching finance data:", error);
                notify.error("Failed to load finance data");
            }
        } finally {
            setLoading(false);
        }
    }, [tenantRoute]);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    // Delete handler
    const onClickDelete = (trans: any) => {
        setTransaction(trans);
        setDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!transaction) return;
        setIsDeleting(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/transactions/${transaction.id}`));
            notify.success(t("finance.messages.success_delete"));
            fetchFinanceData();
            setDeleteModal(false);
        } catch (error: any) {
            notify.error(error.response?.data?.message || "Failed to delete transaction");
        } finally {
            setIsDeleting(false);
        }
    };

    // Edit handler
    const handleEdit = (trans: any) => {
        setTransaction(trans);
        setModal(true);
    };

    // Add new handler
    const handleAddNew = () => {
        setTransaction(null);
        setModal(true);
    };

    // Table columns
    const columns = useMemo(() => [
        {
            header: t("finance.transactions.table.date"),
            accessorKey: "transaction_date",
            enableColumnFilter: false,
            cell: (cellProps: any) => <TransactionDate {...cellProps} />,
        },
        {
            header: t("finance.transactions.table.category"),
            accessorKey: "category",
            enableColumnFilter: false,
            cell: (cellProps: any) => <Category {...cellProps} />,
        },
        {
            header: t("finance.transactions.table.description"),
            accessorKey: "description",
            enableColumnFilter: false,
            cell: (cellProps: any) => <Description {...cellProps} />,
        },
        {
            header: t("finance.transactions.table.amount"),
            accessorKey: "amount",
            enableColumnFilter: false,
            cell: (cellProps: any) => <Amount {...cellProps} />,
        },
        {
            header: t("finance.transactions.table.status"),
            accessorKey: "payment_method",
            enableColumnFilter: false,
            cell: (cellProps: any) => <PaymentMethod {...cellProps} />,
        },
        {
            header: t("transactions.columns.tags"),
            accessorKey: "tags",
            enableColumnFilter: false,
            cell: (cellProps: any) => <Tags {...cellProps} />,
        },
        {
            header: t("finance.transactions.table.action"),
            cell: (cellProps: any) => (
                <Actions
                    {...cellProps}
                    onEdit={handleEdit}
                    onDelete={onClickDelete}
                />
            ),
        },
    ], []);

    return (
        <React.Fragment>
            <Row>
                <DeleteModal
                    show={deleteModal}
                    onDeleteClick={handleDelete}
                    onCloseClick={() => setDeleteModal(false)}
                    loading={isDeleting}
                />
                <Col lg={12}>
                    <Card>
                        <Card.Header className="border-0">
                            <div className="d-flex align-items-center">
                                <h5 className="card-title mb-0 flex-grow-1">{t("finance.title")}</h5>
                                <div className="flex-shrink-0">
                                    <div className="d-flex flex-wrap gap-2">
                                        {permissions.create && (
                                            <button className="btn btn-primary add-btn" onClick={handleAddNew}>
                                                <i className="ri-add-line align-bottom"></i> {t("finance.transactions.add_new")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card.Header>
                        <Card.Body className='pt-0'>
                            {loading ? (
                                <div className="d-flex justify-content-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                </div>
                            ) : (
                                <TableContainer
                                    columns={columns}
                                    data={transactions || []}
                                    isGlobalFilter={true}
                                    customPageSize={10}
                                    divClass="table-responsive table-card mb-3"
                                    tableClass="align-middle table-nowrap mb-0"
                                    theadClass=""
                                    thClass=""
                                    SearchPlaceholder="Search transactions..."
                                />
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <TransactionModal
                show={modal}
                onClose={toggle}
                onSuccess={fetchFinanceData}
                transaction={transaction}
                categories={categories}
                currencies={currencies}
                defaultCurrency={defaultCurrency}
                paymentMethods={paymentMethods}
            />
        </React.Fragment>
    );
};

export default FinanceIndex;
