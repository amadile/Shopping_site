import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n🔍 Testing SMTP Configuration...\n');

// Check if SMTP is configured
const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

if (!isConfigured) {
    console.log('❌ SMTP NOT CONFIGURED');
    console.log('\nMissing environment variables:');
    if (!process.env.SMTP_HOST) console.log('  - SMTP_HOST');
    if (!process.env.SMTP_PORT) console.log('  - SMTP_PORT');
    if (!process.env.SMTP_USER) console.log('  - SMTP_USER');
    if (!process.env.SMTP_PASS) console.log('  - SMTP_PASS');
    console.log('\n📖 See PRODUCTION_EMAIL_SETUP.md for setup instructions\n');
    process.exit(1);
}

console.log('✅ SMTP Configuration Found:');
console.log(`   Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
console.log(`   Port: ${process.env.SMTP_PORT || '587'}`);
console.log(`   User: ${process.env.SMTP_USER}`);
console.log(`   Pass: ${'*'.repeat(16)} (hidden)`);
console.log(`   Shop: ${process.env.SHOP_NAME || 'Shopping Site'}\n`);

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

console.log('🔌 Testing SMTP Connection...\n');

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ SMTP Connection FAILED\n');
        console.log('Error:', error.message);
        console.log('\n💡 Common Issues:');
        console.log('   - Wrong username or password');
        console.log('   - For Gmail: Need App Password (not regular password)');
        console.log('   - For Gmail: 2-Step Verification must be enabled');
        console.log('   - Firewall blocking port 587');
        console.log('   - Wrong SMTP host or port\n');
        console.log('📖 See PRODUCTION_EMAIL_SETUP.md for troubleshooting\n');
        process.exit(1);
    } else {
        console.log('✅ SMTP Connection SUCCESSFUL!\n');
        console.log('📧 Sending Test Email...\n');

        // Send test email
        const mailOptions = {
            from: `"${process.env.SHOP_NAME || 'Shopping Site'}" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to yourself
            subject: '✅ SMTP Test - Shopping Site Backend',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ SMTP Test Successful!</h1>
            </div>
            <div class="content">
              <h2>Congratulations!</h2>
              <p>Your SMTP email configuration is working correctly.</p>
              
              <div class="success">
                <strong>✅ What This Means:</strong>
                <ul>
                  <li>Password reset emails will be sent</li>
                  <li>Email verification will work</li>
                  <li>Order confirmations will be delivered</li>
                  <li>All email notifications are operational</li>
                </ul>
              </div>

              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</li>
                <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</li>
                <li><strong>From Email:</strong> ${process.env.SMTP_USER}</li>
                <li><strong>Shop Name:</strong> ${process.env.SHOP_NAME || 'Shopping Site'}</li>
              </ul>

              <p>You can now use all email features in your application!</p>
              
              <p>Best regards,<br>Shopping Site Backend</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('❌ Test Email FAILED\n');
                console.log('Error:', error.message);
                process.exit(1);
            } else {
                console.log('✅ Test Email SENT Successfully!\n');
                console.log(`   Message ID: ${info.messageId}`);
                console.log(`   To: ${process.env.SMTP_USER}\n`);
                console.log('📬 Check your email inbox for the test message\n');
                console.log('🎉 SMTP is fully configured and working!\n');
                process.exit(0);
            }
        });
    }
});
