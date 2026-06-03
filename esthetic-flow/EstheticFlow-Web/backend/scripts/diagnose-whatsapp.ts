import { prisma } from "../src/lib/prisma";
import { env } from "../src/config/env";
import {
  getEvolutionApiKey,
  getEvolutionInstance,
} from "../src/services/whatsapp/evolutionApi";
import {
  getStoredWhatsappOwnerJid,
} from "../src/services/whatsapp/whatsappConnection.service";

async function main() {
  const settings = await prisma.appSetting.findMany();
  const convos = await prisma.conversation.findMany({
    where: { archived: false },
    include: {
      client: { select: { name: true, phone: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, fromMe: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const response = await fetch(
    `${env.evolutionApiUrl}/instance/fetchInstances`,
    { headers: { apikey: getEvolutionApiKey() } }
  );
  const instances = await response.json();
  const instanceName = getEvolutionInstance();
  const current = Array.isArray(instances)
    ? instances.find((item: { name?: string }) => item.name === instanceName) ??
      instances[0]
    : null;

  console.log("=== AppSettings ===");
  console.log(settings);
  console.log("\n=== Stored owner ===");
  console.log(await getStoredWhatsappOwnerJid());
  console.log("\n=== Evolution ===");
  console.log({
    name: current?.name,
    ownerJid: current?.ownerJid,
    profileName: current?.profileName,
    status: current?.connectionStatus,
  });
  console.log("\n=== Active conversations ===");
  for (const c of convos) {
    console.log({
      client: c.client.name,
      phone: c.client.phone,
      jid: c.whatsappJid,
      alt: c.whatsappJidAlt,
      last: c.messages[0]?.content?.slice(0, 60),
      at: c.messages[0]?.createdAt,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
