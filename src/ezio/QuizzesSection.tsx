import React, { useState } from "react";
import {
  Trophy,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trees,
  Sparkles,
} from "lucide-react";
import {
  EZIO_QUIZZES,
  EzioQuizConfig,
  POINTS_PER_CORRECT_ANSWER,
  getQuizPerformanceMessage,
} from "./quizzesConfig";

interface QuizzesSectionProps {
  hasActiveGroup: boolean;
  onBackToPresentation: () => void;
}

const OPTION_STYLES = [
  {
    letter: "A",
    shape: "▲",
    base: "bg-rose-600/90 hover:bg-rose-500 border-rose-400 text-white",
  },
  {
    letter: "B",
    shape: "◆",
    base: "bg-blue-600/90 hover:bg-blue-500 border-blue-400 text-white",
  },
  {
    letter: "C",
    shape: "●",
    base: "bg-amber-600/95 hover:bg-amber-500 border-amber-400 text-white",
  },
  {
    letter: "D",
    shape: "■",
    base: "bg-emerald-600/90 hover:bg-emerald-500 border-emerald-400 text-white",
  },
] as const;

export const QuizzesSection: React.FC<QuizzesSectionProps> = ({
  hasActiveGroup,
  onBackToPresentation,
}) => {
  const [selectedQuiz, setSelectedQuiz] = useState<EzioQuizConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const startQuiz = (quiz: EzioQuizConfig) => {
    setSelectedQuiz(quiz);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setCorrectCount(0);
    setIsFinished(false);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (!selectedQuiz || selectedOption !== null) return;
    setSelectedOption(optionIndex);
    const currentQuestion = selectedQuiz.questions[currentIndex];
    if (optionIndex === currentQuestion.correctIndex) {
      setScore((prev) => prev + POINTS_PER_CORRECT_ANSWER);
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedQuiz) return;
    if (currentIndex + 1 >= selectedQuiz.questions.length) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
  };

  // 1. TELA DE SELEÇÃO DOS QUIZZES (SOMENTE AMAZÔNIA E TAIGA)
  if (!selectedQuiz) {
    return (
      <section aria-label="Quizzes dos Ecossistemas" className="space-y-8 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
          <div className="space-y-1.5">
            <p className="ezio-mono text-xs text-cyan-300">
              Desafio Interativo · 5 Perguntas · Máximo 5.000 pontos
            </p>
            <h1 className="ezio-display text-2xl sm:text-3xl font-bold text-emerald-50">
              QUIZZES DOS ECOSSISTEMAS
            </h1>
            <p className="text-sm text-emerald-200/80">
              Escolha um dos dois ecossistemas abaixo para iniciar o questionário no estilo desafio em sala.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToPresentation}
            className="px-4 py-2.5 rounded-lg bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/35 text-emerald-100 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {hasActiveGroup ? "Voltar à Apresentação" : "Voltar à Seleção de Grupos"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EZIO_QUIZZES.map((quiz) => {
            const isCyan = quiz.accentTone === "cyan";
            const imgBroken = Boolean(imgErrors[quiz.id]);

            return (
              <article
                key={quiz.id}
                className={`rounded-2xl overflow-hidden bg-[#06130f]/95 border flex flex-col ${
                  isCyan
                    ? "border-cyan-500/35 ezio-glow-cyan"
                    : "border-emerald-500/35 ezio-glow-emerald"
                }`}
              >
                <div className="relative aspect-[16/9] w-full bg-[#030a08] overflow-hidden">
                  {!imgBroken ? (
                    <img
                      src={quiz.coverImage}
                      alt={quiz.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImgErrors((prev) => ({ ...prev, [quiz.id]: true }))
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
                  <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between text-xs ezio-mono">
                    <span className={isCyan ? "text-cyan-300" : "text-[#39FF14]"}>
                      {quiz.ecosystem}
                    </span>
                    <span className="text-emerald-100">
                      {quiz.questions.length} perguntas · {quiz.maxPoints} pts
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div className="space-y-2">
                    <h2 className="ezio-display text-2xl font-bold text-emerald-50">
                      {quiz.title}
                    </h2>
                    <p className="text-xs font-medium text-emerald-300/85">
                      {quiz.subtitle}
                    </p>
                    <p className="text-sm text-emerald-200/80 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startQuiz(quiz)}
                    className={`w-full py-3.5 px-6 rounded-xl ezio-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      isCyan
                        ? "bg-cyan-400 hover:bg-cyan-300 text-[#031318]"
                        : "bg-[#22c55e] hover:bg-[#39FF14] text-[#031208]"
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>INICIAR {quiz.title}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  // 2. TELA DE RESULTADO FINAL DO QUIZ
  if (isFinished) {
    const totalQuestions = selectedQuiz.questions.length;
    const incorrectCount = totalQuestions - correctCount;
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    const feedbackMsg = getQuizPerformanceMessage(score);

    return (
      <section
        aria-label="Resultado do Quiz"
        className="max-w-3xl mx-auto py-4 space-y-6"
      >
        <div className="rounded-2xl bg-[#06130f]/95 border border-emerald-500/35 ezio-glow-emerald p-7 sm:p-10 text-center space-y-7">
          <div className="space-y-2">
            <p className="ezio-mono text-xs text-cyan-300">
              Resultado Final · {selectedQuiz.title}
            </p>
            <h2 className="ezio-display text-3xl sm:text-4xl font-bold text-emerald-50">
              <span className="ezio-mono">{score.toLocaleString("pt-BR")}</span> pontos
            </h2>
            <p className="text-base sm:text-lg font-semibold text-[#39FF14]">
              {feedbackMsg}
            </p>
          </div>

          {/* Métricas de desempenho */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-[#030b08] border border-emerald-500/25 p-4 space-y-1">
              <span className="text-xs text-emerald-300/75 block">Acertos</span>
              <span className="ezio-mono text-2xl font-bold text-[#39FF14]">
                {correctCount}
              </span>
            </div>
            <div className="rounded-xl bg-[#030b08] border border-emerald-500/25 p-4 space-y-1">
              <span className="text-xs text-emerald-300/75 block">Erros</span>
              <span className="ezio-mono text-2xl font-bold text-rose-400">
                {incorrectCount}
              </span>
            </div>
            <div className="rounded-xl bg-[#030b08] border border-emerald-500/25 p-4 space-y-1">
              <span className="text-xs text-emerald-300/75 block">Aproveitamento</span>
              <span className="ezio-mono text-2xl font-bold text-cyan-300">
                {percentage}%
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => startQuiz(selectedQuiz)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#22c55e] hover:bg-[#39FF14] text-[#031208] ezio-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>JOGAR NOVAMENTE</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedQuiz(null)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#081913] hover:bg-[#0d271e] border border-cyan-400/40 text-cyan-200 ezio-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>ESCOLHER OUTRO QUIZ</span>
            </button>

            <button
              type="button"
              onClick={onBackToPresentation}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/35 text-emerald-100 ezio-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>VOLTAR À APRESENTAÇÃO</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 3. TELA DA PERGUNTA ATUAL (ESTILO KAHOOT — 1 PERGUNTA POR TELA)
  const currentQuestion = selectedQuiz.questions[currentIndex];
  const totalQuestions = selectedQuiz.questions.length;
  const progressPercent = ((currentIndex + (selectedOption !== null ? 1 : 0)) / totalQuestions) * 100;
  const isAnswered = selectedOption !== null;
  const isCorrectAnswer =
    isAnswered && selectedOption === currentQuestion.correctIndex;

  return (
    <section
      aria-label={`Pergunta ${currentIndex + 1} de ${totalQuestions}`}
      className="max-w-4xl mx-auto py-4 space-y-6"
    >
      {/* Topo do Quiz: Identificação, Progresso e Pontuação */}
      <div className="rounded-xl bg-[#06130f]/95 border border-emerald-500/25 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="ezio-mono font-bold text-cyan-300">
              {selectedQuiz.title}
            </span>
            <span className="text-emerald-500/40" aria-hidden="true">
              ·
            </span>
            <span className="ezio-mono text-emerald-100 font-semibold">
              Pergunta {currentIndex + 1}/{totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="ezio-mono text-sm font-bold text-[#39FF14]">
              Pontuação: {score.toLocaleString("pt-BR")} pts
            </div>
            <button
              type="button"
              onClick={() => setSelectedQuiz(null)}
              className="px-3 py-1.5 rounded-lg bg-[#081913] hover:bg-[#0d271e] border border-emerald-500/30 text-xs text-emerald-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Trocar Quiz
            </button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div
          className="w-full h-2.5 rounded-full bg-[#030a08] overflow-hidden border border-emerald-500/20"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-[#22c55e] to-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Enunciado da Pergunta */}
      <div className="rounded-2xl bg-[#06130f]/95 border border-emerald-500/30 p-6 sm:p-8 text-center">
        <h2 className="ezio-display text-xl sm:text-2xl font-bold text-emerald-50 leading-snug text-balance">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Quatro Alternativas Grandes e Coloridas (estilo Kahoot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map((optionText, idx) => {
          const style = OPTION_STYLES[idx];
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQuestion.correctIndex;

          let cardClass: string = style.base;
          if (isAnswered) {
            if (isCorrect) {
              cardClass =
                "bg-emerald-600 border-[#39FF14] text-white ring-2 ring-[#39FF14]";
            } else if (isSelected) {
              cardClass =
                "bg-rose-700 border-rose-300 text-white ring-2 ring-rose-300";
            } else {
              cardClass =
                "bg-[#071410] border-emerald-500/20 text-emerald-200/45 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              className={`min-h-[84px] rounded-xl border-2 p-5 text-left flex items-center gap-4 transition-all cursor-pointer disabled:cursor-default ${cardClass}`}
            >
              <span className="w-10 h-10 rounded-lg bg-black/25 flex items-center justify-center ezio-mono font-bold text-base shrink-0">
                <span aria-hidden="true">{style.shape}</span>
                <span className="sr-only">Alternativa {style.letter}:</span>
              </span>
              <span className="text-sm sm:text-base font-semibold leading-snug flex-1">
                {optionText}
              </span>
              {isAnswered && isCorrect && (
                <CheckCircle2 className="w-6 h-6 text-[#39FF14] shrink-0" />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <XCircle className="w-6 h-6 text-rose-200 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Visual Imediato após responder */}
      {isAnswered && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isCorrectAnswer
              ? "bg-emerald-950/60 border-[#39FF14]/60"
              : "bg-rose-950/50 border-rose-400/60"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-base">
              {isCorrectAnswer ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#39FF14]" />
                  <span className="text-[#39FF14]">
                    Resposta correta! +1.000 pontos
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span className="text-rose-300">
                    Resposta incorreta · 0 pontos nesta questão
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>

          <button
            type="button"
            onClick={handleNextQuestion}
            className="px-6 py-3 rounded-xl bg-[#22c55e] hover:bg-[#39FF14] text-[#031208] ezio-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>
              {currentIndex + 1 >= totalQuestions
                ? "Ver Resultado Final"
                : "Próxima Pergunta"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
