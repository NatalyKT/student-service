const { Student, Grade } = require('./models');
const { sequelize } = require('./models');

// Function to get student information by personal code
// Функция для получения информации о студенте по персональному коду
async function getStudentInfo(personalCode) {
  try {
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

// Function to get student statistics by personal code
// Функция для получения статистики студента по персональному коду
async function getStudentStatistic(personalCode) {
  try {
    const studentInfo = await nats.request('students.v1.get.request', { personalCode });

    if (studentInfo.error) {
      return { error: studentInfo.error };
    }

    const statistic = await Grade.findAll({
      attributes: ['subject', [sequelize.fn('max', sequelize.col('grade')), 'maxGrade'],
        [sequelize.fn('min', sequelize.col('grade')), 'minGrade'],
        [sequelize.fn('avg', sequelize.col('grade')), 'avgGrade'],
        [sequelize.fn('count', sequelize.col('grade')), 'totalGrades']],
      where: { personalCode },
      group: ['subject']
    });

    return { student: studentInfo.data, statistic };
  } catch (error) {
    console.error('Error fetching statistic:', error);
    return { error: 'Internal Server Error' };
  }
}

module.exports = { getStudentInfo, getStudentStatistic };
