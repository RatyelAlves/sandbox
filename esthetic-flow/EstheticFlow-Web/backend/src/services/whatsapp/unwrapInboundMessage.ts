type MessagePayload = Record<
  string,
  unknown
>;

function unwrapLayer(
  message: MessagePayload,
  key: string
) {

  const wrapper = message[key] as
    | { message?: MessagePayload }
    | undefined;

  return wrapper?.message;
}

export function unwrapInboundMessage(
  rawMessage?:
    | MessagePayload
    | null
): MessagePayload | null {

  if (!rawMessage) {
    return null;
  }

  let current: MessagePayload =
    rawMessage;

  for (
    let depth = 0;
    depth < 5;
    depth++
  ) {
    const next =
      unwrapLayer(
        current,
        "ephemeralMessage"
      ) ??
      unwrapLayer(
        current,
        "deviceSentMessage"
      ) ??
      unwrapLayer(
        current,
        "viewOnceMessage"
      );

    if (!next) {
      break;
    }

    current = next;
  }

  return current;
}
