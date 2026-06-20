const express = require('express');
const router = express.Router();
const { autenticar, apenasAdmin } = require('../middleware/auth');
const { login, cadastrar, cadastroPublico, listarUsuarios, removerUsuario } = require('../controllers/authController');

router.post('/cadastro', cadastroPublico);
router.post('/login', login);
router.post('/usuarios', autenticar, apenasAdmin, cadastrar);
router.get('/usuarios', autenticar, apenasAdmin, listarUsuarios);
router.delete('/usuarios/:id', autenticar, apenasAdmin, removerUsuario);

module.exports = router;
