import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Send, 
  Tv, 
  Upload, 
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Settings,
  MessageSquare,
  HelpCircle,
  Video,
  Cloud,
  Database,
  Folder,
  FolderOpen,
  Chrome,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Play,
  Image as ImageIcon,
  Maximize,
  Minimize,
  Smartphone,
  ShieldAlert,
  ShieldCheck,
  Lock,
  ExternalLink,
  Radio,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Download,
  Save,
  HardDrive,
  Plus,
  X,
  ArrowUpRight,
  FileText
} from "lucide-react";
import { Trigger } from "./types";
import { safeStorage } from "./safeStorage";

interface CustomQuestion {
  id: string;
  phrase: string;
  videoUrl: string;
  videoName: string;
}

export type VideoQualityPreference = "hd1080" | "hd720" | "large" | "medium" | "auto";

// Helper to extract YouTube Video ID from any format (standard, short, embed, shorts)
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return Boolean(getYouTubeVideoId(url));
}

// Pre-configured default videos so the tool pulls videos by URL immediately across any device
export const DEFAULT_INTRO_URL = "https://youtu.be/GwhjqwYkk6o";
export const DEFAULT_INTRO_NAME = "Apresentação: Assistente Virtual (HD)";

export const DEFAULT_QUESTIONS: CustomQuestion[] = [
  { 
    id: "questionA", 
    phrase: "mostrar pantanal", 
    videoUrl: "https://www.youtube.com/watch?v=Thdhg_Q6wX8", 
    videoName: "Pantanal e Natureza Tropical 4K (YouTube)" 
  },
  { 
    id: "questionB", 
    phrase: "mostrar chuva", 
    videoUrl: "https://www.youtube.com/watch?v=mPZkdNFkNps", 
    videoName: "Chuva e Águas do Pantanal (YouTube)" 
  }
];

