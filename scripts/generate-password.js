#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🔐 Textus Password Hash Generator\n');

  const password = await question('Enter password: ');

  if (!password) {
    console.error('❌ Password cannot be empty');
    process.exit(1);
  }

  if (password.length < 8) {
    console.warn('⚠️  Warning: Password is shorter than 8 characters');
  }

  console.log('\n⏳ Generating hash...\n');

  const hash = bcrypt.hashSync(password, 10);

  console.log('✅ Generated bcrypt hash:');
  console.log(`\n${hash}\n`);
  console.log('📝 Add this to your .env file:');
  console.log(`AUTH_PASSWORD=${hash}\n`);

  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
