const express = require('express');
const { sequelize } = require('./models');
const { getStudentStatistic } = require('./studentService');

const app = express();
app.use(express.json());

// Endpoint to get the log of grades with pagination and sorting
// Эндпоинт для получения лога оценок с пагинацией и сортировкой
app.get('/log', async (req, res) => {
  try {
    // Extracting query parameters for pagination and sorting
    // Извлечение параметров запроса для пагинации и сортировки
    const { page = 1, pageSize = 10, sortBy = 'createdAt' } = req.query;

    // Querying grades with included student information for pagination and sorting
    // Запрос оценок с включенной информацией о студенте для пагинации и сортировки

    const grades = await Grade.findAndCountAll({
      include: [{ model: Student, attributes: ['personalCode', 'name', 'lastName'] }],
      order: [[sortBy, 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    // Responding with paginated and sorted log of grades
    // Ответ с отсортированным и разбитым на страницы логом оценок
    res.json({
      totalItems: grades.count,
      totalPages: Math.ceil(grades.count / pageSize),
      currentPage: parseInt(page, 10),
      items: grades.rows
    });
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
