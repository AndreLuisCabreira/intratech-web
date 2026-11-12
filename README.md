# IntraTech PC Builder — Projeto Integrador

Aplicação web para montar e comparar configurações de computadores. O objetivo é ajudar o usuário a escolher componentes compatíveis, acompanhar o custo da montagem e consultar o desempenho registrado nos benchmarks do catálogo.

Uma **build** é uma configuração com processador, placa-mãe, memória RAM, placa de vídeo, SSD e fonte. Há um modo demonstrativo local e um modo conectado ao Supabase.

## Executar para avaliação

Requisitos: Node.js 24, npm e um navegador atualizado. É necessário acesso à internet para instalar as dependências.

Na pasta que contém `package.json`, execute:

```sh
npm ci
npm run dev
```

Abra o endereço informado no terminal e escolha **Explorar demonstração local**. Esse modo não exige conta nem configuração do banco. Os dados e preços são fictícios; as alterações ficam no armazenamento local do navegador e não são enviadas ao Supabase. Para restaurar a demonstração, remova apenas a chave `intratech-demo-v1` do localStorage nas ferramentas do navegador.

Para avaliar o fluxo principal:

1. Abra **Montar PC** e selecione as seis peças.
2. Na revisão, informe um nome, marque como favorita se desejar e salve.
3. Consulte **Minhas builds**, crie outra montagem e selecione duas para comparar.
4. Explore o catálogo, os benchmarks e as recomendações por jogo.

Abrir `index.html` diretamente não inicia o sistema: use o servidor do Vite.

## Funcionalidades

- Cadastro e login por e-mail, saída da conta e alteração de senha com reautenticação no modo conectado.
- Visão geral com contagens do catálogo e montagens recentes.
- Catálogo com busca e filtros de categoria e preço.
- Cadastro, edição e exclusão de componentes, jogos e benchmarks para administradores; na demonstração, essas operações são locais.
- Montagem guiada com validação de socket, memória e fonte. Alterar uma peça descarta escolhas incompatíveis.
- Salvamento, edição, favoritas e exclusão de builds. O rascunho permanece ao navegar durante a sessão.
- Comparação de duas ou três builds, exportação HTML individual ou comparativa e exportação pessoal em JSON.
- Consulta de FPS médio e 1% low com a fonte dos benchmarks; recomendações por jogo, resolução, meta de FPS e orçamento.
- Importação de um componente JSON por vez, com revisão no formulário antes de salvar. Veja `exemplo-componente.json`.
- Tema claro/escuro e navegação adaptada a telas menores.

## Tecnologias e organização

JavaScript com módulos ES, React 19, Vite 8, Tailwind CSS 3.4 e CSS próprio. Lucide React fornece os ícones. Supabase Auth cuida das contas; PostgreSQL armazena catálogo e builds, com políticas RLS para restringir o acesso. O SDK Supabase JS 2.49.8 está em `public/vendor`, com sua licença MIT. As fontes Inter, Space Grotesk e JetBrains Mono são empacotadas localmente.

| Arquivo ou pasta                           | Responsabilidade                                              |
| ------------------------------------------ | ------------------------------------------------------------- |
| `index.html`                               | Entrada da aplicação                                          |
| `js/app.js`                                | Sessão, navegação e páginas em HTML/JavaScript                |
| `js/api.js`                                | Persistência remota e demonstrativa                           |
| `js/config.js`                             | URL e chave pública do Supabase                               |
| `js/demo.js`                               | Catálogo fictício para avaliação                              |
| `js/domain.js`                             | Compatibilidade, preços, consumo, FPS e recomendações         |
| `js/forge.jsx`                             | Componentes React da interface                                |
| `js/forge.css`                             | Estilos da interface Tech Forge                               |
| `styles.css`                               | Estilos compartilhados e formulários                          |
| `public/assets/`                           | Logo e imagens das telas                                      |
| `public/vendor/`                           | SDK Supabase e licença                                        |
| `database/base-original.sql`               | Esquema de origem, com tabelas legadas                        |
| `database/ativar-web.sql`                  | Instalação das tabelas e permissões web                       |
| `tests/`                                   | Testes de regras, API simulada e interface                    |
| `package.json` e `package-lock.json`       | Comandos, dependências e versões para instalação reproduzível |
| `tailwind.config.js` e `postcss.config.js` | Cores, fontes e processamento do CSS                          |
| `vercel.json`                              | Build e cabeçalhos da hospedagem                              |
| `.editorconfig` e `.gitignore`             | Convenções de edição e exclusões da entrega                   |

O fluxo começa em `index.html`, que carrega o SDK e `app.js`. Após recuperar a sessão ou entrar na demonstração, `api.js` carrega os dados; a navegação usa o fragmento da URL, como `#montar`. As regras ficam em `domain.js`, separadas da interface para serem testadas sem navegador.

A interface combina páginas em HTML/JavaScript com componentes React para a navegação lateral, a visão geral e o montador. As raízes React são desmontadas antes da substituição do HTML. Essa integração foi preservada para evitar uma reescrita ampla durante a organização do projeto.

