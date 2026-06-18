import type { AccountType } from "@/lib/auth-context";

export type AuthProfile = {
  userId: string;
  authId: string;
  email: string;
  accountType: AccountType;
  terreiroId: string | null;
};
