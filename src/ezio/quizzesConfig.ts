// Configuração centralizada dos Quizzes dos Ecossistemas do EZIO.
// Contém EXCLUSIVAMENTE: Quiz da Amazônia e Quiz da Taiga (5 perguntas cada, 4 alternativas, máx. 5.000 pontos).

export type EzioQuizId = "quiz_amazonia" | "quiz_taiga";

export interface EzioQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
}

export interface EzioQuizConfig {
  id: EzioQuizId;
  title: string;
  ecosystem: string;
  subtitle: string;
  description: string;
  pointsPerQuestion: number;
  maxPoints: number;
  accentTone: "emerald" | "cyan";
  coverImage: string;
  questions: [
    EzioQuizQuestion,
    EzioQuizQuestion,
    EzioQuizQuestion,
    EzioQuizQuestion,
    EzioQuizQuestion
  ];
}

export const POINTS_PER_CORRECT_ANSWER = 1000;
export const MAX_QUIZ_POINTS = 5000;

export function getQuizPerformanceMessage(score: number): string {
  if (score >= 5000) {
    return "Excelente! Você domina esse ecossistema!";
  }
  if (score >= 3000) {
    return "Muito bem! Você demonstrou bons conhecimentos!";
  }
  if (score >= 1000) {
    return "Continue aprendendo! Você está no caminho certo!";
  }
  return "Não desanime! Conhecer a natureza é o primeiro passo para protegê-la!";
}

