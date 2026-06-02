-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN "ruc" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_ruc_key" ON "Cliente"("ruc");
