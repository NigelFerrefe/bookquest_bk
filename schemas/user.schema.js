const { z } = require("zod");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

const userSchema = z.object({
  email: z.string().regex(emailRegex, { message: "Invalid email format" }),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["admin", "user"]).optional(),
});
module.exports = { userSchema };
