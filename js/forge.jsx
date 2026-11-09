import React, {useState, useRef} from 'react';
import {Cpu, CircuitBoard, MemoryStick, Gpu, HardDrive, Zap, LayoutDashboard, Boxes, Gamepad2, ChartNoAxesCombined, Import, UserRound, LogOut, Check, ChevronRight, Menu, X, ShieldCheck, ArrowUpRight} from 'lucide-react';
import {categories,labels,money,normalize,total,consumption,requiredPower,errors,selectPart,eligible} from './domain.js';

const icons={dashboard:LayoutDashboard,builds:Boxes,montar:Cpu,componentes:CircuitBoard,jogos:Gamepad2,analises:ChartNoAxesCombined,benchmarks:ChartNoAxesCombined,importar:Import,conta:UserRound,processador:Cpu,placa_mae:CircuitBoard,memoria:MemoryStick,placa_video:Gpu,ssd:HardDrive,fonte:Zap};
export function Sidebar({nav,page,user,admin,demo,connected,onLogout,onTheme}) {
  const [open,setOpen]=useState(false);
  const name=user.user_metadata?.name||user.email||'Visitante';
  return <>
    <div className="mobile-bar"><span className="font-display font-bold">INTRATECH <span className="text-forge-cyan">/ PC BUILDER</span></span><button className="secondary" aria-label={open?'Fechar navegação':'Abrir navegação'} aria-expanded={open} aria-controls="forge-navigation" onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button></div>
    {open&&<button className="nav-overlay" aria-label="Fechar navegação" onClick={()=>setOpen(false)}/>}
    <aside id="forge-navigation" className={`forge-sidebar ${open?'is-open':''}`} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>
      <a href="#dashboard" className="forge-brand" onClick={()=>setOpen(false)}><div className="brand-chip"><Cpu size={26}/></div><div>INTRATECH<small>MONTE. COMPARE. JOGUE.</small></div></a>
      <span className="nav-caption">SEU SETUP</span>
      <nav aria-label="Navegação principal">{nav.filter(([k])=>k!=='importar'||admin).map(([k,v])=>{const Icon=icons[k];return <a key={k} href={`#${k}`} className={page===k?'active':''} aria-current={page===k?'page':undefined} onClick={()=>setOpen(false)}><Icon size={18} aria-hidden="true"/>{v}{page===k&&<ChevronRight size={14} className="ml-auto"/>}</a>;})}</nav>
      <div className="sidebar-lab"><CircuitBoard size={22}/><p>Seu próximo upgrade<br/><strong>começa aqui.</strong></p><a href="#montar" onClick={()=>setOpen(false)}>Montar meu PC <ArrowUpRight size={14}/></a></div>
      <footer className="side-bottom"><div className="profile-row"><div className="avatar">{name.slice(0,2).toUpperCase()}<i className={connected?'online':''}/></div><div className="profile-copy"><strong title={name}>{name}</strong><small>{demo?'DEMO LOCAL':connected?'SUPABASE CONECTADO':'CONEXÃO PENDENTE'}</small></div><button className="icon-button" title="Sair" aria-label="Sair da conta" onClick={onLogout}><LogOut size={17}/></button></div><button className="theme-toggle" onClick={onTheme}>Alternar tema claro / escuro</button></footer>
    </aside>
  </>;
}

export function HardwareImage({part,kind}) {
  const [broken,setBroken]=useState(false);const Icon=icons[kind]||Cpu;
  return <div className="hardware-image">{part?.imagem_url&&!broken?<img src={part.imagem_url} alt="" loading="lazy" onError={()=>setBroken(true)}/>:<Icon size={42} strokeWidth={1.1} aria-hidden="true"/>}</div>;
}

