// Node.js script to simulate the hashing using the actual parser logic, but we must use JS since we can't run native tests directly right now.
const crypto = require('crypto');

function sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

// Emulating SmsNormalizationHelper.normalize()
function normalize(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\bdr\.?\b/g, "debited")
    .replace(/\bcr\.?\b/g, "credited")
    .replace(/\ba\/c\b/g, "account")
    .replace(/\bavlbal\b/g, "balance")
    .replace(/\bavl\s+bal\b/g, "balance")
    .replace(/\bbal:\b/g, "balance")
    .replace(/today/g, "")
    .replace(/yesterday/g, "")
    .replace(/₹/g, "rs ")
    .replace(/inr/g, "rs ")
    .replace(/\s+/g, " ")
    .trim();
}

console.log('Testing normalization...');
console.log(normalize("Dear Customer, Rs.100.00 has been debited from a/c **1234 on 08-Jun-26. Avl Bal: Rs.5000.00. Ref: 123456789"));
console.log(normalize("Dear Customer, Rs.100.00 has been debited from account **1234 on 08-Jun-26. balance: rs 5000.00. Ref: 123456789"));
