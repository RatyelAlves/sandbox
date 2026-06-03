import {
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/appointmentStatus";

export function AppointmentStatusBadge({
  status,
}) {

  const label =
    STATUS_LABELS[status] ??
    status;

  const style =
    STATUS_STYLES[status] ??
    STATUS_STYLES.scheduled;

  return (
    <span className={`
      inline-flex
      items-center
      rounded-full
      border
      px-2.5
      py-1
      text-xs
      font-medium
      ${style}
    `}>
      {label}
    </span>
  );
}
