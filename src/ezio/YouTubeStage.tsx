import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, CheckCircle2, Play, RotateCw, Tv } from "lucide-react";

interface YouTubeStageProps {
  videoId: string;
  title: string;
  label: string;
  playbackNonce: number;
  accentTone?: "emerald" | "cyan";
  isIntro?: boolean;
  isFarewell?: boolean;
  onVideoEnded: () => void;
}

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ezioYtApiPromise: Promise<any> | null = null;

function loadYouTubeIframeAPI(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser environment required"));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (ezioYtApiPromise) {
    return ezioYtApiPromise;
  }

  ezioYtApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") {
        try {
          previousCallback();
        } catch (_) {}
      }
      resolve(window.YT);
    };

    const existingScript = document.getElementById("ezio-youtube-iframe-api");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "ezio-youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }

    const poll = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(poll);
        resolve(window.YT);
      }
    }, 120);
  });

  return ezioYtApiPromise;
}

export const YouTubeStage: React.FC<YouTubeStageProps> = ({
  videoId,
  title,
  label,
  playbackNonce,
  accentTone = "emerald",
  isIntro = false,
  isFarewell = false,
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
            fs: 0, // Sem abertura em tela cheia
            loop: 0, // Sem repetição automática
            iv_load_policy: 3,
            disablekb: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return;
              setIsReady(true);

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
                finishPlaybackCleanly();
              }
            },
          },
        });

        playerRef.current = player;
      } catch (err) {
        console.error("[EZIO] Falha ao iniciar reprodutor YouTube:", err);
      }
    };

    mountPlayer();

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

  const accentText =
    accentTone === "cyan" ? "text-cyan-300" : "text-[#39FF14]";
  const frameBorder =
    accentTone === "cyan"
      ? "border-cyan-400/50 ezio-glow-cyan"
      : "border-emerald-500/45 ezio-glow-emerald";

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Cabeçalho com indicação visual clara de reprodução */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3 text-sm">
          <span className={`ezio-mono text-xs font-semibold ${accentText}`}>
            {label}
          </span>
          <span className="text-emerald-500/40" aria-hidden="true">
            ·
          </span>
          <h2 className="ezio-display text-base sm:text-lg font-semibold text-emerald-50 tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 ezio-mono text-xs text-emerald-200/85">
          <Tv className={`w-3.5 h-3.5 ${accentText}`} />
          <span>
            {isPlaying
              ? "Vídeo em reprodução · Modo FIT (1x)"
              : isReady
              ? "Pronto para iniciar"
              : "Conectando vídeo..."}
          </span>
        </div>
      </div>

      {/* Palco 16:9 ajustado ao espaço disponível (FIT), sem cortes e sem tela cheia */}
      <div
        className={`relative w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden bg-[#020705] border ${frameBorder}`}
      >
        <div ref={hostRef} className="w-full h-full" />

        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#030a08]/95 pointer-events-none">
            <RotateCw className={`w-7 h-7 animate-spin ${accentText}`} />
            <p className="text-sm text-emerald-200">
              Carregando transmissão do EZIO...
            </p>
          </div>
        )}

        {needsManualStart && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 p-6 text-center">
            <p className="text-sm text-emerald-100 max-w-md">
              O navegador bloqueou o início automático. Clique abaixo para reproduzir o vídeo com áudio.
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

      {/* Controles organizados abaixo do vídeo */}
      <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMute}
            className="px-4 py-2 rounded-lg bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/30 text-emerald-100 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span>Ativar Áudio do Vídeo</span>
              </>
            ) : (
              <>
                <Volume2 className={`w-4 h-4 ${accentText}`} />
                <span>Áudio Ativo</span>
              </>
            )}
          </button>

          {autoplayMutedNotice && isMuted && (
            <span className="text-xs text-amber-300/90">
              Áudio silenciado inicialmente pelo navegador — clique ao lado para ouvir.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={finishPlaybackCleanly}
          className="px-4 py-2 rounded-lg bg-[#081913] hover:bg-[#0e2a20] border border-emerald-500/40 hover:border-cyan-400/70 text-emerald-100 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <CheckCircle2 className={`w-4 h-4 ${accentText}`} />
          <span>
            {isFarewell
              ? "Concluir e Encerrar Apresentação"
              : isIntro
              ? "Concluir Introdução e Ir para Interação"
              : "Encerrar Vídeo e Voltar à Escuta"}
          </span>
        </button>
      </div>
    </div>
  );
};
