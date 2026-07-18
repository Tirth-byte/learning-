const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { JWT_SECRET } = require('../config/env');

/**
 * Verify a token and confirm the user it points to still exists.
 *
 * A valid signature is not enough: a token minted for a user who was later removed
 * (or wiped by a database re-seed) would otherwise sail through and cause foreign-key
 * violations deeper in the app. We reload the user from the database on every request
 * and use that fresh record as req.user, so downstream code always references a real row.
 *
 * Returns the user record, or null if the token is invalid or the user is gone.
 */
async function resolveUser(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });
    return user; // null when the user no longer exists
  } catch (error) {
    return null; // invalid or expired token
  }
}

async function authMiddleware(req, res, next) {
  const user = await resolveUser(req.headers.authorization);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Session is no longer valid. Please sign in again.',
    });
  }

  req.user = user;
  next();
}

function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden. Access restricted.' });
    }

    next();
  };
}

/**
 * Attach the user when a valid token is present, but fall back to an anonymous
 * customer view otherwise. Used by public product routes where signed-in users
 * get personalised pricing but guests can still browse.
 */
async function optionalAuthMiddleware(req, res, next) {
  const user = await resolveUser(req.headers.authorization);
  req.user = user || { role: 'CUSTOMER' };
  next();
}

module.exports = {
  authMiddleware,
  roleGuard,
  optionalAuthMiddleware,
};
