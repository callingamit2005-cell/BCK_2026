import { z } from "zod";

export const emailSchema = z.string().trim().email();

export const uuidSchema = z.string().uuid();

export const inviteTokenSchema = z
  .string()
  .trim()
  .min(8)
  .max(256)
  .regex(/^[A-Za-z0-9._-]+$/);

export const groupInviteSchema = z.object({
  email: emailSchema,
  groupId: uuidSchema,
  groupName: z.string().trim().min(1).max(120),
});

export const isValidUuid = (value: string | null | undefined): value is string => {
  if (!value) return false;
  return uuidSchema.safeParse(value).success;
};

export const isValidInviteToken = (value: string | null | undefined): value is string => {
  if (!value) return false;
  return inviteTokenSchema.safeParse(value).success;
};
