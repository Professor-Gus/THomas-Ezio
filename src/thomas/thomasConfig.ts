// Configuração exclusiva e independente do Projeto Thomas — Monitoramento Inteligente da Floresta Amazônica.
// Este arquivo não compartilha chaves, gatilhos, estados ou vídeos com outros projetos.

export interface ThomasVideoItem {
  id: string;
  label: string;
  phrase: string;
  shortTitle: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  category: "intro" | "fauna" | "drones" | "iot";
  keywords: string[];
  sensorTag: string;
  imageUrl?: string;
}

export interface ThomasSuggestedQuestion {
  id: string;
  question: string;
  targetTriggerId: string | null;
  iconType: "fauna" | "drone" | "sensor" | "shield" | "tech";
  fallbackAnswer: string;
}

export const THOMAS_PROJECT_META = {
  studentName: "Thomas",
  projectTitle: "Amazônia Viva · Monitoramento Inteligente",
  subtitle: "Sistema autônomo de vigilância ambiental por voz, drones e sensores IoT",
  storagePrefix: "thomas_amazonia_v1_",
} as const;

export const THOMAS_BACKDROP_IMAGE =
  "/src/assets/images/amazon_canopy_backdrop_1794531678388.jpg";

export const THOMAS_INTRO_VIDEO: ThomasVideoItem = {
  id: "thomas_amazon_intro_00",
  label: "Introdução",
  phrase: "Introdução do Projeto",
  shortTitle: "Apresentação Inicial",
  description:
    "Visão geral do sistema de monitoramento inteligente da Floresta Amazônica criado por Thomas.",
  youtubeUrl: "https://youtu.be/EbPfvHk-GkI",
  youtubeId: "EbPfvHk-GkI",
  category: "intro",
  keywords: [],
  sensorTag: "Ativação Única",
};

export const THOMAS_TRIGGERS: ThomasVideoItem[] = [
  {
    id: "thomas_amazon_trig_01_animais",
    label: "Gatilho 1",
    phrase: "Me fale dos animais da Amazônia",
    shortTitle: "Fauna e Biodiversidade",
    description:
      "Monitoramento bioacústico e câmeras inteligentes para proteção da fauna amazônica.",
    youtubeUrl: "https://youtu.be/3UdOAqVIuxc",
    youtubeId: "3UdOAqVIuxc",
    category: "fauna",
    keywords: [
      "me fale dos animais",
      "fale dos animais",
      "animais da amazonia",
      "quais animais vivem na amazonia",
      "fauna da amazonia",
    ],
    sensorTag: "Bioacústica · Fauna",
    imageUrl: "/src/assets/images/amazon_wildlife_fauna_1794531679351.jpg",
  },
  {
    id: "thomas_amazon_trig_02_drones",
    label: "Gatilho 2",
    phrase: "Como drones podem ajudar",
    shortTitle: "Patrulha Aérea com Drones",
    description:
      "Sobrevoos autônomos com mapeamento térmico e sensores ópticos sobre a copa das árvores.",
    youtubeUrl: "https://youtu.be/AOeh_GbsUvc",
    youtubeId: "AOeh_GbsUvc",
    category: "drones",
    keywords: [
      "como drones podem ajudar",
      "como os drones podem ajudar",
      "como os drones ajudam a monitorar",
      "drones podem ajudar",
      "ajuda dos drones",
    ],
    sensorTag: "VANT · Varredura Aérea",
    imageUrl: "/src/assets/images/amazon_drone_iot_1794531681156.jpg",
  },
  {
    id: "thomas_amazon_trig_03_monitoramento",
    label: "Gatilho 3",
    phrase: "Como funciona o monitoramento",
    shortTitle: "Rede de Sensores IoT",
    description:
      "Integração de sensores na floresta, satélites e alertas em tempo real contra desmatamento.",
    youtubeUrl: "https://youtu.be/VjYqPYR0gdw",
    youtubeId: "VjYqPYR0gdw",
    category: "iot",
    keywords: [
      "como funciona o monitoramento",
      "como funciona o monitoramento ambiental",
      "funciona o monitoramento",
      "explicar monitoramento",
    ],
    sensorTag: "IoT · Telemetria Solar",
    imageUrl: "/src/assets/images/amazon_canopy_backdrop_1794531678388.jpg",
  },
];

