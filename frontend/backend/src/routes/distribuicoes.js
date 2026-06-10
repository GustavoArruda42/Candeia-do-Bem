const express = require('express');
const router = express.Router();
const { listar, buscarPorId, criar, atualizar, remover } = require('../controllers/distribuicaoController');
const { autenticar, apenasAdmin } = require('../middleware/auth');

router.get('/', autenticar, listar);
router.get('/:id', autenticar, buscarPorId);
router.post('/', autenticar, criar);
router.put('/:id', autenticar, atualizar);
router.delete('/:id', autenticar, apenasAdmin, remover);

module.exports = router;