export default function App() {
  // Navigation: state to change between the interactive screen "chat" and "settings"
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");

  // Dynamic Questions List State
  const [questions, setQuestions] = useState<CustomQuestion[]>(() => {
    try {
      const saved = safeStorage.getItem("eco_custom_questions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed
            .filter((q: any) => q && typeof q === "object")
            .map((q: any, idx: number) => ({
              id: typeof q.id === "string" && q.id ? q.id : `question_${Date.now()}_${idx}`,
              phrase: typeof q.phrase === "string" ? q.phrase : `pergunta ${idx + 1}`,
              videoUrl: typeof q.videoUrl === "string" && !q.videoUrl.startsWith("blob:") ? q.videoUrl : (typeof q.videoUrl === "string" ? q.videoUrl : ""),
              videoName: typeof q.videoName === "string" ? q.videoName : ""
            }));
          if (validated.length > 0) {
            return validated;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load eco_custom_questions:", e);
    }

    return DEFAULT_QUESTIONS;
  });

  // URLs for video playback (YouTube link, web URL, or local file)
  const [introUrl, setIntroUrl] = useState<string>(() => {
    try {
      const saved = safeStorage.getItem("eco_intro_url");
      if (saved && typeof saved === "string" && saved.trim()) {
        return saved.trim();
      }
      safeStorage.setItem("eco_intro_url", DEFAULT_INTRO_URL);
    } catch (_) {}
    return DEFAULT_INTRO_URL;
  });
  const [introName, setIntroName] = useState<string>(() => {
    try {
      const saved = safeStorage.getItem("eco_intro_name");
      if (saved && typeof saved === "string" && saved.trim()) {
        return saved.trim();
      }
      safeStorage.setItem("eco_intro_name", DEFAULT_INTRO_NAME);
    } catch (_) {}
    return DEFAULT_INTRO_NAME;
  });

  // Perguntas Sugeridas para o Usuário (Persistidas no LocalStorage)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem("wit_suggested_questions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validStrings = parsed
            .map((item: any) => typeof item === "string" ? item.trim() : (item && typeof item === "object" && item.text ? String(item.text).trim() : ""))
            .filter((item: string) => item.length > 0);
          if (validStrings.length > 0) {
            return validStrings;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load wit_suggested_questions:", e);
    }
    return [
      "mostrar pantanal",
      "mostrar natureza",
      "mostrar chuva",
      "como funciona a assistente?",
      "reiniciar apresentação"
    ];
  });
  const [newSuggestedInput, setNewSuggestedInput] = useState("");

  useEffect(() => {
    try {
      safeStorage.setItem("wit_suggested_questions", JSON.stringify(suggestedQuestions));
    } catch (e) {
      console.warn("Failed to save wit_suggested_questions:", e);
    }
  }, [suggestedQuestions]);

  // Toast / Notificação de Salvamento
  const [saveToast, setSaveToast] = useState<{ message: string; visible: boolean; type?: "success" | "info" } | null>(null);

  const showSaveSuccess = (message: string) => {
    setSaveToast({ message, visible: true, type: "success" });
    setTimeout(() => {
      setSaveToast(prev => prev ? { ...prev, visible: false } : null);
    }, 4000);
  };

  // Salvar Todos os Dados do App (Backup Local)
  const handleSaveAllData = () => {
    try {
      const configToSave = questions.map(q => ({
        id: q.id,
        phrase: q.phrase,
        videoUrl: q.videoUrl && !q.videoUrl.startsWith("blob:") ? q.videoUrl : "",
        videoName: q.videoName
      }));
      safeStorage.setItem("eco_custom_questions", JSON.stringify(configToSave));
      safeStorage.setItem("wit_suggested_questions", JSON.stringify(suggestedQuestions));
      if (introUrl && !introUrl.startsWith("blob:")) {
        safeStorage.setItem("eco_intro_url", introUrl);
      }
      safeStorage.setItem("eco_intro_name", introName);
      safeStorage.setItem("eco_video_quality", preferredVideoQuality);
      safeStorage.setItem("eco_video_fit", videoFit);
      safeStorage.setItem("eco_force_1080p_only", String(force1080pOnly));
      safeStorage.setItem("eco_mobile_fullscreen_auto", String(mobileFullscreenAuto));
      safeStorage.setItem("eco_speech_engine", preferredSpeechEngine);
      safeStorage.setItem("eco_show_bg_image", String(showBgImage));
      safeStorage.setItem("eco_bg_opacity", String(bgOpacity));
      safeStorage.setItem("wit_last_saved", new Date().toISOString());

      showSaveSuccess("Todos os dados do app foram salvos com sucesso!");
    } catch (err: any) {
      console.warn("Erro ao salvar dados:", err);
      showSaveSuccess("Aviso: Dados mantidos na sessão atual.");
    }
  };

  // Exportar Backup Completo (.JSON)
  const handleExportBackup = () => {
    try {
      const backupData = {
        app: "WIT - Assistente Virtual",
        version: "2.5",
        exportedAt: new Date().toISOString(),
        intro: {
          url: introUrl && !introUrl.startsWith("blob:") ? introUrl : DEFAULT_INTRO_URL,
          name: introName || DEFAULT_INTRO_NAME
        },
        questions: questions.map(q => ({
          id: q.id,
          phrase: q.phrase,
          videoUrl: q.videoUrl && !q.videoUrl.startsWith("blob:") ? q.videoUrl : "",
          videoName: q.videoName
        })),
        suggestedQuestions,
        settings: {
          preferredVideoQuality,
          videoFit,
          force1080pOnly,
          mobileFullscreenAuto,
          preferredSpeechEngine,
          showBgImage,
          bgOpacity
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup-wit-assistente-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showSaveSuccess("Arquivo de backup (.JSON) gerado e baixado com sucesso!");
    } catch (err: any) {
      console.warn("Erro ao exportar backup:", err);
      showSaveSuccess("Aviso: Falha ao exportar backup.");
    }
  };

  // Importar / Restaurar Backup (.JSON)
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (Array.isArray(data.questions) && data.questions.length > 0) {
          const validated = data.questions
            .filter((q: any) => q && typeof q === "object")
            .map((q: any, idx: number) => ({
              id: typeof q.id === "string" && q.id ? q.id : `question_${Date.now()}_${idx}`,
              phrase: typeof q.phrase === "string" ? q.phrase : `pergunta ${idx + 1}`,
              videoUrl: typeof q.videoUrl === "string" && !q.videoUrl.startsWith("blob:") ? q.videoUrl : "",
              videoName: typeof q.videoName === "string" ? q.videoName : ""
            }));
          setQuestions(validated);
          safeStorage.setItem("eco_custom_questions", JSON.stringify(validated));
        }

        if (Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
          const validStrings = data.suggestedQuestions
            .map((item: any) => typeof item === "string" ? item.trim() : (item && typeof item === "object" && item.text ? String(item.text).trim() : ""))
            .filter((item: string) => item.length > 0);
          if (validStrings.length > 0) {
            setSuggestedQuestions(validStrings);
            safeStorage.setItem("wit_suggested_questions", JSON.stringify(validStrings));
          }
        }

        if (data.intro?.url && typeof data.intro.url === "string") {
          setIntroUrl(data.intro.url);
          safeStorage.setItem("eco_intro_url", data.intro.url);
        }
        if (data.intro?.name && typeof data.intro.name === "string") {
          setIntroName(data.intro.name);
          safeStorage.setItem("eco_intro_name", data.intro.name);
        }

        if (data.settings) {
          if (data.settings.preferredVideoQuality) {
            setPreferredVideoQuality(data.settings.preferredVideoQuality);
          }
          if (data.settings.videoFit) {
            setVideoFit(data.settings.videoFit);
          }
          if (typeof data.settings.force1080pOnly === "boolean") {
            setForce1080pOnly(data.settings.force1080pOnly);
          }
        }

        showSaveSuccess(`Backup restaurado! ${data.questions?.length || 0} perguntas e ${data.suggestedQuestions?.length || 0} sugestões carregadas.`);
      } catch (err: any) {
        console.warn("Falha ao carregar arquivo de backup:", err);
        showSaveSuccess("Erro: O arquivo selecionado não é um backup válido.");
      }
    };
    reader.readAsText(file);
  };

  const addSuggestedQuestion = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (suggestedQuestions.includes(trimmed)) return;
    setSuggestedQuestions(prev => [...prev, trimmed]);
    setNewSuggestedInput("");
  };

  const removeSuggestedQuestion = (indexToRemove: number) => {
    setSuggestedQuestions(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const copyTriggersToSuggested = () => {
    const phrases = questions.map(q => q.phrase.trim()).filter(Boolean);
    const combined = Array.from(new Set([...suggestedQuestions, ...phrases]));
    setSuggestedQuestions(combined);
    showSaveSuccess(`${phrases.length} perguntas dos canais foram adicionadas às sugestões!`);
  };

  // Active slot corresponds to either "intro" or any question id
  const [activeVideoSlot, setActiveVideoSlot] = useState<string>("intro");
  const [ytReloadKey, setYtReloadKey] = useState<number>(0);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Chat conversation state
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSpeechDetected, setLastSpeechDetected] = useState<string>("");
  const [realtimeSpeech, setRealtimeSpeech] = useState<string>("");
  const [speechError, setSpeechError] = useState("");
  const [aiResponseText, setAiResponseText] = useState<string>(
    "Canal pronto. Clique no microfone ou digite abaixo para falar um dos comandos configurados."
  );

  // Playback settings
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlayError, setVideoPlayError] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [showReplayPrompt, setShowReplayPrompt] = useState(false);
  const [viewedSlots, setViewedSlots] = useState<string[]>([]);
  const [videoFinished, setVideoFinished] = useState<boolean>(false);
  // Video starts when the user clicks "Iniciar Apresentação"
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Advanced Microphone & Audio States (for 100% Mobile & Desktop Compatibility)
  const [isRecordingMedia, setIsRecordingMedia] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied" | "prompt" | "unsupported">("unknown");
  const [showMicModal, setShowMicModal] = useState<boolean>(false);
  const [preferredSpeechEngine, setPreferredSpeechEngine] = useState<"auto" | "gemini" | "native">(() => {
    const saved = safeStorage.getItem("eco_speech_engine");
    if (saved === "gemini" || saved === "native" || saved === "auto") return saved;
    return "auto";
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const autoStopTimeoutRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Mobile & Fullscreen States
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [mobileFullscreenAuto, setMobileFullscreenAuto] = useState<boolean>(() => {
    const saved = safeStorage.getItem("eco_mobile_fullscreen_auto");
    return saved !== null ? saved === "true" : true;
  });

  const [videoFit, setVideoFit] = useState<"contain" | "cover">(() => {
    const saved = safeStorage.getItem("eco_video_fit");
    if (saved === "contain" || saved === "cover") return saved;
    // Padrão: Preencher a tela (especialmente no mobile conforme solicitado)
    return "cover";
  });

  // Quality Configuration States (1080p, 720p, 480p, 360p, auto)
  const [preferredVideoQuality, setPreferredVideoQuality] = useState<VideoQualityPreference>(() => {
    const saved = safeStorage.getItem("eco_video_quality");
    if (saved === "hd1080" || saved === "hd720" || saved === "large" || saved === "medium" || saved === "auto") {
      return saved as VideoQualityPreference;
    }
    return "hd1080";
  });

  const preferredVideoQualityRef = useRef<VideoQualityPreference>(preferredVideoQuality);

  useEffect(() => {
    preferredVideoQualityRef.current = preferredVideoQuality;
    safeStorage.setItem("eco_video_quality", preferredVideoQuality);
  }, [preferredVideoQuality]);

  // Extension Module: Force 1080p Only Lock Extension ("Extensão 1080p Only")
  const [force1080pOnly, setForce1080pOnly] = useState<boolean>(() => {
    const saved = safeStorage.getItem("eco_force_1080p_only");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    safeStorage.setItem("eco_force_1080p_only", String(force1080pOnly));
    if (force1080pOnly) {
      setPreferredVideoQuality("hd1080");
    }
  }, [force1080pOnly]);

  // Active Extension Watcher: Intercepts playback and locks resolution to 1080p continuously
  useEffect(() => {
    if (!force1080pOnly || !hasStarted || videoFinished) return;
    const interval = setInterval(() => {
      enforceYtQuality("hd1080");
    }, 1200);
    return () => clearInterval(interval);
  }, [force1080pOnly, hasStarted, videoFinished, activeVideoSlot]);

  useEffect(() => {
    safeStorage.setItem("eco_video_fit", videoFit);
  }, [videoFit]);

  useEffect(() => {
    safeStorage.setItem("eco_mobile_fullscreen_auto", String(mobileFullscreenAuto));
  }, [mobileFullscreenAuto]);

  useEffect(() => {
    safeStorage.setItem("eco_speech_engine", preferredSpeechEngine);
  }, [preferredSpeechEngine]);

  // Check initial microphone permission status if supported by the browser
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions && (navigator.permissions as any).query) {
      try {
        navigator.permissions.query({ name: "microphone" as PermissionName })
          .then((status) => {
            setMicPermission(status.state as any);
            status.onchange = () => {
              setMicPermission(status.state as any);
            };
          })
          .catch(() => {
            setMicPermission("unknown");
          });
      } catch (_) {
        setMicPermission("unknown");
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [isFullscreen]);

  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);

  // Automatic Fullscreen Management:
  // "Quando o vídeo começar a ferramenta por si só deve colocar o vídeo em tela cheia e depois que terminar voltar para mostrar os gatilhos que podem ser usados, mas sempre depois de uma pergunta o vídeo deve começar em tela cheia"
  const enterFullscreenAuto = async () => {
    setIsFullscreen(true);
    try {
      if (videoContainerRef.current && !document.fullscreenElement) {
        if (videoContainerRef.current.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen().catch(() => {});
        } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        }
      }
    } catch (err) {
      console.info("Using CSS fixed viewport fullscreen:", err);
    }
  };

  const exitFullscreenAuto = async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen().catch(() => {});
      }
    } catch (err) {
      console.info("Exit full screen note:", err);
    }
  };

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      await enterFullscreenAuto();
    } else {
      await exitFullscreenAuto();
    }
  };

  // Full HD 1080p Canvas Engine:
  // YouTube defaults to 240p when the iframe DOM canvas is rendered at smaller sizes (< 640px).
  // By maintaining an internal 1920x1080 viewport scaled down with CSS transform,
  // YouTube detects a native Full HD 1080p canvas and directly serves the 1080p stream from frame 0.
  const [ytStageScale, setYtStageScale] = useState<number>(1);

  useEffect(() => {
    const updateScale = () => {
      const el = videoContainerRef.current;
      if (!el) return;
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      if (w > 0 && h > 0) {
        const scaleX = w / 1920;
        const scaleY = h / 1080;
        const s = videoFit === "cover" ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
        setYtStageScale(s > 0 ? s : 1);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && videoContainerRef.current) {
      ro = new ResizeObserver(updateScale);
      ro.observe(videoContainerRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateScale);
      if (ro) ro.disconnect();
    };
  }, [videoFit, isFullscreen, hasStarted]);

  // Track triggers that have already been played during this session, removing them from available view ("apagando os que já foram utilizados")
  const [usedTriggerIds, setUsedTriggerIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem("eco_used_trigger_ids");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((id: any) => typeof id === "string");
      }
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    try {
      safeStorage.setItem("eco_used_trigger_ids", JSON.stringify(usedTriggerIds));
    } catch (_) {}
  }, [usedTriggerIds]);

  const restoreUsedTriggers = () => {
    setUsedTriggerIds([]);
    try {
      safeStorage.removeItem("eco_used_trigger_ids");
    } catch (_) {}
    setAiResponseText("Ciclo de gatilhos restaurado. Todos os comandos estão disponíveis novamente.");
  };

  // YouTube IFrame API Player Instance reference for direct JavaScript control
  const ytPlayerInstanceRef = useRef<any>(null);

  // Load official YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Helper to enforce user configured resolution automatically on YouTube player (1080p, 720p, etc.)
  const enforceYtQuality = (qualityOverride?: VideoQualityPreference) => {
    const q = qualityOverride || preferredVideoQualityRef.current || preferredVideoQuality;
    const targetQ = q === "auto" ? "hd1080" : q;

    // 1. Direct YouTube Player API call if instance is mounted
    if (ytPlayerInstanceRef.current) {
      try {
        ytPlayerInstanceRef.current.setPlaybackQuality?.(targetQ);
        ytPlayerInstanceRef.current.setPlaybackQualityRange?.(targetQ, "highres");
        ytPlayerInstanceRef.current.setSuggestedQuality?.(targetQ);
      } catch (_) {}
    }

    // 2. Fallback postMessage commands (both stringified and JSON) with origin handshake
    if (ytIframeRef.current?.contentWindow) {
      try {
        const win = ytIframeRef.current.contentWindow;
        // YouTube API: listening handshake so player broadcasts playback state events
        win.postMessage('{"event":"listening","id":1,"channel":"widget"}', '*');
        
        // Command 1: setPlaybackQuality
        win.postMessage(JSON.stringify({
          event: "command",
          func: "setPlaybackQuality",
          args: [targetQ]
        }), '*');

        // Command 2: setPlaybackQualityRange (forces minimum to 1080p)
        win.postMessage(JSON.stringify({
          event: "command",
          func: "setPlaybackQualityRange",
          args: [targetQ, "highres"]
        }), '*');

        // Command 3: setSuggestedQuality
        win.postMessage(JSON.stringify({
          event: "command",
          func: "setSuggestedQuality",
          args: [targetQ]
        }), '*');
      } catch (_) {}
    }
  };

  const enforceYtMaxQuality = enforceYtQuality;

  // Repeatedly pulse the quality command during video start, playback, and buffering so YouTube locks into 1080p resolution automatically
  const triggerQualityAutoPulse = (qualityOverride?: VideoQualityPreference) => {
    enforceYtQuality(qualityOverride);
    const intervals = [50, 150, 300, 600, 1000, 1800, 2800, 4000];
    intervals.forEach(delay => {
      setTimeout(() => {
        enforceYtQuality(qualityOverride);
      }, delay);
    });
  };

  const trigger1080pAutoPulse = triggerQualityAutoPulse;

  // Attach YouTube Player API instance to the iframe for real-time HD enforcement
  const attachYtPlayer = () => {
    if (typeof window === "undefined") return;
    try {
      const YT = (window as any).YT;
      if (YT && YT.Player && ytIframeRef.current) {
        if (ytPlayerInstanceRef.current && typeof ytPlayerInstanceRef.current.destroy === "function") {
          try { ytPlayerInstanceRef.current.destroy(); } catch (_) {}
        }
        ytPlayerInstanceRef.current = new YT.Player(ytIframeRef.current, {
          events: {
            onReady: (e: any) => {
              e.target.setPlaybackQuality?.("hd1080");
              e.target.setPlaybackQualityRange?.("hd1080", "highres");
              e.target.setSuggestedQuality?.("hd1080");
            },
            onStateChange: (e: any) => {
              // 1 = PLAYING, 3 = BUFFERING
              if (e.data === 1 || e.data === 3) {
                e.target.setPlaybackQuality?.("hd1080");
                e.target.setPlaybackQualityRange?.("hd1080", "highres");
                e.target.setSuggestedQuality?.("hd1080");
              }
              // 0 = ENDED
              if (e.data === 0) {
                handleVideoEnded();
              }
            },
            onPlaybackQualityChange: (e: any) => {
              if (e.data && e.data !== "hd1080" && e.data !== "highres") {
                e.target.setPlaybackQuality?.("hd1080");
              }
            }
          }
        });
      }
    } catch (_) {}
  };

  // Centralized Video Slot Trigger: Starts any video (question or intro) in FULL SCREEN, resets state, and auto-plays
  const triggerVideoSlot = (slotId: string, announceText?: string) => {
    setHasStarted(true);
    setVideoFinished(false);
    setActiveVideoSlot(slotId);
    setYtReloadKey(prev => prev + 1);
    if (announceText) {
      setAiResponseText(announceText);
    }

    // Mark question trigger as used so it is removed from available triggers
    if (slotId !== "intro") {
      setUsedTriggerIds(prev => prev.includes(slotId) ? prev : [...prev, slotId]);
    }

    // Automatically enter full screen whenever video starts or after a question
    enterFullscreenAuto();

    // Automatically enforce 1080p resolution on start
    trigger1080pAutoPulse();

    setTimeout(() => {
      const currentUrl = slotId === "intro" ? introUrl : (questions.find(q => q.id === slotId)?.videoUrl || "");
      if (!isYouTubeUrl(currentUrl) && videoRef.current) {
        videoRef.current.currentTime = 0;
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.catch(err => console.warn("Video auto-play catch:", err));
        }
      }
    }, 70);
  };

  const handleVideoTouch = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      toggleFullscreen();
    }
    lastTapRef.current = now;
  };

  const [hidePanels, setHidePanels] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Background Image State (Amazon Rainforest Wildlife)
  const [showBgImage, setShowBgImage] = useState<boolean>(() => {
    const saved = safeStorage.getItem("eco_show_bg_image");
    return saved !== null ? saved === "true" : true;
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = safeStorage.getItem("eco_bg_opacity");
    return saved !== null ? Number(saved) : 35;
  });

  useEffect(() => {
    safeStorage.setItem("eco_show_bg_image", String(showBgImage));
  }, [showBgImage]);

  useEffect(() => {
    safeStorage.setItem("eco_bg_opacity", String(bgOpacity));
  }, [bgOpacity]);

  // Trepadeiras & Drones de Monitoramento Eco-Design
  const [showVines, setShowVines] = useState<boolean>(() => {
    const saved = safeStorage.getItem("eco_show_vines");
    return saved !== null ? saved === "true" : true;
  });
  const [showDrones, setShowDrones] = useState<boolean>(() => {
    const saved = safeStorage.getItem("eco_show_drones");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    safeStorage.setItem("eco_show_vines", String(showVines));
  }, [showVines]);

  useEffect(() => {
    safeStorage.setItem("eco_show_drones", String(showDrones));
  }, [showDrones]);

  // Web Speech API references
  const recognitionRef = useRef<any>(null);

  // Helper helper to clean and evaluate similarity between recognized text and target phrases
  const getFuzzyMatchScore = (input: string, targetPhrase: string): number => {
    if (!input || !targetPhrase) return 0;
    
    const cleanString = (s: string) => {
      return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9\s]/g, "") // remove punctuation
        .trim();
    };

    const inputClean = cleanString(input);
    const targetClean = cleanString(targetPhrase);

    if (!inputClean || !targetClean) return 0;

    // Exact match
    if (inputClean === targetClean) return 1.0;

    // Substring contains
    if (inputClean.includes(targetClean) || targetClean.includes(inputClean)) {
      return 0.95;
    }

    // Split words to see the intersection of keywords (plurals and verb stems)
    const inputWords = inputClean.split(/\s+/).filter(w => w.length > 1);
    const targetWords = targetClean.split(/\s+/).filter(w => w.length > 2);

    if (targetWords.length === 0) return 0;

    let matchCount = 0;
    for (const tWord of targetWords) {
      const matched = inputWords.some(iWord => {
        if (iWord === tWord) return true;
        // Check partial word prefixes to match e.g. "mostra" and "mostrar", "chuva" and "chuvas", etc.
        const minLen = Math.min(tWord.length, iWord.length);
        if (minLen >= 4) {
          const prefixT = tWord.substring(0, 4);
          const prefixI = iWord.substring(0, 4);
          if (prefixT === prefixI) return true;
        }
        return false;
      });
      if (matched) matchCount++;
    }

    return matchCount / targetWords.length;
  };

  // Sync state metadata to safeStorage
  useEffect(() => {
    if (introUrl && !introUrl.startsWith("blob:")) {
      safeStorage.setItem("eco_intro_url", introUrl);
    }
    safeStorage.setItem("eco_intro_name", introName);
    
    const configToSave = questions.map(q => ({
      id: q.id,
      phrase: q.phrase,
      videoUrl: q.videoUrl && !q.videoUrl.startsWith("blob:") ? q.videoUrl : "",
      videoName: q.videoName
    }));
    safeStorage.setItem("eco_custom_questions", JSON.stringify(configToSave));
  }, [questions, introUrl, introName]);

  // Handle ended event for both YouTube and direct HTML5 videos
  const handleVideoEnded = () => {
    setVideoFinished(true);
    setShowReplayPrompt(true);
    setViewedSlots((prev) => {
      if (prev.includes(activeVideoSlot)) return prev;
      return [...prev, activeVideoSlot];
    });
    // Return / exit full screen when video ends to show available triggers
    exitFullscreenAuto();
  };

  const handleReplayVideo = () => {
    setVideoFinished(false);
    enterFullscreenAuto();
    const currentUrl = getActiveVideoUrl();
    const ytId = getYouTubeVideoId(currentUrl);
    if (ytId) {
      setYtReloadKey(prev => prev + 1);
      trigger1080pAutoPulse();
      if (ytIframeRef.current?.contentWindow) {
        try {
          ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0, true]}', '*');
          ytIframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          enforceYtMaxQuality();
        } catch (_) {}
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.warn("Failed to play: ", err));
      }
    }
  };

  // Listen to YouTube postMessage events for auto-ended state detection and 1080p quality enforcement
  useEffect(() => {
    const handleYtMessage = (event: MessageEvent) => {
      try {
        let payload: any = event.data;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (_) {
            return;
          }
        }
        if (payload) {
          // When YouTube player reports ready, listening, or transitions to playing (1) or buffering (3)
          if (
            payload.event === "onReady" ||
            payload.event === "initialDelivery" ||
            payload.event === "listening" ||
            payload.info === 1 ||
            payload.info === 3 ||
            (payload.info && (payload.info.playerState === 1 || payload.info.playerState === 3))
          ) {
            enforceYtMaxQuality();
          }
          // YouTube API onStateChange: 0 is ENDED
          if (payload.event === "onStateChange" && payload.info === 0) {
            handleVideoEnded();
          } else if (payload.info && payload.info.playerState === 0) {
            handleVideoEnded();
          }
        }
      } catch (_) {}
    };

    window.addEventListener("message", handleYtMessage);
    return () => window.removeEventListener("message", handleYtMessage);
  }, [activeVideoSlot]);

  // Sync mute to YouTube iframe via postMessage
  useEffect(() => {
    if (ytIframeRef.current?.contentWindow) {
      try {
        const cmd = videoMuted ? "mute" : "unMute";
        ytIframeRef.current.contentWindow.postMessage(`{"event":"command","func":"${cmd}","args":""}`, '*');
        enforceYtMaxQuality();
      } catch (_) {}
    }
  }, [videoMuted, ytReloadKey]);

  // Keyboard shortcut: Escape key allows concluding/skipping video early (ideal for testing & presentations)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hasStarted && !videoFinished) {
        handleVideoEnded();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasStarted, videoFinished]);

  // Dynamic audio and speech recognition lifecycle is managed on-demand via toggleListening

  // Play and reload helper triggered on video changes
  const activeVideoUrl = (() => {
    if (activeVideoSlot === "intro") {
      return introUrl;
    }
    const match = questions.find(q => q.id === activeVideoSlot);
    if (match) {
      return match.videoUrl;
    }
    return "";
  })();

  useEffect(() => {
    setShowReplayPrompt(false);
    setVideoFinished(false);
    const currentUrl = activeVideoUrl;
    const isYt = isYouTubeUrl(currentUrl);

    if (isYt) {
      setVideoPlayError("");
      setYtReloadKey(prev => prev + 1);
    } else if (videoRef.current) {
      const v = videoRef.current;
      setVideoPlayError("");
      try {
        v.load();
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Automatic play delayed/prevented:", err);
          });
        }
      } catch (err) {
        console.error("Video load error:", err);
      }
    }
  }, [activeVideoSlot, activeVideoUrl]);

  // Handle URL input for any trigger slot (YouTube, direct MP4, etc.)
  const handleUrlChange = (slotId: string, url: string) => {
    const trimmed = url.trim();
    const isYt = isYouTubeUrl(trimmed);
    const ytId = getYouTubeVideoId(trimmed);
    const autoName = isYt ? `YouTube [${ytId}]` : (trimmed ? "Vídeo Web" : "");

    if (slotId === "intro") {
      setIntroUrl(trimmed);
      if (trimmed) {
        setIntroName(autoName || "Apresentação Inicial");
      }
      setActiveVideoSlot("intro");
    } else {
      setQuestions(prev => prev.map(q => {
        if (q.id === slotId) {
          return {
            ...q,
            videoUrl: trimmed,
            videoName: trimmed ? (autoName || q.videoName || "Vídeo Configurado") : ""
          };
        }
        return q;
      }));
      setActiveVideoSlot(slotId);
    }
  };

  // Handle local video files selection
  const handleFileChange = (slotId: string, file: File) => {
    const url = URL.createObjectURL(file);
    if (slotId === "intro") {
      setIntroUrl(url);
      setIntroName(file.name);
      setActiveVideoSlot("intro");
    } else {
      setQuestions(prev => prev.map(q => {
        if (q.id === slotId) {
          return { ...q, videoUrl: url, videoName: file.name };
        }
        return q;
      }));
      setActiveVideoSlot(slotId);
    }
  };

  // Add questions helper with default YouTube video
  const addQuestion = () => {
    const newId = `trigger_${Date.now()}`;
    setQuestions(prev => [
      ...prev,
      {
        id: newId,
        phrase: `nova resposta ${prev.length + 1}`,
        videoUrl: "https://www.youtube.com/watch?v=1La4QzGeaaQ",
        videoName: "Vídeo YouTube"
      }
    ]);
  };

  // Remove question helper
  const removeQuestion = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Gatilho",
      message: "Deseja mesmo excluir este gatilho de ativação por voz? Essa ação não pode ser desfeita.",
      onConfirm: () => {
        setQuestions(prev => prev.filter(q => q.id !== id));
        if (activeVideoSlot === id) {
          setActiveVideoSlot("intro");
        }
      }
    });
  };

  const updateQuestionPhrase = (id: string, phrase: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, phrase };
      }
      return q;
    }));
  };

  const getActiveVideoUrl = () => {
    return activeVideoUrl;
  };

  const getActiveVideoTitle = () => {
    if (activeVideoSlot === "intro") return `APRESENTAÇÃO INICIAL: ${introName || "Vídeo"}`;
    const match = questions.find(q => q.id === activeVideoSlot);
    if (match) {
      return `PROJEÇÃO: ${match.phrase.toUpperCase()} (${match.videoName || "Vídeo"})`;
    }
    return "APRESENTAÇÃO INICIAL";
  };

  const isIntroSpecialVideo = activeVideoSlot === "intro" && (
    introName === "WhatsApp Video 2026-06-12 at 08.35.25.mp4" ||
    introName === "WhatsApp Video 2026-06-12 at 08.35.25" ||
    introName?.includes("WhatsApp Video 2026-06-12 at 08.35.25.mp4") ||
    getActiveVideoTitle() === "APRESENTAÇÃO INICIAL: WhatsApp Video 2026-06-12 at 08.35.25.mp4"
  );

  const playableSlots = [
    ...(introUrl ? ["intro"] : []),
    ...questions.filter(q => q.videoUrl).map(q => q.id)
  ];

  const allVideosPlayed = playableSlots.length > 0 && playableSlots.every(slot => viewedSlots.includes(slot));

  const resetAllTriggers = () => {
    setConfirmModal({
      isOpen: true,
      title: "Redefinir Tudo",
      message: "Deseja restaurar todos os vídeos e frases de ativação para as URLs padrão do YouTube?",
      onConfirm: () => {
        setIntroUrl(DEFAULT_INTRO_URL);
        setIntroName(DEFAULT_INTRO_NAME);
        setQuestions(DEFAULT_QUESTIONS);
        setActiveVideoSlot("intro");
        setLastSpeechDetected("");
        setRealtimeSpeech("");
        safeStorage.removeItem("eco_custom_questions");
        safeStorage.removeItem("eco_intro_url");
        safeStorage.removeItem("eco_intro_name");
        setAiResponseText("Ajustes redefinidos para os vídeos padrão da Assistente Virtual WIT.");
      }
    });
  };

  // Main voice commander parser & matcher to trigger projection shifts
  const handleIncomingCommand = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const lowerText = trimmed.toLowerCase();

    // Hands-free voice commands requested by the user
    if (
      lowerText.includes("rever") || 
      lowerText.includes("reassistir") || 
      lowerText.includes("reproduzir novamente") || 
      lowerText.includes("ver de novo") ||
      lowerText.includes("rever video") ||
      lowerText.includes("rever vídeo")
    ) {
      handleReplayVideo();
      setAiResponseText("Vídeo reiniciado via comando de voz.");
      setIsAnalyzing(false);
      return;
    }

    if (
      lowerText.includes("iniciar do zero") || 
      lowerText.includes("iniciar do xzero") || 
      lowerText.includes("reiniciar") || 
      lowerText.includes("do zero") || 
      lowerText.includes("do xzero") || 
      lowerText.includes("iniciar do o0") || 
      lowerText.includes("do o0") ||
      lowerText.includes("começar do zero")
    ) {
      setViewedSlots([]);
      setUsedTriggerIds([]);
      try { safeStorage.removeItem("eco_used_trigger_ids"); } catch (_) {}
      triggerVideoSlot("intro", "Visita reiniciada do zero. Todos os gatilhos foram reativados.");
      setIsAnalyzing(false);
      return;
    }

    if (
      lowerText.includes("restaurar gatilhos") || 
      lowerText.includes("reiniciar gatilhos") || 
      lowerText.includes("reativar gatilhos") || 
      lowerText.includes("zerar gatilhos") ||
      lowerText.includes("limpar gatilhos")
    ) {
      restoreUsedTriggers();
      setIsAnalyzing(false);
      return;
    }

    setLastSpeechDetected(trimmed);
    setInputText("");
    setIsAnalyzing(true);
    setSpeechError("");

    const activeAvailable = questions.filter(q => !usedTriggerIds.includes(q.id));

    const virtualTriggers: Trigger[] = [
      { id: "intro", phrase: "introdução", videoUrl: introUrl, description: "Introdução ou início" },
      ...(activeAvailable.length > 0 ? activeAvailable : questions).map(q => ({
        id: q.id,
        phrase: q.phrase,
        videoUrl: q.videoUrl,
        description: `Pergunta: ${q.phrase}`
      }))
    ];

    try {
      // Calculate direct alignment scores with our optimized fuzzy word matcher, giving priority to available (unplayed) questions
      const poolToTest = activeAvailable.length > 0 ? activeAvailable : questions;
      const scores = poolToTest.map(q => ({
        id: q.id,
        phrase: q.phrase,
        score: getFuzzyMatchScore(trimmed, q.phrase)
      }));

      // Common phrases for intro/home/reset
      const introPhrases = ["introducao", "introdução", "inicio", "iniciar", "voltar", "comeco", "começo", "começar", "apresentação"];
      const scoreIntro = Math.max(...introPhrases.map(p => getFuzzyMatchScore(trimmed, p)));

      // Find the highest score among questions
      const bestMatch = scores.reduce((best, curr) => curr.score > best.score ? curr : best, { id: "", phrase: "", score: 0 });

      console.log(`[Scores] Best Match: "${bestMatch.phrase}" (${bestMatch.score}) | Intro: ${scoreIntro}`);

      // We privilege clear fuzzy score matches over contacting a server (keeps app instantaneous if confident)
      if (bestMatch.score >= 0.5 && bestMatch.score >= scoreIntro) {
        triggerVideoSlot(bestMatch.id, `[Sintonia] Pergunta correspondida! Transmitindo Vídeo em tela cheia: "${bestMatch.phrase}"`);
        setIsAnalyzing(false);
        return;
      } else if (scoreIntro >= 0.5 && scoreIntro >= bestMatch.score) {
        triggerVideoSlot("intro", "[Sintonia] Voltando à apresentação inicial em tela cheia.");
        setIsAnalyzing(false);
        return;
      }

      // Query server for smart fallback matching if fuzzy metrics are ambiguous
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: trimmed,
          triggers: virtualTriggers
        })
      });

      if (!response.ok) {
        throw new Error("Erro de resposta do servidor de análise.");
      }

      const result = await response.json();
      const matchedId = result.matchedTriggerId;
      
      if (matchedId === "intro") {
        triggerVideoSlot("intro", result.response || "Comando de retorno correspondido. Sintonizando introdução inicial em tela cheia.");
      } else if (matchedId) {
        const matchedQuestion = questions.find(q => q.id === matchedId);
        if (matchedQuestion) {
          triggerVideoSlot(matchedId, result.response || `Entendi! Sintonizando o Vídeo em tela cheia: "${matchedQuestion.phrase}"`);
        } else {
          setAiResponseText(`Comando não identificado. Por favor, fale um comando configurado.`);
        }
      } else {
        const phrasesList = questions.map(q => `"${q.phrase}"`).join(" ou ");
        setAiResponseText(`Comando não identificado. Por favor, fale um comando configurado: ${phrasesList}.`);
      }

    } catch (err) {
      // Local strict offline fallback matcher
      const scores = questions.map(q => ({
        id: q.id,
        phrase: q.phrase,
        score: getFuzzyMatchScore(trimmed, q.phrase)
      }));
      const bestMatch = scores.reduce((best, curr) => curr.score > best.score ? curr : best, { id: "", phrase: "", score: 0 });

      if (bestMatch.score > 0.35) {
        triggerVideoSlot(bestMatch.id, `[Sintonizado] Transmitindo em tela cheia: "${bestMatch.phrase}"`);
      } else {
        const phrasesList = questions.map(q => `"${q.phrase}"`).join(" ou ");
        setAiResponseText(`Não foi possível compreender "${trimmed}". Diga exatamente ${phrasesList}.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Request microphone permission explicitly (triggers browser dialog on mobile iOS/Android)
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError("Navegador não possui suporte para acesso ao microfone.");
        setMicPermission("unsupported");
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      setMicPermission("granted");
      setSpeechError("");
      // Release tracks immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      console.warn("Microphone permission error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        setSpeechError("Microfone bloqueado pelo navegador. Toque em 'Habilitar Microfone' para liberar.");
        setShowMicModal(true);
      } else {
        setSpeechError(`Erro no microfone: ${err.message || err.name}`);
      }
      return false;
    }
  };

  const cleanupAudioRecording = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (_) {}
      audioStreamRef.current = null;
    }
    setAudioLevel(0);
    setIsRecordingMedia(false);
  };

  const stopMediaRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Error stopping MediaRecorder:", err);
        cleanupAudioRecording();
        setIsListening(false);
      }
    } else {
      cleanupAudioRecording();
      setIsListening(false);
    }
  };

  const startMediaRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError("Captura de microfone indisponível neste navegador.");
        return;
      }

      setSpeechError("");
      setRealtimeSpeech("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      audioStreamRef.current = stream;
      setMicPermission("granted");
      setIsListening(true);
      setIsRecordingMedia(true);
      setRecordingDuration(0);

      // Real-time audio analyzer for visual sound feedback on mobile
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.5;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = ctx;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const tickLevel = () => {
            if (!audioStreamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const level = Math.min(100, Math.round((avg / 120) * 100));
            setAudioLevel(level);
            animationFrameRef.current = requestAnimationFrame(tickLevel);
          };
          tickLevel();
        }
      } catch (e) {
        console.warn("Audio meter setup skipped:", e);
      }

      // Check supported MIME type across mobile devices
      const candidateMimes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
        "audio/ogg;codecs=opus"
      ];
      let selectedMime = "";
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
        for (const m of candidateMimes) {
          if (MediaRecorder.isTypeSupported(m)) {
            selectedMime = m;
            break;
          }
        }
      }

      const recorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const recordedMime = recorder.mimeType || selectedMime || "audio/webm";
        const chunks = [...audioChunksRef.current];
        cleanupAudioRecording();
        setIsListening(false);

        if (chunks.length === 0) {
          setSpeechError("Nenhum áudio detectado.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: recordedMime });
        if (audioBlob.size < 400) {
          setSpeechError("Áudio muito curto. Fale um comando como 'mostrar natureza'.");
          return;
        }

        setIsAnalyzing(true);
        setIsTranscribing(true);
        setSpeechError("");

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Data = reader.result as string;
              const res = await fetch("/api/transcribe-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audioData: base64Data,
                  mimeType: recordedMime
                })
              });

              if (!res.ok) {
                throw new Error(`Servidor retornou status ${res.status}`);
              }

              const data = await res.json();
              setIsTranscribing(false);
              setIsAnalyzing(false);

              if (data.transcript && data.transcript.trim()) {
                const text = data.transcript.trim();
                setLastSpeechDetected(text);
                setRealtimeSpeech("");
                handleIncomingCommand(text);
              } else {
                setSpeechError("Nenhuma fala detectada no áudio gravado. Tente falar mais próximo ao celular.");
              }
            } catch (err: any) {
              console.error("Transcribe API error:", err);
              setIsTranscribing(false);
              setIsAnalyzing(false);
              setSpeechError("Não foi possível transcrever o áudio gravado.");
            }
          };
        } catch (err: any) {
          setIsTranscribing(false);
          setIsAnalyzing(false);
          setSpeechError("Erro ao processar áudio.");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);

      // Increment recording duration every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Auto stop after 7 seconds if user doesn't tap again
      autoStopTimeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 7000);

    } catch (err: any) {
      console.warn("MediaRecorder start error:", err);
      cleanupAudioRecording();
      setIsListening(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        setSpeechError("Acesso ao microfone negado no celular.");
        setShowMicModal(true);
      } else {
        setSpeechError(`Erro ao abrir microfone: ${err.message || err.name}`);
      }
    }
  };

  // Native Web Speech API driver with clean per-session instantiation
  const startListeningNative = (SpeechRecognitionClass: any) => {
    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.lang = "pt-BR";
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setIsRecordingMedia(false);
        setSpeechError("");
        setRealtimeSpeech("");
      };

      rec.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript) {
          setRealtimeSpeech(interimTranscript);
        }

        if (finalTranscript) {
          setLastSpeechDetected(finalTranscript);
          setRealtimeSpeech("");
          setIsListening(false);
          handleIncomingCommand(finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        setIsListening(false);
        setRealtimeSpeech("");
        console.warn("Native SpeechRecognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicPermission("denied");
          setSpeechError("Reconhecimento nativo bloqueado. Comutando para gravação de áudio...");
          // Fallback to MediaRecorder on mobile
          startMediaRecording();
        } else if (event.error === "no-speech") {
          setSpeechError("Nenhuma fala detectada. Toque e fale claramente.");
        } else if (event.error === "network") {
          setSpeechError("Rede indisponível no reconhecimento nativo. Comutando para gravação de áudio...");
          startMediaRecording();
        } else {
          setSpeechError(`Aviso do microfone: ${event.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.warn("Native SpeechRecognition start failed, falling back to MediaRecorder:", err);
      startMediaRecording();
    }
  };

  // Unified voice listening toggle
  const toggleListening = async () => {
    if (!hasStarted) {
      setHasStarted(true);
    }

    if (isListening || isRecordingMedia) {
      if (isRecordingMedia) {
        stopMediaRecording();
      } else if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    setSpeechError("");
    setRealtimeSpeech("");

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // On mobile devices (iOS/Android), MediaRecorder + Gemini is the 100% reliable path:
    // It triggers the native browser microphone permission dialog instantly on tap without Web Speech drops or silent crashes.
    if (isMobile || preferredSpeechEngine === "gemini" || !SpeechRecognitionClass) {
      await startMediaRecording();
      return;
    }

    // On desktop, verify microphone permission and start native streaming Web Speech
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setMicPermission("granted");
      }
      startListeningNative(SpeechRecognitionClass);
    } catch (err: any) {
      console.warn("Web Speech pre-check error, falling back to MediaRecorder:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMicPermission("denied");
        setSpeechError("Permissão de microfone negada. Toque no cadeado do navegador para permitir o microfone.");
        setShowMicModal(true);
      } else {
        await startMediaRecording();
      }
    }
  };

  return (
    <div id="wit-root" className="min-h-screen bg-[#05110a] text-stone-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white relative overflow-x-hidden pantanal-water-mesh">
      
      {/* Toast de Confirmação de Salvamento */}
      {saveToast && saveToast.visible && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none animate-fade-in">
          <div className="bg-[#0c2438] text-blue-200 font-mono font-black text-xs px-5 py-2.5 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] border-2 border-blue-500/80 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{saveToast.message}</span>
          </div>
        </div>
      )}

      {/* Background Image: Santuário e Fauna do Pantanal (Semi-transparente) */}
      {showBgImage && (
        <div 
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-500" 
          aria-hidden="true"
          style={{ opacity: bgOpacity / 100 }}
        >
          <img
            src="/assets/images/pantanal_wildlife.jpg"
            alt="Santuário Pantanal - Fauna e Águas Alagadas"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center scale-[1.02] filter contrast-105 brightness-95 saturate-110"
          />
          {/* Subtle wetland gradient vignette to preserve contrast and HUD readability */}
          <div className="absolute inset-0 bg-radial from-[#05140c]/30 via-[#030d07]/75 to-[#020804] pointer-events-none" />
        </div>
      )}

      {/* Ambient background overlay */}

      {/* Waveform keyframe for active recording state */}
      <style>{`
        @keyframes customGrow {
          0%, 100% { height: 6px; }
          50% { height: 24px; }
        }
        .v-wave-1 { animation: customGrow 0.5s infinite ease-in-out; }
        .v-wave-2 { animation: customGrow 0.7s infinite ease-in-out 0.12s; }
        .v-wave-3 { animation: customGrow 0.4s infinite ease-in-out 0.24s; }
        .v-wave-4 { animation: customGrow 0.6s infinite ease-in-out 0.36s; }
        .text-glow-blue {
          text-shadow: 0 0 12px rgba(59, 130, 246, 0.45);
        }
        .text-glow-emerald {
          text-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
        }
      `}</style>

      {/* Top Application Bar (Ocultado durante o vídeo para visualização limpa) */}
      {!hidePanels && !isFullscreen && (!hasStarted || videoFinished) && (
        <header id="wit-nav" className="bg-[#06170f]/95 backdrop-blur-md border-b border-emerald-950/80 py-3.5 px-3 sm:px-6 sticky top-0 z-20 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
            
            {/* Left side: Brand title and status */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 select-none shrink-0">
              {/* WIT Brand Logo (Pantanal Blue Badge) */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-md shadow-sm tracking-widest border border-blue-400">
                WIT
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-base sm:text-xl tracking-wider text-blue-50 uppercase leading-none whitespace-nowrap">
                  ASSISTENTE VIRTUAL • PANTANAL
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-400/90 uppercase tracking-widest leading-none whitespace-nowrap">
                    Pantanal Live • 1080p HD
                  </span>
                  {showBgImage && (
                    <span className="hidden sm:inline text-[8px] font-mono font-bold bg-[#0d2a1c] text-emerald-300 border border-emerald-800/80 px-1.5 py-0.2 rounded-full whitespace-nowrap leading-none">
                      Fundo {bgOpacity}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action buttons: Fundo, Salvar Dados, Voz, Ajustes */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
              
              {/* Quick Background Toggle */}
              <button
                type="button"
                onClick={() => setShowBgImage(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all duration-200 border cursor-pointer whitespace-nowrap leading-none shrink-0 ${
                  showBgImage 
                    ? "border-emerald-700 bg-[#0d2c1d] text-emerald-200 hover:bg-[#133e29]" 
                    : "border-emerald-950 bg-[#071810] text-emerald-400/70 hover:text-emerald-200"
                }`}
                title={showBgImage ? "Ocultar imagem de fundo" : "Ativar imagem de fundo"}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                <span className="hidden md:inline whitespace-nowrap">{showBgImage ? `Fundo ${bgOpacity}%` : "Fundo OFF"}</span>
              </button>

              {/* Salvar Todos os Dados do App */}
              <button
                type="button"
                onClick={handleSaveAllData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 border border-blue-500/60 bg-[#0c1e30] text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-400 cursor-pointer whitespace-nowrap leading-none shrink-0 shadow-sm"
                title="Salvar todos os dados do app agora"
              >
                <Save className="w-3.5 h-3.5 shrink-0 text-blue-300" />
                <span className="hidden sm:inline whitespace-nowrap">Salvar Dados</span>
              </button>

              {activeTab === "chat" && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 border-2 cursor-pointer whitespace-nowrap leading-none shrink-0 ${
                    isListening || isRecordingMedia
                      ? "bg-red-600 text-white border-blue-300 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                      : "bg-[#0d2b1c] text-emerald-100 border-emerald-700/80 hover:bg-emerald-500 hover:text-stone-950 hover:border-emerald-400"
                  }`}
                  title={isListening || isRecordingMedia ? "Desativar microfone" : "Ativar microfone por voz"}
                >
                  {isListening || isRecordingMedia ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{isRecordingMedia ? `Ouvindo (${recordingDuration}s)` : "Ouvindo..."}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                      <span className="whitespace-nowrap">Falar</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "chat" ? "settings" : "chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all duration-200 border border-emerald-900 bg-[#071810] text-emerald-300 hover:text-blue-300 hover:border-blue-700 cursor-pointer whitespace-nowrap leading-none shrink-0 ${
                  activeTab === "settings" ? "text-blue-300 border-blue-400 bg-[#0d2238]" : ""
                }`}
                title={activeTab === "chat" ? "Ir para Configurações" : "Ir para o Player"}
              >
                {activeTab === "chat" ? (
                  <>
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">Ajustes</span>
                  </>
                ) : (
                  <>
                    <Tv className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">Player</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </header>
      )}

      {/* Main Area */}
      <main className={`flex-1 w-full max-w-7xl mx-auto ${isFullscreen || (hasStarted && !videoFinished) ? "p-0 sm:p-2 max-w-none" : "px-2 sm:px-6 py-3 sm:py-8"} flex flex-col justify-start transition-all duration-300 relative z-10`}>
        
        {/* VIEW 1: CHAT & PROJECTION (Simplified, dedicated single panel for interaction) */}
        {activeTab === "chat" && (
          <div className="space-y-6 animate-fade-in max-w-7xl mx-auto w-full transition-all duration-300">
            
            <div className={`max-w-5xl mx-auto w-full flex flex-col ${hasStarted && !videoFinished ? "gap-0" : "gap-8"}`}>
              
              {/* Centered Video Stream Box Container */}
              <div className={`w-full relative ${isFullscreen ? "pt-0" : (hasStarted && !videoFinished) ? "pt-0" : "pt-1 sm:pt-4 md:pt-6"}`}>
                
                {/* Main Video Box: 16:9 aspect-video for edge-to-edge fitted display without letterboxing */}
                <div 
                  ref={videoContainerRef}
                  onTouchEnd={handleVideoTouch}
                  className={
                    isFullscreen
                      ? "fixed inset-0 z-50 w-screen h-[100dvh] bg-black m-0 p-0 overflow-hidden flex flex-col justify-center items-center"
                      : (hasStarted && !videoFinished)
                      ? "bg-black border-2 sm:border-3 border-emerald-950 rounded-2xl sm:rounded-3xl relative w-full h-[84vh] sm:h-[88vh] flex flex-col justify-center items-center group shadow-[4px_4px_0px_0px_rgba(4,16,10,1)] sm:shadow-[6px_6px_0px_0px_rgba(4,16,10,1)] transition-all duration-300"
                      : "bg-[#030d07] border-2 sm:border-3 border-emerald-950 rounded-2xl sm:rounded-3xl relative w-full aspect-video max-h-[75vh] sm:max-h-[580px] min-h-[250px] sm:min-h-[360px] flex flex-col justify-center items-center group shadow-[4px_4px_0px_0px_rgba(4,16,10,1)] sm:shadow-[6px_6px_0px_0px_rgba(4,16,10,1)] transition-all duration-300"
                  }
                >
                  {/* Inner overflow-hidden container to round off borders correctly */}
                  <div className={`absolute inset-0 ${isFullscreen ? "rounded-none" : "rounded-[14px] sm:rounded-[22px]"} overflow-hidden flex flex-col justify-center items-center`}>
                    
                    {/* Floating Layout Toggles Overlay (Ocultado enquanto o vídeo toca, retorna ao terminar) */}
                    {(!hasStarted || videoFinished) && (
                      <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 bg-[#06170f]/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-emerald-900/80 shadow-xl max-w-[calc(100%-1.25rem)] overflow-x-auto no-scrollbar">
                        {/* Fullscreen Button */}
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className={`bg-[#0a2316]/95 hover:bg-blue-600 hover:text-white hover:border-blue-400 border border-emerald-800/80 text-emerald-100 text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap leading-none shrink-0 ${
                            isFullscreen ? "bg-blue-600 text-white border-blue-400 font-extrabold" : ""
                          }`}
                          title={isFullscreen ? "Sair da Tela Inteira" : "Encaixar em Tela Inteira (Preencher Celular)"}
                        >
                          {isFullscreen ? <Minimize className="w-3.5 h-3.5 shrink-0" /> : <Maximize className="w-3.5 h-3.5 shrink-0" />}
                          <span className="hidden sm:inline whitespace-nowrap leading-none">{isFullscreen ? "Sair" : "Tela Cheia"}</span>
                        </button>

                        {/* Video Fit Button */}
                        <button
                          type="button"
                          onClick={() => setVideoFit(prev => prev === "contain" ? "cover" : "contain")}
                          className={`bg-[#0a2316]/95 hover:bg-blue-600 hover:text-white hover:border-blue-400 border border-emerald-800/80 text-emerald-100 text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap leading-none shrink-0 ${
                            videoFit === "cover" ? "border-blue-500 bg-[#0c2b42] text-blue-200" : ""
                          }`}
                          title={videoFit === "contain" ? "Preencher Tela Inteira (Ajuste Total)" : "Enquadramento Original Proporcional"}
                        >
                          <Tv className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden md:inline whitespace-nowrap leading-none">{videoFit === "cover" ? "Preenchido" : "Ajustado"}</span>
                        </button>

                        {/* Video Quality Quick Toggle / Indicator: 1080p */}
                        <button
                          type="button"
                          onClick={() => {
                            const cycle: VideoQualityPreference[] = ["hd1080", "hd720", "large", "medium", "auto"];
                            const nextIdx = (cycle.indexOf(preferredVideoQuality) + 1) % cycle.length;
                            const nextQuality = cycle[nextIdx];
                            setPreferredVideoQuality(nextQuality);
                            triggerQualityAutoPulse(nextQuality);
                            setYtReloadKey(prev => prev + 1);
                          }}
                          className="bg-[#0a2316]/95 hover:bg-blue-600 hover:text-white hover:border-blue-400 border border-emerald-800/80 text-emerald-100 text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap leading-none shrink-0"
                          title={`Qualidade Inicial Atual: ${
                            preferredVideoQuality === "hd1080" ? "1080p (Full HD)" :
                            preferredVideoQuality === "hd720" ? "720p (HD)" :
                            preferredVideoQuality === "large" ? "480p (SD)" :
                            preferredVideoQuality === "medium" ? "360p" : "Automático"
                          }. Clique para alternar resolução.`}
                        >
                          <Sliders className="w-3 h-3 shrink-0 text-blue-400" />
                          <span className="whitespace-nowrap leading-none font-bold">
                            {preferredVideoQuality === "hd1080" ? "1080p FHD" :
                             preferredVideoQuality === "hd720" ? "720p HD" :
                             preferredVideoQuality === "large" ? "480p" :
                             preferredVideoQuality === "medium" ? "360p" : "Auto"}
                          </span>
                        </button>

                        {/* Audio Button */}
                        <button
                          type="button"
                          onClick={() => setVideoMuted(prev => !prev)}
                          className="bg-[#0a2316]/95 hover:bg-blue-600 hover:text-white hover:border-blue-400 border border-emerald-800/80 text-emerald-100 text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap leading-none shrink-0"
                          title={videoMuted ? "Ativar Áudio" : "Silenciar Áudio"}
                        >
                          {videoMuted ? <VolumeX className="w-3.5 h-3.5 shrink-0 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 shrink-0 text-blue-400" />}
                        </button>

                        {!isFullscreen && (
                          <button
                            type="button"
                            onClick={() => setHidePanels(prev => !prev)}
                            className={`bg-[#0a2316]/95 hover:bg-blue-600 hover:text-white hover:border-blue-400 border border-emerald-800/80 text-emerald-100 text-[9px] font-mono font-bold uppercase px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap leading-none shrink-0 ${hidePanels ? "bg-blue-600 text-white border-blue-400" : ""}`}
                            title={hidePanels ? "Mostrar Painel, Chat e Opções de Controle" : "Ocultar Informações para Focar no Vídeo"}
                          >
                            {hidePanels ? <Eye className="w-3 h-3 shrink-0" /> : <EyeOff className="w-3 h-3 shrink-0" />}
                            <span className="hidden lg:inline whitespace-nowrap leading-none">{hidePanels ? "Ver Painel" : "Ocultar"}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Top Left Status Badge in Fullscreen */}
                    {isFullscreen && videoFinished && (
                      <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-2 bg-[#06170f]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-900 text-[10px] font-mono text-emerald-200 shadow-md whitespace-nowrap leading-none">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="font-bold text-blue-300 uppercase whitespace-nowrap leading-none">{activeVideoSlot === "intro" ? "Apresentação (Intro)" : `Canal ${questions.findIndex(q => q.id === activeVideoSlot) + 1}`}</span>
                        <span className="text-[8px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded font-extrabold uppercase whitespace-nowrap leading-none">
                          1080p FHD
                        </span>
                        {isMobile && (
                          <span className="text-[8px] bg-[#0c2b1d] text-emerald-300 px-1.5 py-0.5 rounded font-extrabold uppercase whitespace-nowrap leading-none">
                            Mobile
                          </span>
                        )}
                      </div>
                    )}

                    {!hasStarted ? (
                      <div className="absolute inset-0 bg-[#05140c]/98 flex flex-col items-center justify-center p-6 sm:p-8 text-center z-40 animate-fade-in text-stone-200">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15)_0%,rgba(16,185,129,0.06)_45%,transparent_75%)] opacity-90 pointer-events-none" />
                        
                        <div className="relative mb-6">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#092417] border-2 border-blue-400 flex items-center justify-center text-blue-300 shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse">
                            <Sparkles className="w-9 h-9 sm:w-11 sm:h-11 text-blue-400" />
                          </div>
                        </div>

                        <div className="space-y-3 max-w-md">
                          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-500/40 text-blue-300 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            Assistente Virtual WIT • Pantanal
                          </div>
                          <h4 className="font-display font-black text-xl sm:text-2xl text-blue-50 uppercase tracking-wider leading-tight">
                            Apresentação Interativa
                          </h4>
                          <p className="text-xs sm:text-sm text-emerald-100/80 font-mono leading-relaxed">
                            {introName ? `Vídeo de Abertura: "${introName}"` : `Vídeo em resolução configurada (${preferredVideoQuality === "hd1080" ? "1080p Full HD" : preferredVideoQuality === "hd720" ? "720p HD" : preferredVideoQuality === "large" ? "480p SD" : preferredVideoQuality === "medium" ? "360p" : "Automática"}) com reconhecimento de voz.`}
                          </p>
                          <p className="text-[11px] text-emerald-400/70 font-mono">
                            Toque no botão abaixo para iniciar a exibição com áudio ativo. Ao término de cada vídeo, a tela de perguntas disponíveis subirá automaticamente.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setVideoMuted(false);
                            triggerVideoSlot("intro");
                            triggerQualityAutoPulse("hd1080");
                          }}
                          className="mt-6 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-display font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-3 border-blue-400 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] active:translate-y-[2px] transition-all cursor-pointer flex items-center gap-3 group whitespace-nowrap leading-none shrink-0"
                        >
                          <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform shrink-0" />
                          <span className="whitespace-nowrap leading-none">Iniciar Apresentação</span>
                        </button>
                      </div>
                    ) : getActiveVideoUrl() ? (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        {isYouTubeUrl(getActiveVideoUrl()) ? (
                          <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                            {/* 1920x1080 Full HD Virtual Canvas: Forces YouTube player to recognize a 1080p viewport and start at 1080p */}
                            <div 
                              style={{
                                width: "1920px",
                                height: "1080px",
                                transform: `scale(${ytStageScale})`,
                                transformOrigin: "center center",
                                flexShrink: 0
                              }}
                              className={`relative flex items-center justify-center ${videoFinished ? "blur-[2.5px]" : ""} transition-all duration-300`}
                            >
                              <iframe
                                ref={ytIframeRef}
                                id="wit-yt-iframe"
                                width="1920"
                                height="1080"
                                key={`${activeVideoSlot}-${getYouTubeVideoId(getActiveVideoUrl())}-${ytReloadKey}`}
                                src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(getActiveVideoUrl())}?autoplay=1&mute=${videoMuted ? 1 : 0}&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}&playsinline=1&rel=0&modestbranding=1&controls=1&vq=hd1080&hd=1&suggestedQuality=hd1080&fmt=22&highres=1`}
                                title={getActiveVideoTitle()}
                                onLoad={() => {
                                  triggerQualityAutoPulse("hd1080");
                                  attachYtPlayer();
                                }}
                                className="w-[1920px] h-[1080px] border-0 select-none pointer-events-auto"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                style={{
                                  imageRendering: "-webkit-optimize-contrast"
                                }}
                              />
                            </div>

                            {/* Extensão 1080p Only Lock Badge & Status (Ocultado durante a reprodução) */}
                            {force1080pOnly && isYouTubeUrl(getActiveVideoUrl()) && (!hasStarted || videoFinished) && (
                              <div className="absolute top-2.5 left-2.5 z-30 hidden sm:flex items-center gap-2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-600 shadow-[0_0_15px_rgba(255, 255, 255, 0.15)] select-none">
                                <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                                <span className="text-[10px] font-mono font-black text-white uppercase whitespace-nowrap leading-none">
                                   Extensão 1080p Ativa
                                </span>
                                <span className="text-[8px] bg-white text-black px-1.5 py-0.5 rounded font-black uppercase whitespace-nowrap leading-none flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 stroke-[3]" />
                                  <span>Travado em 1080</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    triggerQualityAutoPulse("hd1080");
                                    setAiResponseText("Extensão: Resolução 1080p Full HD re-forçada com sucesso no reprodutor.");
                                  }}
                                  className="text-zinc-400 hover:text-white p-0.5 cursor-pointer ml-0.5"
                                  title="Reaplicar comando de 1080p da extensão"
                                >
                                  <RefreshCw className="w-2.5 h-2.5 hover:rotate-180 transition-transform text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <video
                            key={activeVideoSlot}
                            ref={videoRef}
                            src={getActiveVideoUrl()}
                            className={`w-full h-full ${videoFit === "contain" ? "object-contain" : "object-cover"} ${videoFinished ? "blur-[2.5px]" : ""} transition-all duration-500`}
                            autoPlay
                            muted={videoMuted}
                            playsInline
                            webkit-playsinline="true"
                            onEnded={handleVideoEnded}
                            onError={() => {
                              setVideoPlayError("Não foi possível reproduzir este vídeo.");
                            }}
                          />
                        )}

                        {/* END OF VIDEO: TELA QUE SOBE COM OS GATILHOS DISPONÍVEIS */}
                        {videoFinished && (() => {
                          const availableQuestions = questions.filter(q => !usedTriggerIds.includes(q.id));
                          return (
                            <div className="absolute inset-0 bg-[#030d07]/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-2 sm:p-6 z-40 select-none overflow-hidden animate-fade-in">
                              
                              {/* Slide-Up Sheet Container */}
                              <div className="w-full max-w-2xl bg-[#06180f]/95 border-t-4 sm:border-2 border-blue-500/80 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_-12px_45px_rgba(59,130,246,0.2)] sm:shadow-[0_0_50px_rgba(4,16,10,0.95)] animate-slide-up flex flex-col max-h-[88vh] overflow-y-auto">
                                
                                {/* Top drag handle / indicator */}
                                <div className="w-12 h-1.5 rounded-full bg-emerald-800/80 mx-auto mb-3 sm:hidden" />

                                {/* Header with Badge & Clear User Instruction */}
                                <div className="flex flex-col items-center justify-center text-center gap-2 mb-4">
                                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3.5 py-1.5 rounded-full font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap leading-none shrink-0 border border-blue-400">
                                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                    <span className="whitespace-nowrap leading-none">
                                      {availableQuestions.length > 0 
                                        ? `Vídeo Concluído • ${availableQuestions.length} Pergunta${availableQuestions.length > 1 ? "s" : ""} do Pantanal`
                                        : "Vídeo Concluído • Todas as Perguntas Foram Assistidas"}
                                    </span>
                                  </div>

                                  <h3 className="font-display font-black text-sm sm:text-base md:text-lg uppercase tracking-wider text-blue-50 leading-snug">
                                    O que você gostaria de explorar no Pantanal?
                                  </h3>
                                  
                                  <p className="text-[11px] sm:text-xs font-mono text-emerald-200/80 max-w-lg leading-relaxed">
                                    {availableQuestions.length > 0
                                      ? "Diga uma das frases abaixo no microfone ou clique diretamente no gatilho para assistir em tela cheia:"
                                      : "Você já explorou todas as perguntas configuradas desta sessão."}
                                  </p>
                                </div>

                                {/* Voice button inside the slide-up screen for immediate speaking */}
                                {availableQuestions.length > 0 && (
                                  <div className="mb-3.5 flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={toggleListening}
                                      className={`px-4 py-2 rounded-xl border-2 font-mono text-xs font-black uppercase flex items-center gap-2 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(30,58,138,1)] whitespace-nowrap leading-none shrink-0 ${
                                        isListening
                                          ? "bg-red-600 text-white border-blue-300 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]"
                                          : isAnalyzing
                                          ? "bg-blue-500 text-white border-blue-400 animate-bounce"
                                          : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 border-blue-400"
                                      }`}
                                    >
                                      <Mic className="w-4 h-4 shrink-0" />
                                      <span className="whitespace-nowrap leading-none">
                                        {isListening 
                                          ? "Ouvindo... Fale a pergunta agora" 
                                          : isAnalyzing 
                                          ? "Processando fala..." 
                                          : "Falar Frase no Microfone"}
                                      </span>
                                    </button>
                                  </div>
                                )}

                                {/* Perguntas Sugeridas Chips within Slide-Up Sheet (Request #7) */}
                                {suggestedQuestions.length > 0 && (
                                  <div className="mb-3.5 p-2.5 bg-[#04120b]/80 rounded-2xl border border-emerald-900/80 flex flex-col gap-1.5 text-left">
                                    <span className="text-[9px] font-mono font-bold uppercase text-blue-300 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-blue-400" />
                                      Perguntas Sugeridas:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                                      {suggestedQuestions.map((sug, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => handleIncomingCommand(sug)}
                                          className="px-2.5 py-1 bg-[#0a2618] hover:bg-blue-600 hover:text-white border border-emerald-800 hover:border-blue-400 text-emerald-100 text-[10px] font-mono font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
                                        >
                                          "{sug}"
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Available triggers list (used triggers already removed) */}
                                {availableQuestions.length > 0 ? (
                                  <div className="flex flex-col gap-2.5 w-full max-h-[250px] sm:max-h-[280px] overflow-y-auto pr-1">
                                    {availableQuestions.map((q) => (
                                      <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => {
                                          triggerVideoSlot(q.id);
                                        }}
                                        disabled={!q.videoUrl}
                                        className="w-full relative bg-[#082014]/90 hover:bg-[#0c2e1d] border-2 border-emerald-900/80 hover:border-blue-400/80 px-4 py-3 rounded-2xl text-left transition-all duration-200 cursor-pointer outline-none focus:outline-none flex items-center justify-between gap-3 select-none shadow-[3px_3px_0px_0px_rgba(2,10,6,1)] hover:scale-[1.01] active:scale-[0.99] group min-w-0"
                                      >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                          <div className="w-9 h-9 rounded-xl bg-[#04120a] border border-emerald-800/80 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-400 shrink-0 transition-colors shadow-sm">
                                            <Mic className="w-4 h-4 shrink-0" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="font-display font-black text-xs sm:text-sm text-blue-100 uppercase tracking-wider truncate leading-snug">
                                              🌿 "{q.phrase}"
                                            </div>
                                            <div className="text-[10px] font-mono text-emerald-300/70 truncate mt-0.5 leading-normal">
                                              {q.videoName || "Vídeo Pantanal 1080p HD"}
                                            </div>
                                          </div>
                                        </div>

                                        <span className="shrink-0 text-[10px] font-mono font-black uppercase px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-blue-400 flex items-center gap-1.5 group-hover:bg-blue-400 transition-colors whitespace-nowrap leading-none shadow-sm">
                                          <Play className="w-3 h-3 fill-white shrink-0" />
                                          <span className="whitespace-nowrap leading-none">Assistir</span>
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center p-6 bg-[#082014]/90 border-2 border-emerald-800 rounded-2xl text-center shadow-lg my-2">
                                    <CheckCircle2 className="w-12 h-12 text-blue-400 mb-2" />
                                    <h4 className="font-display font-black text-sm sm:text-base uppercase tracking-wider text-blue-100">
                                      Todos os Gatilhos Foram Executados!
                                    </h4>
                                    <p className="text-[11px] font-mono text-emerald-300/80 mt-1 mb-4 leading-relaxed max-w-sm">
                                      Você já assistiu a todas as perguntas disponíveis desta sessão do Pantanal. Clique abaixo para reiniciar o ciclo e usá-las novamente:
                                    </p>
                                    <button
                                      type="button"
                                      onClick={restoreUsedTriggers}
                                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl border-2 border-blue-400 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] hover:bg-blue-400 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap leading-none shrink-0"
                                    >
                                      <RefreshCw className="w-4 h-4 shrink-0" />
                                      <span className="whitespace-nowrap leading-none">Reiniciar Ciclo de Perguntas</span>
                                    </button>
                                  </div>
                                )}

                                {/* Bottom action buttons */}
                                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-4 pt-3 border-t border-emerald-950 w-full">
                                  <button
                                    type="button"
                                    onClick={handleReplayVideo}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[#092215] border-2 border-emerald-950 hover:border-emerald-700 text-emerald-100 font-mono text-[10px] font-bold uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(2,10,6,1)] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap leading-none shrink-0"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="whitespace-nowrap leading-none">Rever Vídeo</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => triggerVideoSlot("intro")}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[#092215] border-2 border-emerald-950 hover:border-blue-400 text-blue-200 font-mono text-[10px] font-bold uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(2,10,6,1)] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap leading-none shrink-0"
                                  >
                                    <Play className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                    <span className="whitespace-nowrap leading-none">Apresentação</span>
                                  </button>

                                  {usedTriggerIds.length > 0 && availableQuestions.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={restoreUsedTriggers}
                                      className="flex items-center gap-1.5 px-3 py-2 bg-[#0a2718] hover:bg-[#103823] border-2 border-emerald-800 text-emerald-200 font-mono text-[10px] font-bold uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(2,10,6,1)] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap leading-none shrink-0"
                                      title="Restaurar gatilhos que já foram executados"
                                    >
                                      <RefreshCw className="w-3 h-3 shrink-0" />
                                      <span className="whitespace-nowrap leading-none">Restaurar ({usedTriggerIds.length})</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewedSlots([]);
                                      setUsedTriggerIds([]);
                                      try { safeStorage.removeItem("eco_used_trigger_ids"); } catch (_) {}
                                      triggerVideoSlot("intro");
                                    }}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-2 border-blue-400 font-mono text-[10px] font-black uppercase rounded-xl shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap leading-none shrink-0"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                                    <span className="whitespace-nowrap leading-none">Reiniciar do Início</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Video Controls bar inside iframe overlay */}
                        {!isIntroSpecialVideo && (
                          <div className="absolute bottom-3 left-3 z-10 bg-black/85 border border-zinc-700 text-white text-[10px] font-mono px-2.5 py-1 rounded flex items-center gap-2 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="font-extrabold text-white">1080p HD AUTOMÁTICO</span>
                            <span className="text-zinc-600">|</span>
                            <span className="text-zinc-300 font-mono text-[9px]">{isYouTubeUrl(getActiveVideoUrl()) ? "Qualidade 1080p Ativa" : "Mídia 1080p"}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center max-w-sm flex flex-col items-center gap-4 bg-white/5 backdrop-blur-md text-zinc-300">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center shadow-[0_0_15px_rgba(255, 255, 255, 0.15)] animate-pulse">
                          <Video className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-sm text-white uppercase tracking-wider">Nenhum Vídeo Carregado nesta Rota</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Vá no menu de <span className="text-white font-bold cursor-pointer underline" onClick={() => setActiveTab("settings")}>Configurações</span> para inserir o link do YouTube ou carregar arquivos.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Sub-system Alerts inside screen */}
                    {videoPlayError && (
                      <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-5 text-center z-10 border-2 border-red-500">
                        <AlertTriangle className="w-8 h-8 text-red-500 mb-1" />
                        <span className="text-[10px] font-mono font-bold text-red-600 block">FALHA DE CARREGAMENTO</span>
                        <p className="text-[11px] text-zinc-600 max-w-xs mt-1 leading-normal font-sans">
                          {videoPlayError}
                        </p>
                        <button
                          onClick={() => setVideoPlayError("")}
                          className="mt-3 px-3 py-1 bg-black text-white hover:bg-zinc-800 text-[10px] font-mono font-bold rounded-lg transition-all border border-black cursor-pointer"
                        >
                          IGNORAR
                        </button>
                      </div>
                    )}
                    
                    {/* Quality & Resolution Indicator on Bottom Left (Ocultado durante o vídeo) */}
                    {(!hasStarted || videoFinished) && (
                      <div className="absolute bottom-3 left-3 z-10 hidden xs:flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700 text-[9px] font-mono shadow-sm pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-white font-extrabold uppercase">1080p HD AUTO</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-300 font-bold uppercase truncate max-w-[130px] sm:max-w-[200px]">
                          {isYouTubeUrl(getActiveVideoUrl()) ? "Ajuste 1080p Automático" : getActiveVideoTitle()}
                        </span>
                      </div>
                    )}

                    {/* Active Route Slot Indicators on the bottom right corner (Ocultado durante o vídeo) */}
                    {(!hasStarted || videoFinished) && (
                      <div className="absolute bottom-3 right-3 z-10 flex flex-wrap gap-1 bg-zinc-950/90 backdrop-blur-md p-1 rounded-lg border border-zinc-800 text-[10px] font-mono shadow-sm max-w-[180px]">
                        <button
                          onClick={() => triggerVideoSlot("intro")}
                          disabled={!introUrl}
                          className={`px-2 py-0.5 rounded font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${activeVideoSlot === "intro" ? "bg-white text-black border border-black" : "text-zinc-400 hover:text-white"}`}
                          title="Ir para o vídeo inicial em tela cheia"
                        >
                          Intro
                        </button>
                        {questions.map((q, idx) => {
                          const isUsed = usedTriggerIds.includes(q.id);
                          return (
                            <button
                              key={q.id}
                              onClick={() => triggerVideoSlot(q.id)}
                              disabled={!q.videoUrl}
                              className={`px-2 py-0.5 rounded font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                activeVideoSlot === q.id 
                                  ? "bg-white text-black border border-black" 
                                  : isUsed
                                  ? "text-zinc-600 line-through hover:text-zinc-400"
                                  : "text-zinc-400 hover:text-white"
                              }`}
                              title={isUsed ? `Canal ${idx + 1} (Já utilizado nesta sessão)` : `Canal da Pergunta ${idx + 1} em tela cheia`}
                            >
                              Q{idx + 1}{isUsed ? "✓" : ""}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Floating Voice & Quick Control Dock when in Fullscreen (Apenas ao terminar o vídeo) */}
                    {isFullscreen && videoFinished && (
                      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800 shadow-[0_4px_30px_rgba(0,0,0,0.9)] max-w-[95vw]">
                        <button
                          onClick={toggleListening}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[10px] font-black uppercase border transition-all cursor-pointer ${
                            isListening
                              ? "bg-red-500 text-white border-white shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse"
                              : "bg-white text-black border-black hover:bg-white active:scale-95"
                          }`}
                        >
                          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          <span>{isListening ? "Ouvindo..." : "Falar"}</span>
                        </button>
                        
                        <div className="h-4 w-px bg-zinc-800" />

                        <button
                          onClick={handleReplayVideo}
                          className="text-zinc-400 hover:text-white p-1.5 rounded transition-colors"
                          title="Rever Vídeo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setVideoFit(prev => prev === "cover" ? "contain" : "cover")}
                          className="text-zinc-400 hover:text-white text-[9px] font-mono px-2 py-1 rounded border border-zinc-800"
                          title="Alternar Encaixe de Vídeo"
                        >
                          {videoFit === "cover" ? "Preenchido" : "Original"}
                        </button>

                        <div className="h-4 w-px bg-zinc-800" />

                        <button
                          onClick={toggleFullscreen}
                          className="flex items-center gap-1 text-zinc-300 hover:text-white text-[9px] font-mono font-bold bg-zinc-900 px-2 py-1 rounded border border-zinc-800"
                          title="Sair da Tela Inteira"
                        >
                          <Minimize className="w-3 h-3 text-white" />
                          <span>Sair</span>
                        </button>
                      </div>
                    )}

                  </div>

                </div>

                {/* Mobile Quick Bar for Voice, Fullscreen and Fit (Ocultado durante o vídeo) */}
                {isMobile && !isFullscreen && (!hasStarted || videoFinished) && (
                  <div className="mt-2.5 flex flex-col gap-2 bg-[#06170f]/95 backdrop-blur-md border border-emerald-900 rounded-xl p-2.5 text-[10px] font-mono text-emerald-200 shadow-md">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">Modo Mobile: <strong className="text-blue-300">{videoFit === "cover" ? "Preenchendo" : "Ajustado"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setVideoFit(prev => prev === "cover" ? "contain" : "cover")}
                          className="text-emerald-300 hover:text-blue-300 px-2 py-1 rounded border border-emerald-800 hover:border-blue-700 bg-[#0a2316] font-bold active:scale-95 transition-all text-[9px]"
                        >
                          {videoFit === "cover" ? "Ajustar" : "Preencher"}
                        </button>
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="flex items-center gap-1 text-white font-black bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-2.5 py-1 rounded border border-blue-400 cursor-pointer shadow-sm active:scale-95 transition-all text-[9px]"
                        >
                          <Maximize className="w-3 h-3" />
                          <span>Tela Cheia</span>
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Primary Mobile Voice Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`w-full py-2.5 px-3 rounded-lg border-2 font-mono text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 ${
                        isListening || isRecordingMedia
                          ? "bg-red-600 text-white border-blue-300 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                          : "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400 hover:from-blue-500 shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]"
                      }`}
                    >
                      {isListening || isRecordingMedia ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span>Ouvindo no Celular... ({recordingDuration}s) Toque p/ Parar</span>
                        </>
                      ) : isTranscribing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Transcrevendo Fala com IA...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-white" />
                          <span>Toque Aqui para Falar (Microfone)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>

              {/* Gatilhos Disponíveis (Interactive Triggers Panel - Ocultado durante o vídeo, retorna ao terminar) */}
              {(!hasStarted || videoFinished) && (
                <div className={`bg-[#06180f]/90 backdrop-blur-md border-2 sm:border-3 border-emerald-950 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[5px_5px_0px_0px_rgba(4,16,10,1)] flex flex-col gap-4 text-left transition-all duration-300 ${
                  videoFinished ? "ring-2 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)]" : ""
                }`}>
                  {(() => {
                    const availableQuestions = questions.filter(q => !usedTriggerIds.includes(q.id));
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${videoFinished ? "bg-blue-400 animate-ping" : "bg-emerald-400"}`} />
                            <h3 className="font-display font-black text-xs sm:text-sm uppercase tracking-wider text-blue-50">
                              Gatilhos do Pantanal ({availableQuestions.length} de {questions.length})
                            </h3>
                            <span className="text-[9px] font-mono bg-[#092215] text-emerald-300 px-2 py-0.5 rounded font-extrabold border border-emerald-800 uppercase">
                              {videoFinished ? "Aguardando Próximo Gatilho" : "Fale ou Toque a Qualquer Momento"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {usedTriggerIds.length > 0 && (
                              <button
                                type="button"
                                onClick={restoreUsedTriggers}
                                className="text-[10px] font-mono font-bold text-blue-300 hover:underline flex items-center gap-1 cursor-pointer bg-[#0c263d] px-2 py-0.5 rounded border border-blue-800"
                                title="Reativar todos os gatilhos apagados"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Restaurar {usedTriggerIds.length} Usado{usedTriggerIds.length > 1 ? "s" : ""}</span>
                              </button>
                            )}
                            <span className="text-[10px] font-mono text-emerald-400/80">
                              Toque para iniciar em tela cheia
                            </span>
                          </div>
                        </div>

                        {/* Grid of Triggers / Gatilhos (Filtered: apenas os não utilizados) */}
                        {availableQuestions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {availableQuestions.map((q) => {
                              const originalIdx = questions.findIndex(item => item.id === q.id);
                              const isActive = activeVideoSlot === q.id && !videoFinished;
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => triggerVideoSlot(q.id)}
                                  disabled={!q.videoUrl}
                                  className={`group relative flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left min-w-0 ${
                                    isActive
                                      ? "bg-blue-600/20 border-blue-400 text-blue-100 shadow-[3px_3px_0px_0px_rgba(59,130,246,0.3)]"
                                      : videoFinished
                                      ? "bg-[#082014]/90 hover:bg-[#0c2e1d] border-blue-500/70 hover:border-blue-400 text-blue-50 shadow-[3px_3px_0px_0px_rgba(4,16,10,1)] hover:translate-y-[-1px]"
                                      : "bg-[#071b11]/70 hover:bg-[#0a2819] border-emerald-900/80 hover:border-emerald-700 text-emerald-100 shadow-[2px_2px_0px_0px_rgba(2,10,6,1)]"
                                  } disabled:opacity-30 disabled:pointer-events-none active:scale-98`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                      isActive ? "bg-blue-500 text-white border-blue-300" : "bg-[#04120a] text-blue-400 border-emerald-900"
                                    }`}>
                                      <Mic className="w-4 h-4 shrink-0" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[9px] font-mono text-emerald-400/80 font-bold uppercase tracking-wider leading-none mb-1">
                                        Canal {originalIdx + 1}
                                      </div>
                                      <div className="font-display font-black text-xs sm:text-sm text-blue-50 group-hover:text-blue-200 truncate leading-snug">
                                        🌿 "{q.phrase}"
                                      </div>
                                    </div>
                                  </div>

                                  <span className="shrink-0 text-[9px] font-mono font-bold uppercase px-2.5 py-1.5 rounded bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400 text-white flex items-center gap-1 group-hover:bg-blue-400 whitespace-nowrap leading-none shadow-sm">
                                    <Play className="w-2.5 h-2.5 fill-current text-white shrink-0" />
                                    <span className="whitespace-nowrap leading-none">Assistir</span>
                                  </span>
                                </button>
                              );
                            })}

                            {/* Intro restart button in triggers panel */}
                            <button
                              type="button"
                              onClick={() => triggerVideoSlot("intro")}
                              disabled={!introUrl}
                              className="group relative flex items-center justify-between gap-3 p-3.5 rounded-xl border-2 bg-[#071b11]/70 hover:bg-[#0a2819] border-emerald-900/80 hover:border-blue-400/80 text-emerald-100 shadow-[2px_2px_0px_0px_rgba(2,10,6,1)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-98 min-w-0"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-[#04120a] text-blue-400 border-emerald-900 group-hover:text-blue-300">
                                  <RotateCcw className="w-4 h-4 shrink-0" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[9px] font-mono text-emerald-400/80 font-bold uppercase tracking-wider leading-none mb-1">
                                    Apresentação
                                  </div>
                                  <div className="font-display font-black text-xs sm:text-sm text-blue-100 group-hover:text-blue-200 truncate leading-snug">
                                    "Introdução"
                                  </div>
                                </div>
                              </div>
                              <span className="shrink-0 text-[9px] font-mono font-bold uppercase px-2.5 py-1.5 rounded bg-[#092215] border border-emerald-800 text-emerald-300 flex items-center gap-1 group-hover:border-blue-400 group-hover:text-blue-300 whitespace-nowrap leading-none">
                                <Play className="w-2.5 h-2.5 fill-current text-blue-400 shrink-0" />
                                <span className="whitespace-nowrap leading-none">Assistir</span>
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#082014]/60 border border-emerald-900">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
                              <div>
                                <p className="font-bold text-xs uppercase text-blue-100">Todos os gatilhos foram executados nesta sessão</p>
                                <p className="text-[10px] font-mono text-emerald-300/80">Clique ao lado para reiniciar o ciclo e reativar todos os comandos apagados.</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={restoreUsedTriggers}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-mono font-black text-[10px] uppercase rounded-xl border border-blue-400 hover:bg-blue-400 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reiniciar Ciclo</span>
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Seamless Voice Chat & Manual Companion Box (Ocultado durante o vídeo, retorna ao terminar) */}
              {(!hasStarted || videoFinished) && (
                <div className="bg-[#061810]/85 backdrop-blur-md border-3 border-emerald-950 rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(4,16,10,1)] text-left flex flex-col md:flex-row gap-6 items-stretch">
                  
                  {/* Speaking Control Badge */}
                  <div className="bg-[#04120b]/80 border-2 border-emerald-900/70 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-w-[220px] shrink-0">
                    
                    {/* Large Speak Button */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all border-3 cursor-pointer ${
                        isListening || isRecordingMedia
                          ? "bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse border-blue-400"
                          : "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:translate-y-[1px] active:translate-y-[3px]"
                      }`}
                      title={isListening || isRecordingMedia ? "Desativar escuta de voz" : "Ativar microfone para ouvir"}
                    >
                      {isListening || isRecordingMedia ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-white" />}
                    </button>

                    <div className="space-y-1 w-full">
                      {isTranscribing ? (
                        <div className="flex flex-col items-center gap-1.5 py-1">
                          <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                          <span className="text-[10px] font-mono font-bold text-blue-300 uppercase animate-pulse">
                            Transcrevendo áudio...
                          </span>
                        </div>
                      ) : isListening || isRecordingMedia ? (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider block animate-pulse">
                            {isRecordingMedia ? `GRAVANDO VOZ (${recordingDuration}s)` : "ESCUTA ATIVA..."}
                          </span>
                          
                          {/* Interactive dynamic audio lightbars linked to live audioLevel */}
                          <div className="flex items-end justify-center gap-1.5 h-6 pt-1">
                            <div 
                              className="w-1.5 bg-red-400 rounded-full transition-all duration-75"
                              style={{ height: `${Math.max(6, Math.min(24, Math.round(audioLevel * 0.25)))}px` }}
                            />
                            <div 
                              className="w-1.5 bg-blue-400 rounded-full border border-blue-600 transition-all duration-75"
                              style={{ height: `${Math.max(10, Math.min(24, Math.round(audioLevel * 0.4)))}px` }}
                            />
                            <div 
                              className="w-1.5 bg-emerald-400 rounded-full border border-emerald-600 transition-all duration-75"
                              style={{ height: `${Math.max(8, Math.min(24, Math.round(audioLevel * 0.35)))}px` }}
                            />
                            <div 
                              className="w-1.5 bg-blue-400 rounded-full transition-all duration-75"
                              style={{ height: `${Math.max(6, Math.min(24, Math.round(audioLevel * 0.2)))}px` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-emerald-400/80 block">
                            Toque p/ enviar comando
                          </span>
                        </div>
                      ) : isAnalyzing ? (
                        <span className="text-xs font-bold text-blue-300 animate-pulse block">
                          Analisando frequências...
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-200 block">
                            Fale para interagir
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-mono bg-[#092215] border border-emerald-800 px-2 py-1 rounded-md whitespace-nowrap leading-none">
                            <span className={`w-2 h-2 rounded-full border border-black/25 shrink-0 ${micPermission === "granted" ? "bg-emerald-400" : micPermission === "denied" ? "bg-red-500" : "bg-blue-400"}`} />
                            <span className="font-bold text-[9px] text-emerald-300 whitespace-nowrap leading-none">
                              {micPermission === "granted" ? "MICROFONE PRONTO" : micPermission === "denied" ? "MICROFONE BLOQUEADO" : "CLIQUE P/ FALAR"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {speechError && (
                      <div className="w-full p-2.5 bg-red-950/70 border border-red-800/80 rounded-xl text-[10px] text-red-200 font-mono space-y-1.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-red-300 font-bold whitespace-nowrap leading-none">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="whitespace-nowrap leading-none">Aviso de Microfone</span>
                        </div>
                        <p className="leading-tight text-[9px]">{speechError}</p>
                        <button
                          type="button"
                          onClick={requestMicrophonePermission}
                          className="w-full mt-1 py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[9px] uppercase tracking-wide cursor-pointer transition-colors shadow-sm whitespace-nowrap leading-none"
                        >
                          Habilitar Microfone no Celular
                        </button>
                      </div>
                    )}

                  </div>

                  {/* Speech transcript & manual fallback */}
                  <div className="flex-1 flex flex-col justify-between gap-4">
                    
                    {/* Real-time Subtitles / Message Box */}
                    <div className="bg-[#04120b]/80 border-2 border-emerald-900/70 rounded-2xl p-5 text-xs flex-1 flex flex-col justify-center">
                      <div>
                        <span className="text-[9px] text-blue-400/90 font-mono block uppercase font-bold tracking-wider mb-2">
                          {isListening ? "Transcrição em Tempo Real:" : "Você perguntou:"}
                        </span>
                        <p className={`font-display font-extrabold italic text-sm mt-0.5 transition-all ${isListening ? "text-blue-200 bg-[#0a2618] border border-dashed border-blue-500/60 px-3 py-2 rounded animate-pulse" : "text-blue-50"}`}>
                          {isListening 
                            ? (realtimeSpeech ? `"${realtimeSpeech}"` : "Ouvindo atentamente... fale algo sobre o Pantanal") 
                            : (lastSpeechDetected ? `"${lastSpeechDetected}"` : "Aguardando transmissão de voz...")
                          }
                        </p>
                      </div>
                    </div>

                    {/* Suggested Questions Quick Tap */}
                    {suggestedQuestions.length > 0 && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <span className="text-[9px] font-mono font-bold uppercase text-blue-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          Perguntas Sugeridas (toque para acionar):
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                          {suggestedQuestions.map((sug, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleIncomingCommand(sug)}
                              className="px-2.5 py-1 bg-[#092417] hover:bg-blue-600 hover:text-white border border-emerald-800 hover:border-blue-400 text-emerald-100 text-[10px] font-mono font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
                            >
                              "{sug}"
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Backup input bar */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleIncomingCommand(inputText);
                      }}
                      className="relative"
                    >
                      <input
                        type="text"
                        className="w-full bg-[#030d07] border-2 border-emerald-900 focus:ring-0 focus:border-blue-400 rounded-xl pl-3.5 pr-11 py-2.5 text-xs text-stone-100 placeholder-emerald-700/60 font-mono shadow-[2px_2px_0px_0px_rgba(2,10,6,0.6)] focus:outline-none transition-all"
                        placeholder="Escreva sua pergunta sobre o Pantanal aqui..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        disabled={isAnalyzing}
                      />
                      <button
                        type="submit"
                        disabled={isAnalyzing || !inputText.trim()}
                        className="absolute right-1.5 top-1.5 w-7.5 h-7.5 rounded bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400 hover:from-blue-500 hover:to-blue-400 text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        <Send className="w-3 h-3 text-white" />
                      </button>
                    </form>

                  </div>

                </div>
              )}

            </div>

            {/* Minimalist Configuration Action Bar (Ocultado durante o vídeo) */}
            {!hidePanels && (!hasStarted || videoFinished) && (
              <div className="bg-[#06170f]/80 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between border border-emerald-950 gap-4 text-left max-w-5xl mx-auto w-full">
                <div className="flex items-center gap-3">
                  <div className="bg-[#0a2316] border border-emerald-800 text-[10px] h-6 px-2.5 rounded-lg font-mono text-blue-400 font-bold flex items-center shrink-0">
                    BIOMA PANTANAL ATIVO
                  </div>
                  <p className="text-[11px] text-emerald-300/80 leading-none font-mono">
                    Gatilhos de voz sintonizados e prontos para interação.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("settings")}
                  className="bg-[#092215] hover:bg-[#0f3622] border border-emerald-800 rounded-lg px-4 py-2 font-mono text-[10px] font-bold text-blue-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm flex items-center gap-2 uppercase tracking-wider"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configurar Canais</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: AJUSTES DA CENTRAL (Optimized, Simplified and Professional Settings Tab) */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#05130b] border-3 border-emerald-950 rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(4,16,10,1)] text-left flex flex-col gap-6 text-stone-100">
              
              {/* Header section with clean typography & solid controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white border border-blue-400 px-2 py-0.5 rounded uppercase">
                      Painel do Operador • Pantanal
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-[#092215] text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded uppercase">
                      v2.1
                    </span>
                  </div>
                  <h2 className="text-sm font-display font-black text-blue-50 uppercase tracking-wider mt-1.5">
                    Configuração de Canais e Voz Pantaneira
                  </h2>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5 font-mono">
                    Gerencie a transmissão e associe comandos falados aos canais de vídeo do Pantanal.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleSaveAllData}
                    className="flex items-center gap-1.5 bg-[#0c2238] hover:bg-[#133352] text-blue-300 text-[10px] font-bold px-3 py-2 rounded-lg border border-blue-700/80 transition-all cursor-pointer shadow-sm font-mono uppercase"
                    title="Salvar todos os dados do app agora"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-400" />
                    <span>Salvar Dados</span>
                  </button>

                  <button
                    onClick={resetAllTriggers}
                    className="flex items-center gap-1.5 bg-[#082014] hover:bg-[#0f2e1d] text-emerald-300 hover:text-emerald-100 text-[10px] font-bold px-3 py-2 rounded-lg border border-emerald-900 transition-all cursor-pointer shadow-sm font-mono uppercase"
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-400" />
                    <span>Redefinir</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("chat")}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-[10px] font-black px-4 py-2 rounded-lg border border-blue-400 transition-all cursor-pointer uppercase font-mono tracking-wider shadow-[3px_3px_0px_0px_rgba(30,58,138,1)]"
                  >
                    <span>Concluído</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 12-Column Grid Layout for Settings Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Side: System & Intro Flow (Col Span: 4) */}
                <div className="lg:col-span-4 space-y-5">
                  
                  {/* Card 1: Intro Video config */}
                  <div className="bg-[#081f14]/60 border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between gap-4 text-left">
                    <div>
                      <div className="flex justify-between items-center border-b border-emerald-950 pb-2">
                        <span className="text-[11px] font-mono font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-blue-400" />
                          Vídeo de Apresentação (Intro)
                        </span>
                        {introUrl && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold font-mono border ${
                            isYouTubeUrl(introUrl)
                              ? "bg-red-600/20 text-red-400 border-red-500/30"
                              : "bg-[#0c2b1d] text-emerald-200 border-emerald-800"
                          }`}>
                            {isYouTubeUrl(introUrl) ? "YOUTUBE" : "ATIVO"}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-emerald-400/70 leading-normal mt-2 font-mono">
                        Vídeo padrão reproduzido na inicialização ou ao recomeçar a visita guiada. Insira um link do YouTube ou carregue um arquivo local.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {/* URL Input */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-emerald-400/80 uppercase font-mono font-bold flex items-center justify-between">
                          <span>URL do Vídeo (YouTube / Web):</span>
                          {isYouTubeUrl(introUrl) && (
                            <span className="text-[8px] text-red-400 font-bold">YouTube detectado</span>
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder="https://www.youtube.com/watch?v=... ou link .mp4"
                          value={introUrl}
                          onChange={(e) => handleUrlChange("intro", e.target.value)}
                          className="w-full bg-[#030d07] border border-emerald-900 focus:border-blue-400 rounded-lg px-2.5 py-1.5 text-[10px] text-stone-100 placeholder-emerald-700/60 font-mono focus:outline-none"
                        />
                      </div>

                      {/* File upload or restore default URL buttons */}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 border border-dashed border-emerald-900 hover:border-blue-400/60 bg-[#04120a] rounded-lg p-2 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 min-h-[38px]">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileChange("intro", file);
                            }}
                            className="hidden"
                          />
                          <Upload className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-emerald-300 font-mono text-[9px] truncate">
                            {introName && !introUrl?.startsWith("http") ? introName : "Arquivo local"}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleUrlChange("intro", DEFAULT_INTRO_URL)}
                          className="px-2.5 py-2 bg-[#092215] hover:bg-[#0e311f] border border-emerald-800 rounded-lg text-emerald-300 hover:text-blue-200 text-[9px] font-mono font-bold transition-all shrink-0 cursor-pointer"
                          title="Restaurar vídeo oficial da apresentação: https://youtu.be/GwhjqwYkk6o (1080p HD)"
                        >
                          Padrão YouTube
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (introUrl) {
                            triggerVideoSlot("intro");
                            setActiveTab("chat");
                          }
                        }}
                        disabled={!introUrl}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-[#0a2719] hover:bg-[#0c2e44] hover:border-blue-700 active:bg-[#06180f] border border-emerald-800 rounded-lg text-emerald-200 hover:text-blue-200 disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer font-bold font-mono text-[9px] uppercase shadow-sm"
                      >
                        Visualizar Intro em Tela Cheia
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Plano de Fundo - Bioma Pantanal */}
                  <div className="bg-[#081f14]/60 border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between gap-4 text-left">
                    <div>
                      <div className="flex justify-between items-center border-b border-emerald-950 pb-2">
                        <span className="text-[11px] font-mono font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                          Fundo Bioma Pantanal
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold font-mono border ${
                          showBgImage 
                            ? "bg-blue-600/20 text-blue-300 border-blue-500/40" 
                            : "bg-[#092215] text-emerald-400 border-emerald-800"
                        }`}>
                          {showBgImage ? "ATIVO" : "INATIVO"}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400/70 leading-normal mt-2 font-mono">
                        Papel de parede com o santuário pantaneiro (tuiuiú, vitórias-régias, onça-pintada e águas alagadas ao pôr do sol).
                      </p>
                    </div>

                    {/* Preview Image with overlay effect */}
                    <div className="relative rounded-xl overflow-hidden border border-emerald-900 h-28 group">
                      <img 
                        src="/assets/images/pantanal_wildlife.jpg" 
                        alt="Miniatura Santuário do Pantanal"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-2 justify-between">
                        <span className="text-[9px] font-mono font-bold text-blue-200 bg-[#05140b]/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-emerald-800">
                          Santuário Pantanal
                        </span>
                        <span className="text-[9px] font-mono font-bold text-blue-200 bg-[#05140b]/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-emerald-800">
                          {bgOpacity}% Opacidade
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-3 pt-1">
                      {/* Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowBgImage(prev => !prev)}
                        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-mono font-bold text-[10px] uppercase transition-all cursor-pointer border ${
                          showBgImage
                            ? "bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30"
                            : "bg-[#092215] text-emerald-300 border-emerald-800 hover:text-white"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{showBgImage ? "Ocultar Fundo Pantanal" : "Ativar Fundo Pantanal"}</span>
                      </button>

                      {/* Opacity Range Slider */}
                      {showBgImage && (
                        <div className="space-y-1.5 bg-[#04120a] p-2.5 rounded-xl border border-emerald-950">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-emerald-400">Transparência / Opacidade:</span>
                            <span className="text-blue-300 font-bold">{bgOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="85"
                            step="5"
                            value={bgOpacity}
                            onChange={(e) => setBgOpacity(Number(e.target.value))}
                            className="w-full accent-blue-400 cursor-pointer"
                          />
                          <div className="flex justify-between text-[8px] font-mono text-emerald-500/70">
                            <span>Mais Transparente (10%)</span>
                            <span>Recomendado (35%)</span>
                            <span>Mais Vívido (85%)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Otimização Mobile & Tela Inteira */}
                  <div className="bg-[#081f14]/60 border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between gap-4 text-left">
                    <div>
                      <div className="flex justify-between items-center border-b border-emerald-950 pb-2">
                        <span className="text-[11px] font-mono font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                          Modo Mobile & Tela Inteira
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold font-mono border ${
                          videoFit === "cover"
                            ? "bg-[#0c2b1d] text-emerald-200 border-emerald-800"
                            : "bg-[#082014] text-emerald-400 border-emerald-900"
                        }`}>
                          {videoFit === "cover" ? "PREENCHER TELA" : "ORIGINAL"}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400/70 leading-normal mt-2 font-mono">
                        Ajuste para celulares: os vídeos se encaixam preenchendo a tela inteira sem bordas pretas.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Encaixe de Vídeo */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-emerald-400/80 uppercase font-mono font-bold block">
                          Formato de Exibição:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setVideoFit("cover")}
                            className={`px-2.5 py-2 rounded-lg font-mono text-[9px] font-bold uppercase transition-all cursor-pointer border flex flex-col items-center gap-1 text-center ${
                              videoFit === "cover"
                                ? "bg-blue-600/25 text-blue-200 border-blue-400 shadow-sm"
                                : "bg-[#04120a] text-emerald-400/80 border-emerald-900 hover:text-white"
                            }`}
                          >
                            <Maximize className="w-3.5 h-3.5" />
                            <span>Preencher Tela</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setVideoFit("contain")}
                            className={`px-2.5 py-2 rounded-lg font-mono text-[9px] font-bold uppercase transition-all cursor-pointer border flex flex-col items-center gap-1 text-center ${
                              videoFit === "contain"
                                ? "bg-blue-600/25 text-blue-200 border-blue-400 shadow-sm"
                                : "bg-[#04120a] text-emerald-400/80 border-emerald-900 hover:text-white"
                            }`}
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Original</span>
                          </button>
                        </div>
                      </div>

                      {/* Auto Fullscreen on Start Toggle */}
                      <div className="flex items-center justify-between p-2.5 bg-[#04120a] rounded-xl border border-emerald-950">
                        <div className="space-y-0.5 pr-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-200 block">
                            Tela Cheia ao Iniciar no Mobile
                          </span>
                          <span className="text-[8px] font-mono text-emerald-500/80 block">
                            Abre o reprodutor em tela cheia automaticamente no celular
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMobileFullscreenAuto(prev => !prev)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border border-emerald-800 shrink-0 ${
                            mobileFullscreenAuto ? "bg-blue-500" : "bg-[#092215]"
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full bg-stone-950 block absolute top-0.5 transition-transform ${
                              mobileFullscreenAuto ? "left-4.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Test Fullscreen */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("chat");
                          setTimeout(() => {
                            toggleFullscreen();
                          }, 100);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0a2719] hover:bg-blue-600 text-blue-200 hover:text-white border border-emerald-800 rounded-lg font-mono font-bold text-[9px] uppercase transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Maximize className="w-3.5 h-3.5 text-blue-400" />
                        <span>Visualizar em Tela Cheia</span>
                      </button>
                    </div>
                  </div>

                  {/* Card: Ajuste de Qualidade Inicial do Vídeo (1080p, 720p, 480p, etc.) */}
                  <div className="bg-[#081f14]/60 border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between gap-4 text-left">
                    <div>
                      <div className="flex justify-between items-center border-b border-emerald-950 pb-2">
                        <span className="text-[11px] font-mono font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-blue-400" />
                          Qualidade Inicial do Vídeo
                        </span>
                        <span className="text-[8px] px-2 py-0.5 rounded font-extrabold font-mono border bg-blue-600/20 text-blue-300 border-blue-500/40 uppercase">
                          {preferredVideoQuality === "hd1080" ? "1080p FHD" :
                           preferredVideoQuality === "hd720" ? "720p HD" :
                           preferredVideoQuality === "large" ? "480p SD" :
                           preferredVideoQuality === "medium" ? "360p" : "AUTOMÁTICO"}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-400/70 leading-normal mt-2 font-mono">
                        Escolha em qual resolução os vídeos devem começar automaticamente ao reproduzir os gatilhos ou apresentação (1080p, 720p, etc.).
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-emerald-400/80 uppercase font-mono font-bold block">
                          Resolução Padrão de Início:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { id: "hd1080", label: "1080p", badge: "Full HD", desc: "Máxima Nitidez" },
                            { id: "hd720", label: "720p", badge: "HD", desc: "Equilibrado" },
                            { id: "large", label: "480p", badge: "SD", desc: "Mais Leve" },
                            { id: "medium", label: "360p", badge: "Econômico", desc: "Pouca Banda" },
                            { id: "auto", label: "Auto", badge: "Dinâmico", desc: "Adaptativo" },
                          ].map((item) => {
                            const isSelected = preferredVideoQuality === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setPreferredVideoQuality(item.id as VideoQualityPreference);
                                  triggerQualityAutoPulse(item.id as VideoQualityPreference);
                                  setYtReloadKey(prev => prev + 1);
                                }}
                                className={`px-2.5 py-2 rounded-xl font-mono flex flex-col items-start gap-1 transition-all cursor-pointer border text-left whitespace-nowrap ${
                                  isSelected
                                    ? "bg-blue-600/25 text-blue-200 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                                    : "bg-[#04120a] text-emerald-400/80 border-emerald-950 hover:border-emerald-700 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full gap-1">
                                  <span className="text-[12px] font-black leading-none whitespace-nowrap">{item.label}</span>
                                  <span className={`text-[7.5px] px-1 py-0.5 rounded font-extrabold uppercase whitespace-nowrap leading-none ${isSelected ? "bg-blue-500 text-white font-black" : "bg-[#082014] text-emerald-500"}`}>
                                    {item.badge}
                                  </span>
                                </div>
                                <span className={`text-[8px] whitespace-nowrap leading-none ${isSelected ? "text-blue-300" : "text-emerald-500/70"}`}>
                                  {item.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#04120a] rounded-xl border border-emerald-950 text-[9px] font-mono text-emerald-400/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-200">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-bold text-blue-200 text-[9.5px]">
                            {preferredVideoQuality === "hd1080" && "1080p (Full HD): Máxima qualidade visual de alta definição."}
                            {preferredVideoQuality === "hd720" && "720p (HD): Alta definição com menor consumo de dados."}
                            {preferredVideoQuality === "large" && "480p (SD): Reprodução suave, indicada para conexões intermediárias."}
                            {preferredVideoQuality === "medium" && "360p: Carregamento instantâneo para conexões 3G/4G oscilantes."}
                            {preferredVideoQuality === "auto" && "Automático: O YouTube ajusta a resolução de acordo com a banda da rede."}
                          </span>
                        </div>
                        <p className="text-[8px] text-emerald-500/70 leading-tight">
                          A Assistente Virtual WIT enviará os comandos de taxa e resolução inicial para que o reprodutor trave na qualidade selecionada desde o primeiro segundo.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card: Extensão Trava 1080p Only (Injetor & Interceptador de Resolução) */}
                  <div className="bg-gradient-to-br from-[#0c2b1d]/70 via-[#071c13]/50 to-[#101f33]/40 border border-emerald-800/80 rounded-2xl p-4 flex flex-col justify-between gap-4 text-left shadow-[0_0_20px_rgba(59,130,246,0.08)]">
                    <div>
                      <div className="flex justify-between items-center border-b border-emerald-800/80 pb-2">
                        <span className="text-[11px] font-mono font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          Extensão: Trava 1080p Exclusiva
                        </span>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black font-mono border uppercase tracking-wider flex items-center gap-1 ${
                          force1080pOnly
                            ? "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                            : "bg-[#092215] text-emerald-400 border-emerald-800"
                        }`}>
                          <Lock className="w-2.5 h-2.5" />
                          {force1080pOnly ? "EXTENSÃO ATIVA" : "EXTENSÃO PAUSADA"}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-300/80 leading-relaxed mt-2 font-mono">
                        Módulo de extensão integrado que intercepta a API do YouTube Player e injeta parâmetros de alta definição (<code className="text-blue-200 bg-black/50 px-1 py-0.5 rounded">fmt=22</code>, <code className="text-blue-200 bg-black/50 px-1 py-0.5 rounded">vq=hd1080</code>) para impedir que o player caia para 360p/480p.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Toggle Extensão */}
                      <div className="flex items-center justify-between p-2.5 bg-[#030d07]/70 rounded-xl border border-emerald-950">
                        <div className="space-y-0.5 pr-2">
                          <div className="text-[11px] font-mono font-bold text-emerald-100 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-blue-400" />
                            Forçar Apenas 1080p (Full HD Lock)
                          </div>
                          <div className="text-[8.5px] font-mono text-emerald-400/70">
                            Bloqueia resoluções inferiores e repete o comando HD continuamente durante o vídeo
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !force1080pOnly;
                            setForce1080pOnly(next);
                            if (next) {
                              setPreferredVideoQuality("hd1080");
                              triggerQualityAutoPulse("hd1080");
                              setYtReloadKey(k => k + 1);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black transition-all cursor-pointer whitespace-nowrap leading-none border shrink-0 ${
                            force1080pOnly
                              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                              : "bg-[#092215] text-emerald-400 border-emerald-800 hover:text-white"
                          }`}
                        >
                          {force1080pOnly ? "ATIVADO" : "DESATIVADO"}
                        </button>
                      </div>

                      {/* Botão de Disparo Imediato e Detalhes da Extensão */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreferredVideoQuality("hd1080");
                            triggerQualityAutoPulse("hd1080");
                          }}
                          className="px-3 py-2 rounded-xl bg-[#04120a] border border-emerald-900 hover:border-blue-400 hover:text-blue-200 text-emerald-200 font-mono text-[9.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap leading-none shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          <span>Pulsar Trava 1080p Agora</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const rawUrl = introUrl || "https://youtu.be/GwhjqwYkk6o";
                            const cleanId = getYouTubeVideoId(rawUrl) || "GwhjqwYkk6o";
                            const hdUrl = `https://www.youtube.com/watch?v=${cleanId}&vq=hd1080&fmt=22`;
                            navigator.clipboard?.writeText(hdUrl);
                            triggerQualityAutoPulse("hd1080");
                          }}
                          className="px-3 py-2 rounded-xl bg-[#04120a] border border-emerald-900 hover:border-blue-700 text-emerald-200 font-mono text-[9.5px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap leading-none shadow-sm"
                          title="Copia link direto formatado com flags 1080p e fmt=22"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          <span>Copiar URL Direta 1080p</span>
                        </button>
                      </div>

                      {/* Diagnóstico da Extensão */}
                      <div className="p-2.5 bg-[#030d07]/70 rounded-xl border border-emerald-950 text-[8.5px] font-mono text-emerald-400/80 space-y-1.5">
                        <div className="flex items-center justify-between text-emerald-200 font-bold border-b border-emerald-950 pb-1">
                          <span className="flex items-center gap-1.5 text-blue-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Parâmetros da Extensão Ativos no Iframe:
                          </span>
                          <span className="text-[7.5px] text-emerald-500 font-mono">Loop 1.2s Ativo</span>
                        </div>
                        <p className="text-emerald-400/80 leading-tight">
                          • <span className="text-blue-200">vq=hd1080</span> & <span className="text-blue-200">hd=1</span>: Notificam o YouTube a selecionar o stream Full HD de 1080 linhas.<br />
                          • <span className="text-blue-200">fmt=22</span>: Força o container MP4 1080p/720p direto do servidor do Google.<br />
                          • <span className="text-blue-200">setPlaybackQualityRange</span>: Limita o range mínimo para 1080p impedindo fallback automático.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Diagnóstico & Habilitação do Microfone (Mobile & Desktop) */}
                  <div className="bg-[#081f14]/60 border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between text-left gap-3">
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                      <span className="text-[10px] font-mono font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-blue-400" />
                        Microfone no Celular (Mobile)
                      </span>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold border ${
                        micPermission === "granted"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-600/40"
                          : micPermission === "denied"
                          ? "bg-red-500/15 text-red-400 border-red-500/30"
                          : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                      }`}>
                        {micPermission === "granted" ? "LIBERADO" : micPermission === "denied" ? "BLOQUEADO" : "PENDENTE"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Permission status & action button */}
                      <div className="p-2.5 bg-[#04120a] rounded-xl border border-emerald-950 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-emerald-400">Status de Permissão:</span>
                          <span className="text-[9px] font-mono font-bold text-emerald-100">
                            {micPermission === "granted" 
                              ? "Acesso Permitido" 
                              : micPermission === "denied"
                              ? "Bloqueado pelo Navegador"
                              : "Não Solicitado / Pendente"}
                          </span>
                        </div>

                        {/* Test / Enable Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await requestMicrophonePermission();
                            if (ok) {
                              setSpeechError("");
                            }
                          }}
                          className={`w-full py-2 px-3 rounded-lg font-mono font-black text-[9px] uppercase tracking-wide flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-sm active:scale-95 ${
                            micPermission === "granted"
                              ? "bg-[#0b281a] text-emerald-200 border-emerald-800 hover:bg-emerald-600 hover:text-white"
                              : "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400 hover:bg-blue-400"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{micPermission === "granted" ? "Testar Microfone Novamente" : "Habilitar Microfone no Celular"}</span>
                        </button>
                      </div>

                      {/* Live Audio Level Bar (when listening or testing) */}
                      {(isListening || isRecordingMedia || audioLevel > 0) && (
                        <div className="p-2.5 bg-[#030d07] rounded-xl border border-emerald-900 space-y-1.5">
                          <div className="flex justify-between text-[8px] font-mono text-emerald-400">
                            <span>Sinal do Microfone:</span>
                            <span className="text-blue-300 font-bold">{audioLevel}%</span>
                          </div>
                          <div className="w-full bg-[#082014] rounded-full h-2 overflow-hidden border border-emerald-900">
                            <div 
                              className="bg-gradient-to-r from-emerald-400 to-blue-400 h-full transition-all duration-75"
                              style={{ width: `${audioLevel}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Engine Selector */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-emerald-400 block">
                          Motor de Reconhecimento:
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => setPreferredSpeechEngine("auto")}
                            className={`py-1.5 px-1 rounded font-mono text-[8px] font-bold uppercase transition-all cursor-pointer border text-center ${
                              preferredSpeechEngine === "auto"
                                ? "bg-blue-600/20 text-blue-300 border-blue-400"
                                : "bg-[#04120a] text-emerald-400/80 border-emerald-950 hover:text-white"
                            }`}
                          >
                            Auto (Mobile)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredSpeechEngine("gemini")}
                            className={`py-1.5 px-1 rounded font-mono text-[8px] font-bold uppercase transition-all cursor-pointer border text-center ${
                              preferredSpeechEngine === "gemini"
                                ? "bg-blue-600/20 text-blue-300 border-blue-400"
                                : "bg-[#04120a] text-emerald-400/80 border-emerald-950 hover:text-white"
                            }`}
                          >
                            IA Gemini
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredSpeechEngine("native")}
                            className={`py-1.5 px-1 rounded font-mono text-[8px] font-bold uppercase transition-all cursor-pointer border text-center ${
                              preferredSpeechEngine === "native"
                                ? "bg-blue-600/20 text-blue-300 border-blue-400"
                                : "bg-[#04120a] text-emerald-400/80 border-emerald-950 hover:text-white"
                            }`}
                          >
                            Nativo Web
                          </button>
                        </div>
                      </div>

                      {/* Help button for blocked permissions */}
                      <button
                        type="button"
                        onClick={() => setShowMicModal(true)}
                        className="w-full text-center text-[8px] font-mono text-emerald-400 hover:text-blue-300 underline cursor-pointer py-0.5"
                      >
                        O microfone não funciona? Ver instruções de desbloqueio
                      </button>
                    </div>
                  </div>

                  {/* Card: Salvar e Backup de Todos os Dados (Request #10) */}
                  <div className="bg-[#061910] border border-emerald-900 rounded-2xl p-4 flex flex-col justify-between text-left gap-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                      <span className="text-[11px] font-mono font-bold text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-blue-400" />
                        Salvar e Backup de Dados
                      </span>
                      <span className="text-[8px] font-mono bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-0.5 rounded font-black border border-blue-400 uppercase">
                        SEGURO
                      </span>
                    </div>

                    <p className="text-[10px] text-emerald-300/80 leading-normal font-mono">
                      Salve todas as perguntas configuradas, vídeos, sugestões e preferências no navegador ou exporte um arquivo de backup para restaurar quando quiser.
                    </p>

                    <div className="space-y-2">
                      {/* Botão Salvar Agora */}
                      <button
                        type="button"
                        onClick={handleSaveAllData}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 border border-blue-400 rounded-xl font-mono text-[10px] font-black uppercase transition-all cursor-pointer shadow-sm active:scale-98"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Todos os Dados Agora</span>
                      </button>

                      {/* Botões Exportar e Importar Backup */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#092215] hover:bg-[#0f3622] text-emerald-100 border border-emerald-800 hover:border-blue-400 rounded-xl font-mono text-[9px] font-bold uppercase transition-all cursor-pointer"
                          title="Baixar arquivo JSON com todas as configurações"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>Exportar (.JSON)</span>
                        </button>

                        <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#092215] hover:bg-[#0f3622] text-emerald-100 border border-emerald-800 hover:border-blue-400 rounded-xl font-mono text-[9px] font-bold uppercase transition-all cursor-pointer text-center">
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          <span>Importar Backup</span>
                          <input
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImportBackup(file);
                            }}
                          />
                        </label>
                      </div>

                      {/* Resumo do Armazenamento */}
                      <div className="p-2.5 bg-[#04120a] rounded-xl border border-emerald-950 text-[9px] font-mono text-emerald-400/80 space-y-1">
                        <div className="flex justify-between">
                          <span>Gatilhos Ativos:</span>
                          <strong className="text-blue-200">{questions.length} canais</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Perguntas Sugeridas:</span>
                          <strong className="text-blue-200">{suggestedQuestions.length} sugestões</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Apresentação (Intro):</span>
                          <strong className="text-blue-200">{introUrl ? "Configurada" : "Pendente"}</strong>
                        </div>
                        <div className="flex justify-between border-t border-emerald-950 pt-1 mt-1 text-[8.5px]">
                          <span>Status do Navegador:</span>
                          <span className="text-emerald-300 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Auto-salvamento Ativo
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Side: Voice Triggers Grid (Col Span: 8) */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* Card: Perguntas Sugeridas para o Usuário (Request #8) */}
                  <div className="bg-[#06180f]/90 border border-emerald-950/80 rounded-2xl p-4 flex flex-col gap-3 text-left shadow-md backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          Perguntas Sugeridas ao Usuário ({suggestedQuestions.length})
                        </span>
                        <span className="text-[8px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded font-bold uppercase">
                          Exibidas no Painel
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={copyTriggersToSuggested}
                        className="text-[9px] font-mono font-bold text-emerald-200 hover:text-blue-300 bg-[#082015] hover:bg-[#0c2e1f] px-2.5 py-1 rounded-lg border border-emerald-800/60 flex items-center gap-1 cursor-pointer transition-all self-start sm:self-auto"
                        title="Adicionar automaticamente todas as frases dos canais à lista de sugestões"
                      >
                        <Copy className="w-3 h-3 text-blue-400" />
                        <span>Copiar dos Gatilhos ({questions.length})</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-emerald-400/80 font-mono leading-normal">
                      Estas perguntas aparecem como botões interativos na tela e no modo de tela focada para o visitante clicar ou falar com a assistente do Pantanal.
                    </p>

                    {/* Add new suggested question input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addSuggestedQuestion(newSuggestedInput);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={newSuggestedInput}
                        onChange={(e) => setNewSuggestedInput(e.target.value)}
                        placeholder="Ex: mostrar onça-pintada no pantanal..."
                        className="flex-1 bg-[#030d07] border border-emerald-900/60 focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-emerald-700/60 font-mono focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newSuggestedInput.trim()}
                        className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border border-blue-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-mono text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span>Adicionar</span>
                      </button>
                    </form>

                    {/* Chips list of suggested questions */}
                    <div className="flex flex-wrap gap-2 pt-1 max-h-[140px] overflow-y-auto pr-1">
                      {suggestedQuestions.map((sug, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-[#082216]/90 border border-emerald-900/70 hover:border-blue-400/60 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-100 group transition-all"
                        >
                          <span className="font-semibold select-none">"{sug}"</span>
                          <button
                            type="button"
                            onClick={() => removeSuggestedQuestion(idx)}
                            className="text-emerald-500 hover:text-red-400 p-0.5 cursor-pointer transition-colors"
                            title="Remover pergunta sugerida"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini control bar */}
                  <div className="flex items-center justify-between border-b border-emerald-950/80 pb-2">
                    <span className="text-[11px] font-mono font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-blue-400" />
                      Gatilhos Cadastrados ({questions.length})
                    </span>
                  </div>

                  {/* Elegant Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="bg-[#06180f]/90 border border-emerald-950 hover:border-emerald-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 text-left transition-all duration-200"
                      >
                        <div className="flex justify-between items-center border-b border-emerald-950/80 pb-2">
                          <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wide">
                            Canal #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {q.videoUrl && (
                              <span className="text-[8px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold font-mono border border-emerald-800/60">
                                ATIVO
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeQuestion(q.id)}
                              className="text-emerald-600 hover:text-red-400 transition-colors p-1 cursor-pointer"
                              title="Excluir Gatilho"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          
                          {/* Phrase input */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-emerald-400/80 uppercase font-mono font-bold block">
                              Frase Ativadora:
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#030d07] border border-emerald-950 focus:border-blue-400 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-100 focus:outline-none font-bold font-mono"
                              value={q.phrase}
                              onChange={(e) => updateQuestionPhrase(q.id, e.target.value)}
                              placeholder="Ex: mostrar pantanal"
                            />
                          </div>

                          {/* URL Input (YouTube / Web) */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] text-emerald-400/80 uppercase font-mono font-bold">
                              <span>URL (YouTube / Link Web):</span>
                              {isYouTubeUrl(q.videoUrl) ? (
                                <span className="text-[8px] bg-red-950/60 text-red-300 border border-red-800/60 px-1.5 py-0.2 rounded font-black">
                                   YOUTUBE
                                </span>
                              ) : q.videoUrl?.startsWith("http") ? (
                                <span className="text-[8px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 rounded font-black">
                                  LINK WEB
                                </span>
                              ) : q.videoUrl ? (
                                <span className="text-[8px] bg-blue-950/60 text-blue-300 border border-blue-800/60 px-1.5 py-0.2 rounded font-black">
                                  LOCAL
                                </span>
                              ) : null}
                            </div>
                            <input
                              type="text"
                              className="w-full bg-[#030d07] border border-emerald-950 focus:border-blue-400 rounded-lg px-2.5 py-1.5 text-[10px] text-stone-100 placeholder-emerald-700/50 focus:outline-none font-mono"
                              value={q.videoUrl}
                              onChange={(e) => handleUrlChange(q.id, e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=... ou .mp4"
                            />
                          </div>

                          {/* Video file upload option as fallback */}
                          <div className="flex items-center gap-1.5">
                            <label className="flex-1 border border-dashed border-emerald-900/60 hover:border-blue-400/60 bg-[#041009]/80 rounded-lg p-1.5 text-center cursor-pointer transition-all flex items-center justify-center gap-1 min-h-[32px]">
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileChange(q.id, file);
                                }}
                                className="hidden"
                              />
                              <Upload className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-emerald-300 font-mono text-[8px] truncate">
                                {q.videoName && !q.videoUrl?.startsWith("http") ? q.videoName : "Ou arquivo local (.mp4)"}
                              </span>
                            </label>
                          </div>

                          {/* Trigger test button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (q.videoUrl) {
                                triggerVideoSlot(q.id);
                                setActiveTab("chat");
                              }
                            }}
                            disabled={!q.videoUrl}
                            className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#082015] hover:bg-[#0c2e1f] active:bg-[#041009] border border-emerald-800/60 rounded-lg text-emerald-200 hover:text-blue-300 hover:border-blue-500/80 disabled:opacity-35 disabled:pointer-events-none transition-all cursor-pointer font-bold font-mono text-[9px] uppercase shadow-sm"
                          >
                            Testar Canal em Tela Cheia
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Streamlined "Add" card trigger slot */}
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="border border-dashed border-emerald-900/80 hover:border-blue-400/70 rounded-xl p-4 flex flex-col justify-center items-center gap-2 hover:bg-[#082216]/40 transition-all cursor-pointer text-emerald-400 hover:text-blue-300 min-h-[190px] group"
                    >
                      <div className="w-10 h-10 rounded-full border border-dashed border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:border-blue-400">
                        <span className="text-base leading-none font-bold">+</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[11px] font-bold uppercase tracking-wider font-mono block text-blue-300">Novo Gatilho</span>
                        <span className="text-[9px] text-emerald-400/80 mt-1 max-w-[170px] block mx-auto leading-normal font-mono">
                          Associe um novo arquivo de vídeo a um comando de voz.
                        </span>
                      </div>
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Clean Aesthetic Footer */}
      {!hidePanels && !isFullscreen && (
        <footer id="wit-footer" className="mt-auto py-6 border-t border-emerald-950/80 bg-[#030d07]/90 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-emerald-400/70 gap-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              WIT — ASSISTENTE VIRTUAL • BIOMA PANTANAL
            </span>
            <span>© CONEXÃO INTERATIVA DE VÍDEO & PRESERVAÇÃO</span>
          </div>
        </footer>
      )}

      {/* Mode: Painel Oculto (Acompanha Falar com Assistente + Perguntas Sugeridas) */}
      {hidePanels && !isFullscreen && (
        <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl px-3 sm:px-4 z-50 select-none pointer-events-auto animate-fade-in">
          <div className="bg-[#05110a]/95 backdrop-blur-md border border-emerald-800/80 rounded-2xl p-3 sm:p-4 shadow-[0_8px_35px_rgba(0,0,0,0.95)] flex flex-col gap-2.5">
            {/* Top row of the clean dock: Voice button + real-time status + control buttons */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-black uppercase transition-all cursor-pointer border shrink-0 ${
                    isListening || isRecordingMedia
                      ? "bg-red-600 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]"
                      : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-blue-400 shadow-sm active:scale-95"
                  }`}
                  title="Falar com a Assistente Virtual"
                >
                  {isListening || isRecordingMedia ? (
                    <>
                      <MicOff className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">{isRecordingMedia ? `Gravando (${recordingDuration}s)` : "Ouvindo..."}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Falar com a Assistente</span>
                    </>
                  )}
                </button>

                {(isListening || realtimeSpeech) && (
                  <div className="text-xs font-mono text-emerald-100 italic truncate bg-[#082015] px-2.5 py-1.5 rounded-lg border border-emerald-800/60 min-w-0 flex-1">
                    {realtimeSpeech ? `"${realtimeSpeech}"` : "Fale sua pergunta sobre o Pantanal agora..."}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleReplayVideo}
                  className="px-2.5 py-1.5 bg-[#082015] hover:bg-[#0c2e1f] text-emerald-200 hover:text-blue-300 border border-emerald-800/60 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer flex items-center gap-1 shadow-sm transition-all"
                  title="Rever Vídeo Atual"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Rever</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHidePanels(false)}
                  className="px-3 py-1.5 bg-[#082015] hover:bg-emerald-900/60 text-emerald-100 border border-emerald-700/80 rounded-lg text-[10px] font-mono font-black uppercase cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                  title="Mostrar Painel Completo"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Ver Painel</span>
                </button>
              </div>
            </div>

            {/* Perguntas Sugeridas: clickable chips directly below voice button */}
            {suggestedQuestions.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1.5 border-t border-emerald-950/80">
                <span className="text-[10px] font-mono font-bold uppercase text-blue-300 whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  Perguntas Sugeridas:
                </span>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {suggestedQuestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleIncomingCommand(sug)}
                      className="px-2.5 py-1 bg-[#082015] hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500 hover:text-white border border-emerald-800/60 hover:border-blue-400 text-emerald-100 text-[11px] font-mono font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 shadow-sm active:scale-95"
                    >
                      "{sug}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Microphone Action Button (Apenas quando o painel estiver visível) */}
      {activeTab === "chat" && !hidePanels && !isFullscreen && (
        <div className="fixed bottom-6 right-6 z-[45] flex flex-col items-end gap-1.5 pointer-events-auto animate-fade-in">
          <div className="flex items-center gap-1.5 bg-[#05110a]/95 border border-emerald-700/80 px-2.5 py-1 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.8)] text-[8px] font-mono font-bold uppercase transition-all duration-300">
            <span className={`w-1.5 h-1.5 rounded-full ${isListening || isRecordingMedia ? "bg-red-500 animate-pulse" : "bg-blue-400"}`} />
            <span className={isListening || isRecordingMedia ? "text-red-400 font-extrabold animate-pulse" : "text-blue-300"}>
              {isListening || isRecordingMedia ? (isRecordingMedia ? `GRAVANDO ${recordingDuration}s` : "ESCUTA ATIVA") : "CLIQUE P/ FALAR"}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 border-blue-400 cursor-pointer shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 active:translate-y-1 ${
              isListening || isRecordingMedia
                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                : "bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
            }`}
            title={isListening || isRecordingMedia ? "Desativar escuta de voz" : "Ativar microfone por voz"}
          >
            {isListening || isRecordingMedia ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white animate-pulse" />}
          </button>
        </div>
      )}

      {/* Mobile Microphone Permission Guide Modal */}
      {showMicModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#05140d] border border-emerald-800 rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4 text-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-left">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-400" />
                <h3 className="font-display font-black text-sm uppercase tracking-wider text-blue-300">
                  Como Habilitar o Microfone no Celular
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="text-emerald-500 hover:text-stone-100 p-1 text-xs font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <p className="text-emerald-200/90 leading-relaxed">
                Para responder por voz aos vídeos da Assistente Virtual no celular, o navegador precisa da sua autorização para captar áudio:
              </p>

              {/* Android Instructions */}
              <div className="p-3 bg-[#082015] rounded-xl border border-emerald-900/60 space-y-1.5">
                <span className="text-blue-300 font-bold block uppercase text-[10px] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  No Android (Google Chrome):
                </span>
                <ol className="list-decimal list-inside space-y-1 text-emerald-100/90 text-[11px]">
                  <li>Toque no ícone de <strong>configurações de site</strong> (à esquerda da URL).</li>
                  <li>Toque em <strong>Permissões</strong> &gt; <strong>Microfone</strong>.</li>
                  <li>Marque como <strong>Permitir</strong>.</li>
                </ol>
              </div>

              {/* iPhone / Safari Instructions */}
              <div className="p-3 bg-[#082015] rounded-xl border border-emerald-900/60 space-y-1.5">
                <span className="text-blue-300 font-bold block uppercase text-[10px] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  No iPhone / iPad (Safari):
                </span>
                <ol className="list-decimal list-inside space-y-1 text-emerald-100/90 text-[11px]">
                  <li>Toque no botão <strong>aA</strong> na barra de endereços do Safari.</li>
                  <li>Selecione <strong>Ajustes do Site</strong>.</li>
                  <li>Em <strong>Microfone</strong>, escolha <strong>Permitir</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2.5 mt-2 border-t border-emerald-950 pt-3">
              <button
                type="button"
                onClick={() => setShowMicModal(false)}
                className="px-4 py-2 bg-[#082015] hover:bg-[#0c2e1f] text-emerald-300 font-mono text-[10px] font-bold uppercase rounded-lg border border-emerald-800/60 transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await requestMicrophonePermission();
                  if (ok) {
                    setShowMicModal(false);
                    setSpeechError("");
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-mono text-[10px] font-black uppercase rounded-lg border border-blue-400 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Autorizar e Testar Microfone Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#05140d] border border-emerald-800 rounded-3xl w-full max-w-md p-6 flex flex-col gap-4 text-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-left">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-blue-300 border-b border-emerald-950 pb-2">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-emerald-200/90 font-mono leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-[#082015] hover:bg-[#0c2e1f] text-emerald-300 font-mono text-[10px] font-bold uppercase rounded-lg border border-emerald-800/60 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-black uppercase rounded-lg border border-red-400 shadow-sm transition-all cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
