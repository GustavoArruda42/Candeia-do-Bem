const express = require('express');
const router = express.Router();
const { listar, adicionarEntrada, atualizarMinimo, historico } = require('../controllers/estoqueController');
const { autenticar, apenasAdmin } = require('../middleware/auth');

router.get('/', autenticar, listar);
router.get('/historico', autenticar, historico);
router.post('/entrada', autenticar, apenasAdmin, adicionarEntrada);
router.put('/:item/minimo', autenticar, apenasAdmin, atualizarMinimo);

module.exports = router;
