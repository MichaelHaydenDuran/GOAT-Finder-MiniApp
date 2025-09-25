const Goat = require('../models/goat');

// CREATE
const createGoat = async (req, res) => {
  try {
    const goat = await Goat.create(req.body);
    res.status(201).json(goat);
  } catch (err) {
    console.error('Error creating goat:', err);
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
const getGoats = async (req, res) => {
  try {
    const goats = await Goat.find();
    res.json(goats);
  } catch (err) {
    console.error('Error fetching goats:', err);
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
const getGoatById = async (req, res) => {
  try {
    const goat = await Goat.findById(req.params.id);
    if (!goat) return res.status(404).json({ error: 'Goat not found' });
    res.json(goat);
  } catch (err) {
    console.error('Error fetching goat:', err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
const updateGoat = async (req, res) => {
  try {
    const goat = await Goat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!goat) return res.status(404).json({ error: 'Goat not found' });
    res.json(goat);
  } catch (err) {
    console.error('Error updating goat:', err);
    res.status(400).json({ error: err.message });
  }
};

// DELETE
const deleteGoat = async (req, res) => {
  try {
    const goat = await Goat.findByIdAndDelete(req.params.id);
    if (!goat) return res.status(404).json({ error: 'Goat not found' });
    res.json({ message: 'Goat deleted' });
  } catch (err) {
    console.error('Error deleting goat:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createGoat, getGoats, getGoatById, updateGoat, deleteGoat };
