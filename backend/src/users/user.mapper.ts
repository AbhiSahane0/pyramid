import { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  title: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  createdAt: Date;
}

/** Strips credentials/internal fields before a user ever leaves the API. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    title: user.title,
    avatarUrl: user.avatarUrl,
    isGuest: user.isGuest,
    createdAt: user.createdAt,
  };
}
