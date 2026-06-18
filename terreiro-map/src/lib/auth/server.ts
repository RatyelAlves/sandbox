import type { UserRole } from "@/generated/prisma/client";
import type { AccountType } from "@/lib/auth-context";
import type { AuthProfile } from "@/lib/auth/types";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export function roleToAccountType(role: UserRole): AccountType {
  return role === "TERREIRO" ? "terreiro" : "usuario";
}

export async function getAuthProfile(): Promise<AuthProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;

  const email = user.email.trim().toLowerCase();
  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) return null;

  if (!dbUser.authId) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { authId: user.id },
    });
  }

  return {
    userId: dbUser.id,
    authId: user.id,
    email: dbUser.email,
    accountType: roleToAccountType(dbUser.role),
    terreiroId: dbUser.terreiroId,
  };
}
