/**
 * Serviço JWT para autenticação
 * Gera e valida tokens JWT
 */
export interface JWTPayload {
  userId: string;
  role: string;
  email?: string;
}
export interface TokenResult {
  token: string;
  expiresIn: number;
}
export declare class JWTService {
  private readonly secret;
  private readonly issuer;
  private readonly audience;
  private readonly expiresIn;
  constructor();
  /**
   * Gera token JWT
   */
  generateToken(payload: JWTPayload): TokenResult;
  /**
   * Valida e decodifica token JWT
   */
  verifyToken(token: string): JWTPayload;
  /**
   * Decodifica token sem validar (use com cuidado)
   */
  decodeToken(token: string): JWTPayload | null;
}
//# sourceMappingURL=jwtService.d.ts.map
