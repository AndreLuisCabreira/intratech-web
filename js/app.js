import React from 'react';
import { createRoot } from 'react-dom/client';
import { Sidebar, Builder, Dashboard } from './forge.jsx';
import '../styles.css';
import './forge.css';
import * as api from './api.js';
import {
  categories,
  labels,
  money,
  normalize,
  total,
  consumption,
  requiredPower,
  fps,
  recommend
} from './domain.js';
const $ = (s) => document.querySelector(s),
  app = $('#app');
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]
  );
const options = (rows, value) =>
  rows
    .map(
      (x) =>
        `<option value="${x.id}" ${String(x.id) === String(value) ? 'selected' : ''}>${esc(x.nome)}</option>`
    )
    .join('');
const roots = new Map();
function clearReact() {
  // Desmonta as raízes React antes de substituir o HTML das páginas.
  for (const root of roots.values()) root.unmount();
  roots.clear();
}
function mountReact(node, Component, props) {
  if (roots.has(node)) {
    roots.get(node).unmount();
    roots.delete(node);
  }
  node.replaceChildren();
  const root = createRoot(node);
  roots.set(node, root);
  root.render(React.createElement(Component, props));
}
let user = null,
  db = null,
  page = 'dashboard',
  draft = {},
  step = 0,
  category = 'processador',
  onlyFavorites = false,
  busy = false,
  signup = false,
  loading = false;
