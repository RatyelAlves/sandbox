type MessageKey = {
  remoteJid?: string;
  remoteJidAlt?: string;
  senderPn?: string;
  previousRemoteJid?: string;
  participant?: string;
  fromMe?: boolean;
  id?: string;
};

function pickPhoneJid(
  value?: string | null
): string | undefined {

  if (
    value?.endsWith(
      "@s.whatsapp.net"
    )
  ) {
    return value;
  }

  return undefined;
}

/** JID do contato (cliente), não o `sender` da instância conectada. */
export function extractRemoteJid(body: {
  data?: { key?: MessageKey };
}): string | undefined {
  return body.data?.key?.remoteJid;
}

/** JID alternativo enviado em versões mais novas da Evolution. */
export function extractRemoteJidAlt(body: {
  data?: {
    key?: MessageKey;
    participant?: string;
  };
}): string | undefined {

  const key = body.data?.key;

  const candidates = [
    key?.remoteJidAlt,
    key?.senderPn,
    key?.participant,
    key?.previousRemoteJid,
    body.data?.participant,
  ];

  for (const candidate of candidates) {
    const phoneJid =
      pickPhoneJid(candidate);

    if (phoneJid) {
      return phoneJid;
    }
  }

  return undefined;
}

/** JID usado para enviar mensagem pela Evolution API. */
export function resolveSendableJid(
  remoteJid: string,
  remoteJidAlt?: string | null
): string {
  if (
    remoteJid.endsWith("@lid") &&
    remoteJidAlt
  ) {
    return remoteJidAlt;
  }

  return remoteJid;
}

/** Número/JID para Evolution API sendText. */
export function jidToEvolutionNumber(jid: string): string {
  if (jid.endsWith("@s.whatsapp.net")) {
    return jid.replace("@s.whatsapp.net", "");
  }

  return jid;
}

/** Telefone para gravar no banco (Client.phone). */
export function jidToPhone(jid: string): string {
  if (jid.endsWith("@s.whatsapp.net")) {
    return jid.replace("@s.whatsapp.net", "");
  }

  const local = jid.split("@")[0];
  return local || jid;
}

export function isLidJid(jid: string): boolean {
  return jid.endsWith("@lid");
}

export type { MessageKey };
