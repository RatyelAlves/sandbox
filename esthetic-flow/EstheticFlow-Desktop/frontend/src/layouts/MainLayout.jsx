import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { Sidebar }
from "@/components/sidebar/Sidebar";

import {
  WhatsappStatusProvider,
} from "@/contexts/WhatsappStatusContext";

export function MainLayout({
  user,
  onLogout,
}) {

  return (
    <WhatsappStatusProvider user={user}>
      <div className="
        h-screen
        bg-zinc-100
        flex
        overflow-hidden
      ">

        <Sidebar
          user={user}
          onLogout={onLogout}
        />

        <main className="
          flex-1
          p-4
          min-h-0
          min-w-0
          flex
          flex-col
          overflow-hidden
        ">
          <Outlet />
        </main>

      </div>
    </WhatsappStatusProvider>
  );
}

export function AdminRoute({
  user,
  children,
}) {

  if (user?.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}
