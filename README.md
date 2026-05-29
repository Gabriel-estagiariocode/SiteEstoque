# SiteEstoque

Repositorio para site de gerenciamento de estoque, criado com Claude Code e que sera disponibilizado para as Escolas/Creches da Prefeitura Municipal de Quata.

O projeto usa Supabase para autenticacao e dados. Agora ele tambem tem uma base limpa para rodar como aplicativo desktop com Electron.

## Estrutura

- raiz do projeto: site web + funcoes `api/` usadas pela Vercel
- `desktop/`: aplicativo Electron

## Deploy na Vercel

A raiz do repositorio agora ficou separada da parte desktop. Assim, a Vercel instala apenas o projeto web.

O arquivo `vercel.json` permanece assim:

```json
{
  "installCommand": "npm install --package-lock=false --omit=dev"
}
```

Assim, no deploy da Vercel sao ignoradas as `devDependencies`, e o `package-lock.json` do Electron nao interfere no build web.

## Electron

### O que foi preparado

- `desktop/electron/main.js`: cria a janela principal do app.
- `desktop/electron/local-server.js`: sobe um servidor local para servir `index.html`, `assets` e as rotas de `api/`.
- `desktop/electron/preload.js`: ponto seguro para futuras integracoes entre renderer e processo principal.
- `.env.example`: modelo das variaveis necessarias.
- `desktop/package.json`: scripts para rodar e gerar instalador.

### Passo a passo para recomecar a integracao

1. Crie um arquivo `.env` na raiz do projeto com base no `.env.example`.
2. Preencha estas variaveis:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RECAPTCHA_SITE_KEY`

3. Instale as dependencias:

```bash
cd desktop
npm install
```

4. Rode o app desktop em desenvolvimento:

```bash
cd desktop
npm run dev
```

5. Gere o executavel quando quiser empacotar:

```bash
cd desktop
npm run dist
```

### Como funciona

O Electron nao abre mais o `index.html` via `file://`. Em vez disso, ele inicia um servidor local em `http://127.0.0.1:<porta>` e carrega a aplicacao por esse endereco.

Isso e importante porque o front usa chamadas para:

- `/api/create-user`
- `/api/list-users`
- `/api/update-user`
- `/api/toggle-user`
- `/api/delete-user`

Assim, as mesmas rotas de `api/` continuam funcionando no desktop sem depender da Vercel para esse fluxo local.

### Importante sobre seguranca

Essa estrutura e boa para desenvolvimento e testes locais. Para distribuir o app para outras pessoas, nao e seguro embutir `SUPABASE_SERVICE_ROLE_KEY` dentro do Electron.

Se o aplicativo for instalado em maquinas de terceiros, o ideal e manter as rotas administrativas em um backend remoto seu, como Vercel, e deixar o Electron consumir esse backend.

### Importante sobre reCAPTCHA

Se o login com reCAPTCHA falhar no Electron, confira no painel do Google reCAPTCHA se `localhost` e `127.0.0.1` estao autorizados para a sua chave publica.

## Criacao de usuarios

Para evitar o erro `email rate limit exceeded` na criacao de usuarios, o projeto usa a rota serverless `api/create-user.js` em vez de chamar `auth.signUp()` direto no navegador.

Configure estas variaveis no ambiente onde as rotas forem executadas:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

A rota cria o usuario com `email_confirm: true`, entao o Supabase nao precisa enviar e-mail de confirmacao para cada novo cadastro feito pelo painel.

As rotas `api/list-users.js`, `api/toggle-user.js` e `api/delete-user.js` tambem usam a service role para que apenas diretoras ativas consigam listar todos os usuarios, ativar/desativar contas e excluir usuarios pelo painel.

## Perfil administrador

Se aparecer o erro `perfis_perfil_check` ao criar ou editar usuarios com perfil `administrador`, o banco ainda esta com o constraint antigo na tabela `perfis`.

Execute este script no Supabase SQL Editor:

- [sql/update-perfis-perfil-check.sql](/c:/Users/User/Desktop/Projects/SiteEstoque/sql/update-perfis-perfil-check.sql)

## Fotos dos produtos

Para habilitar fotos no cadastro e na edicao de produtos, execute este script no Supabase SQL Editor:

- [sql/add-produtos-foto-data-url.sql](/c:/Users/User/Desktop/Projects/SiteEstoque/sql/add-produtos-foto-data-url.sql)

O site redimensiona a imagem no proprio navegador antes de salvar. A imagem original pode ter ate 6 MB e a versao salva fica otimizada para ate 220 KB.
