import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_super_secret_key_change_in_production'
);

export async function createSession(userId) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies(); // Awaited for Next.js compatibility
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  try {
    const cookieStore = await cookies(); // Awaited here
    const token = cookieStore.get('session')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUserId() {
  const session = await getSession();
  return session?.userId || null;
}

export async function destroySession() {
  const cookieStore = await cookies(); // Awaited here
  cookieStore.set('session', '', { 
    maxAge: 0, 
    path: '/' 
  });
}