import React from "react";
import {
  Play,
  MessageSquareText,
  Compass,
  Cpu,
  ShieldCheck,
  Trees,
  Sparkles,
} from "lucide-react";
import {
  THOMAS_INTRO_VIDEO,
  THOMAS_TRIGGERS,
  ThomasSuggestedQuestion,
} from "./thomasConfig";

interface SuggestedQuestionsPanelProps {
  lastCompletedVideoId: string;
  suggestions: ThomasSuggestedQuestion[];
  isBusy?: boolean;
  onSelectSuggestion: (suggestion: ThomasSuggestedQuestion) => void;
}

function getContextLabel(videoId: string): string {
  if (videoId === THOMAS_INTRO_VIDEO.id) {
    return "Após a Introdução";
  }
  const trigger = THOMAS_TRIGGERS.find((t) => t.id === videoId);
  if (trigger) {
    return `Após ${trigger.label} · ${trigger.shortTitle}`;
  }
  return "Sugestões disponíveis";
}

function renderTopicIcon(iconType: ThomasSuggestedQuestion["iconType"]) {
  switch (iconType) {
    case "fauna":
      return <Trees className="w-5 h-5 text-[#39FF14]" />;
    case "drone":
      return <Compass className="w-5 h-5 text-[#39FF14]" />;
    case "sensor":
      return <Cpu className="w-5 h-5 text-teal-400" />;
    case "shield":
      return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
    case "tech":
    default:
      return <Sparkles className="w-5 h-5 text-teal-300" />;
  }
}

export const SuggestedQuestionsPanel: React.FC<SuggestedQuestionsPanelProps> = ({
  lastCompletedVideoId,
  suggestions,
  isBusy = false,
  onSelectSuggestion,
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-emerald-500/20">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <p className="thomas-mono text-xs text-[#39FF14]">
            {getContextLabel(lastCompletedVideoId)}
          </p>
          <h3 className="thomas-display text-base sm:text-lg font-semibold text-emerald-50">
            Perguntas Sugeridas — Clique ou fale pelo microfone
          </h3>
        </div>
        <span className="text-xs text-emerald-300/75">
          Escolha livre: clique em um cartão ou pergunte por voz
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((item) => {
          const hasVideoShortcut = Boolean(item.targetTriggerId);

          return (
            <button
              key={item.id}
              type="button"
              disabled={isBusy}
              onClick={() => onSelectSuggestion(item)}
              className="group text-left rounded-xl bg-[#051009]/95 hover:bg-[#0a1e12] border border-emerald-500/30 hover:border-[#39FF14] p-4 flex flex-col justify-between gap-4 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#0a2214] border border-emerald-500/25 flex items-center justify-center shrink-0">
                    {renderTopicIcon(item.iconType)}
                  </div>
                  <span className="thomas-mono text-[11px] text-emerald-300/75">
                    {hasVideoShortcut ? "Atalho de vídeo" : "Assistente"}
                  </span>
                </div>

                <p className="thomas-display text-sm sm:text-base font-semibold text-emerald-50 leading-snug group-hover:text-[#39FF14] transition-colors">
                  {item.question}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-emerald-200/80 group-hover:text-emerald-50 pt-2 border-t border-emerald-500/15">
                {hasVideoShortcut ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#39FF14] fill-current shrink-0" />
                    <span>Reproduzir vídeo correspondente</span>
                  </>
                ) : (
                  <>
                    <MessageSquareText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>Responder com o assistente</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
