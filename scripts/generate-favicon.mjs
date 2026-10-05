import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const svg = fs.readFileSync('public/favicon.svg');
  await sharp(svg)
    .resize(64, 64)
    .png()
    .toFile('public/favicon.png');
  
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
  
  console.log('Favicon PNG and ICO generated successfully!');
}

run().catch(console.error);
