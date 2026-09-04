import type { PaymentMethod } from "./deposit.schema";

export interface DepositItem {
  id: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}

export interface DepositResult {
  deposit: DepositItem;
  idempotent: boolean;
}
