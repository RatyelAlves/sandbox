import {
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Mail,
  Sparkles,
} from "lucide-react";

import {
  forgotPassword,
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

export default function ForgotPasswordPage() {

  const [email, setEmail] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [devHint, setDevHint] =
    useState("");

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setDevHint("");

    try {

      const result =
        await forgotPassword({
          email: email.trim(),
        });

      setSuccess(result.message);

      if (!result.smtpConfigured) {
        setDevHint(
          "SMTP não configurado: o link aparece no terminal do backend."
        );
      }

    } catch (err) {

      setError(
        err.response?.data?.error ||
          "Não foi possível enviar. Tente novamente."
      );

    } finally {

      setIsSubmitting(false);
    }
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
          subtitle="Recuperar acesso"
          icon={Sparkles}
        />

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <GlassInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="seu@email.com"
            icon={Mail}
            autoComplete="email"
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

          {success && (
            <p className="
              rounded-xl
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3
              text-sm
              text-emerald-700
            ">
              {success}
            </p>
          )}

          {devHint && (
            <p className="
              text-xs
              text-amber-700/80
            ">
              {devHint}
            </p>
          )}

          <AuthSubmitButton
            disabled={
              isSubmitting ||
              !email.trim()
            }
          >
            {isSubmitting
              ? "Enviando..."
              : "Enviar link"}
          </AuthSubmitButton>

        </form>

        <p className="
          mt-8
          text-center
          text-sm
          text-zinc-500
        ">
          <Link
            to="/login"
            className="
              font-medium
              text-rose-600
              hover:text-rose-700
            "
          >
            Voltar ao login
          </Link>
        </p>

      </AuthCard>

    </div>
  );
}
