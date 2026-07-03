const express = require('express');
const router = express.Router();
const { autenticar, apenasAdmin } = require('../middleware/auth');
const { listar, adicionarEntrada, adicionarSaida, atualizarMinimo, historico } = require('../controllers/estoqueController');

router.post('/saida', autenticar, apenasAdmin, adicionarSaida);
router.get('/', autenticar, listar);
router.get('/historico', autenticar, historico);
router.post('/entrada', autenticar, apenasAdmin, adicionarEntrada);
router.put('/:item/minimo', autenticar, apenasAdmin, atualizarMinimo);

module.exports = router;
