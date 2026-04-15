import { User, Comment } from "@/types/api";

// example
export const canCreatePost = (user: User | null | undefined) => {
  return user?.role === 'ADMIN';
};

export const canDeleteComment = (
  user: User | null | undefined,
  comment: Comment,
) => {
  if (user?.role === 'ADMIN') {
    return true;
  }

  if (user?.role === 'USER' && comment.author?.id === user.id) {
    return true;
  }

  return false;
};