-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "aceptadaSunat" BOOLEAN,
ADD COLUMN     "enlacePdf" TEXT,
ADD COLUMN     "numeroComprobante" INTEGER,
ADD COLUMN     "serieComprobante" TEXT,
ADD COLUMN     "tipoComprobante" TEXT;
