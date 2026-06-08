const { Item } = require('../models/item');

async function getAll(req, res, next) {
  try {
    const result = await Item.getAll();
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await Item.getById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await Item.create({ name, description });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await Item.update(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const result = await Item.delete(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, delete: deleteItem };
