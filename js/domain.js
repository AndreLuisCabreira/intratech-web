export const categories = [
  'processador',
  'placa_mae',
  'memoria',
  'placa_video',
  'ssd',
  'fonte'
];
export const labels = {
  processador: 'Processador',
  placa_mae: 'Placa-mãe',
  memoria: 'Memória RAM',
  placa_video: 'Placa de vídeo',
  ssd: 'SSD',
  fonte: 'Fonte',
  jogo: 'Jogo',
  benchmark_fps: 'Benchmark'
};
export const money = (n) =>
  Number(n || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
export const normalize = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
// Soma em centavos para evitar diferenças de arredondamento nos preços.
export const total = (build) =>
  categories.reduce(
    (sum, category) =>
      sum + Math.round(Number(build[category]?.preco || 0) * 100),
    0
  ) / 100;
// RAM e SSD acrescentam 5 W cada à estimativa, conforme a regra do projeto.
export const consumption = (build) =>
  ['processador', 'placa_mae', 'placa_video'].reduce(
    (sum, category) => sum + Number(build[category]?.consumo || 0),
    0
  ) +
  (build.memoria ? 5 : 0) +
  (build.ssd ? 5 : 0);
export const requiredPower = (build) => Math.ceil(consumption(build) * 1.2);
export function errors(b) {
  const e = categories
    .filter((k) => !b[k])
    .map((k) => `Selecione ${labels[k]}.`);
  if (
    b.processador &&
    b.placa_mae &&
    normalize(b.processador.socket) !== normalize(b.placa_mae.socket)
  )
    e.push('Socket incompatível.');
  if (
    b.memoria &&
    b.placa_mae &&
    normalize(b.memoria.tipo) !== normalize(b.placa_mae.tipo_memoria)
  )
    e.push('Memória incompatível.');
  if (b.fonte && b.fonte.potencia < requiredPower(b))
    e.push('Fonte insuficiente.');
  return e;
}
export function selectPart(build, category, part) {
  const next = { ...build, [category]: part };
  if (
    next.processador &&
    next.placa_mae &&
    normalize(next.processador.socket) !== normalize(next.placa_mae.socket)
  )
    delete next.placa_mae;
  if (
    next.memoria &&
    (!next.placa_mae ||
      normalize(next.memoria.tipo) !== normalize(next.placa_mae.tipo_memoria))
  )
    delete next.memoria;
  if (next.fonte && next.fonte.potencia < requiredPower(next))
    delete next.fonte;
  return next;
}
export function eligible(build, category, part) {
  switch (category) {
    case 'placa_mae':
      return normalize(part.socket) === normalize(build.processador?.socket);
    case 'memoria':
      return normalize(part.tipo) === normalize(build.placa_mae?.tipo_memoria);
    case 'fonte':
      return part.potencia >= requiredPower(build);
    default:
      return true;
  }
}
export function fps(b, game, res, quality, db) {
  let rows = db.benchmark_fps.filter(
    (x) =>
      x.jogo_id === Number(game) &&
      normalize(x.resolucao) === normalize(res) &&
      normalize(x.qualidade) === normalize(quality) &&
      x.placa_video_id === b.placa_video?.id
  );
  if (!rows.length || !b.processador) return null;
  const exact = rows.filter((x) => x.processador_id === b.processador.id);
  let type = 'MEDIÇÃO EXATA';
  if (exact.length) rows = exact;
  else {
    // Mantém a GPU do cenário e procura a CPU pelo índice de desempenho.
    type = 'REFERÊNCIA PRÓXIMA';
    const rank = (x) =>
      Math.abs(
        Number(
          db.processador.find((c) => c.id === x.processador_id)?.desempenho || 0
        ) - b.processador.desempenho
      );
    const nearest = [...rows].sort((a, b) => rank(a) - rank(b))[0];
    rows = rows.filter((x) => x.processador_id === nearest.processador_id);
  }
  const avg = (a) =>
    a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null;
  return {
    type,
    average: avg(rows.map((x) => x.fps_medio)),
    low: avg(rows.filter((x) => x.fps_1_low != null).map((x) => x.fps_1_low)),
    sources: [...new Set(rows.map((x) => x.fonte))].join(', '),
    count: rows.length
  };
}
export function recommend(db, game, res, target, budget = Infinity) {
  const cheap = (a) => [...a].sort((a, b) => a.preco - b.preco)[0];
  const candidates = [];
  for (const m of db.benchmark_fps.filter(
    (x) =>
      x.jogo_id === Number(game) && x.resolucao === res && x.fps_medio >= target
  )) {
    const cpu = db.processador.find((x) => x.id === m.processador_id),
      gpu = db.placa_video.find((x) => x.id === m.placa_video_id);
    if (!cpu || !gpu) continue;
    for (const board of db.placa_mae.filter(
      (x) => normalize(x.socket) === normalize(cpu.socket)
    )) {
      const ram = db.memoria.filter(
        (x) => normalize(x.tipo) === normalize(board.tipo_memoria)
      );
      const ssds = db.ssd.filter((x) => x.capacidade >= 500);
      const b = {
        processador: cpu,
        placa_video: gpu,
        placa_mae: board,
        memoria: cheap(ram.filter((x) => x.capacidade >= 16)) || cheap(ram),
        ssd: cheap(ssds.length ? ssds : db.ssd)
      };
      b.fonte = cheap(db.fonte.filter((x) => x.potencia >= requiredPower(b)));
      if (!errors(b).length && total(b) <= budget)
        candidates.push({ ...b, benchmark: m });
    }
  }
  const rank = (q) =>
    ({ ultra: 4, alta: 3, alto: 3, media: 2, medio: 2, baixa: 1, baixo: 1 })[
      normalize(q)
    ] || 0;
  // Prioriza preço; em empate, qualidade e depois o FPS que já atende à meta.
  return (
    candidates.sort(
      (a, b) =>
        total(a) - total(b) ||
        rank(b.benchmark.qualidade) - rank(a.benchmark.qualidade) ||
        a.benchmark.fps_medio - b.benchmark.fps_medio
    )[0] || null
  );
}
