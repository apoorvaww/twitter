// Above this follower count, we skip push fan-out for that author entirely —
// pushing to hundreds of thousands of Redis timelines per tweet is the
// "celebrity problem." Those tweets get merged in at read time instead
// (see timelineController.js).
export const CELEBRITY_FOLLOWER_THRESHOLD = 1000;