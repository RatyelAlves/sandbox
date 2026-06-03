import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  X,
} from "lucide-react";

import {
  createUser,
  updateUser,
} from "@/api/users";

const EMPTY_FORM = {
  name: "",
  email: "",
  role: "staff",
  active: true,
  password: "",
};

export function UserFormModal({
  open,
  user,
  onClose,
  onSaved,
}) {

  const isCreate = !user;

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");

    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "staff",
        active: user.active ?? true,
        password: "",
      });
      return;
    }

    setForm(EMPTY_FORM);
  }, [open, user]);

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      active: form.active,
    };

    if (isCreate) {
      if (!form.password.trim()) {
        setError("Informe uma senha para o novo usuário.");
        setSaving(false);
        return;
      }

      payload.password = form.password;
    } else if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (isCreate) {
        await createUser(payload);
      } else {
        await updateUser(
          user.id,
          payload
        );
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Não foi possível salvar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/40
      p-4
    ">

      <div className="
        w-full
        max-w-md
        rounded-2xl
        bg-white
        p-6
        shadow-xl
      ">

        <div className="
          mb-5
          flex
          items-center
          justify-between
        ">

          <h2 className="
            text-lg
            font-semibold
            text-zinc-800
          ">
            {isCreate
              ? "Novo usuário"
              : "Editar usuário"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              p-1.5
              text-zinc-400
              hover:bg-zinc-100
            "
          >
            <X size={18} />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <label className="block">
            <span className="
              mb-1
              block
              text-sm
              font-medium
              text-zinc-700
            ">
              Nome
            </span>

            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
              className="
                w-full
                rounded-xl
                border
                border-zinc-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-rose-400
              "
            />
          </label>

          <label className="block">
            <span className="
              mb-1
              block
              text-sm
              font-medium
              text-zinc-700
            ">
              E-mail
            </span>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              required
              className="
                w-full
                rounded-xl
                border
                border-zinc-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-rose-400
              "
            />
          </label>

          <label className="block">
            <span className="
              mb-1
              block
              text-sm
              font-medium
              text-zinc-700
            ">
              Perfil
            </span>

            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
              className="
                w-full
                rounded-xl
                border
                border-zinc-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-rose-400
              "
            >
              <option value="staff">
                Atendente
              </option>
              <option value="admin">
                Administrador
              </option>
            </select>
          </label>

          <label className="
            flex
            items-center
            gap-2
            text-sm
            text-zinc-700
          ">

            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm({
                  ...form,
                  active: e.target.checked,
                })
              }
              className="
                h-4
                w-4
                rounded
                accent-rose-600
              "
            />

            Acesso ativo ao sistema

          </label>

          <label className="block">
            <span className="
              mb-1
              block
              text-sm
              font-medium
              text-zinc-700
            ">
              {isCreate
                ? "Senha inicial"
                : "Nova senha"}
            </span>

            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              required={isCreate}
              placeholder={
                isCreate
                  ? "Mínimo 6 caracteres"
                  : "Deixe em branco para manter"
              }
              className="
                w-full
                rounded-xl
                border
                border-zinc-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-rose-400
              "
            />
          </label>

          {error && (
            <p className="
              rounded-xl
              bg-red-50
              px-3
              py-2
              text-sm
              text-red-700
            ">
              {error}
            </p>
          )}

          <div className="
            flex
            justify-end
            gap-2
            pt-2
          ">

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl
                border
                border-zinc-200
                px-4
                py-2
                text-sm
                text-zinc-600
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-rose-700
                px-4
                py-2
                text-sm
                font-medium
                text-white
                disabled:opacity-50
              "
            >
              {saving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}
              {isCreate
                ? "Criar usuário"
                : "Salvar"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
