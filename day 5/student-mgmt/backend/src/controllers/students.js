const { Student } = require('../models/student');

async function getAll(req, res, next) {
  try {
    const result = await Student.getAll();
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await Student.getById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, email, roll_number } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!roll_number) {
      return res.status(400).json({ error: 'Roll number is required' });
    }
    const result = await Student.create(req.body);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await Student.update(req.params.id, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const result = await Student.delete(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, delete: deleteItem };
