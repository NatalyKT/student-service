const { Sequelize, DataTypes } = require('sequelize');

// Database connection configuration
// Конфигурация подключения к базе данных
const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'postgres',
    username: process.env.DB_USERNAME || 'your_db_user',
    password: process.env.DB_PASSWORD || 'your_db_password',
    database: process.env.DB_NAME || 'your_db_name'
});

// Student model definition
// Определение модели студента
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

// Grade model definition
// Определение модели оценки
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

// Add a one-to-many relationship between Student and Grade
// One student can have many grades
// Добавляем связь "один ко многим" между Student и Grade
// Один студент может иметь много оценок
Student.hasMany(Grade, { foreignKey: 'personalCode' });
Grade.belongsTo(Student, { foreignKey: 'personalCode' });

module.exports = { sequelize, Student, Grade };