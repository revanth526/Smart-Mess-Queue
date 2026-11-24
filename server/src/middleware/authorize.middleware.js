const { ForbiddenError, UnauthorizedError } = require('../errors');
const { Role } = require('@prisma/client');

const ADMIN_ROLE_ALIASES = new Set([
  'ADMIN',
  'MESS_ADMIN',
  'SUPER_ADMIN',
  'ROLE_ADMIN',
  'ROLE_MESS_ADMIN',
  'MESSADMIN',
  'ADMINISTRATOR',
]);
const STUDENT_ROLE_ALIASES = new Set(['STUDENT', 'ROLE_STUDENT', 'PUPIL']);

function normalizeRole(role) {
  if (!role) return '';
  return String(role).trim().toUpperCase();
}

function rolesMatch(userRole, targetRole) {
  const normUser = normalizeRole(userRole);
  const normTarget = normalizeRole(targetRole);

  if (!normUser || !normTarget) return false;
  if (normUser === normTarget) return true;

  if (ADMIN_ROLE_ALIASES.has(normUser) && ADMIN_ROLE_ALIASES.has(normTarget)) {
    return true;
  }

  if (STUDENT_ROLE_ALIASES.has(normUser) && STUDENT_ROLE_ALIASES.has(normTarget)) {
    return true;
  }

  return false;
}

function authorize(...allowedRolesInput) {
  const allowedRoles = allowedRolesInput.flat();

  return (req, _res, next) => {
    if (!req.user || !req.user.role) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRole = req.user.role;
    const isAuthorized = allowedRoles.some((targetRole) => rolesMatch(userRole, targetRole));

    if (!isAuthorized) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }

    next();
  };
}

const requireAdmin = authorize(Role.MESS_ADMIN, 'ADMIN');
const requireStudent = authorize(Role.STUDENT);
const authorizeRoles = authorize;

module.exports = {
  authorize,
  authorizeRoles,
  requireAdmin,
  requireStudent,
  rolesMatch,
  normalizeRole,
};
