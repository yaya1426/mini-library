-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('MEMBER', 'LIBRARIAN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isbn" TEXT,
    "cover_image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "book_id" UUID NOT NULL,
    "barcode" TEXT NOT NULL,
    "withdrawn_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "copy_id" UUID NOT NULL,
    "borrowed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE NOT NULL,
    "returned_at" TIMESTAMPTZ(6),
    "returned_by_id" UUID,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loan_id" UUID NOT NULL,
    "days_late" INTEGER NOT NULL,
    "daily_rate_egp" INTEGER NOT NULL,
    "amount_egp" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),
    "received_by_id" UUID,

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "books_title_trgm_idx" ON "books" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "books_author_trgm_idx" ON "books" USING GIN ("author" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "copies_barcode_key" ON "copies"("barcode");

-- CreateIndex
CREATE INDEX "copies_book_id_idx" ON "copies"("book_id");

-- CreateIndex
CREATE UNIQUE INDEX "copies_id_book_id_key" ON "copies"("id", "book_id");

-- CreateIndex
CREATE UNIQUE INDEX "fines_loan_id_key" ON "fines"("loan_id");

-- AddForeignKey
ALTER TABLE "copies" ADD CONSTRAINT "copies_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_copy_id_book_id_fkey" FOREIGN KEY ("copy_id", "book_id") REFERENCES "copies"("id", "book_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_by_id_fkey" FOREIGN KEY ("returned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Partial Unique Indexes (P005, P006-Q1, database.md)
CREATE UNIQUE INDEX "loans_one_active_per_copy_idx" ON "loans" ("copy_id") WHERE "returned_at" IS NULL;
CREATE UNIQUE INDEX "loans_one_active_per_book_member_idx" ON "loans" ("member_id", "book_id") WHERE "returned_at" IS NULL;

-- CHECK Constraints on loans (P008-Q1, database.md)
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_after_borrowed_chk" CHECK ("returned_at" IS NULL OR "returned_at" >= "borrowed_at");
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_has_librarian_chk" CHECK (("returned_at" IS NULL) = ("returned_by_id" IS NULL));

-- CHECK Constraints on fines (P009, P010-Q1, database.md)
ALTER TABLE "fines" ADD CONSTRAINT "fines_positive_values_chk" CHECK ("days_late" > 0 AND "daily_rate_egp" > 0);
ALTER TABLE "fines" ADD CONSTRAINT "fines_amount_math_chk" CHECK ("amount_egp" = "days_late" * "daily_rate_egp");
ALTER TABLE "fines" ADD CONSTRAINT "fines_paid_has_librarian_chk" CHECK (("paid_at" IS NULL) = ("received_by_id" IS NULL));

-- Performance Partial Indexes (P006, P007, P010-Q2, P011, database.md)
CREATE INDEX "loans_active_by_member_idx" ON "loans" ("member_id") WHERE "returned_at" IS NULL;
CREATE INDEX "loans_active_by_due_date_idx" ON "loans" ("due_date") WHERE "returned_at" IS NULL;
CREATE INDEX "fines_unpaid_by_loan_idx" ON "fines" ("loan_id") WHERE "paid_at" IS NULL;
