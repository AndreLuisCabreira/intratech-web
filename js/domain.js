export const categories = ['processador','placa_mae','memoria','placa_video','ssd','fonte'];
export const labels = {processador:'Processador',placa_mae:'Placa-mãe',memoria:'Memória RAM',placa_video:'Placa de vídeo',ssd:'SSD',fonte:'Fonte',jogo:'Jogo',benchmark_fps:'Benchmark'};
export const money = n => Number(n || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const total = b => categories.reduce((s,k)=>s+Math.round(Number(b[k]?.preco||0)*100),0)/100;
export const consumption = b => ['processador','placa_mae','placa_video'].reduce((s,k)=>s+Number(b[k]?.consumo||0),0)+(b.memoria?5:0)+(b.ssd?5:0);
export const requiredPower = b => Math.ceil(consumption(b)*1.2);
export function errors(b) {
 const e=categories.filter(k=>!b[k]).map(k=>`Selecione ${labels[k]}.`);
 if(b.processador&&b.placa_mae&&normalize(b.processador.socket)!==normalize(b.placa_mae.socket))e.push('Socket incompatível.');
 if(b.memoria&&b.placa_mae&&normalize(b.memoria.tipo)!==normalize(b.placa_mae.tipo_memoria))e.push('Memória incompatível.');
 if(b.fonte&&b.fonte.potencia<requiredPower(b))e.push('Fonte insuficiente.');
 return e;
}
export function selectPart(b,k,p) {
 const n={...b,[k]:p};
 if(n.processador&&n.placa_mae&&normalize(n.processador.socket)!==normalize(n.placa_mae.socket))delete n.placa_mae;
 if(n.memoria&&(!n.placa_mae||normalize(n.memoria.tipo)!==normalize(n.placa_mae.tipo_memoria)))delete n.memoria;
 if(n.fonte&&n.fonte.potencia<requiredPower(n))delete n.fonte;
 return n;
}
export function eligible(b,k,p){return k==='placa_mae'?normalize(p.socket)===normalize(b.processador?.socket):k==='memoria'?normalize(p.tipo)===normalize(b.placa_mae?.tipo_memoria):k==='fonte'?p.potencia>=requiredPower(b):true;}
export function fps(b,game,res,quality,db){
 let rows=db.benchmark_fps.filter(x=>x.jogo_id===Number(game)&&normalize(x.resolucao)===normalize(res)&&normalize(x.qualidade)===normalize(quality)&&x.placa_video_id===b.placa_video?.id);
 if(!rows.length||!b.processador)return null;
 const exact=rows.filter(x=>x.processador_id===b.processador.id);let type='MEDIÇÃO EXATA';
 if(exact.length)rows=exact;else{
 type='REFERÊNCIA PRÓXIMA';const rank=x=>Math.abs(Number(db.processador.find(c=>c.id===x.processador_id)?.desempenho||0)-b.processador.desempenho);
 const nearest=[...rows].sort((a,b)=>rank(a)-rank(b))[0];rows=rows.filter(x=>x.processador_id===nearest.processador_id);
 }
 const avg=a=>a.length?Math.round(a.reduce((s,x)=>s+x,0)/a.length):null;
 return {type,average:avg(rows.map(x=>x.fps_medio)),low:avg(rows.filter(x=>x.fps_1_low!=null).map(x=>x.fps_1_low)),sources:[...new Set(rows.map(x=>x.fonte))].join(', '),count:rows.length};
}
export function recommend(db,game,res,target,budget=Infinity){
 const cheap=a=>[...a].sort((a,b)=>a.preco-b.preco)[0];const candidates=[];
 for(const m of db.benchmark_fps.filter(x=>x.jogo_id===Number(game)&&x.resolucao===res&&x.fps_medio>=target)){
 const cpu=db.processador.find(x=>x.id===m.processador_id),gpu=db.placa_video.find(x=>x.id===m.placa_video_id);if(!cpu||!gpu)continue;
 for(const board of db.placa_mae.filter(x=>normalize(x.socket)===normalize(cpu.socket))){
 const ram=db.memoria.filter(x=>normalize(x.tipo)===normalize(board.tipo_memoria));const ssds=db.ssd.filter(x=>x.capacidade>=500);
 const b={processador:cpu,placa_video:gpu,placa_mae:board,memoria:cheap(ram.filter(x=>x.capacidade>=16))||cheap(ram),ssd:cheap(ssds.length?ssds:db.ssd)};
 b.fonte=cheap(db.fonte.filter(x=>x.potencia>=requiredPower(b)));
 if(!errors(b).length&&total(b)<=budget)candidates.push({...b,benchmark:m});
 }}
 const rank=q=>({'ultra':4,'alta':3,'alto':3,'media':2,'medio':2,'baixa':1,'baixo':1}[normalize(q)]||0);
 return candidates.sort((a,b)=>total(a)-total(b)||rank(b.benchmark.qualidade)-rank(a.benchmark.qualidade)||a.benchmark.fps_medio-b.benchmark.fps_medio)[0]||null;
}
