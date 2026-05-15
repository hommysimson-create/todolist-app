'use strict';

// RFC 5322 이메일 형식 (실용적 범위)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function isValidUUID(uuid) {
  return typeof uuid === 'string' && UUID_RE.test(uuid);
}

function isValidDate(dateString) {
  if (typeof dateString !== 'string' || !DATE_RE.test(dateString)) return false;
  const d = new Date(dateString);
  return !isNaN(d.getTime());
}

function isValidName(name) {
  return typeof name === 'string' && name.length >= 1 && name.length <= 100;
}

function isValidTitle(title) {
  return typeof title === 'string' && title.length >= 1 && title.length <= 255;
}

function isValidTheme(theme) {
  return theme === 'light' || theme === 'dark';
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidUUID,
  isValidDate,
  isValidName,
  isValidTitle,
  isValidTheme,
};
