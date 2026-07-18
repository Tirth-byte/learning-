/**
 * ----------------------------------------------------------------------------------
 * ENVIRONMENT CONFIGURATION
 *
 * WHAT THIS FILE DOES:
 * Reads every environment variable the app depends on in exactly ONE place and
 * exposes them as plain constants. Business logic imports from here instead of
 * touching process.env directly, so secrets and tunables never get scattered or
 * duplicated across the codebase.
 *
 * WHERE TO CHANGE THINGS:
 *   - Values come from server/.env (see .env.example for the full list).
 * ----------------------------------------------------------------------------------
 */

const isProduction = process.env.NODE_ENV === 'production';

// A real secret is mandatory in production. The development fallback only exists so
// the server boots on a fresh clone without extra setup — it must never sign real
// tokens in production, hence the guard below.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production.');
}

module.exports = {
  isProduction,
  PORT: process.env.PORT || 5000,
  JWT_SECRET,
  JWT_EXPIRES_IN: '7d',
};
