import React from "react";
import { Dropdown, Form } from "react-bootstrap";

type CheckboxOption = {
    label: string;
    value: string;
};

export const SortableHeader = ({
    label,
    isActive,
    direction,
    onToggle,
    className,
}: {
    label: string;
    isActive: boolean;
    direction: "asc" | "desc";
    onToggle: () => void;
    className?: string;
}) => (
    <button
        type="button"
        className={`btn btn-link p-0 text-reset text-decoration-none fw-semibold d-inline-flex align-items-center gap-1 ${className || ""}`}
        onClick={onToggle}
    >
        <span>{label}</span>
        <span className="small text-muted">
            {isActive ? (direction === "asc" ? <i className="ri-arrow-up-s-line"></i> : <i className="ri-arrow-down-s-line"></i>) : <i className="ri-expand-up-down-line"></i>}
        </span>
    </button>
);

export const HeaderTextFilter = ({
    value,
    placeholder,
    onChange,
}: {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}) => (
    <Form.Control
        size="sm"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
    />
);

export const HeaderRangeFilter = ({
    minValue,
    maxValue,
    minPlaceholder,
    maxPlaceholder,
    onMinChange,
    onMaxChange,
}: {
    minValue: string;
    maxValue: string;
    minPlaceholder?: string;
    maxPlaceholder?: string;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
}) => (
    <div className="d-flex gap-1">
        <Form.Control
            size="sm"
            type="number"
            value={minValue}
            placeholder={minPlaceholder}
            onChange={(event) => onMinChange(event.target.value)}
        />
        <Form.Control
            size="sm"
            type="number"
            value={maxValue}
            placeholder={maxPlaceholder}
            onChange={(event) => onMaxChange(event.target.value)}
        />
    </div>
);

export const HeaderNumberExpressionFilter = ({
    value,
    placeholder,
    onChange,
}: {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}) => (
    <Form.Control
        size="sm"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
    />
);

export const HeaderCheckboxDropdownFilter = ({
    title,
    allLabel = "All",
    selectedValues,
    options,
    onChange,
    clearLabel = "Clear",
}: {
    title: string;
    allLabel?: string;
    selectedValues: string[];
    options: CheckboxOption[];
    onChange: (values: string[]) => void;
    clearLabel?: string;
}) => {
    const selectedSet = new Set(selectedValues);
    const selectedLabel = selectedValues.length > 0 ? `${title} (${selectedValues.length})` : allLabel;

    return (
        <Dropdown align="end">
            <Dropdown.Toggle
                as="button"
                type="button"
                size="sm"
                className="btn btn-light btn-sm w-100 d-flex align-items-center justify-content-between arrow-none"
            >
                <span className="text-truncate text-start">{selectedLabel}</span>
                <i className={`fs-16 ms-2 ${selectedValues.length > 0 ? "ri-filter-3-fill text-primary" : "ri-filter-3-line text-muted"}`}></i>
            </Dropdown.Toggle>
            <Dropdown.Menu className="dropdown-menu-md p-2 w-100">
                {options.map((option) => (
                    <Form.Check
                        key={option.value}
                        id={`${title}-${option.value}`}
                        className="mb-2"
                        type="checkbox"
                        label={option.label}
                        checked={selectedSet.has(option.value)}
                        onChange={(event) => {
                            const nextValues = event.target.checked
                                ? [...selectedValues, option.value]
                                : selectedValues.filter((item) => item !== option.value);
                            onChange(Array.from(new Set(nextValues)));
                        }}
                    />
                ))}
                {selectedValues.length > 0 ? (
                    <button type="button" className="btn btn-sm btn-link px-0" onClick={() => onChange([])}>
                        {clearLabel}
                    </button>
                ) : null}
            </Dropdown.Menu>
        </Dropdown>
    );
};
