/*
# Add video_url to posts (Reels support)

1. Modified Tables
- `posts` — added `video_url` (text, default empty string) so posts can optionally carry a video for the Reels feed.

2. Security
- No policy changes. Existing owner-scoped RLS policies on `posts` already cover the new column (column-level privileges are not restricted).

3. Notes
- The column is nullable-via-default (empty string) so existing rows and inserts that omit it are unaffected.
- Reels feed = posts from followed users where `image_url` OR `video_url` is non-empty.
*/

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS video_url text DEFAULT '';
