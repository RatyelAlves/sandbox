import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useWhatsappStatus,
} from "@/contexts/WhatsappStatusContext";

export function WhatsappGuard({
  user,
}) {

  const location = useLocation();

  const {
    connected,
    loading,
  } = useWhatsappStatus();

  const isAdmin =
    user?.role === "admin";

  if (loading && connected === null) {
    return (
      <div className="
        flex
        h-full
        items-center
        justify-center
        text-zinc-500
      ">
        Carregando...
      </div>
    );
  }

  if (
    isAdmin &&
    connected === false &&
    location.pathname === "/"
  ) {
    return (
      <Navigate
        to="/chat"
        replace
      />
    );
  }

  return <Outlet />;
}
