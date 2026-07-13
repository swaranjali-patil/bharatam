# 🎬 VIDEO APPROVAL WORKFLOW - Complete Guide

## 📋 How It Works

### Step 1: Trainer Uploads Video ✅
- Trainer uploads video from Staff Portal
- Video is saved with: **`approved: false`** (or `status: 'pending'`, `approvalStatus: 'pending'`)
- Video is **NOT visible to students** yet

### Step 2: Super Admin Reviews Video ✅
- Super Admin sees video in "Pending" section
- Reviews the video content
- Clicks "Approve" or "Reject" button

### Step 3A: Super Admin Approves ✅
- Video status changes to: **`approved: true`** (or `status: 'Approved'`, `approvalStatus: 'approved'`)
- Video is now **visible to students**

### Step 3B: Super Admin Rejects ❌
- Video status changes to: `approved: false`, `status: 'Rejected'`
- Video remains **hidden from students**

---

## 🔍 Current Implementation Status

### ✅ ALREADY WORKING:

1. **Video Upload (Trainer):**
   - ✅ Videos are uploaded with `approvalStatus: 'pending'`
   - ✅ Videos are uploaded with `status: 'pending'`
   - ✅ Code in `StaffPortal.jsx` (lines 1640-1655)

2. **Approval Interface (Super Admin):**
   - ✅ Super Admin can approve/reject videos
   - ✅ Status changes to `approvalStatus: 'approved'` or `'rejected'`
   - ✅ Code in `SuperAdminDashboard.jsx`

3. **Status Tracking:**
   - ✅ Each video has `approvalStatus` field
   - ✅ Each video has `status` field
   - ✅ Values: `'pending'`, `'approved'`, `'rejected'`

---

## 📊 Video Data Structure

### When Trainer Uploads Video:
```javascript
{
  id: "video_abc123",
  title: "Introduction to Math",
  bunnyVideoId: "guid-from-bunny",
  url: "https://iframe.mediadelivery.net/embed/...",
  contentType: "video",
  accessType: "paid",
  
  // ⭐ APPROVAL FIELDS:
  status: "pending",              // 'pending', 'approved', 'rejected'
  approvalStatus: "pending",      // 'pending', 'approved', 'rejected'
  approvedAt: null,               // Date when approved (null if not approved)
  
  createdAt: Timestamp,
  order: 1,
  isFree: false
}
```

### After Super Admin Approves:
```javascript
{
  id: "video_abc123",
  title: "Introduction to Math",
  
  // ✅ APPROVED:
  status: "approved",             // Changed from 'pending'
  approvalStatus: "approved",     // Changed from 'pending'
  approvedAt: "2026-06-05T10:30:00Z",  // Set to current date/time
  
  // ... other fields remain same
}
```

---

## 🔐 Security Rules (Need Update)

### Current Rules:
Your current rules allow **ANY authenticated user** to read videos:

```javascript
match /videos/{videoId} {
  allow read: if isSignedIn();  // ❌ Shows ALL videos to everyone!
}
```

### ✅ UPDATED RULES (Students see only approved):

Replace your video rules with this:

```javascript
match /videos/{videoId} {
  // Students can ONLY read APPROVED videos
  allow read: if isSignedIn() && 
                 (resource.data.approvalStatus == 'approved' || 
                  resource.data.status == 'approved' ||
                  resource.data.status == 'active');
  
  // Trainers can read their OWN videos (any status)
  allow read: if isSignedIn() && 
                 get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid;
  
  // Super Admin can read ALL videos
  allow read: if isSuperAdmin();
  
  // Only course owner or admin can write
  allow create, update, delete: if (isSignedIn() && 
                                     get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid) || 
                                    isAdmin() || isSuperAdmin();
}
```

---

## 🎯 Complete Security Rules Update

Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules

Find the `match /bharatam_courses/{courseId}` section and update it:

```javascript
match /bharatam_courses/{courseId} {
  // Anyone signed in can read approved courses
  allow read: if isSignedIn();
  
  // Only trainers and admins can create courses
  allow create: if isTrainer() || isAdmin() || isSuperAdmin();
  
  // Course owner or admin can update
  allow update: if (isSignedIn() && resource.data.trainerId == request.auth.uid) || 
                   isAdmin() || isSuperAdmin();
  
  // Only admin can delete courses
  allow delete: if isAdmin() || isSuperAdmin();
  
  // ✅ UPDATED: Videos subcollection
  match /videos/{videoId} {
    // Students can ONLY read APPROVED videos
    allow read: if isSignedIn() && 
                   (resource.data.approvalStatus == 'approved' || 
                    resource.data.status == 'approved' ||
                    resource.data.status == 'active' ||
                    // OR if they are the course trainer (see their own pending videos)
                    get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid ||
                    // OR if they are super admin
                    isSuperAdmin() || isAdmin());
    
    // Only course owner or admin can write
    allow create, update, delete: if (isSignedIn() && 
                                       get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid) || 
                                      isAdmin() || isSuperAdmin();
  }
  
  // ✅ UPDATED: PDFs subcollection (same logic)
  match /pdfs/{pdfId} {
    allow read: if isSignedIn() && 
                   (resource.data.approvalStatus == 'approved' || 
                    resource.data.status == 'approved' ||
                    resource.data.status == 'active' ||
                    get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid ||
                    isSuperAdmin() || isAdmin());
    
    allow create, update, delete: if (isSignedIn() && 
                                       get(/databases/$(database)/documents/bharatam_courses/$(courseId)).data.trainerId == request.auth.uid) || 
                                      isAdmin() || isSuperAdmin();
  }
  
  // Other subcollections...
}
```

