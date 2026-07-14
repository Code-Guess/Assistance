import { z } from "zod";

export const TutorChapter = z.object({
  index: z.number().int().nonnegative(),
  title: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});
export type TutorChapter = z.infer<typeof TutorChapter>;

export const TutorChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type TutorChatMessage = z.infer<typeof TutorChatMessage>;

export const ExtractPdfBody = z.object({
  file_base64: z.string().min(1),
  file_name: z.string().min(1),
});

export const ExtractPdfResponse = z.object({
  text: z.string(),
  chapters: z.array(TutorChapter),
});

export const SendTutorChatMessageBody = z.object({
  document_text: z.string(),
  current_chapter: z.number().int().nonnegative(),
  chapters: z.array(TutorChapter),
  history: z.array(TutorChatMessage),
  message: z.string(),
  images: z.array(z.string()).optional(),
});

export const SendTutorChatMessageResponse = z.object({
  reply: z.string(),
  advance_chapter: z.boolean(),
});

export const HealthCheckResponse = z.object({
  status: z.literal("ok"),
});
