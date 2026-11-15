import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = "gemini-4-hydrogen";

const INSIGHT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: {
      type: Type.STRING,
      description: "A crisp one-sentence executive takeaway grounded in the provided numbers.",
    },
    summary: {
      type: Type.STRING,
      description: "A 2 to 3 sentence synthesis referencing exact scores, CGPA, subjects, or attendance norms.",
    },
    priorityLevel: {
      type: Type.STRING,
      description: "Must be one of: on-track, watch, or critical.",
    },
    highlights: {
      type: Type.ARRAY,
      description: "Exactly 3 specific analytical findings.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short 3-6 word insight heading." },
          impact: { type: Type.STRING, description: "Short metric or metric delta callout, e.g. '67% vs 75% norm' or 'Maths mean 64.2%'." },
          detail: { type: Type.STRING, description: "1 to 2 sentence explanation of why this matters." },
        },
        required: ["title", "impact", "detail"],
      },
    },
    actionPlan: {
      type: Type.ARRAY,
      description: "Exactly 3 concrete, practical next steps.",
      items: {
        type: Type.STRING,
      },
    },
    suggestedMentorNote: {
      type: Type.STRING,
      description: "For drawer mode, a ready-to-log 1-2 sentence mentor intervention note. Empty string for other modes.",
    },
  },
  required: ["headline", "summary", "priorityLevel", "highlights", "actionPlan"],
};

function getSystemInstruction(mode) {
  const domainContext = [
    "You are an academic performance advisor for an Indian University CBCS (Choice Based Credit System) analytics platform called ScholaMetrics.",
    "Academic rules: 10.0 CGPA scale (O >= 90%, A+ >= 80%, A >= 70%, B+ >= 60%, B >= 50%, C >= 45%, P >= 40%, F < 40% arrear/backlog).",
    "Pass mark per subject is 40% (or active threshold provided). UGC mandatory minimum attendance for End-Sem exam eligibility is 75% (or active threshold provided).",
    "Assessments progress across CIA 1, Mid-Sem, Lab / Viva, and End-Sem.",
    "Always cite exact numbers, percentages, CGPA values, roll numbers, or subject names from the provided JSON data. Never invent students or metrics.",
    "Keep language crisp, objective, supportive, and free of filler.",
  ].join(" ");

  if (mode === "cohort") {
    return `${domainContext} Your audience is the Dean of Academics / Faculty Mentor reviewing cohort analytics. Highlight branch/subject bottlenecks, arrear risks, attendance-score correlations, and urgent mentoring priorities. Keep 'summary' to 2-3 sentences, provide 3 'highlights', and 3 actionable faculty interventions in 'actionPlan'.`;
  }

  if (mode === "drawer") {
    return `${domainContext} Your audience is a Faculty Mentor preparing a 1:1 mentoring intervention for one student. Diagnose their strongest and weakest CBCS subjects, CIA-to-End-Sem trajectory, backlog risk, and UGC 75% attendance margin. Provide 3 'highlights', 3 mentoring steps in 'actionPlan', and a concise ready-to-save mentor note in 'suggestedMentorNote'.`;
  }

  return `${domainContext} Your audience is the Indian university student viewing their own Self-Service Dashboard. Address them directly ('Your...'), celebrate strong subjects, pinpoint where marks or attendance need urgent attention to stay >= 75% UGC eligible and avoid arrears, and give 3 practical weekly study/attendance steps in 'actionPlan'.`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(ai, mode, promptPayload) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await ai.models.generateContent({
        model: MODEL_NAME,
        contents: promptPayload,
        config: {
          systemInstruction: getSystemInstruction(mode),
          responseMimeType: "application/json",
          responseSchema: INSIGHT_RESPONSE_SCHEMA,
        },
      });
    } catch (err) {
      lastError = err;
      const status = err && typeof err === "object" ? err.status : undefined;
      if (status === 400 || status === 401 || status === 403 || status === 404 || status === 429) {
        throw err;
      }
      if (attempt === 0) {
        await sleep(600);
      }
    }
  }
  throw lastError;
}

function mapGeminiError(err) {
  const status = Number(err && typeof err === "object" ? err.status : 0) || 500;
  const rawMessage = err instanceof Error ? err.message : String(err || "Unknown error");
  const lower = rawMessage.toLowerCase();

  if (status === 403 || status === 400 || lower.includes("api_key_invalid") || lower.includes("permission_denied")) {
    return {
      statusCode: status === 403 ? 403 : 400,
      message: "Unable to verify Gemini API access. Please check your API key in the Settings > Secrets panel.",
    };
  }

  if (status === 429 || lower.includes("resource_exhausted") || lower.includes("quota")) {
    return {
      statusCode: 429,
      message: "Gemini API rate limit or quota reached. Please wait a moment or check your billing/quota in Settings > Secrets.",
    };
  }

  return {
    statusCode: status >= 400 && status < 600 ? status : 500,
    message: rawMessage || "Failed to generate AI insights. Please try again.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, model: MODEL_NAME });
  });

  app.post("/api/ai/insights", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      res.status(500).json({
        error: "Gemini API key is not configured yet. Please set GEMINI_API_KEY in Settings > Secrets.",
      });
      return;
    }

    const body = req.body || {};
    const mode = body.mode === "student" || body.mode === "drawer" ? body.mode : "cohort";
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 400) : "";
    const contextData = body.contextData && typeof body.contextData === "object" ? body.contextData : null;

    if (!contextData) {
      res.status(400).json({ error: "Missing academic contextData payload for AI analysis." });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const userPromptParts = [
      `Analysis Mode: ${mode.toUpperCase()}`,
      question ? `Specific Focus / Question from User: "${question}"` : "Specific Focus: Provide a balanced diagnostic and top 3 action priorities.",
      `Academic Context JSON:\n${JSON.stringify(contextData)}`,
    ];

    try {
      const response = await generateWithRetry(ai, mode, userPromptParts.join("\n\n"));
      const rawText = (response.text ?? "{}").trim();

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        res.status(502).json({
          error: "Received malformed response from AI model. Please click Generate again.",
        });
        return;
      }

      const priority =
        parsed.priorityLevel === "critical" || parsed.priorityLevel === "watch"
          ? parsed.priorityLevel
          : "on-track";

      res.json({
        headline: typeof parsed.headline === "string" ? parsed.headline : "Academic analysis ready.",
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        priorityLevel: priority,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 4) : [],
        actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan.slice(0, 4) : [],
        suggestedMentorNote:
          typeof parsed.suggestedMentorNote === "string" ? parsed.suggestedMentorNote : "",
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.statusCode).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ScholaMetrics server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start ScholaMetrics server:", err);
  process.exit(1);
});
