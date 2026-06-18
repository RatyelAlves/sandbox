import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 },
      );
    }

    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Conta autenticada, mas perfil não encontrado no app. Rode npm run db:seed.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      authenticated: true,
      userId: profile.userId,
      email: profile.email,
      accountType: profile.accountType,
      terreiroId: profile.terreiroId,
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Erro ao entrar." }, { status: 500 });
  }
}
