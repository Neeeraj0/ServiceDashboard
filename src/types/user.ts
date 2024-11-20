export type UserRole = 'serviceengineer' | 'servicehead';

export interface UserData {
  email?: string;
  phone?: string;
  role?: UserRole;
  name?: string;
}