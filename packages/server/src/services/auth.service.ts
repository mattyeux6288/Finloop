import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { db } from '../config/database';
import { config } from '../config/env';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string | null;
  display_name: string;
  role: string;
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
    role: 'user',
  });

  return generateTokens({ id, email, display_name: displayName, role: 'user' });
}

export async function loginUser(email: string, password: string) {
  const user = await db('users').where({ email }).first<UserRecord>();
  if (!user) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  // Premier login : mot de passe non encore défini
  if (!user.password_hash) {
    const err = new Error('Vous devez définir votre mot de passe lors de la première connexion.');
    (err as any).code = 'FIRST_LOGIN_REQUIRED';
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Email ou mot de passe incorrect.');
  }

  return generateTokens(user);
}

/**
 * Premier login : définir le mot de passe pour un utilisateur qui n'en a pas encore
 */
export async function setupPassword(email: string, newPassword: string) {
  const user = await db('users').where({ email }).first<UserRecord>();
  if (!user) {
    throw new Error('Utilisateur introuvable.');
  }

  if (user.password_hash) {
    throw new Error('Le mot de passe a déjà été défini. Utilisez la connexion classique.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db('users').where({ id: user.id }).update({ password_hash: passwordHash });

  return generateTokens(user);
}

/**
 * Changer son mot de passe (utilisateur connecté)
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await db('users').where({ id: userId }).first<UserRecord>();
  if (!user) {
    throw new Error('Utilisateur introuvable.');
  }

  if (!user.password_hash) {
    throw new Error('Mot de passe non défini. Utilisez le formulaire de premier login.');
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Mot de passe actuel incorrect.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db('users').where({ id: userId }).update({ password_hash: passwordHash });

  return { success: true };
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
    .select('id', 'email', 'display_name', 'role', 'created_at')
    .first();
  if (!user) throw new Error('Utilisateur introuvable.');
  return user;
}

function generateTokens(user: { id: string; email: string; display_name: string; role: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any },
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn as any },
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
    },
  };
}
