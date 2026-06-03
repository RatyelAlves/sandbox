import {
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage
from "@/pages/LoginPage";

import RegisterPage
from "@/pages/RegisterPage";

import ForgotPasswordPage
from "@/pages/ForgotPasswordPage";

import ResetPasswordPage
from "@/pages/ResetPasswordPage";

import ChatPage
from "@/pages/ChatPage";

import DashboardPage
from "@/pages/DashboardPage";

import AppointmentsPage
from "@/pages/AppointmentsPage";

import ProceduresPage
from "@/pages/ProceduresPage";

import QuickRepliesPage
from "@/pages/QuickRepliesPage";

import UsersPage
from "@/pages/UsersPage";

import WhatsappSetupPage
from "@/pages/WhatsappSetupPage";

import {
  MainLayout,
  AdminRoute,
} from "@/layouts/MainLayout";

import {
  WhatsappGuard,
} from "@/layouts/WhatsappGuard";

import { getMe }
from "@/api/auth";

import {
  clearAuth,
  getToken,
  saveAuth,
} from "@/lib/authStorage";

import {
  connectSocket,
  disconnectSocket,
} from "@/services/socket";

function AuthLoadingScreen() {

  return (
    <div className="
      flex
      min-h-screen
      items-center
      justify-center
      bg-zinc-950
      text-white/70
    ">
      Carregando...
    </div>
  );
}

export default function App() {

  const [
    user,

    setUser,
  ] = useState(null);

  const [
    authState,

    setAuthState,
  ] = useState("loading");

  useEffect(() => {

    async function bootstrapAuth() {

      const token = getToken();

      if (!token) {
        setAuthState("guest");
        return;
      }

      try {

        const me = await getMe();

        saveAuth({
          token,
          user: me,
        });

        connectSocket(token);

        setUser(me);
        setAuthState("authed");

      } catch {

        clearAuth();
        disconnectSocket();
        setAuthState("guest");
      }
    }

    bootstrapAuth();

  }, []);

  function handleAuthSuccess({
    token,
    user: authUser,
  }) {

    saveAuth({
      token,
      user: authUser,
    });

    connectSocket(token);

    window.history.replaceState(
      null,
      "",
      "/"
    );

    setUser(authUser);
    setAuthState("authed");
  }

  function handleLogout() {

    clearAuth();
    disconnectSocket();
    setUser(null);
    setAuthState("guest");
  }

  if (authState === "loading") {
    return <AuthLoadingScreen />;
  }

  if (authState === "guest") {
    return (
      <BrowserRouter>

        <Routes>

          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={
                  handleAuthSuccess
                }
              />
            }
          />

          <Route
            path="/register"
            element={
              <RegisterPage />
            }
          />

          <Route
            path="/forgot-password"
            element={
              <ForgotPasswordPage />
            }
          />

          <Route
            path="/reset-password"
            element={
              <ResetPasswordPage />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>

      <Routes>

        <Route
          element={
            <MainLayout
              user={user}
              onLogout={
                handleLogout
              }
            />
          }
        >

          <Route
            element={
              <WhatsappGuard
                user={user}
              />
            }
          >

          <Route
            index
            element={
              <DashboardPage
                user={user}
              />
            }
          />

          <Route
            path="chat"
            element={<ChatPage />}
          />

          <Route
            path="appointments"
            element={
              <AppointmentsPage />
            }
          />

          <Route
            path="procedures"
            element={
              <ProceduresPage />
            }
          />

          <Route
            path="quick-replies"
            element={
              <QuickRepliesPage />
            }
          />

          <Route
            path="users"
            element={
              <AdminRoute user={user}>
                <UsersPage
                  currentUser={user}
                />
              </AdminRoute>
            }
          />

          </Route>

          <Route
            path="whatsapp/setup"
            element={
              <AdminRoute user={user}>
                <WhatsappSetupPage />
              </AdminRoute>
            }
          />

        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}
