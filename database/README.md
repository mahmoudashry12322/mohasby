# قاعدة بيانات منصة محاسبي (Mohasby Database Backup)

هذا المجلد يحتوي على النسخة الاحتياطية الكاملة لقاعدة بيانات منصة محاسبي (PostgreSQL) متضمنة الجداول، الدوال المحاسبية (PL/pgSQL Triggers & Functions)، العلاقات، والبيانات.

## محتويات المجلد:
- `mohasby_db_backup.sql`: ملف التصدير الكامل بصيغة SQL الصالحة للاستيراد المباشر على أي سيرفر PostgreSQL (إصدار 14 فما فوق).

## طريقة الاستيراد (Restore):

### 1. باستخدام سطر الأوامر (psql):
```bash
# إنشاء قاعدة بيانات جديدة (إذا لم تكن موجودة)
createdb -U postgres mohasby_db

# استيراد ملف النسخة الاحتياطية
psql -U postgres -d mohasby_db -f database/mohasby_db_backup.sql
```

### 2. باستخدام DATABASE_URL في ملف `.env`:
```bash
psql "$DATABASE_URL" -f database/mohasby_db_backup.sql
```

### 3. باستخدام Prisma (لتهيئة البنية فقط بدون البيانات):
```bash
npx prisma migrate deploy
npx prisma generate
```
