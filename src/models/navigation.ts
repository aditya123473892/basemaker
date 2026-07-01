export interface SidebarMenuRow {
  id: string;
  parent_id: string | null;
  label: string;
  path: string | null;
  icon_key: string | null;
  permission_module_key: string | null;
  permission_action: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SidebarMenuItem {
  id: string;
  label: string;
  path: string | null;
  iconKey: string | null;
  moduleKey: string | null;
  action: string | null;
  children: SidebarMenuItem[];
}
