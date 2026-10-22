export interface BranchLocation {
  id: string;
  businessId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  managerName: string;
  staffCount: number;
  laneCount: number;
  initialFloat: number;
  allowOffline: boolean;
  status: "ACTIVE" | "DRAFT" | "INACTIVE";
  isMain?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationAuditLog {
  id: string;
  timestamp: string;
  locationName: string;
  operator: string;
  action: string;
  details: string;
  node: string;
  status: "SUCCESS" | "WARNING" | "INFO";
}

export interface BranchFormData {
  name: string;
  code: string;
  businessId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  initialFloat: number;
  allowOffline: boolean;
}
