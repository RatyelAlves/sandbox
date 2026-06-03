import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  DollarSign,
  Loader2,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  getDashboardStats,
} from "@/api/dashboard";

import {
  formatPriceBrl,
} from "@/lib/procedureFormat";

function formatDashboardDate(date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAppointmentDate(value) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm text-zinc-500">
          {label}
        </span>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold text-zinc-800">
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage({
  user,
}) {

  const isAdmin =
    user?.role === "admin";

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((error) => {
        console.error("Erro ao carregar dashboard", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const todayLabel =
    formatDashboardDate(new Date());

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-zinc-500">
        <Loader2
          size={24}
          className="animate-spin text-rose-600"
        />
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto rounded-2xl bg-[#faf8f7] p-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-zinc-800">
          Dashboard
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">
          {todayLabel}
        </p>
      </div>

      {isAdmin && stats?.pendingApprovals > 0 && (
        <Link
          to="/users"
          className="
            flex
            items-center
            justify-between
            gap-4
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            px-5
            py-4
            transition
            hover:border-amber-300
            hover:bg-amber-100/70
          "
        >
          <div>
            <p className="
              text-sm
              font-medium
              text-amber-900
            ">
              {stats.pendingApprovals === 1
                ? "1 cadastro aguardando aprovação"
                : `${stats.pendingApprovals} cadastros aguardando aprovação`}
            </p>

            <p className="
              mt-1
              text-sm
              text-amber-800/80
            ">
              Clique para revisar e liberar o acesso da equipe.
            </p>
          </div>

          <div className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-amber-200/70
            text-amber-900
          ">
            <UserCheck size={18} />
          </div>
        </Link>
      )}

      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        <StatCard
          label="Hoje"
          value={stats?.appointmentsToday ?? 0}
          icon={CalendarDays}
        />

        <StatCard
          label="Clientes"
          value={stats?.clientsCount ?? 0}
          icon={Users}
        />

        <StatCard
          label="Procedimentos"
          value={stats?.proceduresCount ?? 0}
          icon={Sparkles}
        />

        {isAdmin && (
          <StatCard
            label="Faturamento (mês)"
            value={
              stats?.monthlyRevenueFormatted ??
              formatPriceBrl(0)
            }
            icon={DollarSign}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-zinc-800">
              Próximos Agendamentos
            </h2>

            <Link
              to="/appointments"
              className="text-sm font-medium text-rose-700 hover:text-rose-800"
            >
              Ver todos
            </Link>
          </div>

          {!stats?.upcomingAppointments?.length ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
              Nenhum agendamento encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-800">
                      {appointment.client.name}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {appointment.procedure}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-700">
                      {formatAppointmentDate(
                        appointment.date
                      )}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {appointment.durationMin} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 bg-rose-50 px-5 py-4 text-rose-800">
              <TrendingUp size={18} />
              <h2 className="font-medium">
                Resumo do Mês
              </h2>
            </div>

            <div className="grid grid-cols-2 divide-x divide-zinc-100">
              <div className="px-5 py-6 text-center">
                <p className="text-3xl font-semibold text-zinc-800">
                  {stats?.monthSummary?.completed ?? 0}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Atendimentos realizados
                </p>
              </div>

              <div className="px-5 py-6 text-center">
                <p className="text-3xl font-semibold text-zinc-800">
                  {stats?.monthSummary?.cancelled ?? 0}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Cancelamentos
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-semibold text-zinc-800">
              Procedimentos Populares
            </h2>

            <div className="mt-5 space-y-4">
              {(stats?.popularProcedures ?? []).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm font-medium text-zinc-700">
                    {item.name}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {item.count} agendamentos
                  </span>
                </div>
              ))}

              {!stats?.popularProcedures?.length && (
                <p className="text-sm text-zinc-500">
                  Nenhum procedimento cadastrado
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
