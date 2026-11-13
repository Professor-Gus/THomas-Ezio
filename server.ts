import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standard ESM relative paths fallback (safe for both CommonJS and ESM)
const _filename = typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "";
const _dirname = _filename ? path.dirname(_filename) : "";

const app = express();
const portArgIndex = process.argv.indexOf("--port");
const argPort = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : undefined;
const PORT = argPort || envPort || 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// API health endpoint for probes and dev server health verification
app.all(["/api/health", "/health"], (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Initialize Gemini SDK with telemetry User-Agent
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("System: Gemini SDK initialized successfully.");
  } else {
    console.warn("System WARNING: GEMINI_API_KEY is not defined. AI matching will be unavailable.");
  }
} catch (err) {
  console.error("System ERROR: Failed to initialize Gemini SDK:", err);
}

// REST route for matching natural user input with defined triggers
app.post("/api/gemini/analyze", async (req, res): Promise<any> => {
  const { input, triggers } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "O campo 'input' é obrigatório e deve ser texto." });
  }

  // Fallback direct matching if Gemini API is not working or not configured yet
  const normalizedInput = input.trim().toLowerCase();
  
  if (!ai) {
    // If AI is offline, do a fuzzy direct fallback match
    console.log("System: Gemini API is offline. Performing fallback local keyword match.");
    
    // Find trigger that is contained in the input, or matches closely
    const matched = triggers?.find((t: any) => {
      const phrase = t.phrase?.trim().toLowerCase();
      return phrase && (normalizedInput.includes(phrase) || phrase.includes(normalizedInput));
    });

    return res.json({
      matchedTriggerId: matched ? matched.id : null,
      confidence: matched ? 1.0 : 0.0,
      response: matched 
        ? `[Modo de Contingência local] Conexão Neural estabelecida. Parâmetro "${matched.phrase}" acionado localmente.`
        : "O canal neural de IA está indisponível ou sem chave API. Digite ou fale exatamente uma frase programada para abrir o portal de vídeo correspondente."
    });
  }

  try {
    // Stringify triggers list with their IDs and trigger phrases
    const triggerScenarios = triggers?.map((t: any) => `ID: "${t.id}" | Frase de ativação: "${t.phrase}" | Descrição do Canal: "${t.description || 'Nenhuma'}"`).join("\n") || "Nenhum trigger configurado.";

    const systemInstruction = `Você é o "Guardião Neural do Assistente Mangueira".
Sua única e exclusiva tarefa é classificar a fala/texto do usuário comparando-a de forma semântica com os gatilhos pré-configurados ("triggers").
Você não deve inventar comandos ou bater papo sobre outros assuntos alheios. Se o usuário disser algo que não se assemelhe a nenhum gatilho, você deve obrigatoriamente classificar como matchedTriggerId: null.

Triggers configurados pelo usuário na central (você só pode retornar o ID de um destes listados abaixo se a correspondência for muito clara e forte, ou null se não for):
${triggerScenarios}

INSTRUÇÕES E REGRAS:
1. Examine a fala/texto do usuário. Compare a intenção com os gatilhos cadastrados. Atribua o matchedTriggerId correspondente apenas se a confiança / similaridade semântica for de pelo menos 0.75.
2. Se a similaridade for menor que 0.75 ou o assunto for totalmente diferente das perguntas configuradas, retorne obrigatoriamente matchedTriggerId como null e confiança de 0.0.
3. Elabore uma mensagem clara e concisa em português para "response". Se um trigger foi ativado, comente brevemente sobre a ativação do canal. Se NÃO houver correspondência (matchedTriggerId is null), explique brevemente que o comando não foi reconhecido e indique que o usuário deve pronunciar precisamente uma das perguntas configuradas. Evite responder a perguntas gerais alheias aos vídeos.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Mensagem ou comando recebido do usuário: "${input}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedTriggerId: {
              type: Type.STRING,
              description: "O ID do trigger semântica correspondente. Caso nenhuma se assemelhe na intenção com pontuação acima de 0.65, retorne null."
            },
            confidence: {
              type: Type.NUMBER,
              description: "Pontuação flutuante de confiança do casamento de intenção de 0.0 a 1.0."
            },
            response: {
              type: Type.STRING,
              description: "Mensagem poética e futurista em português do Guardião Neural reagindo à fala do usuário e à floresta."
            }
          },
          required: ["matchedTriggerId", "confidence", "response"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      matchedTriggerId: data.matchedTriggerId || null,
      confidence: data.confidence || 0,
      response: data.response || "As frequências miceliais oscilaram, mas a resposta se dispersou na névoa de dados. Tente falar novamente."
    });

  } catch (err: any) {
    console.error("System ERROR inside /api/gemini/analyze:", err);
    return res.status(500).json({
      matchedTriggerId: null,
      confidence: 0,
      response: "A ressonância de IA falhou devido a uma interferência no uplink solar. Comutando para sensores locais.",
      details: err.message
    });
  }
});

// Dedicated REST route for the interactive speaking robot assistant "Eva-Flora"
app.post("/api/gemini/assistant", async (req, res): Promise<any> => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "O campo 'question' é obrigatório." });
  }

  if (!ai) {
    return res.json({
      answer: "Olá! Meu downlink com as redes centrais de IA está offline no momento, mas posso operar em modo ecológico local. Faça-me mais perguntas sobre a preservação e monitoramento da nossa floresta cibernética!"
    });
  }

  try {
    const systemInstruction = `Você é "Eva-Flora", uma assistente robô humanoide biomímica encarregada de interagir com os operadores do Assistente Mangueira (EcoSphere-2250).
Você possui um corpo físico biomecatrônico decorado com trepadeiras de mangueira sintéticas e fibra de carbono bioluminescente.
Instruções de resposta:
1. Responda à pergunta do usuário de forma útil, interessante, com um tom cibernético, robótico, amigável e focado em tecnologia sustentável, bio-engenharia ou no funcionamento do Assistente Mangueira.
2. Seja conciso (máximo de 3 frases) para que sua fala sintetizada não fique exaustiva.
3. Use palavras que destaquem sua natureza robótica e mecânica (ex: "Meus servo-motores indicam...", "Processando dados em meu bloco neural...", "Minhas diretrizes robóticas...").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Pergunta do operador humano: "${question}"`,
      config: {
        systemInstruction,
        maxOutputTokens: 250,
      }
    });

    const answerText = response.text?.trim() || "Análise computacional incompleta. Por favor, reinicie meu transmissor neural.";
    return res.json({
      answer: answerText
    });

  } catch (err: any) {
    console.error("System ERROR inside /api/gemini/assistant:", err);
    return res.status(500).json({
      answer: "Interferência eletromagnética detectada em meus circuitos analógicos de conversação. Repita a pergunta, por favor.",
      details: err.message
    });
  }
});

// Dedicated REST route for Mobile Audio Recording Transcription via Gemini
app.post("/api/transcribe-audio", async (req, res): Promise<any> => {
  const { audioData, mimeType } = req.body;

  if (!audioData || typeof audioData !== "string") {
    return res.status(400).json({ error: "O campo 'audioData' (base64) é obrigatório." });
  }

  if (!ai) {
    return res.status(503).json({
      error: "O módulo neural de IA do servidor não está conectado. Ative a chave de API.",
      transcript: ""
    });
  }

  try {
    const cleanBase64 = audioData.includes(",") ? audioData.split(",")[1] : audioData;
    const finalMime = mimeType || "audio/webm";

    // Transcribe with gemini-2.5-flash which natively processes audio inputs
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: finalMime,
            data: cleanBase64,
          }
        },
        {
          text: "Você é um sistema transcritor de voz em português brasileiro (pt-BR). Transcreva com máxima precisão o que foi falado pelo usuário neste áudio. Retorne APENAS o texto da fala transcrita, sem introduções, sem formatações extras, sem aspas e sem pontuação desnecessária. Se não houver fala clara ou apenas ruído de fundo, retorne uma string vazia."
        }
      ]
    });

    const transcript = response.text?.trim() || "";
    return res.json({ transcript });
  } catch (err: any) {
    console.error("System ERROR inside /api/transcribe-audio:", err);
    return res.status(500).json({
      error: "Erro na transcrição de áudio via IA",
      details: err.message,
      transcript: ""
    });
  }
});

// Rota exclusiva do Projeto Thomas (Monitoramento Inteligente da Floresta Amazônica)
app.post("/api/thomas/analyze", async (req, res): Promise<any> => {
  const { input, triggers } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "O campo 'input' é obrigatório." });
  }

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalizedInput = normalize(input);

  const findLocalFallback = () =>
    triggers?.find((t: any) => {
      const phrase = normalize(String(t.phrase || ""));
      return (
        phrase &&
        (normalizedInput === phrase ||
          normalizedInput.includes(phrase) ||
          phrase.includes(normalizedInput))
      );
    });

  const directMatch = findLocalFallback();
  if (directMatch) {
    return res.json({
      matchedTriggerId: directMatch.id,
      confidence: 1.0,
    });
  }

  if (!ai) {
    return res.json({
      matchedTriggerId: null,
      confidence: 0.0,
    });
  }

  try {
    const triggerList =
      triggers
        ?.map(
          (t: any) =>
            `ID: "${t.id}" | Frase: "${t.phrase}" | Tema: "${t.description || ""}"`
        )
        .join("\n") || "";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Fala recebida do visitante: "${input}"`,
      config: {
        systemInstruction: `Você é o classificador de voz exclusivo do Projeto Thomas (Monitoramento Inteligente da Floresta Amazônica).
Compare a fala do usuário apenas com estes 3 gatilhos cadastrados:
${triggerList}

Regras:
1. Retorne o ID exato do gatilho se a intenção corresponder claramente a um dos 3 temas (animais da Amazônia, ajuda de drones, ou funcionamento do monitoramento).
2. Caso não corresponda a nenhum dos 3 temas, retorne matchedTriggerId como null e confidence 0.0.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedTriggerId: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["matchedTriggerId", "confidence"],
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      matchedTriggerId: data.matchedTriggerId || null,
      confidence: typeof data.confidence === "number" ? data.confidence : 0,
    });
  } catch (err: any) {
    console.error("Projeto Thomas /api/thomas/analyze error:", err);
    const fallback = findLocalFallback();
    return res.json({
      matchedTriggerId: fallback ? fallback.id : null,
      confidence: fallback ? 0.85 : 0,
    });
  }
});

// Rota exclusiva de respostas educativas do Assistente do Projeto Thomas (para perguntas sem vídeo específico)
app.post("/api/thomas/assistant", async (req, res): Promise<any> => {
  const { question, fallbackAnswer } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "O campo 'question' é obrigatório." });
  }

  const defaultAnswer =
    typeof fallbackAnswer === "string" && fallbackAnswer.trim()
      ? fallbackAnswer.trim()
      : "No Projeto Thomas, unimos sensores IoT nas árvores, drones com câmeras térmicas e preservação da fauna para proteger a Floresta Amazônica em tempo real. Você pode continuar fazendo perguntas por voz ou escolher uma das sugestões na tela.";

  if (!ai) {
    return res.json({ answer: defaultAnswer });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Pergunta do visitante sobre o projeto do aluno Thomas (Monitoramento Inteligente da Floresta Amazônica): "${question}"`,
      config: {
        systemInstruction: `Você é o assistente educativo exclusivo do Projeto Thomas, apresentado em uma feira escolar sobre Monitoramento Inteligente da Floresta Amazônica.
Diretrizes:
1. Responda em português brasileiro claro, didático e objetivo (máximo de 3 frases curtas).
2. Foque na Floresta Amazônica, proteção da fauna e flora, drones de monitoramento, sensores IoT (temperatura, umidade, fumaça, bioacústica) e alertas contra desmatamento/queimadas.
3. Não mencione outros projetos ou nomes externos.`,
        maxOutputTokens: 240,
      },
    });

    const answer = response.text?.trim() || defaultAnswer;
    return res.json({ answer });
  } catch (err: any) {
    console.error("Projeto Thomas /api/thomas/assistant error:", err);
    return res.json({ answer: defaultAnswer });
  }
});

// Configure Vite middleware in development, or Static Files serving in Production
async function bootstrap() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("System: Vite Middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("System: Serving production static assets from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`System: EcoSphere Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
