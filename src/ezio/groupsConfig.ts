// Configuração centralizada dos grupos do aplicativo EZIO.
// Cada grupo possui seus próprios vídeos, gatilhos, comandos de voz e conteúdo isolado.

export type EzioGroupId = "thomas" | "taiga_lghp";

export interface EzioVideoBase {
  id: string;
  label: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
}

export interface EzioTrigger extends EzioVideoBase {
  phrase: string;
  shortTitle: string;
  keywords: string[];
  sensorTag: string;
  imageUrl: string;
  isFarewell?: boolean;
}

export interface EzioSuggestedQuestion {
  id: string;
  question: string;
  targetTriggerId: string | null;
  iconType: "fauna" | "drone" | "sensor" | "shield" | "tech";
  fallbackAnswer: string;
}

export interface EzioSensorMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  detail: string;
}

export interface EzioGroupConfig {
  id: EzioGroupId;
  groupNumberLabel: string;
  name: string;
  assistantName: string;
  ecosystemBadge: string;
  themeTitle: string;
  themeDescription: string;
  accentTone: "emerald" | "cyan";
  backdropImage: string;
  cardImage: string;
  introVideo: EzioVideoBase;
  triggers: EzioTrigger[];
  suggestedQuestionsByVideoId?: Record<string, EzioSuggestedQuestion[]>;
  iotMetrics: EzioSensorMetric[];
  architectureSummary: {
    kicker: string;
    title: string;
    description: string;
    highlights: string[];
  };
}

