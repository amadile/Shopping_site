import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n🔍 Checking Environment Variables:\n');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('SHOP_NAME:', process.env.SHOP_NAME || '❌ NOT SET');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NOT SET');
console.log('\n');

// Also check old EMAIL_ variables
console.log('Old EMAIL_HOST:', process.env.EMAIL_HOST || 'not set');
console.log('Old EMAIL_USER:', process.env.EMAIL_USER || 'not set');
console.log('Old EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'not set');
