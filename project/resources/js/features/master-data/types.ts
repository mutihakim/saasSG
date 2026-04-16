export type MasterDataPermissions = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type MasterDataModule = string;

export type PaginationMeta = {
    current_page: number;
    total: number;
    last_page: number;
    has_more: boolean;
};

export type PaginatedCollection<T> = {
    items: T[];
    pagination: PaginationMeta;
    stats?: Record<string, number>;
    sort?: {
        by: string;
        direction: "asc" | "desc";
    };
};

export type SortDirection = "asc" | "desc";

export type Category = {
    id: number;
    name: string;
    module: MasterDataModule;
    parent_id?: number | null;
    sub_type?: string | null;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    is_default?: boolean;
    is_active?: boolean;
    row_version?: number;
    children?: Category[];
    children_count?: number;
    depth?: number;
    [key: string]: unknown;
};

export type Currency = {
    id: number;
    code: string;
    name: string;
    symbol?: string;
    symbol_position?: string;
    decimal_places?: number;
    is_active?: boolean;
    sort_order?: number;
    row_version?: number;
    [key: string]: unknown;
};

export type Tag = {
    id: number;
    name: string;
    color?: string;
    usage_count?: number;
    is_active?: boolean;
    row_version?: number;
    [key: string]: unknown;
};

export type Uom = {
    id: number;
    code: string;
    name: string;
    abbreviation?: string;
    dimension_type?: string;
    base_unit_code?: string | null;
    base_factor?: number;
    is_active?: boolean;
    sort_order?: number;
    row_version?: number;
    [key: string]: unknown;
};
