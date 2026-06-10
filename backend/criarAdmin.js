require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./src/models/Usuario');

const criarAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const username = 'admin';
  const senha = 'admin123';

  const existe = await Usuario.findOne({ username });
  if (existe) {
    console.log('Usuário admin já existe');
    process.exit(0);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  await Usuario.create({ username, senhaHash, role: 'admin' });

  console.log(`Admin criado! Username: ${username} | Senha: ${senha}`);
  console.log('Troque a senha pelo painel após o primeiro login.');
  process.exit(0);
};

criarAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});