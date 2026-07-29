const mongoose = require('mongoose');

const alocacaoSchema = new mongoose.Schema({
  integrante: { type: mongoose.Schema.Types.ObjectId, ref: 'Integrante', required: true },
  role: { type: String, enum: ['motorista', 'ajudante'], required: true }
}, { _id: false });

const cozinheiraAlocadaSchema = new mongoose.Schema({
  cozinheira: { type: mongoose.Schema.Types.ObjectId, ref: 'Cozinheira', required: true },
  qtdQuentinhas: { type: Number, default: 0, min: 0 }
}, { _id: false });

const domingoSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  alocacoes: [alocacaoSchema],
  cozinheiras: [cozinheiraAlocadaSchema]
}, { _id: false });

const escalaSchema = new mongoose.Schema({
  mes: { type: Number, required: true, min: 1, max: 12 },
  ano: { type: Number, required: true },
  domingos: [domingoSchema]
}, { timestamps: true });

escalaSchema.index({ mes: 1, ano: 1 }, { unique: true });

module.exports = mongoose.model('Escala', escalaSchema);