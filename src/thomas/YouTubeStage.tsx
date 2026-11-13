import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, CheckCircle2, Play, RotateCw } from "lucide-react";

interface YouTubeStageProps {
  videoId: string;
  title: string;
  label: string;
  playbackNonce: number;
  isIntro?: boolean;
  onVideoEnded: () => void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<any> | null = null;

function loadYouTubeIframeAPI(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser environment required"));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") {
        try {
          previousCallback();
        } catch (_) {}
      }
      resolve(window.YT);
    };

    const existingScript = document.getElementById("thomas-youtube-iframe-api");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "thomas-youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }

    // Polling de segurança caso o script já esteja carregado por outro motivo
    const poll = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(poll);
        resolve(window.YT);
      }
    }, 120);
  });

  return ytApiPromise;
}

export const YouTubeStage: React.FC<YouTubeStageProps> = ({
  videoId,
  title,
  label,
  playbackNonce,
  isIntro = false,
  onVideoEnded,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const endedFiredRef = useRef<boolean>(false);
  const onEndedRef = useRef(onVideoEnded);
  onEndedRef.current = onVideoEnded;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [needsManualStart, setNeedsManualStart] = useState(false);
  const [autoplayMutedNotice, setAutoplayMutedNotice] = useState(false);

  const finishPlaybackCleanly = () => {
    if (endedFiredRef.current) return;
    endedFiredRef.current = true;

    try {
      playerRef.current?.stopVideo?.();
    } catch (_) {}

    onEndedRef.current();
  };

  useEffect(() => {
    endedFiredRef.current = false;
    setIsReady(false);
    setIsPlaying(false);
    setNeedsManualStart(false);
    setAutoplayMutedNotice(false);

    let cancelled = false;
    let autoplayCheckTimer: ReturnType<typeof setTimeout> | null = null;
    let secondaryCheckTimer: ReturnType<typeof setTimeout> | null = null;

    const mountPlayer = async () => {
      try {
        const YT = await loadYouTubeIframeAPI();
        if (cancelled || !hostRef.current) return;

        // Cria um elemento filho limpo para o YT.Player substituir pelo <iframe>
        hostRef.current.innerHTML = "";
        const mountNode = document.createElement("div");
        mountNode.style.width = "100%";
        mountNode.style.height = "100%";
        hostRef.current.appendChild(mountNode);

        if (playerRef.current?.destroy) {
          try {
            playerRef.current.destroy();
          } catch (_) {}
          playerRef.current = null;
        }

        const player = new YT.Player(mountNode, {
          width: "100%",
          height: "100%",
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0, // Impede botão e modo de tela cheia
            loop: 0, // Impede repetição automática
            iv_load_policy: 3,
            disablekb: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return;
              setIsReady(true);

              // Garante que o iframe gerado nunca permita tela cheia e ajuste-se 100% ao contêiner 16:9
              try {
                const iframe = event.target?.getIframe?.();
                if (iframe) {
                  iframe.removeAttribute("allowfullscreen");
                  iframe.style.width = "100%";
                  iframe.style.height = "100%";
                  iframe.style.display = "block";
                  iframe.style.border = "0";
                }
              } catch (_) {}

              try {
                event.target.unMute?.();
                event.target.setVolume?.(100);
                setIsMuted(false);
              } catch (_) {}

              try {
                event.target.playVideo?.();
              } catch (_) {}

              // Verifica se o navegador bloqueou autoplay com som
              autoplayCheckTimer = setTimeout(() => {
                if (cancelled) return;
                try {
                  const state = event.target.getPlayerState?.();
                  if (state !== 1 && state !== 3) {
                    event.target.mute?.();
                    setIsMuted(true);
                    setAutoplayMutedNotice(true);
                    event.target.playVideo?.();

                    secondaryCheckTimer = setTimeout(() => {
                      if (cancelled) return;
                      try {
                        const retryState = event.target.getPlayerState?.();
                        if (retryState !== 1 && retryState !== 3) {
                          setNeedsManualStart(true);
                        }
                      } catch (_) {}
                    }, 900);
                  }
                } catch (_) {}
              }, 800);
            },
            onStateChange: (event: any) => {
              if (cancelled) return;
              const state = event.data;
              if (state === 1) {
                setIsPlaying(true);
                setNeedsManualStart(false);
                try {
                  setIsMuted(Boolean(event.target.isMuted?.()));
                } catch (_) {}
              } else if (state === 2) {
                setIsPlaying(false);
              } else if (state === 0) {
                // YT.PlayerState.ENDED -> interrompe imediatamente e retorna à escuta
                finishPlaybackCleanly();
              }
            },
          },
        });

        playerRef.current = player;
      } catch (err) {
        console.error("[Projeto Thomas] Falha ao iniciar reprodutor YouTube:", err);
      }
    };

    mountPlayer();

    // Listener adicional via postMessage para máxima confiabilidade na detecção do fim do vídeo
    const handleMessage = (event: MessageEvent) => {
      if (cancelled) return;
      try {
        let data = event.data;
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
        if (
          data &&
          ((data.event === "onStateChange" && data.info === 0) ||
            (data.info && data.info.playerState === 0))
        ) {
          finishPlaybackCleanly();
        }
      } catch (_) {}
    };

    window.addEventListener("message", handleMessage);

    return () => {
      cancelled = true;
      window.removeEventListener("message", handleMessage);
      if (autoplayCheckTimer) clearTimeout(autoplayCheckTimer);
      if (secondaryCheckTimer) clearTimeout(secondaryCheckTimer);
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.stopVideo?.();
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
    };
  }, [videoId, playbackNonce]);

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute?.();
        playerRef.current.setVolume?.(100);
        setIsMuted(false);
        setAutoplayMutedNotice(false);
      } else {
        playerRef.current.mute?.();
        setIsMuted(true);
      }
    } catch (_) {}
  };

  const handleManualPlay = () => {
    if (!playerRef.current) return;
    try {
      playerRef.current.unMute?.();
      playerRef.current.setVolume?.(100);
      setIsMuted(false);
      setAutoplayMutedNotice(false);
      setNeedsManualStart(false);
      playerRef.current.playVideo?.();
    } catch (_) {}
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Cabeçalho informativo do player */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3 text-sm">
          <span className="thomas-mono text-xs font-semibold text-[#39FF14]">
            {label}
          </span>
          <span className="text-emerald-500/40" aria-hidden="true">
            ·
          </span>
          <h2 className="thomas-display text-base sm:text-lg font-semibold text-emerald-50 tracking-tight">
            {title}
          </h2>
        </div>
        <span className="thomas-mono text-xs text-emerald-300/75">
          {isPlaying ? "Reprodução única ativa" : isReady ? "Pronto para reproduzir" : "Carregando vídeo"}
        </span>
      </div>

      {/* Palco 16:9 ajustado ao espaço disponível, sem tela cheia e sem cortes */}
      <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden bg-[#020704] border border-emerald-500/40 amazon-glow-active">
        <div ref={hostRef} className="w-full h-full" />

        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#040b07]/95 pointer-events-none">
            <RotateCw className="w-7 h-7 text-[#39FF14] animate-spin" />
            <p className="text-sm text-emerald-200">
              Conectando transmissão do Projeto Thomas...
            </p>
          </div>
        )}

        {needsManualStart && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 p-6 text-center">
            <p className="text-sm text-emerald-100 max-w-md">
              O navegador bloqueou o início automático. Clique abaixo para iniciar o vídeo com áudio.
            </p>
            <button
              type="button"
              onClick={handleManualPlay}
              className="px-5 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#39FF14] text-[#031208] font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reproduzir Vídeo com Áudio</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra de controle inferior abaixo do player (sem cobrir o vídeo) */}
      <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMute}
            className="px-4 py-2 rounded-lg bg-[#091810] hover:bg-[#0e261a] border border-emerald-500/30 text-emerald-100 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span>Ativar Áudio do Vídeo</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#39FF14]" />
                <span>Áudio Ativo</span>
              </>
            )}
          </button>

          {autoplayMutedNotice && isMuted && (
            <span className="text-xs text-amber-300/90">
              Áudio silenciado pelo navegador no início automático — clique ao lado para ouvir.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={finishPlaybackCleanly}
          className="px-4 py-2 rounded-lg bg-[#091810] hover:bg-emerald-950 border border-emerald-500/40 hover:border-[#39FF14]/70 text-emerald-100 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />
          <span>{isIntro ? "Ir para Escuta por Voz" : "Encerrar Vídeo e Voltar à Escuta"}</span>
        </button>
      </div>
    </div>
  );
};
