const mongoose = require('mongoose');

const GoatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  breed: { type: String, required: true },
  age: { type: Number, required: true },
  weight: { type: Number },
  temperament: { type: String },
  price: { type: Number },
  imageURL: { type: String },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Goat', GoatSchema);
