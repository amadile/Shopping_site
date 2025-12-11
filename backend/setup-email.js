import dotenv from 'dotenv';
import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

dotenv.config({ path: envPath });

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║        📧  Email Configuration Setup Wizard  📧           ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function questionPassword(query) {
    return new Promise(resolve => {
        const stdin = process.stdin;
        const stdout = process.stdout;

        stdout.write(query);
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');

        let password = '';

        stdin.on('data', function onData(char) {
            char = char.toString('utf8');

            switch (char) {
                case '\n':
                case '\r':
                case '\u0004':
                    stdin.setRawMode(false);
                    stdin.pause();
                    stdin.removeListener('data', onData);
                    stdout.write('\n');
                    resolve(password);
                    break;
                case '\u0003':
                    process.exit();
                    break;
                case '\u007f':
                case '\b':
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        stdout.clearLine();
                        stdout.cursorTo(0);
                        stdout.write(query + '*'.repeat(password.length));
                    }
                    break;
                default:
                    password += char;
                    stdout.write('*');
                    break;
            }
        });
    });
}

async function setup() {
    try {
        const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

        if (isConfigured) {
            console.log('⚠️  SMTP is already configured!\n');
            console.log(`   Current Email: ${process.env.SMTP_USER}`);
            console.log(`   Current Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}\n`);

            const reconfigure = await question('Do you want to reconfigure? (yes/no): ');
            if (reconfigure.toLowerCase() !== 'yes' && reconfigure.toLowerCase() !== 'y') {
                console.log('\n✅ Keeping existing configuration.\n');
                rl.close();
                return;
            }
            console.log('');
        }

        console.log('📮 Choose your email provider:\n');
        console.log('   1. Brevo (RECOMMENDED - 300 emails/day FREE, no credit card!)');
        console.log('   2. Mailtrap (Testing only - view emails in browser)');
        console.log('   3. SendGrid (100 emails/day free)');
        console.log('   4. Gmail (Requires App Password)');
        console.log('   5. Mailgun (5,000 emails/month free)');
        console.log('   6. Other (Custom SMTP)\n');

        const providerChoice = await question('Enter choice (1-6) [1]: ') || '1';
        console.log('');

        let smtpHost, smtpPort, smtpUser, smtpPass, shopName;

        switch (providerChoice) {
            case '1': // Brevo
                console.log('💡 Brevo Setup:');
                console.log('   1. Sign up: https://app.brevo.com/account/register');
                console.log('   2. Go to: SMTP & API → SMTP');
                console.log('   3. Copy your SMTP credentials\n');
                smtpHost = 'smtp-relay.brevo.com';
                smtpPort = '587';
                smtpUser = await question('Brevo SMTP Login: ');
                smtpPass = await questionPassword('Brevo SMTP Key (hidden): ');
                shopName = await question('Shop Name [Shopping Site]: ') || 'Shopping Site';
                break;

            case '2': // Mailtrap
                console.log('💡 Mailtrap Setup (Testing Only):');
                console.log('   1. Sign up: https://mailtrap.io/');
                console.log('   2. Get credentials from Email Testing → Inboxes\n');
                smtpHost = 'smtp.mailtrap.io';
                smtpPort = '587';
                smtpUser = await question('Mailtrap Username: ');
                smtpPass = await questionPassword('Mailtrap Password (hidden): ');
                shopName = await question('Shop Name [Shopping Site]: ') || 'Shopping Site';
                break;

            case '3': // SendGrid
                console.log('💡 SendGrid Setup:');
                console.log('   1. Sign up: https://signup.sendgrid.com/');
                console.log('   2. Create API Key in Settings → API Keys\n');
                smtpHost = 'smtp.sendgrid.net';
                smtpPort = '587';
                smtpUser = 'apikey';
                smtpPass = await questionPassword('SendGrid API Key (hidden): ');
                shopName = await question('Shop Name [Shopping Site]: ') || 'Shopping Site';
                break;

            case '4': // Gmail
                console.log('💡 Gmail Setup:');
                console.log('   1. Go to: https://myaccount.google.com/apppasswords');
                console.log('   2. Enable 2-Step Verification');
                console.log('   3. Create App Password for "Mail"\n');
                smtpHost = 'smtp.gmail.com';
                smtpPort = '587';
                smtpUser = await question('Gmail Address: ');
                smtpPass = await questionPassword('App Password (16 chars, hidden): ');
                shopName = await question('Shop Name [Shopping Site]: ') || 'Shopping Site';
                break;

            case '5': // Mailgun
                console.log('💡 Mailgun Setup:');
                console.log('   1. Sign up: https://signup.mailgun.com/');
                console.log('   2. Get SMTP credentials from Sending → Domain Settings\n');
                smtpHost = 'smtp.mailgun.org';
                smtpPort = '587';
                smtpUser = await question('Mailgun SMTP Username: ');
                smtpPass = await questionPassword('Mailgun SMTP Password (hidden): ');
                shopName = await question('Shop Name [Shopping Site]: ') || 'Shopping Site';
                break;

            case '6': // Custom
                smtpHost = await question('SMTP Host: ');
                smtpPort = await question('SMTP Port [587]: ') || '587';
                smtpUser = await question('SMTP Username: ');
                smtpPass = await questionPassword('SMTP Password (hidden): ');
                shopName = await question('Shop Name [Shopping Site]: ') || 'Shopping Site';
                break;

            default:
                console.log('❌ Invalid choice. Exiting.\n');
                rl.close();
                return;
        }

        console.log('\n🔌 Testing SMTP connection...\n');

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        try {
            await transporter.verify();
            console.log('✅ SMTP connection successful!\n');
        } catch (error) {
            console.log('❌ SMTP connection failed!\n');
            console.log('Error:', error.message);
            console.log('\n💡 Common issues:');
            console.log('   - Wrong username or password');
            console.log('   - For Gmail: Need App Password (not regular password)');
            console.log('   - Wrong SMTP host or port\n');
            rl.close();
            return;
        }

        console.log('📧 Sending test email...\n');

        const mailOptions = {
            from: `"${shopName}" <${smtpUser}>`,
            to: smtpUser,
            subject: '✅ Email Configuration Successful',
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
              <h1>🎉 Success!</h1>
            </div>
            <div class="content">
              <h2>Email Configuration Complete</h2>
              <p>Your SMTP email configuration is working perfectly!</p>
              
              <div class="success">
                <strong>✅ What's Now Working:</strong>
                <ul>
                  <li>Password reset emails</li>
                  <li>Email verification</li>
                  <li>Order confirmations</li>
                  <li>Order status updates</li>
                  <li>All email notifications</li>
                </ul>
              </div>

              <h3>Configuration Details:</h3>
              <ul>
                <li><strong>SMTP Host:</strong> ${smtpHost}</li>
                <li><strong>SMTP Port:</strong> ${smtpPort}</li>
                <li><strong>From Email:</strong> ${smtpUser}</li>
                <li><strong>Shop Name:</strong> ${shopName}</li>
              </ul>

              <p>Your application is now ready to send emails!</p>
              
              <p>Best regards,<br>${shopName}</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Test email sent successfully!');
            console.log(`   Message ID: ${info.messageId}\n`);
        } catch (error) {
            console.log('⚠️  Warning: Could not send test email');
            console.log('   Error:', error.message);
            console.log('   (Configuration will still be saved)\n');
        }

        if (fs.existsSync(envPath)) {
            const backupPath = path.join(__dirname, `.env.backup.${Date.now()}`);
            fs.copyFileSync(envPath, backupPath);
            console.log(`💾 Backup created: ${path.basename(backupPath)}\n`);
        }

        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        envContent = envContent.replace(/^SMTP_HOST=.*$/m, '');
        envContent = envContent.replace(/^SMTP_PORT=.*$/m, '');
        envContent = envContent.replace(/^SMTP_USER=.*$/m, '');
        envContent = envContent.replace(/^SMTP_PASS=.*$/m, '');
        envContent = envContent.replace(/^SHOP_NAME=.*$/m, '');
        envContent = envContent.replace(/\n\n+/g, '\n\n');

        const smtpConfig = `
# Email Configuration (SMTP) - Configured on ${new Date().toISOString()}
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
SHOP_NAME=${shopName}
`;

        envContent = envContent.trim() + '\n' + smtpConfig;
        fs.writeFileSync(envPath, envContent);

        console.log('✅ Configuration saved to .env file\n');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                                                            ║');
        console.log('║              🎉  Setup Complete!  🎉                      ║');
        console.log('║                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log('📬 Check your email inbox for the test message!\n');
        console.log('🔄 Next steps:');
        console.log('   1. Restart your backend server (Ctrl+C, then npm start)');
        console.log('   2. Test password reset from your frontend');
        console.log('   3. Emails will now be sent automatically!\n');

    } catch (error) {
        console.log('\n❌ Setup failed:', error.message);
        console.log('\nPlease try again or check PRODUCTION_EMAIL_SETUP.md\n');
    } finally {
        rl.close();
    }
}

setup();
