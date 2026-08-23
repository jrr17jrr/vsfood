import type { CSSProperties } from "react";

export type StoreThemeKey =
  | "primary"
  | "secondary"
  | "background"
  | "card"
  | "header"
  | "categoryBg"
  | "text"
  | "textMuted"
  | "button"
  | "buttonText"
  | "price"
  | "categoryActive"
  | "border";

export type StoreTheme = Record<StoreThemeKey, string>;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const STORE_THEME_KEYS: StoreThemeKey[] = [
  "primary",
  "secondary",
  "background",
  "card",
  "header",
  "categoryBg",
  "text",
  "textMuted",
  "button",
  "buttonText",
  "price",
  "categoryActive",
  "border",
];

// Mesma aparência que o VSFood já tem hoje — aplicar esse tema numa loja
// existente não muda nada visualmente.
export const DEFAULT_STORE_THEME: StoreTheme = {
  primary: "#F0631D",
  secondary: "#F0B429",
  background: "#FFFFFF",
  card: "#FFFFFF",
  header: "#FFFFFF",
  categoryBg: "#F5F5F5",
  text: "#1A1A1A",
  textMuted: "#6B7280",
  button: "#F0631D",
  buttonText: "#FFFFFF",
  price: "#F0631D",
  categoryActive: "#F0631D",
  border: "#E5E7EB",
};

export const THEME_PRESETS: { key: string; label: string; theme: StoreTheme }[] = [
  { key: "default", label: "Padrão VSFood", theme: DEFAULT_STORE_THEME },
  {
    key: "dark",
    label: "Escuro",
    theme: {
      primary: "#F0631D",
      secondary: "#F0B429",
      background: "#121212",
      card: "#1E1E1E",
      header: "#1A1A1A",
      categoryBg: "#262626",
      text: "#F5F5F5",
      textMuted: "#A1A1AA",
      button: "#F0631D",
      buttonText: "#FFFFFF",
      price: "#FF8A50",
      categoryActive: "#F0631D",
      border: "#333333",
    },
  },
  {
    key: "light",
    label: "Claro",
    theme: {
      primary: "#F0631D",
      secondary: "#FDBA31",
      background: "#FFFFFF",
      card: "#FAFAFA",
      header: "#FFFFFF",
      categoryBg: "#F0F0F0",
      text: "#111111",
      textMuted: "#666666",
      button: "#F0631D",
      buttonText: "#FFFFFF",
      price: "#F0631D",
      categoryActive: "#F0631D",
      border: "#DDDDDD",
    },
  },
  {
    key: "burger",
    label: "Burger",
    theme: {
      primary: "#C1272D",
      secondary: "#F5A623",
      background: "#FFF8E7",
      card: "#FFFFFF",
      header: "#7A1E14",
      categoryBg: "#FFE9C7",
      text: "#2B1810",
      textMuted: "#8A6E5C",
      button: "#C1272D",
      buttonText: "#FFFFFF",
      price: "#C1272D",
      categoryActive: "#C1272D",
      border: "#E8C99B",
    },
  },
  {
    key: "elegant",
    label: "Elegante",
    theme: {
      primary: "#C9A227",
      secondary: "#8A6D1F",
      background: "#0F0F10",
      card: "#18181A",
      header: "#0F0F10",
      categoryBg: "#1F1F22",
      text: "#F5F0E6",
      textMuted: "#A8A29E",
      button: "#C9A227",
      buttonText: "#1A1A1A",
      price: "#C9A227",
      categoryActive: "#C9A227",
      border: "#2C2C30",
    },
  },
];

/**
 * Nunca confia em JSON cru vindo do banco/form: cada uma das 13 chaves só
 * entra se for exatamente um hex de 6 dígitos — qualquer outra coisa (CSS
 * arbitrário, `url()`, chave ausente/renomeada) cai no default daquela chave
 * especificamente, nunca quebra a página nem permite injetar CSS.
 */
export function parseStoreTheme(raw: unknown): StoreTheme {
  const source = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>;
  const theme = { ...DEFAULT_STORE_THEME };
  for (const key of STORE_THEME_KEYS) {
    const value = source[key];
    if (typeof value === "string" && HEX_RE.test(value)) {
      theme[key] = value;
    }
  }
  return theme;
}

export function isValidHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

const CSS_VAR_NAME: Record<StoreThemeKey, string> = {
  primary: "--store-primary",
  secondary: "--store-secondary",
  background: "--store-bg",
  card: "--store-card",
  header: "--store-header",
  categoryBg: "--store-category-bg",
  text: "--store-text",
  textMuted: "--store-text-muted",
  button: "--store-button",
  buttonText: "--store-button-text",
  price: "--store-price",
  categoryActive: "--store-category-active",
  border: "--store-border",
};

export function storeThemeToCssVars(theme: StoreTheme): CSSProperties {
  const style: Record<string, string> = {};
  for (const key of STORE_THEME_KEYS) {
    style[CSS_VAR_NAME[key]] = theme[key];
  }
  return style as CSSProperties;
}

function relativeLuminance(hex: string): number {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG entre duas cores hex — 1 (idêntico) a 21 (preto/branco). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

const MIN_CONTRAST = 3;

/**
 * Não bloqueia nada — só sinaliza pares de cor com contraste baixo o
 * suficiente pra prejudicar a leitura.
 */
export function getContrastWarnings(theme: StoreTheme): string[] {
  const pairs: { a: StoreThemeKey; b: StoreThemeKey; label: string }[] = [
    { a: "text", b: "background", label: "Texto principal e fundo" },
    { a: "textMuted", b: "background", label: "Texto secundário e fundo" },
    { a: "buttonText", b: "button", label: "Texto do botão e botão" },
    { a: "price", b: "card", label: "Preço e card" },
    { a: "text", b: "card", label: "Texto e card" },
  ];

  const warnings: string[] = [];
  for (const pair of pairs) {
    if (contrastRatio(theme[pair.a], theme[pair.b]) < MIN_CONTRAST) {
      warnings.push(`${pair.label}: essa combinação pode dificultar a leitura.`);
    }
  }
  return warnings;
}
