
/**
 * Utilitários para manipulação de cores e contraste.
 */

/**
 * Converte uma cor Hexadecimal para o formato HSL compatível com o CSS-in-JS e Tailwind.
 * @param hex string Hexadecimal (ex: #ffffff ou #000)
 * @returns string no formato "H, S%, L%"
 */
export function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Retornamos com vírgulas para compatibilidade total
  return `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
}

/**
 * Calcula o foreground ideal (branco ou preto marinho) baseado na luminância da cor de fundo.
 * @param hex string Hexadecimal da cor de fundo
 * @returns string HSL representativa do foreground
 */
export function getContrastForeground(hex: string): string {
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!rgb) return "0, 0%, 100%"; // Fallback branco

  const r = parseInt(rgb[1], 16);
  const g = parseInt(rgb[2], 16);
  const b = parseInt(rgb[3], 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Se luminância alta (fundo claro), usar texto escuro. Senão, texto branco.
  return luminance > 0.5 ? "210, 52%, 10%" : "0, 0%, 100%";
}

/**
 * Aplica as propriedades do tema do time ao elemento raiz.
 * @param primaryColor Hexadecimal da cor primária
 */
export function applyTeamTheme(primaryColor: string) {
  const primaryHSL = hexToHSL(primaryColor);
  const foregroundHSL = getContrastForeground(primaryColor);

  if (primaryHSL) {
    document.documentElement.style.setProperty("--team-primary", primaryHSL);
    document.documentElement.style.setProperty("--team-primary-foreground", foregroundHSL);
  }
}
