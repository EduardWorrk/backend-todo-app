-- Create categories table
CREATE TABLE "categories" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(120) NOT NULL,
    "color" VARCHAR(32),
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure category names are unique
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- Add foreign key to users (creator)
ALTER TABLE "categories"
ADD CONSTRAINT "categories_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add category reference to tasks
ALTER TABLE "tasks"
ADD COLUMN "category_id" INTEGER;

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "tasks_category_id_idx" ON "tasks"("category_id");




