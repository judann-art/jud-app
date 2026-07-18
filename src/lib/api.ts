import { supabase } from './supabase';
import type { PostWithProfile } from './supabase';

export async function fetchFeed(limit = 50): Promise<PostWithProfile[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, image_url, video_url, created_at,
      profiles!posts_user_id_fkey ( id, username, display_name, bio, avatar_url, created_at )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    video_url: p.video_url || '',
    created_at: p.created_at,
    profiles: p.profiles,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  })) as PostWithProfile[];
}

export async function fetchLikeCounts(postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds);
  if (error) return {};
  const map: Record<string, number> = {};
  (data || []).forEach((l: any) => {
    map[l.post_id] = (map[l.post_id] || 0) + 1;
  });
  return map;
}

export async function fetchCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const { data, error } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds);
  if (error) return {};
  const map: Record<string, number> = {};
  (data || []).forEach((c: any) => {
    map[c.post_id] = (map[c.post_id] || 0) + 1;
  });
  return map;
}

export async function fetchMyLikes(postIds: string[], userId: string): Promise<Record<string, boolean>> {
  if (postIds.length === 0) return {};
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds)
    .eq('user_id', userId);
  if (error) return {};
  const map: Record<string, boolean> = {};
  (data || []).forEach((l: any) => {
    map[l.post_id] = true;
  });
  return map;
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId });
  }
}

export async function createPost(content: string, imageUrl: string, userId: string, videoUrl = '') {
  const { data, error } = await supabase
    .from('posts')
    .insert({ content, image_url: imageUrl, video_url: videoUrl, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchUserPosts(userId: string): Promise<PostWithProfile[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, image_url, video_url, created_at,
      profiles!posts_user_id_fkey ( id, username, display_name, bio, avatar_url, created_at )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    video_url: p.video_url || '',
    created_at: p.created_at,
    profiles: p.profiles,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  })) as PostWithProfile[];
}

export async function fetchFollowerCount(userId: string) {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followee_id', userId);
  return count || 0;
}

export async function fetchFollowingCount(userId: string) {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);
  return count || 0;
}

export async function isFollowing(followerId: string, followeeId: string) {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(followerId: string, followeeId: string, following: boolean) {
  if (following) {
    await supabase.from('follows').delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
  }
}

export async function searchProfiles(query: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function searchPosts(query: string): Promise<PostWithProfile[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, image_url, video_url, created_at,
      profiles!posts_user_id_fkey ( id, username, display_name, bio, avatar_url, created_at )
    `)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    video_url: p.video_url || '',
    created_at: p.created_at,
    profiles: p.profiles,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  })) as PostWithProfile[];
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id, user_id, post_id, content, created_at,
      profiles!comments_user_id_fkey ( id, username, display_name, avatar_url )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(postId: string, userId: string, content: string) {
  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content });
  if (error) throw error;
}

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', userId);
  if (error) return [];
  return (data || []).map((f: any) => f.followee_id as string);
}

export async function fetchReels(userId: string, limit = 30): Promise<PostWithProfile[]> {
  const followingIds = await fetchFollowingIds(userId);
  const targetIds = followingIds.length > 0 ? followingIds : [userId];
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, user_id, content, image_url, video_url, created_at,
      profiles!posts_user_id_fkey ( id, username, display_name, bio, avatar_url, created_at )
    `)
    .in('user_id', targetIds)
    .not('video_url', 'eq', '')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    image_url: p.image_url,
    video_url: p.video_url || '',
    created_at: p.created_at,
    profiles: p.profiles,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  })) as PostWithProfile[];
}
