# Loja Virtual Segura (Node.js + Express + Supabase)

## Estrutura
```
api/index.js              -> entrada Serverless (Vercel)
src/app.js                -> app Express
src/server.js             -> servidor local
src/config/supabase.js    -> cliente Supabase (anon key)
src/routes/cadastro.js    -> POST /api/cadastro (bcrypt)
src/routes/cartoes.js     -> POST /api/cartoes, GET /api/cartoes/:cliente_id (view mascarada)
public/                   -> painel web para cadastro e consulta
sql/schema.sql            -> tabelas, view, GRANTs e RLS
```

## Requisitos de segurança
| Requisito | Onde |
|---|---|
| Criptografia em repouso | Infra do Supabase (AES-256 em disco/backups) |
| Hash de senha (bcrypt + salt) | `src/routes/cadastro.js` (12 rounds) |
| Menor privilégio | Só `anon` key + GRANTs restritos + RLS em `sql/schema.sql` |
| Data masking | `vw_cartoes_mascarados`; anon não tem SELECT na tabela base |

> Usamos `bcryptjs` (100% JavaScript, API idêntica ao `bcrypt`), que evita falhas de compilação nativa na Vercel. Para usar o `bcrypt` nativo: `npm i bcrypt` e troque o `require`.

## 1. Banco
Supabase -> SQL Editor -> cole e execute `sql/schema.sql`.

## 2. Rodar localmente
```bash
npm install
cp .env.example .env   # preencha SUPABASE_URL e SUPABASE_ANON_KEY (Settings -> API)
npm run dev
```

Abra `http://localhost:3000` para acessar o painel. Nele, você pode cadastrar clientes, adicionar cartões e consultar os cartões mascarados pelo ID do cliente. O painel não lista clientes nem permite editar/excluir registros, respeitando as permissões restritas da chave anon configuradas no banco.

## 3. Testar
```bash
curl -X POST http://localhost:3000/api/cadastro -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@teste.com","senha":"SenhaForte123"}'
# -> {"id":"<UUID>",...}

curl -X POST http://localhost:3000/api/cartoes -H "Content-Type: application/json" \
  -d '{"cliente_id":"<UUID>","numero_cartao":"4111111111115678"}'

curl http://localhost:3000/api/cartoes/<UUID>
# -> [{"id":1,"cliente_id":"<UUID>","numero_mascarado":"**** **** **** 5678"}]
```
No painel do Supabase (Table Editor), confira que `senha_hash` começa com `$2a$12$...`.

## 4. Deploy na Vercel
```bash
npm i -g vercel
vercel                # primeiro deploy (preview)
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel --prod
```
Ou: suba no GitHub -> vercel.com -> Import Project -> adicione as variáveis -> Deploy.

## Observação acadêmica
Em produção real, números de cartão não devem ser armazenados (PCI-DSS): usa-se tokenização do gateway de pagamento. A rota GET também deveria exigir autenticação (ex.: JWT) para que um cliente só veja os próprios cartões.
