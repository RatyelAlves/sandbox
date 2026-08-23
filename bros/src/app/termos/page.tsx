import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

export default function TermosPage() {
  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
        <h1 className="font-display text-4xl text-ink">Termos de uso</h1>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
          <p>O Bros é um serviço de encontros para homens gays com 18 anos ou mais.</p>
          <p>
            Ao criar uma conta, você declara que é maior de idade e que as
            informações do perfil não identificam terceiros nem menores.
          </p>
          <p>
            É proibido assédio, ameaça, extorsão, compartilhar dados de outros
            usuários, tirar print ou gravar a tela de fotos de outra pessoa e
            publicar conteúdo ilegal. Tentativa de print trava a conta por 24
            horas. Podemos suspender contas sem aviso quando houver denúncia ou
            violação.
          </p>
          <p>
            Matches e conversas não são garantia de encontro. Você é responsável
            pelo que combina fora da plataforma.
          </p>
          <p>
            O serviço é oferecido como está, sem SLA. Podemos mudar ou encerrar
            o MVP a qualquer momento.
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
