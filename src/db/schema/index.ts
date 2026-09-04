// Schema barrel — single import point for all Drizzle table and enum objects.
// Repositories and services should import from here, not from individual schema files.

export { users } from "./users";
export type { User, NewUser } from "./users";

export { accounts } from "./accounts";
export type { Account, NewAccount } from "./accounts";

export {
  transactions,
  transactionTypeEnum,
  depositPaymentMethodEnum,
} from "./transactions";
export type {
  Transaction,
  NewTransaction,
  TransactionType,
  DepositPaymentMethod,
} from "./transactions";

export {
  ledgerEntries,
  ledgerEntryTypeEnum,
} from "./ledger-entries";
export type { LedgerEntry, NewLedgerEntry, LedgerEntryType } from "./ledger-entries";
