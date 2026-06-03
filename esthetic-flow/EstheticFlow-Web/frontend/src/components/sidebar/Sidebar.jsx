import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Users,
  Zap,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import {
  getPendingUsersCount,
} from "@/api/users";

import {
  useWhatsappStatus,
} from "@/contexts/WhatsappStatusContext";

const STORAGE_KEY =
  "estheticflow:sidebarCollapsed";

const navItems = [
  {
    to: "/",
    end: true,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/appointments",
    label: "Agendamentos",
    icon: CalendarDays,
  },
  {
    to: "/procedures",
    label: "Procedimentos",
    icon: ClipboardList,
  },
  {
    to: "/quick-replies",
    label: "Respostas Rápidas",
    icon: Zap,
  },
  {
    to: "/chat",
    label: "Chat Clientes",
    icon: MessageCircle,
  },
];

function getNavLinkClass(
  collapsed
) {
  return ({
    isActive,
  }) => `

    w-full
    flex
    items-center
    rounded-xl
    text-sm
    transition
    ${
      collapsed
        ? "justify-center px-3 py-3"
        : "gap-3 px-4 py-3"
    }
    ${
      isActive
        ? "bg-rose-500 text-white"
        : "text-zinc-600 hover:bg-rose-50 hover:text-rose-600"
    }
  `;
}

export function Sidebar({
  user,
  onLogout,
}) {

  const userName =
    user?.name || user?.email;

  const isAdmin =
    user?.role === "admin";

  const visibleNavItems = [
    ...navItems,
    ...(isAdmin
      ? [
          {
            to: "/users",
            label: "Usuários",
            icon: Users,
          },
        ]
      : []),
  ];

  const [
    collapsed,

    setCollapsed,
  ] = useState(() =>
    localStorage.getItem(STORAGE_KEY) ===
      "true"
  );

  const [
    pendingCount,

    setPendingCount,
  ] = useState(0);

  const {
    profileName: whatsappProfileName,
    connected: whatsappConnected,
    loading: whatsappLoading,
  } = useWhatsappStatus();

  const clinicName =
    whatsappProfileName?.trim() ||
    (whatsappConnected === false
      ? "WhatsApp desconectado"
      : whatsappLoading
        ? "Carregando..."
        : "WhatsApp");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      String(collapsed)
    );
  }, [collapsed]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    getPendingUsersCount()
      .then(setPendingCount)
      .catch(() => {
        setPendingCount(0);
      });
  }, [isAdmin]);

  return (
    <aside
      className={`
        shrink-0
        border-r
        border-zinc-200
        bg-white
        flex
        flex-col
        transition-all
        duration-300
        ease-in-out
        ${
          collapsed
            ? "w-[72px]"
            : "w-52"
        }
      `}
    >

      <div
        className={`
          border-b
          border-zinc-200
          flex
          items-center
          ${
            collapsed
              ? "flex-col justify-center gap-2 px-2 py-3"
              : "h-16 gap-3 px-4"
          }
        `}
      >

        <div
          className={`
            flex
            items-center
            min-w-0
            ${
              collapsed
                ? "justify-center"
                : "gap-3 flex-1"
            }
          `}
        >

          <div className="
            w-9
            h-9
            shrink-0
            rounded-xl
            bg-rose-500
            flex
            items-center
            justify-center
            text-white
          ">
            ✦
          </div>

          {!collapsed && (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <div className="min-w-0">
                <h1
                  className="
                    truncate
                    font-bold
                    text-zinc-800
                  "
                  title={clinicName}
                >
                  {clinicName}
                </h1>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCollapsed(
                    (value) => !value
                  )
                }
                title="Minimizar menu"
                className="
                  shrink-0
                  rounded-lg
                  p-1.5
                  text-zinc-400
                  transition
                  hover:bg-zinc-100
                  hover:text-zinc-600
                "
              >
                <ChevronLeft size={16} />
              </button>
            </div>
          )}

        </div>

        {collapsed && (
          <button
            type="button"
            onClick={() =>
              setCollapsed(
                (value) => !value
              )
            }
            title="Expandir menu"
            className="
              rounded-lg
              p-1.5
              text-zinc-400
              transition
              hover:bg-zinc-100
              hover:text-zinc-600
            "
          >
            <ChevronRight size={16} />
          </button>
        )}

      </div>

      <nav className="
        flex-1
        p-3
        space-y-2
      ">

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const showBadge =
            item.to === "/users" &&
            pendingCount > 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={
                collapsed
                  ? item.label
                  : undefined
              }
              className={getNavLinkClass(
                collapsed
              )}
            >

              <span className="relative">
                <Icon size={18} />

                {showBadge && (
                  <span className="
                    absolute
                    -right-1.5
                    -top-1.5
                    flex
                    h-4
                    min-w-4
                    items-center
                    justify-center
                    rounded-full
                    bg-amber-500
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  ">
                    {pendingCount > 9
                      ? "9+"
                      : pendingCount}
                  </span>
                )}
              </span>

              {!collapsed && item.label}

            </NavLink>
          );
        })}

      </nav>

      <div className="
        border-t
        border-zinc-200
        p-3
        space-y-2
      ">

        {userName && !collapsed && (
          <p className="
            px-3
            text-xs
            text-zinc-500
            truncate
          ">
            {userName}
          </p>
        )}

        <button
          type="button"
          onClick={onLogout}
          title={
            collapsed
              ? "Sair"
              : undefined
          }
          className={`
            w-full
            flex
            items-center
            rounded-xl
            text-sm
            text-zinc-600
            border
            border-zinc-200
            transition
            hover:bg-rose-50
            hover:border-rose-200
            hover:text-rose-600
            ${
              collapsed
                ? "justify-center px-3 py-3"
                : "gap-3 px-4 py-3"
            }
          `}
        >

          <LogOut size={18} />

          {!collapsed && "Sair"}

        </button>

      </div>

    </aside>
  );
}
