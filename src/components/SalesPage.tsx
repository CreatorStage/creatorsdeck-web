import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  Clapperboard,
  Code2,
  ExternalLink,
  FileText,
  GitFork,
  Github,
  Lightbulb,
  Mic2,
  PlayCircle,
  Sparkles,
  Star,
  Tv,
  Video,
  X
} from "lucide-react";

interface SalesPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const REPO_URL = "https://github.com/CreatorsDeck/CreatorsDeck-Studio";

const problems = [
  {
    icon: X,
    problem: "Ideias espalhadas em apps diferentes",
    solution: "Banco de ideias por canal com status, tags e prazos centralizados."
  },
  {
    icon: X,
    problem: "Roteiro solto no Google Docs sem estrutura",
    solution: "Editor modular em blocos: Gancho, Conteudo, CTA e Conclusao."
  },
  {
    icon: X,
    problem: "Precisa alternar entre apps para gravar",
    solution: "Teleprompter integrado com controle de velocidade e tela cheia."
  },
  {
    icon: X,
    problem: "Nenhuma visao clara de progresso",
    solution: "Kanban de producao com etapas de Ideia ate Publicado."
  },
  {
    icon: X,
    problem: "References e thumbnails salvos em pastas soltas",
    solution: "Moodboard integrado com captura via extensao do Chrome."
  },
  {
    icon: X,
    problem: "Paga caro por ferramentas fechadas",
    solution: "100% open source, self-hosted e gratuito para sempre."
  }
];

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

const techStack = [
  { name: "React 19", color: "#61dafb" },
  { name: "Vite", color: "#646cff" },
  { name: "Tailwind CSS", color: "#38bdf8" },
  { name: "Java / Spring", color: "#f89820" },
  { name: "PostgreSQL", color: "#336791" },
  { name: "Docker", color: "#2496ed" }
];

