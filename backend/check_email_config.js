import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Checking Email Configuration...');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET (Default: smtp.gmail.com)');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET (Default: 587)');
console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'NOT SET');