## Regras e limites

- CPU e placa-mãe precisam ter o mesmo socket; RAM e placa-mãe precisam usar o mesmo tipo de memória.
- O consumo considera CPU, placa-mãe e GPU, mais 5 W para RAM e 5 W para SSD. A fonte precisa oferecer esse total com margem de 20%, arredondado para cima.
- Os preços vêm do catálogo. A soma usa centavos para reduzir diferenças de arredondamento.
- A análise de FPS usa o cenário cadastrado. Sem CPU exata, busca referência com a mesma GPU e CPU de índice de desempenho mais próximo. Sem medição aplicável, não apresenta estimativa.
- A recomendação prioriza menor preço dentro da meta. Em empate, prioriza qualidade gráfica e depois o menor FPS que já atende à meta. Prefere RAM de pelo menos 16 GB e SSD de pelo menos 500 GB, quando disponíveis.
- Não são verificadas BIOS, dimensões, conectores ou compatibilidade física. Não há consulta de preços em tempo real.
- As miniaturas das builds são ilustrações. Os dados demonstrativos não representam medições reais.
- O JSON pessoal exportado serve para consulta e portabilidade; não existe restauração automática na interface. A importação de catálogo não deduplica por identificador externo.
- Contas e builds legadas do desktop não são migradas automaticamente. Backup integral do banco é uma operação administrativa pelo painel do Supabase.

## Configurar o Supabase

Para a demonstração, não é necessário alterar nada. Para o modo conectado, `js/config.js` contém URL e chave **publishable** do projeto. Essa chave é pública e estará no navegador; a proteção depende das permissões e das políticas RLS. Nunca coloque senha de banco, chave secreta ou `service_role` nesse arquivo. O projeto não exige `.env` na configuração atual.

Para uma instalação própria:

1. Crie um projeto Supabase e substitua URL e chave pública em `js/config.js`.
2. Em um banco vazio, revise e execute `database/base-original.sql` e depois `database/ativar-web.sql`, nessa ordem, pelo SQL Editor. **Não execute em um banco existente sem verificar o esquema e fazer backup.** O segundo script é de instalação única e não é idempotente.
3. Habilite autenticação por e-mail/senha. Configure Site URL e Redirect URLs para o endereço local exibido pelo Vite e, se necessário, o domínio publicado.
4. Cadastre uma conta pela aplicação e confirme o e-mail se essa opção estiver habilitada.
5. Para administrar o catálogo, atribua `app_metadata.role = "admin"` à conta por uma ferramenta administrativa confiável. A primeira conta não recebe esse papel automaticamente. Renove a sessão depois da alteração. Não use `user_metadata` para conceder permissões.
6. Preencha o catálogo antes de salvar montagens reais. O esquema inicial inclui alguns jogos, mas não um catálogo completo de hardware.

As políticas entregues permitem leitura do catálogo para contas autenticadas, alterações do catálogo para administradores e acesso às builds apenas pelo proprietário. `web_build` referencia o UUID do Supabase Auth; `usuario`, `build` e `componente_importado` são tabelas legadas sem acesso concedido à API web. O banco também valida socket, memória e fonte ao salvar uma build.

Os scripts são preservados como parte da instalação. Esta revisão não os executou no serviço conectado nem alterou seus dados ou permissões.

## Comandos e testes

| Comando           | Finalidade                                          |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento local                   |
| `npm run build`   | Gera a versão de produção em `dist/`                |
| `npm run preview` | Serve o build local para conferência                |
| `npm test`        | Testes de domínio e API com cliente simulado        |
| `npm run test:ui` | Teste de interface com Playwright no Microsoft Edge |

Para o teste de interface, tenha o Microsoft Edge instalado. Execute `npm run build` e mantenha `npm run preview -- --port 4173 --strictPort` aberto em outro terminal antes de rodar `npm run test:ui`. O teste usa a demonstração e gera capturas em `test-results/`. A variável opcional `TEST_URL` permite selecionar outro servidor local. Não direcione o teste a um ambiente compartilhado.


Os testes de interface usam dados demonstrativos locais. Login e gravações reais no Supabase precisam ser verificados com contas de teste.

## Entrega e hospedagem

Para entregar em ZIP, inclua código, `public/`, `database/`, `tests/`, documentos, exemplos e configurações, inclusive `package-lock.json`. Exclua `.git/`, `node_modules/`, `dist/`, `.vercel/`, `test-results/`, logs, arquivos pessoais e eventuais arquivos com segredos. Depois de extrair, siga os comandos de instalação deste README.

Na Vercel: framework **Vite**, instalação `npm ci`, build `npm run build` e saída `dist`. Somente a saída compilada deve ser servida; SQL e testes não são arquivos públicos da aplicação. Configurar o provedor Git e as URLs do Auth depende da conta responsável pela hospedagem.

Antes de publicar uma nova versão, execute os testes e a compilação descritos acima.
