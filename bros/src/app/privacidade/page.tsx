import Link from "next/link";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

const UPDATED = "22 de agosto de 2026";

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="font-display text-4xl text-ink">Privacidade</h1>
        <p className="mt-3 text-sm text-muted">Atualizado em {UPDATED}.</p>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted">
          <section className="space-y-3">
            <p>
              Esta política explica como o Bros trata as informações pessoais
              quando você usa o site e o serviço. Leia também os{" "}
              <Link href="/termos" className="text-accent hover:text-accent-hot">
                Termos de uso
              </Link>
              .
            </p>
            <p>
              O Bros é um serviço de encontros para homens gays. A gente se
              compromete a ser claro sobre o que pedimos, a deixar você no
              controle do que aparece e a proteger o que você confia ao
              serviço.
            </p>
            <p>
              O Bros é só para maiores de 18 anos. Se você souber de um menor
              usando o serviço, denuncie o perfil.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              O que coletamos
            </h2>
            <p>Você nos passa, quando cria ou usa a conta:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-ink">Conta.</strong> Email e
                senha, só para entrar. O email nunca aparece no perfil.
              </li>
              <li>
                <strong className="font-medium text-ink">Perfil.</strong>{" "}
                Usuário, idade, cidade, bio, o que você busca e, se quiser,
                altura, peso, tipo de corpo e posição. O modo discreto esconde
                o rosto até você liberar alguém.
              </li>
              <li>
                <strong className="font-medium text-ink">Fotos.</strong> As que
                você envia, públicas ou privadas. Privadas só são vistas por
                quem você liberar.
              </li>
              <li>
                <strong className="font-medium text-ink">Mensagens.</strong>{" "}
                Texto, fotos e vídeos que você manda no chat. Os dois lados da
                conversa veem o que foi enviado.
              </li>
              <li>
                <strong className="font-medium text-ink">Taps, bloqueios e
                denúncias.</strong> Quem você tapou, bloqueou ou denunciou, e
                o conteúdo necessário para moderar.
              </li>
            </ul>
            <p>
              Não pedimos nome civil, telefone, documento nem login com
              Facebook ou Google. Não usamos GPS nem mapa: a cidade é um texto
              que você escolhe. Não coletamos dados de saúde. Não há anúncio
              de terceiros neste serviço.
            </p>
            <p>
              O navegador pode enviar dados técnicos usuais (por exemplo, para
              manter você logado). Não usamos isso para te seguir em outros
              sites.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Para que usamos
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Criar e autenticar a sua conta.</li>
              <li>
                Mostrar o perfil na cidade que você escolheu e deixar você
                conversar, tapar, bloquear e liberar fotos.
              </li>
              <li>Moderar denúncias e aplicar os Termos de uso.</li>
              <li>
                Proteger o serviço: tentativa de print esconde as fotos, marca
                quem estava vendo e trava a conta por 24 horas. No navegador
                isso não é à prova de tudo.
              </li>
              <li>Responder pedido de exclusão da conta ou correção de dados.</li>
            </ul>
            <p>
              Não vendemos seus dados. Não usamos o conteúdo do chat para
              anúncio nem para treinar modelo de inteligência artificial.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Com quem compartilhamos
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-ink">Outros usuários.</strong>{" "}
                O que está público no perfil (usuário, idade, cidade, bio e
                fotos públicas) aparece para quem explora a mesma cidade. Chat
                e fotos privadas só para quem você escolheu.
              </li>
              <li>
                <strong className="font-medium text-ink">Quando a lei pede.</strong>{" "}
                Podemos revelar informações se formos obrigados por ordem
                legal, para defender direitos ou para impedir dano a alguém.
              </li>
              <li>
                <strong className="font-medium text-ink">Com o seu pedido.</strong>{" "}
                Por exemplo, quando você abre um chat ou libera uma foto.
              </li>
            </ul>
            <p>
              Bloquear esconde os perfis um do outro e apaga a conversa. Tirar
              print, gravar a tela ou salvar foto de outro usuário é proibido.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Por quanto tempo
            </h2>
            <p>
              Mantemos as informações enquanto a conta existir e pelo tempo
              necessário para o serviço, segurança ou obrigação legal. Se a
              conta for excluída, o perfil deixa de aparecer para os outros.
              Podemos guardar o mínimo preciso para moderação (por exemplo,
              uma denúncia ou um bloqueio por violação).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Seus direitos
            </h2>
            <p>Você pode:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Ver e editar o perfil na conta.</li>
              <li>Escolher o que é público, privado ou liberado.</li>
              <li>Pedir uma cópia das informações da conta.</li>
              <li>Corrigir dados errados.</li>
              <li>Pedir a exclusão da conta.</li>
              <li>Revogar o acesso às fotos que você tinha liberado.</li>
            </ul>
            <p>
              Para exercer esses direitos, use os Ajustes da conta ou peça a
              exclusão pelo próprio serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Como protegemos
            </h2>
            <p>
              Trabalhamos para manter o serviço íntegro e as informações sob
              o seu controle. Nenhum envio pela internet é 100% seguro. O
              Bros não garante proteção absoluta contra quem tira print,
              grava a tela ou usa outro aparelho para copiar o que aparece.
            </p>
            <p>
              O botão de pânico abre a página que você escolheu — ou o clima
              da cidade — para sair da tela rápido. Três toques no logo
              voltam ao app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Mudanças
            </h2>
            <p>
              Podemos atualizar esta política. Se a mudança for relevante,
              avisamos no serviço. A versão publicada nesta página é a que
              vale.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
