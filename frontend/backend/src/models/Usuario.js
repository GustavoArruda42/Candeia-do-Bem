const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  senhaHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'membro'], default: 'membro' }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);
