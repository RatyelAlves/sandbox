import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="font-display text-4xl text-ink">Privacidade</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            Guardamos email e senha só para autenticação. O email nunca é
            exibido no perfil.
          </p>
          <p>
            Apelido, cidade, idade, bio e fotos que você enviar ficam no
            Supabase da sua instância. Fotos privadas só são lidas por quem você
            liberar. Tirar print, gravar a tela ou salvar foto de outro usuário
            é proibido. Tentativa de print trava a conta por 24 horas. O app
            esconde as fotos e marca quem estava vendo. No navegador isso não é
            à prova de tudo.
          </p>
          <p>
            Não usamos GPS nem mapa. A cidade é um texto que você escolhe. Não
            há login com Facebook ou Google neste MVP.
          </p>
          <p>
            Mensagens existem para os dois lados da conversa. Bloqueio esconde
            os perfis um do outro.
          </p>
          <p>
            Denúncias são registradas para moderação. Você pode pedir a exclusão
            da conta ao administrador da instância.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
