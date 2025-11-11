# Тестовый скрипт для проверки регистрации

$baseUrl = "http://localhost:3001"

Write-Host "=== Тест регистрации ===" -ForegroundColor Green

# Тест 1: Успешная регистрация
Write-Host "`n1. Тест успешной регистрации:" -ForegroundColor Yellow
$body = @{
    login = "testuser"
    password = "password123"
    email = "test@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Статус: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Ответ:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Тело ответа: $responseBody" -ForegroundColor Red
    }
}

# Тест 2: Регистрация с существующим логином
Write-Host "`n2. Тест регистрации с существующим логином:" -ForegroundColor Yellow
$body2 = @{
    login = "testuser"
    password = "password123"
    email = "another@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $body2 -ContentType "application/json"
} catch {
    Write-Host "Ожидаемая ошибка: $($_.Exception.Message)" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Ответ сервера:" -ForegroundColor Cyan
        $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}

# Тест 3: Валидация - отсутствует email
Write-Host "`n3. Тест валидации (отсутствует email):" -ForegroundColor Yellow
$body3 = @{
    login = "testuser2"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $body3 -ContentType "application/json"
} catch {
    Write-Host "Ожидаемая ошибка валидации" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Ответ сервера:" -ForegroundColor Cyan
        $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}

# Тест 4: Неверный формат email
Write-Host "`n4. Тест валидации (неверный формат email):" -ForegroundColor Yellow
$body4 = @{
    login = "testuser3"
    password = "password123"
    email = "invalid-email"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $body4 -ContentType "application/json"
} catch {
    Write-Host "Ожидаемая ошибка валидации" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Ответ сервера:" -ForegroundColor Cyan
        $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}

Write-Host "`n=== Тестирование завершено ===" -ForegroundColor Green

