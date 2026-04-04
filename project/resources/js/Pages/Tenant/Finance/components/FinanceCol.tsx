import moment from "moment";
import React from "react";
import { Badge, Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export const TransactionDate = ({ cell }: any) => (
    <div className="d-flex align-items-center">
        <div className="flex-shrink-0 me-2">
            <i className="ri-calendar-event-line text-muted"></i>
        </div>
        <div>
            <h6 className="mb-0">{moment(cell.getValue()).format("DD MMM YYYY")}</h6>
        </div>
    </div>
);

export const Category = ({ cell, row }: any) => {
    const category = cell.getValue();
    const fallbackLabel = row.original.type === "transfer" ? "Transfer" : "Uncategorized";

    return (
        <div className="d-flex align-items-center">
            {category?.icon && (
                <div className="avatar-xxs me-2">
                    <span className="avatar-title bg-soft-primary text-primary rounded-circle fs-12">
                        <i className={category.icon}></i>
                    </span>
                </div>
            )}
            <span>{category?.name || fallbackLabel}</span>
        </div>
    );
};

export const Description = ({ row }: any) => (
    <div className="text-wrap" style={{ maxWidth: "280px" }}>
        <div className="fw-medium">{row.original.description || "-"}</div>
        <div className="small text-muted">
            {[row.original.bank_account?.name, row.original.owner_member?.full_name].filter(Boolean).join(" · ") || "-"}
        </div>
    </div>
);

export const Amount = ({ cell, row }: any) => {
    const type = row.original.type;
    const direction = row.original.transfer_direction;
    const color = type === "pemasukan" || direction === "in"
        ? "success"
        : type === "pengeluaran" || direction === "out"
            ? "danger"
            : "warning";
    const symbol = type === "pemasukan" || direction === "in"
        ? "+"
        : type === "pengeluaran" || direction === "out"
            ? "-"
            : "";

    return (
        <div className={`text-${color} fw-medium`}>
            {symbol} {row.original.currency_code} {Number(cell.getValue()).toLocaleString()}
        </div>
    );
};

export const Budget = ({ row }: any) => {
    const budget = row.original.budget;
    const status = row.original.budget_status;

    if (!budget) {
        return <span className="text-muted">Unbudgeted</span>;
    }

    const tone = status === "over_budget" ? "warning" : "info";

    return (
        <div className="d-flex flex-column gap-1">
            <span>{budget.name}</span>
            <Badge bg={tone}>{status}</Badge>
        </div>
    );
};

export const PaymentMethod = ({ cell }: any) => {
    const { t } = useTranslation();
    const value = cell.getValue();

    if (!value) {
        return <span className="text-muted">{t("finance.shared.not_set")}</span>;
    }

    const label = t(`finance.transactions.payment_methods.${value}`, { defaultValue: value });

    return (
        <Badge bg="light" className="text-body text-uppercase">
            {label}
        </Badge>
    );
};

export const Tags = ({ cell }: any) => (
    <div className="d-flex flex-wrap gap-1">
        {(cell.getValue() || []).map((tag: any, index: number) => (
            <Badge key={index} bg="soft-info" className="text-info">
                #{tag.name}
            </Badge>
        ))}
        {(!cell.getValue() || cell.getValue().length === 0) && (
            <span className="text-muted">-</span>
        )}
    </div>
);

export const Actions = ({ cell, onEdit, onDelete, canEdit = true }: any) => (
    <Dropdown>
        <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none">
            <i className="ri-more-fill align-middle"></i>
        </Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu-end">
            {canEdit && (
                <Dropdown.Item onClick={() => onEdit(cell.row.original)}>
                    <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
                </Dropdown.Item>
            )}
            <div className="dropdown-divider"></div>
            <Dropdown.Item className="text-danger" onClick={() => onDelete(cell.row.original)}>
                <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> Delete
            </Dropdown.Item>
        </Dropdown.Menu>
    </Dropdown>
);
