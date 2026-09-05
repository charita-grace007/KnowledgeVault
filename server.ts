import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { extractConceptualTags, BANNED_LITERAL_WORDS } from "./src/utils/resurface";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "re-mind-6783c",
    });
  } catch (err) {
    console.warn("Firebase admin initialization notice:", (err as Error).message);
  }
}

// Secret Manager & Gemini client state
let aiClient: GoogleGenAI | null = null;
let geminiApiKey: string | null = null;
let geminiKeySource: "secret_manager" | "environment_variable" | null = null;
let secretFetchPromise: Promise<string | null> | null = null;

/**
 * Retrieves the Gemini API key.
 * 1. Tries Google Cloud Secret Manager first.
 * 2. If Secret Manager fails or is unavailable, falls back to process.env.GEMINI_API_KEY.
 * 3. Logs explicitly which source was utilized.
 */
async function resolveGeminiApiKey(): Promise<string | null> {
  if (geminiApiKey) return geminiApiKey;

  if (!secretFetchPromise) {
    secretFetchPromise = (async () => {
      const projectId =
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.FIREBASE_PROJECT_ID ||
        "re-mind-6783c";
      const secretId =
        process.env.GEMINI_SECRET_NAME ||
        process.env.GEMINI_SECRET_ID ||
        process.env.GEMINI_API_KEY_SECRET_NAME ||
        "gemini-api-key";

      const secretName = secretId.startsWith("projects/")
        ? (secretId.includes("/versions/") ? secretId : `${secretId}/versions/latest`)
        : `projects/${projectId}/secrets/${secretId}/versions/latest`;

      // 1. Try Google Cloud Secret Manager first
      try {
        console.log(`[Gemini Auth] Attempting to retrieve API key from Secret Manager (${secretName})...`);
        const client = new SecretManagerServiceClient();
        const [version] = await client.accessSecretVersion({ name: secretName });
        const payload = version.payload?.data?.toString();
        if (payload && payload.trim().length > 0) {
          geminiApiKey = payload.trim();
          geminiKeySource = "secret_manager";
          console.log(`[Gemini Auth] Successfully loaded Gemini API key from Google Cloud Secret Manager (${secretName}).`);
          return geminiApiKey;
        }
      } catch (err: any) {
        console.warn(`[Gemini Auth Notice] Secret Manager unavailable (${err?.message || err}).`);

        // Check alternate uppercase secret name before falling back to env var
        if (
          !process.env.GEMINI_SECRET_NAME &&
          !process.env.GEMINI_SECRET_ID &&
          !process.env.GEMINI_API_KEY_SECRET_NAME &&
          secretId === "gemini-api-key"
        ) {
          try {
            const client = new SecretManagerServiceClient();
            const altName = `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`;
            const [altVersion] = await client.accessSecretVersion({ name: altName });
            const altPayload = altVersion.payload?.data?.toString();
            if (altPayload && altPayload.trim().length > 0) {
              geminiApiKey = altPayload.trim();
              geminiKeySource = "secret_manager";
              console.log(`[Gemini Auth] Successfully loaded Gemini API key from Google Cloud Secret Manager (${altName}).`);
              return geminiApiKey;
            }
          } catch {
            // Proceed to fallback
          }
        }
      }

      // 2. Fall back to process.env.GEMINI_API_KEY
      const envKey = process.env.GEMINI_API_KEY?.trim();
      if (envKey && envKey.length > 0) {
        geminiApiKey = envKey;
        geminiKeySource = "environment_variable";
        console.log("[Gemini Auth] Using working fallback: Gemini API key loaded from environment variable (process.env.GEMINI_API_KEY).");
        return geminiApiKey;
      }

      console.error("[Gemini Auth Error] Neither Google Cloud Secret Manager nor process.env.GEMINI_API_KEY provided a valid API key.");
      return null;
    })();
  }

  return secretFetchPromise;
}

// Lazy initialization for Gemini client using the resolved key
function getGeminiClient(): GoogleGenAI | null {
  // If not yet initialized and synchronous access occurs, try process.env.GEMINI_API_KEY if not resolved
  if (!geminiApiKey && process.env.GEMINI_API_KEY?.trim()) {
    geminiApiKey = process.env.GEMINI_API_KEY.trim();
    geminiKeySource = "environment_variable";
  }

  if (!aiClient && geminiApiKey) {
    aiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return aiClient;
}

// Robust fallback summarizer & conceptual tag extractor
function fallbackSummarize(text: string): { summary: string; tags: string[] } {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const summary = sentences.length <= 2 
    ? sentences.join(" ") 
    : `${sentences.slice(0, 2).join(" ")}`;

  // Extract inline hashtags (excluding banned literal words)
  const hashtags = Array.from(text.matchAll(/#([a-zA-Z0-9_\u00C0-\u017F]+)/g))
    .map((m) => m[1].toLowerCase())
    .filter((t) => !BANNED_LITERAL_WORDS.has(t));

  // Extract conceptual tags from topic clusters
  const conceptual = extractConceptualTags(text);
  const combined = Array.from(new Set([...hashtags, ...conceptual])).slice(0, 3);

  return {
    summary: summary.slice(0, 500) || text.slice(0, 160),
    tags: combined.length > 0 ? combined : ["reflection"],
  };
}

// Auth verification middleware
async function verifyAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: "Missing ID token" });
  }

  try {
    // Verify Firebase Auth ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    return next();
  } catch (authError) {
    console.error("Token verification failed:", (authError as Error).name);
    return res.status(401).json({ error: "Invalid or expired Firebase Auth token" });
  }
}

