import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/auth/server";
import {
  addFavoriteTerreiro,
  listFavoriteEventoIds,
  listFavoriteTerreiroIds,
  removeFavoriteEvento,
  removeFavoriteTerreiro,
  toggleFavoriteTerreiro,
} from "@/lib/db/favoritos";

type FavoritosScope = "usuario" | "terreiro";

function parseScope(value: string | null): FavoritosScope {
  return value === "terreiro" ? "terreiro" : "usuario";
}

export async function GET(request: Request) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = parseScope(searchParams.get("scope"));

    if (scope === "usuario") {
      if (profile.accountType !== "usuario") {
        return NextResponse.json(
          { error: "Perfil de usuário necessário." },
          { status: 403 },
        );
      }
      return NextResponse.json(await listFavoriteTerreiroIds(profile.userId));
    }

    if (profile.accountType !== "terreiro") {
      return NextResponse.json(
        { error: "Perfil de terreiro necessário." },
        { status: 403 },
      );
    }

    return NextResponse.json(await listFavoriteEventoIds(profile.userId));
  } catch (error) {
    console.error("[GET /api/favoritos]", error);
    return NextResponse.json({ error: "Erro ao listar favoritos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as {
      scope?: FavoritosScope;
      action?: "toggle" | "add" | "remove";
      id?: string;
    };

    const scope = body.scope ?? "usuario";
    if (!body.id) {
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
    }

    if (scope === "usuario") {
      if (profile.accountType !== "usuario") {
        return NextResponse.json(
          { error: "Perfil de usuário necessário." },
          { status: 403 },
        );
      }

      if (body.action === "toggle") {
        await toggleFavoriteTerreiro(profile.userId, body.id);
        return NextResponse.json(await listFavoriteTerreiroIds(profile.userId));
      }
      if (body.action === "add") {
        await addFavoriteTerreiro(profile.userId, body.id);
      } else {
        await removeFavoriteTerreiro(profile.userId, body.id);
      }
      return NextResponse.json(await listFavoriteTerreiroIds(profile.userId));
    }

    if (profile.accountType !== "terreiro") {
      return NextResponse.json(
        { error: "Perfil de terreiro necessário." },
        { status: 403 },
      );
    }

    await removeFavoriteEvento(profile.userId, body.id);
    return NextResponse.json(await listFavoriteEventoIds(profile.userId));
  } catch (error) {
    console.error("[POST /api/favoritos]", error);
    return NextResponse.json({ error: "Erro ao atualizar favoritos." }, { status: 500 });
  }
}
