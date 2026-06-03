import {
  CalendarSync,
  Link2,
} from "lucide-react";

import {
  getGoogleAuthUrl,
} from "@/api/google";

export function GoogleCalendarBanner({
  status,
}) {

  if (!status) {
    return null;
  }

  if (
    status.connected
  ) {
    return (
      <div className="
        mx-4
        mt-4
        flex
        items-center
        gap-2
        rounded-xl
        border
        border-emerald-200
        bg-emerald-50
        px-4
        py-3
        text-sm
        text-emerald-800
        sm:mx-6
      ">

        <CalendarSync size={16} />

        Google Calendar conectado
        {status.calendarEmail && (
          <span className="
            text-emerald-700/80
          ">
            ({status.calendarEmail})
          </span>
        )}

      </div>
    );
  }

  if (!status.configured) {
    return (
      <div className="
        mx-4
        mt-4
        rounded-xl
        border
        border-amber-200
        bg-amber-50
        px-4
        py-3
        text-sm
        text-amber-800
        sm:mx-6
      ">
        Configure{" "}
        <code className="
          rounded
          bg-amber-100
          px-1
        ">
          GOOGLE_CLIENT_ID
        </code>{" "}
        e{" "}
        <code className="
          rounded
          bg-amber-100
          px-1
        ">
          GOOGLE_CLIENT_SECRET
        </code>{" "}
        no backend para sincronizar com o Google Calendar.
      </div>
    );
  }

  return (
    <div className="
      mx-4
      mt-4
      flex
      flex-col
      gap-3
      rounded-xl
      border
      border-sky-200
      bg-sky-50
      px-4
      py-3
      text-sm
      text-sky-900
      sm:mx-6
      sm:flex-row
      sm:items-center
      sm:justify-between
    ">

      <div className="
        flex
        items-center
        gap-2
      ">

        <CalendarSync size={16} />

        Conecte o Google Calendar para
        sincronizar agendamentos
        automaticamente.

      </div>

      <a
        href={getGoogleAuthUrl()}
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-sky-600
          px-4
          py-2
          text-sm
          font-medium
          text-white
          transition
          hover:bg-sky-700
        "
      >

        <Link2 size={16} />

        Conectar Google

      </a>

    </div>
  );
}
