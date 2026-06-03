import {
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Lock,
  Sparkles,
} from "lucide-react";

import {
  resetPassword,
} from "@/api/auth";

import { AuthBackground }
from "@/components/auth/AuthBackground";

import {
  AuthCard,
  AuthHeader,
  AuthSubmitButton,
} from "@/components/auth/AuthCard";

import { GlassInput }
from "@/components/auth/GlassInput";

export default function ResetPasswordPage() {

  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token") || "";

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    if (password !== confirmPassword) {
      setError(
        "As senhas não coincidem"
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "A senha deve ter ao menos 6 caracteres"
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {

      const result =
        await resetPassword({
          token,
          password,
        });

      setSuccess(
        result.message ||
          "Senha redefinida com sucesso."
      );

    } catch (err) {

      setError(
        err.response?.data?.error ||
          "Não foi possível redefinir a senha."
      );

    } finally {

      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        px-4
      ">

        <AuthBackground />

        <AuthCard>

          <p className="
            text-center
            text-sm
            text-zinc-600
          ">
            Link inválido. Solicite uma nova redefinição.
          </p>

          <p className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="
                font-medium
                text-rose-600
                hover:text-rose-700
              "
            >
              Esqueci a senha
            </Link>
          </p>

        </AuthCard>

      </div>
    );
  }

  return (
    <div className="
      relative
      flex
      min-h-screen
      w-full
      items-center
      justify-center
      overflow-hidden
      px-4
      py-10
    ">

      <AuthBackground />

      <AuthCard>

        <AuthHeader
          title="EstheticFlow"
          subtitle="Nova senha"
          icon={Sparkles}
        />

        {success ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-emerald-700">
              {success}
            </p>
            <Link
              to="/login"
              className="
                inline-block
                rounded-full
                border
                border-amber-200/35
                bg-gradient-to-r
                from-rose-500
                to-pink-400
                px-6
                py-3
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-rose-500/30
              "
            >
              Ir para login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <GlassInput
              id="password"
              label="Nova senha"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              trailing={
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (v) => !v
                    )
                  }
                  className="
                    absolute
                    right-0
                    rounded-lg
                    p-1.5
                    text-zinc-400
                    hover:bg-rose-50
                    hover:text-rose-600
                  "
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              }
            />

            <GlassInput
              id="confirmPassword"
              label="Confirmar senha"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Repita a senha"
              icon={Lock}
              autoComplete="new-password"
            />

            {error && (
              <p className="
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-sm
                text-red-700
              ">
                {error}
              </p>
            )}

            <AuthSubmitButton
              disabled={
                isSubmitting ||
                !password ||
                !confirmPassword
              }
            >
              {isSubmitting
                ? "Salvando..."
                : "Redefinir senha"}
            </AuthSubmitButton>

          </form>
        )}

      </AuthCard>

    </div>
  );
}
