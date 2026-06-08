require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { initTable } = require('./models/student');
const studentsRouter = require('./routes/students');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/students', studentsRouter);

app.use(errorHandler);

initTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
