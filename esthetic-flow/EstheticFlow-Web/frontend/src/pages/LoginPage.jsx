import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";

import { login }
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

import {
  IS_DESKTOP,
} from "@/lib/appConfig";

export default function LoginPage({
  onLogin,
}) {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {

    const saved =
      localStorage.getItem(
        "estheticflow:remember"
      );

    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }

  }, []);

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    if (
      !email.trim() ||
      !password
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {

      const result =
        await login({
          email: email.trim(),
          password,
        });

      if (rememberMe) {
        localStorage.setItem(
          "estheticflow:remember",
          email.trim()
        );
      } else {
        localStorage.removeItem(
          "estheticflow:remember"
        );
      }

      onLogin?.(result);

    } catch (err) {

      setError(
        err.response?.data?.error ||
          "Não foi possível entrar. Tente novamente."
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

      <AuthCard
        footer="Transformando atendimentos em experiências premium"
      >

        <AuthHeader
          icon={Sparkles}
        />

        <form
          onSubmit={handleSubmit}
          className="space-y-7"
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
            placeholder="••••••••"
            autoComplete="current-password"
            trailing={
              <div className="
                absolute
                right-0
                flex
                items-center
                gap-1
              ">

                <Lock
                  size={16}
                  className="
                    text-zinc-400
                    transition-colors
                    duration-300
                    group-focus-within:text-rose-500
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (v) => !v
                    )
                  }
                  className="
                    rounded-lg
                    p-1.5
                    text-zinc-400
                    transition-all
                    duration-200
                    hover:bg-rose-50
                    hover:text-rose-600
                  "
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>
            }
          />

          <div className="
            flex
            items-center
            justify-between
            gap-4
            pt-1
          ">

            <label className="
              flex
              cursor-pointer
              items-center
              gap-2.5
              text-sm
              text-zinc-600
              transition-colors
              hover:text-zinc-800
            ">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(
                    e.target.checked
                  )
                }
                className="
                  h-4
                  w-4
                  rounded
                  border-zinc-300
                  bg-white
                  accent-rose-500
                "
              />

              Lembrar e-mail

            </label>

            <Link
              to="/forgot-password"
              className="
                text-sm
                text-zinc-500
                transition-colors
                duration-200
                hover:text-rose-600
              "
            >
              Esqueci a senha
            </Link>

          </div>

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
              !email.trim() ||
              !password
            }
          >
            {isSubmitting
              ? "Entrando..."
              : "Login"}
          </AuthSubmitButton>

          {IS_DESKTOP && (
            <p className="
              rounded-xl
              border
              border-zinc-200
              bg-zinc-50
              px-4
              py-3
              text-center
              text-xs
              text-zinc-600
            ">
              Primeiro acesso: use{" "}
              <strong>admin@estheticflow.local</strong>
              {" / "}
              <strong>admin123</strong>
            </p>
          )}

        </form>

        <p className="
          relative
          mt-8
          text-center
          text-sm
          text-zinc-500
        ">
          É da equipe da clínica?{" "}

          <Link
            to="/register"
            className="
              font-medium
              text-rose-600
              transition-colors
              duration-200
              hover:text-rose-700
            "
          >
            Solicitar acesso
          </Link>
        </p>

      </AuthCard>

    </div>
  );
}
