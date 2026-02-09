/**
 * Security Recommended Patterns
 *
 * These examples demonstrate secure coding practices.
 */

// A03:2021 - SQL Injection Prevention
// GOOD: Parameterized query
async function getUserByIdSafe(userId: string) {
  const query = 'SELECT * FROM users WHERE id = ?';
  return db.query(query, [userId]);
}

// A03:2021 - Command Injection Prevention
// GOOD: Use array-based spawn, validate input
function processFileSafe(filename: string) {
  const { spawnSync } = require('child_process');

  // Validate filename contains only safe characters
  if (!/^[\w.-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  // Use array form to prevent shell interpretation
  spawnSync('grep', ['pattern', filename]);
}

// A03:2021 - XSS Prevention
// GOOD: Use textContent or proper escaping
function renderCommentSafe(comment: string) {
  const element = document.getElementById('comments');
  element.textContent = comment; // Safe: treated as text, not HTML
}

// Alternative: Use a sanitization library
function renderCommentWithSanitization(comment: string) {
  const DOMPurify = require('dompurify');
  const clean = DOMPurify.sanitize(comment);
  document.getElementById('comments').innerHTML = clean;
}

// A02:2021 - Secrets Management
// GOOD: Use environment variables
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;

// Validate secrets are present at startup
if (!API_KEY || !DB_PASSWORD) {
  throw new Error('Required environment variables not set');
}

// A02:2021 - Strong Cryptography
// GOOD: bcrypt for password hashing
import * as bcrypt from 'bcrypt';

async function hashPasswordSafe(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// A02:2021 - Secure Random
// GOOD: crypto.randomBytes for security-sensitive operations
import * as crypto from 'crypto';

function generateTokenSafe(): string {
  return crypto.randomBytes(32).toString('hex');
}

// A01:2021 - Authorization Check
// GOOD: Verify ownership before returning data
async function getDocumentSafe(documentId: string, userId: string) {
  const document = await db.documents.findById(documentId);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  if (document.ownerId !== userId) {
    throw new ForbiddenError('Access denied');
  }

  return document;
}

// A01:2021 - Path Traversal Prevention
// GOOD: Validate and normalize path
import * as path from 'path';

function readFileSafe(userPath: string) {
  const uploadsDir = path.resolve('./uploads');
  const requestedPath = path.resolve(uploadsDir, userPath);

  // Ensure path is within uploads directory
  if (!requestedPath.startsWith(uploadsDir)) {
    throw new Error('Invalid path');
  }

  const fs = require('fs');
  return fs.readFileSync(requestedPath);
}

// A07:2021 - Session Regeneration
// GOOD: Regenerate session after authentication
async function loginSafe(req: Request, res: Response) {
  const user = await authenticate(req.body);

  // Regenerate session to prevent fixation
  req.session.regenerate((err) => {
    if (err) throw err;
    req.session.userId = user.id;
    res.json({ success: true });
  });
}

// A09:2021 - Safe Logging
// GOOD: Never log sensitive data
function authenticateSafe(username: string, password: string) {
  console.log(`Login attempt for user: ${username}`);
  // Password is NOT logged
  const result = verifyCredentials(username, password);
  console.log(`Login result for ${username}: ${result ? 'success' : 'failure'}`);
}

// A10:2021 - SSRF Prevention
// GOOD: Allowlist for external URLs
const ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];

async function fetchUrlSafe(url: string) {
  const parsedUrl = new URL(url);

  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    throw new Error('URL not in allowlist');
  }

  const response = await fetch(url);
  return response.text();
}

// A05:2021 - Production Error Handling
// GOOD: Generic error message, log details server-side
function handleErrorSafe(error: Error, res: Response) {
  // Log full details server-side
  console.error('Internal error:', error);

  // Return generic message to client
  res.status(500).json({
    error: 'An internal error occurred',
    requestId: generateRequestId(), // For support correlation
  });
}
