-- Ручное применение миграций для полей priority и task_time
-- Выполните этот SQL скрипт в вашей базе данных, если автоматические миграции не работают

-- Проверка и добавление поля priority (если не существует)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE "tasks" ADD COLUMN "priority" VARCHAR(16);
        RAISE NOTICE 'Поле priority добавлено';
    ELSE
        RAISE NOTICE 'Поле priority уже существует';
    END IF;
END $$;

-- Проверка и добавление поля task_time (если не существует)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'task_time'
    ) THEN
        ALTER TABLE "tasks" ADD COLUMN "task_time" VARCHAR(8);
        RAISE NOTICE 'Поле task_time добавлено';
    ELSE
        RAISE NOTICE 'Поле task_time уже существует';
    END IF;
END $$;

-- Проверка результата
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'tasks' 
AND column_name IN ('priority', 'task_time')
ORDER BY column_name;

