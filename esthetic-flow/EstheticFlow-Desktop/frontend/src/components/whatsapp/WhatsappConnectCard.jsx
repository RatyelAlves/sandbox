import {
  Loader2,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import {
  useWhatsappStatus,
} from "@/contexts/WhatsappStatusContext";

export function WhatsappConnectCard({
  variant = "page",
}) {

  const {
    connected,
    qrCode,
    loading,
    error,
    isAdmin,
    refresh,
  } = useWhatsappStatus();

  if (!isAdmin) {
    return (
      <div className="
        w-full
        max-w-md
        rounded-3xl
        border
        border-zinc-200
        bg-white
        p-8
        text-center
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
          bg-amber-100
          text-amber-600
        ">
          <MessageCircle size={28} />
        </div>

        <h2 className="
          font-serif
          text-xl
          font-semibold
          text-zinc-800
        ">
          WhatsApp desconectado
        </h2>

        <p className="
          mt-2
          text-sm
          text-zinc-500
        ">
          Peça para um administrador conectar o WhatsApp da clínica.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`
        w-full
        max-w-md
        rounded-3xl
        border
        border-zinc-200
        bg-white
        p-8
        shadow-sm
        ${
          variant === "inline"
            ? "max-h-[90%] overflow-y-auto"
            : ""
        }
      `}
    >
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

      <h2 className="
        text-center
        font-serif
        text-2xl
        font-semibold
        text-zinc-800
      ">
        Conectar WhatsApp
      </h2>

      <p className="
        mt-2
        text-center
        text-sm
        text-zinc-500
      ">
        Escaneie o QR Code com o WhatsApp da clínica para começar a atender.
      </p>

      {connected === true ? (
        <div className="
          mt-8
          rounded-2xl
          bg-emerald-50
          px-4
          py-6
          text-center
          text-emerald-700
        ">
          WhatsApp conectado.
        </div>
      ) : loading && !qrCode ? (
        <div className="
          mt-8
          flex
          flex-col
          items-center
          gap-3
          text-zinc-500
        ">
          <Loader2
            size={28}
            className="
              animate-spin
              text-rose-600
            "
          />
          Preparando conexão...
        </div>
      ) : (
        <div className="
          mt-8
          flex
          flex-col
          items-center
          gap-4
        ">
          {qrCode ? (
            <img
              src={
                qrCode.startsWith(
                  "data:"
                )
                  ? qrCode
                  : `data:image/png;base64,${qrCode}`
              }
              alt="QR Code WhatsApp"
              className="
                h-56
                w-56
                rounded-2xl
                border
                border-zinc-200
                bg-white
                object-contain
                p-3
              "
            />
          ) : (
            <div className="
              flex
              h-56
              w-56
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-zinc-300
              text-sm
              text-zinc-500
            ">
              Gerando QR Code...
            </div>
          )}

          <button
            type="button"
            onClick={refresh}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-zinc-200
              px-4
              py-2
              text-sm
              font-medium
              text-zinc-700
              transition
              hover:bg-zinc-50
            "
          >
            <RefreshCw size={16} />
            Atualizar QR Code
          </button>
        </div>
      )}

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

      {connected !== true && (
        <ol className="
          mt-6
          space-y-2
          text-sm
          text-zinc-600
        ">
          <li>1. Abra o WhatsApp no celular da clínica</li>
          <li>2. Menu → Aparelhos conectados → Conectar aparelho</li>
          <li>3. Aponte a câmera para o QR Code acima</li>
        </ol>
      )}
    </div>
  );
}
