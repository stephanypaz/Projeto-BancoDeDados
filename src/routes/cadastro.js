const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/cadastro  { nome, email, senha }
router.post('/', async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (typeof nome !== 'string' || nome.trim().length < 2 || nome.length > 100)
      return res.status(400).json({ erro: 'Nome inválido' });
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 255)
      return res.status(400).json({ erro: 'E-mail inválido' });
    if (typeof senha !== 'string' || senha.length < 8 || senha.length > 72)
      return res.status(400).json({ erro: 'A senha deve ter entre 8 e 72 caracteres' });

    // Hashing com bcrypt: o salt é gerado automaticamente e embutido no hash
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const senha_hash = await bcrypt.hash(senha, rounds);

    // id gerado no backend: a anon key não tem SELECT na tabela, então não usamos .select()
    const id = crypto.randomUUID();
    const { error } = await supabase
      .from('clientes')
      .insert({ id, nome: nome.trim(), email: email.trim().toLowerCase(), senha_hash });

    if (error) {
      if (error.code === '23505') return res.status(409).json({ erro: 'E-mail já cadastrado' });
      return next(error);
    }
    // Nunca retornamos senha nem hash
    return res.status(201).json({ id, nome: nome.trim(), email: email.trim().toLowerCase() });
  } catch (e) { next(e); }
});

module.exports = router;
