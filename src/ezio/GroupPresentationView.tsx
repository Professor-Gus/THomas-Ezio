import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  AlertCircle,
  MessageSquareText,
  Trophy,
  ArrowLeft,
  RotateCcw,
  Cpu,
  Radio,
  Compass,
  ShieldCheck,
  Trees,
  Play,
  Check,
  Sparkles,
  PawPrint,
  Radar,
} from "lucide-react";
import {
  EzioGroupConfig,
  EzioSuggestedQuestion,
  EzioTrigger,
  findGroupSuggestedQuestion,
  matchGroupTrigger,
} from "./groupsConfig";
import { YouTubeStage } from "./YouTubeStage";

type PresentationPhase = "intro" | "listening" | "playing_trigger" | "ended";

interface GroupPresentationViewProps {
  group: EzioGroupConfig;
  onBackToGroups: () => void;
  onOpenQuizzes: () => void;
}

export const GroupPresentationView: React.FC<GroupPresentationViewProps> = ({
  group,
  onBackToGroups,
  onOpenQuizzes,
}) => {
  const [phase, setPhase] = useState<PresentationPhase>("intro");
  const [introCompleted, setIntroCompleted] = useState<boolean>(false);
  const [activeTrigger, setActiveTrigger] = useState<EzioTrigger | null>(null);
  const [lastCompletedVideoId, setLastCompletedVideoId] = useState<string>(
    group.introVideo.id
  );
  const [playbackNonce, setPlaybackNonce] = useState<number>(1);
  const [playedTriggerIds, setPlayedTriggerIds] = useState<string[]>([]);
  const [triggerImgErrors, setTriggerImgErrors] = useState<Record<string, boolean>>({});

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

  const phaseRef = useRef<PresentationPhase>(phase);
  phaseRef.current = phase;
  const voiceEnabledRef = useRef<boolean>(voiceEnabled);
  voiceEnabledRef.current = voiceEnabled;
  const speakAnswersRef = useRef<boolean>(speakAnswersEnabled);
  speakAnswersRef.current = speakAnswersEnabled;
  const groupRef = useRef<EzioGroupConfig>(group);
  groupRef.current = group;

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastCommandGuardRef = useRef<{ text: string; ts: number }>({ text: "", ts: 0 });

  const isCyan = group.accentTone === "cyan";
  const accentText = isCyan ? "text-cyan-300" : "text-[#39FF14]";
  const accentBorder = isCyan ? "border-cyan-500/35" : "border-emerald-500/35";
  const accentGlow = isCyan ? "ezio-glow-cyan" : "ezio-glow-emerald";
  const primaryButtonClass = isCyan
    ? "bg-cyan-400 hover:bg-cyan-300 text-[#031318]"
    : "bg-[#22c55e] hover:bg-[#39FF14] text-[#031208]";

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

  useEffect(() => {
    stopSpeechSynthesis();
    stopAllVoiceCapture();
    setPhase("intro");
    setIntroCompleted(false);
    setActiveTrigger(null);
    setLastCompletedVideoId(group.introVideo.id);
    setPlaybackNonce((prev) => prev + 1);
    setPlayedTriggerIds([]);
    setAssistantAnswer(null);
    setLastSpokenText("");
    setMicWarning("");
    setManualText("");
    setFeedbackMessage(
      "Reproduzindo vídeo de introdução uma única vez antes de liberar a escuta por voz."
    );
  }, [group.id, group.introVideo.id, stopAllVoiceCapture, stopSpeechSynthesis]);

  const activateTriggerVideo = useCallback(
    (trigger: EzioTrigger) => {
      if (phaseRef.current !== "listening") return;
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
        trigger.isFarewell
          ? `Gatilho de encerramento "${trigger.phrase}" ativado. A apresentação será finalizada após este vídeo.`
          : `Gatilho ativado: "${trigger.phrase}". Ao final do vídeo, o sistema voltará automaticamente para a escuta.`
      );
    },
    [stopAllVoiceCapture, stopSpeechSynthesis]
  );

  const askEzioAssistant = useCallback(
    async (questionText: string, fallbackAnswer?: string) => {
      const currentGroup = groupRef.current;
      stopSpeechSynthesis();
      setIsProcessingCommand(true);
      setLastSpokenText(questionText);
      setFeedbackMessage(`Consultando ${currentGroup.assistantName} sobre: "${questionText}"`);

      let finalAnswer =
        fallbackAnswer ||
        `No tema "${currentGroup.themeTitle}", combinamos ciência ambiental, sensores e preservação da biodiversidade. Continue falando pelos gatilhos cadastrados ou explore os quizzes.`;

      try {
        const res = await fetch("/api/ezio/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: questionText,
            groupName: currentGroup.name,
            ecosystem: currentGroup.ecosystemBadge,
            themeTitle: currentGroup.themeTitle,
            fallbackAnswer,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.answer && typeof data.answer === "string") {
            finalAnswer = data.answer.trim();
          }
        }
      } catch (_) {}

      setAssistantAnswer({
        question: questionText,
        answer: finalAnswer,
      });
      setIsProcessingCommand(false);
      setFeedbackMessage(
        "Resposta exibida abaixo. Fale outro comando pelo microfone ou escolha um gatilho da apresentação."
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

  const processSpokenOrTypedCommand = useCallback(
    async (rawText: string) => {
      const cleaned = rawText.trim();
      if (!cleaned) return;
      if (phaseRef.current !== "listening") return;

      const now = Date.now();
      if (
        lastCommandGuardRef.current.text.toLowerCase() === cleaned.toLowerCase() &&
        now - lastCommandGuardRef.current.ts < 1800
      ) {
        return;
      }
      lastCommandGuardRef.current = { text: cleaned, ts: now };

      const currentGroup = groupRef.current;
      setLastSpokenText(cleaned);
      setInterimTranscript("");
      setIsProcessingCommand(true);

      const matchedSuggestion = findGroupSuggestedQuestion(currentGroup, cleaned);
      if (matchedSuggestion) {
        if (matchedSuggestion.targetTriggerId) {
          const target = currentGroup.triggers.find(
            (t) => t.id === matchedSuggestion.targetTriggerId
          );
          if (target) {
            setIsProcessingCommand(false);
            activateTriggerVideo(target);
            return;
          }
        }
        await askEzioAssistant(
          matchedSuggestion.question,
          matchedSuggestion.fallbackAnswer
        );
        return;
      }

      const localResult = matchGroupTrigger(currentGroup, cleaned);
      if (localResult.trigger) {
        setIsProcessingCommand(false);
        activateTriggerVideo(localResult.trigger);
        return;
      }

      try {
        const res = await fetch("/api/ezio/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: cleaned,
            groupId: currentGroup.id,
            ecosystem: currentGroup.ecosystemBadge,
            triggers: currentGroup.triggers.map((t) => ({
              id: t.id,
              phrase: t.phrase,
              description: t.description,
              keywords: t.keywords,
            })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const matched = currentGroup.triggers.find(
            (t) => t.id === data.matchedTriggerId
          );
          if (matched && typeof data.confidence === "number" && data.confidence >= 0.75) {
            setIsProcessingCommand(false);
            activateTriggerVideo(matched);
            return;
          }
        }
      } catch (_) {}

      await askEzioAssistant(cleaned);
    },
    [activateTriggerVideo, askEzioAssistant]
  );

  const startMediaRecorderFallback = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicWarning(
          "Microfone indisponível neste navegador. Use os cartões de comando ou o campo de texto abaixo."
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
            "Não foi possível entender a fala. Toque no microfone ou clique em um dos comandos."
          );
        } catch (_) {
          setMicWarning(
            "Erro ao transcrever áudio. Tente falar novamente ou clique em um gatilho."
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
          "Permissão de microfone bloqueada. Autorize no navegador e clique em Ativar Microfone."
        );
      } else {
        setMicWarning("Não foi possível acessar o microfone neste dispositivo.");
      }
    }
  }, [processSpokenOrTypedCommand]);

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
            "Toque em 'Ativar Microfone' para falar ou clique diretamente nos gatilhos disponíveis."
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
              "Clique em 'Ativar Microfone' para autorizar a escuta por voz ou selecione uma opção na tela."
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
          "Clique em 'Ativar Microfone' para falar ou selecione um dos comandos."
        );
      }
    },
    [processSpokenOrTypedCommand, startMediaRecorderFallback]
  );

  useEffect(() => {
    if (phase === "listening" && voiceEnabled) {
      const timer = setTimeout(() => {
        if (phaseRef.current === "listening" && voiceEnabledRef.current) {
          startVoiceRecognition(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
    stopAllVoiceCapture();
  }, [phase, voiceEnabled, startVoiceRecognition, stopAllVoiceCapture]);

  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
      stopAllVoiceCapture();
    };
  }, [stopAllVoiceCapture, stopSpeechSynthesis]);

  const handleVideoEnded = useCallback(() => {
    if (phaseRef.current === "intro") {
      setIntroCompleted(true);
      setLastCompletedVideoId(group.introVideo.id);
      setActiveTrigger(null);
      setPhase("listening");
      setVoiceEnabled(true);
      setFeedbackMessage(
        group.suggestedQuestionsByVideoId
          ? "Introdução concluída. Fale pelo microfone ou clique em uma das 3 perguntas sugeridas."
          : "Introdução concluída. Microfone ativo — fale um dos comandos cadastrados para assistir ao vídeo correspondente."
      );
      return;
    }

    if (phaseRef.current === "playing_trigger") {
      const finishedTrigger = activeTrigger;

      if (finishedTrigger?.isFarewell) {
        stopSpeechSynthesis();
        stopAllVoiceCapture();
        setActiveTrigger(null);
        setPhase("ended");
        setFeedbackMessage("Apresentação encerrada oficialmente.");
        return;
      }

      if (finishedTrigger) {
        setLastCompletedVideoId(finishedTrigger.id);
      }
      setActiveTrigger(null);
      setPhase("listening");
      setVoiceEnabled(true);
      setFeedbackMessage(
        finishedTrigger
          ? `Vídeo "${finishedTrigger.phrase}" encerrado. Microfone reativado para uma nova interação.`
          : "Reprodução encerrada. Microfone reativado para nova interação."
      );
    }
  }, [activeTrigger, group.introVideo.id, group.suggestedQuestionsByVideoId, stopAllVoiceCapture, stopSpeechSynthesis]);

  const handleSelectSuggestedQuestion = useCallback(
    async (suggestion: EzioSuggestedQuestion) => {
      if (phaseRef.current !== "listening") return;

      if (suggestion.targetTriggerId) {
        const targetTrigger = group.triggers.find(
          (t) => t.id === suggestion.targetTriggerId
        );
        if (targetTrigger) {
          activateTriggerVideo(targetTrigger);
          return;
        }
      }

      await askEzioAssistant(suggestion.question, suggestion.fallbackAnswer);
    },
    [activateTriggerVideo, askEzioAssistant, group.triggers]
  );

  const handleToggleMicrophone = async () => {
    if (phase !== "listening") return;

    if (isListening || isRecordingFallback) {
      setVoiceEnabled(false);
      stopAllVoiceCapture();
      setFeedbackMessage(
        "Microfone pausado. Clique em um gatilho ou reative a escuta por voz."
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

  const handleRestartPresentation = () => {
    stopSpeechSynthesis();
    stopAllVoiceCapture();
    setIntroCompleted(false);
    setActiveTrigger(null);
    setLastCompletedVideoId(group.introVideo.id);
    setPlayedTriggerIds([]);
    setAssistantAnswer(null);
    setPlaybackNonce((prev) => prev + 1);
    setPhase("intro");
    setFeedbackMessage(
      "Reproduzindo vídeo de introdução uma única vez antes de liberar a escuta por voz."
    );
  };

  const renderSuggestionIcon = (iconType: EzioSuggestedQuestion["iconType"]) => {
    switch (iconType) {
      case "fauna":
        return <PawPrint className="w-4 h-4 text-[#39FF14] shrink-0" />;
      case "drone":
        return <Radar className="w-4 h-4 text-cyan-300 shrink-0" />;
      case "sensor":
        return <Radio className="w-4 h-4 text-[#39FF14] shrink-0" />;
      case "shield":
        return <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-300 shrink-0" />;
    }
  };

  const currentSuggestions = group.suggestedQuestionsByVideoId
    ? group.suggestedQuestionsByVideoId[lastCompletedVideoId] ||
      group.suggestedQuestionsByVideoId[group.introVideo.id]
    : null;

  return (
    <div className="space-y-8">
      {/* Cabeçalho de Contexto do Grupo Selecionado */}
      <section
        aria-label="Contexto do grupo"
        className={`rounded-2xl bg-[#06130f]/95 border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${accentBorder}`}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5 text-xs ezio-mono">
            <span className={`font-semibold ${accentText}`}>
              {group.groupNumberLabel} · {group.name}
            </span>
            <span className="text-emerald-500/40" aria-hidden="true">
              ·
            </span>
            <span className="text-emerald-200/85">{group.ecosystemBadge}</span>
          </div>
          <h1 className="ezio-display text-2xl sm:text-3xl font-bold text-emerald-50 tracking-tight text-balance">
            {group.themeTitle}
          </h1>
          <p className="text-sm text-emerald-200/75">{group.assistantName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            disabled={phase !== "listening"}
            onClick={handleToggleMicrophone}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
              phase === "listening" && (isListening || isRecordingFallback)
                ? primaryButtonClass
                : "bg-[#081913] text-emerald-100 border border-emerald-500/35 hover:border-cyan-400"
            }`}
          >
            {phase === "listening" && (isListening || isRecordingFallback) ? (
              <>
                <Mic className="w-4 h-4" />
                <span>Microfone Ativo</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4" />
                <span>
                  {phase === "listening"
                    ? "Ativar Microfone"
                    : phase === "ended"
                    ? "Encerrado"
                    : "Aguarde o Vídeo"}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeechSynthesis();
              stopAllVoiceCapture();
              onOpenQuizzes();
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0b2329] hover:bg-cyan-400 text-cyan-200 hover:text-[#031318] border border-cyan-400/45 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trophy className="w-4 h-4" />
            <span>QUIZZES DOS ECOSSISTEMAS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeechSynthesis();
              stopAllVoiceCapture();
              onBackToGroups();
            }}
            className="px-4 py-2.5 rounded-xl bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/30 text-emerald-100 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trocar Grupo</span>
          </button>
        </div>
      </section>

      {/* PALCO DO VÍDEO (Introdução única ou Gatilho ativo) */}
      {(phase === "intro" || (phase === "playing_trigger" && activeTrigger)) && (
        <section
          aria-label="Reprodução de vídeo"
          className={`rounded-2xl bg-[#06130f]/95 border p-5 sm:p-7 ${accentBorder} ${accentGlow}`}
        >
          {phase === "intro" ? (
            <YouTubeStage
              videoId={group.introVideo.youtubeId}
              label="Introdução"
              title={group.introVideo.title}
              playbackNonce={playbackNonce}
              accentTone={group.accentTone}
              isIntro={true}
              onVideoEnded={handleVideoEnded}
            />
          ) : activeTrigger ? (
            <YouTubeStage
              videoId={activeTrigger.youtubeId}
              label={activeTrigger.label}
              title={activeTrigger.phrase}
              playbackNonce={playbackNonce}
              accentTone={group.accentTone}
              isFarewell={Boolean(activeTrigger.isFarewell)}
              onVideoEnded={handleVideoEnded}
            />
          ) : null}
        </section>
      )}

      {/* TELA DE ENCERRAMENTO OFICIAL (Gatilho de despedida do Grupo 2) */}
      {phase === "ended" && (
        <section
          aria-label="Apresentação encerrada"
          className="rounded-2xl bg-[#06130f]/95 border border-cyan-400/45 ezio-glow-cyan p-8 sm:p-10 text-center space-y-6"
        >
          <div className="space-y-2 max-w-2xl mx-auto">
            <p className="ezio-mono text-xs text-cyan-300">
              {group.groupNumberLabel} · {group.name}
            </p>
            <h2 className="ezio-display text-2xl sm:text-3xl font-bold text-emerald-50">
              Apresentação Encerrada
            </h2>
            <p className="text-sm sm:text-base text-emerald-200/85 leading-relaxed">
              Obrigado por acompanhar a apresentação sobre {group.ecosystemBadge}! Você pode reiniciar este assistente, escolher outro grupo ou testar seus conhecimentos nos Quizzes dos Ecossistemas.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onOpenQuizzes}
              className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#031318] ezio-display font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trophy className="w-4 h-4" />
              <span>QUIZZES DOS ECOSSISTEMAS</span>
            </button>

            <button
              type="button"
              onClick={handleRestartPresentation}
              className="px-6 py-3 rounded-xl bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/40 text-emerald-100 ezio-display font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar Apresentação</span>
            </button>

            <button
              type="button"
              onClick={onBackToGroups}
              className="px-6 py-3 rounded-xl bg-[#081913] hover:bg-[#0d271e] border border-cyan-400/35 text-cyan-200 ezio-display font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Seleção de Grupos</span>
            </button>
          </div>
        </section>
      )}

      {/* CENTRAL DE ESCUTA ATIVA + PERGUNTAS SUGERIDAS (quando aplicável) */}
      {phase === "listening" && (
        <section
          aria-label="Central de interação por voz"
          className={`rounded-2xl bg-[#06130f]/95 border p-6 sm:p-8 space-y-6 ${accentBorder} ${accentGlow}`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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
                    ? `${primaryButtonClass} shadow-[0_0_24px_rgba(34,211,238,0.28)]`
                    : "bg-[#0a2119] text-emerald-200 border border-emerald-500/35 hover:border-cyan-400"
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
                  <h2 className="ezio-display text-xl font-semibold text-emerald-50">
                    {isProcessingCommand
                      ? "Processando comando..."
                      : isListening || isRecordingFallback
                      ? "Escuta por Voz Ativa · Fale ou escolha um gatilho"
                      : "Microfone pausado · Clique em um comando ou reative a voz"}
                  </h2>

                  {(isListening || isRecordingFallback) && (
                    <div className="flex items-center gap-1 h-5" aria-hidden="true">
                      <span className="w-1 h-4 rounded-full bg-[#39FF14] ezio-wave-bar" />
                      <span
                        className="w-1 h-5 rounded-full bg-cyan-400 ezio-wave-bar"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1 h-3.5 rounded-full bg-[#39FF14] ezio-wave-bar"
                        style={{ animationDelay: "0.3s" }}
                      />
                      <span
                        className="w-1 h-5 rounded-full bg-cyan-400 ezio-wave-bar"
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
                  <p className="ezio-mono text-xs text-cyan-300/85">
                    Última interação: “{lastSpokenText}”
                  </p>
                )}
              </div>
            </div>

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
                className="px-3.5 py-2.5 rounded-xl bg-[#030b08] hover:bg-[#091c15] border border-emerald-500/25 text-xs font-medium text-emerald-100 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isSpeakingAnswer ? (
                  <>
                    <VolumeX className="w-4 h-4 text-amber-400" />
                    <span>Parar Leitura</span>
                  </>
                ) : speakAnswersEnabled ? (
                  <>
                    <Volume2 className={`w-4 h-4 ${accentText}`} />
                    <span>Voz nas Respostas: Ligada</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-emerald-400/70" />
                    <span>Voz nas Respostas: Desligada</span>
                  </>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#030b08] border border-emerald-500/25">
                <svg width="38" height="38" viewBox="0 0 56 56" fill="none" aria-hidden="true">
                  <circle cx="28" cy="28" r="24" stroke="rgba(34,211,238,0.22)" strokeWidth="1" />
                  <circle cx="28" cy="28" r="14" stroke="rgba(57,255,20,0.22)" strokeWidth="1" />
                  <g className="ezio-radar-sweep">
                    <path d="M28 28L28 4A24 24 0 0 1 48 16Z" fill="rgba(34,211,238,0.22)" />
                    <line x1="28" y1="28" x2="28" y2="4" stroke="#22D3EE" strokeWidth="1.5" />
                  </g>
                  <circle cx="28" cy="28" r="2.5" fill="#39FF14" />
                </svg>
                <div className="text-xs">
                  <div className="font-medium text-emerald-100">EZIO Escuta</div>
                  <div className={`ezio-mono ${accentText}`}>{group.ecosystemBadge}</div>
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

          {assistantAnswer && (
            <div className="rounded-xl bg-[#030c09] border border-cyan-400/35 p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 ezio-mono text-cyan-300">
                  <MessageSquareText className="w-4 h-4 text-cyan-400" />
                  <span>{group.assistantName}</span>
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

          {/* Perguntas Sugeridas do Grupo 1 (Thomas) preservadas integralmente */}
          {currentSuggestions && currentSuggestions.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-emerald-500/15">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#39FF14]" />
                  <h3 className="ezio-display text-base sm:text-lg font-semibold text-emerald-50">
                    Perguntas Sugeridas para Continuar
                  </h3>
                </div>
                <span className="ezio-mono text-xs text-emerald-300/75">
                  Clique em uma opção ou fale pelo microfone
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {currentSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isProcessingCommand}
                    onClick={() => handleSelectSuggestedQuestion(item)}
                    className="group text-left rounded-xl bg-[#040d09] hover:bg-[#0a2117] border border-emerald-500/30 hover:border-[#39FF14] p-4 flex flex-col justify-between gap-3 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#081b12] border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                        {renderSuggestionIcon(item.iconType)}
                      </div>
                      <span className="text-sm font-medium text-emerald-50 leading-snug">
                        {item.question}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] ezio-mono text-emerald-300/75 pt-2 border-t border-emerald-500/10">
                      <span>
                        {item.targetTriggerId ? "Abre vídeo do tema" : "Resposta do assistente"}
                      </span>
                      <span className="text-[#39FF14] group-hover:translate-x-0.5 transition-transform">
                        Selecionar →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campo alternativo de texto */}
          <form
            onSubmit={handleManualSubmit}
            className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-emerald-500/15"
          >
            <label htmlFor="ezio-command-input" className="sr-only">
              Digite uma pergunta ou comando para {group.name}
            </label>
            <input
              id="ezio-command-input"
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={`Ou digite um comando: "${group.triggers[0]?.phrase}"...`}
              className="flex-1 bg-[#030a08] border border-emerald-500/30 focus:border-cyan-400 rounded-lg px-4 py-2.5 text-sm text-emerald-50 placeholder-emerald-400/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isProcessingCommand}
              className="px-5 py-2.5 rounded-lg bg-[#0a221b] hover:bg-cyan-400 text-emerald-100 hover:text-[#031318] border border-emerald-500/40 hover:border-cyan-300 disabled:opacity-45 disabled:pointer-events-none text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </form>
        </section>
      )}

      {phase === "intro" && (
        <div className="rounded-xl bg-[#06130f]/85 border border-emerald-500/20 px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm text-emerald-200/85">
          <div className="flex items-center gap-3">
            <Volume2 className={`w-4 h-4 ${accentText} shrink-0`} />
            <span>
              Após a introdução única deste grupo, o reconhecimento de voz será habilitado automaticamente.
            </span>
          </div>
          <span className="ezio-mono text-xs text-emerald-300/75">
            {introCompleted ? "Introdução concluída" : "Reprodução única (sem loop)"}
          </span>
        </div>
      )}

      {/* Métricas IoT do Ecossistema */}
      <section aria-label="Sensores e métricas ambientais" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {group.iotMetrics.map((metric) => (
            <div
              key={metric.id}
              className="rounded-xl bg-[#06130f]/90 border border-emerald-500/20 p-4 space-y-1.5"
            >
              <span className="text-xs text-emerald-300/75 block">{metric.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="ezio-mono text-2xl font-bold text-emerald-50">
                  {metric.value}
                </span>
                <span className={`ezio-mono text-xs font-medium ${accentText}`}>
                  {metric.unit}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400/75 block">
                {metric.detail}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#06130f]/90 border border-cyan-500/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <p className={`ezio-mono text-xs ${accentText}`}>
              {group.architectureSummary.kicker}
            </p>
            <h3 className="ezio-display text-lg font-semibold text-emerald-50">
              {group.architectureSummary.title}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
              {group.architectureSummary.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs ezio-mono text-emerald-200/90 shrink-0">
            <Compass className="w-4 h-4 text-cyan-300" />
            <span>{group.architectureSummary.highlights.join(" · ")}</span>
          </div>
        </div>
      </section>

      {/* Gatilhos de Voz Exclusivos deste Grupo */}
      <section aria-label="Gatilhos de voz do grupo" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ezio-display text-xl font-semibold text-emerald-50">
              Gatilhos de Voz · {group.name}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/75">
              Fale uma das frases cadastradas ou clique no card desejado para reproduzir o vídeo correspondente uma única vez.
            </p>
          </div>
          <span className={`ezio-mono text-xs ${accentText}`}>
            {group.triggers.length} comandos exclusivos
          </span>
        </div>

        <div
          className={`grid grid-cols-1 gap-5 ${
            group.triggers.length >= 4 ? "md:grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          {group.triggers.map((trigger) => {
            const isActive = activeTrigger?.id === trigger.id;
            const wasPlayed = playedTriggerIds.includes(trigger.id);
            const isDisabled = phase !== "listening";
            const imgBroken = Boolean(triggerImgErrors[trigger.id]);

            return (
              <button
                key={trigger.id}
                type="button"
                disabled={isDisabled}
                onClick={() => activateTriggerVideo(trigger)}
                className={`text-left rounded-2xl overflow-hidden bg-[#06130f]/95 border transition-colors flex flex-col justify-between ${
                  isActive
                    ? `border-cyan-400 ${accentGlow}`
                    : "border-emerald-500/25 hover:border-cyan-400/70"
                } ${
                  isDisabled
                    ? "opacity-75 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="relative aspect-[16/9] w-full bg-[#030a08] overflow-hidden">
                  {!imgBroken ? (
                    <img
                      src={trigger.imageUrl}
                      alt={trigger.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setTriggerImgErrors((prev) => ({
                          ...prev,
                          [trigger.id]: true,
                        }))
                      }
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#062415] to-[#041824] flex items-center justify-center">
                      <Trees className="w-10 h-10 text-emerald-400/50" />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#06130f] via-black/30 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] ezio-mono">
                    <span className={accentText}>{trigger.sensorTag}</span>
                    {wasPlayed && (
                      <span className="flex items-center gap-1 text-emerald-200">
                        <Check className="w-3.5 h-3.5 text-[#39FF14]" />
                        <span>Reproduzido</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs ezio-mono text-emerald-300/80">
                      <span>{trigger.label}</span>
                      {trigger.isFarewell && (
                        <span className="text-cyan-300">Encerra apresentação</span>
                      )}
                    </div>
                    <h3 className="ezio-display text-lg font-bold text-emerald-50">
                      “{trigger.phrase}”
                    </h3>
                    <p className="text-xs text-emerald-200/75 leading-relaxed">
                      {trigger.description}
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-xs font-semibold ${accentText} pt-2 border-t border-emerald-500/15`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {phase === "listening"
                        ? "Reproduzir este gatilho"
                        : phase === "ended"
                        ? "Apresentação encerrada"
                        : "Aguarde término do vídeo atual"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
