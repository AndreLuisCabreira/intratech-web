# Verificações — 03/11/2026

## Executadas

- `node --test tests/*.test.js`: 9 testes aprovados, zero falhas. Consumo, margem de fonte, total monetário, invalidação de peças, completude, FPS exato/próximo/sem dados, orçamento e compatibilidade de memória.
- `node --check js/app.js`, `node --check js/api.js`, `node --check js/domain.js`, `node --check js/demo.js`: sintaxe válida.
- Inspeção do esquema e das políticas do projeto Supabase conectado via consultas somente de leitura. Existem as 11 tabelas desktop, com RLS e nenhuma policy. A API web requer a instalação SQL entregue. Não foi aplicado SQL nem alterado dado de produção.
- SDK oficial e licença incluídos localmente; nenhuma dependência de CDN durante o uso.

## Não executadas / necessárias antes de produção

- Teste completo em navegador: Playwright estava disponível, mas sem Chromium. A instalação do navegador falhou ao baixar o arquivo. Não houve validação visual real nem teste automático de cliques.
- Execução do SQL de instalação, cenários de RLS com duas contas, login/cadastro/troca de senha e persistência reais: não executados para preservar produção. Testar com duas contas e confirmar que cada uma só vê suas builds; usuários comuns não devem modificar catálogo.
- Deploy e teste de domínio na Vercel: não solicitado; nada publicado.
- Testar montagem, edição, favoritas, exclusão, comparação, exportações e navegação em desktop/mobile. O modo demonstrativo permite testar sem credenciais.
- Em produção, verificar confirmação de e-mail e URLs de retorno do Auth.

A entrega é código-fonte funcional com integração preparada, mas não uma implantação validada em produção. Confira diferenças de escopo em README.md.

## Tech Forge — 04/11/2026

- Compilação Vite de produção e 9 testes de domínio aprovados.
- Smoke Playwright/Edge com dados demonstrativos: dashboard, seis escolhas, revisão, salvar duas builds, comparar, editar, invalidar placa-mãe/RAM ao trocar socket, preservar rascunho na navegação, benchmarks e todas as páginas existentes.
- Viewports 1440×1000 e 390×844; capturas conferidas, sem overflow horizontal no celular nem exceções JavaScript.
- Nenhuma gravação no Supabase ou execução do desktop faz parte do smoke. Login real e gravação autenticada remota não são cobertos por estes testes.

## Dashboard e microtextos — 09/11/2026
Textos mais naturais, cards com miniaturas ilustradas das builds, marcas do catalogo, capas dos jogos e FPS registrado. Build Vite, 9 testes de dominio e smoke Edge desktop/mobile aprovados. Sem alteracoes no Supabase ou desktop.
