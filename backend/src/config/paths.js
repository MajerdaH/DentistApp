const path = require('path');

/**
 * Directory for uploaded patient documents/images.
 * In production, set UPLOAD_DIR to a path inside a mounted persistent volume
 * (e.g. /data/uploads) so files survive redeploys.
 */
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

/**
 * Path to the SQLite database file, used for backup/export purposes.
 * Derived from DATABASE_URL (format: file:./path/to/db.sqlite or file:/absolute/path.db)
 * Falls back to the default dev.db location.
 */
function resolveDbPath() {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('file:')) {
    const rawPath = url.replace('file:', '');
    if (path.isAbsolute(rawPath)) {
      return rawPath;
    }
    // Relative paths in DATABASE_URL are resolved relative to the prisma/ folder
    return path.join(__dirname, '../../prisma', rawPath);
  }
  return path.join(__dirname, '../../prisma/dev.db');
}

module.exports = {
  uploadDir,
  dbPath: resolveDbPath(),
};

