# Video Fields Quick Reference

## 📋 Video Document Structure

Location: `bharatam_courses/{courseId}/videos/{videoId}`

### 15 Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| **approvalStatus** | `string` | Approval workflow status | `"approved"`, `"pending"`, `"rejected"` |
| **approvedAt** | `Date \| null` | When video was approved | `Date` or `null` |
| **bunnyVideoId** | `string` | Bunny.net video ID or embed URL | `"abc-123-def"` or full URL |
| **contentType** | `string` | Type of content | `"video"` or `"pdf"` |
| **createdAt** | `Date` | Creation timestamp | `new Date()` |
| **durationMinutes** | `number` | Video duration in minutes | `45` |
| **fileName** | `string` | Original file name | `"lecture-1.mp4"` |
| **isFree** | `boolean` | Free or paid content | `true` or `false` |
| **order** | `number` | Display order in course | `1`, `2`, `3`, ... |
| **status** | `string` | Current status | `"active"`, `"pending"`, `"rejected"` |
| **storageUrl** | `string` | CDN/Storage URL | Full CDN URL |
| **thumbnailUrl** | `string` | Video thumbnail URL | Full CDN URL or empty string |
| **title** | `string` | Display title | `"Introduction to Vedic Math"` |
| **updatedAt** | `Date` | Last update timestamp | `new Date()` |
| **views** | `number` | View count | `42` |

---

## 🔧 Code Examples

### Creating a New Video Document

```javascript
import { doc, setDoc, collection } from 'firebase/firestore';

const courseId = 'course123';
const videoRef = doc(collection(db, 'bharatam_courses', courseId, 'videos'));

const videoData = {
  approvalStatus: 'pending',
  approvedAt: null,
  bunnyVideoId: 'abc-123-def',
  contentType: 'video',
  createdAt: new Date(),
  durationMinutes: 45,
  fileName: 'lecture-1.mp4',
  isFree: false,
  order: 1,
  status: 'pending',
  storageUrl: 'https://cdn.example.com/video.mp4',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  title: 'Introduction to Vedic Math',
  updatedAt: new Date(),
  views: 0
};

await setDoc(videoRef, videoData);
```

### Reading Video Data (Backward Compatible)

```javascript
import { getDocs, collection } from 'firebase/firestore';

const videosSnap = await getDocs(collection(db, 'bharatam_courses', courseId, 'videos'));

const videos = videosSnap.docs.map(doc => {
  const data = doc.data();
  
  return {
    id: doc.id,
    // Use new fields with fallback to old fields for backward compatibility
    title: data.title || data.fileName || '',
    url: data.bunnyVideoId || data.storageUrl || data.url || '',
    isFree: data.isFree ?? (data.accessType === 'free') ?? false,
    contentType: data.contentType || 'video',
    status: data.status || 'pending',
    order: data.order || 0,
    views: data.views || 0,
    duration: data.durationMinutes || 0,
    thumbnail: data.thumbnailUrl || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
});
```

### Updating Video Approval Status

```javascript
import { doc, updateDoc } from 'firebase/firestore';

const videoRef = doc(db, 'bharatam_courses', courseId, 'videos', videoId);

await updateDoc(videoRef, {
  approvalStatus: 'approved',
  approvedAt: new Date(),
  status: 'active',
  updatedAt: new Date()
});
```

### Incrementing View Count

```javascript
import { doc, updateDoc, increment } from 'firebase/firestore';

const videoRef = doc(db, 'bharatam_courses', courseId, 'videos', videoId);

await updateDoc(videoRef, {
  views: increment(1),
  updatedAt: new Date()
});
```

---

## ❌ Deprecated Fields (Do Not Use)

These fields have been removed. Use the new fields instead:

| Old Field | Use Instead | Notes |
|-----------|-------------|-------|
| `id` | `doc.id` | Document ID is available from Firestore |
| `url` | `bunnyVideoId` + `storageUrl` | Separated video ID from storage URL |
| `accessType` | `isFree` | Boolean is clearer than string enum |
| `addedAt` | `createdAt` | Consistent naming with Firestore conventions |
| `moduleId` | ❌ Removed | Feature not implemented |
| `price` | ❌ Removed | Use course-level pricing instead |

---

## 🎯 Common Patterns

### 1. Free vs Paid Content

