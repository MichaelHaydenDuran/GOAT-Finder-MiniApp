const sanitize = require('mongo-sanitize');
const Goat = require('../models/goat');

const clean = v => (typeof v === 'string' ? v.trim() : v);
const num = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// --- helpers for filter/sort/select ---
const ALLOWED_SORT = new Set([
  'createdAt','-createdAt',
  'updatedAt','-updatedAt',
  'priceUsd','-priceUsd',
  'ageYears','-ageYears',
  'weightLbs','-weightLbs',
  'name','-name','breed','-breed','temperament','-temperament'
]);

const ALLOWED_SELECT = new Set([
  '_id','name','breed','ageYears','weightLbs','priceUsd','temperament','imageDataUrl','createdAt','updatedAt','__v'
]);

function buildFilter(q) {
  const filter = {};
  // text fields (case-insensitive regex)
  if (q.name)        filter.name        = new RegExp(sanitize(String(q.name)), 'i');
  if (q.breed)       filter.breed       = new RegExp(sanitize(String(q.breed)), 'i');
  if (q.temperament) filter.temperament = new RegExp(sanitize(String(q.temperament)), 'i');

  // exact matches if desired
  if (q.eqName)        filter.name        = clean(sanitize(q.eqName));
  if (q.eqBreed)       filter.breed       = clean(sanitize(q.eqBreed));
  if (q.eqTemperament) filter.temperament = clean(sanitize(q.eqTemperament));

  // numeric range builder
  const range = (minKey, maxKey, field) => {
    const gte = num(q[minKey]);
    const lte = num(q[maxKey]);
    if (gte !== undefined || lte !== undefined) {
      filter[field] = {};
      if (gte !== undefined) filter[field].$gte = gte;
      if (lte !== undefined) filter[field].$lte = lte;
    }
  };

  range('minAge','maxAge','ageYears');
  range('minWeight','maxWeight','weightLbs');
  range('minPrice','maxPrice','priceUsd');

  return filter;
}

function buildSort(q) {
  if (!q.sort) return '-createdAt';
  const parts = String(q.sort)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(sanitize)
    .filter(s => ALLOWED_SORT.has(s));
  return parts.length ? parts.join(' ') : '-createdAt';
}

function buildSelect(q) {
  if (!q.select) return undefined;
  const parts = String(q.select)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(sanitize)
    .filter(s => ALLOWED_SELECT.has(s));
  return parts.length ? parts.join(' ') : undefined;
}

// -------------------- LIST (enhanced) --------------------
exports.list = async (req, res, next) => {
  try {
    const q = req.query || {};

    const filter = buildFilter(q);
    const sort   = buildSort(q);
    const select = buildSelect(q);

    const page  = Math.max(parseInt(q.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(q.limit || '50', 10), 1), 100);
    const skip  = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Goat.find(filter).select(select).sort(sort).skip(skip).limit(limit),
      Goat.countDocuments(filter),
    ]);

    // keep response body as the array (backward compatible),
    // expose totals for pagination via headers
    res.set('X-Total-Count', String(total));
    res.set('X-Page', String(page));
    res.set('X-Limit', String(limit));
    res.json(items);
  } catch (e) { next(e); }
};

// -------------------- GET (unchanged) --------------------
exports.get = async (req, res, next) => {
  try {
    const id = sanitize(req.params.id);
    const doc = await Goat.findById(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
};

// -------------------- CREATE (unchanged) --------------------
exports.create = async (req, res, next) => {
  try {
    const payload = {
      name: clean(sanitize(req.body.name)),
      breed: clean(sanitize(req.body.breed)),
      ageYears: num(req.body.ageYears),
      weightLbs: num(req.body.weightLbs),
      priceUsd: num(req.body.priceUsd),
      temperament: clean(sanitize(req.body.temperament)),
      imageDataUrl: clean(req.body.imageDataUrl || "")
    };
    const doc = await Goat.create(payload);
    res.status(201).json(doc);
  } catch (e) { next(e); }
};

// -------------------- UPDATE (minor safety tweak) --------------------
exports.update = async (req, res, next) => {
  try {
    const id = sanitize(req.params.id);
    const updates = {};
    ['name','breed','temperament','imageDataUrl'].forEach(k=>{
      if (k in req.body) updates[k] = clean(sanitize(req.body[k]));
    });
    ['ageYears','weightLbs','priceUsd'].forEach(k=>{
      if (k in req.body) {
        const v = num(req.body[k]);
        if (v !== undefined) updates[k] = v;
      }
    });
    const doc = await Goat.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) { next(e); }
};

// -------------------- REMOVE (unchanged) --------------------
exports.remove = async (req, res, next) => {
  try {
    const id = sanitize(req.params.id);
    const doc = await Goat.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { next(e); }
};
