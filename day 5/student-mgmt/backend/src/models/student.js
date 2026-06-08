const pool = require('../config/db');

const Student = {
  getAll() {
    return pool.query('SELECT * FROM students ORDER BY created_at DESC');
  },

  getById(id) {
    return pool.query('SELECT * FROM students WHERE id = $1', [id]);
  },

  create({ name, email, roll_number, class: cls, age, phone, address }) {
    return pool.query(
      'INSERT INTO students (name, email, roll_number, class, age, phone, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, roll_number, cls, age, phone, address]
    );
  },

  update(id, { name, email, roll_number, class: cls, age, phone, address }) {
    return pool.query(
      'UPDATE students SET name = $1, email = $2, roll_number = $3, class = $4, age = $5, phone = $6, address = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
      [name, email, roll_number, cls, age, phone, address, id]
    );
  },

  delete(id) {
    return pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
  },
};

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      roll_number VARCHAR(50) NOT NULL UNIQUE,
      class VARCHAR(50),
      age INTEGER,
      phone VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(query);
  console.log('Students table initialized');
}

module.exports = { Student, initTable };
