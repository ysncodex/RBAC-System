export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
