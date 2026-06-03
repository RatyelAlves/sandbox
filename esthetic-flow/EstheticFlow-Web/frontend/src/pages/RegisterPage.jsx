import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

import { register }
from "@/api/auth";

import { AuthBackground }
from "@/components/auth/AuthBackground";

import {
  AuthCard,
  AuthHeader,
  AuthSubmitButton,
} from "@/components/auth/AuthCard";

import { GlassInput }
from "@/components/auth/GlassInput";

export default function RegisterPage() {

  const navigate = useNavigate();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

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

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      return;
    }

    if (
      password !== confirmPassword
    ) {
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
    setSuccess("");

    try {

      const result =
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

      setSuccess(
        result.message ||
          "Cadastro enviado! Aguarde a aprovação do administrador."
      );

    } catch (err) {

      setError(
        err.response?.data?.error ||
          "Não foi possível criar a conta. Tente novamente."
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
          subtitle="Solicitar acesso à equipe"
          icon={User}
        />

        {success ? (
          <div className="space-y-5 text-center">
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

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              className="
                w-full
                rounded-full
                border
                border-amber-200/50
                bg-gradient-to-r
                from-rose-500
                via-rose-400
                to-pink-400
                px-6
                py-3.5
                text-sm
                font-semibold
                uppercase
                tracking-[0.2em]
                text-white
                shadow-lg
                shadow-rose-300/40
              "
            >
              Ir para login
            </button>
          </div>
        ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <GlassInput
            id="name"
            label="Nome"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Seu nome"
            icon={User}
            autoComplete="name"
          />

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

          <GlassInput
            id="password"
            label="Senha"
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
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
              !name.trim() ||
              !email.trim() ||
              !password ||
              !confirmPassword
            }
          >
            {isSubmitting
              ? "Enviando..."
              : "Solicitar acesso"}
          </AuthSubmitButton>

        </form>
        )}

        {!success && (
        <p className="
          mt-8
          text-center
          text-sm
          text-zinc-500
        ">
          Já tem conta?{" "}

          <Link
            to="/login"
            className="
              font-medium
              text-rose-600
              hover:text-rose-700
            "
          >
            Entrar
          </Link>

        </p>
        )}

      </AuthCard>

    </div>
  );
}
