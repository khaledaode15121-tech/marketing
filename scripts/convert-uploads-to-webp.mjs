import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const uploadsDir = path.resolve(process.cwd(), 'server/public/uploads');

if (!fs.existsSync(uploadsDir)) {
  console.log(`Uploads directory not found: ${uploadsDir}`);
  process.exit(0);
}

const files = fs.readdirSync(uploadsDir).filter((file) => {
  const fullPath = path.join(uploadsDir, file);
  return fs.statSync(fullPath).isFile() && !file.endsWith('.webp');
});

if (!files.length) {
  console.log('No non-WebP files found in uploads directory.');
  process.exit(0);
}

for (const file of files) {
  const sourcePath = path.join(uploadsDir, file);
  const parsed = path.parse(file);
  const targetName = `${parsed.name}.webp`;
  const targetPath = path.join(uploadsDir, targetName);

  try {
    await sharp(sourcePath).rotate().webp({ quality: 82, effort: 6 }).toFile(targetPath);
    fs.unlinkSync(sourcePath);
    console.log(`Converted: ${file} -> ${targetName}`);
  } catch (error) {
    console.error(`Failed to convert ${file}:`, error.message);
  }
}

console.log('Finished converting uploads to WebP.');
