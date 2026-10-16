const router = require('express').Router();
const supabase = require('../config/supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/cartoes  { cliente_id, numero_cartao }
router.post('/', async (req, res, next) => {
  try {
    const { cliente_id, numero_cartao } = req.body || {};
    if (typeof cliente_id !== 'string' || !UUID_RE.test(cliente_id))
      return res.status(400).json({ erro: 'cliente_id inválido' });
    const numero = String(numero_cartao || '').replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(numero))
      return res.status(400).json({ erro: 'Número de cartão inválido' });

    const { error } = await supabase.from('cartoes_credito').insert({ cliente_id, numero_cartao: numero });
    if (error) {
      if (error.code === '23503') return res.status(404).json({ erro: 'Cliente não encontrado' });
      return next(error);
    }
    // Resposta já mascarada: o número completo nunca volta ao cliente
    return res.status(201).json({ mensagem: 'Cartão cadastrado', cartao: `**** **** **** ${numero.slice(-4)}` });
  } catch (e) { next(e); }
});

// GET /api/cartoes/:cliente_id  -> lê SOMENTE da view mascarada
router.get('/:cliente_id', async (req, res, next) => {
  try {
    const { cliente_id } = req.params;
    if (!UUID_RE.test(cliente_id)) return res.status(400).json({ erro: 'cliente_id inválido' });

    const { data, error } = await supabase
      .from('vw_cartoes_mascarados')
      .select('id, cliente_id, numero_mascarado')
      .eq('cliente_id', cliente_id);
    if (error) return next(error);
    return res.json(data);
  } catch (e) { next(e); }
});

module.exports = router;
