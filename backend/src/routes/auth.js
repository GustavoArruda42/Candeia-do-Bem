const express = require('express');
const router = express.Router();
const { login, cadastrar, listarUsuarios, removerUsuario } = require('../controllers/authController');
const { autenticar, apenasAdmin } = require('../middleware/auth');

router.post('/login', login);
router.post('/usuarios', autenticar, apenasAdmin, cadastrar);
router.get('/usuarios', autenticar, apenasAdmin, listarUsuarios);
router.delete('/usuarios/:id', autenticar, apenasAdmin, removerUsuario);

module.exports = router;
