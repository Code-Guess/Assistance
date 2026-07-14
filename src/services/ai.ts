import OpenAI from "openai";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import type { TutorChatMessage, TutorChapter } from "../schemas.js";

const API_KEY = process.env["OPENROUTER_API_KEY"];

if (!API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY must be set. Add it in the Render dashboard under Environment.",
  );
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: API_KEY,
});

// Free, vision-capable, large-context model.
const MODEL = "google/gemma-4-31b-it:free";

const ADVANCE_MARKER = "[NEXT_CHAPTER]";

function buildSystemPrompt(
  documentText: string,
  currentChapter: number,
  chapters: TutorChapter[],
): string {
  const currentChapterTitle =
    chapters.find((c) => c.index === currentChapter)?.title ??
    `Chapitre ${currentChapter + 1}`;
  const remainingChapters =
    chapters
      .filter((c) => c.index > currentChapter)
      .map((c) => c.title)
      .join(", ") || "aucun — c'est le dernier chapitre";

  return `Tu es un tuteur personnel. Tu as accès à un document que l'utilisateur a chargé. Tu dois exclusivement travailler sur ce document. Tu ne réponds à aucune question qui n'est pas liée à son contenu.

DOCUMENT :
---
${documentText}
---

PROGRESSION ACTUELLE :
- Chapitre en cours : ${currentChapterTitle}
- Chapitres restants : ${remainingChapters}

CONSIGNES STRICTES :

1. Tu travailles uniquement chapitre par chapitre dans l'ordre du document.
2. Tu commences par présenter le chapitre en cours de façon claire et concise.
3. Tu poses des questions pour vérifier la compréhension de l'utilisateur avant de passer au chapitre suivant.
4. Tu ne passes au chapitre suivant que si l'utilisateur a démontré qu'il a compris le chapitre actuel. Quand c'est le cas, tu indiques clairement dans ta réponse le mot-clé exact : ${ADVANCE_MARKER}
5. Si l'utilisateur envoie une photo, tu l'analyses dans le contexte du chapitre en cours.
6. Tu ne fais jamais de résumé de toute la leçon d'un coup. Tu restes dans le chapitre actuel.
7. Si l'utilisateur essaie de te parler d'un sujet hors du document, tu le ramènes poliment au contenu du document.
8. Tu rédiges toutes tes réponses en LaTeX. Les formules sont entre $...$ ou $$...$$. Le texte courant est en LaTeX également (\\textbf{}, \\section*{}, etc.).
9. Tu es patient, précis, et tu adaptes ton niveau à celui de l'utilisateur.
10. Tu ne te présentes pas, tu ne donnes pas de nom. Tu commences directement par le contenu.
11. Tu n'utilises jamais la syntaxe Markdown (pas de #, ##, **, listes à puces Markdown). Tout le formatage passe exclusivement par LaTeX (\\textbf{}, \\section*{}, \\begin{itemize}, etc.).
12. Tu ne mentionnes jamais ton propre rôle ("en tant qu'assistant", "je suis une IA"). Tu réponds directement avec le contenu pédagogique, sans label ni préambule.`;
}

export interface TutorReply {
  reply: string;
  advanceChapter: boolean;
}

export async function generateTutorReply(params: {
  documentText: string;
  currentChapter: number;
  chapters: TutorChapter[];
  history: TutorChatMessage[];
  message: string;
  images: string[];
}): Promise<TutorReply> {
  const { documentText, currentChapter, chapters, history, message, images } =
    params;

  const systemPrompt = buildSystemPrompt(documentText, currentChapter, chapters);

  // Truncate to the last 20 messages while always keeping the system
  // prompt + full document text.
  const truncatedHistory = history.slice(-20);

  const userContent: ChatCompletionContentPart[] = [
    ...images.map(
      (data): ChatCompletionContentPart => ({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${data}` },
      }),
    ),
    { type: "text", text: message },
  ];

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      ...truncatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: userContent },
    ],
  });

  const rawReply = completion.choices[0]?.message?.content ?? "";
  const advanceChapter = rawReply.includes(ADVANCE_MARKER);
  const reply = rawReply.split(ADVANCE_MARKER).join("").trim();

  return { reply, advanceChapter };
}
