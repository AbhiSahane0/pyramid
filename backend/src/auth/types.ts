/** Claims embedded in both access and refresh JWTs. */
export interface JwtPayload {
  sub: string;
  email: string;
  isGuest: boolean;
}

/** Normalized profile extracted from Google's OAuth response. */
export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Shape attached to req.user by the refresh-token strategy. */
export interface RefreshRequestUser {
  userId: string;
  refreshToken: string;
}
