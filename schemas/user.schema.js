const { z } = require("zod");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const userSchema = z.object({
  email: z.string().regex(emailRegex, { message: "Invalid email format" }),
  password: z
  .string()
  .regex(passwordRegex, {
    message: "Password must be at least 8 characters, include one uppercase letter and one number"
  }),
  name: z.string().min(1),
  role: z.enum(["admin", "user"]).optional(),
});

module.exports = { userSchema };
