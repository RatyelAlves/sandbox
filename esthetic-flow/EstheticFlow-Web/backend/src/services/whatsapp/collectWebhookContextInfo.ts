import {
  mergeContextInfo,
  normalizeContextInfo,
} from "./parseWhatsappMessage";

function walkForContextInfo(
  node: unknown,
  depth: number,
  found: ReturnType<
    typeof normalizeContextInfo
  >[]
) {

  if (
    !node ||
    typeof node !== "object" ||
    depth > 10
  ) {
    return;
  }

  const record = node as Record<
    string,
    unknown
  >;

  const direct =
    normalizeContextInfo(
      record.contextInfo as
        | Record<string, unknown>
        | undefined
    );

  if (direct) {
    found.push(direct);
  }

  const selfNormalized =
    normalizeContextInfo(record);

  if (
    selfNormalized &&
    (
      selfNormalized.stanzaId ||
      selfNormalized.quotedMessage
    )
  ) {
    found.push(selfNormalized);
  }

  for (const value of Object.values(
    record
  )) {
    if (
      value &&
      typeof value === "object"
    ) {
      walkForContextInfo(
        value,
        depth + 1,
        found
      );
    }
  }
}

export function collectWebhookContextInfo(
  data?: Record<string, unknown>,
  rawMessage?: unknown,
  unwrappedMessage?: Record<
    string,
    unknown
  > | null
) {

  const found: ReturnType<
    typeof normalizeContextInfo
  >[] = [];

  const dataContext =
    normalizeContextInfo(
      data?.contextInfo as
        | Record<string, unknown>
        | undefined
    );

  if (dataContext) {
    found.push(dataContext);
  }

  walkForContextInfo(
    rawMessage,
    0,
    found
  );

  walkForContextInfo(
    unwrappedMessage,
    0,
    found
  );

  return mergeContextInfo(...found);
}
