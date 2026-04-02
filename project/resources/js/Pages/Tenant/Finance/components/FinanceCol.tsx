import moment from "moment";
import React from "react";
import { Badge, Dropdown } from "react-bootstrap";

export const TransactionDate = ({ cell }: any) => (
    <div className="d-flex align-items-center">
        <div className="flex-shrink-0 me-2">
            <i className="ri-calendar-event-line text-muted"></i>
        </div>
        <div>
            <h6 className="mb-0">{moment(cell.getValue()).format("DD MMM YYYY")}</h6>
            <small className="text-muted">{moment(cell.getValue()).format("HH:mm")}</small>
        </div>
    </div>
);

export const Category = ({ cell }: any) => {
    const category = cell.getValue();
    return (
        <div className="d-flex align-items-center">
            {category?.icon && (
                <div className="avatar-xxs me-2">
                    <span className={`avatar-title bg-soft-${category.color || 'primary'} text-${category.color || 'primary'} rounded-circle fs-12`}>
                        <i className={category.icon}></i>
                    </span>
                </div>
            )}
            <span>{category?.name || "Uncategorized"}</span>
        </div>
    );
};

export const Description = ({ cell }: any) => (
    <div className="text-wrap" style={{ maxWidth: '200px' }}>
        {cell.getValue() || "-"}
    </div>
);

export const Amount = ({ cell, row }: any) => {
    const type = row.original.type;
    const color = type === 'income' ? 'success' : (type === 'expense' ? 'danger' : 'warning');
    const symbol = type === 'income' ? '+' : (type === 'expense' ? '-' : '');
    const currencyCode = row.original.currency_code;

    return (
        <div className={`text-${color} fw-medium`}>
            {symbol} {currencyCode} {cell.getValue().toLocaleString()}
        </div>
    );
};

export const PaymentMethod = ({ cell }: any) => (
    <Badge bg="light" className="text-body text-uppercase">
        {cell.getValue()}
    </Badge>
);

export const Tags = ({ cell }: any) => (
    <div className="d-flex flex-wrap gap-1">
        {(cell.getValue() || []).map((tag: any, idx: number) => (
            <Badge key={idx} bg="soft-info" className="text-info">
                #{tag.name}
            </Badge>
        ))}
    </div>
);

export const Actions = ({ cell, onEdit, onDelete }: any) => (
    <Dropdown>
        <Dropdown.Toggle variant="link" className="btn btn-soft-secondary btn-sm dropdown arrow-none">
            <i className="ri-more-fill align-middle"></i>
        </Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu-end">
            <Dropdown.Item onClick={() => onEdit(cell.row.original)}>
                <i className="ri-pencil-fill align-bottom me-2 text-muted"></i> Edit
            </Dropdown.Item>
            <div className="dropdown-divider"></div>
            <Dropdown.Item className="text-danger" onClick={() => onDelete(cell.row.original)}>
                <i className="ri-delete-bin-fill align-bottom me-2 text-danger"></i> Delete
            </Dropdown.Item>
        </Dropdown.Menu>
    </Dropdown>
);
