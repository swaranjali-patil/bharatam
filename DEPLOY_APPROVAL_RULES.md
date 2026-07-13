# 🚀 DEPLOY: Video Approval Workflow Rules

## 📋 What This Does

After deploying these rules, your platform will have a complete approval workflow:

1. ✅ Trainer uploads video → **`approved: false`** (pending)
2. ✅ Video is **HIDDEN from students**
3. ✅ Super Admin reviews and approves → **`approved: true`**
4. ✅ Video becomes **VISIBLE to students**

---

## ⚡ DEPLOY NOW (2 minutes)

### STEP 1: Open Firebase Console

**Click:** https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules

---

### STEP 2: Replace Rules

1. **Select ALL** text in the rules editor (Ctrl + A)

2. **Delete** it

3. **Open** the file: `firestore_with_approval.rules`
   - Location: `C:\Users\Administrator\Desktop\E-learning\elearning-app\Bhartam\firestore_with_approval.rules`

4. **Copy ALL** text from that file (Ctrl + A, Ctrl + C)

5. **Paste** into Firebase Console (Ctrl + V)

6. **Click** the blue **"Publish"** button

7. **Wait** for "Rules published successfully" message

✅ **DONE!** Approval workflow is now active!

---

## 📊 What Changed

### BEFORE (Old Rules):
```javascript
match /videos/{videoId} {
  allow read: if isSignedIn();  // ❌ Everyone sees ALL videos!
}
```
**Problem:** Students see ALL videos, even pending ones!

---

### AFTER (New Rules):
```javascript
match /videos/{videoId} {
  allow read: if isSignedIn() && 
                 (
                   // Video is approved ✅
                   resource.data.approvalStatus == 'approved' || 
                   resource.data.status == 'approved' ||
                   
                   // OR user is the trainer (can see own pending videos) ✅
                   get(...).data.trainerId == request.auth.uid ||
                   
                   // OR user is super admin (can see all) ✅
                   isAdmin() || isSuperAdmin()
                 );
}
```
**Solution:** Students ONLY see approved videos! ✅

---

## 🔍 Verification

### Test 1: Upload Video as Trainer

1. **Login** as trainer
2. **Upload a video**
3. **Check video status:** Should show "Pending"
4. ✅ **Expected:** Trainer can see the video (in "My Videos")

---

### Test 2: Check as Student

1. **Login** as student (or open incognito window)
2. **Go to the course**
3. ✅ **Expected:** The pending video is **NOT visible**

---

### Test 3: Approve as Super Admin

1. **Login** as super admin
2. **Go to "Approvals" tab**
3. **Find the pending video**
4. **Click "Approve"**
5. ✅ **Expected:** Status changes to "Approved"

---

### Test 4: Check as Student Again

1. **Go back to student view**
2. **Refresh the page**
3. ✅ **Expected:** The video is **NOW visible**!
4. **Click play**
5. ✅ **Expected:** Video plays successfully

---

## 📋 Who Can See What

### Students:
- ✅ Can see: Approved videos only
- ❌ Cannot see: Pending videos
- ❌ Cannot see: Rejected videos

### Trainers:
- ✅ Can see: Their own videos (all statuses)
- ✅ Can see: Pending, Approved, Rejected
- ✅ Can upload: New videos (start as pending)

### Super Admin:
- ✅ Can see: ALL videos (any status, any trainer)
- ✅ Can approve: Any video
- ✅ Can reject: Any video
- ✅ Can delete: Any video

---

## 🎯 Video Status Flow

```
1. UPLOAD (Trainer)
   ↓
   status: "pending"
   approvalStatus: "pending"
   ↓
   Visible to: Trainer + Super Admin only
   Hidden from: Students ❌

2. APPROVE (Super Admin)
   ↓
   status: "approved"
   approvalStatus: "approved"
   approvedAt: [timestamp]
   ↓
   Visible to: Everyone ✅
   Students can now watch! ✅

3. REJECT (Super Admin)
   ↓
   status: "rejected"
   approvalStatus: "rejected"
   ↓
   Visible to: Trainer + Super Admin only
   Hidden from: Students ❌
```

---

## 🔐 Security Rules Logic

### For Video Read Access:

The rule checks in this order:

1. **Is video approved?**
   ```javascript
   resource.data.approvalStatus == 'approved'
   ```
   If YES → ✅ Allow read (students can see)

2. **Is user the course trainer?**
   ```javascript
   get(...).data.trainerId == request.auth.uid
   ```
   If YES → ✅ Allow read (trainer can see their own pending videos)

3. **Is user super admin?**
   ```javascript
   isAdmin() || isSuperAdmin()
   ```
   If YES → ✅ Allow read (admin can see all videos)

4. **Otherwise:**
   If NO to all → ❌ Deny read (video is hidden)

---

## 📊 Example Scenario

### Scenario: Math Course with 3 Videos

**Course:** "Introduction to Vedic Math"

**Videos:**
```
1. "Lesson 1 - Basics"
   - status: "approved" ✅
   - Uploaded: June 1

2. "Lesson 2 - Advanced"
   - status: "pending" ⏳
   - Uploaded: June 5

3. "Lesson 3 - Practice"
   - status: "rejected" ❌
   - Uploaded: June 4
```

### What Each User Sees:

**Student View:**
```
Introduction to Vedic Math
├─ 📹 Lesson 1 - Basics ✅ [Play]
└─ (Only shows approved videos)
```

**Trainer View:**
```
Introduction to Vedic Math
├─ 📹 Lesson 1 - Basics ✅ (Approved)
├─ 📹 Lesson 2 - Advanced ⏳ (Pending Approval)
└─ 📹 Lesson 3 - Practice ❌ (Rejected - needs revision)
```

**Super Admin View:**
```
Pending Approvals:
├─ 📹 Lesson 2 - Advanced (Course: Vedic Math)
    [Preview] [Approve] [Reject]
```

---

## ✅ Checklist

After deploying rules:

- [ ] Rules deployed to Firebase Console
- [ ] Saw "Published successfully" message
- [ ] Tested trainer upload (video shows as pending)
- [ ] Tested student view (pending video is hidden)
- [ ] Tested super admin approval
- [ ] Tested student view again (approved video now visible)
- [ ] Video plays correctly

---

## 🎉 Result

After deployment:

✅ Trainers can upload videos freely
✅ Videos start as "pending" (hidden from students)
✅ Super Admin reviews and approves
✅ Only approved videos are visible to students
✅ Quality control before student access
✅ Professional content moderation workflow

---

## 🔧 Troubleshooting

### Problem: Students can still see pending videos

**Solution:**
1. Check rules are published (Firebase Console → Rules)
2. Clear browser cache
3. Logout and login again
4. Check video `approvalStatus` field in Firestore (must be 'approved')

---

### Problem: Trainer can't see their own pending videos

**Solution:**
1. Check trainer's `uid` matches course `trainerId`
2. Check user is logged in correctly
3. Check browser console for errors

---

### Problem: Super Admin can't approve videos

**Solution:**
1. Check user has `role: "superadmin"` or `role: "admin"` in Firestore
2. Check `isSuperAdmin()` function in rules
3. Verify user is logged in as super admin

---

**Deploy the rules from `firestore_with_approval.rules` now!** 🚀

**Your approval workflow will be complete!** ✅
