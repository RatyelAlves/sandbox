import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";

import {
  approveUser,
  deleteUser,
  listUsers,
  toggleUserActive,
} from "@/api/users";

import {
  UserFormModal,
} from "@/components/users/UserFormModal";

function formatDate(value) {
  return new Date(value).toLocaleDateString(
    "pt-BR"
  );
}

function roleLabel(role) {
  return role === "admin"
    ? "Administrador"
    : "Atendente";
}

function statusLabel(user) {
  if (!user.approved) {
    return "Pendente";
  }

  if (user.active) {
    return "Ativo";
  }

  return "Bloqueado";
}

function statusClass(user) {
  if (!user.approved) {
    return "bg-amber-100 text-amber-800";
  }

  if (user.active) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-red-100 text-red-700";
}

function UserActions({
  user,
  currentUser,
  onApprove,
  onToggleActive,
  onEdit,
  onDelete,
}) {
  const isSelf =
    user.id === currentUser?.id;

  const isPending = !user.approved;

  if (isPending) {
    return (
      <>
        <button
          type="button"
          onClick={() => onApprove(user)}
          className="
            rounded-lg
            p-2
            text-emerald-600
            transition
            hover:bg-emerald-50
            hover:text-emerald-700
          "
          title="Aprovar acesso"
        >
          <UserCheck size={16} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(user)}
          className="
            rounded-lg
            p-2
            text-zinc-500
            transition
            hover:bg-red-50
            hover:text-red-600
          "
          title="Recusar cadastro"
        >
          <Trash2 size={16} />
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onEdit(user)}
        className="
          rounded-lg
          p-2
          text-zinc-500
          transition
          hover:bg-zinc-100
          hover:text-rose-600
        "
        title="Editar"
      >
        <Pencil size={16} />
      </button>

      <button
        type="button"
        onClick={() => onToggleActive(user)}
        disabled={isSelf}
        className="
          rounded-lg
          p-2
          text-zinc-500
          transition
          hover:bg-amber-50
          hover:text-amber-700
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
        title={
          isSelf
            ? "Você não pode bloquear sua própria conta"
            : user.active
              ? "Bloquear acesso"
              : "Desbloquear acesso"
        }
      >
        {user.active ? (
          <Lock size={16} />
        ) : (
          <LockOpen size={16} />
        )}
      </button>

      <button
        type="button"
        onClick={() => onDelete(user)}
        disabled={isSelf}
        className="
          rounded-lg
          p-2
          text-zinc-500
          transition
          hover:bg-red-50
          hover:text-red-600
          disabled:cursor-not-allowed
          disabled:opacity-40
        "
        title={
          isSelf
            ? "Você não pode excluir sua própria conta"
            : "Excluir"
        }
      >
        <Trash2 size={16} />
      </button>
    </>
  );
}

