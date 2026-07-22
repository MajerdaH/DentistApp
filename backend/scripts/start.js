#!/usr/bin/env node
/**
 * Robust startup script for Railway deployment.
 * Ensures the server starts even if db push or seeding has transient issues,
 * and logs clearly what step failed for easier debugging via Railway logs.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { uploadDir, dbPath } = require('../src/config/paths');

function run(cmd, label) {
  console.log(`\n▶️  ${label}...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${label} succeeded`);
    return true;
  } catch (error) {
    console.error(`❌ ${label} failed:`, error.message);
    return false;
  }
}

console.log('🦷 Starting Cabinet Dentaire backend...');
console.log('📁 Upload directory:', uploadDir);
console.log('🗄️  Database path:', dbPath);
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL || '(not set, using default)');

// Ensure the directory for the DB file exists (important for volume-mounted paths)
const dbDir = path.dirname(dbPath);
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('📁 Created database directory:', dbDir);
  }
} catch (error) {
  console.error('⚠️  Could not create database directory:', error.message);
}

// Ensure uploads directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
  }
} catch (error) {
  console.error('⚠️  Could not create uploads directory:', error.message);
}

// Push schema to database (creates tables if they don't exist)
run('npx prisma db push --accept-data-loss --skip-generate', 'Database schema push');

// Seed default users (safe to run multiple times - uses upsert)
run('node prisma/seed.js', 'Database seeding');

// Start the actual server - this MUST succeed for healthcheck to pass
console.log('\n🚀 Starting server...');
require('../src/index.js');

