import {
  resetWhatsappConversationsForCurrentAccount,
} from "../src/services/whatsapp/whatsappConnection.service";

async function main() {
  console.log(
    "Resetando conversas (sem reimportar histórico)..."
  );

  const result =
    await resetWhatsappConversationsForCurrentAccount();

  console.log("Conta atual:", result);
  console.log(
    "Pronto. Novas mensagens passam a entrar só via webhook."
  );
}

main().catch(console.error);
