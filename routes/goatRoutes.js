const express = require('express');
const router = express.Router();
const {
  createGoat,
  getGoats,
  getGoatById,
  updateGoat,
  deleteGoat
} = require('../controllers/goatController');

// CRUD endpoints
router.get('/', getGoats);          // Get all goats
router.get('/:id', getGoatById);    // Get one goat by ID
router.post('/', createGoat);       // Create new goat
router.put('/:id', updateGoat);     // Update goat
router.delete('/:id', deleteGoat);  // Delete goat

module.exports = router;
