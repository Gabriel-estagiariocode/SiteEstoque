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

## Perfil administrador

Se aparecer o erro `perfis_perfil_check` ao criar ou editar usuarios com perfil `administrador`, o banco ainda esta com o constraint antigo na tabela `perfis`.

Execute este script no Supabase SQL Editor:

- [sql/update-perfis-perfil-check.sql](/c:/Users/User/Desktop/Projects/SiteEstoque/sql/update-perfis-perfil-check.sql)

## Electron

O projeto foi preparado para abrir como aplicativo desktop com Electron.

Arquivos adicionados:

- `package.json`
- `main.js`
- `preload.js`
- `desktop-config.json`

Antes de rodar no Electron, ajuste `desktop-config.json` com a URL publicada do backend, por exemplo:

```json
{
  "apiBaseUrl": "https://seu-projeto.vercel.app"
}
```

As rotas administrativas como criacao, edicao, listagem e exclusao de usuarios continuam dependendo desse backend publicado.

O arquivo `desktop-config.json` foi colocado no `.gitignore` para evitar publicar configuracoes locais. Use `desktop-config.example.json` como modelo ao configurar outra maquina.

Para rodar no Electron:

- `npm.cmd install`
- `npm.cmd start`

Para gerar instalador Windows `.exe`:

- `npm.cmd install`
- `npm.cmd run dist`

O instalador sera gerado na pasta `dist/`.
