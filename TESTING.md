# Как протестировать регистрацию

## ✅ Статус: Работает!

Эндпоинт регистрации успешно протестирован и работает на `http://localhost:3001/register`

## Важно: Пересоберите контейнер после изменений

```bash
docker-compose down
docker-compose up --build -d
```

## Способы тестирования

### 1. PowerShell (Invoke-WebRequest)

**Успешная регистрация:**
```powershell
$body = @{
    login = "testuser"
    password = "password123"
    email = "test@example.com"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/register" -Method POST -Body $body -ContentType "application/json"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**Обработка ошибок:**
```powershell
try {
    $body = @{login="testuser"; password="pass"; email="test@example.com"} | ConvertTo-Json
    Invoke-WebRequest -Uri "http://localhost:3001/register" -Method POST -Body $body -ContentType "application/json"
} catch {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    $responseBody | ConvertFrom-Json | ConvertTo-Json
}
```

### 2. curl (если установлен)

```bash
curl -X POST http://localhost:3001/register ^
  -H "Content-Type: application/json" ^
  -d "{\"login\":\"testuser\",\"password\":\"password123\",\"email\":\"test@example.com\"}"
```

### 3. Postman / Insomnia / Thunder Client

- **URL:** `http://localhost:3001/register`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "login": "testuser",
  "password": "password123",
  "email": "test@example.com"
}
```

### 4. Браузер (только для GET запросов)

Откройте: `http://localhost:3001/health` - для проверки подключения к БД

## Тестовые сценарии

### ✅ Успешная регистрация
```json
{
  "login": "newuser",
  "password": "password123",
  "email": "newuser@example.com"
}
```

### ❌ Ошибка валидации - отсутствует поле
```json
{
  "login": "user",
  "password": "pass123"
}
```

### ❌ Ошибка валидации - неверный email
```json
{
  "login": "user",
  "password": "password123",
  "email": "invalid-email"
}
```

### ❌ Ошибка валидации - короткий пароль
```json
{
  "login": "user",
  "password": "12345",
  "email": "user@example.com"
}
```

### ❌ Ошибка - пользователь уже существует
```json
{
  "login": "testuser",
  "password": "password123",
  "email": "another@example.com"
}
```

## Ожидаемые ответы

**Успех (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "login": "testuser",
    "email": "test@example.com",
    "created_at": "2025-11-07T13:51:24.794Z"
  }
}
```

**Ошибка валидации (400):**
```json
{
  "status": "error",
  "message": "All fields (login, password, email) are required"
}
```

**Ошибка дубликата (409):**
```json
{
  "status": "error",
  "message": "User with this login already exists"
}
```

