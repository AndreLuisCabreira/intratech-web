import { config } from './config.js';
import { categories } from './domain.js';
import { demoData } from './demo.js';
export const client = window.supabase.createClient(config.url, config.key);
let demo = false;
let data;
export const isDemo = () => demo;
export function startDemo() {
  demo = true;
  try {
    data = JSON.parse(localStorage.getItem('intratech-demo-v1')) || demoData();
  } catch {
    data = demoData();
  }
  return data;
}
export function stopDemo() {
  demo = false;
  data = null;
}
const checked = (response) => {
  if (response.error) throw new Error(response.error.message);
  return response.data;
};

async function loadRows(table) {
  const pageSize = 500;
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = checked(
      await client
        .from(table)
        .select('*')
        .order('id')
        .range(offset, offset + pageSize - 1)
    );
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function load() {
  if (demo) return data;
  const names = [...categories, 'jogo', 'benchmark_fps'];
  const result = {};
  await Promise.all(
    names.map(async (name) => {
      result[name] = await loadRows(name);
    })
  );
  result.builds = await loadRows('web_build');
  return result;
}
function persist() {
  localStorage.setItem('intratech-demo-v1', JSON.stringify(data));
}
export async function saveBuild(b, user) {
  if (demo) {
    const row = structuredClone(b);
    row.id ||= Date.now();
    const i = data.builds.findIndex((x) => x.id === row.id);
    if (i < 0) data.builds.push(row);
    else data.builds[i] = row;
    persist();
    return;
  }
  const row = { nome: b.nome, favorita: !!b.favorita, owner_id: user.id };
  for (const k of categories) row[k + '_id'] = b[k].id;
  if (b.id)
    checked(
      await client
        .from('web_build')
        .update(row)
        .eq('id', b.id)
        .eq('owner_id', user.id)
        .select()
        .single()
    );
  else checked(await client.from('web_build').insert(row).select().single());
}
export async function deleteBuild(id, user) {
  if (demo) {
    data.builds = data.builds.filter((x) => x.id !== id);
    persist();
  } else
    checked(
      await client
        .from('web_build')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id)
        .select()
        .single()
    );
}
export async function saveRecord(table, row) {
  if (demo) {
    row = { ...row, id: row.id || Date.now() };
    const i = data[table].findIndex((x) => x.id === row.id);
    if (i < 0) data[table].push(row);
    else data[table][i] = row;
    persist();
  } else checked(await client.from(table).upsert(row).select().single());
}
export async function deleteRecord(table, id) {
  if (demo) {
    if (
      data.builds.some((b) =>
        categories.some((k) => k === table && b[k]?.id === id)
      )
    )
      throw new Error('Componente usado em uma build.');
    data[table] = data[table].filter((x) => x.id !== id);
    persist();
  } else
    checked(await client.from(table).delete().eq('id', id).select().single());
}
export function hydrate(row, db) {
  if (isDemo()) return row;
  const b = { ...row };
  for (const k of categories) b[k] = db[k].find((x) => x.id === row[k + '_id']);
  return b;
}
