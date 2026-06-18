import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/auth/server";

export async function GET() {
  const profile = await getAuthProfile();
  if (!profile) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    userId: profile.userId,
    email: profile.email,
    accountType: profile.accountType,
    terreiroId: profile.terreiroId,
  });
}