export function Builder({db,initialDraft,initialStep=0,onDraft,onSave,onSaved}) {
  const [draft,setDraft]=useState(initialDraft),[step,setStep]=useState(initialStep),[search,setSearch]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const lock=useRef(false);const k=categories[step];
  function update(next){setDraft(next);onDraft(next,step);}
  function go(index){setStep(index);setSearch('');onDraft(draft,index);setError('');}
  function choose(part){const next=selectPart(draft,k,part),removed=categories.filter(c=>draft[c]&&!next[c]);update(next);setMessage(removed.length?'Escolha novamente: '+removed.map(c=>labels[c]).join(', '):part.nome+' selecionado.');}
  async function save(){if(lock.current)return;const problems=errors(draft);if(!draft.nome?.trim())problems.push('Informe um nome para sua build.');if(problems.length){setError(problems.join(' '));return;}lock.current=true;setSaving(true);setError('');try{await onSave({...draft,nome:draft.nome.trim()});onSaved();}catch(e){setError(e.message||'Não foi possível salvar. Seu rascunho foi mantido.');}finally{lock.current=false;setSaving(false);}}
  const rows=k?db[k].filter(p=>eligible(draft,k,p)&&normalize(Object.values(p).join(' ')).includes(normalize(search))):[];
  const ready=['processador','placa_mae','placa_video'].every(c=>draft[c]);const watts=consumption(draft),capacity=Number(draft.fonte?.potencia||0),socketReady=!!(draft.processador&&draft.placa_mae),socketOk=socketReady&&normalize(draft.processador.socket)===normalize(draft.placa_mae.socket);
  return <div className="forge-builder">
    <div className="builder-intro"><p className="eyebrow">CONFIGURADOR / {String(step+1).padStart(2,'0')} DE 07</p><h2>Peça por peça. <span>Do seu jeito.</span></h2><p className="muted">Escolha as peças que combinam com seu uso e seu orçamento.</p></div>
    <nav className="line-stepper" aria-label="Etapas da montagem"><ol>{[...categories,'revisao'].map((c,i)=>{const done=!!draft[c],allowed=categories.slice(0,i).every(x=>draft[x]);const Icon=icons[c]||ShieldCheck;return <li key={c} className={done?'complete':''}><button disabled={!allowed||saving} aria-current={i===step?'step':undefined} onClick={()=>go(i)} className={i===step?'current':''}><span>{done?<Check size={17}/>:<Icon size={17}/>}</span><small>{labels[c]||'Revisão'}</small></button>{i<6&&<i/>}</li>;})}</ol></nav>
    <div className="builder-grid"><section><fieldset disabled={saving}>
      {k?<><div className="section-heading"><div><span className="eyebrow">{String(step+1).padStart(2,'0')} / SELEÇÃO DE HARDWARE</span><h2>{labels[k]}</h2></div><label className="search-field"><span className="sr-only">Buscar componente</span><input placeholder="Buscar uma peça…" value={search} onChange={e=>setSearch(e.target.value)}/></label></div><p className="catalog-count">{rows.length} opções compatíveis disponíveis</p>
      <div className="part-grid">{rows.map(p=>{const selected=draft[k]?.id===p.id;const specs=[p.socket,p.tipo||p.tipo_memoria,p.consumo!=null?`${p.consumo} W`:null,p.nucleos?`${p.nucleos} cores`:null,p.capacidade?`${p.capacidade} GB`:null,p.potencia?`${p.potencia} W`:null].filter(Boolean);return <article key={p.id} className={`hardware-card ${selected?'selected':''}`}><div className="hardware-top"><HardwareImage part={p} kind={k}/><span className="hardware-category">{selected?'SELECIONADO':labels[k]}</span></div><p className="manufacturer">{p.fabricante||'COMPONENTE'}</p><h3>{p.nome}</h3><div className="spec-pills">{specs.map((s,i)=><span key={i}>{s}</span>)}</div><div className="hardware-bottom"><strong>{money(p.preco)}</strong><button aria-pressed={selected} onClick={()=>choose(p)} className={selected?'selected-button':''}>{selected?<><Check size={16}/>Selecionado</>:<>Selecionar<ChevronRight size={16}/></>}</button></div></article>;})}</div>{!rows.length&&<div className="card empty"><Cpu size={34}/><h3>Nenhuma peça encontrada</h3><p>Revise a busca ou as escolhas anteriores. O catálogo real pode ainda não ter componentes desta categoria.</p></div>}</>:<section className="card review-card"><span className="eyebrow">TUDO CERTO?</span><h2>Dê um nome à sua build.</h2><label>Nome da build<input autoFocus maxLength={120} value={draft.nome||''} placeholder="Ex.: Projeto Obsidian" onChange={e=>update({...draft,nome:e.target.value})}/></label><label className="check"><input type="checkbox" checked={!!draft.favorita} onChange={e=>update({...draft,favorita:e.target.checked})}/>Marcar como favorita</label><p className="muted">Revise as seis peças no resumo antes de salvar.</p></section>}
      <div className="builder-controls"><button className="secondary" disabled={!step} onClick={()=>go(step-1)}>Voltar</button><button className="text-button" onClick={()=>{if(confirm('Descartar o rascunho e começar outra montagem?')){setDraft({});setStep(0);setSearch('');onDraft({},0);setMessage('Nova montagem iniciada.');}}}>Recomeçar</button>{k&&<button disabled={!draft[k]} onClick={()=>go(step+1)}>Continuar<ChevronRight size={16}/></button>}</div>
    </fieldset><p role="status" className="builder-feedback">{message}</p></section>
    <section className="build-summary"><div className="summary-heading"><Cpu size={21}/><div><span className="eyebrow">RESUMO DA BUILD</span><h2>Sua máquina</h2></div><span className="build-counter">{categories.filter(c=>draft[c]).length}/6</span></div><ul>{categories.map((c,i)=>{const Icon=icons[c];return <li key={c}><button disabled={saving||!categories.slice(0,i).every(x=>draft[x])} onClick={()=>go(i)}><Icon size={18}/><span><small>{labels[c]}</small><strong>{draft[c]?.nome||'A selecionar'}</strong></span>{draft[c]&&<Check size={13} className="text-blue-400"/>}</button></li>;})}</ul>
      <div className={`compatibility ${socketReady?socketOk?'ok':'bad':''}`}><ShieldCheck size={17}/>{socketReady?socketOk?'Socket compatível':'Socket incompatível':'Aguardando CPU + placa-mãe'}</div>
      <div className="power-block"><div><span><Zap size={14}/>Consumo estimado</span><strong>{ready?`${watts} W`:'—'}</strong></div>{ready&&capacity>0&&<meter min="0" max={capacity} value={Math.min(watts,capacity)} aria-label={`Consumo ${watts} watts de uma fonte de ${capacity} watts`}/>}<small>{ready?`Fonte recomendada: ≥ ${requiredPower(draft)} W (margem de 20%)`:'Selecione CPU, placa-mãe e GPU.'}</small>{capacity>0&&<small>Fonte selecionada: {capacity} W</small>}</div>
      <div className="summary-total"><span>Investimento total</span><strong>{money(total(draft))}</strong><small>Preços cadastrados no catálogo</small></div><button className="full save-build" disabled={saving||!!k||errors(draft).length>0||!draft.nome?.trim()} onClick={save}>{saving?'Salvando…':'Salvar minha build'}<ArrowUpRight size={17}/></button>{error&&<p role="alert" className="error">{error}</p>}<p className="summary-note">Validação de socket, memória e potência. Confira BIOS, dimensões e conectores antes de comprar.</p>
    </section></div>
  </div>;
}


