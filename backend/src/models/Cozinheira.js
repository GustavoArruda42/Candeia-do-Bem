const mongoose = require('mongoose');

const cozinheiraSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  ativa: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Cozinheira', cozinheiraSchema);