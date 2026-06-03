import { PrismaClient } from "@prisma/client";
import { parseWhatsappMessage } from "../src/services/whatsapp/parseWhatsappMessage";
import { unwrapInboundMessage } from "../src/services/whatsapp/unwrapInboundMessage";

const prisma = new PrismaClient();

// Real Evolution v2.2.3 payload: phone reply (fromMe) quoting client message
const fromMePhoneQuotedPayload = {
  data: {
    key: {
      remoteJid: "553171477206@s.whatsapp.net",
      fromMe: true,
      id: "3EB056B74ABF2348D01EAE8565A7472172B965D2",
    },
    message: {
      conversation: "POr nada!",
    },
    contextInfo: {
      stanzaId: "AC9234D7C3176C1F4ED9C9B1283D42F3",
      participant: "553171477206@s.whatsapp.net",
      quotedMessage: {
        conversation: "Ok, obrigado!",
      },
    },
  },
};

// Client reply with contextInfo at data level (conversation type)
const clientQuotedPayload = {
  data: {
    key: {
      remoteJid: "141833359368431@lid",
      fromMe: false,
      id: "ACB9BF2104665131BE1B59083C23FC4B",
    },
    message: {
      conversation: "Quero remarcar meu horário",
    },
    contextInfo: {
      stanzaId: "3EB044076E567A4D8A8060D7C4F2D0161F0FF78D",
      participant: "553182635834@s.whatsapp.net",
      quotedMessage: {
        conversation:
          "Sinto muito, não entendi o que você quis dizer. Poderia reformular, por favor? 😊",
      },
    },
  },
};

// deviceSentMessage wrapper (common for phone-sent sync)
const deviceSentPayload = {
  data: {
    key: {
      remoteJid: "553171477206@s.whatsapp.net",
      fromMe: true,
      id: "3EB056B74ABF2348D01EAE8565A7472172B965D2",
    },
    message: {
      deviceSentMessage: {
        message: {
          conversation: "POr nada!",
        },
      },
    },
    contextInfo: {
      stanzaId: "AC9234D7C3176C1F4ED9C9B1283D42F3",
      quotedMessage: {
        conversation: "Ok, obrigado!",
      },
    },
  },
};

function testParse(label: string, body: typeof fromMePhoneQuotedPayload) {
  const message = unwrapInboundMessage(body.data.message);

  const parsed = parseWhatsappMessage(
    message,
    body.data.contextInfo as Record<string, unknown>
  );

  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(parsed, null, 2));
}

async function main() {
  testParse("fromMe phone quoted (current unwrap)", fromMePhoneQuotedPayload);
  testParse("client quoted", clientQuotedPayload);
  testParse("deviceSentMessage wrapper", deviceSentPayload);

  const rows = await prisma.message.findMany({
    where: { fromMe: true },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      content: true,
      whatsappMsgId: true,
      quotedContent: true,
      quotedWhatsappMsgId: true,
      replyToMessageId: true,
      createdAt: true,
    },
  });

  console.log("\n=== DB fromMe messages (recent) ===");
  console.log(JSON.stringify(rows, null, 2));

  const withQuote = await prisma.message.findMany({
    where: {
      OR: [
        { quotedContent: { not: null } },
        { quotedWhatsappMsgId: { not: null } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      content: true,
      fromMe: true,
      whatsappMsgId: true,
      quotedContent: true,
      quotedWhatsappMsgId: true,
      replyToMessageId: true,
    },
  });

  console.log("\n=== DB messages with any quote fields ===");
  console.log(JSON.stringify(withQuote, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
