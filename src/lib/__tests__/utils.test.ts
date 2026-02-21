import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn (className merger)", () => {
  it("deve mesclar classes simples", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("deve remover classes duplicadas do Tailwind", () => {
    // Tailwind merge resolve conflitos (ex: p-4 p-2 → p-2)
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("deve ignorar valores falsy", () => {
    const result = cn("class1", null, undefined, false, "class2");
    expect(result).toBe("class1 class2");
  });

  it("deve lidar com objetos de condição", () => {
    const isActive = true;
    const isDisabled = false;
    
    const result = cn(
      "base-class",
      isActive && "active",
      isDisabled && "disabled"
    );
    
    expect(result).toBe("base-class active");
  });

  it("deve mesclar classes complexas do Tailwind", () => {
    const result = cn(
      "px-4 py-2 bg-blue-500",
      "hover:bg-blue-600",
      "px-6" // deve sobrescrever px-4
    );
    
    expect(result).toContain("px-6");
    expect(result).toContain("py-2");
    expect(result).toContain("bg-blue-500");
    expect(result).not.toContain("px-4");
  });

  it("deve retornar string vazia quando não há classes", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("deve retornar string vazia quando todas as classes são falsy", () => {
    const result = cn(null, undefined, false, "");
    expect(result).toBe("");
  });
});
