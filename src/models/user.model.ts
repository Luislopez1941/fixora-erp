export interface UserInfo {
  id: number | null;
  _id?: number | null;
  name: string;
  email: string;
  firstName?: string;
  firstLastName?: string;
  userKind?: 'SYSTEM' | 'ACCOUNT' | 'STAFF';
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
  active?: boolean;
  token?: string;
}
