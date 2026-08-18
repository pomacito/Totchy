import { z } from "zod";

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата має бути у форматі YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Некоректна дата");

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Пошуковий запит не може бути порожнім").max(200),
  region: z.string().max(200).optional(),
  type: z
    .enum([
      "AR_CRIMEA",
      "OBLAST",
      "RAION",
      "HROMADA",
      "CITY",
      "TOWN",
      "VILLAGE",
      "URBAN_SETTLEMENT",
      "CITY_DISTRICT",
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const compareRequestSchema = z.object({
  katottgCodes: z.array(z.string().min(1)).min(2, "Потрібно щонайменше два об'єкти").max(10, "Максимум 10 об'єктів"),
  asOfDate: isoDateSchema.optional(),
});

export const reportRequestSchema = z.object({
  type: z.enum([
    "SINGLE_TERRITORY",
    "COMPARISON",
    "REGIONAL",
    "VERSION_DIFF",
    "ANALYTICS_PERIOD",
    "UPDATE_LOG",
  ]),
  format: z.enum(["PDF", "XLSX", "CSV", "HTML"]),
  params: z.record(z.unknown()),
});
