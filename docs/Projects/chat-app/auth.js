const crypto = require("crypto");

const SALT_LEN = 16;
const KEY_LEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = crypto.scryptSync(password, salt, KEY_LEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const hash = Buffer.from(hashHex, "hex");
  const test = crypto.scryptSync(password, salt, KEY_LEN);
  return crypto.timingSafeEqual(hash, test);
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateUserId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[crypto.randomInt(chars.length)];
  }
  return id;
}

module.exports = { hashPassword, verifyPassword, createToken, generateUserId };
