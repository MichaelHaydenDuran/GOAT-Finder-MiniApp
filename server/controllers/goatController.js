const sanitize = require('mongo-sanitize');
const Goat = require('../models/goat');

const clean = v => (typeof v === 'string' ? v.trim() : v);

exports.list = async (req, res, next) => {
  try {
    const goats = await Goat.find().sort({ createdAt: -1 });
    res.json(goats);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const id = sanitize(req.params.id);
    const doc = await Goat.findById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const payload = {
      name: clean(sanitize(req.body.name)),
      breed: clean(sanitize(req.body.breed)),
      ageYears: Number(req.body.ageYears),
      weightLbs: Number(req.body.weightLbs),
      priceUsd: Number(req.body.priceUsd),
      temperament: clean(sanitize(req.body.temperament)),
      imageDataUrl: clean(req.body.imageDataUrl || "")
    };
    const doc = await Goat.create(payload);
    res.status(201).json(doc);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const id = sanitize(req.params.id);
    const updates = {};
    ['name','breed','temperament','imageDataUrl'].forEach(k=>{
      if (k in req.body) updates[k] = clean(sanitize(req.body[k]));
    });
    ['ageYears','weightLbs','priceUsd'].forEach(k=>{
      if (k in req.body) updates[k] = Number(req.body[k]);
    });
    const doc = await Goat.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = sanitize(req.params.id);
    const doc = await Goat.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { next(e); }
};
