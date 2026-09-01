const { z } = require("zod");

const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{6,20}$/, "Invalid phone number");

const loginSchema = z.object({
  phone: phoneSchema,
});

const verifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6),
});

const createCodeSchema = z.object({
  phone: phoneSchema,
  name: z.string().min(1).max(120).optional(),
});

const updateUserSchema = z.object({
  approved: z.boolean().optional(),
  disabled: z.boolean().optional(),
  name: z.string().min(1).max(120).optional(),
});

const createRoomSchema = z.object({
  name: z.string().min(1).max(120),
});

const createMessageSchema = z.object({
  roomId: z.string().uuid(),
  type: z.enum(["text", "image", "video", "voice"]),
  content: z.string().max(4000).optional(),
  mediaUrl: z.string().url().optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  loginSchema,
  verifySchema,
  createCodeSchema,
  updateUserSchema,
  createRoomSchema,
  createMessageSchema,
  validate,
};
