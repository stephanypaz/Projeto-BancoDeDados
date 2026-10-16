require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_ANON_KEY no .env');
}

// Princípio do Menor Privilégio: usamos APENAS a chave anon.
// Tudo o que ela pode fazer é definido pelas GRANTs e políticas RLS do banco.
// NUNCA use a service_role key neste backend.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

module.exports = supabase;
