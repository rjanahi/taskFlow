import { Role } from '../../generated/prisma/client';

export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}