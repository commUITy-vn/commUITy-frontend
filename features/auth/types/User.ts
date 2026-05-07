import { UserRole } from './UserRole';

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  imageUrl?: string;
};
