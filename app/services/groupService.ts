import { supabase } from "../lib/supabase";
import { getWeekBounds } from "./workoutService";
import type { Group, GroupTopPr, GroupWorkoutSummary, UserSearchResult } from "../lib/types";

export async function createGroup(userId: string, name: string): Promise<Group> {
  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId });
  if (memberError) throw memberError;

  return group;
}

export async function listMyGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("group:groups(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.group as unknown as Group);
}

export async function searchUsersByUsername(query: string): Promise<UserSearchResult[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase.rpc("search_users_by_username", { query: query.trim() });
  if (error) throw error;
  return data ?? [];
}

export async function addMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId });
  if (error) throw error;
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listGroupMembers(
  groupId: string
): Promise<{ user_id: string; joined_at: string }[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id, joined_at")
    .eq("group_id", groupId);
  if (error) throw error;
  return data ?? [];
}

export async function getGroupSummaries(
  groupId: string,
  sinceDate: string
): Promise<GroupWorkoutSummary[]> {
  const { data, error } = await supabase.rpc("group_workout_summaries", {
    p_group_id: groupId,
    p_since: sinceDate,
  });
  if (error) throw error;
  return data ?? [];
}

export async function getGroupTopPrs(groupId: string, sinceDate: string): Promise<GroupTopPr[]> {
  const { data, error } = await supabase.rpc("group_top_prs", {
    p_group_id: groupId,
    p_since: sinceDate,
  });
  if (error) throw error;
  return data ?? [];
}

export type GroupRankingEntry = {
  user_id: string;
  first_name: string | null;
  username: string | null;
  sessionsCount: number;
};

export async function getGroupWeeklyRanking(groupId: string): Promise<GroupRankingEntry[]> {
  const { monday } = getWeekBounds();
  const summaries = await getGroupSummaries(groupId, monday);

  const byUser = new Map<string, GroupRankingEntry>();
  for (const s of summaries) {
    const existing = byUser.get(s.user_id);
    if (existing) {
      existing.sessionsCount += 1;
    } else {
      byUser.set(s.user_id, {
        user_id: s.user_id,
        first_name: s.first_name,
        username: s.username,
        sessionsCount: 1,
      });
    }
  }

  return Array.from(byUser.values()).sort((a, b) => b.sessionsCount - a.sessionsCount);
}
