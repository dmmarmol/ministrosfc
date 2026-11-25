import { type Request, type Response, NextFunction } from "express";
import { z, type ZodIssue, type ZodSchema } from "zod";
import { ErrorCode } from "../utils/error-codes";

type ValidationTarget = "body" | "params" | "query";

const expectedTypeLabels: Record<string, string> = {
  array: "una lista",
  boolean: "un valor booleano",
  date: "una fecha",
  file: "un archivo",
  int: "un número entero",
  number: "un número",
  object: "un objeto",
  string: "un texto",
};

function formatLimit(value: number | bigint, origin: string): string {
  if (origin === "string") return `${value} caracteres`;
  if (origin === "array") return `${value} elementos`;
  if (origin === "file") return `${value} bytes`;
  return String(value);
}

export function formatValidationIssue(issue: ZodIssue): string {
  switch (issue.code) {
    case "invalid_type":
      if (issue.message.endsWith("received undefined")) {
        return "Este campo es obligatorio.";
      }
      if (issue.message.endsWith("received null")) {
        return "El valor no puede ser nulo.";
      }
      return `El valor debe ser ${expectedTypeLabels[issue.expected] ?? "válido"}.`;
    case "too_small":
      if (issue.exact) {
        return `Debe tener exactamente ${formatLimit(issue.minimum, issue.origin)}.`;
      }
      if (issue.origin === "string" || issue.origin === "array") {
        return `Debe tener al menos ${formatLimit(issue.minimum, issue.origin)}.`;
      }
      return `Debe ser ${issue.inclusive === false ? "mayor que" : "al menos"} ${issue.minimum}.`;
    case "too_big":
      if (issue.exact) {
        return `Debe tener exactamente ${formatLimit(issue.maximum, issue.origin)}.`;
      }
      if (issue.origin === "string" || issue.origin === "array") {
        return `No puede superar ${formatLimit(issue.maximum, issue.origin)}.`;
      }
      return `Debe ser ${issue.inclusive === false ? "menor que" : "como máximo"} ${issue.maximum}.`;
    case "invalid_format":
      switch (issue.format) {
        case "email":
          return "El correo electrónico no tiene un formato válido.";
        case "uuid":
          return "Debe tener un formato UUID válido.";
        case "datetime":
          return "Debe ser una fecha y hora válida.";
        case "date":
          return "Debe ser una fecha válida.";
        case "url":
          return "Debe ser una URL válida.";
        default:
          return "El formato no es válido.";
      }
    case "invalid_value":
      return `El valor debe ser uno de los siguientes: ${issue.values.join(", ")}.`;
    case "unrecognized_keys":
      return `Los siguientes campos no están permitidos: ${issue.keys.join(", ")}.`;
    case "invalid_union":
      return "El valor no coincide con ninguno de los formatos permitidos.";
    case "not_multiple_of":
      return `Debe ser múltiplo de ${issue.divisor}.`;
    case "custom":
      return issue.message;
    default:
      return "El valor no es válido.";
  }
}

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // Only expose field-level details to authenticated users.
      // Unauthenticated callers receive a generic message to avoid
      // leaking schema information to potential attackers.
      const isAuthenticated = !!req.user;
      const body: Record<string, unknown> = {
        code: ErrorCode.VALIDATION_ERROR,
        message: "No se pudo validar la solicitud.",
        statusCode: 400,
      };
      if (isAuthenticated) {
        body.errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: formatValidationIssue(issue),
        }));
      }
      res.status(400).json(body);
      return;
    }

    req[target] = result.data;
    next();
  };
}

// Common reusable schemas
export const uuidSchema = z.object({
  id: z.uuid("El formato del ID no es válido."),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});
