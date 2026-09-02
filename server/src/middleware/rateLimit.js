const rateLimit = require("express-rate-limit");

// Bumper auth limiter សម្រាប់ដោះស្រាយបញ្ហាទាក់/កក ពេល Testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 នាទី
  limit: 200, // បង្កើនពី 10 ទៅ 200 requests (មិនដើរទាក់ទៀតទេ)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

// Looser general-purpose limiter សម្រាប់ API ផ្សេងៗ
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 នាទី
  limit: 500, // បង្កើនដល់ 500 requests
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };   