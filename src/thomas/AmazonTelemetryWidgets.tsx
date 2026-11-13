import React, { useEffect, useState } from "react";
import { Play, Radio, Trees, Cpu, Compass } from "lucide-react";
import {
  THOMAS_IOT_METRICS,
  THOMAS_TRIGGERS,
  ThomasVideoItem,
} from "./thomasConfig";

interface AmazonTelemetryWidgetsProps {
  activeTriggerId: string | null;
  playedTriggerIds: string[];
  disabled?: boolean;
  onSelectTrigger: (trigger: ThomasVideoItem) => void;
}

export const AmazonTelemetryWidgets: React.FC<AmazonTelemetryWidgetsProps> = ({
  activeTriggerId,
  playedTriggerIds,
  disabled = false,
  onSelectTrigger,
}) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [liveOffset, setLiveOffset] = useState(0);

  // Variação suave realista nos sensores ambientais da Amazônia
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveOffset((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const getMetricDisplay = (id: string, baseValue: string) => {
    if (id === "temp_canopy") {
      const vals = ["26.4", "26.5", "26.3", "26.4"];
      return vals[liveOffset];
    }
    if (id === "humidity_air") {
      const vals = ["87.8", "88.1", "87.9", "88.0"];
      return vals[liveOffset];
    }
    return baseValue;
  };

  return (
    <section aria-label="Sensores e gatilhos da Floresta Amazônica" className="space-y-8">
      {/* Faixa de Telemetria IoT da Floresta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {THOMAS_IOT_METRICS.map((metric) => (
          <div
            key={metric.id}
            className="rounded-xl bg-[#07150d]/90 border border-emerald-500/25 p-4 flex flex-col justify-between gap-2"
          >
            <span className="text-xs font-medium text-emerald-300/75">
              {metric.label}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="thomas-mono text-2xl font-semibold text-emerald-50">
                {getMetricDisplay(metric.id, metric.value)}
              </span>
              <span className="thomas-mono text-xs text-[#39FF14]">
                {metric.unit}
              </span>
            </div>
            <span className="text-xs text-emerald-400/70">
              {metric.detail}
            </span>
          </div>
        ))}
      </div>

      {/* Painel de Esquema Visual: Drone, Sensores IoT e Fauna */}
      <div className="rounded-xl bg-[#07150d]/85 border border-emerald-500/25 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p className="thomas-mono text-xs text-[#39FF14]">
              Arquitetura de Monitoramento · Floresta Amazônica
            </p>
            <h3 className="thomas-display text-xl font-semibold text-emerald-50">
              Drones Autônomos, Sensores IoT e Proteção da Fauna
            </h3>
            <p className="text-sm text-emerald-200/80 leading-relaxed">
              Drones sobrevoam a copa detectando focos de calor e desmatamento enquanto sensores
              solares nas árvores captam umidade, temperatura e sons de animais silvestres.
            </p>
          </div>

          {/* Representação vetorial de Drone + Sensor IoT + Árvore Amazônica */}
          <div className="flex items-center gap-6 shrink-0 self-start lg:self-center">
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#040d08] border border-emerald-500/30">
              <svg
                width="92"
                height="64"
                viewBox="0 0 92 64"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                {/* Cone de varredura LiDAR do drone */}
                <path
                  d="M46 22L22 58H70L46 22Z"
                  fill="url(#droneBeam)"
                />
                {/* Hélices e corpo do drone */}
                <line x1="18" y1="14" x2="36" y2="14" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" />
                <line x1="56" y1="14" x2="74" y2="14" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" />
                <path d="M27 14V19H65V14" stroke="#6EE7B7" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="37" y="15" width="18" height="7" rx="3" fill="#10B981" />
                <circle cx="46" cy="24" r="2.5" fill="#39FF14" />
                {/* Nó IoT no tronco / solo */}
                <rect x="39" y="52" width="14" height="8" rx="2" fill="#064E3B" stroke="#34D399" strokeWidth="1.2" />
                <circle cx="46" cy="56" r="1.5" fill="#F59E0B" />
                <defs>
                  <linearGradient id="droneBeam" x1="46" y1="22" x2="46" y2="58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#39FF14" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#10B981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-100 font-medium">
                  <Compass className="w-3.5 h-3.5 text-[#39FF14]" />
                  <span>Varredura LiDAR</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-200/80">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" />
                  <span>Sensores IoT Solares</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-200/80">
                  <Trees className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Monitoramento de Copa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Os 3 Gatilhos Exclusivos do Projeto Thomas */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="thomas-display text-lg font-semibold text-emerald-50">
            Comandos de Voz Disponíveis
          </h3>
          <span className="text-xs text-emerald-300/75">
            Fale uma das 3 perguntas abaixo ou clique em um cartão para reproduzir uma vez
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {THOMAS_TRIGGERS.map((trigger) => {
            const isActive = activeTriggerId === trigger.id;
            const wasPlayed = playedTriggerIds.includes(trigger.id);
            const imgBroken = Boolean(imageErrors[trigger.id]);

            return (
              <article
                key={trigger.id}
                className={`rounded-xl overflow-hidden bg-[#07150d]/95 border transition-colors flex flex-col ${
                  isActive
                    ? "border-[#39FF14] amazon-glow-active"
                    : "border-emerald-500/25 hover:border-emerald-400/60"
                }`}
              >
                {/* Mídia visual do tema (Fauna / Drones / IoT) */}
                <div className="relative aspect-[4/3] w-full bg-[#040b07] overflow-hidden">
                  {trigger.imageUrl && !imgBroken ? (
                    <img
                      src={trigger.imageUrl}
                      alt={trigger.shortTitle}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImageErrors((prev) => ({ ...prev, [trigger.id]: true }))
                      }
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#062415] to-[#030d08] flex items-center justify-center">
                      <Radio className="w-10 h-10 text-emerald-500/60" />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#07150d] via-black/30 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                    <span className="thomas-mono text-emerald-200/95">
                      {trigger.label} · {trigger.sensorTag}
                    </span>
                    {wasPlayed && (
                      <span className="thomas-mono text-[#39FF14]">
                        Visualizado
                      </span>
                    )}
                  </div>
                </div>

                {/* Conteúdo do cartão */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h4 className="thomas-display text-base font-semibold text-emerald-50">
                      “{trigger.phrase}”
                    </h4>
                    <p className="text-sm text-emerald-200/75 leading-relaxed">
                      {trigger.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectTrigger(trigger)}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#0d2818] hover:bg-[#22c55e] text-emerald-100 hover:text-[#031208] border border-emerald-500/35 hover:border-[#39FF14] disabled:opacity-45 disabled:pointer-events-none text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isActive ? "Reproduzindo..." : "Ativar Vídeo"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
