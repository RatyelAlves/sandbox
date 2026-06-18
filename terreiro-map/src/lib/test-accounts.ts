import type { AccountType } from "@/lib/auth-context";

export interface TestAccount {
  email: string;
  password: string;
  accountType: AccountType;
  label: string;
}

/** Contas de demonstração sincronizadas com Supabase Auth + Prisma. */
export const TEST_ACCOUNTS: TestAccount[] = [
  {
    email: "usuario@teste.com",
    password: "123456",
    accountType: "usuario",
    label: "Usuário",
  },
  {
    email: "terreiro@teste.com",
    password: "123456",
    accountType: "terreiro",
    label: "Terreiro",
  },
];
