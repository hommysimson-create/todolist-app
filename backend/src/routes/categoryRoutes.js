'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/authenticate');
const categoryController = require('../controllers/categoryController');

const router = Router();

router.get('/', authenticate, categoryController.getCategories);
router.post('/', authenticate, categoryController.createCategory);
router.delete('/:id', authenticate, categoryController.deleteCategory);

module.exports = router;