export const EZIO_GROUPS: EzioGroupConfig[] = [
  // ============================================================================
  // GRUPO 1 — THOMAS (Projeto original preservado integralmente)
  // ============================================================================
  {
    id: "thomas",
    groupNumberLabel: "Grupo 1",
    name: "Thomas",
    assistantName: "Assistente Virtual EZIO · Amazônia",
    ecosystemBadge: "Floresta Amazônica",
    themeTitle: "Monitoramento inteligente da Floresta Amazônica",
    themeDescription:
      "Sistema autônomo de vigilância ambiental com drones, sensores IoT e proteção à biodiversidade amazônica.",
    accentTone: "emerald",
    backdropImage: "/src/assets/images/amazon_canopy_backdrop_1794531678388.jpg",
    cardImage: "/src/assets/images/amazon_drone_iot_1794531681156.jpg",
    introVideo: {
      id: "thomas_amazon_intro_00",
      label: "Introdução",
      title: "Apresentação Inicial — Monitoramento da Amazônia",
      description:
        "Visão geral do sistema de monitoramento inteligente da Floresta Amazônica criado por Thomas.",
      youtubeUrl: "https://youtu.be/EbPfvHk-GkI",
      youtubeId: "EbPfvHk-GkI",
    },
    triggers: [
      {
        id: "thomas_amazon_trig_01_animais",
        label: "Gatilho 1",
        title: "Me fale dos animais da Amazônia",
        shortTitle: "Fauna e Biodiversidade",
        phrase: "Me fale dos animais da Amazônia",
        description:
          "Monitoramento bioacústico e câmeras inteligentes para proteção da fauna amazônica.",
        youtubeUrl: "https://youtu.be/3UdOAqVIuxc",
        youtubeId: "3UdOAqVIuxc",
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
        title: "Como drones podem ajudar",
        shortTitle: "Patrulha Aérea com Drones",
        phrase: "Como drones podem ajudar",
        description:
          "Sobrevoos autônomos com mapeamento térmico e sensores ópticos sobre a copa das árvores.",
        youtubeUrl: "https://youtu.be/AOeh_GbsUvc",
        youtubeId: "AOeh_GbsUvc",
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
        title: "Como funciona o Monitoramento",
        shortTitle: "Rede de Sensores IoT",
        phrase: "Como funciona o Monitoramento",
        description:
          "Integração de sensores na floresta, satélites e alertas em tempo real contra desmatamento.",
        youtubeUrl: "https://youtu.be/VjYqPYR0gdw",
        youtubeId: "VjYqPYR0gdw",
        keywords: [
          "como funciona o monitoramento",
          "como funciona o monitoramento ambiental",
          "funciona o monitoramento",
          "explicar monitoramento",
        ],
        sensorTag: "IoT · Telemetria Solar",
        imageUrl: "/src/assets/images/amazon_canopy_backdrop_1794531678388.jpg",
      },
    ],
    suggestedQuestionsByVideoId: {
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
            "Podemos proteger a Amazônia combinando fiscalização contínua com tecnologia, apoio às comunidades locais, combate ao desmatamento e às queimadas, além de ações de reflorestamento.",
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
      thomas_amazon_trig_01_animais: [
        {
          id: "sug_t1_01",
          question: "Quais são os animais mais ameaçados?",
          targetTriggerId: null,
          iconType: "fauna",
          fallbackAnswer:
            "Entre os animais mais ameaçados na Amazônia estão a onça-pintada, a ariranha, o peixe-boi-da-amazônia, o gavião-real (harpia) e o macaco-aranha, afetados pela perda de habitat e caça ilegal.",
        },
        {
          id: "sug_t1_02",
          question: "Como podemos proteger os animais?",
          targetTriggerId: null,
          iconType: "shield",
          fallbackAnswer:
            "A proteção da fauna envolve preservar corredores ecológicos, combater o tráfico de animais, evitar queimadas e usar sensores bioacústicos e armadilhas fotográficas em áreas protegidas.",
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
      thomas_amazon_trig_02_drones: [
        {
          id: "sug_t2_01",
          question: "Como os drones identificam problemas na floresta?",
          targetTriggerId: null,
          iconType: "drone",
          fallbackAnswer:
            "Os drones utilizam câmeras de alta resolução, sensores térmicos (infravermelho) e mapeamento LiDAR para detectar focos de incêndio, clareiras de desmatamento ilegal e alterações na copa das árvores.",
        },
        {
          id: "sug_t2_02",
          question: "Quais tecnologias ajudam no monitoramento?",
          targetTriggerId: null,
          iconType: "tech",
          fallbackAnswer:
            "O monitoramento moderno integra satélites de observação, drones autônomos, sensores IoT movidos a energia solar, redes sem fio de longo alcance e inteligência artificial para análise rápida de dados.",
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
      thomas_amazon_trig_03_monitoramento: [
        {
          id: "sug_t3_01",
          question: "Quais sensores podem ser utilizados?",
          targetTriggerId: null,
          iconType: "sensor",
          fallbackAnswer:
            "Podem ser utilizados sensores de temperatura e umidade do ar, sensores de fumaça e gases, microfones bioacústicos para detectar sons de motosserra ou fauna, além de câmeras térmicas e ópticas.",
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
            "Ameaças são identificadas ao cruzar alertas de calor e fumaça dos sensores IoT, padrões sonoros anormais e imagens de satélite e drones sobre áreas vulneráveis.",
        },
      ],
    },
    iotMetrics: [
      {
        id: "am_temp",
        label: "Temperatura da Copa",
        value: "26.4",
        unit: "°C",
        detail: "Dossel Florestal · Setor Norte",
      },
      {
        id: "am_humidity",
        label: "Umidade Relativa",
        value: "87.8",
        unit: "%",
        detail: "Evapotranspiração Estável",
      },
      {
        id: "am_nodes",
        label: "Sensores IoT na Mata",
        value: "24",
        unit: "nós ativos",
        detail: "Energia Solar + LoRaWAN",
      },
      {
        id: "am_drones",
        label: "Rota dos Drones",
        value: "18.5",
        unit: "km²",
        detail: "Cobertura Térmica e Óptica",
      },
    ],
    architectureSummary: {
      kicker: "Arquitetura de Monitoramento · Floresta Amazônica",
      title: "Drones Autônomos, Sensores IoT e Proteção da Fauna",
      description:
        "Drones sobrevoam a copa detectando focos de calor e desmatamento enquanto sensores solares nas árvores captam umidade, temperatura e sons de animais silvestres.",
      highlights: ["Varredura LiDAR", "Sensores IoT Solares", "Monitoramento de Copa"],
    },
  },

  // ============================================================================
  // GRUPO 2 — LUÍS, GABRIEL, HEITOR E PEDRO (Taiga)
  // ============================================================================
  {
    id: "taiga_lghp",
    groupNumberLabel: "Grupo 2",
    name: "Luís, Gabriel, Heitor e Pedro",
    assistantName: "Assistente Virtual EZIO · Taiga",
    ecosystemBadge: "Taiga · Floresta Boreal",
    themeTitle: "Taiga — floresta de clima frio, biodiversidade, sobrevivência e preservação ambiental",
    themeDescription:
      "Conheça a maior floresta terrestre do planeta, sua fauna adaptada ao frio intenso, estratégias de sobrevivência e preservação.",
    accentTone: "cyan",
    backdropImage: "/src/assets/images/taiga_boreal_backdrop_1794619630840.jpg",
    cardImage: "/src/assets/images/taiga_wildlife_monitoring_1794619631099.jpg",
    introVideo: {
      id: "taiga_intro_00",
      label: "Introdução",
      title: "Apresentação Inicial — Explorando a Taiga",
      description:
        "Introdução preparada pelo grupo Luís, Gabriel, Heitor e Pedro sobre a floresta boreal.",
      youtubeUrl: "https://youtu.be/eTqWPt7xkVY",
      youtubeId: "eTqWPt7xkVY",
    },
    triggers: [
      {
        id: "taiga_trig_01_animais",
        label: "Gatilho 1",
        title: "Animais da Taiga",
        shortTitle: "Animais da Taiga",
        phrase: "Animais da Taiga?",
        description:
          "Espécies adaptadas ao clima rigoroso da floresta boreal, como lobos, linces, ursos e alces.",
        youtubeUrl: "https://youtu.be/7BhTxj2EArs",
        youtubeId: "7BhTxj2EArs",
        keywords: [
          "animais da taiga",
          "animal da taiga",
          "fauna da taiga",
          "quais animais vivem na taiga",
          "bichos da taiga",
        ],
        sensorTag: "Fauna Boreal · Rastreio",
        imageUrl: "/src/assets/images/taiga_wildlife_monitoring_1794619631099.jpg",
      },
      {
        id: "taiga_trig_02_sobreviver",
        label: "Gatilho 2",
        title: "Como posso sobreviver na Taiga?",
        shortTitle: "Sobrevivência na Taiga",
        phrase: "Me fale como posso sobreviver na Taiga.",
        description:
          "Orientações essenciais de abrigo, calor térmico, água e orientação em temperaturas negativas.",
        youtubeUrl: "https://youtu.be/hYrW2F95BBw",
        youtubeId: "hYrW2F95BBw",
        keywords: [
          "me fale como posso sobreviver na taiga",
          "como posso sobreviver na taiga",
          "sobreviver na taiga",
          "sobrevivencia na taiga",
          "sobreviver no frio",
        ],
        sensorTag: "Sobrevivência · Clima Frio",
        imageUrl: "/src/assets/images/taiga_boreal_backdrop_1794619630840.jpg",
      },
      {
        id: "taiga_trig_03_preservar",
        label: "Gatilho 3",
        title: "Como preservar a floresta?",
        shortTitle: "Preservação da Floresta",
        phrase: "Como preservar a floresta?",
        description:
          "Importância da Taiga para o equilíbrio climático global e ações para proteger as coníferas.",
        youtubeUrl: "https://youtu.be/rqOlARPw450",
        youtubeId: "rqOlARPw450",
        keywords: [
          "como preservar a floresta",
          "preservar a floresta",
          "preservar a taiga",
          "proteger a taiga",
          "como proteger a floresta",
        ],
        sensorTag: "Conservação · Coníferas",
        imageUrl: "/src/assets/images/taiga_boreal_backdrop_1794619630840.jpg",
      },
      {
        id: "taiga_trig_04_tchau",
        label: "Gatilho 4 · Encerramento",
        title: "Tchau",
        shortTitle: "Encerramento",
        phrase: "Tchau.",
        description:
          "Vídeo de despedida que conclui oficialmente a apresentação do grupo sobre a Taiga.",
        youtubeUrl: "https://youtu.be/BSD08ONUjn8",
        youtubeId: "BSD08ONUjn8",
        keywords: ["tchau", "ate logo", "até logo", "encerrar apresentacao", "adeus"],
        sensorTag: "Encerramento Oficial",
        imageUrl: "/src/assets/images/taiga_wildlife_monitoring_1794619631099.jpg",
        isFarewell: true,
      },
    ],
    iotMetrics: [
      {
        id: "tg_temp",
        label: "Temperatura Boreal",
        value: "-8.4",
        unit: "°C",
        detail: "Pinheiros e Coníferas · Zona Norte",
      },
      {
        id: "tg_snow",
        label: "Cobertura de Neve",
        value: "64.0",
        unit: "cm",
        detail: "Isolamento Térmico do Solo",
      },
      {
        id: "tg_nodes",
        label: "Sensores Criogênicos",
        value: "18",
        unit: "nós ativos",
        detail: "Monitoramento de Permafrost",
      },
      {
        id: "tg_drones",
        label: "Patrulha Aérea",
        value: "24.2",
        unit: "km²",
        detail: "Detecção de Incêndios e Fauna",
      },
    ],
    architectureSummary: {
      kicker: "Monitoramento Boreal · Ecossistema Taiga",
      title: "Sensores de Clima Frio, Drones e Preservação das Coníferas",
      description:
        "Estações meteorológicas, drones resistentes a baixas temperaturas e redes de sensores acompanham o degelo do solo, a fauna boreal e o risco de incêndios florestais.",
      highlights: ["Sensores Criogênicos", "Rastreio da Fauna", "Alerta de Incêndios"],
    },
  },
];

export function getEzioGroupById(groupId: EzioGroupId): EzioGroupConfig {
  return EZIO_GROUPS.find((g) => g.id === groupId) || EZIO_GROUPS[0];
}

export function normalizeEzioText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findGroupSuggestedQuestion(
  group: EzioGroupConfig,
  input: string
): EzioSuggestedQuestion | null {
  if (!group.suggestedQuestionsByVideoId) return null;
  const cleanInput = normalizeEzioText(input);
  if (!cleanInput) return null;

  const allSuggestions = Object.values(group.suggestedQuestionsByVideoId).flat();
  for (const item of allSuggestions) {
    const cleanQ = normalizeEzioText(item.question);
    if (cleanInput === cleanQ) return item;
    if (
      cleanInput.length >= 12 &&
      (cleanInput.includes(cleanQ) || cleanQ.includes(cleanInput))
    ) {
      return item;
    }
  }
  return null;
}

/**
 * Compara o comando falado exclusivamente com os gatilhos do grupo selecionado.
 * Nunca mistura gatilhos entre grupos nem aciona a introdução.
 */
export function matchGroupTrigger(
  group: EzioGroupConfig,
  input: string
): { trigger: EzioTrigger | null; confidence: number } {
  const cleanInput = normalizeEzioText(input);
  if (!cleanInput) return { trigger: null, confidence: 0 };

  // Respeita mapeamento explícito de perguntas sugeridas (no caso do Thomas)
  const matchedSuggestion = findGroupSuggestedQuestion(group, input);
  if (matchedSuggestion) {
    if (matchedSuggestion.targetTriggerId) {
      const target =
        group.triggers.find((t) => t.id === matchedSuggestion.targetTriggerId) ||
        null;
      return { trigger: target, confidence: target ? 1.0 : 0 };
    }
    return { trigger: null, confidence: 0 };
  }

  let bestTrigger: EzioTrigger | null = null;
  let bestScore = 0;

  for (const trigger of group.triggers) {
    const cleanPhrase = normalizeEzioText(trigger.phrase);

    if (cleanInput === cleanPhrase) {
      return { trigger, confidence: 1.0 };
    }

    // Frase curta como "Tchau" exige correspondência clara para evitar disparo acidental
    if (cleanPhrase.length <= 6) {
      const words = cleanInput.split(" ");
      if (words.includes(cleanPhrase) || trigger.keywords.some((kw) => cleanInput === normalizeEzioText(kw))) {
        return { trigger, confidence: 0.98 };
      }
      continue;
    }

    if (
      cleanInput.length >= 8 &&
      (cleanInput.includes(cleanPhrase) || cleanPhrase.includes(cleanInput))
    ) {
      return { trigger, confidence: 0.96 };
    }

    let keywordScore = 0;
    for (const kw of trigger.keywords) {
      const cleanKw = normalizeEzioText(kw);
      if (cleanKw && cleanInput.includes(cleanKw)) {
        keywordScore = Math.max(keywordScore, 0.9);
      }
    }

    const phraseWords = cleanPhrase
      .split(" ")
      .filter(
        (w) =>
          w.length > 2 &&
          !["dos", "das", "com", "como", "que", "para", "uma", "podem", "posso", "fale"].includes(w)
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
