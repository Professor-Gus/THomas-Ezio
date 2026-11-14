import React, { useState } from "react";
import { ShieldCheck, Trophy, ArrowLeft, Layers } from "lucide-react";
import "./ezio.css";
import { EzioGroupConfig } from "./groupsConfig";
import { GroupSelectionScreen } from "./GroupSelectionScreen";
import { GroupPresentationView } from "./GroupPresentationView";
import { QuizzesSection } from "./QuizzesSection";

const DEFAULT_BACKDROP_IMAGE =
  "/src/assets/images/amazon_canopy_backdrop_1794531678388.jpg";

export default function EzioApp() {
  const [selectedGroup, setSelectedGroup] = useState<EzioGroupConfig | null>(null);
  const [showQuizzes, setShowQuizzes] = useState<boolean>(false);
  const [backdropError, setBackdropError] = useState<boolean>(false);

  const activeBackdrop = selectedGroup?.backdropImage || DEFAULT_BACKDROP_IMAGE;

  const handleSelectGroup = (group: EzioGroupConfig) => {
    setSelectedGroup(group);
    setShowQuizzes(false);
    setBackdropError(false);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setShowQuizzes(false);
    setBackdropError(false);
  };

  const handleOpenQuizzes = () => {
    setShowQuizzes(true);
  };

  const handleBackFromQuizzes = () => {
    setShowQuizzes(false);
  };

  return (
    <div className="ezio-root min-h-screen relative flex flex-col overflow-x-hidden">
      {/* Plano de fundo ambiental escuro com elementos de floresta e grade IoT */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {!backdropError ? (
          <img
            src={activeBackdrop}
            alt="Cenário florestal de monitoramento EZIO"
            referrerPolicy="no-referrer"
            onError={() => setBackdropError(true)}
            className="w-full h-full object-cover object-center opacity-25 transition-opacity duration-500"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030a08]/80 via-[#030a08]/92 to-[#020705]" />
        <div className="absolute inset-0 ezio-grid-bg opacity-75" />
      </div>

      {/* Barra Superior limpa (Contrato de 3 zonas) */}
      <header className="relative z-10 border-b border-emerald-500/20 bg-[#030a08]/88 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <button
            type="button"
            onClick={handleBackToGroups}
            className="flex items-center gap-3 text-left cursor-pointer shrink-0 group"
          >
            <span className="ezio-display text-xl font-extrabold tracking-tight text-emerald-50 group-hover:text-cyan-300 transition-colors">
              EZIO
            </span>
            <span className="hidden sm:inline ezio-mono text-xs text-cyan-300/85">
              Monitoramento Ambiental
            </span>
          </button>

          <nav
            aria-label="Navegação de contexto"
            className="hidden md:flex items-center gap-5 text-xs ezio-mono text-emerald-200/80"
          >
            <span className="whitespace-nowrap">
              {showQuizzes
                ? "QUIZZES DOS ECOSSISTEMAS"
                : selectedGroup
                ? `${selectedGroup.groupNumberLabel} · ${selectedGroup.name}`
                : "SELEÇÃO DE GRUPOS"}
            </span>
            <span className="text-emerald-500/40" aria-hidden="true">
              ·
            </span>
            <span className="whitespace-nowrap text-[#39FF14]">
              {showQuizzes
                ? "Amazônia & Taiga"
                : selectedGroup
                ? selectedGroup.ecosystemBadge
                : "Drones · Sensores IoT · Florestas"}
            </span>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!showQuizzes && (
              <button
                type="button"
                onClick={handleOpenQuizzes}
                className="px-4 py-2 rounded-lg bg-[#0b2329] hover:bg-cyan-400 text-cyan-200 hover:text-[#031318] border border-cyan-400/45 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Quizzes</span>
              </button>
            )}

            {showQuizzes ? (
              <button
                type="button"
                onClick={handleBackFromQuizzes}
                className="px-4 py-2 rounded-lg bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/35 text-emerald-100 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{selectedGroup ? "Voltar ao Grupo" : "Tela Inicial"}</span>
              </button>
            ) : selectedGroup ? (
              <button
                type="button"
                onClick={handleBackToGroups}
                className="px-4 py-2 rounded-lg bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/35 text-emerald-100 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Grupos</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {showQuizzes ? (
          <QuizzesSection
            hasActiveGroup={Boolean(selectedGroup)}
            onBackToPresentation={handleBackFromQuizzes}
          />
        ) : selectedGroup ? (
          <GroupPresentationView
            group={selectedGroup}
            onBackToGroups={handleBackToGroups}
            onOpenQuizzes={handleOpenQuizzes}
          />
        ) : (
          <GroupSelectionScreen
            onSelectGroup={handleSelectGroup}
            onOpenQuizzes={handleOpenQuizzes}
          />
        )}
      </main>

      {/* Rodapé limpo */}
      <footer className="relative z-10 border-t border-emerald-500/15 bg-[#030a08]/92 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-300/70">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#39FF14]" />
            <span>
              EZIO · Assistente Virtual Educativo de Conscientização e Monitoramento Ambiental
            </span>
          </span>
          <span className="ezio-mono text-emerald-400/70">
            Amazônia &amp; Taiga · 9º Ano
          </span>
        </div>
      </footer>
    </div>
  );
}
