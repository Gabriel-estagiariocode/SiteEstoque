# SiteEstoque
Repositório para site de gerenciamento de estoque, criado com Claude Code e que será disponibilizado para as Escolas/Creches da Prefeitura Municipal de Quatá

Irei integrar esse site com supabase, para banco de dados e com o vercel para hospedagem

## Criacao de usuarios

Para evitar o erro `email rate limit exceeded` na criacao de usuarios, o projeto agora usa a rota serverless `api/create-user.js` em vez de chamar `auth.signUp()` direto no navegador.

Configure estas variaveis no Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

A rota cria o usuario com `email_confirm: true`, entao o Supabase nao precisa enviar e-mail de confirmacao para cada novo cadastro feito pelo painel.

As rotas `api/list-users.js`, `api/toggle-user.js` e `api/delete-user.js` tambem usam a service role para que apenas diretoras ativas consigam listar todos os usuarios, ativar/desativar contas e excluir usuarios pelo painel.
