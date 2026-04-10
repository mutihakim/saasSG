export type RoleItem = {
    id: number;
    name: string;
    display_name: string;
    is_system: boolean;
    row_version: number;
    permissions: string[];
    members_count: number;
    linked_members_count: number;
    pending_members_count: number;
    members_preview: { id: number; name: string; avatar_url: string | null }[];
};

export type PermissionModules = Record<string, string[]>;

export type NewRoleForm = {
    name: string;
    display_name: string;
};
