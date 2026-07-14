import { Router, type IRouter } from "express";
import pdfParse from "pdf-parse";
import {
  ExtractPdfBody,
  ExtractPdfResponse,
  SendTutorChatMessageBody,
  SendTutorChatMessageResponse,
} from "../schemas.js";
import { detectChapters } from "../services/chapters.js";
import { generateTutorReply } from "../services/ai.js";

const router: IRouter = Router();

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB

router.post("/tutor/extract", async (req, res) => {
  const parseResult = ExtractPdfBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Requête invalide." });
    return;
  }

  const { file_base64, file_name } = parseResult.data;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(file_base64, "base64");
  } catch {
    req.log.warn({ file_name }, "Failed to decode base64 PDF payload");
    res.status(400).json({ error: "Fichier PDF invalide." });
    return;
  }

  if (buffer.byteLength === 0) {
    res.status(400).json({ error: "Fichier PDF vide." });
    return;
  }

  if (buffer.byteLength > MAX_PDF_BYTES) {
    res.status(400).json({ error: "Le fichier dépasse la limite de 20 Mo." });
    return;
  }

  try {
    const parsed = await pdfParse(buffer);
    const text: string = parsed.text ?? "";
    const chapters = detectChapters(text);
    const data = ExtractPdfResponse.parse({ text, chapters });
    res.json(data);
  } catch (err) {
    req.log.error({ err, file_name }, "PDF extraction failed");
    res.status(400).json({ error: "Impossible de lire ce fichier PDF." });
  }
});

router.post("/tutor/chat", async (req, res) => {
  const parseResult = SendTutorChatMessageBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Requête invalide." });
    return;
  }

  const {
    document_text,
    current_chapter,
    chapters,
    history,
    message,
    images,
  } = parseResult.data;

  try {
    const { reply, advanceChapter } = await generateTutorReply({
      documentText: document_text,
      currentChapter: current_chapter,
      chapters,
      history,
      message,
      images: images ?? [],
    });

    const data = SendTutorChatMessageResponse.parse({
      reply,
      advance_chapter: advanceChapter,
    });
    res.json(data);
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status;
    if (status === 429) {
      req.log.warn({ err }, "OpenRouter quota exceeded");
      res.status(429).json({
        error: "Limite atteinte, réessaie dans quelques minutes.",
      });
      return;
    }
    req.log.error({ err }, "Tutor chat generation failed");
    res.status(400).json({ error: "L'IA n'a pas pu répondre." });
  }
});

export default router;
