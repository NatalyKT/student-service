const express = require('express');
const { sequelize } = require('./models');
const { getStudentStatistic } = require('./studentService');

const app = express();
app.use(express.json());

// Endpoint to get the log of grades with pagination and sorting
// Эндпоинт для получения лога оценок с пагинацией и сортировкой
app.get('/log', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = 'createdAt' } = req.query;

    const grades = await Grade.findAll({
      order: [[sortBy, 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    res.json(grades);
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get student statistics for a specific personal code
// Эндпоинт для получения статистики студента по конкретному персональному коду
app.get('/statistic/:personalCode', async (req, res) => {
  try {
    const { personalCode } = req.params;
    const statistic = await getStudentStatistic(personalCode);

    if (statistic.error) {
      return res.status(500).json({ error: statistic.error });
    }

    res.json(statistic);
  } catch (error) {
    console.error('Error fetching statistic:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to start the HTTP server 
// Запуск HTTP-сервера
const startServer = () => {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Connecting to the database
  // Подключение к базе данных
  sequelize.authenticate()
    .then(() => {
      console.log('Connected to the database');
    })
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
    });
};

module.exports = { startServer };
