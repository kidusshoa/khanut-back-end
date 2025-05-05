import { Request } from 'express';
import { IUser } from '../models/user';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}
