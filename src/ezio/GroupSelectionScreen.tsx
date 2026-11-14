import React, { useState } from "react";
import { Play, Compass, Cpu, Trees, Trophy, ArrowRight } from "lucide-react";
import { EZIO_GROUPS, EzioGroupConfig } from "./groupsConfig";

interface GroupSelectionScreenProps {
  onSelectGroup: (group: EzioGroupConfig) => void;
  onOpenQuizzes: () => void;
}

export const GroupSelectionScreen: React.FC<GroupSelectionScreenProps> = ({
  onSelectGroup,
  onOpenQuizzes,
}) => {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-10 py-4 sm:py-6">
      {/* Banner de Apresentação do EZIO */}
      <section className="rounded-2xl bg-[#06130f]/90 border border-emerald-500/30 ezio-glow-emerald px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <p className="ezio-mono text-xs text-cyan-300 tracking-wide">
              Centro Tecnológico de Monitoramento Ambiental
            </p>
            <h1
              className="ezio-display font-bold text-emerald-50 tracking-tight text-balance leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
            >
              ESCOLHA SEU ASSISTENTE VIRTUAL
            </h1>
            <p className="text-sm sm:text-base text-emerald-200/85 leading-relaxed">
              O <strong>EZIO</strong> é um assistente virtual educativo dedicado à
              conscientização ambiental, preservação das florestas, biodiversidade e
              monitoramento inteligente com drones, sensores e Internet das Coisas (IoT).
            </p>
          </div>

          {/* Esquema visual de tecnologia ambiental (Drones + IoT + Floresta) */}
          <div className="flex items-center gap-5 px-5 py-4 rounded-xl bg-[#030b08] border border-cyan-500/25 shrink-0 self-start lg:self-center">
            <svg
              width="86"
              height="68"
              viewBox="0 0 86 68"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M43 22L19 60H67L43 22Z" fill="url(#ezioBeam)" />
              <line x1="16" y1="14" x2="33" y2="14" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" />
              <line x1="53" y1="14" x2="70" y2="14" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
              <path d="M24 14V19H62V14" stroke="#99F6E4" strokeWidth="1.7" strokeLinecap="round" />
              <rect x="34" y="15" width="18" height="7" rx="3" fill="#10B981" />
              <circle cx="43" cy="24" r="2.5" fill="#22D3EE" />
              <rect x="36" y="54" width="14" height="8" rx="2" fill="#064E3B" stroke="#34D399" strokeWidth="1.2" />
              <circle cx="43" cy="58" r="1.5" fill="#39FF14" />
              <defs>
                <linearGradient id="ezioBeam" x1="43" y1="22" x2="43" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22D3EE" stopOpacity="0.38" />
                  <stop offset="1" stopColor="#10B981" stopOpacity="0.02" />
                </linearGradient>
              </defs>
            </svg>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-100 font-medium">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Drones de Vigilância</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200/85">
                <Cpu className="w-3.5 h-3.5 text-[#39FF14]" />
                <span>Sensores IoT na Floresta</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200/85">
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preservação e Fauna</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Independentes dos Dois Grupos */}
      <section aria-label="Seleção de grupos de apresentação" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {EZIO_GROUPS.map((group) => {
          const isCyan = group.accentTone === "cyan";
          const glowClass = isCyan ? "ezio-glow-cyan border-cyan-500/35" : "ezio-glow-emerald border-emerald-500/35";
          const kickerColor = isCyan ? "text-cyan-300" : "text-[#39FF14]";
          const btnClass = isCyan
            ? "bg-cyan-400 hover:bg-cyan-300 text-[#031318]"
            : "bg-[#22c55e] hover:bg-[#39FF14] text-[#031208]";
          const imgBroken = Boolean(imgErrors[group.id]);

          return (
            <article
              key={group.id}
              className={`rounded-2xl overflow-hidden bg-[#06130f]/95 border flex flex-col ${glowClass}`}
            >
              {/* Imagem temática exclusiva do grupo */}
              <div className="relative aspect-[16/9] w-full bg-[#030a08] overflow-hidden">
                {!imgBroken ? (
                  <img
                    src={group.cardImage}
                    alt={`${group.name} — ${group.ecosystemBadge}`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImgErrors((prev) => ({ ...prev, [group.id]: true }))
                    }
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#062415] to-[#041824] flex items-center justify-center">
                    <Trees className="w-12 h-12 text-emerald-400/50" />
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#06130f] via-black/30 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
                <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between text-xs">
                  <span className={`ezio-mono font-semibold ${kickerColor}`}>
                    {group.groupNumberLabel} · {group.ecosystemBadge}
                  </span>
                  <span className="ezio-mono text-emerald-100/85">
                    {group.triggers.length} gatilhos de voz
                  </span>
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-6">
                <div className="space-y-2.5">
                  <h2 className="ezio-display text-2xl font-bold text-emerald-50">
                    {group.name}
                  </h2>
                  <p className={`text-sm font-semibold ${kickerColor}`}>
                    {group.themeTitle}
                  </p>
                  <p className="text-sm text-emerald-200/80 leading-relaxed">
                    {group.themeDescription}
                  </p>
                </div>

                {/* Lista resumida dos gatilhos exclusivos deste grupo */}
                <div className="space-y-2 pt-3 border-t border-emerald-500/15">
                  <p className="ezio-mono text-[11px] text-emerald-300/75">
                    Comandos disponíveis nesta apresentação:
                  </p>
                  <ul className="space-y-1 text-xs text-emerald-100/85">
                    {group.triggers.map((trig) => (
                      <li key={trig.id} className="flex items-center gap-2">
                        <span className={kickerColor} aria-hidden="true">
                          ›
                        </span>
                        <span>{trig.phrase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectGroup(group)}
                  className={`w-full py-3.5 px-6 rounded-xl ezio-display font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap ${btnClass}`}
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span>INICIAR APRESENTAÇÃO</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Acesso independente aos Quizzes dos Ecossistemas */}
      <section
        aria-label="Acesso rápido aos quizzes"
        className="rounded-2xl bg-[#06130f]/90 border border-cyan-500/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-cyan-300" />
          </div>
          <div className="space-y-1">
            <p className="ezio-mono text-xs text-cyan-300">
              Atividade Interativa · 9º Ano
            </p>
            <h2 className="ezio-display text-lg sm:text-xl font-bold text-emerald-50">
              QUIZZES DOS ECOSSISTEMAS
            </h2>
            <p className="text-sm text-emerald-200/80">
              Desafie seus conhecimentos com o Quiz da Amazônia e o Quiz da Taiga (até 5.000 pontos cada).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenQuizzes}
          className="px-6 py-3 rounded-xl bg-[#0b2329] hover:bg-cyan-400 text-cyan-200 hover:text-[#031318] border border-cyan-400/50 ezio-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Abrir Quizzes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
