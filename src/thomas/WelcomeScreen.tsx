import React, { useState } from "react";
import { Play, Trees, Compass, Cpu, Radio } from "lucide-react";

interface WelcomeScreenProps {
  onStartPresentation: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartPresentation,
}) => {
  const [faunaImgError, setFaunaImgError] = useState(false);
  const [droneImgError, setDroneImgError] = useState(false);

  return (
    <section
      aria-label="Tela inicial do Projeto Thomas"
      className="flex flex-col items-center justify-center py-6 sm:py-10 space-y-10"
    >
      {/* Bloco Principal de Abertura com Botão Central */}
      <div className="w-full rounded-2xl bg-[#06130b]/90 border border-emerald-500/35 amazon-glow-border px-6 py-10 sm:px-12 sm:py-14 text-center flex flex-col items-center gap-7">
        <div className="space-y-3 max-w-3xl">
          <p className="thomas-mono text-xs sm:text-sm text-[#39FF14] tracking-wide">
            Projeto Thomas · Apresentação Escolar Interativa
          </p>
          <h1
            className="thomas-display font-bold text-emerald-50 tracking-tight text-balance leading-tight"
            style={{ fontSize: "clamp(2rem, 4.2vw, 3.5rem)" }}
          >
            Monitoramento Inteligente da Amazônia
          </h1>
          <p className="text-sm sm:text-base text-emerald-200/85 max-w-2xl mx-auto leading-relaxed">
            Explore como drones autônomos, sensores IoT instalados na floresta e
            monitoramento bioacústico protegem a biodiversidade amazônica em tempo real.
          </p>
        </div>

        {/* Botão Central Único e Destacado */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onStartPresentation}
            className="px-9 py-4 sm:px-12 sm:py-5 rounded-xl bg-[#22c55e] hover:bg-[#39FF14] active:scale-[0.99] text-[#031208] thomas-display font-bold text-base sm:text-xl tracking-wide flex items-center justify-center gap-3 shadow-[0_0_36px_rgba(57,255,20,0.42)] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF14] focus-visible:ring-offset-4 focus-visible:ring-offset-[#040b07]"
          >
            <Play className="w-6 h-6 fill-current shrink-0" />
            <span>INICIAR APRESENTAÇÃO</span>
          </button>
        </div>

        <p className="thomas-mono text-xs text-emerald-300/75">
          Ao iniciar, o vídeo de introdução será exibido uma única vez antes da interação por voz
        </p>
      </div>

      {/* Três Pilares Visuais: Animais da Amazônia, Drones e Sensores IoT */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pilar 1: Animais da Amazônia */}
        <div className="rounded-xl overflow-hidden bg-[#07150d]/90 border border-emerald-500/25 flex flex-col">
          <div className="relative aspect-[4/3] w-full bg-[#040b07] overflow-hidden">
            {!faunaImgError ? (
              <img
                src="/src/assets/images/amazon_wildlife_fauna_1794531679351.jpg"
                alt="Onça-pintada e arara-vermelha na Floresta Amazônica"
                referrerPolicy="no-referrer"
                onError={() => setFaunaImgError(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#062415] to-[#030d08] flex items-center justify-center">
                <Trees className="w-10 h-10 text-emerald-500/60" />
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#07150d] via-black/25 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs thomas-mono text-[#39FF14]">
              <Trees className="w-4 h-4 shrink-0" />
              <span>Biodiversidade · Fauna</span>
            </div>
            <h2 className="thomas-display text-base font-semibold text-emerald-50">
              Animais da Amazônia
            </h2>
            <p className="text-sm text-emerald-200/75 leading-relaxed">
              Acompanhamento de espécies silvestres e preservação de seus habitats naturais.
            </p>
          </div>
        </div>

        {/* Pilar 2: Drones Autônomos */}
        <div className="rounded-xl overflow-hidden bg-[#07150d]/90 border border-emerald-500/25 flex flex-col">
          <div className="relative aspect-[4/3] w-full bg-[#040b07] overflow-hidden">
            {!droneImgError ? (
              <img
                src="/src/assets/images/amazon_drone_iot_1794531681156.jpg"
                alt="Drone de monitoramento ambiental com feixe óptico sobre a Amazônia"
                referrerPolicy="no-referrer"
                onError={() => setDroneImgError(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#062415] to-[#030d08] flex items-center justify-center">
                <Compass className="w-10 h-10 text-emerald-500/60" />
              </div>
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-[#07150d] via-black/25 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs thomas-mono text-[#39FF14]">
              <Compass className="w-4 h-4 shrink-0" />
              <span>Varredura Aérea · LiDAR</span>
            </div>
            <h2 className="thomas-display text-base font-semibold text-emerald-50">
              Drones de Vigilância
            </h2>
            <p className="text-sm text-emerald-200/75 leading-relaxed">
              Sobrevoo autônomo da copa das árvores com sensores térmicos e câmeras de precisão.
            </p>
          </div>
        </div>

        {/* Pilar 3: Rede de Sensores IoT & Monitoramento */}
        <div className="rounded-xl overflow-hidden bg-[#07150d]/90 border border-emerald-500/25 flex flex-col">
          <div className="relative aspect-[4/3] w-full bg-[#040e08] flex flex-col items-center justify-center p-6 gap-4">
            {/* Radar e Esquema de Sensor IoT */}
            <svg
              width="124"
              height="124"
              viewBox="0 0 124 124"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="62" cy="62" r="52" stroke="rgba(57,255,20,0.22)" strokeWidth="1.2" />
              <circle cx="62" cy="62" r="34" stroke="rgba(57,255,20,0.25)" strokeWidth="1.2" />
              <circle cx="62" cy="62" r="16" stroke="rgba(57,255,20,0.35)" strokeWidth="1.2" />
              <g className="thomas-radar-sweep">
                <path
                  d="M62 62L62 10A52 52 0 0 1 107 36Z"
                  fill="rgba(57, 255, 20, 0.22)"
                />
                <line x1="62" y1="62" x2="62" y2="10" stroke="#39FF14" strokeWidth="2" />
              </g>
              <circle cx="62" cy="62" r="4" fill="#39FF14" />
              <circle cx="38" cy="40" r="3" fill="#2DD4BF" />
              <circle cx="88" cy="48" r="3" fill="#F59E0B" />
              <circle cx="46" cy="88" r="3" fill="#34D399" />
            </svg>
            <div className="flex items-center gap-4 text-xs thomas-mono text-emerald-200/85">
              <span>26.4 °C</span>
              <span className="text-emerald-500/40" aria-hidden="true">·</span>
              <span>87.8 % Umid.</span>
              <span className="text-emerald-500/40" aria-hidden="true">·</span>
              <span>24 Nós IoT</span>
            </div>
          </div>
          <div className="p-5 space-y-2 border-t border-emerald-500/15">
            <div className="flex items-center gap-2 text-xs thomas-mono text-teal-300">
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Sensores Solares · Telemetria</span>
            </div>
            <h2 className="thomas-display text-base font-semibold text-emerald-50">
              Monitoramento Ambiental
            </h2>
            <p className="text-sm text-emerald-200/75 leading-relaxed">
              Sensores inteligentes na floresta enviam alertas rápidos contra queimadas e ameaças.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-emerald-300/70">
        <Radio className="w-4 h-4 text-[#39FF14]" />
        <span>Clique em INICIAR APRESENTAÇÃO acima para começar</span>
      </div>
    </section>
  );
};