async function startServer() {
  // Resolve Gemini API key at startup (Secret Manager first, env var fallback)
  await resolveGeminiApiKey();

  const app = express();
  const PORT = 3000;

  // JSON Body Parser with security limit
  app.use(express.json({ limit: "500kb" }));

  // In-memory cache & gentle rate-limiter
  const resurfaceCache = new Map<string, { matchId: string | null; thematicOverlap: string[]; explanation: string | null; expires: number }>();
  const userLastResurfaceCall = new Map<string, number>();

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Gemini Summarize & Conceptual Tagging endpoint
  app.post("/api/gemini/summarize", verifyAuth, async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required and must be a non-empty string" });
      }

      if (text.length > 10000) {
        return res.status(400).json({ error: "Text exceeds 10,000 character limit" });
      }

      const sanitizedText = text.trim();
      const ai = getGeminiClient();

      if (!ai) {
        // Safe fallback if API key is not configured
        const fallback = fallbackSummarize(sanitizedText);
        return res.json({
          summary: fallback.summary,
          tags: fallback.tags,
          source: "fallback",
        });
      }

      const summarizePrompt = `Analyze this user note or thought.
1. Provide a concise 1-2 sentence summary capturing the key insight, reflection, or takeaway.
2. Provide 2 to 3 concise, lowercase single-word or hyphenated conceptual tags (no '#' prefix) categorizing the deeper topical or philosophical themes (for example: impermanence, mortality, transience, stoicism, existentialism, grief, focus, mindfulness, creativity, psychology, philosophy, etc.).

CRITICAL RULES FOR TAGS:
- Extract GENUINE HIGH-LEVEL TOPICAL AND CONCEPTUAL THEMES, NOT LITERAL WORDS FROM THE TEXT.
- NEVER return superficial words, verbs, auxiliaries, or common nouns that appear in the draft (such as 'life', 'might', 'want', 'think', 'good', 'bad', 'time', 'things', 'soon', 'long', 'air', 'going', 'kinda', 'note', 'thought').
- If the thought reflects on death, dying, ending of life, or transience (even casually or metaphorically, e.g. 'want it to end', 'like air', 'vapor'), categorize with conceptual terms like 'mortality', 'impermanence', 'transience', or 'existentialism'.

User note:
"""${sanitizedText}"""`;

      const summarizeConfig = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A concise 1-2 sentence summary of the note.",
            },
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "2 to 3 lowercase conceptual/topical tags categorizing the deeper themes.",
            },
          },
          required: ["summary", "tags"],
        },
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: summarizePrompt,
          config: summarizeConfig,
        });
      } catch (errFirst: any) {
        // Retry once on transient 503 error after 350ms
        const msg = String(errFirst?.message || errFirst);
        if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: summarizePrompt,
            config: summarizeConfig,
          });
        } else {
          throw errFirst;
        }
      }

      const responseText = response.text || "{}";
      let parsedData: { summary?: string; tags?: string[] } = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        parsedData = fallbackSummarize(sanitizedText);
      }

      const cleanSummary = (parsedData.summary || "").trim().slice(0, 1000) || fallbackSummarize(sanitizedText).summary;
      
      // Filter out any literal or banned words
      let cleanTags = Array.isArray(parsedData.tags)
        ? parsedData.tags
            .map((t) => String(t).trim().replace(/^#/, "").toLowerCase())
            .filter((t) => t.length > 2 && t.length <= 50 && !BANNED_LITERAL_WORDS.has(t))
            .slice(0, 5)
        : [];

      // If Gemini returned tags that were all literal/banned, use conceptual extractor
      if (cleanTags.length === 0) {
        cleanTags = extractConceptualTags(sanitizedText);
      }

      return res.json({
        summary: cleanSummary,
        tags: cleanTags.length > 0 ? cleanTags : ["reflection"],
        source: "gemini",
      });
    } catch (err: any) {
      console.warn("Gemini summarize fallback notice:", (err as Error).name);
      // Fallback so note saving is never blocked
      const fallback = fallbackSummarize(String(req.body?.text || ""));
      return res.json({
        summary: fallback.summary,
        tags: fallback.tags,
        source: "fallback",
      });
    }
  });

  // Gemini Semantic Resurface endpoint
  app.post("/api/gemini/resurface", verifyAuth, async (req, res) => {
    try {
      const { text, candidates } = req.body;

      if (!text || typeof text !== "string" || text.trim().length < 15) {
        return res.json({ matchId: null, thematicOverlap: [] });
      }

      if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.json({ matchId: null, thematicOverlap: [] });
      }

      const userId = (req as any).user?.uid || "anonymous";
      const cacheKey = `${userId}_${text.trim().toLowerCase().slice(0, 100)}`;

      // Check cache first
      const cached = resurfaceCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return res.json({
          matchId: cached.matchId,
          thematicOverlap: cached.thematicOverlap,
          explanation: cached.explanation,
        });
      }

      // Gentle per-user throttling: 2.5 seconds minimum interval between AI calls
      const lastCall = userLastResurfaceCall.get(userId) || 0;
      if (Date.now() - lastCall < 2500) {
        // Return null match or cached match without setting an error state
        return res.json({ matchId: null, thematicOverlap: [] });
      }
      userLastResurfaceCall.set(userId, Date.now());

      // Format candidate items compactly for Gemini evaluation
      const safeCandidates = candidates.slice(0, 15).map((c: any) => ({
        id: String(c.id || ""),
        summary: String(c.summary || "").slice(0, 200),
        tags: Array.isArray(c.tags) ? c.tags.slice(0, 5).join(", ") : "",
        text: String(c.text || "").slice(0, 150),
      })).filter((c) => c.id && (c.summary || c.text));

      if (safeCandidates.length === 0) {
        return res.json({ matchId: null, thematicOverlap: [] });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ matchId: null, thematicOverlap: [] });
      }

      const prompt = `You are a semantic memory recall assistant.
A user is writing a new thought:
"""${text.trim().slice(0, 2000)}"""

Here are candidate memories/notes they previously saved:
${JSON.stringify(safeCandidates, null, 2)}

Your task:
1. Compare the core meaning, themes, and conceptual intent of the new draft with each past memory's summary, tags, and content.
2. Determine if any past memory shares a genuine conceptual, philosophical, or topical connection (such as impermanence, mortality, deep focus, stoicism, existential reflection, creativity, etc.).
3. Crucially: do NOT match on shallow or literal shared words (such as "like", "life", "time", "day", "thing"). Match ONLY when there is a real conceptual connection between the draft's meaning and the candidate memory.
4. If a genuine conceptual link exists:
   - "matchId": the ID of the single most conceptually relevant candidate memory.
   - "thematicOverlap": exactly 2 to 3 short, polished thematic labels describing the conceptual overlap (e.g. ["impermanence", "mortality", "transience"], or ["stoic philosophy", "finitude"], or ["deep focus", "attention"]). Each label should be 1 to 3 words. Never return raw common words like "like", "life", "time".
   - "explanation": a 1-sentence explanation of why this past memory is relevant to what they are writing right now.
5. If no candidate has a genuine conceptual connection to the draft's meaning, return matchId as null or empty string and thematicOverlap as [].`;

      const schemaConfig = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchId: {
              type: Type.STRING,
              description: "The ID of the most relevant candidate memory, or empty string if none.",
            },
            thematicOverlap: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 to 3 short thematic overlap labels capturing the core conceptual link.",
            },
            explanation: {
              type: Type.STRING,
              description: "Brief reason why it's topically relevant.",
            },
          },
          required: ["matchId", "thematicOverlap"],
        },
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: schemaConfig,
        });
      } catch (errFirst: any) {
        // Retry once on transient 503 error after 350ms
        const msg = String(errFirst?.message || errFirst);
        if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: schemaConfig,
          });
        } else {
          throw errFirst;
        }
      }

      const responseText = response.text || "{}";
      let parsed: { matchId?: string; thematicOverlap?: string[]; explanation?: string } = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { matchId: undefined, thematicOverlap: [] };
      }

      const foundId = parsed.matchId && parsed.matchId.trim() !== "" ? parsed.matchId.trim() : null;
      const cleanThematicOverlap = Array.isArray(parsed.thematicOverlap)
        ? parsed.thematicOverlap
            .map((t) => String(t || "").trim())
            .filter((t) => t.length > 2 && !BANNED_LITERAL_WORDS.has(t.toLowerCase()))
            .slice(0, 3)
        : [];

      // Cache the result for 3 minutes
      resurfaceCache.set(cacheKey, {
        matchId: foundId,
        thematicOverlap: cleanThematicOverlap,
        explanation: parsed.explanation || null,
        expires: Date.now() + 180000,
      });

      return res.json({
        matchId: foundId,
        thematicOverlap: cleanThematicOverlap,
        explanation: parsed.explanation || null,
      });
    } catch (err: any) {
      console.warn("Gemini resurface notice:", (err as Error).name);
      return res.json({ matchId: null, thematicOverlap: [] });
    }
  });

  // Vite middleware in dev; static file serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Re:mind server running on port ${PORT}`);
  });
}

startServer();
