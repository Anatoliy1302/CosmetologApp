# Развёртывание API на VPS

Приложение синхронизирует записи с вашим VPS через REST API.

## 1. Docker (рекомендуется)

На VPS должны быть установлены Docker и Docker Compose.

```bash
cd /opt/cosmetolog
cp .env.docker.example .env
nano .env   # задайте API_KEY
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:3847/health
```

Перезапуск после обновления кода:

```bash
git pull
docker compose up -d --build
```

Данные SQLite хранятся в Docker volume `cosmetolog-data` (путь `/app/data` в контейнере).

На VPS проект обычно лежит в `/opt/cosmetolog-api`. Там используйте `server/docker-compose.yml`:

```bash
cd /opt/cosmetolog-api
docker compose up -d --build
```

Автодеплой с Windows (пароль передаётся аргументом, не сохраняется в файлах):

```bash
pip install paramiko
python server/deploy_docker.py <ssh_password>
```

## 2. Установка без Docker (Ubuntu/Debian)

```bash
# На VPS
cd /opt
git clone <ваш-репозиторий> cosmetolog
cd cosmetolog/server
cp .env.example .env
nano .env
```

В `.env` укажите:
```
PORT=3847
API_KEY=ваш-длинный-секретный-ключ
HOST=0.0.0.0
```

```bash
npm install
npm start
```

## 3. Автозапуск через systemd

```bash
sudo nano /etc/systemd/system/cosmetolog-api.service
```

```ini
[Unit]
Description=Cosmetolog API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/cosmetolog/server
ExecStart=/usr/bin/node index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cosmetolog-api
sudo systemctl start cosmetolog-api
```

## 4. Firewall

```bash
sudo ufw allow 3847/tcp
```

Рекомендуется ограничить доступ только с вашего IP или через VPN.

## 5. Настройка приложения

Скопируйте `.env.example` в `.env` в корне проекта:

```
EXPO_PUBLIC_API_URL=http://ВАШ_IP_VPS:3847
EXPO_PUBLIC_API_KEY=тот-же-ключ-что-в-server/.env
```

Пересоберите приложение:
```bash
eas build --profile adhoc --platform ios
```

## 6. Сборка для iPhone по UDID

1. Зарегистрируйте UDID устройства в Apple Developer / EAS
2. Соберите ad-hoc билд:
   ```bash
   eas build --profile adhoc --platform ios
   ```
3. Установите `.ipa` на iPhone (через ссылку EAS или Apple Configurator)

Профиль `adhoc` в `eas.json` настроен для установки на конкретные устройства по UDID.

## API endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /health | Проверка доступности |
| GET | /api/appointments | Все записи |
| POST | /api/appointments/sync | Синхронизация |
| PUT | /api/appointments/:id | Обновить запись |
| DELETE | /api/appointments/:id | Удалить запись |
| GET | /api/clients | Карточки клиентов |
| PUT | /api/clients/:phone | Сохранить карточку |
| POST | /api/migrate | Одноразовая миграция с телефона |

Заголовок авторизации: `X-API-Key: ваш-ключ`
