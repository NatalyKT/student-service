# Тестовое задание "Студенты и оценки"
[![Maintainability](https://api.codeclimate.com/v1/badges/e4d24db8e8d70cb04ad2/maintainability)](https://codeclimate.com/github/NatalyKT/student-service/maintainability)

Сервис студентов с использованием Node.js, NATS, Express, Sequelize и Docker

Этот проект представляет собой сервис студентов, взаимодействующий с базой данных PostgreSQL и общающийся с помощью NATS (messaging system). Раз в 15 секунд кто-то из студентов получает оценку по какому-либо предмету. Данный сервис следит за получением оценок и сохраняет их в базе данных. Также предоставляются HTTP-эндпоинты для получения лога оценок и статистики студента.

> При выполнении данного сервиса был использован стек: Node.js, NATS, Express, Sequelize и Docker
> Все записи в формате STRING выполнены на английском языке. Комментарии также написаны на английском, и для простоты просмотра продублированы на русский язык
> Анализ кода производился с помощью сервиса Code Climate (СС)


## Запуск проекта
1. Установите [Docker](https://www.docker.com/get-started) и [Docker Compose](https://docs.docker.com/compose/install/), если они еще не установлены.

2. Создайте файл `.env` в корне проекта и укажите переменные окружения:
   ```env
   DB_HOST=postgres
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   NATS_SERVER=nats://nats:4222
   ```
   Замените `your_db_user`, `your_db_password` и `your_db_name` на соответствующие значения для настройки параметров подключения к вашей базе данных PostgreSQL.

3. Запустите проект:
```docker-compose up```
HTTP-сервер будет доступен по адресу http://localhost:8080.**

   ** Сервис ожидает, что NATS сервер доступен по адресу, указанному в переменной NATS_SERVER в файле `.env`


## Эндпоинты

1. Лог оценок GET `/log` - получить лог оценок с пагинацией и сортировкой.
Пример запроса:
```
curl -X GET "http://localhost:8080/log?page=1&pageSize=10&sortBy=createdAt" -H "Content-Type: application/json"
```

2. Статистика студента GET `/statistic/:personalCode` - получить статистику студента по всем предметам.
Пример запроса:
```
curl -X GET "http://localhost:8080/statistic/your_personal_code" -H "Content-Type: application/json"
```
---


### Возможные улучшения кода при наличии итераций в будущем
1. Внедрение **тестового покрытия** для обеспечения стабильности и корректности работы приложения.
2. Добавление подробного **логгирования** для отслеживания и диагностики событий.
3. Добавление **миграций для обновления базы данных** по мере изменения ее структуры.
5. Включение дополнительных опций **системы обработки ошибок**.
6. **Документация**: более детальное описание кода, более подробные комментарии, документация функций (при необходимости).
7. Добавление дополнительных **HTTP-эндпоинтов** или **функциональности**, в соответствии с требованиями бизнеса.
8. Разделение кода на **модули** для улучшения поддерживаемости и масштабируемости проекта.** 

** Реализовано в последующих двух коммитах