import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  disconnectWhatsapp as disconnectWhatsappApi,
  getWhatsappProfile,
  getWhatsappQrCode,
  setupWhatsapp,
  syncWhatsappHistory as syncWhatsappHistoryApi,
} from "@/api/whatsapp";

import {
  getSocket,
} from "@/services/socket";

const POLL_CONNECTED_MS = 60000;

const POLL_DISCONNECTED_MS = 4000;

const WhatsappStatusContext =
  createContext(null);

export function WhatsappStatusProvider({
  user,
  children,
}) {

  const isAdmin =
    user?.role === "admin";

  const [
    connected,
    setConnected,
  ] = useState(null);

  const [
    profileName,
    setProfileName,
  ] = useState("");

  const [
    qrCode,
    setQrCode,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    lastSync,
    setLastSync,
  ] = useState(null);

  const setupCalledRef = useRef(false);

  const previousConnectedRef =
    useRef(null);

  const autoSyncDoneRef =
    useRef(false);

  const refresh =
    useCallback(async () => {

      try {
        const profile =
          await getWhatsappProfile();

        if (profile?.profileName) {
          setProfileName(
            profile.profileName
          );
        } else if (!profile?.connected) {
          setProfileName("");
        }

        if (profile?.connected) {
          setConnected(true);
          setQrCode(null);
          setError("");
          return { connected: true };
        }

        setConnected(false);

        if (!isAdmin) {
          setQrCode(null);
          return { connected: false };
        }

        if (!setupCalledRef.current) {
          try {
            await setupWhatsapp();
            setupCalledRef.current = true;
          } catch (setupError) {
            console.error(
              setupError
            );
          }
        }

        const qr =
          await getWhatsappQrCode();

        if (qr?.connected) {
          setConnected(true);
          setQrCode(null);
          setError("");
          return { connected: true };
        }

        setQrCode(qr?.qrCode || null);
        setError("");

        return { connected: false };
      } catch (refreshError) {
        console.error(
          refreshError
        );

        setError(
          "Não foi possível verificar o WhatsApp."
        );

        return { connected: false };
      }
    }, [isAdmin]);

  const disconnect =
    useCallback(async () => {

      if (!isAdmin) {
        return;
      }

      await disconnectWhatsappApi();

      setupCalledRef.current = false;
      autoSyncDoneRef.current = false;
      setConnected(false);
      setQrCode(null);
      setLoading(true);

      await refresh();

      setLoading(false);
    }, [isAdmin, refresh]);

  const sync =
    useCallback(async ({
      wait = true,
      force = false,
    } = {}) => {

      if (!isAdmin) {
        return null;
      }

      if (syncing) {
        return null;
      }

      setSyncing(true);

      try {
        const result =
          await syncWhatsappHistoryApi({
            wait,
            force,
          });

        if (
          wait &&
          result?.progress
        ) {
          setLastSync({
            at: new Date(),
            ...result.progress,
          });
        } else {
          setLastSync({
            at: new Date(),
            running: true,
          });
        }

        return result;
      } catch (syncError) {
        console.error(
          syncError
        );

        return null;
      } finally {
        setSyncing(false);
      }
    }, [isAdmin, syncing]);

  useEffect(() => {

    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      await refresh();

      if (!cancelled) {
        setLoading(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [user, refresh]);

  useEffect(() => {

    if (!user) {
      return;
    }

    const interval =
      connected === false
        ? POLL_DISCONNECTED_MS
        : POLL_CONNECTED_MS;

    let intervalId = null;

    function start() {
      stop();
      intervalId = setInterval(() => {
        refresh();
      }, interval);
    }

    function stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    function handleVisibility() {
      if (document.hidden) {
        stop();
        return;
      }

      refresh();
      start();
    }

    if (!document.hidden) {
      start();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      stop();

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [user, connected, refresh]);

  useEffect(() => {

    if (!user) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      return;
    }

    function handleStatusEvent(payload) {

      const nextConnected = Boolean(
        payload?.connected
      );

      setConnected(nextConnected);

      if (nextConnected) {
        setQrCode(null);
        setError("");
      }

      refresh();
    }

    socket.on(
      "whatsapp-status",
      handleStatusEvent
    );

    function handleAccountChanged(
      payload
    ) {
      const resetAccount = Boolean(
        payload?.switched ||
        payload?.expectAccountReset ||
        payload?.legacySwitch
      );

      if (resetAccount) {
        autoSyncDoneRef.current = true;
      } else {
        autoSyncDoneRef.current = false;
      }

      refresh();
    }

    socket.on(
      "whatsapp-account-changed",
      handleAccountChanged
    );

    return () => {
      socket.off(
        "whatsapp-status",
        handleStatusEvent
      );

      socket.off(
        "whatsapp-account-changed",
        handleAccountChanged
      );
    };
  }, [user, refresh]);

  const value = {
    connected,
    profileName,
    qrCode,
    loading,
    error,
    isAdmin,
    syncing,
    lastSync,
    refresh,
    disconnect,
    sync,
  };

  return (
    <WhatsappStatusContext.Provider
      value={value}
    >
      {children}
    </WhatsappStatusContext.Provider>
  );
}

export function useWhatsappStatus() {
  const ctx = useContext(
    WhatsappStatusContext
  );

  if (!ctx) {
    return {
      connected: null,
      profileName: "",
      qrCode: null,
      loading: false,
      error: "",
      isAdmin: false,
      syncing: false,
      lastSync: null,
      refresh: async () => {},
      disconnect: async () => {},
      sync: async () => null,
    };
  }

  return ctx;
}