const admin = () => api.isDemo() || user?.app_metadata?.role === 'admin';
const toast = (s) => {
  const t = $('#toast');
  t.textContent = s;
  t.style.display = 'block';
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.style.display = 'none'), 9000);
};
const modal = (html) => {
  $('#modal-body').innerHTML = html;
  $('#modal').showModal();
};
$('#close-modal').onclick = () => $('#modal').close();
function applyTheme() {
  document.body.classList.toggle(
    'light',
    localStorage.getItem('intratech-theme') === 'light'
  );
}
applyTheme();
async function run(fn) {
  if (busy) return;
  busy = true;
  app.setAttribute('aria-busy', 'true');
  try {
    await fn();
  } catch (e) {
    toast(e.message);
  } finally {
    busy = false;
    app.removeAttribute('aria-busy');
  }
}
async function reload() {
  loading = true;
  if (!db) render();
  try {
    db = await api.load();
  } catch (e) {
    toast(
      'Não foi possível atualizar a conexão. Tente novamente. ' + e.message
    );
  } finally {
    loading = false;
    render();
  }
}
function auth() {
  clearReact();
  app.innerHTML = `<section class="auth card"><div class="brand"><img src="assets/intratech-logo.png" alt="">IntraTech</div><span class="eyebrow">PC BUILDER / WEB</span><h1>${signup ? 'Sua próxima build começa aqui.' : 'Bem-vindo de volta.'}</h1><p class="muted">Monte, compare e encontre o PC para você.</p><form id="auth-form">${signup ? '<label>Nome<input name="name" required minlength="2" maxlength="120" autocomplete="name"></label>' : ''}<label>E-mail<input name="email" type="email" autocomplete="email" required></label><label>Senha<input name="password" type="password" minlength="8" required autocomplete="${signup ? 'new-password' : 'current-password'}"></label>${signup ? '<label>Confirmar senha<input name="confirm" type="password" required minlength="8" autocomplete="new-password"></label>' : ''}<button class="full">${signup ? 'Criar conta' : 'Entrar'}</button></form><button id="toggle-auth" class="secondary full">${signup ? 'Já tenho uma conta' : 'Criar uma conta'}</button><button id="demo" class="secondary full">Explorar demonstração local</button><p class="muted"><small>A versão web usa Supabase Auth com e-mail. Contas desktop não são transferidas automaticamente.</small></p></section>`;
  $('#toggle-auth').onclick = () => {
    signup = !signup;
    auth();
  };
  $('#demo').onclick = () => {
    db = api.startDemo();
    user = { id: 'demo', email: 'Demonstração local' };
    page = 'dashboard';
    render();
  };
  $('#auth-form').onsubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const f = new FormData(e.target),
        email = f.get('email'),
        password = f.get('password');
      let r;
      if (signup) {
        if (password !== f.get('confirm'))
          throw new Error('As senhas não coincidem.');
        r = await api.client.auth.signUp({
          email,
          password,
          options: { data: { name: f.get('name') } }
        });
      } else r = await api.client.auth.signInWithPassword({ email, password });
      if (r.error) throw r.error;
      if (!r.data.session) {
        toast('Confira seu e-mail para confirmar o cadastro.');
        return;
      }
      user = r.data.user;
      await reload();
    });
  };
}
const nav = [
  ['dashboard', 'Visão geral'],
  ['builds', 'Minhas builds'],
  ['montar', 'Montar PC'],
  ['componentes', 'Componentes'],
  ['jogos', 'Jogos e recomendações'],
  ['analises', 'Análises de FPS'],
  ['benchmarks', 'Benchmarks'],
  ['importar', 'Importar catálogo'],
  ['conta', 'Minha conta']
];
function render() {
  clearReact();
  if (!user) return auth();
  page = location.hash.slice(1) || page;
  if (!nav.some((x) => x[0] === page)) page = 'dashboard';
  app.innerHTML = `<div class="layout"><div id="sidebar-root"></div><main><header class="topbar"><div><span class="eyebrow">SEU PRÓXIMO SETUP</span><h1>${nav.find((x) => x[0] === page)?.[1]}</h1></div><span class="badge">${api.isDemo() ? 'DEMONSTRAÇÃO' : 'SUPABASE · WEB'}</span></header>${api.isDemo() ? '<div class="notice">Dados e preços fictícios. Alterações ficam somente neste navegador.</div>' : ''}<div id="content"></div></main></div>`;
  mountReact($('#sidebar-root'), Sidebar, {
    nav,
    page,
    user,
    admin: admin(),
    demo: api.isDemo(),
    connected: !!db,
    onTheme: () => {
      localStorage.setItem(
        'intratech-theme',
        document.body.classList.contains('light') ? 'dark' : 'light'
      );
      applyTheme();
    },
    onLogout: () =>
      run(async () => {
        if (!api.isDemo()) {
          const r = await api.client.auth.signOut();
          if (r.error) throw r.error;
        }
        api.stopDemo();
        user = null;
        db = null;
        draft = {};
        location.hash = '';
        auth();
      })
  });
  if (!db && loading) {
    $('#content').innerHTML =
      '<div class="skeleton-grid" role="status" aria-label="Carregando catálogo"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';
    return;
  }
  if (!db) {
    $('#content').innerHTML =
      '<div class="card"><h2>Conexão pendente</h2><p>Não foi possível carregar o catálogo. Confira sua conexão e tente novamente.</p><button id="retry">Tentar novamente</button></div>';
    $('#retry').onclick = () => run(reload);
    return;
  }
  ({
    dashboard,
    builds,
    montar,
    componentes,
    jogos,
    analises,
    benchmarks,
    importar,
    conta
  })[page]();
}
function content(html) {
  $('#content').innerHTML = html;
}
function getBuilds() {
  return db.builds.map((x) => api.hydrate(x, db));
}
function summary(b) {
  return (
    categories
      .map(
        (k) =>
          `<div class="summary-line"><span class="muted">${labels[k]}</span><span>${esc(b[k]?.nome || 'A escolher')}</span></div>`
      )
      .join('') +
    `<div class="summary-line"><span>Total</span><strong>${money(total(b))}</strong></div><p class="muted">Consumo: ${consumption(b)} W · Fonte recomendada: ${requiredPower(b)} W</p>`
  );
}
function dashboard() {
  mountReact($('#content'), Dashboard, { db, builds: getBuilds() });
}
function builds() {
  const rows = getBuilds().filter((x) => !onlyFavorites || x.favorita);
  content(
    `<div class="toolbar"><a class="button" href="#montar">+ Montar novo PC</a><button id="refresh" class="secondary">Atualizar lista</button><button id="favorites" class="secondary">${onlyFavorites ? 'Mostrar todas' : 'Somente favoritas'}</button><button id="compare" class="secondary">Comparar selecionadas</button><button id="export-all" class="secondary">Exportar minhas builds</button></div><div class="grid">${rows.map((b) => `<article class="card"><label class="check"><input type="checkbox" name="compare" value="${b.id}"> Comparar</label><h2>${b.favorita ? '★ ' : ''}${esc(b.nome)}</h2><p class="muted">${esc(b.processador?.nome)}<br>${esc(b.placa_video?.nome)}</p><h3>${money(total(b))}</h3><p class="muted">${consumption(b)} W · Fonte ${b.fonte?.potencia || '—'} W</p><div class="actions"><button data-edit="${b.id}">Editar</button><button class="secondary" data-export="${b.id}">Exportar</button><button class="danger" data-delete="${b.id}">Excluir</button></div></article>`).join('')}</div>${!rows.length ? '<div class="card empty">Nenhuma build encontrada.</div>' : ''}`
  );
  $('#content').insertAdjacentHTML(
    'beforeend',
    '<div id="versus-tray" class="versus-bar" hidden><strong id="versus-names"></strong><button id="versus-open">Comparar lado a lado ↗</button></div>'
  );
  $('#versus-open').onclick = () => $('#compare').click();
  document.querySelectorAll('[name=compare]').forEach((input) =>
    input.addEventListener('change', () => {
      const selected = [
        ...document.querySelectorAll('[name=compare]:checked')
      ].map((x) => rows.find((r) => r.id === Number(x.value)));
      $('#versus-tray').hidden = selected.length < 2;
      $('#versus-names').textContent = selected
        .map((x) => x.nome)
        .join('  VS  ');
      $('#versus-open').disabled = selected.length > 3;
    })
  );
  $('#refresh').onclick = () => run(reload);
  $('#favorites').onclick = () => {
    onlyFavorites = !onlyFavorites;
    builds();
  };
  document.querySelectorAll('[data-edit]').forEach(
    (e) =>
      (e.onclick = () => {
        if (
          Object.keys(draft).length &&
          !confirm('Substituir o rascunho atual?')
        )
          return;
        draft = structuredClone(
          rows.find((x) => x.id === Number(e.dataset.edit))
        );
        step = 0;
        location.hash = 'montar';
      })
  );
  document.querySelectorAll('[data-delete]').forEach(
    (e) =>
      (e.onclick = () => {
        if (confirm('Excluir esta build?'))
          run(async () => {
            await api.deleteBuild(Number(e.dataset.delete), user);
            if (draft.id === Number(e.dataset.delete)) draft = {};
            await reload();
          });
      })
  );
  document
    .querySelectorAll('[data-export]')
    .forEach(
      (e) =>
        (e.onclick = () =>
          exportBuilds([rows.find((x) => x.id === Number(e.dataset.export))]))
    );
  $('#export-all').onclick = () =>
    download(
      'minhas-builds.json',
      JSON.stringify({ version: 1, builds: getBuilds() }, null, 2),
      'application/json'
    );
  $('#compare').onclick = () => {
    const ids = [...document.querySelectorAll('[name=compare]:checked')].map(
      (x) => Number(x.value)
    );
    if (ids.length < 2 || ids.length > 3)
      return toast('Selecione duas ou três builds.');
    const selected = rows.filter((x) => ids.includes(x.id));
    modal(
      comparison(selected) +
        '<button id="export-comparison" class="secondary">Exportar comparação HTML</button>'
    );
    $('#export-comparison').onclick = () => exportBuilds(selected);
  };
}
function comparison(rows) {
  const min = Math.min(...rows.map(total));
  return `<h2>Comparação de builds</h2><div class="table-wrap"><table><thead><tr><th>Componente</th>${rows.map((x) => `<th>${esc(x.nome)}</th>`).join('')}</tr></thead><tbody>${categories.map((k) => `<tr><th>${labels[k]}</th>${rows.map((b) => `<td>${esc(b[k]?.nome)}</td>`).join('')}</tr>`).join('')}<tr><th>Total</th>${rows.map((b) => `<td>${money(total(b))}</td>`).join('')}</tr><tr><th>Diferença para menor preço</th>${rows.map((b) => `<td>${money(total(b) - min)}</td>`).join('')}</tr><tr><th>Consumo / fonte recomendada</th>${rows.map((b) => `<td>${consumption(b)} W / ${requiredPower(b)} W</td>`).join('')}</tr></tbody></table></div>`;
}
function download(name, text, type = 'text/html') {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function exportBuilds(rows) {
  download(
    'intratech-build.html',
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>IntraTech · Build</title><style>body{font:16px system-ui;padding:35px}table{border-collapse:collapse}td,th{padding:12px;border:1px solid #ccc}</style>${comparison(rows)}<p>Preços de catálogo. Compatibilidade não verifica BIOS, dimensões ou conectores.</p></html>`
  );
}
function montar() {
  mountReact($('#content'), Builder, {
    db,
    initialDraft: draft,
    initialStep: step,
    onDraft: (next, index) => {
      draft = next;
      step = index;
    },
    onSave: async (build) => {
      await api.saveBuild(build, user);
    },
    onSaved: () => {
      draft = {};
      step = 0;
      toast('Build salva.');
      location.hash = 'builds';
      run(reload);
    }
  });
}
const schema = {
  processador:
    'nome fabricante socket consumo preco nucleos threads desempenho',
  placa_mae: 'nome fabricante socket tipo_memoria consumo preco',
  memoria: 'nome tipo capacidade frequencia preco',
  placa_video: 'nome fabricante memoria consumo preco desempenho',
  ssd: 'nome tipo capacidade leitura escrita preco',
  fonte: 'nome potencia certificacao preco',
  jogo: 'nome exigencia_cpu exigencia_gpu genero descricao imagem_url',
  benchmark_fps:
    'jogo_id processador_id placa_video_id resolucao qualidade fps_medio fps_1_low fonte observacoes'
};
const numeric = new Set(
  'consumo preco nucleos threads desempenho capacidade frequencia memoria leitura escrita potencia exigencia_cpu exigencia_gpu fps_medio fps_1_low jogo_id processador_id placa_video_id'.split(
    ' '
  )
);
const optional = new Set([
  'genero',
  'descricao',
  'imagem_url',
  'fps_1_low',
  'observacoes'
]);
function recordForm(table, row = {}) {
  modal(
    `<h2>${row.id ? 'Editar' : 'Cadastrar'} ${labels[table]}</h2><form id="record-form"><div class="fields">${schema[
      table
    ]
      .split(' ')
      .map((k) => {
        const ref = k.endsWith('_id') ? k.slice(0, -3) : null;
        return `<label>${esc(k.replaceAll('_', ' '))}${ref ? `<select name="${k}" required>${options(db[ref], row[k])}</select>` : k === 'resolucao' ? `<select name="resolucao">${resOptions(row[k])}</select>` : k === 'qualidade' ? `<select name="qualidade">${['Baixa', 'Média', 'Alta', 'Ultra'].map((q) => `<option ${q === row[k] ? 'selected' : ''}>${q}</option>`).join('')}</select>` : `<input name="${k}" value="${esc(row[k])}" ${numeric.has(k) ? `type="number" step="${k === 'preco' || k === 'desempenho' ? '0.01' : '1'}" min="${['preco', 'consumo'].includes(k) ? 0 : 1}"` : k === 'imagem_url' ? 'type="url"' : 'maxlength="' + (k === 'descricao' ? 500 : k === 'imagem_url' ? 1000 : 120) + '"'} ${optional.has(k) ? '' : 'required'}>`}</label>`;
      })
      .join('')}</div><button>Salvar</button></form>`
  );
  $('#record-form').onsubmit = (e) => {
    e.preventDefault();
    run(async () => {
      const values = {};
      for (const [k, v] of new FormData(e.target)) {
        values[k] =
          v === '' && optional.has(k)
            ? null
            : numeric.has(k)
              ? Number(v)
              : v.trim();
        if (numeric.has(k) && values[k] !== null && !Number.isFinite(values[k]))
          throw new Error('Número inválido.');
      }
      if (values.fps_1_low > values.fps_medio)
        throw new Error('1% low não pode superar a média.');
      if (row.id) values.id = row.id;
      await api.saveRecord(table, values);
      $('#modal').close();
      toast('Registro salvo.');
      await reload();
    });
  };
}
function componentes() {
  content(
    `<div class="toolbar"><select id="category" aria-label="Categoria">${[...categories, 'jogo'].map((k) => `<option value="${k}" ${category === k ? 'selected' : ''}>${labels[k]}</option>`).join('')}</select><input id="catalog-search" placeholder="Buscar no catálogo" aria-label="Buscar no catálogo"><input id="min-price" type="number" min="0" placeholder="Preço mínimo" aria-label="Preço mínimo"><input id="max-price" type="number" min="0" placeholder="Preço máximo" aria-label="Preço máximo">${admin() ? '<button id="add-record">+ Cadastrar</button>' : ''}</div><div id="catalog-list"></div>`
  );
  $('#category').onchange = (e) => {
    category = e.target.value;
    componentes();
  };
  const draw = () => {
    const terms = normalize($('#catalog-search').value)
        .split(/\s+/)
        .filter(Boolean),
      min = Number($('#min-price').value) || 0,
      max =
        $('#max-price').value === '' ? Infinity : Number($('#max-price').value);
    const rows = db[category].filter(
      (x) =>
        terms.every((t) => normalize(Object.values(x).join(' ')).includes(t)) &&
        (category === 'jogo' || (x.preco >= min && x.preco <= max))
    );
    $('#catalog-list').innerHTML = `<div class="grid">${rows
      .map(
        (x) =>
          `<article class="card"><span class="badge">${labels[category]}</span><h2>${esc(x.nome)}</h2><p class="muted">${esc(
            Object.entries(x)
              .filter(
                ([k]) => !['id', 'nome', 'preco', 'imagem_url'].includes(k)
              )
              .map(([k, v]) => `${k.replaceAll('_', ' ')}: ${v ?? '—'}`)
              .join(' · ')
          )}</p>${x.preco != null ? `<h3>${money(x.preco)}</h3>` : ''}${admin() ? `<div class="actions"><button data-record="${x.id}" class="secondary">Editar</button><button data-remove="${x.id}" class="danger">Excluir</button></div>` : ''}</article>`
      )
      .join(
        ''
      )}</div>${rows.length ? '' : '<div class="empty">Nenhum registro encontrado.</div>'}`;
    document.querySelectorAll('[data-record]').forEach(
      (e) =>
        (e.onclick = () =>
          recordForm(
            category,
            db[category].find((x) => x.id === Number(e.dataset.record))
          ))
    );
    document.querySelectorAll('[data-remove]').forEach(
      (e) =>
        (e.onclick = () => {
          if (
            confirm(
              'Excluir o registro? Peças usadas em builds não podem ser excluídas.'
            )
          )
            run(async () => {
              await api.deleteRecord(category, Number(e.dataset.remove));
              await reload();
            });
        })
    );
  };
  draw();
  ['catalog-search', 'min-price', 'max-price'].forEach(
    (id) => ($('#' + id).oninput = draw)
  );
  if (admin()) $('#add-record').onclick = () => recordForm(category);
}
function resOptions(v = '1920x1080') {
  return ['1920x1080', '2560x1440', '3840x2160']
    .map((x) => `<option ${x === v ? 'selected' : ''}>${x}</option>`)
    .join('');
}
function jogos() {
  content(
    `<p class="muted">Recomendações baseadas nos benchmarks cadastrados, com peças compatíveis e orçamento informado.</p><div class="grid">${db.jogo.map((g) => `<article class="card"><h2>${esc(g.nome)}</h2><p class="muted">${esc(g.genero || 'Jogo')} · ${esc(g.descricao || 'Selecione a meta de desempenho.')}</p><button data-game="${g.id}">Encontrar uma build</button></article>`).join('')}</div>${db.jogo.length ? '' : '<div class="empty">Cadastre jogos e benchmarks para receber recomendações.</div>'}<div id="recommendation"></div>`
  );
  document.querySelectorAll('[data-game]').forEach(
    (e) =>
      (e.onclick = () => {
        const id = Number(e.dataset.game);
        $('#recommendation').innerHTML =
          `<form class="card" id="recommend-form"><h2>${esc(db.jogo.find((x) => x.id === id).nome)}</h2><div class="fields"><label>Resolução<select name="res">${resOptions()}</select></label><label>FPS mínimo<input name="fps" type="number" value="60" min="1" required></label><label>Orçamento (R$)<input name="budget" type="number" min="1" step=".01" placeholder="Sem limite"></label></div><button>Buscar configuração</button></form><div id="recommend-result"></div>`;
        $('#recommend-form').onsubmit = (ev) => {
          ev.preventDefault();
          const f = new FormData(ev.target),
            r = recommend(
              db,
              id,
              f.get('res'),
              Number(f.get('fps')),
              f.get('budget') ? Number(f.get('budget')) : Infinity
            );
          $('#recommend-result').innerHTML = r
            ? `<div class="card"><h2>Configuração recomendada</h2><p>${r.benchmark.fps_medio} FPS · ${esc(r.benchmark.qualidade)} · Fonte: ${esc(r.benchmark.fonte)}</p>${summary(r)}<button id="use-recommendation">Revisar e salvar esta build</button></div>`
            : '<div class="card empty">Nenhuma configuração completa atende à meta e ao orçamento com os dados disponíveis.</div>';
          if (r)
            $('#use-recommendation').onclick = () => {
              if (
                Object.keys(draft).length &&
                !confirm('Substituir o rascunho atual?')
              )
                return;
              draft = {
                ...r,
                nome: 'Build para ' + db.jogo.find((x) => x.id === id).nome
              };
              delete draft.benchmark;
              step = 6;
              location.hash = 'montar';
            };
        };
      })
  );
}
function analises() {
  const rows = getBuilds();
  content(
    `<form id="analysis" class="card"><div class="fields"><label>Build<select name="build" required>${options(rows)}</select></label><label>Jogo<select name="game" required>${options(db.jogo)}</select></label><label>Resolução<select name="res">${resOptions()}</select></label><label>Qualidade<select name="quality">${[...new Set(['Alta', ...db.benchmark_fps.map((x) => x.qualidade)])].map((q) => `<option>${esc(q)}</option>`).join('')}</select></label></div><button ${rows.length && db.jogo.length ? '' : 'disabled'}>Analisar FPS</button></form><div id="analysis-result"></div>`
  );
  $('#analysis').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      b = rows.find((x) => x.id === Number(f.get('build'))),
      r = fps(b, f.get('game'), f.get('res'), f.get('quality'), db);
    $('#analysis-result').innerHTML = r
      ? `<section class="card"><span class="badge">${r.type}</span>${fpsBars(r.average, r.low)}<div class="grid"><div class="stat"><small>FPS médio</small><strong>${r.average}</strong></div><div class="stat"><small>1% low</small><strong>${r.low ?? 'Sem dados'}</strong></div></div><p class="muted">${r.count} medição(ões). Fonte: ${esc(r.sources)}.</p><p class="muted">Referência próxima usa a mesma GPU e a CPU com índice de desempenho mais próximo; não mede seu computador.</p></section>`
      : '<div class="card empty">Sem benchmarks desta GPU no cenário selecionado. Nenhum FPS foi inventado.</div>';
  };
}
function gameCover(name) {
  const n = normalize(name);
  return n.includes('cyberpunk')
    ? 'assets/cyberpunk-2077.jpg'
    : n.includes('fortnite')
      ? 'assets/fortnite.jpg'
      : n.includes('counter') || n.includes('cs2')
        ? 'assets/counter-strike-2.jpg'
        : 'assets/intratech-logo.png';
}
function fpsBars(
  avg,
  low,
  max = Math.max(Number(avg) || 0, Number(low) || 0, 1)
) {
  return (
    '<div class="fps-bars">' +
    [
      ['Médio', avg, ''],
      ['1% low', low, 'low']
    ]
      .map(
        ([label, value, cls]) =>
          `<div class="fps-bar ${cls}"><span>${label}</span><span class="fps-track" aria-hidden="true"><i style="width:${value == null ? 0 : Math.min(100, (Number(value) / max) * 100)}%"></i></span><strong>${value == null ? '—' : esc(value)}</strong></div>`
      )
      .join('') +
    '</div>'
  );
}
function benchmarks() {
  content(
    `<div class="toolbar">${admin() ? '<button id="add-benchmark">+ Cadastrar benchmark</button>' : ''}<input id="bench-search" placeholder="Buscar jogo, hardware ou fonte" aria-label="Buscar benchmarks"></div><div id="bench-list"></div>`
  );
  const draw = () => {
    const term = normalize($('#bench-search').value),
      name = (k, id) => db[k].find((x) => x.id === id)?.nome || '—';
    const rows = db.benchmark_fps
      .map((x) => ({
        ...x,
        game: name('jogo', x.jogo_id),
        cpu: name('processador', x.processador_id),
        gpu: name('placa_video', x.placa_video_id)
      }))
      .filter((x) => normalize(Object.values(x).join(' ')).includes(term));
    $('#bench-list').innerHTML =
      `<div class="card table-wrap"><table><thead><tr><th>Jogo / cenário</th><th>Hardware</th><th>FPS / 1% low</th><th>Fonte</th>${admin() ? '<th>Ações</th>' : ''}</tr></thead><tbody>${rows.map((x) => `<tr><td><div class="benchmark-game"><img src="${gameCover(x.game)}" alt="" loading="lazy"><div>${esc(x.game)}<br><small>${esc(x.resolucao)} · ${esc(x.qualidade)}</small></div></div></td><td>${esc(x.cpu)}<br>${esc(x.gpu)}</td><td>${fpsBars(x.fps_medio, x.fps_1_low, Math.max(1, ...rows.map((r) => Number(r.fps_medio) || 0)))}</td><td>${esc(x.fonte)}<br><small>${esc(x.observacoes)}</small></td>${admin() ? `<td><button class="secondary" data-bench="${x.id}">Editar</button><button class="danger" data-del-bench="${x.id}">Excluir</button></td>` : ''}</tr>`).join('')}</tbody></table>${rows.length ? '' : '<p class="empty">Nenhum benchmark encontrado.</p>'}</div>`;
    document.querySelectorAll('[data-bench]').forEach(
      (e) =>
        (e.onclick = () =>
          recordForm(
            'benchmark_fps',
            db.benchmark_fps.find((x) => x.id === Number(e.dataset.bench))
          ))
    );
    document.querySelectorAll('[data-del-bench]').forEach(
      (e) =>
        (e.onclick = () => {
          if (confirm('Excluir benchmark?'))
            run(async () => {
              await api.deleteRecord(
                'benchmark_fps',
                Number(e.dataset.delBench)
              );
              await reload();
            });
        })
    );
  };
  draw();
  $('#bench-search').oninput = draw;
  if (admin()) $('#add-benchmark').onclick = () => recordForm('benchmark_fps');
}
function importar() {
  if (!admin()) {
    content(
      '<div class="card">Somente administradores podem importar componentes.</div>'
    );
    return;
  }
  content(
    `<section class="card"><h2>Importar componente por JSON</h2><p class="muted">Escolha a categoria e carregue um objeto JSON com os campos do catálogo. Revise os valores em reais antes de salvar. Não convertemos USD automaticamente.</p><div class="fields"><label>Categoria<select id="import-kind">${categories.map((k) => `<option value="${k}">${labels[k]}</option>`).join('')}</select></label><label>Arquivo JSON<input type="file" id="import-file" accept="application/json,.json"></label></div><p>Campos obrigatórios: <code id="import-fields">${schema.processador}</code></p><p class="muted">A importação abre o formulário de revisão; nada é salvo antes da confirmação. Arquivos do dataset externo precisam ser normalizados para esses campos.</p></section>`
  );
  $('#import-kind').onchange = (e) =>
    ($('#import-fields').textContent = schema[e.target.value]);
  $('#import-file').onchange = (e) =>
    run(async () => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1024 * 1024) throw new Error('Limite de 1 MiB.');
      const x = JSON.parse(await file.text());
      if (!x || Array.isArray(x) || typeof x !== 'object')
        throw new Error('Use um objeto JSON por componente.');
      const kind = $('#import-kind').value,
        row = {};
      for (const k of schema[kind].split(' ')) if (x[k] != null) row[k] = x[k];
      recordForm(kind, row);
    });
}
function conta() {
  content(
    `<section class="card"><h2>Sua conta</h2><p>${esc(user.email)}</p><p class="muted">${admin() ? 'Perfil administrador' : 'Perfil usuário'}</p>${api.isDemo() ? '<p>Modo local: não há conta ou senha real.</p>' : `<form id="password"><div class="fields"><label>Senha atual<input type="password" name="current" autocomplete="current-password" required></label><label>Nova senha<input type="password" name="password" autocomplete="new-password" minlength="8" required></label><label>Confirmar nova senha<input type="password" name="confirm" autocomplete="new-password" minlength="8" required></label></div><button>Alterar senha</button></form>`}</section><section class="card"><h2>Exportação pessoal</h2><p class="muted">Exporte suas builds em JSON. O backup integral e a restauração do banco são feitos pelo painel do Supabase; não ficam expostos no navegador.</p><button id="personal-export" class="secondary">Exportar minhas builds</button></section>`
  );
  $('#personal-export').onclick = () =>
    download(
      'minhas-builds.json',
      JSON.stringify({ version: 1, builds: getBuilds() }, null, 2),
      'application/json'
    );
  if (!api.isDemo())
    $('#password').onsubmit = (e) => {
      e.preventDefault();
      run(async () => {
        const f = new FormData(e.target);
        if (f.get('password') !== f.get('confirm'))
          throw new Error('As senhas não coincidem.');
        if (f.get('password') === f.get('current'))
          throw new Error('Escolha uma senha diferente.');
        let r = await api.client.auth.signInWithPassword({
          email: user.email,
          password: f.get('current')
        });
        if (r.error) throw r.error;
        r = await api.client.auth.updateUser({ password: f.get('password') });
        if (r.error) throw r.error;
        e.target.reset();
        toast('Senha alterada.');
      });
    };
}
window.addEventListener('hashchange', () => {
  if (user) render();
});
api.client.auth.onAuthStateChange((event, session) => {
  if (api.isDemo()) return;
  if (event === 'SIGNED_OUT') {
    user = null;
    db = null;
    draft = {};
    auth();
  } else if (event === 'TOKEN_REFRESHED' && session) user = session.user;
});
try {
  const r = await api.client.auth.getSession();
  if (r.error) throw r.error;
  if (r.data.session) {
    user = r.data.session.user;
    await reload();
  } else auth();
} catch (e) {
  auth();
  toast('Falha ao recuperar sessão: ' + e.message);
}