// Sugestões contextuais exibidas após cada vídeo (3 perguntas por etapa)
export const THOMAS_SUGGESTIONS_BY_VIDEO_ID: Record<string, ThomasSuggestedQuestion[]> = {
  // Após a INTRODUÇÃO
  thomas_amazon_intro_00: [
    {
      id: "sug_intro_01",
      question: "Quais animais vivem na Amazônia?",
      targetTriggerId: "thomas_amazon_trig_01_animais",
      iconType: "fauna",
      fallbackAnswer:
        "A Amazônia abriga espécies emblemáticas como a onça-pintada, arara-vermelha, boto-cor-de-rosa, preguiça-real, harpia e milhares de aves e anfíbios.",
    },
    {
      id: "sug_intro_02",
      question: "Como podemos proteger a floresta?",
      targetTriggerId: null,
      iconType: "shield",
      fallbackAnswer:
        "Podemos proteger a Amazônia combinando fiscalização contínua com tecnologia, apoio às comunidades locais, combate ao desmatamento e às queimadas, além de ações de reflorestamento e consumo consciente.",
    },
    {
      id: "sug_intro_03",
      question: "Como a tecnologia pode ajudar a natureza?",
      targetTriggerId: null,
      iconType: "tech",
      fallbackAnswer:
        "A tecnologia auxilia a natureza por meio de drones de sobrevoo, sensores IoT instalados nas árvores, imagens de satélite e inteligência artificial que detectam riscos ambientais em tempo real.",
    },
  ],

  // Após o GATILHO 1 — Animais da Amazônia
  thomas_amazon_trig_01_animais: [
    {
      id: "sug_t1_01",
      question: "Quais são os animais mais ameaçados?",
      targetTriggerId: null,
      iconType: "fauna",
      fallbackAnswer:
        "Entre os animais mais ameaçados na Amazônia estão a onça-pintada, a ariranha, o peixe-boi-da-amazônia, o gavião-real (harpia) e o macaco-aranha, afetados principalmente pela perda de habitat e caça ilegal.",
    },
    {
      id: "sug_t1_02",
      question: "Como podemos proteger os animais?",
      targetTriggerId: null,
      iconType: "shield",
      fallbackAnswer:
        "A proteção da fauna envolve preservar corredores ecológicos, combater o tráfico de animais, evitar queimadas e usar sensores bioacústicos e armadilhas fotográficas para acompanhar populações em áreas protegidas.",
    },
    {
      id: "sug_t1_03",
      question: "Como os drones ajudam a monitorar a floresta?",
      targetTriggerId: "thomas_amazon_trig_02_drones",
      iconType: "drone",
      fallbackAnswer:
        "Os drones sobrevoam grandes áreas da floresta com câmeras ópticas e térmicas para identificar desmatamento, focos de calor e movimentações suspeitas com agilidade.",
    },
  ],

  // Após o GATILHO 2 — Como drones podem ajudar
  thomas_amazon_trig_02_drones: [
    {
      id: "sug_t2_01",
      question: "Como os drones identificam problemas na floresta?",
      targetTriggerId: null,
      iconType: "drone",
      fallbackAnswer:
        "Os drones utilizam câmeras de alta resolução, sensores térmicos (infravermelho) e mapeamento LiDAR para detectar focos de incêndio sob a fumaça, clareiras de desmatamento ilegal e alterações na copa das árvores.",
    },
    {
      id: "sug_t2_02",
      question: "Quais tecnologias ajudam no monitoramento?",
      targetTriggerId: null,
      iconType: "tech",
      fallbackAnswer:
        "O monitoramento moderno integra satélites de observação, drones autônomos, sensores IoT movidos a energia solar, redes sem fio de longo alcance (LoRaWAN) e inteligência artificial para análise rápida de dados.",
    },
    {
      id: "sug_t2_03",
      question: "Como funciona o monitoramento ambiental?",
      targetTriggerId: "thomas_amazon_trig_03_monitoramento",
      iconType: "sensor",
      fallbackAnswer:
        "O monitoramento ambiental coleta dados contínuos do solo, ar, som e imagens aéreas da floresta e envia alertas automáticos para equipes de preservação.",
    },
  ],

  // Após o GATILHO 3 — Como funciona o monitoramento
  thomas_amazon_trig_03_monitoramento: [
    {
      id: "sug_t3_01",
      question: "Quais sensores podem ser utilizados?",
      targetTriggerId: null,
      iconType: "sensor",
      fallbackAnswer:
        "Podem ser utilizados sensores de temperatura e umidade do ar, sensores de fumaça e gases (CO2), microfones bioacústicos para detectar sons de motosserra ou fauna, além de câmeras térmicas e ópticas.",
    },
    {
      id: "sug_t3_02",
      question: "Como os dados ajudam a proteger a Amazônia?",
      targetTriggerId: null,
      iconType: "tech",
      fallbackAnswer:
        "Os dados transformam sinais da floresta em mapas de risco e alertas em tempo real, permitindo que brigadistas e pesquisadores ajam rapidamente antes que incêndios ou invasões se espalhem.",
    },
    {
      id: "sug_t3_03",
      question: "Como podemos identificar ameaças à floresta?",
      targetTriggerId: null,
      iconType: "shield",
      fallbackAnswer:
        "Ameaças são identificadas ao cruzar alertas de calor e fumaça dos sensores IoT, padrões sonoros anormais (como veículos ou derrubada de árvores) e imagens de satélite e drones sobre áreas vulneráveis.",
    },
  ],
};

