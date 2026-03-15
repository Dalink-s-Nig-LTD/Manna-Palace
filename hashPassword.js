// Simple script to hash password using PBKDF2
// Run with: node hashPassword.js

import crypto from 'crypto';

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      
      const result = {
        salt: Array.from(salt),
        hash: Array.from(derivedKey)
      };
      
      resolve(JSON.stringify(result));
    });
  });
}

async function main() {
  const password = "Qwerty123456";
  const hashedPassword = await hashPassword(password);
  
  console.log("Password:", password);
  console.log("\nHashed Password (copy this entire string):");
  console.log(hashedPassword);
  
  console.log("\n\nFor the database, use:");
  console.log(`passwordHash: ${hashedPassword}`);
}

main().catch(console.error);
