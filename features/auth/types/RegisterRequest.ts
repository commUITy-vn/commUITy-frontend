import { UserRole } from './UserRole';

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
};