export default function UsersPage({
  currentUser,
}) {

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const loadData =
    useCallback(async () => {

      setLoading(true);

      try {
        const data =
          await listUsers();

        setUsers(data);
      } catch (error) {
        console.error(
          "Erro ao carregar usuários",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openEditModal(user) {
    setEditingUser(user);
    setModalOpen(true);
  }

  function openCreateModal() {
    setEditingUser(null);
    setModalOpen(true);
  }

  async function handleApprove(
    user
  ) {

    const confirmed =
      window.confirm(
        `Aprovar o acesso de "${user.name}"?\n\nEle poderá entrar no sistema com o e-mail cadastrado.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await approveUser(user.id);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Não foi possível aprovar."
      );
    }
  }

  async function handleToggleActive(
    user
  ) {

    const willBlock = user.active;

    const confirmed =
      window.confirm(
        willBlock
          ? `Bloquear o acesso de "${user.name}"?\n\nEle não conseguirá entrar, mas o cadastro permanece.`
          : `Desbloquear o acesso de "${user.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await toggleUserActive(
        user.id,
        !user.active
      );

      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Não foi possível alterar o acesso."
      );
    }
  }

  async function handleDelete(
    user
  ) {

    const confirmed =
      window.confirm(
        user.approved
          ? `Excluir o usuário "${user.name}"?\n\nEle perderá o acesso ao sistema.`
          : `Recusar o cadastro de "${user.name}"?\n\nA solicitação será removida permanentemente.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteUser(user.id);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Não foi possível excluir."
      );
    }
  }

  const pendingUsers =
    users.filter(
      (user) => !user.approved
    );

  return (
    <div className="
      flex
      h-full
      min-w-0
      flex-col
      gap-4
      overflow-x-hidden
      overflow-y-auto
      rounded-2xl
      bg-[#faf8f7]
      p-4
      lg:gap-6
      lg:p-8
    ">

      <div className="
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-start
        sm:justify-between
      ">
        <div className="min-w-0">
          <h1 className="
            font-serif
            text-2xl
            font-semibold
            text-zinc-800
            lg:text-3xl
          ">
            Usuários
          </h1>

          <p className="
            mt-1
            text-sm
            text-zinc-500
          ">
            Aprove solicitações da equipe ou crie acessos manualmente.
            Você pode bloquear o acesso ou excluir permanentemente.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="
            inline-flex
            shrink-0
            items-center
            gap-2
            rounded-xl
            bg-rose-700
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            shadow-sm
            transition
            hover:bg-rose-800
          "
        >
          <Plus size={16} />
          Novo usuário
        </button>
      </div>

      {pendingUsers.length > 0 && (
        <div className="
          rounded-2xl
          border
          border-amber-200
          bg-amber-50
          px-5
          py-4
        ">
          <p className="
            text-sm
            font-medium
            text-amber-900
          ">
            {pendingUsers.length === 1
              ? "1 cadastro aguardando aprovação"
              : `${pendingUsers.length} cadastros aguardando aprovação`}
          </p>

          <p className="
            mt-1
            text-sm
            text-amber-800/80
          ">
            Revise as solicitações abaixo e aprove ou recuse o acesso.
          </p>
        </div>
      )}

      {loading ? (
        <div className="
          flex
          flex-1
          items-center
          justify-center
          gap-3
          text-zinc-500
        ">
          <Loader2
            size={24}
            className="
              animate-spin
              text-rose-600
            "
          />
          Carregando...
        </div>
      ) : (
        <>
        <div className="
          hidden
          overflow-hidden
          rounded-2xl
          border
          border-zinc-200
          bg-white
          lg:block
        ">

          <table className="
            w-full
            table-fixed
            text-sm
          ">

            <thead className="
              bg-zinc-50
              text-left
              text-zinc-500
            ">

              <tr>
                <th className="px-4 py-3 font-medium">
                  Nome
                </th>
                <th className="px-4 py-3 font-medium">
                  E-mail
                </th>
                <th className="hidden px-4 py-3 font-medium xl:table-cell">
                  Perfil
                </th>
                <th className="px-4 py-3 font-medium">
                  Status
                </th>
                <th className="hidden px-4 py-3 font-medium xl:table-cell">
                  Cadastro
                </th>
                <th className="w-28 px-4 py-3 font-medium text-right">
                  Ações
                </th>
              </tr>

            </thead>

            <tbody>
              {users.map((user) => {

                const isSelf =
                  user.id
                  === currentUser?.id;

                const isPending =
                  !user.approved;

                return (
                  <tr
                    key={user.id}
                    className={`
                      border-t
                      border-zinc-100
                      ${isPending ? "bg-amber-50/40" : ""}
                    `}
                  >

                    <td className="truncate px-4 py-3 font-medium text-zinc-800">
                      {user.name}
                      {isSelf && (
                        <span className="
                          ml-2
                          text-xs
                          font-normal
                          text-zinc-400
                        ">
                          (você)
                        </span>
                      )}
                    </td>

                    <td className="truncate px-4 py-3 text-zinc-600">
                      {user.email}
                    </td>

                    <td className="hidden truncate px-4 py-3 xl:table-cell">
                      <span className={`
                        inline-flex
                        rounded-full
                        px-2.5
                        py-1
                        text-xs
                        font-medium

                        ${
                          user.role === "admin"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-zinc-100 text-zinc-600"
                        }
                      `}>
                        {roleLabel(user.role)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`
                        inline-flex
                        rounded-full
                        px-2.5
                        py-1
                        text-xs
                        font-medium
                        ${statusClass(user)}
                      `}>
                        {statusLabel(user)}
                      </span>
                    </td>

                    <td className="hidden truncate px-4 py-3 text-zinc-500 xl:table-cell">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="
                        flex
                        justify-end
                        gap-1
                      ">
                        <UserActions
                          user={user}
                          currentUser={currentUser}
                          onApprove={handleApprove}
                          onToggleActive={handleToggleActive}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                        />
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>

        </div>

        <div className="space-y-3 lg:hidden">
          {users.map((user) => {
            const isSelf =
              user.id === currentUser?.id;

            const isPending =
              !user.approved;

            return (
              <div
                key={user.id}
                className={`
                  rounded-2xl
                  border
                  border-zinc-200
                  bg-white
                  p-4
                  ${isPending ? "border-amber-200 bg-amber-50/40" : ""}
                `}
              >
                <div className="
                  flex
                  items-start
                  justify-between
                  gap-3
                ">
                  <div className="min-w-0">
                    <p className="
                      truncate
                      font-medium
                      text-zinc-800
                    ">
                      {user.name}
                      {isSelf && (
                        <span className="
                          ml-2
                          text-xs
                          font-normal
                          text-zinc-400
                        ">
                          (você)
                        </span>
                      )}
                    </p>

                    <p className="
                      mt-1
                      truncate
                      text-sm
                      text-zinc-600
                    ">
                      {user.email}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <UserActions
                      user={user}
                      currentUser={currentUser}
                      onApprove={handleApprove}
                      onToggleActive={handleToggleActive}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>

                <div className="
                  mt-3
                  flex
                  flex-wrap
                  items-center
                  gap-2
                ">
                  <span className={`
                    inline-flex
                    rounded-full
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    ${
                      user.role === "admin"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-zinc-100 text-zinc-600"
                    }
                  `}>
                    {roleLabel(user.role)}
                  </span>

                  <span className={`
                    inline-flex
                    rounded-full
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    ${statusClass(user)}
                  `}>
                    {statusLabel(user)}
                  </span>

                  <span className="text-xs text-zinc-500">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      <UserFormModal
        open={modalOpen}
        user={editingUser}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        onSaved={loadData}
      />

    </div>
  );
}
