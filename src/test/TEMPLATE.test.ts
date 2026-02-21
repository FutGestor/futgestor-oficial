/**
 * TEMPLATE DE TESTE - FutGestorPro
 * 
 * Copie este arquivo para criar novos testes.
 * Escolha o template adequado conforme o que está testando.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// =============================================================================
// TEMPLATE 1: Teste de Hook (com TanStack Query)
// =============================================================================

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    QueryClientProvider({ client: queryClient, children });
};

describe("[NOME_DO_HOOK]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve [COMPORTAMENTO_ESPERADO]", async () => {
    // Arrange
    // const { result } = renderHook(() => useSeuHook(), {
    //   wrapper: createWrapper(),
    // });

    // Act
    // result.current.mutate("dados");

    // Assert
    // await waitFor(() => {
    //   expect(result.current.isSuccess).toBe(true);
    // });
  });
});

// =============================================================================
// TEMPLATE 2: Teste de Função Utilitária
// =============================================================================

describe("[NOME_DA_FUNCAO]", () => {
  it("deve [COMPORTAMENTO_ESPERADO]", () => {
    // Arrange
    const input = "valor";

    // Act
    // const result = suaFuncao(input);

    // Assert
    // expect(result).toBe("resultado_esperado");
  });

  it("deve lidar com [CASO_EXTREMO]", () => {
    // Teste de erro, null, undefined, etc
  });
});

// =============================================================================
// TEMPLATE 3: Teste de Componente (quando necessário no futuro)
// =============================================================================

// import { render, screen, fireEvent } from "@testing-library/react";

// describe("[NOME_DO_COMPONENTE]", () => {
//   it("deve renderizar corretamente", () => {
//     render(<SeuComponente prop="valor" />);
//     expect(screen.getByText("texto_esperado")).toBeInTheDocument();
//   });

//   it("deve responder a interações", () => {
//     const onClick = vi.fn();
//     render(<SeuComponente onClick={onClick} />);
//     
//     fireEvent.click(screen.getByRole("button"));
//     expect(onClick).toHaveBeenCalled();
//   });
// });

// =============================================================================
// TEMPLATE 4: Teste de API/RLS (requer credenciais)
// =============================================================================

// const describeIfCredentials = process.env.TEST_USER_EMAIL
//   ? describe
//   : describe.skip;

// describeIfCredentials("[NOME_DO_TESTE_API]", () => {
//   it("deve [COMPORTAMENTO_ESPERADO]", async () => {
//     // Testes que fazem chamadas reais ao Supabase
//   });
// });

// =============================================================================
// DICAS DE BOAS PRÁTICAS
// =============================================================================

/**
 * 1. NOME DOS TESTES:
 *    - Use "deve [ação] quando [condição]"
 *    - Ex: "deve retornar erro quando usuário não está autenticado"
 *
 * 2. ESTRUTURA AAA:
 *    - Arrange: Preparar dados/mocks
 *    - Act: Executar a ação
 *    - Assert: Verificar resultado
 *
 * 3. MOCKS:
 *    - Sempre limpar mocks no beforeEach
 *    - Use vi.mock() para módulos externos
 *    - Use vi.fn() para funções
 *
 * 4. ASSERÇÕES:
 *    - Seja específico (não use toBeTruthy/toBeFalsy)
 *    - Prefira toBe, toEqual, toContain
 *    - Use expect.objectContaining para objetos grandes
 *
 * 5. ASYNC:
 *    - Sempre use await waitFor() para estados assíncronos
 *    - Use findBy* em vez de getBy* para elementos async
 *
 * 6. COBERTURA:
 *    - Caso feliz (happy path)
 *    - Casos de erro
 *    - Edge cases (null, undefined, vazio)
 *    - Limites (máximo, mínimo)
 */
