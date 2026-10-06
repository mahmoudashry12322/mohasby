-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'الشركة الافتراضية',
    "taxNumber" TEXT,
    "commercialReg" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "accountClass" TEXT NOT NULL,
    "mainGroup" TEXT,
    "subGroup" TEXT,
    "nature" TEXT NOT NULL,
    "statementType" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parentCode" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_companyId_parentCode_idx" ON "accounts"("companyId", "parentCode");

-- CreateIndex
CREATE INDEX "accounts_companyId_accountClass_idx" ON "accounts"("companyId", "accountClass");

-- CreateIndex
CREATE INDEX "accounts_companyId_level_idx" ON "accounts"("companyId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_companyId_code_key" ON "accounts"("companyId", "code");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_parentCode_fkey" FOREIGN KEY ("companyId", "parentCode") REFERENCES "accounts"("companyId", "code") ON DELETE RESTRICT ON UPDATE CASCADE;

