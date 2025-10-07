const { Schema, model } = require('mongoose');

const goatSchema = new Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  breed:       { type: String, required: true, trim: true, maxlength: 80 },
  ageYears:    { type: Number, required: true, min: 0, max: 25 },
  weightLbs:   { type: Number, required: true, min: 0, max: 500 },
  priceUsd:    { type: Number, required: true, min: 0, max: 100000 },
  temperament: { type: String, required: true, trim: true, maxlength: 60 },
  // store small images as Data URLs so they persist on Render (no disk writes)
  imageDataUrl:{ type: String, default: "" } // e.g., "data:image/jpeg;base64,..."
}, { timestamps: true });

module.exports = model('Goat', goatSchema);