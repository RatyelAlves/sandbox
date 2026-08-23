import Link from "next/link";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

const UPDATED = "22 de agosto de 2026";

export default function TermosPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="font-display text-4xl text-ink">Termos de uso</h1>
        <p className="mt-3 text-sm text-muted">Atualizado em {UPDATED}.</p>

        <div className="mt-8 space-y-10 text-sm leading-relaxed text-muted">
          <section className="space-y-3">
            <p>
              Estes termos regem o uso do Bros — um serviço de encontros para
              homens gays. Ao criar uma conta ou usar o site, você aceita este
              acordo e a{" "}
              <Link
                href="/privacidade"
                className="text-accent hover:text-accent-hot"
              >
                Privacidade
              </Link>
              .
            </p>
            <p>
              Podemos atualizar estes termos. Se a mudança for relevante,
              avisamos no serviço. Continuar usando depois da atualização
              significa que você aceita a nova versão.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Idade e segurança
            </h2>
            <p>
              O Bros é só para maiores de 18 anos. Ao criar a conta, você
              declara que tem 18 anos ou mais, que pode aceitar estes termos e
              que as informações do perfil não identificam terceiros nem
              menores.
            </p>
            <p>
              Se você souber de um menor no serviço, denuncie o perfil. É
              proibido falar com alguém que você saiba ou desconfie ser menor
              de idade.
            </p>
            <p>
              Não fazemos checagem de antecedentes, identidade ou saúde. Não
              controlamos o que as pessoas dizem ou fazem. Você é responsável
              pelas suas interações, no app e fora dele. Conversas não são
              garantia de encontro. O que você combina presencialmente é com
              você.
            </p>
            <p>
              Não usamos GPS nem mapa. A cidade é um texto que você escolhe.
              Mesmo assim, não publique no perfil nada que permita te
              localizar ou identificar contra a sua vontade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Sua conta
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                A conta é pessoal. Não compartilhe senha, não venda acesso e
                não use a conta de outra pessoa.
              </li>
              <li>
                Você responde pelo que acontece na sua conta. Avise se
                desconfiar de acesso indevido.
              </li>
              <li>
                Mantenha usuário, idade e cidade verdadeiros o bastante para
                o serviço funcionar. Sem nome civil no perfil.
              </li>
              <li>
                O Bros não é backup. Guarde por conta própria o que quiser
                lembrar (por exemplo, um combinado fora do chat).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              O que você não pode
            </h2>
            <p>Ao usar o Bros, você concorda em não:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Usar o serviço se for menor de 18 anos.</li>
              <li>
                Assediar, ameaçar, extorquir, perseguir, difamar ou se passar
                por outra pessoa.
              </li>
              <li>
                Compartilhar dados, fotos ou conversas de outros usuários sem
                permissão.
              </li>
              <li>
                Tirar print, gravar a tela ou salvar foto de outra pessoa.
                Tentativa de print esconde as fotos, marca quem estava vendo
                e trava a conta por 24 horas. No navegador isso não é à prova
                de tudo.
              </li>
              <li>
                Publicar conteúdo de menor, conteúdo ilegal, não consensual
                ou que viole direitos de terceiros.
              </li>
              <li>
                Usar o Bros para spam, anúncio, venda ou qualquer fim
                comercial sem autorização.
              </li>
              <li>
                Tentar quebrar, sobrecarregar ou explorar o serviço, nem
                usar o conteúdo de outros para treinar inteligência
                artificial.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Seu conteúdo
            </h2>
            <p>
              O que você envia (perfil, fotos, mensagens) continua seu. Você
              nos dá licença para exibir isso no serviço conforme as suas
              escolhas: público, privado ou liberado para alguém. Pode
              apagar ou revogar o acesso às fotos quando quiser.
            </p>
            <p>
              Fotos privadas só devem ser vistas por quem você liberar.
              Pedir fotos não obriga ninguém a mostrar. Podemos remover
              conteúdo ou encerrar contas que violem estes termos, com ou
              sem aviso, inclusive depois de uma denúncia.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Bloqueio, denúncia e pânico
            </h2>
            <p>
              Bloquear esconde os perfis um do outro e apaga a conversa.
              Denúncias servem para moderação. O botão de pânico abre a
              página que você escolheu — ou o clima da cidade — para sair da
              tela rápido. Três toques no logo voltam ao app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Propriedade do serviço
            </h2>
            <p>
              Nome, visual, código e marca do Bros são nossos. Você não pode
              copiar, vender nem explorar o serviço como se fosse seu.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Mudanças e encerramento
            </h2>
            <p>
              O serviço é oferecido como está, sem garantia de
              disponibilidade. Podemos mudar, suspender ou encerrar o Bros —
              ou a sua conta — a qualquer momento. Você pode pedir a
              exclusão da conta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Responsabilidade
            </h2>
            <p>
              Na medida permitida pela lei, o Bros não responde por encontros
              fora da plataforma, conduta de outros usuários, perda de dados
              ou interrupção do serviço. Nada nestes termos tira direitos
              que a lei não deixa renunciar.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
