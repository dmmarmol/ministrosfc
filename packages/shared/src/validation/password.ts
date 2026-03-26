import { z } from "zod";

export const PASSWORD_RULES = [
  { regex: /.{8,}/, message: "Mínimo 8 caracteres" },
  { regex: /[A-Z]/, message: "Al menos una letra mayúscula" },
  { regex: /[a-z]/, message: "Al menos una letra minúscula" },
  { regex: /[0-9]/, message: "Al menos un número" },
  { regex: /[^A-Za-z0-9]/, message: "Al menos un carácter especial (!@#$...)" },
] as const;

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(128, "Máximo 128 caracteres")
  .superRefine((val, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.regex.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: rule.message,
        });
      }
    }
  });
