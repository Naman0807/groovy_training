const pool = require('../config/db');

const Item = {
  getAll() {
    return pool.query('SELECT * FROM items ORDER BY created_at DESC');
  },

  getById(id) {
    return pool.query('SELECT * FROM items WHERE id = $1', [id]);
  },

  create({ name, description }) {
    return pool.query(
      'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
  },

  update(id, { name, description }) {
    return pool.query(
      'UPDATE items SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    );
  },

  delete(id) {
    return pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
  },
};

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(query);
  console.log('Items table initialized');
}

module.exports = { Item, initTable };
