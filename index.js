const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const NATS = require('nats');

const app = express();
app.use(express.json());

// Connect to Postgres database
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  username: process.env.DB_USERNAME || 'your_db_user',
  password: process.env.DB_PASSWORD || 'your_db_password',
  database: process.env.DB_NAME || 'your_db_name'
});

// Define Student model
const Student = sequelize.define('Student', {
  personalCode: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Define Grade model
const Grade = sequelize.define('Grade', {
  personalCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grade: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Connect to NATS server
const nats = NATS.connect({
  servers: [process.env.NATS_SERVER || 'nats://nats:4222']
});

// Wait for the database to be ready
sequelize.authenticate()
  .then(() => {
    console.log('Connected to the database');
    // Continue with other setup, e.g., starting the HTTP server
    startServer();
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

function startServer() {
  // Subscribe to the "students.v1.graded" topic
  nats.subscribe('students.v1.graded', (msg) => {
    try {
      const { data } = JSON.parse(msg);
      Grade.create(data);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Subscribe to the "students.v1.get.request" topic
  nats.subscribe('students.v1.get.request', async (msg, replyTo) => {
    try {
      const requestData = JSON.parse(msg);

      if (!isValidGetRequest(requestData)) {
        // Ошибка: неверный формат запроса
        nats.publish(replyTo, JSON.stringify({
          error: {
            code: 'ERR_WRONG_FORMAT',
            message: 'Invalid JSON format in the request'
          }
        }));
        return;
      }

      const { personalCode } = requestData;

      const student = await getStudentInfo(personalCode);

      if (!student) {
        // Ошибка: студент не найден
        nats.publish(replyTo, JSON.stringify({
          error: {
            code: 'ERR_ENTITY_NOT_FOUND',
            message: 'Student with the specified personal code not found'
          }
        }));
        return;
      }

      // Успешный ответ
      nats.publish(replyTo, JSON.stringify({
        data: {
          personalCode: student.personalCode,
          name: student.name,
          lastName: student.lastName
        }
      }));
    } catch (error) {
      // Ошибка валидации данных
      let errorCode;
      let errorMessage;

      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        errorCode = 'ERR_WRONG_FORMAT';
        errorMessage = 'Request is not in JSON format';
      } else if (error.name === 'SequelizeValidationError') {
        errorCode = 'ERR_VALIDATION_FAIL';
        errorMessage = 'Validation failed. Request does not contain the required information.';
      } else {
        // Предположим, что это ошибка от Sequelize, связанная с отсутствием студента
        errorCode = 'ERR_ENTITY_NOT_FOUND';
        errorMessage = 'Student with the specified personal code not found';
      }

      nats.publish(replyTo, JSON.stringify({
        error: {
          code: errorCode,
          message: errorMessage
        }
      }));
    }
  });

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

  // Эндпоинт для получения статистики студента по предметам
  app.get('/statistic/:personalCode', async (req, res) => {
    try {
      const { personalCode } = req.params;

      // Запрос информации о студенте через NATS
      const studentInfo = await nats.request('students.v1.get.request', { personalCode });

      // Проверка наличия ошибок в ответе от сервиса студентов
      if (studentInfo.error) {
        return res.status(404).json({ error: studentInfo.error });
      }

      // Успешный запрос
      const statistic = await Grade.findAll({
        attributes: ['subject', [Sequelize.fn('max', Sequelize.col('grade')), 'maxGrade'],
                      [Sequelize.fn('min', Sequelize.col('grade')), 'minGrade'],
                      [Sequelize.fn('avg', Sequelize.col('grade')), 'avgGrade'],
                      [Sequelize.fn('count', Sequelize.col('grade')), 'totalGrades']],
        where: { personalCode },
        group: ['subject']
      });

      res.json({ student: studentInfo.data, statistic });
    } catch (error) {
      console.error('Error fetching statistic:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Start HTTP server
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Функция проверки валидности формата запроса
function isValidGetRequest(requestData) {
  return requestData && typeof requestData === 'object' && 'personalCode' in requestData;
}

// Функция получения информации о студенте
async function getStudentInfo(personalCode) {
  try {
    // Логика получения информации о студенте из базы данных
    const student = await Student.findOne({
      where: { personalCode }
    });

    if (!student) {
      return null;
    }

    return {
      personalCode: student.personalCode,
      name: student.name,
      lastName: student.lastName
    };
  } catch (error) {
    console.error('Error retrieving student information:', error);
    return null;
  }
}

// Вызываем функцию startServer для запуска сервера
startServer();