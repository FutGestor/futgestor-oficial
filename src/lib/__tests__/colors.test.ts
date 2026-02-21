import { describe, it, expect } from "vitest";
import { hexToHSL, getContrastForeground } from "../colors";

describe("hexToHSL", () => {
  it("deve converter branco (#ffffff) para HSL", () => {
    const result = hexToHSL("#ffffff");
    expect(result).toBe("0, 0%, 100%");
  });

  it("deve converter preto (#000000) para HSL", () => {
    const result = hexToHSL("#000000");
    expect(result).toBe("0, 0%, 0%");
  });

  it("deve converter vermelho (#ff0000) para HSL", () => {
    const result = hexToHSL("#ff0000");
    expect(result).toBe("0, 100%, 50%");
  });

  it("deve converter verde (#00ff00) para HSL", () => {
    const result = hexToHSL("#00ff00");
    expect(result).toBe("120, 100%, 50%");
  });

  it("deve converter azul (#0000ff) para HSL", () => {
    const result = hexToHSL("#0000ff");
    expect(result).toBe("240, 100%, 50%");
  });

  it("deve aceitar hex sem #", () => {
    const result = hexToHSL("ffffff");
    expect(result).toBe("0, 0%, 100%");
  });

  it("deve retornar null para hex inválido", () => {
    const result = hexToHSL("invalid");
    expect(result).toBeNull();
  });

  it("deve retornar null para string vazia", () => {
    const result = hexToHSL("");
    expect(result).toBeNull();
  });

  it("deve converter cor do FutGestor (#16a34a)", () => {
    const result = hexToHSL("#16a34a");
    expect(result).not.toBeNull();
    // HSL aproximado: 142°, 76%, 36%
    expect(result).toContain("142");
  });
});

describe("getContrastForeground", () => {
  it("deve retornar branco para fundo escuro", () => {
    const result = getContrastForeground("#000000");
    expect(result).toBe("0, 0%, 100%");
  });

  it("deve retornar escuro para fundo claro", () => {
    const result = getContrastForeground("#ffffff");
    expect(result).toBe("210, 52%, 10%");
  });

  it("deve retornar branco para azul escuro", () => {
    const result = getContrastForeground("#1e3a8a");
    expect(result).toBe("0, 0%, 100%");
  });

  it("deve retornar escuro para amarelo claro", () => {
    const result = getContrastForeground("#fef08a");
    expect(result).toBe("210, 52%, 10%");
  });

  it("deve retornar branco como fallback para hex inválido", () => {
    const result = getContrastForeground("invalid");
    expect(result).toBe("0, 0%, 100%");
  });

  it("deve funcionar com hex sem #", () => {
    const result = getContrastForeground("000000");
    expect(result).toBe("0, 0%, 100%");
  });
});
