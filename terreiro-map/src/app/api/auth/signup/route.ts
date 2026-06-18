import { NextResponse } from "next/server";
import { roleToAccountType } from "@/lib/auth/server";
import { createAppUser, getUserByEmail } from "@/lib/db/users";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      accountType?: "usuario" | "terreiro";
      terreiroId?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const accountType = body.accountType ?? "usuario";

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          accountType,
          terreiroId: body.terreiroId ?? null,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Não foi possível criar a conta." },
        { status: 500 },
      );
    }

    const role = accountType === "terreiro" ? "TERREIRO" : "USUARIO";
    const appUser = await createAppUser({
      id: crypto.randomUUID(),
      authId: data.user.id,
      email,
      role,
      terreiroId: accountType === "terreiro" ? body.terreiroId : undefined,
    });

    return NextResponse.json(
      {
        userId: appUser.id,
        email: appUser.email,
        accountType: roleToAccountType(appUser.role),
        needsEmailConfirmation: !data.session,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json(
      { error: "Erro ao criar conta." },
      { status: 500 },
    );
  }
}
