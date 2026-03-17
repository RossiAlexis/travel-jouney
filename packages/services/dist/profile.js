import { db } from "@repo/db";
export async function getProfile(userId) {
    return db.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, displayName: true, avatar: true, bio: true },
    });
}
export async function updateProfile(userId, data) {
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