export interface ThomasIoTMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  detail: string;
}

export const THOMAS_IOT_METRICS: ThomasIoTMetric[] = [
  {
    id: "temp_canopy",
    label: "Temperatura da Copa",
    value: "26.4",
    unit: "°C",
    detail: "Dossel Florestal · Setor Norte",
  },
  {
    id: "humidity_air",
    label: "Umidade Relativa",
    value: "87.8",
    unit: "%",
    detail: "Evapotranspiração Estável",
  },
  {
    id: "iot_nodes",
    label: "Sensores IoT na Mata",
    value: "24",
    unit: "nós ativos",
    detail: "Energia Solar + LoRaWAN",
  },
  {
    id: "drone_range",
    label: "Rota dos Drones",
    value: "18.5",
    unit: "km²",
    detail: "Cobertura Térmica e Óptica",
  },
];

export function normalizeThomasText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAllThomasSuggestedQuestions(): ThomasSuggestedQuestion[] {
  return Object.values(THOMAS_SUGGESTIONS_BY_VIDEO_ID).flat();
}

/**
 * Localiza se uma fala ou texto corresponde diretamente a uma das 12 perguntas sugeridas.
 * Permite respeitar com precisão quando a pergunta deve tocar um vídeo vs. ir para o assistente.
 */
export function findThomasSuggestedQuestion(
  input: string
): ThomasSuggestedQuestion | null {
  const cleanInput = normalizeThomasText(input);
  if (!cleanInput) return null;

  for (const item of getAllThomasSuggestedQuestions()) {
    const cleanQuestion = normalizeThomasText(item.question);
    if (cleanInput === cleanQuestion) {
      return item;
    }
    if (
      cleanInput.length >= 12 &&
      (cleanInput.includes(cleanQuestion) || cleanQuestion.includes(cleanInput))
    ) {
      return item;
    }
  }

  return null;
}

/**
 * Compara a transcrição falada exclusivamente com os 3 gatilhos do Projeto Thomas.
 * Nunca retorna o vídeo de introdução e não associa perguntas do assistente a vídeos errados.
 */
export function matchThomasTriggerLocal(input: string): {
  trigger: ThomasVideoItem | null;
  confidence: number;
} {
  const cleanInput = normalizeThomasText(input);
  if (!cleanInput) {
    return { trigger: null, confidence: 0 };
  }

  // Primeiro respeita o mapeamento explícito das perguntas sugeridas
  const matchedSuggestion = findThomasSuggestedQuestion(input);
  if (matchedSuggestion) {
    if (matchedSuggestion.targetTriggerId) {
      const target =
        THOMAS_TRIGGERS.find((t) => t.id === matchedSuggestion.targetTriggerId) ||
        null;
      return { trigger: target, confidence: target ? 1.0 : 0 };
    }
    // Pergunta sugerida sem vídeo específico: não associar a outro vídeo
    return { trigger: null, confidence: 0 };
  }

  let bestTrigger: ThomasVideoItem | null = null;
  let bestScore = 0;

  for (const trigger of THOMAS_TRIGGERS) {
    const cleanPhrase = normalizeThomasText(trigger.phrase);

    // Correspondência exata ou por subfrase direta
    if (cleanInput === cleanPhrase) {
      return { trigger, confidence: 1.0 };
    }
    if (
      cleanInput.length >= 8 &&
      (cleanInput.includes(cleanPhrase) || cleanPhrase.includes(cleanInput))
    ) {
      return { trigger, confidence: 0.96 };
    }

    // Correspondência por expressões-chave específicas do gatilho
    let keywordScore = 0;
    for (const kw of trigger.keywords) {
      const cleanKw = normalizeThomasText(kw);
      if (cleanInput.includes(cleanKw)) {
        keywordScore = Math.max(keywordScore, 0.9);
      }
    }

    // Pontuação por palavras principais da frase cadastrada
    const phraseWords = cleanPhrase
      .split(" ")
      .filter(
        (w) =>
          w.length > 2 &&
          !["dos", "das", "com", "como", "que", "para", "uma", "podem"].includes(w)
      );
    const inputWords = cleanInput.split(" ");

    let hits = 0;
    for (const pw of phraseWords) {
      const found = inputWords.some(
        (iw) =>
          iw === pw ||
          (iw.length >= 4 && pw.length >= 4 && iw.slice(0, 4) === pw.slice(0, 4))
      );
      if (found) hits++;
    }

    const phraseRatio = phraseWords.length > 0 ? hits / phraseWords.length : 0;
    const score = Math.max(phraseRatio, keywordScore);

    if (score > bestScore) {
      bestScore = score;
      bestTrigger = trigger;
    }
  }

  if (bestTrigger && bestScore >= 0.7) {
    return { trigger: bestTrigger, confidence: bestScore };
  }

  return { trigger: null, confidence: bestScore };
}
