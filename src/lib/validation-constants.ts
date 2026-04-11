import { toast } from "sonner";

// Character limits
export const MAX_TITLE_LENGTH = 200;
export const MAX_SUBJECT_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_DISPATCH_CONTENT_LENGTH = 5000;
export const MAX_NAME_LENGTH = 150;
export const MAX_ROLE_LENGTH = 100;
export const MAX_REFERENCE_LENGTH = 150;

// File limits
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_UPLOAD_FILE_SIZE_MB = 25;
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_FILE_EXTENSIONS = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
];

export const BLOCKED_FILE_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr",
  ".zip", ".rar", ".7z", ".tar", ".gz",
  ".js", ".vbs", ".ps1", ".sh",
];

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  maxSizeMB: number = MAX_FILE_SIZE_MB
): FileValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024;

  // Check size
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `"${file.name}" excede o tamanho máximo de ${maxSizeMB}MB`,
    };
  }

  // Check empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: `"${file.name}" está vazio (0 bytes)`,
    };
  }

  // Check extension
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
  if (BLOCKED_FILE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `"${file.name}" tem um formato não permitido (${ext})`,
    };
  }

  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `"${file.name}" tem um formato não suportado (${ext}). Formatos aceites: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG`,
    };
  }

  return { valid: true };
}

/**
 * Validate an array of files, showing toast errors for rejected ones.
 * Returns only the valid files.
 */
export function validateFiles(
  files: File[],
  maxSizeMB: number = MAX_FILE_SIZE_MB
): File[] {
  const validFiles: File[] = [];

  for (const file of files) {
    const result = validateFile(file, maxSizeMB);
    if (result.valid) {
      validFiles.push(file);
    } else {
      toast.error("Ficheiro rejeitado", { description: result.error });
    }
  }

  return validFiles;
}

/** Helper to get today's date as YYYY-MM-DD for min date attributes */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Character counter component helper text */
export function charCountText(current: number, max: number): string {
  return `${current}/${max}`;
}
