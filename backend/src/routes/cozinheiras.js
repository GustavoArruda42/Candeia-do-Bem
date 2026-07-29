const express = require('express');
const router = express.Router();
const { listar, criar, atualizar, remover } = require('../controllers/cozinheiraController');
const { autenticar, apenasAdmin } = require('../middleware/auth');

router.get('/', autenticar, listar);
router.post('/', autenticar, apenasAdmin, criar);
router.put('/:id', autenticar, apenasAdmin, atualizar);
router.delete('/:id', autenticar, apenasAdmin, remover);

module.exports = router;