---

## 🔄 Complete Workflow Example

### Example: Trainer Uploads "Lesson 1 - Introduction"

#### 1️⃣ Trainer Portal:
```
Trainer logs in
  ↓
Goes to "My Courses" → Opens course
  ↓
Clicks "Upload Video"
  ↓
Selects video file
  ↓
Enters title: "Lesson 1 - Introduction"
  ↓
Clicks "Upload"
  ↓
Video uploads to Bunny Stream
  ↓
Video saved to Firestore with:
  - status: "pending"
  - approvalStatus: "pending"
  - approvedAt: null
```

**Firebase Data:**
```javascript
bharatam_courses/courseId/videos/videoId
{
  title: "Lesson 1 - Introduction",
  status: "pending",              // ⏳ Waiting for approval
  approvalStatus: "pending",
  approvedAt: null,
  bunnyVideoId: "abc-123-guid",
  createdAt: "2026-06-05T10:00:00Z"
}
```

**Visibility:**
- ✅ Trainer can see it (in "My Videos" - status: Pending)
- ✅ Super Admin can see it (in "Pending Approvals")
- ❌ Students CANNOT see it (not approved yet)

---

#### 2️⃣ Super Admin Reviews:
```
Super Admin logs in
  ↓
Goes to "Approvals" tab
  ↓
Sees video: "Lesson 1 - Introduction" (Status: Pending)
  ↓
Clicks "Preview" to watch video
  ↓
Reviews content quality
  ↓
Clicks "Approve" button
```

**Firebase Update:**
```javascript
bharatam_courses/courseId/videos/videoId
{
  title: "Lesson 1 - Introduction",
  status: "approved",             // ✅ Changed!
  approvalStatus: "approved",     // ✅ Changed!
  approvedAt: "2026-06-05T11:00:00Z",  // ✅ Set timestamp!
  bunnyVideoId: "abc-123-guid",
  createdAt: "2026-06-05T10:00:00Z"
}
```

**Visibility:**
- ✅ Trainer can see it (status: Approved)
- ✅ Super Admin can see it (in "Approved" section)
- ✅ Students CAN NOW see it! (approved = true)

---

#### 3️⃣ Student Views Video:
```
Student logs in
  ↓
Browses courses
  ↓
Opens approved course
  ↓
Sees ONLY approved videos:
  - "Lesson 1 - Introduction" ✅ (approved)
  - "Lesson 2 - Advanced" (not visible if still pending)
  ↓
Clicks on video
  ↓
Video plays in embedded player
```

---

## 🎨 UI Indicators

### In Trainer Portal:
```
My Videos:
┌─────────────────────────────────────────┐
│ 📹 Lesson 1 - Introduction              │
│    Status: ⏳ Pending Approval          │
│    Uploaded: Jun 5, 2026                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📹 Lesson 2 - Basics                    │
│    Status: ✅ Approved                   │
│    Uploaded: Jun 4, 2026                │
└─────────────────────────────────────────┘
```

### In Super Admin Dashboard:
```
Pending Approvals:
┌─────────────────────────────────────────┐
│ 📹 Lesson 1 - Introduction              │
│    Course: Math 101                     │
│    Trainer: John Doe                    │
│    Uploaded: Jun 5, 2026                │
│    [Preview] [Approve] [Reject]         │
└─────────────────────────────────────────┘
```

### For Students:
```
Course Videos:
┌─────────────────────────────────────────┐
│ 📹 Lesson 2 - Basics                    │
│    Duration: 15 min                     │
│    [▶ Play]                             │
└─────────────────────────────────────────┘

(Pending videos are NOT shown at all!)
```

---

## ✅ Verification Checklist

- [ ] Trainer uploads video
- [ ] Video saved with `status: "pending"`
- [ ] Trainer can see video (marked as "Pending")
- [ ] Super Admin can see video in "Pending Approvals"
- [ ] Student CANNOT see video yet
- [ ] Super Admin clicks "Approve"
- [ ] Video status changes to `status: "approved"`
- [ ] Student CAN NOW see video
- [ ] Student can play video

---

## 🔧 Quick Test

### Test the Workflow:

1. **As Trainer:**
   - Login to Staff Portal
   - Upload a test video
   - Check status shows "Pending"

2. **As Super Admin:**
   - Login to Super Admin Dashboard
   - Go to "Approvals" tab
   - See the pending video
   - Click "Approve"

3. **As Student:**
   - Login to student portal
   - Browse to the course
   - Check if video is now visible
   - Play the video

---

## 📝 Field Reference

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `status` | string | `'pending'`, `'approved'`, `'rejected'`, `'active'` | Current approval status |
| `approvalStatus` | string | `'pending'`, `'approved'`, `'rejected'` | Approval workflow status |
| `approvedAt` | timestamp | `null` or Date | When video was approved |
| `createdAt` | timestamp | Date | When video was uploaded |

**Note:** Both `status` and `approvalStatus` are used for backward compatibility. Check BOTH in security rules.

---

## 🚀 Implementation Summary

### What's Already Done: ✅
1. Videos upload with `status: 'pending'`
2. Super Admin can approve/reject videos
3. Status changes to `'approved'` after approval

### What Needs Update: ⚠️
1. **Firestore Security Rules** - Add approval check for student read access
2. **Student Portal** - Ensure it only queries/displays approved videos

### Update Security Rules Now:

Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules

Update the videos match block as shown in the "Complete Security Rules Update" section above.

Click "Publish".

✅ **Done! Students will only see approved videos!** 🎉
