-- AlterTable: добавить колонку position в tasks
ALTER TABLE "tasks" 
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: индекс на position для сортировки
CREATE INDEX "tasks_position_idx" ON "tasks"("position");

