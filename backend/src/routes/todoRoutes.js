'use strict';

const { Router } = require('express');
const authenticate = require('../middlewares/authenticate');
const todoController = require('../controllers/todoController');

const router = Router();

router.get('/', authenticate, todoController.getTodos);
router.post('/', authenticate, todoController.createTodo);
router.patch('/:id/complete', authenticate, todoController.toggleTodoComplete);
router.patch('/:id', authenticate, todoController.updateTodo);
router.delete('/:id', authenticate, todoController.deleteTodo);

module.exports = router;
