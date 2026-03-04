import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import { config } from '../config/env';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
}

export async function registerUser(email: string, password: string, displayName: string) {
  const existing = await db('users').where({ email }).first();
  if (existing) {
    throw new Error('Un compte avec cet email existe déjà.');
  }

  const id = uuid();
  const passwordHash = await bcrypt.hash(password, 10);

  await db('users').insert({
    id,
    email,
    password_hash: passwordHash,
    display_name: displayName,
  });

  return generateTokens({ id, email, display_name: displayName });
}

export async function loginUser(email: string, password: string) {
  const user = await db('users').where({ email }).first<UserRecord>();
  if (!user) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  return generateTokens(user);
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: string };
    const user = await db('users').where({ id: decoded.userId }).first<UserRecord>();
    if (!user) throw new Error('Utilisateur introuvable.');
    return generateTokens(user);
  } catch {
    throw new Error('Refresh token invalide.');
  }
}

export async function getUserById(userId: string) {
  const user = await db('users')
    .where({ id: userId })
    .select('id', 'email', 'display_name', 'created_at')
    .first();
  if (!user) throw new Error('Utilisateur introuvable.');
  return user;
}

function generateTokens(user: { id: string; email: string; display_name: string }) {
  const accessToken = jwt.sign({ userId: user.id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });

  const refreshToken = jwt.sign({ userId: user.id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    },
  };
}
