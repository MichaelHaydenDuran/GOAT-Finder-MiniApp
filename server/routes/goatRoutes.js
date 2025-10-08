// routes/goat.routes.js
const express = require('express');
const ctrl = require('../controllers/goatController');

const router = express.Router();
router.get('/', ctrl.list);       // filterable list
router.get('/:id', ctrl.get);     // single
router.post('/', ctrl.create);    // create
router.patch('/:id', ctrl.update);// partial update
router.delete('/:id', ctrl.remove);// delete
module.exports = router;
