import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .trim()
    .min(1, "الرسالة لا يمكن أن تكون فارغة")
    .max(4000, "الرسالة طويلة جداً (الحد الأقصى 4000 حرف)"),
});

export const assistantChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "الرسالة مطلوبة")
    .max(2000, "الرسالة يجب ألا تتجاوز 2000 حرف"),
  history: z
    .array(chatMessageSchema)
    .max(10, "سجل المحادثة يجب ألا يتجاوز 10 رسائل")
    .default([]),
  currentRoute: z
    .string()
    .max(200)
    .default(""),
  locale: z
    .enum(["ar", "en"])
    .default("ar"),
});

export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>;
