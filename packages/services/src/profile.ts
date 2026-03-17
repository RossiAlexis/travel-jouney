import { db } from "@repo/db";

type ProfileUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
};

type UpdateProfileInput = {
  displayName?: string;
  bio?: string | null;
  avatar?: string | null;
};

export async function getProfile(userId: string): Promise<ProfileUser | null> {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, displayName: true, avatar: true, bio: true },
  });
}

export async function updateProfile(userId: string, data: UpdateProfileInput): Promise<ProfileUser> {
  return db.user.update({
    where: { id: userId },
    data: {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    },
    select: { id: true, email: true, username: true, displayName: true, avatar: true, bio: true },
  });
}
