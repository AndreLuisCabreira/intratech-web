import { test } from 'node:test';
import assert from 'node:assert/strict';

test('carregamento da API com cliente simulado, sem rede', async (t) => {
  const originalWindow = globalThis.window;
  const calls = [];
  let failingTable;
  const tables = {
    processador: Array.from({ length: 501 }, (_, index) => ({ id: index + 1 })),
    web_build: Array.from({ length: 1501 }, (_, index) => ({ id: index + 1 }))
  };
  const client = {
    from(table) {
      return {
        select() {
          return this;
        },
        order() {
          return this;
        },
        async range(start, end) {
          calls.push({ table, start, end });
          return table === failingTable
            ? { error: { message: 'Falha de conexão simulada' }, data: null }
            : {
                error: null,
                data: (tables[table] || []).slice(start, end + 1)
              };
        }
      };
    }
  };
  globalThis.window = { supabase: { createClient: () => client } };
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });
  const api = await import('../js/api.js');

  await t.test(
    'retorna todo o catálogo e mais de mil builds em ordem',
    async () => {
      const result = await api.load();
      assert.deepEqual(result.processador, tables.processador);
      assert.deepEqual(result.builds, tables.web_build);
      assert.deepEqual(
        calls.filter(({ table }) => table === 'web_build'),
        [
          { table: 'web_build', start: 0, end: 499 },
          { table: 'web_build', start: 500, end: 999 },
          { table: 'web_build', start: 1000, end: 1499 },
          { table: 'web_build', start: 1500, end: 1999 }
        ]
      );
    }
  );

  await t.test(
    'propaga falhas em vez de devolver uma lista parcial',
    async () => {
      failingTable = 'web_build';
      await assert.rejects(api.load(), /Falha de conexão simulada/);
    }
  );
});
