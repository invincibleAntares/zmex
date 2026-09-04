import { BankingShell } from "@/components/banking/BankingShell";

export default function BankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BankingShell>{children}</BankingShell>;
}
