// ---------------------------------------------------------------------------
// Account module public types
// ---------------------------------------------------------------------------

/** Account fields returned to the authenticated account owner. */
export interface CurrentAccount {
  id: string;
  accountNumber: string;
  balancePaise: number;
  createdAt: Date;
}

/** Public-facing beneficiary — safe to expose to any authenticated user. */
export interface PublicBeneficiary {
  name: string;
  accountNumber: string;
}
