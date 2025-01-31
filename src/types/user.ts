export type UserRole = 'serviceengineer' | 'servicehead' | 'viewAccess';

export interface UserData {
  email?: string;
  phone?: string;
  role?: UserRole;
  name?: string;
}