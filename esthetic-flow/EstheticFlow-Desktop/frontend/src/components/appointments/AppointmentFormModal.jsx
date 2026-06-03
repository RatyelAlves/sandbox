import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  X,
} from "lucide-react";

import {
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
} from "@/lib/appointmentStatus";

import {
  datetimeLocalToIso,
  toDatetimeLocalValue,
} from "@/lib/formatDate";

import {
  createAppointment,
  updateAppointment,
} from "@/api/appointments";

import {
  listProcedures,
} from "@/api/procedures";

const EMPTY_FORM = {
  clientId: "",
  procedure: "",
  date: "",
  durationMin: 60,
  status: "scheduled",
  notes: "",
};

export function AppointmentFormModal({
  open,
  clients,
  appointment,
  defaultClientId,
  onClose,
  onSaved,
}) {

  const [
    form,

    setForm,
  ] = useState(EMPTY_FORM);

  const [
    saving,

    setSaving,
  ] = useState(false);

  const [
    error,

    setError,
  ] = useState("");

  const [
    catalogProcedures,

    setCatalogProcedures,
  ] = useState([]);

  const isEditing =
    Boolean(appointment?.id);

  useEffect(() => {

    if (!open) {
      return;
    }

    setError("");

    listProcedures({
      active: "true",
    })
      .then(setCatalogProcedures)
      .catch(() => {
        setCatalogProcedures([]);
      });

    if (appointment) {
      setForm({
        clientId:
          appointment.clientId ??
          appointment.client?.id ??
          "",

        procedure:
          appointment.procedure ??
          "",

        date: toDatetimeLocalValue(
          appointment.date
        ),

        durationMin:
          appointment.durationMin ??
          60,

        status:
          appointment.status ??
          "scheduled",

        notes:
          appointment.notes ??
          "",
      });

      return;
    }

    setForm({
      ...EMPTY_FORM,
      clientId:
        defaultClientId ?? "",
    });

  }, [
    open,
    appointment,
    defaultClientId,
  ]);

  if (!open) {
    return null;
  }

  function updateField(
    field,
    value
  ) {

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event
  ) {

    event.preventDefault();

    setError("");
    setSaving(true);

    try {

      const payload = {
        clientId: form.clientId,
        procedure: form.procedure.trim(),
        date: datetimeLocalToIso(
          form.date
        ),
        durationMin: Number(
          form.durationMin
        ),
        status: form.status,
        notes: form.notes.trim()
          ? form.notes.trim()
          : undefined,
      };

      const saved = isEditing
        ? await updateAppointment(
            appointment.id,
            payload
          )
        : await createAppointment(
            payload
          );

      onSaved?.(saved);
      onClose?.();

    } catch (submitError) {

      setError(
        submitError
          ?.response
          ?.data
          ?.error ??
          "Não foi possível salvar o agendamento."
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
      p-4
    ">

      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="
          absolute
          inset-0
          bg-zinc-900/40
        "
      />

      <div className="
        relative
        w-full
        max-w-lg
        rounded-3xl
        border
        border-zinc-200
        bg-white
        shadow-xl
      ">

        <div className="
          flex
          items-center
          justify-between
          border-b
          border-zinc-200
          px-6
          py-4
        ">

          <div>

            <h2 className="
              text-lg
              font-semibold
              text-zinc-800
            ">
              {isEditing
                ? "Editar agendamento"
                : "Novo agendamento"}
            </h2>

            <p className="
              text-sm
              text-zinc-500
            ">
              Preencha os dados do
              procedimento
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              p-2
              text-zinc-500
              transition
              hover:bg-zinc-100
              hover:text-zinc-800
            "
          >
            <X size={18} />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="
            space-y-4
            px-6
            py-5
          "
        >

          <label className="
            block
            space-y-1.5
          ">

            <span className="
              text-sm
              font-medium
              text-zinc-700
            ">
              Cliente
            </span>

            <select
              required
              value={form.clientId}
              onChange={(event) =>
                updateField(
                  "clientId",
                  event.target.value
                )
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
                focus:border-rose-300
                focus:ring-2
                focus:ring-rose-100
              "
            >

              <option value="">
                Selecione um cliente
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.name} —{" "}
                  {client.phone}
                </option>
              ))}

            </select>

          </label>

          <label className="
            block
            space-y-1.5
          ">

            <span className="
              text-sm
              font-medium
              text-zinc-700
            ">
              Procedimento
            </span>

            <input
              required
              type="text"
              list="procedure-catalog"
              value={form.procedure}
              onChange={(event) => {
                const value =
                  event.target.value;

                updateField(
                  "procedure",
                  value
                );

                const matched =
                  catalogProcedures.find(
                    (item) =>
                      item.name === value
                  );

                if (matched) {
                  updateField(
                    "durationMin",
                    matched.durationMin
                  );
                }
              }}
              placeholder="Ex: Limpeza de pele"
              className="
                w-full
                rounded-xl
                border
                border-zinc-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-rose-300
                focus:ring-2
                focus:ring-rose-100
              "
            />

            <datalist id="procedure-catalog">
              {catalogProcedures.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.name}
                  />
                )
              )}
            </datalist>

          </label>

          <div className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
          ">

            <label className="
              block
              space-y-1.5
            ">

              <span className="
                text-sm
                font-medium
                text-zinc-700
              ">
                Data e hora
              </span>

              <input
                required
                type="datetime-local"
                value={form.date}
                onChange={(event) =>
                  updateField(
                    "date",
                    event.target.value
                  )
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
                  focus:border-rose-300
                  focus:ring-2
                  focus:ring-rose-100
                "
              />

            </label>

            <label className="
              block
              space-y-1.5
            ">

              <span className="
                text-sm
                font-medium
                text-zinc-700
              ">
                Duração (min)
              </span>

              <input
                required
                type="number"
                min={15}
                max={480}
                step={15}
                value={form.durationMin}
                onChange={(event) =>
                  updateField(
                    "durationMin",
                    event.target.value
                  )
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
                  focus:border-rose-300
                  focus:ring-2
                  focus:ring-rose-100
                "
              />

            </label>

          </div>

          <label className="
            block
            space-y-1.5
          ">

            <span className="
              text-sm
              font-medium
              text-zinc-700
            ">
              Status
            </span>

            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value
                )
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
                focus:border-rose-300
                focus:ring-2
                focus:ring-rose-100
              "
            >

              {APPOINTMENT_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {
                      STATUS_LABELS[
                        status
                      ]
                    }
                  </option>
                )
              )}

            </select>

          </label>

          <label className="
            block
            space-y-1.5
          ">

            <span className="
              text-sm
              font-medium
              text-zinc-700
            ">
              Observações
            </span>

            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              placeholder="Informações adicionais"
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-zinc-200
                px-3
                py-2.5
                text-sm
                outline-none
                focus:border-rose-300
                focus:ring-2
                focus:ring-rose-100
              "
            />

          </label>

          {error && (
            <p className="
              rounded-xl
              border
              border-rose-200
              bg-rose-50
              px-3
              py-2
              text-sm
              text-rose-700
            ">
              {error}
            </p>
          )}

          <div className="
            flex
            flex-col-reverse
            gap-3
            pt-2
            sm:flex-row
            sm:justify-end
          ">

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl
                border
                border-zinc-200
                px-4
                py-2.5
                text-sm
                font-medium
                text-zinc-600
                transition
                hover:bg-zinc-50
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
                justify-center
                gap-2
                rounded-xl
                bg-rose-500
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:bg-rose-600
                disabled:opacity-60
              "
            >

              {saving && (
                <Loader2
                  size={16}
                  className="
                    animate-spin
                  "
                />
              )}

              {isEditing
                ? "Salvar alterações"
                : "Criar agendamento"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}
