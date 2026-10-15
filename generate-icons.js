import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'src/assets/logo-fixora.png');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(logoPath)) {
  console.error('❌ No se encontró src/assets/logo-fixora.png');
  process.exit(1);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sizes = [
  { size: 512, file: 'icon-512.png' },
  { size: 192, file: 'icon-192.png' },
  { size: 32, file: 'favicon.png' },
];

for (const { size, file } of sizes) {
  const output = path.join(publicDir, file);
  execSync(`sips -z ${size} ${size} "${logoPath}" --out "${output}"`, {
    stdio: 'inherit',
  });
}

console.log('✅ Iconos generados en /public/ desde logo-fixora.png');
