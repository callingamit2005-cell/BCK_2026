type GroupMember = {
  user_id?: string | null;
  role?: string | null;
};

export const isGroupAdmin = (
  members: GroupMember[] | undefined,
  userId: string | undefined
): boolean => {
  if (!userId || !Array.isArray(members)) return false;
  return members.some((member) => member.user_id === userId && member.role === "admin");
};
