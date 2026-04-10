import React from "react";
import { Modal } from "react-bootstrap";

import { TransactionFormData } from "./transactionModalTypes";

type Props = {
    title: string;
    formData: TransactionFormData;
    isEdit: boolean;
    setFormData: React.Dispatch<React.SetStateAction<TransactionFormData>>;
    getTypeLabel: (type: "pengeluaran" | "pemasukan") => string;
};

const TransactionModalHeader = ({ title, formData, isEdit, setFormData, getTypeLabel }: Props) => (
    <Modal.Header closeButton className="border-bottom-0 pb-0">
        <div className="w-100">
            <div className="d-flex align-items-center justify-content-between">
                <Modal.Title>{title}</Modal.Title>
            </div>
            <div className="d-flex gap-2 mt-3">
                {(["pengeluaran", "pemasukan"] as const).map((type) => (
                    <button
                        key={type}
                        type="button"
                        className={`btn btn-sm flex-fill ${formData.type === type ? "btn-danger" : "btn-light"}`}
                        onClick={() => setFormData((prev) => ({
                            ...prev,
                            type,
                            category_id: "",
                            budget_id: "",
                        }))}
                        disabled={isEdit}
                    >
                        {getTypeLabel(type)}
                    </button>
                ))}
            </div>
        </div>
    </Modal.Header>
);

export default TransactionModalHeader;
