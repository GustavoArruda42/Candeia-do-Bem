const mongoose = require('mongoose');

const integranteSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  tipo: { type: String, enum: ['motorista', 'ajudante'], required: true },
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Integrante', integranteSchema);