export default function SalesPage({ onLogin, onSignup }: SalesPageProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f1f1f1] font-sans">
      {/* ─── HEADER ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/8 shadow-lg shadow-black/20"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <button type="button" onClick={onSignup} className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff5045] to-[#ff2d20] shadow-lg shadow-[#ff5045]/25 group-hover:shadow-[#ff5045]/40 transition-shadow">
              <PlayCircle size={20} fill="white" className="text-white" />
            </span>
            <span className="text-sm font-bold uppercase tracking-widest">
              Creators<span className="text-[#ff5045]">Deck</span>
            </span>
          </button>

          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-wider text-[#888] md:flex">
            <a href="#problemas" className="hover:text-white transition-colors">O Problema</a>
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#fluxo" className="hover:text-white transition-colors">Fluxo</a>
            <a href="#opensource" className="hover:text-white transition-colors">Open Source</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#ccc] hover:text-white transition-colors"
            >
              <Github size={15} />
              GitHub
            </a>
            <button
              type="button"
              onClick={onLogin}
              className="hidden px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#f1f1f1] hover:text-[#ff5045] sm:block transition-colors"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={onSignup}
              className="rounded-lg bg-gradient-to-r from-[#ff5045] to-[#ff2d20] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:shadow-lg hover:shadow-[#ff5045]/25"
            >
              Comecar
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-[92vh] overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,80,69,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(99,102,241,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(130deg,#0a0a0a_0%,#111_46%,#0d1117_100%)]" />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(92vh-4rem)] max-w-7xl items-center gap-10 px-5 py-14 md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-3xl">
            {/* Open Source badge */}
            <div className="mb-5 inline-flex items-center gap-2 border border-[#66bb6a]/30 bg-[#66bb6a]/10 px-3 py-2 rounded-full text-[11px] font-semibold uppercase tracking-widest text-[#66bb6a]">
              <Code2 size={14} />
              Open Source — Livre para usar e contribuir
            </div>

            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-[3.5rem] md:leading-[1.1]">
              Pare de improvisar a producao dos seus{" "}
              <span className="bg-gradient-to-r from-[#ff5045] to-[#ff8a65] bg-clip-text text-transparent">
                videos
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-[#999] md:text-lg">
              O CreatorsDeck e um workspace open source que centraliza ideias, roteiros modulares, 
              referencias, anotacoes e teleprompter — tudo o que voce precisa antes de apertar REC.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSignup}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff5045] to-[#ff2d20] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:shadow-xl hover:shadow-[#ff5045]/20 hover:-translate-y-0.5"
              >
                Comecar agora
                <ArrowRight size={18} />
              </button>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-white/10 hover:border-white/25"
              >
                <Github size={18} />
                Ver no GitHub
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-xs text-[#888]">
              <span className="flex items-center gap-2"><Check size={15} className="text-[#66bb6a]" /> Self-hosted</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#66bb6a]" /> Feito para YouTube</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-[#66bb6a]" /> 100% gratuito</span>
            </div>
          </div>

          {/* App preview mockup */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl border border-white/5 bg-white/[0.02] blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-2xl shadow-black/50">
              <div className="flex h-10 items-center gap-2 border-b border-white/8 bg-[#161616] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5045]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffb74d]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#66bb6a]" />
                <span className="ml-3 text-[10px] uppercase tracking-widest text-[#555]">Workspace do video</span>
              </div>

              <div className="grid min-h-[430px] grid-cols-[92px_1fr] md:grid-cols-[150px_1fr]">
                <aside className="border-r border-white/8 bg-[#131313] p-3">
                  {["Ideias", "Roteiro", "Notas", "Teleprompter"].map((item, index) => (
                    <div key={item} className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] transition-colors ${index === 1 ? "bg-[#ff5045] text-white" : "text-[#666]"}`}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      <span className="hidden md:inline">{item}</span>
                    </div>
                  ))}
                </aside>

                <div className="p-4 md:p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-2 inline-flex items-center gap-1 bg-[#ff5045]/10 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider text-[#ff5045]">
                        Em progresso
                      </span>
                      <h2 className="text-lg font-semibold text-white md:text-2xl">Como gravar videos com mais ritmo</h2>
                    </div>
                    <BarChart3 className="text-[#ff5045]" size={28} />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border-l-4 border-[#ff5045] bg-[#1a1010] p-4">
                      <span className="mb-2 inline-block rounded bg-[#ff5045] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Gancho</span>
                      <p className="text-sm text-[#f1f1f1]">Pare de abrir o editor sem saber qual video vem depois.</p>
                    </div>
                    <div className="rounded-lg border-l-4 border-[#3ea6ff] bg-[#101820] p-4">
                      <span className="mb-2 inline-block rounded bg-[#2563eb] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Conteudo</span>
                      <p className="text-sm text-[#dbeafe]">Referencias, roteiro e observacoes ficam conectados a cada ideia.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                        <Video size={18} className="mb-2 text-[#ffb74d]" />
                        <p className="text-[11px] uppercase tracking-wider text-[#888]">Duracao estimada</p>
                        <strong className="text-xl text-white">6:40</strong>
                      </div>
                      <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                        <Clapperboard size={18} className="mb-2 text-[#66bb6a]" />
                        <p className="text-[11px] uppercase tracking-wider text-[#888]">Status</p>
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

      {/* ─── PROBLEMS SOLVED ─── */}
      <section id="problemas" className="border-y border-white/5 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5045]">O Problema</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              O que criadores de conteudo enfrentam todo dia
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#888] max-w-2xl mx-auto">
              Produzir videos com consistencia e dificil quando suas ferramentas nao conversam entre si. 
              O CreatorsDeck resolve cada um desses problemas em uma unica interface.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {problems.map(({ problem, solution }, index) => (
              <article
                key={index}
                className="group relative overflow-hidden rounded-xl border border-white/8 bg-[#111] p-6 transition-all duration-300 hover:border-[#ff5045]/30 hover:bg-[#141414]"
              >
                {/* Problem */}
                <div className="flex items-start gap-3 mb-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-950/50 text-[#ff5045]">
                    <X size={12} strokeWidth={3} />
                  </span>
                  <p className="text-sm font-medium text-[#ccc] leading-snug">{problem}</p>
                </div>
                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#111] group-hover:bg-[#141414] transition-colors px-2">
                      <ArrowRight size={12} className="text-[#66bb6a] rotate-90" />
                    </span>
                  </div>
                </div>
                {/* Solution */}
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-950/50 text-[#66bb6a]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <p className="text-sm text-[#999] leading-snug">{solution}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="recursos" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5045]">Recursos</span>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Tudo que um video precisa antes do upload</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="group rounded-xl border border-white/8 bg-[#111] p-6 transition-all duration-300 hover:border-[#ff5045]/20 hover:shadow-lg hover:shadow-[#ff5045]/5"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff5045]/10 transition-colors group-hover:bg-[#ff5045]/20">
                <Icon className="text-[#ff5045]" size={24} />
              </div>
              <h3 className="mb-3 text-base font-semibold text-white">{title}</h3>
              <p className="text-sm leading-6 text-[#888]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── WORKFLOW ─── */}
      <section id="fluxo" className="border-y border-white/5 bg-[#080808]">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff5045]">Fluxo</span>
              <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Um processo simples para publicar com frequencia</h2>
              <p className="mt-5 text-sm leading-7 text-[#888]">
                Em vez de recomecar do zero a cada video, voce acompanha a evolucao da pauta e mantem tudo no mesmo workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-5">
              {workflow.map((step, index) => (
                <div key={step} className="group rounded-xl border border-white/8 bg-[#0f0f0f] p-4 transition-all duration-300 hover:border-[#ff5045]/20 hover:bg-[#141414]">
                  <span className="mb-5 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff5045] to-[#ff2d20] text-xs font-bold text-white shadow-md shadow-[#ff5045]/20">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── OPEN SOURCE CTA ─── */}
      <section id="opensource" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/8">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff5045]/8 via-[#111] to-[#6366f1]/8" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[1px] bg-gradient-to-r from-transparent via-[#ff5045]/50 to-transparent" />

          <div className="relative p-8 md:p-14 text-center">
            <div className="mb-6 inline-flex items-center gap-2 border border-[#ff5045]/20 bg-[#ff5045]/10 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-widest text-[#ff5045]">
              <Code2 size={14} />
              Projeto Open Source
            </div>

            <h2 className="text-3xl font-bold text-white md:text-5xl max-w-3xl mx-auto leading-tight">
              Construido pela comunidade,{" "}
              <span className="bg-gradient-to-r from-[#ff5045] to-[#ff8a65] bg-clip-text text-transparent">
                para criadores
              </span>
            </h2>

            <p className="mt-5 text-base leading-7 text-[#999] max-w-2xl mx-auto">
              O CreatorsDeck e 100% open source. Voce pode rodar no seu proprio servidor, 
              personalizar ao seu fluxo e contribuir com novas funcionalidades. 
              Sem assinaturas, sem limites, sem pegadinhas.
            </p>

            {/* Tech Stack pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {techStack.map(({ name, color }) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#ccc]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {name}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-[#0a0a0a] px-7 py-3.5 text-sm font-bold uppercase tracking-wider transition-all hover:shadow-xl hover:shadow-white/10 hover:-translate-y-0.5"
              >
                <Github size={18} />
                Acessar Repositorio
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                onClick={onSignup}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ff5045]/50 bg-[#ff5045]/10 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-[#ff5045] transition-all hover:bg-[#ff5045]/20"
              >
                Usar agora
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Repo stats callout */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-[#888]">
              <span className="flex items-center gap-1.5">
                <Star size={14} className="text-[#ffb74d]" />
                Star no GitHub para apoiar
              </span>
              <span className="flex items-center gap-1.5">
                <GitFork size={14} className="text-[#66bb6a]" />
                Fork e contribua com PRs
              </span>
              <span className="flex items-center gap-1.5">
                <Code2 size={14} className="text-[#3ea6ff]" />
                MIT License
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#ff5045] to-[#ff2d20]">
                <PlayCircle size={15} fill="white" className="text-white" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#888]">
                Creators<span className="text-[#ff5045]">Deck</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#666]">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Github size={14} />
                GitHub
              </a>
              <span className="text-[#333]">•</span>
              <span>Open Source — MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
