import React, { useMemo } from "react";
import { Button, Row } from "react-bootstrap";

type PaginationProps = {
    totalItems: number;
    currentPage: number;
    perPageData: number;
    setCurrentPage: (page: number) => void;
    previousLabel?: string;
    nextLabel?: string;
};

const Pagination = ({
    totalItems,
    currentPage,
    perPageData,
    setCurrentPage,
    previousLabel = "Previous",
    nextLabel = "Next",
}: PaginationProps) => {
    const pageNumbers = useMemo(() => {
        const totalPages = Math.ceil(totalItems / perPageData);
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }, [totalItems, perPageData]);

    const isFirstPage = currentPage <= 1;
    const isLastPage = pageNumbers.length === 0 || currentPage >= pageNumbers.length;

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

    if (pageNumbers.length <= 1) {
        return null;
    }

    return (
        <Row className="g-0 justify-content-end">
            <div className="col-sm-auto">
                <ul className="pagination pagination-separated pagination-sm justify-content-center justify-content-sm-end mb-sm-0">
                    <li className={isFirstPage ? "page-item disabled" : "page-item"}>
                        <Button variant="link" className="page-link" onClick={goPrev}>
                            {previousLabel}
                        </Button>
                    </li>

                    {pageNumbers.map((page) => (
                        <li key={page} className={currentPage === page ? "page-item active" : "page-item"}>
                            <Button variant="link" className="page-link" onClick={() => setCurrentPage(page)}>
                                {page}
                            </Button>
                        </li>
                    ))}

                    <li className={isLastPage ? "page-item disabled" : "page-item"}>
                        <Button variant="link" className="page-link" onClick={goNext}>
                            {nextLabel}
                        </Button>
                    </li>
                </ul>
            </div>
        </Row>
    );
};

export default Pagination;
