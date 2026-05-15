'use strict';

const categoryService = require('../services/categoryService');
const { isValidName, isValidUUID } = require('../utils/validate');

async function getCategories(req, res, next) {
  try {
    const categories = await categoryService.getCategories(req.user.userId);
    return res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;
    if (!isValidName(name)) {
      return res.status(400).json({ status: 400, message: '카테고리 이름은 1~100자여야 합니다.' });
    }
    const category = await categoryService.createCategory(req.user.userId, name);
    return res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ status: 400, message: '유효하지 않은 카테고리 ID입니다.' });
    }
    await categoryService.deleteCategory(req.user.userId, id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, deleteCategory };
