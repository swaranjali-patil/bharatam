# Video Fields Cleanup Script

## Overview
This script cleans up the video documents in the `bharatam_courses/{courseId}/videos` subcollection by removing all fields except the specified ones.

## Fields That Will Be Kept
Only these 15 fields will remain in each video document:

1. `approvalStatus` - Approval status (approved/pending/rejected)
2. `approvedAt` - Timestamp when video was approved
3. `bunnyVideoId` - Bunny.net video ID or playback URL
4. `contentType` - Type of content (video/pdf)
5. `createdAt` - Creation timestamp
6. `durationMinutes` - Video duration in minutes
7. `fileName` - Original file name
8. `isFree` - Whether video is free or paid
9. `order` - Display order in the course
10. `status` - Current status (active/pending)
11. `storageUrl` - Storage/CDN URL
12. `thumbnailUrl` - Video thumbnail URL
13. `title` - Video title
14. `updatedAt` - Last update timestamp
15. `views` - View count

## Fields That Will Be Removed
Any other fields present in the video documents will be deleted, including but not limited to:
- `id` (duplicate of document ID)
- `url` (replaced by bunnyVideoId)
- `accessType` (replaced by isFree)
- `addedAt` (replaced by createdAt)
- `moduleId` (if exists)
- `price` (if exists)
- Any other legacy or compatibility fields

## How to Run

### Prerequisites
Make sure you have Node.js installed and the Firebase dependencies are available.

### Steps

1. **Open terminal/command prompt** in the project directory:
   ```cmd
   cd c:\Users\Administrator\Desktop\E-learning\elearning-app\Bhartam
   ```

2. **Run the cleanup script**:
   ```cmd
   node cleanup-video-fields.js
   ```

3. **Review the output** - The script will show:
   - Each course being processed
   - Each video being cleaned
   - Fields being removed from each video
   - Summary statistics at the end

### Expected Output
```
Starting cleanup of video fields in bharatam_courses...
Keeping only these fields: approvalStatus, approvedAt, bunnyVideoId, contentType, createdAt, durationMinutes, fileName, isFree, order, status, storageUrl, thumbnailUrl, title, updatedAt, views

Found 3 courses to process.

Processing course: Vedic Math Basics (course1)
  Found 2 video(s)
    Processing video "Introduction Video" (video123)
      Fields to remove: id, url, accessType, addedAt
      ✓ Removed 4 field(s)
    ✓ Video "Chapter 1" - Already clean (no fields to remove)

Processing course: Advanced Science (course2)
  No videos found in this course.

============================================================
CLEANUP COMPLETED SUCCESSFULLY!
============================================================
Total videos processed: 5
Total fields removed: 12

All video documents now contain ONLY these fields:
approvalStatus, approvedAt, bunnyVideoId, contentType, createdAt, durationMinutes, fileName, isFree, order, status, storageUrl, thumbnailUrl, title, updatedAt, views
```

## Safety Features

- **Non-destructive for allowed fields**: Only removes fields NOT in the allowed list
- **Preserves video functionality**: All essential fields for video playback and management are kept
- **Detailed logging**: Shows exactly what's being removed from each video
- **Already clean detection**: Skips videos that already have only the allowed fields

## After Running

Once the script completes:

1. ✅ All video documents will have a clean, consistent structure
2. ✅ Only the 15 specified fields will remain
3. ✅ Legacy and duplicate fields will be removed
4. ✅ Your video playback and management features will continue to work normally

## Backup Recommendation

**Important**: While this script is designed to be safe, it's always good practice to:
1. Back up your Firestore database before running cleanup scripts
2. Test on a development/staging environment first if available
3. Run the script during low-traffic periods

## Troubleshooting

### Error: "Firebase dependencies not found"
Run: `npm install`

### Error: "Permission denied"
- Check your Firestore security rules
- Ensure the Firebase config has proper credentials
- You may need to temporarily adjust security rules to allow the cleanup

### Error: "Cannot read property of undefined"
- Some video documents may be missing required fields
- The script will continue processing other videos
- Check the error message for the specific video causing issues

## Reverting Changes

If you need to revert changes:
1. Restore from your Firestore backup
2. Or re-run the migration script to regenerate video fields from the parent course document (if applicable)

## Related Files
- `migrate.js` - Original migration script that created subcollections
- `seed.js` - Script for seeding test data
- `firestore.rules` - Security rules for video subcollections
