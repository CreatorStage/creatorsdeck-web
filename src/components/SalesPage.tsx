import React from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  Clapperboard,
  FileText,
  Lightbulb,
  Mic2,
  PlayCircle,
  Sparkles,
  Tv,
  Video
} from "lucide-react";

interface SalesPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const features = [
  {
    icon: Lightbulb,
    title: "Banco de ideias por canal",
    text: "Organize pautas, status, tags, prazos e alternativas de titulo sem espalhar tudo em planilhas."
  },
  {
    icon: FileText,
    title: "Roteiros em blocos",
    text: "Monte ganchos, desenvolvimento, conclusao e CTA em uma estrutura facil de editar e reorganizar."
  },
  {
    icon: Mic2,
    title: "Teleprompter integrado",
    text: "Saia do roteiro direto para a gravacao com controle de velocidade, fonte, tema e tela cheia."
  },
  {
    icon: CalendarClock,
    title: "Fluxo de producao claro",
    text: "Acompanhe cada video de ideia ate publicado com etapas visiveis e contexto preservado."
  }
];

const workflow = ["Ideia", "Referencias", "Roteiro", "Gravacao", "Publicado"];

export default function SalesPage({ onLogin, onSignup }: SalesPageProps) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <button type="button" onClick={onSignup} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#ff5045]">
              <PlayCircle size={21} fill="white" className="text-white" />
            </span>
            <span className="text-sm font-bold uppercase tracking-widest">
              Creator<span className="text-[#ff5045]">Stage</span>
            </span>
          </button>

          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] md:flex">
            <a href="#recursos" className="hover:text-white">Recursos</a>
            <a href="#fluxo" className="hover:text-white">Fluxo</a>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onLogin} className="hidden px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#f1f1f1] hover:text-[#ff5045] sm:block">
              Entrar
            </button>
            <button type="button" onClick={onSignup} className="rounded-sm bg-[#ff5045] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e0453b]">
              Comecar
            </button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[92vh] overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(255,80,69,0.22),transparent_32%),linear-gradient(130deg,#0f0f0f_0%,#171717_46%,#111827_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0f0f0f] to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(92vh-4rem)] max-w-7xl items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-[#aaaaaa]">
              <Sparkles size={14} className="text-[#ff5045]" />
              Sistema operacional para criadores de video
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl">
              Transforme ideias soltas em videos prontos para publicar
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#cfcfcf] md:text-lg">
              O CreatorStage junta pauta, referencias, anotacoes, roteiro modular e teleprompter em um unico lugar para quem produz conteudo com consistencia.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onSignup} className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#ff5045] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#e0453b]">
                Criar conta gratuita
                <ArrowRight size={18} />
              </button>
              <button type="button" onClick={onLogin} className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10">
                Acessar demo
                <Tv size={18} />
              </button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-xs text-[#aaaaaa]">
              <span className="flex items-center gap-2"><Check size={15} className="text-[#66bb6a]" /> Setup rapido</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#66bb6a]" /> Feito para YouTube</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 border border-white/10 bg-white/[0.03] blur-2xl" />
            <div className="relative overflow-hidden rounded-sm border border-white/12 bg-[#151515] shadow-2xl">
              <div className="flex h-10 items-center gap-2 border-b border-white/10 bg-[#1c1c1c] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5045]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffb74d]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#66bb6a]" />
                <span className="ml-3 text-[10px] uppercase tracking-widest text-[#717171]">Workspace do video</span>
              </div>

              <div className="grid min-h-[430px] grid-cols-[92px_1fr] md:grid-cols-[150px_1fr]">
                <aside className="border-r border-white/10 bg-[#181818] p-3">
                  {["Ideias", "Roteiro", "Notas", "Teleprompter"].map((item, index) => (
                    <div key={item} className={`mb-2 flex items-center gap-2 rounded-sm px-2 py-2 text-[11px] ${index === 1 ? "bg-[#ff5045] text-white" : "text-[#aaaaaa]"}`}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      <span className="hidden md:inline">{item}</span>
                    </div>
                  ))}
                </aside>

                <div className="p-4 md:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-2 inline-flex items-center gap-1 bg-[#ff5045]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#ff5045]">
                        Em progresso
                      </span>
                      <h2 className="text-lg font-semibold text-white md:text-2xl">Como gravar videos com mais ritmo</h2>
                    </div>
                    <BarChart3 className="text-[#ff5045]" size={28} />
                  </div>

                  <div className="space-y-3">
                    <div className="border-l-4 border-[#ff5045] bg-[#2b1717] p-4">
                      <span className="mb-2 inline-block bg-[#ff5045] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Gancho</span>
                      <p className="text-sm text-[#f1f1f1]">Pare de abrir o editor sem saber qual video vem depois.</p>
                    </div>
                    <div className="border-l-4 border-[#3ea6ff] bg-[#132233] p-4">
                      <span className="mb-2 inline-block bg-[#2563eb] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Conteudo</span>
                      <p className="text-sm text-[#dbeafe]">Referencias, roteiro e observacoes ficam conectados a cada ideia.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="border border-white/10 bg-white/[0.03] p-3">
                        <Video size={18} className="mb-2 text-[#ffb74d]" />
                        <p className="text-[11px] uppercase tracking-wider text-[#aaaaaa]">Duracao estimada</p>
                        <strong className="text-xl text-white">6:40</strong>
                      </div>
                      <div className="border border-white/10 bg-white/[0.03] p-3">
                        <Clapperboard size={18} className="mb-2 text-[#66bb6a]" />
                        <p className="text-[11px] uppercase tracking-wider text-[#aaaaaa]">Status</p>
                        <strong className="text-xl text-white">Roteiro</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5045]">Recursos</span>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Tudo que um video precisa antes do upload</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="border border-[#404040] bg-[#1c1c1c] p-6">
              <Icon className="mb-5 text-[#ff5045]" size={28} />
              <h3 className="mb-3 text-base font-semibold text-white">{title}</h3>
              <p className="text-sm leading-6 text-[#aaaaaa]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="fluxo" className="border-y border-white/10 bg-[#151515]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5045]">Fluxo</span>
              <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Um processo simples para publicar com frequencia</h2>
              <p className="mt-5 text-sm leading-7 text-[#aaaaaa]">
                Em vez de recomecar do zero a cada video, voce acompanha a evolucao da pauta e mantem tudo no mesmo workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-5">
              {workflow.map((step, index) => (
                <div key={step} className="border border-white/10 bg-[#0f0f0f] p-4">
                  <span className="mb-5 flex h-8 w-8 items-center justify-center rounded-sm bg-[#ff5045] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs uppercase tracking-widest text-[#717171]">
        CreatorStage - Plataforma de producao para criadores de video
      </footer>
    </div>
  );
}