// This is an illustration of the saved parts, never a photo of the user's PC.
export function BuildThumbnail({build,compact=false}) {
  const gpu=!!build?.placa_video;
  return <div className={`build-thumbnail ${compact?'compact':''}`} role="img" aria-label={`Ilustração da build ${build?.nome||''}${build?.placa_video?.nome?', com '+build.placa_video.nome:''}`}>
    <svg viewBox="0 0 240 190" aria-hidden="true"><defs><linearGradient id={`case-${build?.id||'new'}-${compact}`} x2="1" y2="1"><stop stopColor="#303640"/><stop offset="1" stopColor="#101116"/></linearGradient></defs>
      <ellipse cx="122" cy="174" rx="85" ry="8" fill="#000" opacity=".4"/>
      <path d="M51 24 170 13 202 32 202 164 85 177 51 157Z" fill={`url(#case-${build?.id||'new'}-${compact})`} stroke="#495164"/>
      <path d="m59 34 106-10v126L59 158Z" fill="#0b0d13" stroke="#394353"/>
      <path d="m177 24 18 12v119l-18 5Z" fill="#171c26" stroke="#303b4d"/>
      <path d="M69 47 146 40v92l-77 10Z" fill="#172230" stroke="#31465f"/>
      <path d="m79 58 42-4v35l-42 5Z" fill="#0f1724" stroke="#60a5fa"/>
      <path d="m128 53 5-1v38l-5 1m10-40 5-1v38l-5 1" stroke="#8b5cf6" strokeWidth="3"/>
      {gpu&&<><path d="m73 109 83-9v20l-83 10Z" fill="#293642" stroke="#637991"/><circle cx="96" cy="116" r="7" stroke="#60a5fa" fill="#10151e"/><circle cx="132" cy="112" r="7" stroke="#60a5fa" fill="#10151e"/></>}
      {[57,96,135].map(y=><g key={y}><ellipse cx="185" cy={y} rx="7" ry="13" fill="#0b1018" stroke="#3b82f6"/><ellipse cx="185" cy={y} rx="3" ry="6" fill="none" stroke="#a78bfa"/></g>)}
      <path d="m72 148 74-8v10l-74 8Z" fill="#11151b"/><circle cx="185" cy="36" r="2" fill="#67e8f9"/>
    </svg>
  </div>;
}