export const EZIO_QUIZZES: EzioQuizConfig[] = [
  // ============================================================================
  // QUIZ DA AMAZÔNIA (Substitui definitivamente qualquer outro bioma anterior)
  // ============================================================================
  {
    id: "quiz_amazonia",
    title: "QUIZ DA AMAZÔNIA",
    ecosystem: "Floresta Amazônica",
    subtitle: "Biodiversidade, Clima e Monitoramento Inteligente",
    description:
      "Teste seus conhecimentos de 9º ano sobre a maior floresta tropical do mundo, suas ameaças e as tecnologias usadas para protegê-la.",
    pointsPerQuestion: POINTS_PER_CORRECT_ANSWER,
    maxPoints: MAX_QUIZ_POINTS,
    accentTone: "emerald",
    coverImage: "/src/assets/images/amazon_wildlife_fauna_1794531679351.jpg",
    questions: [
      {
        id: "amz_q1",
        question:
          "Qual fenômeno climático está diretamente ligado à evapotranspiração das árvores da Amazônia, influenciando chuvas em outras regiões do Brasil?",
        options: [
          "Rios voadores de vapor de água",
          "Correntes marítimas polares",
          "Congelamento sazonal do permafrost",
          "Efeito das marés oceânicas",
        ],
        correctIndex: 0,
        explanation:
          "As árvores da Amazônia liberam grandes quantidades de vapor de água na atmosfera, formando os chamados 'rios voadores' que levam umidade para o Centro-Oeste, Sudeste e Sul.",
      },
      {
        id: "amz_q2",
        question:
          "Por que sensores bioacústicos (Internet das Coisas) instalados em troncos ajudam no monitoramento da Floresta Amazônica?",
        options: [
          "Porque aumentam a velocidade do vento na copa das árvores",
          "Porque captam sons de fauna silvestre e ruídos suspeitos, como motosserras",
          "Porque substituem completamente a necessidade de água nas plantas",
          "Porque iluminam o dossel florestal durante toda a noite",
        ],
        correctIndex: 1,
        explanation:
          "Sensores bioacústicos gravam sons continuamente e usam inteligência artificial para identificar espécies ameaçadas ou detectar barulhos de desmatamento ilegal em tempo real.",
      },
      {
        id: "amz_q3",
        question:
          "Qual característica é típica da fauna amazônica e essencial para a manutenção do equilíbrio da floresta?",
        options: [
          "Hibernação profunda durante seis meses de neve",
          "Adaptação exclusiva a desertos áridos sem água doce",
          "Dispersão de sementes por aves, primatas e peixes em áreas alagadas",
          "Ausência de predadores de topo na cadeia alimentar",
        ],
        correctIndex: 2,
        explanation:
          "Aves como araras e tucanos, macacos e até peixes na cheia (igapó e várzea) dispersam sementes, garantindo a regeneração natural da floresta.",
      },
      {
        id: "amz_q4",
        question:
          "Como drones equipados com câmeras térmicas e sensores ópticos contribuem contra incêndios na Amazônia?",
        options: [
          "Localizam focos de calor mesmo sob fumaça densa e mapeiam áreas de difícil acesso",
          "Alteram a composição química do solo para impedir o crescimento de árvores",
          "Derrubam árvores saudáveis para criar clareiras artificiais",
          "Funcionam apenas quando há cobertura de neve sobre o dossel",
        ],
        correctIndex: 0,
        explanation:
          "Sensores infravermelhos em drones identificam anomalias de temperatura rapidamente, orientando brigadistas com coordenadas precisas antes que o fogo se espalhe.",
      },
      {
        id: "amz_q5",
        question:
          "Qual combinação de fatores representa uma das maiores ameaças atuais à biodiversidade amazônica?",
        options: [
          "Excesso de chuvas naturais na estação cheia",
          "Desmatamento ilegal, queimadas e fragmentação de habitats",
          "Presença de reservas indígenas protegidas",
          "Uso de sensores solares de baixo consumo ambiental",
        ],
        correctIndex: 1,
        explanation:
          "O corte ilegal, o avanço de queimadas e a fragmentação da mata isolam populações de animais como a onça-pintada e reduzem a biodiversidade.",
      },
    ],
  },

  // ============================================================================
  // QUIZ DA TAIGA (Floresta Boreal)
  // ============================================================================
  {
    id: "quiz_taiga",
    title: "QUIZ DA TAIGA",
    ecosystem: "Taiga · Floresta Boreal",
    subtitle: "Clima Frio, Adaptação, Sobrevivência e Conservação",
    description:
      "Desafie seus conhecimentos sobre o bioma Taiga, suas coníferas, animais resistentes ao inverno rigoroso e estratégias de preservação.",
    pointsPerQuestion: POINTS_PER_CORRECT_ANSWER,
    maxPoints: MAX_QUIZ_POINTS,
    accentTone: "cyan",
    coverImage: "/src/assets/images/taiga_wildlife_monitoring_1794619631099.jpg",
    questions: [
      {
        id: "tga_q1",
        question:
          "Qual tipo de vegetação predomina na Taiga e por que ela possui folhas em formato de agulha (aciculifoliadas)?",
        options: [
          "Cactos gigantes, para armazenar água em temperaturas de 45 °C",
          "Coníferas (como pinheiros e abetos), que reduzem a perda de água e suportam neve e frio",
          "Plantas aquáticas flutuantes típicas de pântanos quentes",
          "Árvores de folhas largas e finas que nunca enfrentam geadas",
        ],
        correctIndex: 1,
        explanation:
          "As folhas em agulha com camada cerosa diminuem a transpiração no solo congelado e evitam que o peso da neve quebre os galhos.",
      },
      {
        id: "tga_q2",
        question:
          "Qual conjunto de animais é característico da fauna da Taiga e adaptado ao inverno rigoroso?",
        options: [
          "Lobo-cinzento, alce, lince-boreal e urso-pardo",
          "Boto-cor-de-rosa, tamanduá-bandeira e arara-azul",
          "Camelo-dromedário, suricato e escorpião-do-deserto",
          "Tucano-toco, pirarucu e preguiça-de-coleira",
        ],
        correctIndex: 0,
        explanation:
          "Animais como lobos, alces, linces e ursos possuem pelagem densa, camadas de gordura ou hábitos de hibernação para enfrentar invernos prolongados.",
      },
      {
        id: "tga_q3",
        question:
          "Em uma situação de sobrevivência em clima frio da Taiga, qual é uma medida fundamental para evitar hipotermia?",
        options: [
          "Deitar diretamente sobre a neve úmida sem isolamento térmico",
          "Usar roupas de algodão encharcadas para resfriar o corpo",
          "Construir abrigo isolado do solo e manter o corpo seco e aquecido em camadas",
          "Caminhar sem proteção na nevasca durante a madrugada",
        ],
        correctIndex: 2,
        explanation:
          "Isolar o corpo do contato direto com o solo gelado, manter a pele seca e usar vestimenta em camadas conserva o calor corporal vital.",
      },
      {
        id: "tga_q4",
        question:
          "Qual ameaça ambiental grave ocorre na Taiga quando o aquecimento global provoca o degelo do solo congelado (permafrost)?",
        options: [
          "Transformação imediata da floresta em recife de corais",
          "Liberação de grandes quantidades de gases de efeito estufa, como metano e CO2",
          "Aumento instantâneo da camada de gelo nos pinheiros",
          "Redução total do risco de incêndios florestais no verão",
        ],
        correctIndex: 1,
        explanation:
          "O degelo do permafrost libera carbono e metano armazenados há milênios, intensificando o aquecimento global e fragilizando raízes das árvores.",
      },
      {
        id: "tga_q5",
        question:
          "Como a tecnologia de satélites, drones e sensores climáticos ajuda na preservação da Taiga?",
        options: [
          "Monitora incêndios boreais, extração madeireira predatória e variações na temperatura do solo",
          "Desliga automaticamente o ciclo de estações do ano no hemisfério norte",
          "Substitui as coníferas naturais por antenas metálicas sem vegetação",
          "Elimina a necessidade de áreas de proteção ambiental",
        ],
        correctIndex: 0,
        explanation:
          "O monitoramento remoto acompanha grandes extensões pouco habitadas da floresta boreal, detectando incêndios de verão, corte ilegal e mudanças térmicas no solo.",
      },
    ],
  },
];
