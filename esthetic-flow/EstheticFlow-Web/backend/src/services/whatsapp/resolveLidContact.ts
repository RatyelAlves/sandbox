import type { MessageKey } from "./jid";

import {
  evolutionRequest,
  getEvolutionInstance,
} from "./evolutionApi";

type EvolutionContact = {
  id?: string;
  remoteJid?: string;
  pushName?: string | null;
  profilePicUrl?: string | null;
};

type EvolutionMessage = {
  key?: MessageKey & {
    participant?: string;
  };
};

function isPhoneJid(
  jid?: string | null
): jid is string {

  return Boolean(
    jid?.endsWith(
      "@s.whatsapp.net"
    )
  );
}

function normalizePushName(
  value?: string | null
) {

  return value
    ?.trim()
    .toLowerCase();
}

function pickPhoneJidFromKey(
  key?: MessageKey & {
    participant?: string;
  }
): string | null {

  if (!key) {
    return null;
  }

  const candidates = [
    key.remoteJidAlt,
    key.senderPn,
    key.participant,
    key.previousRemoteJid,
    key.remoteJid,
  ];

  for (const candidate of candidates) {
    if (isPhoneJid(candidate)) {
      return candidate;
    }
  }

  return null;
}

const ALL_CONTACTS_CACHE_TTL_MS =
  30 * 1000;

let allContactsCache: {
  fetchedAt: number;
  contacts: EvolutionContact[];
} | null = null;

async function findContacts(
  where?: Record<
    string,
    unknown
  >
): Promise<EvolutionContact[]> {

  const isAll = !where;

  if (isAll && allContactsCache) {
    const fresh =
      Date.now() -
        allContactsCache.fetchedAt <
      ALL_CONTACTS_CACHE_TTL_MS;

    if (fresh) {
      return allContactsCache.contacts;
    }

    allContactsCache = null;
  }

  const instance =
    getEvolutionInstance();

  const data =
    await evolutionRequest<
      EvolutionContact[]
    >({
      path: `/chat/findContacts/${instance}`,

      body: where
        ? { where }
        : {},
    });

  const contacts = Array.isArray(data)
    ? data
    : [];

  if (isAll) {
    allContactsCache = {
      fetchedAt: Date.now(),
      contacts,
    };
  }

  return contacts;
}

export function invalidateAllContactsCache() {
  allContactsCache = null;
}

async function findContactByRemoteJid(
  remoteJid: string
) {

  const contacts =
    await findContacts({
      remoteJid,
    });

  return contacts[0] ?? null;
}

async function findPhoneJidFromMessages(
  lidJid: string
) {

  const instance =
    getEvolutionInstance();

  const data =
    await evolutionRequest<{
      messages?: {
        records?: EvolutionMessage[];
      };
    }>({
      path: `/chat/findMessages/${instance}`,

      body: {
        where: {
          key: {
            remoteJid: lidJid,
          },
        },

        page: 1,
        offset: 10,
      },
    });

  const records =
    data?.messages?.records ?? [];

  for (const record of records) {
    const phoneJid =
      pickPhoneJidFromKey(
        record.key
      );

    if (phoneJid) {
      return phoneJid;
    }
  }

  return null;
}

async function findPhoneJidByPushName(
  pushName?: string | null
) {

  const normalized =
    normalizePushName(
      pushName
    );

  if (!normalized) {
    return null;
  }

  const contacts =
    await findContacts();

  const phoneJid =
    contacts.find(
      (contact) =>
        isPhoneJid(
          contact.remoteJid
        ) &&
        normalizePushName(
          contact.pushName
        ) === normalized
    )?.remoteJid ?? null;

  return phoneJid;
}

async function findPhoneJidInAllContacts(
  lidJid: string
) {

  const contacts =
    await findContacts();

  const lidLocal =
    lidJid.split("@")[0];

  for (const contact of contacts) {
    if (
      contact.remoteJid ===
        lidJid &&
      isPhoneJid(
        contact.remoteJid
      )
    ) {
      return contact.remoteJid;
    }

    if (
      contact.id?.includes(
        lidLocal
      ) &&
      isPhoneJid(
        contact.remoteJid
      )
    ) {
      return contact.remoteJid!;
    }
  }

  return null;
}

export type ResolveLidContext = {
  lidJid: string;
  pushName?: string | null;
  webhookKey?: MessageKey & {
    participant?: string;
  };
};

/**
 * Resolve @lid → @s.whatsapp.net usando webhook,
 * findContacts e findMessages da Evolution API.
 */
export async function resolvePhoneJidFromEvolution(
  lidJid: string,
  pushName?: string | null,
  webhookKey?: MessageKey & {
    participant?: string;
  }
): Promise<string | null> {

  const fromWebhook =
    pickPhoneJidFromKey(
      webhookKey
    );

  if (fromWebhook) {
    console.log(
      "LID resolvido via webhook:",
      lidJid,
      "->",
      fromWebhook
    );

    return fromWebhook;
  }

  const fromMessages =
    await findPhoneJidFromMessages(
      lidJid
    );

  if (fromMessages) {
    console.log(
      "LID resolvido via findMessages:",
      lidJid,
      "->",
      fromMessages
    );

    return fromMessages;
  }

  const fromContactFilter =
    await findContactByRemoteJid(
      lidJid
    );

  if (
    isPhoneJid(
      fromContactFilter?.remoteJid
    )
  ) {
    console.log(
      "LID resolvido via findContacts:",
      lidJid,
      "->",
      fromContactFilter.remoteJid
    );

    return fromContactFilter.remoteJid;
  }

  const fromPushName =
    await findPhoneJidByPushName(
      pushName
    );

  if (fromPushName) {
    console.log(
      "LID resolvido via pushName:",
      lidJid,
      "->",
      fromPushName
    );

    return fromPushName;
  }

  const fromScan =
    await findPhoneJidInAllContacts(
      lidJid
    );

  if (fromScan) {
    console.log(
      "LID resolvido via scan:",
      lidJid,
      "->",
      fromScan
    );

    return fromScan;
  }

  console.warn(
    "LID não resolvido:",
    lidJid,
    pushName ?? "(sem pushName)"
  );

  return null;
}

export async function resolvePhoneJid(
  context: ResolveLidContext
) {

  return resolvePhoneJidFromEvolution(
    context.lidJid,
    context.pushName,
    context.webhookKey
  );
}
