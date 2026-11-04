import { Role } from '@prisma/client';

// Augment Express Request with authenticated user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}
