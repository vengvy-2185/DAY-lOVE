const crypto = require("crypto");

// Generates a human-typeable 6-digit one-time code.
function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

module.exports = { generateCode };
