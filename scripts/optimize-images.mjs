import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const IMAGES_DIR = path.resolve('./public/images');

async function optimize() {
  const files = ['hero-desk.jpg', 'storage.jpg', 'receipts.jpg', 'ledger-texture.jpg'];

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    if (!fs.existsSync(filePath)) continue;

    const baseName = path.parse(file).name;
    const webpPath = path.join(IMAGES_DIR, `${baseName}.webp`);
    const avifPath = path.join(IMAGES_DIR, `${baseName}.avif`);

    console.log(`Optimizing ${file}...`);

    await sharp(filePath)
      .webp({ quality: 85 })
      .toFile(webpPath);

    await sharp(filePath)
      .avif({ quality: 80 })
      .toFile(avifPath);

    console.log(`Generated WebP & AVIF for ${file}`);
  }

  console.log('All images optimized successfully!');
}

optimize().catch(console.error);
