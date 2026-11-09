# IntraTech PC Builder — Web

Interface Tech Forge com React, Tailwind CSS 3.4 e Vite. Sidebar, dashboard e montador são componentes React; os demais fluxos mantêm os módulos JavaScript existentes durante a migração incremental. Fontes são locais, sem requisições ao Google Fonts.

## Executar

Use Node 24 e execute na raiz:

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. Para produção: `npm run build`; para conferir a compilação: `npm run preview`.
Escolha **Explorar demonstração local** para testar com dados fictícios no localStorage, sem escrever no Supabase.

## Ativar Supabase

A configuração pública do projeto IntraTech PI já está em `js/config.js`. Se trocar de projeto, substitua URL e chave publishable. A chave é pública por definição; a proteção dos dados depende das políticas RLS. Nenhuma senha JDBC, chave secreta ou .env do ZIP está nesta pasta.

1. Faça backup do banco pelo painel do Supabase.
2. No projeto IntraTech PI, a ativação web já foi aplicada; não execute novamente. Para outra instalação com o esquema do desktop, revise e execute **database/ativar-web.sql** no SQL Editor UMA vez. É uma instalação, não um script idempotente. Tudo é feito em transação. Em um projeto novo, execute antes `database/base-original.sql`, que cria o esquema original.
3. Habilite o provedor e-mail/senha em Authentication. Configure Site URL e Redirect URLs para localhost e para o domínio final. Se confirmação de e-mail estiver ativa, confirme o cadastro pelo link recebido.
4. Cadastre sua conta pela aplicação web. Use e-mail e senha: as contas desktop da tabela usuario não são contas do Supabase Auth.
5. Para administrar catálogos, atribua `app_metadata.role = "admin"` à conta usando uma ferramenta administrativa confiável. Exemplo no SQL Editor, com o UUID real da conta Auth:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = 'UUID-DA-CONTA';
```

Saia e entre novamente para renovar o token. Não use user_metadata para permissões. A primeira conta NÃO recebe admin automaticamente.

O SQL libera leitura do catálogo somente para contas autenticadas, manutenção somente para administradores e builds somente para o proprietário. A validação de socket, memória e fonte ocorre também no servidor. A tabela `web_build` usa UUID do Auth; `usuario` e `build` antigas ficam intactas e sem acesso pela API. Não houve migração de contas, senhas ou builds desktop. O projeto conectado tinha categorias de componentes vazias; complete o catálogo antes de montar uma build real.

## Publicar na Vercel

Projeto: `intratech-web`. Site: https://intratech-web.vercel.app.
Framework Vite; instalação `npm ci`; build `npm run build`; saída `dist`.
O pacote publicado contém somente os arquivos compilados e os recursos públicos; scripts SQL e testes não são servidos.
O GitHub ainda precisa ser autorizado na integração da Vercel para publicação automática. O envio direto usa exatamente os arquivos de `dist` gerados a partir do commit informado.
`js/config.js` contém apenas URL e chave pública. Nenhuma senha de banco ou chave de serviço é necessária no navegador.

## Design System Tech Forge

- Tokens: `tailwind.config.js`; estilos: `js/forge.css`.
- Componentes React: `js/forge.jsx` (Sidebar, Builder, Dashboard e HardwareImage).
- Integração com a navegação e os fluxos existentes: `js/app.js`. As raízes React são desmontadas antes de substituir seu DOM.
- Recursos estáticos: `public/assets`; SDK Supabase existente: `public/vendor`.
- Fundo obsidian, painéis zinc, accent azul elétrico, roxo para 1% low; valores em JetBrains Mono, títulos em Space Grotesk e texto em Inter.
- Estados de seleção incluem texto/check; skeleton respeita redução de movimento. As etapas do montador são navegáveis por teclado; resumo fixo em telas grandes.
- A montagem reutiliza `js/domain.js`; não há alteração das regras de preços, consumo, compatibilidade, autorização ou persistência.
- Builds desktop continuam nas tabelas legadas. Esta refatoração não executa SQL nem muda dados, contas ou permissões.

## Funcionalidades

- Autenticação por e-mail, cadastro e troca de senha com reautenticação.
- Dashboard com contagens reais do catálogo e builds da conta.
- Catálogo com busca, categoria e limites de preço; cadastro, edição e exclusão administrativos.
- Montagem guiada CPU → placa-mãe → RAM → GPU → SSD → fonte → revisão; peças incompatíveis são descartadas com aviso. Rascunho permanece ao navegar na sessão.
- Salvamento, edição, favoritas e exclusão de builds; bloqueio de operações concorrentes; rascunho descartado somente após gravação confirmada.
- Comparação de duas/três builds e exportação HTML individual; JSON pessoal.
- Benchmarks com fonte, cenário e 1% low; análise exata ou referência com mesma GPU e CPU mais próxima. Sem dados, não inventa FPS.
- Recomendações por resolução, FPS e orçamento, preservando preferências de capacidade e ordenação do algoritmo Java.
- Importação de um componente JSON por vez, com formulário obrigatório de revisão e validação.
- Tema claro/escuro e interface responsiva.

## Diferenças e limites da conversão

- Autenticação passa a usar Supabase Auth; sem migração automática do login desktop.
- Importação externa automática do pc-part-dataset não foi portada. Use um objeto JSON normalizado por componente; veja `exemplo-componente.json`. Não há conversão USD/BRL nem registro de deduplicação por ID externo. Conferir duplicatas antes de salvar.
- Backup/restauração integral do desktop, com senhas de todos os usuários, foi substituído pelo backup administrativo no painel do Supabase. O site exporta somente builds pessoais. O JSON exportado é para consulta/portabilidade; não há restauração pessoal automática na interface.
- Diagnósticos JDBC, terminal Java, instalador Windows e atualizador estrutural não se aplicam ao navegador.
- A exportação comparativa está disponível no diálogo de comparação. Tanto a exportação individual quanto a comparação geram HTML independente que pode ser impresso em PDF pelo navegador.
- Não verifica BIOS, dimensões, conectores ou compatibilidade física; os preços são os cadastrados, sem consulta em tempo real.
- Catálogos administrativos podem mudar peças usadas em builds. Edições de builds revalidam compatibilidade.
- O SDK oficial Supabase JS 2.49.8 está incluído em vendor, com licença MIT. A aplicação depende da rede somente no modo conectado.

## Verificação

Execute `npm ci` e `npm test` com Node 24. `npm run test:ui` verifica a compilação local no Microsoft Edge, com `npm run preview` em http://127.0.0.1:4173. As capturas ficam em `test-results/` e não são versionadas. Os testes verificam as regras de negócio portadas do Java. Consulte `VALIDACAO.md` para resultados e limites desta entrega.

Referências: https://supabase.com/docs/reference/javascript/auth-signinwithpassword e https://supabase.com/docs/guides/database/postgres/row-level-security.

### Dashboard — 09/11/2026
Cards usam o conteudo da conta: builds recentes, marcas presentes, capas dos jogos e amostra dos benchmarks. Miniaturas dos computadores sao ilustracoes, nao fotos. Microtextos priorizam Montar meu PC e Iniciar nova build.

O montador mantém Voltar/Continuar visíveis em uma barra fixa no topo da lista, com o nome da peça selecionada. Os mesmos controles continuam disponíveis no final da lista.
