export type Role = 'MANAGER' | 'MEMBER';

// Authenticated user interface
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// Auth response interface
export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

// Login input interface
export interface LoginInput {
  email: string;
  password: string;
}

// Register input interface
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}