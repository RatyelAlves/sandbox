import {
  CheckCircle2,
  Loader2,
  LogOut,
  MessageCircle,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  WhatsappConnectCard,
} from "@/components/whatsapp/WhatsappConnectCard";

import {
  useWhatsappStatus,
} from "@/contexts/WhatsappStatusContext";

export default function WhatsappSetupPage() {

  const {
    connected,
    profileName,
    isAdmin,
    disconnect,
  } = useWhatsappStatus();

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function handleDisconnect() {

    if (busy) {
      return;
    }

    const ok = window.confirm(
      "Tem certeza que deseja desconectar o WhatsApp da clínica?"
    );

    if (!ok) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await disconnect();
    } catch (disconnectError) {
      console.error(
        disconnectError
      );

      setError(
        "Não foi possível desconectar o WhatsApp."
      );
    } finally {
      setBusy(false);
    }
  }

  if (connected !== true) {
    return (
      <div className="
        flex
        h-full
        min-w-0
        items-center
        justify-center
        overflow-y-auto
        rounded-2xl
        bg-[#faf8f7]
        p-6
      ">
        <WhatsappConnectCard />
      </div>
    );
  }

  return (
    <div className="
      flex
      h-full
      min-w-0
      items-center
      justify-center
      overflow-y-auto
      rounded-2xl
      bg-[#faf8f7]
      p-6
    ">
      <div className="
        w-full
        max-w-lg
        rounded-3xl
        border
        border-zinc-200
        bg-white
        p-8
        shadow-sm
      ">
        <div className="
          mx-auto
          mb-4
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-emerald-100
          text-emerald-600
        ">
          <MessageCircle size={28} />
        </div>

        <h1 className="
          text-center
          font-serif
          text-2xl
          font-semibold
          text-zinc-800
        ">
          WhatsApp conectado
        </h1>

        <p className="
          mt-2
          text-center
          text-sm
          text-zinc-500
        ">
          Sua clínica está pronta para receber e enviar mensagens.
        </p>

        <div className="
          mt-8
          flex
          flex-col
          items-center
          gap-4
        ">
          <div className="
            flex
            w-full
            items-center
            gap-3
            rounded-2xl
            bg-emerald-50
            px-4
            py-4
            text-emerald-700
          ">
            <CheckCircle2
              size={22}
              className="shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Conectado como
              </p>

              <p
                className="truncate text-base font-semibold"
                title={profileName}
              >
                {profileName ||
                  "Estética Clínica"}
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={busy}
              className="
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-rose-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-rose-600
                transition
                hover:bg-rose-50
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {busy ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Desconectando...
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  Desconectar WhatsApp
                </>
              )}
            </button>
          )}

          <p className="
            text-center
            text-xs
            text-zinc-500
          ">
            Você também pode gerenciar a conexão pelo menu na tela de chat.
          </p>
        </div>

        {error && (
          <p className="
            mt-4
            text-center
            text-sm
            text-amber-700
          ">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