function BrandChips({db}) {
  const names=[...new Set([...db.processador,...db.placa_video,...db.placa_mae].map(p=>p.fabricante).filter(Boolean))].slice(0,4);
  return <div className="brand-chips" aria-label="Marcas no catálogo">{names.length?names.map(name=><span key={name}>{name}</span>):<span>Seu catálogo de peças</span>}</div>;
}

export function Dashboard({db,builds}) {
  const recent=builds.slice(-3).reverse();
  const componentCount=categories.reduce((n,k)=>n+db[k].length,0);
  const games=db.jogo.slice(0,3);
  const cover=g=>{const n=normalize(g.nome);return n.includes('cyberpunk')?'assets/cyberpunk-2077.jpg':n.includes('fortnite')?'assets/fortnite.jpg':n.includes('counter')||n.includes('cs2')?'assets/counter-strike-2.jpg':null;};
  const samples=db.benchmark_fps.slice(0,3),max=Math.max(1,...samples.map(x=>Number(x.fps_medio)||0));
  return <>
    <section className="forge-hero"><div><span className="eyebrow">SEU PC, DO SEU JEITO</span><h2>Seu próximo PC<br/>começa <em>por aqui.</em></h2><p>Escolha as peças, veja o que combina e compare quanto cada montagem vai custar.</p><a href="#montar" className="button">Montar meu PC <ArrowUpRight size={17}/></a><span className="hero-note">Da primeira peça ao próximo upgrade.</span></div><div className="hero-hardware" aria-hidden="true"><div className="chip-orbit"/><Cpu size={150} strokeWidth={.7}/><span>HARDWARE PARA O SEU PRÓXIMO SETUP</span></div></section>
    <div className="discovery-grid">
      <a className="discovery-card builds-discovery" href="#builds"><div className="discovery-copy"><span className="discovery-label">Minhas builds</span><h3>{builds.length?`${builds.length} ${builds.length===1?'PC salvo':'PCs salvos'}`:'Sua primeira build'}</h3><p>{builds.length?'Continue de onde parou ou compare suas montagens.':'Ainda está escolhendo? Salve uma montagem para comparar depois.'}</p></div><div className="mini-builds">{recent.length?recent.map(b=><div key={b.id}><BuildThumbnail build={b} compact/><span>{b.nome}</span></div>):<BuildThumbnail build={{}} compact/>}</div><span className="discovery-link">{builds.length?'Ver minhas builds':'Conhecer minhas builds'} <ArrowUpRight size={15}/></span></a>
      <a className="discovery-card parts-discovery" href="#componentes"><div className="discovery-copy"><span className="discovery-label">Catálogo de hardware</span><h3>{componentCount} peças para explorar</h3><p>De processador a fonte: encontre as peças do seu próximo setup.</p></div><div className="parts-display" aria-hidden="true"><div><Cpu size={46} strokeWidth={1}/><span>CPU</span></div><div><Gpu size={64} strokeWidth={1}/><span>GPU</span></div><div><MemoryStick size={46} strokeWidth={1}/><span>RAM</span></div></div><BrandChips db={db}/><span className="discovery-link">Explorar componentes <ArrowUpRight size={15}/></span></a>
      <a className="discovery-card games-discovery" href="#jogos"><div className="discovery-copy"><span className="discovery-label">O que você quer jogar?</span><h3>{db.jogo.length} {db.jogo.length===1?'jogo no catálogo':'jogos no catálogo'}</h3><p>Escolha um jogo e veja as opções de montagem.</p></div><div className="game-shelf">{games.length?games.map(g=><div key={g.id}>{cover(g)?<img src={cover(g)} alt="" loading="lazy"/>:<div className="game-cover-placeholder"><Gamepad2 size={32}/></div>}<span>{g.nome}</span></div>):<p>Os jogos cadastrados aparecem aqui.</p>}</div><span className="discovery-link">Escolher um jogo <ArrowUpRight size={15}/></span></a>
      <a className="discovery-card benchmark-discovery" href="#benchmarks"><div className="discovery-copy"><span className="discovery-label">Antes de escolher, compare</span><h3>{db.benchmark_fps.length} {db.benchmark_fps.length===1?'benchmark disponível':'benchmarks disponíveis'}</h3><p>Veja o FPS registrado e confira a fonte de cada teste.</p></div><div className="benchmark-preview">{samples.length?samples.map(x=><div key={x.id}><span>{db.jogo.find(g=>g.id===x.jogo_id)?.nome||'Jogo cadastrado'}</span><div><i style={{width:`${Math.min(100,Number(x.fps_medio)/max*100)}%`}}/></div><strong>{x.fps_medio} FPS</strong></div>):<p>Ainda não há medições cadastradas.</p>}</div><span className="discovery-link">Conferir benchmarks <ArrowUpRight size={15}/></span></a>
    </div>
    <div className="section-heading"><h2>Suas últimas builds</h2><a href="#builds">Ver todas ↗</a></div><div className="grid">{recent.length?recent.map(b=><article className="card build-tile build-preview-card" key={b.id}><BuildThumbnail build={b}/><div><span className="eyebrow">{b.favorita?'FAVORITA':'SUA BUILD'}</span><h3>{b.nome}</h3><p className="muted">{b.processador?.nome}<br/>{b.placa_video?.nome}</p><strong className="font-mono">{money(total(b))}</strong><a href="#builds" className="build-open">Ver montagem <ArrowUpRight size={14}/></a></div></article>):<div className="card empty"><Cpu size={38}/><h3>Vamos montar seu primeiro PC?</h3><p>Escolha as peças e salve sua build para continuar quando quiser.</p><a href="#montar" className="button">Iniciar nova build</a></div>}</div><p className="thumbnail-note">As miniaturas das builds são ilustrações das peças selecionadas, não fotos dos computadores.</p>
  </>;
}
