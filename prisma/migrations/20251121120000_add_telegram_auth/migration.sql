-- AlterTable: добавить telegram_id в users
ALTER TABLE "users" ADD COLUMN "telegram_id" BIGINT;

-- CreateIndex: уникальный индекс на telegram_id
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex: индекс на telegram_id для быстрого поиска
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");

-- CreateTable: создать таблицу telegram_auth_codes
CREATE TABLE "telegram_auth_codes" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_auth_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: индекс на telegram_id для быстрого поиска
CREATE INDEX "telegram_auth_codes_telegram_id_idx" ON "telegram_auth_codes"("telegram_id");

-- CreateIndex: индекс на code для быстрого поиска
CREATE INDEX "telegram_auth_codes_code_idx" ON "telegram_auth_codes"("code");

-- CreateIndex: индекс на expires_at для очистки истекших кодов
CREATE INDEX "telegram_auth_codes_expires_at_idx" ON "telegram_auth_codes"("expires_at");



