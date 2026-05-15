'use strict';

const todoService = require('../services/todoService');
const { isValidTitle, isValidUUID, isValidDate } = require('../utils/validate');

async function getTodos(req, res, next) {
  try {
    const { categoryId, startDate, endDate, isCompleted } = req.query;
    const filters = {};

    if (categoryId !== undefined) {
      if (!isValidUUID(categoryId)) {
        return res.status(400).json({ status: 400, message: '유효하지 않은 categoryId입니다.' });
      }
      filters.categoryId = categoryId;
    }

    if (startDate !== undefined) {
      if (!isValidDate(startDate)) {
        return res.status(400).json({ status: 400, message: 'startDate는 YYYY-MM-DD 형식이어야 합니다.' });
      }
      filters.startDate = startDate;
    }

    if (endDate !== undefined) {
      if (!isValidDate(endDate)) {
        return res.status(400).json({ status: 400, message: 'endDate는 YYYY-MM-DD 형식이어야 합니다.' });
      }
      filters.endDate = endDate;
    }

    if (isCompleted !== undefined) {
      if (isCompleted !== 'true' && isCompleted !== 'false') {
        return res.status(400).json({ status: 400, message: 'isCompleted는 true 또는 false여야 합니다.' });
      }
      filters.isCompleted = isCompleted === 'true';
    }

    const todos = await todoService.getTodos(req.user.userId, filters);
    return res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
}

async function createTodo(req, res, next) {
  try {
    const { title, categoryId, description, dueDate } = req.body;

    if (!isValidTitle(title)) {
      return res.status(400).json({ status: 400, message: '제목은 1~255자여야 합니다.' });
    }

    if (!isValidUUID(categoryId)) {
      return res.status(400).json({ status: 400, message: '유효하지 않은 categoryId입니다.' });
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ status: 400, message: 'description은 문자열이어야 합니다.' });
    }

    if (dueDate !== undefined && dueDate !== null && !isValidDate(dueDate)) {
      return res.status(400).json({ status: 400, message: 'dueDate는 YYYY-MM-DD 형식이어야 합니다.' });
    }

    const todo = await todoService.createTodo(req.user.userId, { title, categoryId, description, dueDate });
    return res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

async function updateTodo(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ status: 400, message: '유효하지 않은 할일 ID입니다.' });
    }

    const { title, description, dueDate, categoryId } = req.body;
    const fields = {};

    if (title !== undefined) {
      if (!isValidTitle(title)) {
        return res.status(400).json({ status: 400, message: '제목은 1~255자여야 합니다.' });
      }
      fields.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      fields.description = description ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'dueDate')) {
      if (dueDate !== null && dueDate !== undefined && !isValidDate(dueDate)) {
        return res.status(400).json({ status: 400, message: 'dueDate는 YYYY-MM-DD 형식이어야 합니다.' });
      }
      fields.dueDate = dueDate ?? null;
    }

    if (categoryId !== undefined) {
      if (!isValidUUID(categoryId)) {
        return res.status(400).json({ status: 400, message: '유효하지 않은 categoryId입니다.' });
      }
      fields.categoryId = categoryId;
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ status: 400, message: '수정할 필드가 없습니다.' });
    }

    const todo = await todoService.updateTodo(req.user.userId, id, fields);
    return res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function deleteTodo(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ status: 400, message: '유효하지 않은 할일 ID입니다.' });
    }
    await todoService.deleteTodo(req.user.userId, id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function toggleTodoComplete(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ status: 400, message: '유효하지 않은 할일 ID입니다.' });
    }
    const todo = await todoService.toggleTodoComplete(req.user.userId, id);
    return res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodos, createTodo, updateTodo, deleteTodo, toggleTodoComplete };
