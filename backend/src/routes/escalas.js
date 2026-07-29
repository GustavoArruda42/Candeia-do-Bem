const express = require('express');
const router = express.Router();
const { buscar, salvar } = require('../controllers/escalaController');
const { autenticar, apenasAdmin } = require('../middleware/auth');

router.get('/', autenticar, buscar);
router.post('/', autenticar, apenasAdmin, salvar);

module.exports = router;