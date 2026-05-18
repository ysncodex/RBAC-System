const { execSync } = require('node:child_process');

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
execSync('node dist/main.js', { stdio: 'inherit', env: process.env });
