const NATS = require('nats');
const { Grade } = require('./models');

// Connect to NATS server / Подключение к серверу NATS
const nats = NATS.connect({
  servers: [process.env.NATS_SERVER || 'nats://nats:4222']
});

// Subscribe to the "students.v1.graded" topic
// Подписка на топик 'students.v1.graded'
nats.subscribe('students.v1.graded', (msg) => {
  try {
    const { data } = JSON.parse(msg);
    Grade.create(data);
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

// Subscribe to the "students.v1.get.request" topic
// Подписка на топик 'students.v1.get.request'
nats.subscribe('students.v1.get.request', async (msg, replyTo) => {
  try {
    const requestData = JSON.parse(msg);

    if (!isValidGetRequest(requestData)) {
      // Error: Invalid request format / Ошибка: неверный формат запроса
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
      // Error: student not found / Ошибка: студент не найден
      nats.publish(replyTo, JSON.stringify({
        error: {
          code: 'ERR_ENTITY_NOT_FOUND',
          message: 'Student with the specified personal code not found'
        }
      }));
      return;
    }

    // Successful response / Успешный ответ
    nats.publish(replyTo, JSON.stringify({
      data: {
        personalCode: student.personalCode,
        name: student.name,
        lastName: student.lastName
      }
    }));
  } catch (error) {
    // Data validation error / Ошибка валидации данных
    let errorCode;
    let errorMessage;

    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      errorCode = 'ERR_WRONG_FORMAT';
      errorMessage = 'Request is not in JSON format';
    } else if (error.name === 'SequelizeValidationError') {
      errorCode = 'ERR_VALIDATION_FAIL';
      errorMessage = 'Validation failed. Request does not contain the required information.';
    } else {
      // Let's assume that this is an error from Sequelize due to the student not being in the db
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
