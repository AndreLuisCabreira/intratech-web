# Validação para publicação — 12/11/2026

A pasta fornecida para esta publicação foi C:\Users\Sylvie\Desktop\intratech-web. Ela foi comparada com a revisão local anterior e com o commit fee37871f042692ae11dbf7634508a8873de19ec do GitHub.

## Verificações locais

- npm ci: instalação concluída; auditoria informou zero vulnerabilidades conhecidas nas dependências instaladas.
- npm test: 14 testes aprovados, zero falhas, incluindo o agrupador da API e seus dois subtestes.
- npm run build: concluído. Permanecem dois avisos da biblioteca lucide-react sobre a diretiva use client, já presentes na versão anterior.
- Teste de interface no Microsoft Edge, com a saída de produção servida localmente: aprovado.
- Fluxos cobertos: demonstração, dashboard, montagem e salvamento de duas builds, favoritas, comparação, exportação HTML individual e JSON pessoal, edição, invalidação de peças, preservação do rascunho, recomendações com orçamento suficiente/insuficiente, benchmarks e navegação.
- Viewports de 1440 × 1000 e 390 × 844. O teste não detectou exceções JavaScript ou transbordamento horizontal no montador móvel. A navegação foi conferida com um catálogo de 24 CPUs.
- git diff --check: sem erros.
- A versão contém apenas a chave pública publishable do Supabase; não requer senha de banco ou chave de serviço no navegador.

## Banco de dados

A inspeção somente de leitura do projeto IntraTech PI confirmou as 12 tabelas públicas com RLS habilitado, políticas de catálogo para usuários autenticados, alterações administrativas baseadas em app_metadata, políticas por proprietário em web_build e o gatilho web_build_validation.

Os scripts de instalação não mudaram nesta versão. Não é necessário reaplicá-los, executar migrações ou alterar os dados para publicar esta revisão.

As tabelas legadas usuario, build e componente_importado não têm permissões concedidas a anon/authenticated; os avisos informativos de ausência de policies nessas tabelas são coerentes com essa restrição.

O verificador do Supabase informou que a proteção contra senhas vazadas está desabilitada. É uma melhoria de configuração independente desta publicação:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Limites

Os testes de interface usam dados fictícios no armazenamento local. Login, cadastro, confirmação de e-mail, troca de senha, gravação remota autenticada e isolamento entre contas não foram exercitados nesta publicação. A inspeção das políticas não substitui testes com duas contas.

Não foram automatizadas todas as operações administrativas de importação/cadastro/exclusão, o download comparativo específico ou a impressão em PDF. Também não houve auditoria completa de acessibilidade ou de segurança.

Os scripts SQL, imagens, licença e SDK foram preservados. Nenhuma funcionalidade ou tecnologia foi removida. A pasta original da Área de Trabalho foi mantida; a validação e publicação usam uma cópia.
