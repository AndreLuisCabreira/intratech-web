import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../js/demo.js';
import {
  categories,
  errors,
  total,
  consumption,
  requiredPower,
  selectPart,
  eligible,
  fps,
  recommend
} from '../js/domain.js';
const db = demoData();
const build = Object.fromEntries(categories.map((k) => [k, db[k][0]]));
test('consumo e margem preservam regra Java', () => {
  assert.equal(consumption(build), 230);
  assert.equal(requiredPower(build), 276);
  assert.equal(total(build), 4254);
  assert.deepEqual(errors(build), []);
});
test('socket novo invalida placa-mãe e memória', () => {
  const b = selectPart(build, 'processador', db.processador[1]);
  assert.equal(b.placa_mae, undefined);
  assert.equal(b.memoria, undefined);
});
test('fonte insuficiente é invalidada ao aumentar consumo', () => {
  const b = selectPart({ ...build, fonte: { potencia: 300 } }, 'placa_video', {
    consumo: 500
  });
  assert.equal(b.fonte, undefined);
});
test('build incompleta não é válida', () => assert.equal(errors({}).length, 6));
test('FPS exato usa medição cadastrada e fonte', () => {
  const r = fps(build, 1, '1920x1080', 'Alta', db);
  assert.equal(r.average, 180);
  assert.equal(r.type, 'MEDIÇÃO EXATA');
});
test('FPS sem cenário não é estimado', () =>
  assert.equal(fps(build, 1, '3840x2160', 'Ultra', db), null));
test('CPU diferente usa referência próxima', () =>
  assert.equal(
    fps(
      { ...build, processador: db.processador[1] },
      1,
      '1920x1080',
      'Alta',
      db
    ).type,
    'REFERÊNCIA PRÓXIMA'
  ));
test('recomendação respeita orçamento e completude', () => {
  assert.equal(recommend(db, 1, '1920x1080', 60, 100), null);
  const b = recommend(db, 1, '1920x1080', 60, 5000);
  assert.ok(b);
  assert.deepEqual(errors(b), []);
  assert.equal(total(b), 4254);
});
test('memória incompatível é rejeitada', () =>
  assert.ok(
    errors({ ...build, memoria: db.memoria[1] }).includes(
      'Memória incompatível.'
    )
  ));

test('preços fracionados são somados em centavos', () => {
  assert.equal(
    total({ processador: { preco: 0.1 }, memoria: { preco: 0.2 } }),
    0.3
  );
});

test('filtro de peças respeita socket, memória e limite exato da fonte', () => {
  assert.equal(eligible(build, 'placa_mae', db.placa_mae[1]), false);
  assert.equal(eligible(build, 'memoria', db.memoria[1]), false);
  assert.equal(eligible(build, 'fonte', { potencia: 275 }), false);
  assert.equal(eligible(build, 'fonte', { potencia: 276 }), true);
  assert.equal(eligible(build, 'ssd', db.ssd[0]), true);
  const original = structuredClone(build);
  selectPart(build, 'processador', db.processador[1]);
  assert.deepEqual(
    build,
    original,
    'A seleção deve preservar a build de origem'
  );
});
