import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Trees,
  AlertCircle,
  Volume2,
  VolumeX,
  MessageSquareText,
} from "lucide-react";
import "./thomas.css";
import {
  THOMAS_BACKDROP_IMAGE,
  THOMAS_INTRO_VIDEO,
  THOMAS_PROJECT_META,
  THOMAS_SUGGESTIONS_BY_VIDEO_ID,
  THOMAS_TRIGGERS,
  ThomasSuggestedQuestion,
  ThomasVideoItem,
  findThomasSuggestedQuestion,
  matchThomasTriggerLocal,
} from "./thomasConfig";
import { YouTubeStage } from "./YouTubeStage";
import { AmazonTelemetryWidgets } from "./AmazonTelemetryWidgets";
import { SuggestedQuestionsPanel } from "./SuggestedQuestionsPanel";
import { WelcomeScreen } from "./WelcomeScreen";

type AppPhase = "welcome" | "intro" | "listening" | "playing_trigger";

export default function ThomasApp() {
  // Máquina de estados isolada do Projeto Thomas (inicia sempre na tela de abertura)
  const [phase, setPhase] = useState<AppPhase>("welcome");
  const [introCompleted, setIntroCompleted] = useState<boolean>(false);
  const [activeTrigger, setActiveTrigger] = useState<ThomasVideoItem | null>(null);
  const [lastCompletedVideoId, setLastCompletedVideoId] = useState<string>(
    THOMAS_INTRO_VIDEO.id
  );
  const [playbackNonce, setPlaybackNonce] = useState<number>(1);
  const [playedTriggerIds, setPlayedTriggerIds] = useState<string[]>([]);
  const [backdropError, setBackdropError] = useState<boolean>(false);

  // Estados de reconhecimento de voz e assistente
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isRecordingFallback, setIsRecordingFallback] = useState<boolean>(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [lastSpokenText, setLastSpokenText] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>(
    "Reproduzindo vídeo de introdução uma única vez antes de liberar a escuta por voz."
  );
  const [assistantAnswer, setAssistantAnswer] = useState<{
    question: string;
    answer: string;
  } | null>(null);
  const [speakAnswersEnabled, setSpeakAnswersEnabled] = useState<boolean>(true);
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState<boolean>(false);
  const [micWarning, setMicWarning] = useState<string>("");
  const [manualText, setManualText] = useState<string>("");

  // Refs para controle seguro em callbacks assíncronos
  const phaseRef = useRef<AppPhase>(phase);
  phaseRef.current = phase;
  const voiceEnabledRef = useRef<boolean>(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const speakAnswersRef = useRef<boolean>(speakAnswersEnabled);
  speakAnswersRef.current = speakAnswersEnabled;

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const stopSpeechSynthesis = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    setIsSpeakingAnswer(false);
  }, []);

  const stopAllVoiceCapture = useCallback(() => {
    clearRestartTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      mediaStreamRef.current = null;
    }

    setIsListening(false);
    setIsRecordingFallback(false);
    setInterimTranscript("");
  }, []);

  // Dispara um dos 3 gatilhos para reprodução única
  const activateTriggerVideo = useCallback(
    (trigger: ThomasVideoItem) => {
      stopSpeechSynthesis();
      stopAllVoiceCapture();
      setAssistantAnswer(null);
      setActiveTrigger(trigger);
      setPhase("playing_trigger");
      setPlaybackNonce((prev) => prev + 1);
      setPlayedTriggerIds((prev) =>
        prev.includes(trigger.id) ? prev : [...prev, trigger.id]
      );
      setMicWarning("");
      setFeedbackMessage(
        `Gatilho ativado: "${trigger.phrase}". Ao final do vídeo, o sistema voltará automaticamente para a escuta e sugestões.`
      );
    },
    [stopAllVoiceCapture, stopSpeechSynthesis]
  );

  // Encaminha pergunta sem vídeo específico para o Assistente do Projeto Thomas
  const askThomasAssistant = useCallback(
    async (questionText: string, fallbackAnswer?: string) => {
      stopSpeechSynthesis();
      setIsProcessingCommand(true);
      setLastSpokenText(questionText);
      setFeedbackMessage(`Consultando assistente sobre: "${questionText}"`);

      let finalAnswer =
        fallbackAnswer ||
        "No Projeto Thomas, utilizamos sensores IoT, drones e bioacústica para monitorar e proteger a Floresta Amazônica.";

      try {
        const res = await fetch("/api/thomas/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: questionText,
            fallbackAnswer,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.answer && typeof data.answer === "string") {
            finalAnswer = data.answer.trim();
          }
        }
      } catch (_) {
        // Mantém fallbackAnswer educativo local sem associar vídeo incorreto
      }

      setAssistantAnswer({
        question: questionText,
        answer: finalAnswer,
      });
      setIsProcessingCommand(false);
      setFeedbackMessage(
        "Resposta exibida abaixo. Você pode continuar falando pelo microfone ou clicar em outra pergunta sugerida."
      );

      if (
        speakAnswersRef.current &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        try {
          const utterance = new SpeechSynthesisUtterance(finalAnswer);
          utterance.lang = "pt-BR";
          utterance.rate = 1.02;
          utterance.onstart = () => setIsSpeakingAnswer(true);
          utterance.onend = () => setIsSpeakingAnswer(false);
          utterance.onerror = () => setIsSpeakingAnswer(false);
          window.speechSynthesis.speak(utterance);
        } catch (_) {
          setIsSpeakingAnswer(false);
        }
      }
    },
    [stopSpeechSynthesis]
  );

  // Processa comando falado ou digitado
  const processSpokenOrTypedCommand = useCallback(
    async (rawText: string) => {
      const cleaned = rawText.trim();
      if (!cleaned) return;
      if (phaseRef.current !== "listening") return;

      setLastSpokenText(cleaned);
      setInterimTranscript("");
      setIsProcessingCommand(true);

      // 1. Verifica se corresponde a uma das perguntas sugeridas (respeitando vídeo vs. assistente)
      const matchedSuggestion = findThomasSuggestedQuestion(cleaned);
      if (matchedSuggestion) {
        if (matchedSuggestion.targetTriggerId) {
          const target = THOMAS_TRIGGERS.find(
            (t) => t.id === matchedSuggestion.targetTriggerId
          );
          if (target) {
            setIsProcessingCommand(false);
            activateTriggerVideo(target);
            return;
          }
        }
        await askThomasAssistant(
          matchedSuggestion.question,
          matchedSuggestion.fallbackAnswer
        );
        return;
      }

      // 2. Correspondência local direta com os 3 gatilhos de vídeo
      const localResult = matchThomasTriggerLocal(cleaned);
      if (localResult.trigger) {
        setIsProcessingCommand(false);
        activateTriggerVideo(localResult.trigger);
        return;
      }

      // 3. Análise semântica exclusiva no servidor apenas para os 3 gatilhos
      try {
        const res = await fetch("/api/thomas/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: cleaned,
            triggers: THOMAS_TRIGGERS.map((t) => ({
              id: t.id,
              phrase: t.phrase,
              description: t.description,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const matched = THOMAS_TRIGGERS.find(
            (t) => t.id === data.matchedTriggerId
          );
          if (matched && typeof data.confidence === "number" && data.confidence >= 0.75) {
            setIsProcessingCommand(false);
            activateTriggerVideo(matched);
            return;
          }
        }
      } catch (_) {}

      // 4. Sem vídeo específico cadastrado: encaminha para o Assistente Thomas sem associar vídeo errado
      await askThomasAssistant(cleaned);
    },
    [activateTriggerVideo, askThomasAssistant]
  );

  // Gravação de áudio fallback (para navegadores móveis ou sem Web Speech API)
  const startMediaRecorderFallback = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicWarning(
          "Microfone indisponível neste navegador. Use os cartões sugeridos ou o campo de texto."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const chosenMime =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
          ? mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || ""
          : "";

      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecordingFallback(false);
        setIsListening(false);
        const chunks = [...audioChunksRef.current];
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        if (chunks.length === 0 || phaseRef.current !== "listening") return;

        const blob = new Blob(chunks, {
          type: recorder.mimeType || chosenMime || "audio/webm",
        });
        if (blob.size < 400) return;

        setIsProcessingCommand(true);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const response = await fetch("/api/transcribe-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioData: base64,
              mimeType: blob.type,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.transcript && data.transcript.trim()) {
              await processSpokenOrTypedCommand(data.transcript.trim());
              return;
            }
          }
          setFeedbackMessage(
            "Não foi possível entender a fala. Toque no microfone ou clique em uma pergunta sugerida."
          );
        } catch (_) {
          setMicWarning(
            "Erro ao transcrever áudio. Tente falar novamente ou clique em uma pergunta sugerida."
          );
        } finally {
          setIsProcessingCommand(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecordingFallback(true);
      setIsListening(true);
      setMicWarning("");

      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 6000);
    } catch (err: any) {
      setIsListening(false);
      setIsRecordingFallback(false);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setMicWarning(
          "Permissão de microfone bloqueada. Autorize o microfone no navegador e clique em Ativar Microfone."
        );
      } else {
        setMicWarning("Não foi possível acessar o microfone neste dispositivo.");
      }
    }
  }, [processSpokenOrTypedCommand]);

  // Inicia escuta nativa contínua em pt-BR (Web Speech API)
  const startVoiceRecognition = useCallback(
    async (triggeredByUserClick = false) => {
      if (phaseRef.current !== "listening") return;
      if (!voiceEnabledRef.current && !triggeredByUserClick) return;

      clearRestartTimer();

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const isMobileDevice =
        typeof window !== "undefined" && window.innerWidth < 768;

      if (!SpeechRecognitionClass || (isMobileDevice && triggeredByUserClick)) {
        if (triggeredByUserClick) {
          await startMediaRecorderFallback();
        } else {
          setMicWarning(
            "Toque em 'Ativar Microfone' para falar ou clique em uma das perguntas sugeridas."
          );
        }
        return;
      }

      if (triggeredByUserClick && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (err: any) {
          if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
            setMicWarning(
              "Permissão de microfone negada. Libere o acesso no cadeado do navegador."
            );
            return;
          }
        }
      }

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onend = null;
            recognitionRef.current.abort();
          } catch (_) {}
        }

        const rec = new SpeechRecognitionClass();
        rec.lang = "pt-BR";
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          if (phaseRef.current !== "listening") {
            try {
              rec.abort();
            } catch (_) {}
            return;
          }
          setIsListening(true);
          setMicWarning("");
        };

        rec.onresult = (event: any) => {
          let interim = "";
          let finalText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const chunk = event.results[i][0]?.transcript || "";
            if (event.results[i].isFinal) {
              finalText += chunk;
            } else {
              interim += chunk;
            }
          }

          if (interim) {
            setInterimTranscript(interim);
          }

          if (finalText.trim()) {
            setInterimTranscript("");
            processSpokenOrTypedCommand(finalText.trim());
          }
        };

        rec.onerror = (event: any) => {
          setIsListening(false);
          if (phaseRef.current !== "listening") return;

          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setMicWarning(
              "Clique em 'Ativar Microfone' para autorizar a escuta por voz ou clique diretamente em uma sugestão."
            );
            return;
          }

          if (event.error === "network") {
            if (triggeredByUserClick) {
              startMediaRecorderFallback();
            } else {
              setMicWarning(
                "Reconhecimento nativo sem conexão. Clique em 'Ativar Microfone' para usar gravação."
              );
            }
          }
        };

        rec.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
          if (phaseRef.current === "listening" && voiceEnabledRef.current) {
            clearRestartTimer();
            restartTimerRef.current = setTimeout(() => {
              if (phaseRef.current === "listening" && voiceEnabledRef.current) {
                startVoiceRecognition(false);
              }
            }, 350);
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (_) {
        setIsListening(false);
        setMicWarning(
          "Clique em 'Ativar Microfone' para falar ou escolha uma das perguntas sugeridas."
        );
      }
    },
    [processSpokenOrTypedCommand, startMediaRecorderFallback]
  );

  // Reativa escuta automaticamente ao retornar de qualquer vídeo
  useEffect(() => {
    if (phase === "listening" && voiceEnabled) {
      const timer = setTimeout(() => {
        if (phaseRef.current === "listening" && voiceEnabledRef.current) {
          startVoiceRecognition(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
    if (phase !== "listening") {
      stopAllVoiceCapture();
    }
  }, [phase, voiceEnabled, startVoiceRecognition, stopAllVoiceCapture]);

  // Limpa recursos ao desmontar
  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
      stopAllVoiceCapture();
    };
  }, [stopAllVoiceCapture, stopSpeechSynthesis]);

  // Encerramento do vídeo de introdução (uma única vez) ou de um gatilho
  const handleVideoEnded = useCallback(() => {
    if (phaseRef.current === "intro") {
      setIntroCompleted(true);
      setLastCompletedVideoId(THOMAS_INTRO_VIDEO.id);
      setActiveTrigger(null);
      setPhase("listening");
      setVoiceEnabled(true);
      setFeedbackMessage(
        "Introdução concluída. Fale pelo microfone ou clique em uma das 3 perguntas sugeridas."
      );
      return;
    }

    if (phaseRef.current === "playing_trigger") {
      const finishedTrigger = activeTrigger;
      if (finishedTrigger) {
        setLastCompletedVideoId(finishedTrigger.id);
      }
      setActiveTrigger(null);
      setPhase("listening");
      setVoiceEnabled(true);
      setFeedbackMessage(
        finishedTrigger
          ? `Vídeo "${finishedTrigger.phrase}" encerrado. Escolha uma nova pergunta clicando nas sugestões ou falando pelo microfone.`
          : "Reprodução encerrada. Escolha uma nova pergunta ou fale pelo microfone."
      );
    }
  }, [activeTrigger]);

  // Clique direto em uma das 3 perguntas sugeridas
  const handleSelectSuggestedQuestion = useCallback(
    async (suggestion: ThomasSuggestedQuestion) => {
      if (phaseRef.current !== "listening") return;

      if (suggestion.targetTriggerId) {
        const targetTrigger = THOMAS_TRIGGERS.find(
          (t) => t.id === suggestion.targetTriggerId
        );
        if (targetTrigger) {
          activateTriggerVideo(targetTrigger);
          return;
        }
      }

      await askThomasAssistant(suggestion.question, suggestion.fallbackAnswer);
    },
    [activateTriggerVideo, askThomasAssistant]
  );

  const handleToggleMicrophone = async () => {
    if (phase !== "listening") return;

    if (isListening || isRecordingFallback) {
      setVoiceEnabled(false);
      stopAllVoiceCapture();
      setFeedbackMessage(
        "Microfone pausado. Você pode clicar nas perguntas sugeridas ou reativar a escuta."
      );
      return;
    }

    stopSpeechSynthesis();
    setVoiceEnabled(true);
    setMicWarning("");
    await startVoiceRecognition(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() || phase !== "listening") return;
    const cmd = manualText;
    setManualText("");
    processSpokenOrTypedCommand(cmd);
  };

  const handleStartPresentation = useCallback(() => {
    if (phaseRef.current !== "welcome") return;
    setIntroCompleted(false);
    setActiveTrigger(null);
    setAssistantAnswer(null);
    setPlaybackNonce((prev) => prev + 1);
    setPhase("intro");
    setFeedbackMessage(
      "Reproduzindo vídeo de introdução uma única vez antes de liberar a escuta por voz."
    );
  }, []);

  const currentSuggestions =
    THOMAS_SUGGESTIONS_BY_VIDEO_ID[lastCompletedVideoId] ||
    THOMAS_SUGGESTIONS_BY_VIDEO_ID[THOMAS_INTRO_VIDEO.id];

  return (
    <div className="thomas-root min-h-screen relative flex flex-col overflow-x-hidden">
      {/* Plano de fundo escuro da Floresta Amazônica */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {!backdropError ? (
          <img
            src={THOMAS_BACKDROP_IMAGE}
            alt="Copa noturna da Floresta Amazônica"
            referrerPolicy="no-referrer"
            onError={() => setBackdropError(true)}
            className="w-full h-full object-cover object-center opacity-30"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040b07]/80 via-[#040b07]/90 to-[#030805]" />
        <div className="absolute inset-0 amazon-canopy-grid opacity-70" />
      </div>

      {/* Barra Superior (Contrato de 3 zonas limpo) */}
      <header className="relative z-10 border-b border-emerald-500/20 bg-[#040b07]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="thomas-display text-lg font-bold tracking-tight text-emerald-50 whitespace-nowrap shrink-0">
            Projeto Thomas
          </span>

          <nav
            aria-label="Indicadores do sistema"
            className="hidden md:flex items-center gap-6 text-sm text-emerald-200/80"
          >
            <span className="whitespace-nowrap shrink-0">Floresta Amazônica</span>
            <span className="text-emerald-500/40" aria-hidden="true">
              ·
            </span>
            <span className="whitespace-nowrap shrink-0">Drones e Sensores IoT</span>
            <span className="text-emerald-500/40" aria-hidden="true">
              ·
            </span>
            <span className="whitespace-nowrap shrink-0 thomas-mono text-xs text-[#39FF14]">
              {phase === "welcome"
                ? "Tela Inicial"
                : phase === "intro"
                ? "Etapa 1: Introdução"
                : phase === "playing_trigger"
                ? "Etapa: Reprodução Única"
                : "Escuta e Sugestões Ativas"}
            </span>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={phase !== "listening"}
              onClick={handleToggleMicrophone}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                phase === "listening" && (isListening || isRecordingFallback)
                  ? "bg-[#22c55e] text-[#031208] hover:bg-[#39FF14]"
                  : "bg-[#091810] text-emerald-100 border border-emerald-500/40 hover:border-[#39FF14]"
              }`}
            >
              {phase === "listening" && (isListening || isRecordingFallback) ? (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Ouvindo Voz</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>
                    {phase === "listening"
                      ? "Ativar Microfone"
                      : phase === "welcome"
                      ? "Aguardando Início"
                      : "Aguarde o Vídeo"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-10">
        {phase === "welcome" ? (
          <WelcomeScreen onStartPresentation={handleStartPresentation} />
        ) : (
          <>
            {/* Cabeçalho de Apresentação */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-emerald-500/15 pb-6">
              <div className="space-y-2 max-w-2xl">
                <p className="thomas-mono text-xs text-[#39FF14]">
                  Monitoramento Inteligente · {THOMAS_PROJECT_META.studentName}
                </p>
                <h1 className="thomas-display text-2xl sm:text-3xl font-bold text-emerald-50 tracking-tight text-balance">
                  {THOMAS_PROJECT_META.projectTitle}
                </h1>
                <p className="text-sm sm:text-base text-emerald-200/80">
                  {THOMAS_PROJECT_META.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs thomas-mono text-emerald-300/85 shrink-0">
                <Trees className="w-4 h-4 text-[#39FF14]" />
                <span>
                  {introCompleted
                    ? "Introdução concluída · Modo interativo liberado"
                    : "Exibindo apresentação inicial"}
                </span>
              </div>
            </section>

        {/* ÁREA CENTRAL: PALCO DO VÍDEO (Introdução única ou Gatilho ativo) */}
        {(phase === "intro" || (phase === "playing_trigger" && activeTrigger)) && (
          <section
            aria-label="Reprodução de vídeo"
            className="rounded-2xl bg-[#07150d]/90 border border-emerald-500/35 p-5 sm:p-7 amazon-glow-border"
          >
            {phase === "intro" ? (
              <YouTubeStage
                videoId={THOMAS_INTRO_VIDEO.youtubeId}
                label="Introdução"
                title={THOMAS_INTRO_VIDEO.shortTitle}
                playbackNonce={playbackNonce}
                isIntro={true}
                onVideoEnded={handleVideoEnded}
              />
            ) : activeTrigger ? (
              <YouTubeStage
                videoId={activeTrigger.youtubeId}
                label={activeTrigger.label}
                title={activeTrigger.phrase}
                playbackNonce={playbackNonce}
                isIntro={false}
                onVideoEnded={handleVideoEnded}
              />
            ) : null}
          </section>
        )}

        {/* ÁREA DE ESCUTA ATIVA POR VOZ + 3 PERGUNTAS SUGERIDAS */}
        {phase === "listening" && (
          <section
            aria-label="Central de escuta por voz e perguntas sugeridas"
            className="rounded-2xl bg-[#07150d]/95 border border-emerald-500/35 p-6 sm:p-8 amazon-glow-active space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Destaque Visual para o Microfone e Onda Sonora */}
              <div className="flex items-start sm:items-center gap-5">
                <button
                  type="button"
                  onClick={handleToggleMicrophone}
                  aria-label={
                    isListening || isRecordingFallback
                      ? "Pausar microfone"
                      : "Ativar microfone"
                  }
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    isListening || isRecordingFallback
                      ? "bg-[#22c55e] text-[#031208] hover:bg-[#39FF14] shadow-[0_0_24px_rgba(57,255,20,0.4)]"
                      : "bg-[#0c2417] text-emerald-200 border border-emerald-500/40 hover:border-[#39FF14]"
                  }`}
                >
                  {isListening || isRecordingFallback ? (
                    <Mic className="w-7 h-7" />
                  ) : (
                    <MicOff className="w-7 h-7" />
                  )}
                </button>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="thomas-display text-xl font-semibold text-emerald-50">
                      {isProcessingCommand
                        ? "Processando pergunta..."
                        : isListening || isRecordingFallback
                        ? "Microfone Ativo · Fale ou clique em uma sugestão"
                        : "Microfone pausado · Clique em uma sugestão ou reative a voz"}
                    </h2>

                    {(isListening || isRecordingFallback) && (
                      <div className="flex items-center gap-1 h-5" aria-hidden="true">
                        <span className="w-1 h-4 rounded-full bg-[#39FF14] thomas-wave-bar" />
                        <span
                          className="w-1 h-5 rounded-full bg-[#39FF14] thomas-wave-bar"
                          style={{ animationDelay: "0.15s" }}
                        />
                        <span
                          className="w-1 h-3.5 rounded-full bg-[#39FF14] thomas-wave-bar"
                          style={{ animationDelay: "0.3s" }}
                        />
                        <span
                          className="w-1 h-5 rounded-full bg-[#39FF14] thomas-wave-bar"
                          style={{ animationDelay: "0.45s" }}
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-emerald-200/80 leading-relaxed">
                    {interimTranscript
                      ? `Reconhecendo fala: "${interimTranscript}"`
                      : feedbackMessage}
                  </p>

                  {lastSpokenText && !interimTranscript && (
                    <p className="thomas-mono text-xs text-emerald-300/75">
                      Última pergunta selecionada: “{lastSpokenText}”
                    </p>
                  )}
                </div>
              </div>

              {/* Controle de Leitura em Voz Alta + Radar Bioacústico */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeakingAnswer) {
                      stopSpeechSynthesis();
                    } else {
                      setSpeakAnswersEnabled((prev) => !prev);
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-[#040c08] hover:bg-[#0a1d13] border border-emerald-500/25 text-xs font-medium text-emerald-100 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isSpeakingAnswer ? (
                    <>
                      <VolumeX className="w-4 h-4 text-amber-400" />
                      <span>Parar Leitura</span>
                    </>
                  ) : speakAnswersEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#39FF14]" />
                      <span>Voz nas Respostas: Ligada</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-emerald-400/70" />
                      <span>Voz nas Respostas: Desligada</span>
                    </>
                  )}
                </button>

                <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#040c08] border border-emerald-500/25">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 56 56"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="rgba(57,255,20,0.2)"
                      strokeWidth="1"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="14"
                      stroke="rgba(57,255,20,0.2)"
                      strokeWidth="1"
                    />
                    <g className="thomas-radar-sweep">
                      <path
                        d="M28 28L28 4A24 24 0 0 1 48 16Z"
                        fill="rgba(57, 255, 20, 0.2)"
                      />
                      <line
                        x1="28"
                        y1="28"
                        x2="28"
                        y2="4"
                        stroke="#39FF14"
                        strokeWidth="1.5"
                      />
                    </g>
                    <circle cx="28" cy="28" r="2.5" fill="#39FF14" />
                  </svg>
                  <div className="text-xs">
                    <div className="font-medium text-emerald-100">
                      Radar Ativo
                    </div>
                    <div className="thomas-mono text-emerald-400/80">
                      Voz + Sugestões
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {micWarning && (
              <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{micWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={() => startVoiceRecognition(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#09150d] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Autorizar Microfone
                </button>
              </div>
            )}

            {/* Resposta do Assistente (para perguntas sem vídeo específico cadastrado) */}
            {assistantAnswer && (
              <div className="rounded-xl bg-[#040f09] border border-teal-400/35 p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 thomas-mono text-teal-300">
                    <MessageSquareText className="w-4 h-4 text-teal-400" />
                    <span>Resposta do Assistente Amazônico</span>
                  </span>
                  <span className="text-emerald-300/75">
                    Pergunta: “{assistantAnswer.question}”
                  </span>
                </div>
                <p className="text-sm sm:text-base text-emerald-50 leading-relaxed">
                  {assistantAnswer.answer}
                </p>
              </div>
            )}

            {/* 3 Perguntas Sugeridas Contextuais Após o Vídeo */}
            <SuggestedQuestionsPanel
              lastCompletedVideoId={lastCompletedVideoId}
              suggestions={currentSuggestions}
              isBusy={isProcessingCommand}
              onSelectSuggestion={handleSelectSuggestedQuestion}
            />

            {/* Campo alternativo de texto para acessibilidade e testes sem microfone */}
            <form
              onSubmit={handleManualSubmit}
              className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-emerald-500/15"
            >
              <label htmlFor="thomas-command-input" className="sr-only">
                Digite uma pergunta ou comando do Projeto Thomas
              </label>
              <input
                id="thomas-command-input"
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder='Ou digite uma pergunta: "Me fale dos animais da Amazônia", "Como drones podem ajudar"...'
                className="flex-1 bg-[#040b07] border border-emerald-500/30 focus:border-[#39FF14] rounded-lg px-4 py-2.5 text-sm text-emerald-50 placeholder-emerald-400/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!manualText.trim() || isProcessingCommand}
                className="px-5 py-2.5 rounded-lg bg-[#0d2818] hover:bg-[#22c55e] text-emerald-100 hover:text-[#031208] border border-emerald-500/40 hover:border-[#39FF14] disabled:opacity-45 disabled:pointer-events-none text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Pergunta</span>
              </button>
            </form>
          </section>
        )}

        {/* Aviso contextual durante a introdução única */}
        {phase === "intro" && (
          <div className="rounded-xl bg-[#07150d]/80 border border-emerald-500/20 px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm text-emerald-200/85">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-[#39FF14] shrink-0" />
              <span>
                Após a exibição única da introdução, o microfone e as três perguntas sugeridas serão exibidos automaticamente.
              </span>
            </div>
            <span className="thomas-mono text-xs text-emerald-400/80">
              Sem repetição automática
            </span>
          </div>
        )}

            {/* Widgets de Monitoramento Amazônico + Os 3 Gatilhos */}
            <AmazonTelemetryWidgets
              activeTriggerId={activeTrigger?.id ?? null}
              playedTriggerIds={playedTriggerIds}
              disabled={phase !== "listening"}
              onSelectTrigger={(trigger) => {
                if (phase === "listening") {
                  activateTriggerVideo(trigger);
                }
              }}
            />
          </>
        )}
      </main>

      {/* Rodapé limpo */}
      <footer className="relative z-10 border-t border-emerald-500/15 bg-[#040b07]/90 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-emerald-300/70">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#39FF14]" />
            <span>
              Projeto Thomas · Monitoramento Inteligente da Floresta Amazônica
            </span>
          </span>
          <span className="thomas-mono text-emerald-400/65">
            Apresentação Escolar Interativa
          </span>
        </div>
      </footer>
    </div>
  );
}
