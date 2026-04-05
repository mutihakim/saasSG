import { rankItem } from '@tanstack/match-sorter-utils';
import {
  ColumnFiltersState,
  FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  useReactTable
} from '@tanstack/react-table';
import React, { useState, useEffect, Fragment } from "react";
import { Button, Col, Row, Table } from "react-bootstrap";

// Global Filter Component
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, value, onChange]);

  return (
    <input {...props} value={value} className="form-control search" onChange={e => setValue(e.target.value)} />
  );
};

interface TableContainerProps {
  columns: any;
  data: any;
  isGlobalFilter?: boolean;
  customPageSize?: number;
  tableClass?: string;
  theadClass?: string;
  trClass?: string;
  thClass?: string;
  divClass?: string;
  SearchPlaceholder?: string;
  renderTopRight?: () => React.ReactNode;
  footer?: React.ReactNode;
}

const TableContainer = ({
  columns,
  data,
  isGlobalFilter,
  customPageSize = 10,
  tableClass = "table-nowrap",
  theadClass = "table-light",
  trClass,
  thClass,
  divClass = "table-responsive",
  SearchPlaceholder = "Search...",
  renderTopRight,
  footer
}: TableContainerProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageOptions,
    setPageIndex,
    nextPage,
    previousPage,
    setPageSize,
    getState
  } = table;

  useEffect(() => {
    setPageSize(Number(customPageSize));
  }, [customPageSize, setPageSize]);

  return (
    <Fragment>
      <Row className="mb-3">
        {isGlobalFilter && (
          <Col sm={6}>
            <div className="search-box d-inline-block col-12">
              <DebouncedInput
                value={globalFilter ?? ''}
                onChange={value => setGlobalFilter(String(value))}
                placeholder={SearchPlaceholder}
              />
              <i className="ri-search-line search-icon"></i>
            </div>
          </Col>
        )}
        {renderTopRight && (
          <Col sm={isGlobalFilter ? 6 : 12}>
            <div className="text-sm-end">{renderTopRight()}</div>
          </Col>
        )}
      </Row>

      <div className={divClass}>
        <Table hover className={tableClass}>
          <thead className={theadClass}>
            {getHeaderGroups().map((headerGroup) => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={thClass}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <React.Fragment>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' \u2191',
                          desc: ' \u2193',
                        }[header.column.getIsSorted() as string] ?? null}
                      </React.Fragment>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                   No results found.
                </td>
              </tr>
            )}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </Table>
      </div>

      <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
        <div className="col-sm">
          <div className="text-muted">
            Showing <span className="fw-semibold">{getRowModel().rows.length}</span> of <span className="fw-semibold">{data.length}</span> results
          </div>
        </div>
        <div className="col-sm-auto">
          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
            <li className={!getCanPreviousPage() ? "page-item disabled" : "page-item"}>
              <Button variant="link" className="page-link" onClick={previousPage}>Previous</Button>
            </li>
            {getPageOptions().map((item, key) => (
              <li className="page-item" key={key}>
                <Button
                  variant="link"
                  className={getState().pagination.pageIndex === item ? "page-link active" : "page-link"}
                  onClick={() => setPageIndex(item)}
                >
                  {item + 1}
                </Button>
              </li>
            ))}
            <li className={!getCanNextPage() ? "page-item disabled" : "page-item"}>
              <Button className="page-link" onClick={nextPage} variant="link">Next</Button>
            </li>
          </ul>
        </div>
      </Row>
    </Fragment>
  );
};

export default TableContainer;
