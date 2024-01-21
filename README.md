# Сервис студентов с использованием Node.js, NATS, Express, Sequelize и Docker

Этот проект представляет собой простой сервис студентов, взаимодействующий с базой данных PostgreSQL и общающийся с помощью NATS (messaging system). Студенты отправляют оценки по предметам через сервер NATS, и сервис сохраняет их в базе данных. Также предоставляются HTTP-эндпоинты для получения лога оценок и статистики студента.

## Запуск проекта

1. Установите [Docker](https://www.docker.com/get-started) и [Docker Compose](https://docs.docker.com/compose/install/), если они еще не установлены.

2. Создайте файл `.env` в корне проекта и укажите переменные окружения:

   ```env
   DB_HOST=postgres
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   NATS_SERVER=nats://nats:4222

   Замените your_db_user, your_db_password и your_db_name на ваши значения.

3. Запустите проект:

```docker-compose up

HTTP-сервер будет доступен по адресу http://localhost:8080.
