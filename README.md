# IntraTech PC Builder — Web

HTML, CSS e JavaScript ES Modules. Sem React, Java, npm install ou build obrigatório.
Código versionado no GitHub. A integração web foi ativada no Supabase em 04/11/2026, preservando o acesso JDBC do desktop. Não foi publicado na Vercel.

## Executar

Abra um terminal nesta pasta e execute `python -m http.server 8080` (ou `python3`).
Acesse http://localhost:8080. Também funciona com Live Server no VS Code.
Não abra index.html por file://: módulos JavaScript precisam de um servidor HTTP.
Escolha **Explorar demonstração local** para testar sem configuração. Dados e preços desse modo são fictícios e ficam no localStorage, separados do banco real.

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

Crie outro repositório quando desejar e adicione o conteúdo desta pasta na raiz. Na Vercel, importe esse repositório, selecione **Other**, deixe Build Command vazio e use a raiz como diretório de saída. Não há variáveis de ambiente obrigatórias: `js/config.js` contém apenas configuração pública. Navegação por hash dispensa rewrites de SPA. Atualize as URLs de Authentication no Supabase para o domínio final. A conexão do plugin não aplica automaticamente SQL nem publica o pacote.

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

Execute `npm test` com Node moderno (sem instalar dependências). Os testes verificam as regras de negócio portadas do Java. Consulte `VALIDACAO.md` para resultados e limites desta entrega.

Referências: https://supabase.com/docs/reference/javascript/auth-signinwithpassword e https://supabase.com/docs/guides/database/postgres/row-level-security.
