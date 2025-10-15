/**
 * Email Service Test Script
 * 
 * This script tests the Mailgun email service configuration
 * Run with: node test-email.js
 */

require('dotenv').config();
const readline = require('readline');

const {
  sendRegistrationOTP,
  sendPasswordResetOTP,
  sendBulkUserWelcomeEmail,
  sendBadgeReceivedEmail,
  sendProfileUpdateEmail,
  sendAdminDailyReport
} = require('./services/emailService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testEmail() {
  console.log('\n=== Mailgun Email Service Test ===\n');
  
  // Check environment variables
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('❌ ERROR: Mailgun credentials not found in .env file');
    console.log('\nPlease ensure the following are set in your .env file:');
    console.log('  - MAILGUN_API_KEY');
    console.log('  - MAILGUN_DOMAIN');
    console.log('  - MAILGUN_API_URL (optional)');
    console.log('  - MAILGUN_FROM_EMAIL (optional)');
    rl.close();
    return;
  }

  console.log('✅ Environment variables loaded');
  console.log(`   Domain: ${process.env.MAILGUN_DOMAIN}`);
  console.log(`   API URL: ${process.env.MAILGUN_API_URL || 'https://api.mailgun.net (default)'}`);
  console.log(`   From Email: ${process.env.MAILGUN_FROM_EMAIL || `noreply@${process.env.MAILGUN_DOMAIN} (default)`}\n`);

  const email = await question('Enter test email address: ');
  
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address');
    rl.close();
    return;
  }

  console.log('\nSelect email type to test:');
  console.log('1. Registration OTP');
  console.log('2. Password Reset OTP');
  console.log('3. Bulk User Welcome');
  console.log('4. Badge Received');
  console.log('5. Profile Update (Badge Revoked)');
  console.log('6. Admin Daily Report');
  console.log('7. Test All Emails (send all 6 types)');
  console.log('0. Exit');
  
  const choice = await question('\nEnter choice (0-7): ');

  try {
    switch (choice) {
      case '1':
        console.log('\n📧 Sending Registration OTP email...');
        await sendRegistrationOTP(email, '123456');
        console.log('✅ Registration OTP email sent successfully!');
        break;

      case '2':
        console.log('\n📧 Sending Password Reset OTP email...');
        await sendPasswordResetOTP(email, '654321');
        console.log('✅ Password Reset OTP email sent successfully!');
        break;

      case '3':
        console.log('\n📧 Sending Bulk User Welcome email...');
        // Generate a random password for demonstration (same as in adminRoutes.js)
        const generateRandomPassword = () => {
          const length = 12;
          const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const lowercase = 'abcdefghijklmnopqrstuvwxyz';
          const numbers = '0123456789';
          const special = '!@#$%^&*';
          const allChars = uppercase + lowercase + numbers + special;
          
          let password = '';
          password += uppercase[Math.floor(Math.random() * uppercase.length)];
          password += lowercase[Math.floor(Math.random() * lowercase.length)];
          password += numbers[Math.floor(Math.random() * numbers.length)];
          password += special[Math.floor(Math.random() * special.length)];
          
          for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
          }
          
          return password.split('').sort(() => Math.random() - 0.5).join('');
        };
        
        const randomPassword = generateRandomPassword();
        console.log(`🔐 Generated random password: ${randomPassword}`);
        await sendBulkUserWelcomeEmail(email, randomPassword, 'http://localhost:3000/login');
        console.log('✅ Bulk User Welcome email sent successfully with random password!');
        break;

      case '4':
        console.log('\n📧 Sending Badge Received email...');
        await sendBadgeReceivedEmail(
          email,
          'JavaScript Expert',
          'Completed advanced JavaScript course with excellence!'
        );
        console.log('✅ Badge Received email sent successfully!');
        break;

      case '5':
        console.log('\n📧 Sending Profile Update (Badge Revoked) email...');
        await sendProfileUpdateEmail(
          email,
          'badge_stripped',
          'JavaScript Expert',
          '<p style="margin-top: 10px;">This badge was removed as part of a periodic review.</p>'
        );
        console.log('✅ Profile Update email sent successfully!');
        break;

      case '6':
        console.log('\n📧 Sending Admin Daily Report email...');
        const sampleLogs = [
          { time: '10:30 AM', action: 'Badge Created', target: 'Python Basics', status: '✅ Success' },
          { time: '11:15 AM', action: 'User Imported', target: 'john@example.com', status: '✅ Success' },
          { time: '02:45 PM', action: 'Badge Assigned', target: 'Jane Doe', status: '✅ Success' },
          { time: '04:20 PM', action: 'Badge Revoked', target: 'Bob Smith', status: '⚠️ Warning' }
        ];
        await sendAdminDailyReport(email, 'Admin User', new Date().toLocaleDateString(), sampleLogs);
        console.log('✅ Admin Daily Report email sent successfully!');
        break;

      case '7':
        console.log('\n📧 Testing ALL email types...\n');
        
        let successCount = 0;
        let failCount = 0;
        
        // Test 1: Registration OTP
        try {
          console.log('1/6 Sending Registration OTP...');
          await sendRegistrationOTP(email, '123456');
          console.log('    ✅ Registration OTP sent');
          successCount++;
        } catch (err) {
          console.log('    ❌ Failed:', err.message);
          failCount++;
        }
        
        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2: Password Reset OTP
        try {
          console.log('2/6 Sending Password Reset OTP...');
          await sendPasswordResetOTP(email, '654321');
          console.log('    ✅ Password Reset OTP sent');
          successCount++;
        } catch (err) {
          console.log('    ❌ Failed:', err.message);
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 3: Bulk User Welcome with random password
        try {
          console.log('3/6 Sending Bulk User Welcome...');
          const generateRandomPassword = () => {
            const length = 12;
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const special = '!@#$%^&*';
            const allChars = uppercase + lowercase + numbers + special;
            
            let password = '';
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += special[Math.floor(Math.random() * special.length)];
            
            for (let i = 4; i < length; i++) {
              password += allChars[Math.floor(Math.random() * allChars.length)];
            }
            
            return password.split('').sort(() => Math.random() - 0.5).join('');
          };
          const testPassword = generateRandomPassword();
          console.log(`    🔐 Using random password: ${testPassword}`);
          await sendBulkUserWelcomeEmail(email, testPassword, 'http://localhost:3000/login');
          console.log('    ✅ Bulk User Welcome sent');
          successCount++;
        } catch (err) {
          console.log('    ❌ Failed:', err.message);
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 4: Badge Received
        try {
          console.log('4/6 Sending Badge Received...');
          await sendBadgeReceivedEmail(
            email,
            'JavaScript Expert',
            'Completed advanced JavaScript course with excellence!'
          );
          console.log('    ✅ Badge Received sent');
          successCount++;
        } catch (err) {
          console.log('    ❌ Failed:', err.message);
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 5: Profile Update
        try {
          console.log('5/6 Sending Profile Update (Badge Revoked)...');
          await sendProfileUpdateEmail(
            email,
            'badge_stripped',
            'JavaScript Expert',
            '<p style="margin-top: 10px;">This badge was removed as part of a periodic review.</p>'
          );
          console.log('    ✅ Profile Update sent');
          successCount++;
        } catch (err) {
          console.log('    ❌ Failed:', err.message);
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 6: Admin Daily Report
        try {
          console.log('6/6 Sending Admin Daily Report...');
          const sampleLogs = [
            { time: '10:30 AM', action: 'Badge Created', target: 'Python Basics', status: '✅ Success' },
            { time: '11:15 AM', action: 'User Imported', target: 'john@example.com', status: '✅ Success' },
            { time: '02:45 PM', action: 'Badge Assigned', target: 'Jane Doe', status: '✅ Success' },
            { time: '04:20 PM', action: 'Badge Revoked', target: 'Bob Smith', status: '⚠️ Warning' }
          ];
          await sendAdminDailyReport(email, 'Admin User', new Date().toLocaleDateString(), sampleLogs);
          console.log('    ✅ Admin Daily Report sent');
          successCount++;
        } catch (err) {
          console.log('    ❌ Failed:', err.message);
          failCount++;
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(`📊 Test Summary: ${successCount} succeeded, ${failCount} failed`);
        console.log('='.repeat(50));
        break;

      case '0':
        console.log('\nExiting...');
        break;

      default:
        console.log('\n❌ Invalid choice');
    }

    if (choice !== '0') {
      console.log('\n📬 Check your inbox (and spam folder) for the test email.');
      console.log('📊 You can also check delivery status in the Mailgun dashboard: https://app.mailgun.com/app/logs');
    }

  } catch (error) {
    console.error('\n❌ ERROR: Failed to send email');
    console.error('Details:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify your Mailgun API key is correct');
    console.log('2. Check if your domain is verified in Mailgun');
    console.log('3. If using sandbox domain, ensure recipient is authorized');
    console.log('4. Check Mailgun logs for more details: https://app.mailgun.com/app/logs');
  }

  rl.close();
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  console.log('\n\nTest cancelled.');
  rl.close();
  process.exit(0);
});

// Run the test
testEmail().catch(error => {
  console.error('Unexpected error:', error);
  rl.close();
  process.exit(1);
});