```javascript
// Set as free
isFree: true

// Set as paid
isFree: false

// Check if free (backward compatible)
const isFree = data.isFree ?? (data.accessType === 'free') ?? false;
```

### 2. Video Playback URL

```javascript
// For Bunny.net videos
const playbackUrl = data.bunnyVideoId || data.storageUrl;

// With fallback for old format
const playbackUrl = data.bunnyVideoId || data.storageUrl || data.url || '';
```

### 3. Approval Workflow

```javascript
// Pending (newly uploaded)
{
  approvalStatus: 'pending',
  approvedAt: null,
  status: 'pending'
}

// Approved
{
  approvalStatus: 'approved',
  approvedAt: new Date(),
  status: 'active'
}

// Rejected
{
  approvalStatus: 'rejected',
  approvedAt: null,
  status: 'rejected'
}
```

### 4. Display Order

```javascript
// Get next order number
const getNextOrder = (videos) => {
  const maxOrder = videos.reduce((max, v) => 
    Math.max(max, v.order || 0), 0
  );
  return maxOrder + 1;
};

// Usage
const newOrder = getNextOrder(existingVideos);
```

---

## 🔍 Firestore Security Rules

```javascript
// In firestore.rules
match /bharatam_courses/{courseId}/videos/{videoId} {
  // Allow reading approved videos
  allow read: if resource.data.status == 'active' || 
                 resource.data.approvalStatus == 'approved';
  
  // Allow trainer to read their own videos
  allow read: if isAuthenticated() && 
                 get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid;
  
  // Allow superadmin full access
  allow read, write: if isSuperAdmin();
  
  // Allow trainer to write their own videos
  allow write: if isAuthenticated() && 
                  get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid;
}
```

---

## 📊 Firestore Indexes

Recommended indexes for common queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "videos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "videos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "approvalStatus", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "videos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "contentType", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🧪 Testing

### Unit Test Example

```javascript
describe('Video Document', () => {
  it('should have all required fields', () => {
    const video = createVideoDocument({
      title: 'Test Video',
      fileName: 'test.mp4',
      bunnyVideoId: 'test-123',
      storageUrl: 'https://cdn.test.com/video.mp4'
    });
    
    expect(video).toHaveProperty('approvalStatus');
    expect(video).toHaveProperty('approvedAt');
    expect(video).toHaveProperty('bunnyVideoId');
    expect(video).toHaveProperty('contentType');
    expect(video).toHaveProperty('createdAt');
    expect(video).toHaveProperty('durationMinutes');
    expect(video).toHaveProperty('fileName');
    expect(video).toHaveProperty('isFree');
    expect(video).toHaveProperty('order');
    expect(video).toHaveProperty('status');
    expect(video).toHaveProperty('storageUrl');
    expect(video).toHaveProperty('thumbnailUrl');
    expect(video).toHaveProperty('title');
    expect(video).toHaveProperty('updatedAt');
    expect(video).toHaveProperty('views');
    
    // Should not have deprecated fields
    expect(video).not.toHaveProperty('id');
    expect(video).not.toHaveProperty('url');
    expect(video).not.toHaveProperty('accessType');
    expect(video).not.toHaveProperty('moduleId');
  });
});
```

---

## 🚨 Common Mistakes

### ❌ Don't Do This
```javascript
// Using deprecated fields
const video = {
  url: 'video-url',           // Use bunnyVideoId instead
  accessType: 'free',         // Use isFree: true instead
  addedAt: new Date(),        // Use createdAt instead
  id: videoId                 // Don't store document ID in document
};
```

### ✅ Do This Instead
```javascript
// Using correct fields
const video = {
  bunnyVideoId: 'video-guid',
  storageUrl: 'cdn-url',
  isFree: true,
  createdAt: new Date(),
  // Document ID is available as doc.id
};
```

---

## 📚 Related Documentation

- [VIDEO_FIELDS_CLEANUP.md](./VIDEO_FIELDS_CLEANUP.md) - Cleanup script documentation
- [VIDEO_FIELDS_CHANGES_SUMMARY.md](./VIDEO_FIELDS_CHANGES_SUMMARY.md) - Complete change summary
- [firestore.rules](./firestore.rules) - Security rules
- [migrate.js](./migrate.js) - Migration script

---

**Quick Links**:
- Run Cleanup: `node cleanup-video-fields.js`
- View Structure: This document
- Security Rules: `firestore.rules`

**Last Updated**: June 5, 2026
