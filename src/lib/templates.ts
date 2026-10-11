export type TemplateId = "classic" | "compact" | "receipt";

export const TEMPLATES: { value: TemplateId; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "compact", label: "Compact" },
  { value: "receipt", label: "Receipt" },
];

export const DEFAULT_TEMPLATE: TemplateId = "classic";
