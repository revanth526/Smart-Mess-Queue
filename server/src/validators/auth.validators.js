const { z } = require('zod');

const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be at most 100 characters'),
      studentId: z
        .string()
        .trim()
        .regex(/^\d+$/, 'Student ID must contain only numbers')
        .min(4, 'Student ID must be at least 4 digits')
        .max(20, 'Student ID must be at most 20 digits')
        .optional(),
      email: z
        .string()
        .trim()
        .email('Invalid email address')
        .max(255, 'Email must be at most 255 characters')
        .transform((v) => v.toLowerCase())
        .optional(),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be at most 128 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
        ),
      confirmPassword: z.string().optional(),
      rollNo: z
        .string()
        .trim()
        .min(1, 'Roll number is required')
        .max(20, 'Roll number must be at most 20 characters')
        .optional(),
    })
    .refine((data) => data.studentId || data.email, {
      message: 'Student ID is required',
      path: ['studentId'],
    })
    .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

const loginSchema = z.object({
  body: z
    .object({
      studentId: z
        .string()
        .trim()
        .regex(/^\d+$/, 'Student ID must contain only numbers')
        .min(4, 'Student ID must be at least 4 digits')
        .max(20, 'Student ID must be at most 20 digits')
        .optional(),
      email: z
        .string()
        .trim()
        .email('Invalid email address')
        .max(255)
        .transform((v) => v.toLowerCase())
        .optional(),
      password: z.string().min(1, 'Password is required'),
    })
    .refine((data) => data.studentId || data.email, {
      message: 'Either Student ID or Email is required',
      path: ['studentId'],
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
