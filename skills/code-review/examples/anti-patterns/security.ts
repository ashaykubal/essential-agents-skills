/**
 * Security Anti-Patterns
 *
 * DO NOT use these patterns in production code.
 * Each example demonstrates a security vulnerability.
 */

// A03:2021 - SQL Injection
// BAD: String concatenation in SQL query
async function getUserByIdUnsafe(userId: string) {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return db.query(query);
}

// A03:2021 - Command Injection
// BAD: User input in shell command
function processFileUnsafe(filename: string) {
  const { execSync } = require('child_process');
  execSync(`cat ${filename} | grep pattern`);
}

// A03:2021 - XSS (Cross-Site Scripting)
// BAD: Rendering user input without escaping
function renderCommentUnsafe(comment: string) {
  document.getElementById('comments').innerHTML = comment;
}

// A02:2021 - Hardcoded Secrets
// BAD: API key in source code
const API_KEY = 'sk-1234567890abcdef';
const DB_PASSWORD = 'production_password_123';

// A02:2021 - Weak Cryptography
// BAD: MD5 for password hashing
import * as crypto from 'crypto';
function hashPasswordUnsafe(password: string) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// A02:2021 - Insecure Random
// BAD: Math.random for security-sensitive operations
function generateTokenUnsafe() {
  return Math.random().toString(36).substring(2);
}

// A01:2021 - Missing Authorization
// BAD: No ownership check
async function getDocumentUnsafe(documentId: string) {
  // Missing: Check if current user owns this document
  return db.documents.findById(documentId);
}

// A01:2021 - Path Traversal
// BAD: User input in file path without sanitization
function readFileUnsafe(userPath: string) {
  const fs = require('fs');
  return fs.readFileSync(`./uploads/${userPath}`);
}

// A07:2021 - Session Fixation
// BAD: Not regenerating session after login
async function loginUnsafe(req: Request, res: Response) {
  const user = await authenticate(req.body);
  // Missing: req.session.regenerate()
  req.session.userId = user.id;
  res.json({ success: true });
}

// A09:2021 - Sensitive Data in Logs
// BAD: Logging passwords
function authenticateUnsafe(username: string, password: string) {
  console.log(`Login attempt: ${username} with password ${password}`);
  // ...
}

// A10:2021 - SSRF (Server-Side Request Forgery)
// BAD: User-controlled URL without validation
async function fetchUrlUnsafe(url: string) {
  const response = await fetch(url);
  return response.text();
}

// A05:2021 - Debug Mode in Production
// BAD: Verbose error messages
function handleErrorUnsafe(error: Error, res: Response) {
  res.status(500).json({
    error: error.message,
    stack: error.stack,
    internalDetails: error.cause,
  });
}
