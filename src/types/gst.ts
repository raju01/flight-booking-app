export interface GstDetails {
  gstin: string;
  companyName: string;
  billingAddress: string;
}

export interface GstBreakdown {
  taxableValue: number;
  rate: number;
  cgst: number;
  sgst: number;
  total: number;
}
