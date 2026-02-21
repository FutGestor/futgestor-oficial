import { vi } from "vitest";

/**
 * Mock do cliente Supabase para testes
 * Não faz chamadas reais à API
 */
export const createMockSupabase = () => {
  const mockData = {
    teams: [] as any[],
    profiles: [] as any[],
    jogadores: [] as any[],
    user_roles: [] as any[],
  };

  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();

  // Builder pattern mock
  const createQueryBuilder = (tableName: string) => {
    return {
      select: (columns?: string) => {
        mockSelect(columns);
        return createQueryBuilder(tableName);
      },
      insert: (data: any) => {
        mockInsert(data);
        mockData[tableName as keyof typeof mockData]?.push(data);
        return createQueryBuilder(tableName);
      },
      update: (data: any) => {
        mockUpdate(data);
        return createQueryBuilder(tableName);
      },
      delete: () => {
        mockDelete();
        return createQueryBuilder(tableName);
      },
      eq: (column: string, value: any) => {
        mockEq(column, value);
        return createQueryBuilder(tableName);
      },
      in: (column: string, values: any[]) => {
        return createQueryBuilder(tableName);
      },
      ilike: (column: string, pattern: string) => {
        return createQueryBuilder(tableName);
      },
      order: (column: string, options?: any) => {
        mockOrder(column, options);
        return createQueryBuilder(tableName);
      },
      limit: (count: number) => {
        mockLimit(count);
        return createQueryBuilder(tableName);
      },
      single: () => {
        mockSingle();
        return Promise.resolve({
          data: mockData[tableName as keyof typeof mockData]?.[0] || null,
          error: null,
        });
      },
      maybeSingle: () => {
        mockMaybeSingle();
        return Promise.resolve({
          data: mockData[tableName as keyof typeof mockData]?.[0] || null,
          error: null,
        });
      },
      then: (callback: any) => {
        return Promise.resolve({
          data: mockData[tableName as keyof typeof mockData] || [],
          error: null,
        }).then(callback);
      },
    };
  };

  mockFrom.mockImplementation(createQueryBuilder);

  return {
    rpc: mockRpc,
    from: mockFrom,
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: "test-user-id", email: "test@test.com" } },
          error: null,
        })
      ),
      getSession: vi.fn(() =>
        Promise.resolve({
          data: { session: { user: { id: "test-user-id" } } },
          error: null,
        })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    // Métodos para verificar chamadas nos testes
    _mocks: {
      rpc: mockRpc,
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      order: mockOrder,
      limit: mockLimit,
    },
    // Dados mockados
    _data: mockData,
  };
};

export type MockSupabase = ReturnType<typeof createMockSupabase>;
