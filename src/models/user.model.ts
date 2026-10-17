export interface UserInfo {
  id: number | null;
  _id?: number | null;
  name: string;
  email: string;
  firstName?: string;
  firstLastName?: string;
  userKind?: 'SYSTEM' | 'ACCOUNT' | 'STAFF';
  /** Tipo de menú lateral: 1 directo, 2 un sidebar con submódulos, 3 dos sidebars (por omisión) */
  sidebarType?: 1 | 2 | 3;
  role?: {
    id: number;
    name: string;
    level: number;
  };
  permissions?: string[];
  branchId?: number | null;
  branch?: { id: number; name: string } | null;
  companyId?: number | null;
  companyIds?: number[];
  activeCompanyId?: number | null;
  activeBranchId?: number | null;
  active?: boolean;
  token?: string;
}
