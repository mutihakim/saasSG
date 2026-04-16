import React, { useMemo } from "react";
import { Button, Form, Row } from "react-bootstrap";

export type PageSizeOption = number | "all";

type PaginationProps = {
    totalItems: number;
    currentPage: number;
    perPageData: PageSizeOption;
    setCurrentPage: (page: number) => void;
    setPerPageData?: (value: PageSizeOption) => void;
    pageSizeOptions?: PageSizeOption[];
    pageSizeLabel?: string;
    allLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
};

export const PageSizeSelect = ({
    value,
    onChange,
    options = [20, 50, 100, "all"],
    label = "Per page",
    allLabel = "All",
}: {
    value: PageSizeOption;
    onChange: (value: PageSizeOption) => void;
    options?: PageSizeOption[];
    label?: string;
    allLabel?: string;
}) => (
    <div className="d-flex align-items-center gap-2">
        <span className="text-muted small text-nowrap">{label}</span>
        <Form.Select
            size="sm"
            value={String(value)}
            onChange={(event) => onChange(event.target.value === "all" ? "all" : Number(event.target.value))}
            style={{ width: "auto", minWidth: "96px" }}
        >
            {options.map((option) => (
                <option key={String(option)} value={String(option)}>
                    {option === "all" ? allLabel : option}
                </option>
            ))}
        </Form.Select>
    </div>
);

const Pagination = ({
    totalItems,
    currentPage,
    perPageData,
    setCurrentPage,
    setPerPageData,
    pageSizeOptions,
    pageSizeLabel = "Per page",
    allLabel = "All",
    previousLabel = "Previous",
    nextLabel = "Next",
}: PaginationProps) => {
    const totalPages = useMemo(() => {
        if (perPageData === "all") {
            return 1;
        }

        return Math.ceil(totalItems / perPageData);
    }, [perPageData, totalItems]);

    const pageNumbers = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const pages = new Set<number>([1, totalPages]);
        for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
            if (page > 1 && page < totalPages) {
                pages.add(page);
            }
        }

        if (currentPage <= 3) {
            [2, 3, 4].forEach((page) => pages.add(page));
        }

        if (currentPage >= totalPages - 2) {
            [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => {
                if (page > 1) {
                    pages.add(page);
                }
            });
        }

        const sortedPages = Array.from(pages).sort((left, right) => left - right);
        const output: Array<number | "ellipsis"> = [];

        sortedPages.forEach((page, index) => {
            const previous = sortedPages[index - 1];
            if (previous && page - previous > 1) {
                output.push("ellipsis");
            }
            output.push(page);
        });

        return output;
    }, [currentPage, totalPages]);

    const isFirstPage = currentPage <= 1;
    const isLastPage = totalPages === 0 || currentPage >= totalPages;

    const goPrev = () => {
        if (!isFirstPage) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goNext = () => {
        if (!isLastPage) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <Row className="g-2 justify-content-between align-items-center">
            {setPerPageData ? (
                <div className="col-sm-auto">
                    <PageSizeSelect
                        value={perPageData}
                        onChange={setPerPageData}
                        options={pageSizeOptions}
                        label={pageSizeLabel}
                        allLabel={allLabel}
                    />
                </div>
            ) : null}

            {totalPages > 1 ? (
                <div className="col-sm-auto">
                <ul className="pagination pagination-separated pagination-sm justify-content-center justify-content-sm-end mb-sm-0">
                    <li className={isFirstPage ? "page-item disabled" : "page-item"}>
                        <Button variant="link" className="page-link" onClick={goPrev}>
                            {previousLabel}
                        </Button>
                    </li>

                    {pageNumbers.map((page, index) => (
                        page === "ellipsis" ? (
                            <li key={`ellipsis-${index}`} className="page-item disabled">
                                <span className="page-link">...</span>
                            </li>
                        ) : (
                            <li key={page} className={currentPage === page ? "page-item active" : "page-item"}>
                                <Button variant="link" className="page-link" onClick={() => setCurrentPage(page)}>
                                    {page}
                                </Button>
                            </li>
                        )
                    ))}

                    <li className={isLastPage ? "page-item disabled" : "page-item"}>
                        <Button variant="link" className="page-link" onClick={goNext}>
                            {nextLabel}
                        </Button>
                    </li>
                </ul>
                </div>
            ) : null}
        </Row>
    );
};

export default Pagination;
