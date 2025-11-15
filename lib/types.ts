// app/lib/types.ts
export interface JwtPayload {
  id: string;
  email: string;
  iat?: number; // issued at (optional)
  exp?: number; // expiry timestamp (optional)
}
