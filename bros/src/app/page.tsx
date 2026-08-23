import Image from "next/image";
import Link from "next/link";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing-chrome";

const PILLARS = [
  {
    title: "Usuário, nunca nome",
    body: "O perfil vive de um usuário. Email e identidade civil não aparecem para ninguém.",
  },
  {
    title: "Fotos sob o seu controle",
    body: "Rosto é opcional. O que for privado só abre quando você liberar a outra pessoa.",
  },
  {
    title: "Cidade, sem GPS",
    body: "Nada de mapa, pin ou localização em tempo real. Só a cidade que você escolheu.",
  },
  {
    title: "Saída imediata",
    body: "O Gay Panic Button abre a página que você escolheu — ou o clima da cidade. Três toques no logo para voltar.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Crie o usuário",
    body: "Email, senha e um nome de usuário. Sem rede social.",
  },
  {
    n: "02",
    title: "Encontre na cidade",
    body: "Veja quem está na cidade que você escolheu. Sem GPS e sem mapa.",
  },
  {
    n: "03",
    title: "Abra o chat",
    body: "Sem match. A conversa começa quando você quiser. Fotos privadas só quando você liberar.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        <section className="relative h-dvh min-h-dvh overflow-hidden">
          <MarketingHeader overlay />
          <Image
            src="/bg/story.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center sm:hidden"
          />
          <Image
            src="/bg/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-[78%_center] sm:block"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
          <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:justify-center sm:px-5 sm:pb-0">
            <div className="max-w-lg space-y-6">
              <h1 className="font-display text-4xl leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
                Encontros
                <br />
                sem plateia.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted">
                Bros é para homens gays que não querem estampar a vida na tela.
                Discrição não é um filtro — é o produto.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cadastro"
                  className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-ink transition hover:bg-accent-hot"
                >
                  Criar conta
                </Link>
                <Link
                  href="/entrar"
                  className="rounded-md border border-accent/70 bg-black/35 px-5 py-3 text-sm font-medium text-ink backdrop-blur transition hover:border-accent-hot hover:text-accent-hot"
                >
                  Já tenho acesso
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-5">
          <section className="py-16">
            <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              O que não vaza
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {PILLARS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-line bg-bg-elevated p-5"
                >
                  <h2 className="font-display text-2xl text-ink">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-line py-16">
            <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
              Como funciona
            </p>
            <div className="grid gap-8 sm:grid-cols-3">
              {STEPS.map((step) => (
                <article key={step.n} className="space-y-2">
                  <p className="font-display text-3xl text-accent">{step.n}</p>
                  <h2 className="text-lg text-ink">{step.title}</h2>
                  <p className="text-sm leading-relaxed text-muted">{step.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
