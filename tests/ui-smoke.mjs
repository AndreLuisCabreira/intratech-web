import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const url=process.env.TEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(url);
  await page.getByRole('button',{name:'Explorar demonstração local'}).click();
  await page.getByRole('heading',{name:/Seu próximo PC/}).waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await fs.mkdir('test-results',{recursive:true});
  await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});
  for (const name of ['Projeto Obsidian','Projeto Versus']) {
    await page.locator('nav a[href="#montar"]').click();
    for(let i=0;i<6;i++) {
      await page.getByRole('button',{name:'Selecionar',exact:true}).first().click();
      await page.getByRole('group',{name:'Navegação da montagem'}).getByRole('button',{name:'Continuar',exact:true}).click();
    }
    await page.getByLabel('Nome da build').fill(name);
    if(name==='Projeto Obsidian')await page.screenshot({path:'test-results/builder-desktop.png',fullPage:true});
    await page.getByRole('button',{name:'Salvar minha build'}).click();
    await page.getByRole('heading',{name,exact:true}).waitFor();
  }
  await page.locator('nav a[href="#dashboard"]').click();
  await page.getByRole('heading',{name:'2 PCs salvos'}).waitFor();
  assert.equal(await page.locator('.build-preview-card .build-thumbnail').count(),2);
  assert.equal(await page.getByRole('link',{name:'Montar meu PC',exact:true}).count()>0,true);
  await page.locator('nav a[href="#builds"]').click();
  await page.locator('[name=compare]').nth(0).check();
  await page.locator('[name=compare]').nth(1).check();
  await page.getByRole('button',{name:'Comparar lado a lado'}).click();
  await page.getByRole('heading',{name:'Comparação de builds'}).waitFor();
  await page.locator('#close-modal').click();
  await page.locator('[data-edit]').first().click();
  await page.locator('[aria-current=step]').waitFor();
  await page.getByRole('button',{name:'Selecionar',exact:true}).first().click();
  await page.getByRole('status').filter({hasText:'Escolha novamente'}).waitFor();
  assert.ok((await page.locator('.build-summary').innerText()).includes('A selecionar'));
  await page.locator('nav a[href="#builds"]').click();
  await page.locator('nav a[href="#montar"]').click();
  await page.getByRole('button',{name:'Selecionado',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Selecionado',exact:true}).count(),1,'Rascunho preservado ao navegar');
  await page.locator('nav a[href="#benchmarks"]').click();
  await page.locator('.fps-bars').first().waitFor();
  await page.screenshot({path:'test-results/benchmarks-desktop.png',fullPage:true});
  for(const hash of ['componentes','jogos','analises','importar','conta']) {
    await page.locator(`nav a[href="#${hash}"]`).click();
    await page.locator('#content').waitFor();
    assert.ok((await page.locator('#content').innerText()).length>0);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Abrir navegação'}).click();
  await page.locator('nav a[href="#montar"]').click();
  await page.locator('.hardware-card').first().waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow horizontal no celular');
  await page.screenshot({path:'test-results/builder-mobile.png',fullPage:true});
  // A long catalogue must not hide progression after selecting the last item.
  await page.evaluate(()=>{const key='intratech-demo-v1';const data=JSON.parse(localStorage.getItem(key));const cpu=data.processador[0];data.processador=Array.from({length:24},(_,i)=>({...cpu,id:10000+i,nome:`Processador de teste ${i+1}`}));localStorage.setItem(key,JSON.stringify(data));});
  await page.reload();
  await page.getByRole('button',{name:'Explorar demonstração local'}).click();
  await page.locator('.hardware-card').last().getByRole('button',{name:'Selecionar',exact:true}).click();
  const topControls=page.getByRole('group',{name:'Navegação da montagem'});
  const box=await topControls.boundingBox();
  assert.ok(box.y>=60&&box.y+box.height<844,'Navegação fixa visível após selecionar no fim da lista');
  await topControls.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('heading',{name:'Placa-mãe',exact:true}).waitFor();
  await topControls.getByRole('button',{name:'Voltar',exact:true}).click();
  await page.getByRole('button',{name:'Selecionado',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: dashboard, montagem completa, salvar duas builds, comparar, editar, benchmarks, navegação e mobile sem erros JavaScript.');
} finally { await browser.close(); }
