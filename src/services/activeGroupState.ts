import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { getDB } from "@/integrations/sqlite";

const keyFor = (userId: string, key: string) => `${key}_${userId}`;

const LOCAL_ACTIVE_GROUP_ID = "active_group_id";
const LOCAL_ACTIVE_GROUP_UPDATED_AT = "active_group_updated_at";

let pendingSyncTimer: number | null = null;
let lastQueuedUserId: string | null = null;

export type ActiveGroupState = {
  groupId: string | null;
  updatedAt: string | null; // ISO
};

const isAndroid = () => Capacitor.getPlatform() === "android";

const nowIso = () => new Date().toISOString();

async function sqliteGet(key: string): Promise<string | null> {
  const db = getDB();
  if (!db) return null;
  const res = await db.query("SELECT value FROM app_settings WHERE key = ? LIMIT 1", [key]);
  return (res.values?.[0]?.value as string) ?? null;
}

async function sqliteSet(key: string, value: string): Promise<void> {
  const db = getDB();
  if (!db) return;
  await db.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", [key, value]);
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export async function getLocalActiveGroup(userId: string): Promise<ActiveGroupState> {
  const idKey = keyFor(userId, LOCAL_ACTIVE_GROUP_ID);
  const tsKey = keyFor(userId, LOCAL_ACTIVE_GROUP_UPDATED_AT);

  if (isAndroid()) {
    const groupId = await sqliteGet(idKey);
    const updatedAt = await sqliteGet(tsKey);
    if (groupId || updatedAt) return { groupId, updatedAt };
  }

  const groupId = lsGet(idKey);
  const updatedAt = lsGet(tsKey);
  return { groupId, updatedAt };
}

export async function setLocalActiveGroup(userId: string, groupId: string): Promise<ActiveGroupState> {
  const idKey = keyFor(userId, LOCAL_ACTIVE_GROUP_ID);
  const tsKey = keyFor(userId, LOCAL_ACTIVE_GROUP_UPDATED_AT);
  const updatedAt = nowIso();

  if (isAndroid()) {
    await sqliteSet(idKey, groupId);
    await sqliteSet(tsKey, updatedAt);
  }

  lsSet(idKey, groupId);
  lsSet(tsKey, updatedAt);

  return { groupId, updatedAt };
}

export async function getCloudActiveGroup(userId: string): Promise<ActiveGroupState> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("active_group_id, active_group_updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return {
    groupId: (data as any)?.active_group_id ?? null,
    updatedAt: (data as any)?.active_group_updated_at ?? null,
  };
}

export async function syncActiveGroupToCloud(userId: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  const local = await getLocalActiveGroup(userId);
  if (!local.groupId || !local.updatedAt) return;

  await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        active_group_id: local.groupId,
        active_group_updated_at: local.updatedAt,
        updated_at: nowIso(),
      } as any,
      { onConflict: "user_id" },
    );
}

export function scheduleActiveGroupSync(userId: string, delayMs = 1200): void {
  lastQueuedUserId = userId;
  if (pendingSyncTimer) window.clearTimeout(pendingSyncTimer);
  pendingSyncTimer = window.setTimeout(() => {
    const uid = lastQueuedUserId;
    pendingSyncTimer = null;
    lastQueuedUserId = null;
    if (uid) void syncActiveGroupToCloud(uid).catch(() => undefined);
  }, delayMs);
}

export async function hydrateLocalActiveGroupFromCloud(userId: string): Promise<ActiveGroupState> {
  const [local, cloud] = await Promise.all([getLocalActiveGroup(userId), getCloudActiveGroup(userId)]);

  const localTs = local.updatedAt ? Date.parse(local.updatedAt) : 0;
  const cloudTs = cloud.updatedAt ? Date.parse(cloud.updatedAt) : 0;

  if (cloud.groupId && cloudTs > localTs) {
    const idKey = keyFor(userId, LOCAL_ACTIVE_GROUP_ID);
    const tsKey = keyFor(userId, LOCAL_ACTIVE_GROUP_UPDATED_AT);

    if (isAndroid()) {
      await sqliteSet(idKey, cloud.groupId);
      if (cloud.updatedAt) await sqliteSet(tsKey, cloud.updatedAt);
    }
    lsSet(idKey, cloud.groupId);
    if (cloud.updatedAt) lsSet(tsKey, cloud.updatedAt);
    return cloud;
  }

  // If local is newer and we are online, schedule background persist.
  if (local.groupId && localTs > cloudTs) {
    scheduleActiveGroupSync(userId);
  }

  return local;
}

