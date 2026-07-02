import type { DocType } from "./career";

// Готовые документы для блока «Обязательные документы». Названия берутся из
// docTypeLabel (локализованы), поэтому здесь только тип и подсказка «обычно
// обязательный / по желанию» — работодатель добавляет в один клик и может
// переключить обязательность. Юридически чувствительные (права) — в группе
// «по желанию»: их стоит запрашивать только для профильных ролей.

export type DocumentTemplate = {
  type: DocType;
  /** Значение по умолчанию для флажка «Обязательно» при добавлении. */
  required: boolean;
};

// Часто обязательные документы (по умолчанию отмечаются как обязательные).
export const REQUIRED_DOCS: DocumentTemplate[] = [
  { type: "cv", required: true },
  { type: "ktp", required: true },
  { type: "passport", required: true },
  { type: "work_permit", required: true },
  { type: "health_cert", required: true },
];

// Документы по желанию (по умолчанию — необязательные).
export const OPTIONAL_DOCS: DocumentTemplate[] = [
  { type: "diploma", required: false },
  { type: "certificate", required: false },
  { type: "reference", required: false },
  { type: "portfolio", required: false },
  { type: "driver_license", required: false },
  { type: "police_check", required: false },
  { type: "photo", required: false },
];
