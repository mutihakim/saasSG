export type MasterDataPermissions = {
    create: boolean;
    update: boolean;
    delete: boolean;
};

export type MasterDataModule = string;

export type Category = {
    id: number;
    name: string;
    module: MasterDataModule;
    row_version?: number;
    description?: string | null;
    children?: Category[];
    [key: string]: unknown;
};

export type Currency = {
    id: number;
    code: string;
    name: string;
    symbol?: string;
    symbol_position?: string;
    is_active?: boolean;
    [key: string]: unknown;
};

export type Tag = {
    id: number;
    name: string;
    color?: string;
    usage_count?: number;
    [key: string]: unknown;
};

export type Uom = {
    id: number;
    code: string;
    name: string;
    abbreviation?: string;
    dimension_type?: string;
    base_factor?: number;
    is_active?: boolean;
    row_version?: number;
    [key: string]: unknown;
};
