import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import { AppointmentsToolbar }
from "@/components/appointments/AppointmentsToolbar";

import { WeekCalendar }
from "@/components/appointments/WeekCalendar";

import { AppointmentsTable }
from "@/components/appointments/AppointmentsTable";

import { AppointmentFormModal }
from "@/components/appointments/AppointmentFormModal";

import { GoogleCalendarBanner }
from "@/components/appointments/GoogleCalendarBanner";

import {
  addWeeks,
  startOfWeek,
  toIsoRange,
} from "@/lib/formatDate";

import {
  deleteAppointment,
  listAppointments,
} from "@/api/appointments";

import { listClients }
from "@/api/clients";

import {
  getGoogleCalendarStatus,
} from "@/api/google";

export default function AppointmentsPage() {

  const [
    searchParams,

    setSearchParams,
  ] = useSearchParams();

  const [
    appointments,

    setAppointments,
  ] = useState([]);

  const [
    clients,

    setClients,
  ] = useState([]);

  const [
    loading,

    setLoading,
  ] = useState(true);

  const [
    search,

    setSearch,
  ] = useState("");

  const [
    status,

    setStatus,
  ] = useState("");

  const [
    weekStart,

    setWeekStart,
  ] = useState(() =>
    startOfWeek(new Date())
  );

  const [
    modalOpen,

    setModalOpen,
  ] = useState(false);

  const [
    editingAppointment,

    setEditingAppointment,
  ] = useState(null);

  const [
    googleStatus,

    setGoogleStatus,
  ] = useState(null);

  const [
    googleNotice,

    setGoogleNotice,
  ] = useState("");

  const defaultClientId =
    searchParams.get("clientId");

  const shouldOpenCreate =
    searchParams.get("new") === "1";

  const loadData =
    useCallback(async () => {

      setLoading(true);

      try {

        const range = toIsoRange(
          weekStart
        );

        const params = {
          from: range.from,
          to: range.to,
        };

        if (status) {
          params.status = status;
        }

        if (search.trim()) {
          params.search =
            search.trim();
        }

        const [
          appointmentsData,
          clientsData,
        ] = await Promise.all([
          listAppointments(params),
          listClients(),
        ]);

        setAppointments(
          appointmentsData
        );

        setClients(clientsData);

      } catch (error) {

        console.error(
          "Erro ao carregar agendamentos:",
          error
        );

      } finally {
        setLoading(false);
      }

    },

    [
      weekStart,
      status,
      search,
    ]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {

    getGoogleCalendarStatus()
      .then(setGoogleStatus)
      .catch((error) => {
        console.error(
          "Erro ao carregar status Google:",
          error
        );
      });

  }, []);

  useEffect(() => {

    const googleParam =
      searchParams.get("google");

    if (!googleParam) {
      return;
    }

    if (googleParam === "connected") {
      setGoogleNotice(
        "Google Calendar conectado com sucesso."
      );

      getGoogleCalendarStatus()
        .then(setGoogleStatus);
    }

    if (googleParam === "error") {
      setGoogleNotice(
        "Não foi possível conectar o Google Calendar."
      );
    }

    const nextParams =
      new URLSearchParams(
        searchParams
      );

    nextParams.delete("google");

    setSearchParams(
      nextParams,
      { replace: true }
    );

  }, [
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {

    if (!shouldOpenCreate) {
      return;
    }

    setEditingAppointment(null);
    setModalOpen(true);

    const nextParams =
      new URLSearchParams(
        searchParams
      );

    nextParams.delete("new");

    setSearchParams(
      nextParams,
      { replace: true }
    );

  }, [
    shouldOpenCreate,
    searchParams,
    setSearchParams,
  ]);

  const sortedAppointments =
    useMemo(() => {

      return [...appointments].sort(
        (left, right) =>
          new Date(left.date) -
          new Date(right.date)
      );

    },

    [appointments]
  );

  function handleWeekChange(
    direction
  ) {

    setWeekStart((current) =>
      addWeeks(
        current,
        direction
      )
    );
  }

  function handleCreate() {

    setEditingAppointment(null);
    setModalOpen(true);
  }

  function handleEdit(
    appointment
  ) {

    setEditingAppointment(
      appointment
    );

    setModalOpen(true);
  }

  async function handleDelete(
    appointment
  ) {

    if (!appointment?.id) {
      window.alert(
        "Agendamento inválido."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir agendamento de ${appointment.client?.name ?? "cliente"}?`
      );

    if (!confirmed) {
      return;
    }

    try {

      await deleteAppointment(
        appointment.id
      );

      setAppointments((current) =>
        current.filter(
          (item) =>
            item.id !==
            appointment.id
        )
      );

    } catch (error) {

      console.error(
        "Erro ao excluir agendamento:",
        error
      );

      window.alert(
        error?.response?.data?.error ||
          "Não foi possível excluir o agendamento."
      );

      return;
    }

    await loadData();
  }

  function handleCloseModal() {

    setModalOpen(false);
    setEditingAppointment(null);
  }

  async function handleSaved() {
    await loadData();
  }

  return (
    <div className="
      h-full
      overflow-hidden
      rounded-3xl
      border
      border-zinc-200
      bg-white
      flex
      flex-col
    ">

      <AppointmentsToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        weekStart={weekStart}
        onWeekChange={
          handleWeekChange
        }
        onCreate={handleCreate}
      />

      {googleNotice && (
        <div className="
          mx-4
          mt-4
          rounded-xl
          border
          border-zinc-200
          bg-zinc-50
          px-4
          py-3
          text-sm
          text-zinc-700
          sm:mx-6
        ">
          {googleNotice}
        </div>
      )}

      <GoogleCalendarBanner
        status={googleStatus}
      />

      <div className="
        flex-1
        overflow-y-auto
      ">

        <WeekCalendar
          weekStart={weekStart}
          appointments={
            sortedAppointments
          }
          onSelect={handleEdit}
        />

        <div className="
          px-4
          py-3
          sm:px-6
        ">

          <h2 className="
            text-sm
            font-semibold
            text-zinc-700
          ">
            Listagem da semana
          </h2>

        </div>

        <AppointmentsTable
          appointments={
            sortedAppointments
          }
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

      </div>

      <AppointmentFormModal
        open={modalOpen}
        clients={clients}
        appointment={
          editingAppointment
        }
        defaultClientId={
          defaultClientId
        }
        onClose={handleCloseModal}
        onSaved={handleSaved}
      />

    </div>
  );
}
