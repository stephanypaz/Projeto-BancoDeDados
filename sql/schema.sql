-- =====================================================================
-- Loja Virtual - Script para o SQL Editor do Supabase
-- Criptografia em repouso: o Supabase criptografa discos e backups
-- (AES-256) automaticamente — nada a configurar aqui.
-- =====================================================================

-- 1) Tabela de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 100),
  email      text NOT NULL UNIQUE CHECK (char_length(email) <= 255),
  senha_hash text NOT NULL CHECK (senha_hash LIKE '$2%'),  -- exige formato bcrypt
  criado_em  timestamptz NOT NULL DEFAULT now()
);

-- 2) Tabela de cartões
CREATE TABLE IF NOT EXISTS public.cartoes_credito (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id    uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero_cartao text NOT NULL CHECK (numero_cartao ~ '^[0-9]{13,19}$'),
  criado_em     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cartoes_cliente ON public.cartoes_credito(cliente_id);

-- 3) View de mascaramento (só os 4 últimos dígitos)
--    Owner = postgres, então a view lê a tabela base mesmo que o anon não possa.
CREATE OR REPLACE VIEW public.vw_cartoes_mascarados AS
SELECT
  id,
  cliente_id,
  '**** **** **** ' || right(numero_cartao, 4) AS numero_mascarado
FROM public.cartoes_credito;

-- =====================================================================
-- 4) Menor privilégio para a role "anon"
-- =====================================================================
REVOKE ALL ON public.clientes        FROM anon, authenticated;
REVOKE ALL ON public.cartoes_credito FROM anon, authenticated;
REVOKE ALL ON public.vw_cartoes_mascarados FROM anon, authenticated;

-- anon pode APENAS inserir nas tabelas (sem SELECT/UPDATE/DELETE)
GRANT INSERT (id, nome, email, senha_hash) ON public.clientes TO anon;
GRANT INSERT (cliente_id, numero_cartao)   ON public.cartoes_credito TO anon;
-- anon pode APENAS ler a view mascarada
GRANT SELECT ON public.vw_cartoes_mascarados TO anon;

-- service_role mantém acesso administrativo (não usado pelo backend)
GRANT ALL ON public.clientes, public.cartoes_credito TO service_role;
GRANT SELECT ON public.vw_cartoes_mascarados TO service_role;

-- 5) Row Level Security
ALTER TABLE public.clientes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes_credito ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_insert_clientes ON public.clientes;
CREATE POLICY anon_insert_clientes ON public.clientes
  FOR INSERT TO anon WITH CHECK (senha_hash LIKE '$2%');

DROP POLICY IF EXISTS anon_insert_cartoes ON public.cartoes_credito;
CREATE POLICY anon_insert_cartoes ON public.cartoes_credito
  FOR INSERT TO anon WITH CHECK (true);
-- Nenhuma política de SELECT => a anon key nunca lê numero_cartao nem senha_hash.

-- Teste rápido (rode como anon na aba "API" ou via backend):
--   SELECT * FROM cartoes_credito;       -> permission denied
--   SELECT * FROM vw_cartoes_mascarados; -> só "**** **** **** 1234"
