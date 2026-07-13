# Fix: "Missing or insufficient permissions" Error

## 🔴 Problem
When trying to create a course, you get this error:
```
Failed to create course: Missing or insufficient permissions
```

## ✅ Root Cause
Your **Firestore security rules** are blocking write operations. By default, Firebase Firestore denies all read/write access unless you explicitly allow it in the security rules.

## 🚀 Quick Fix (3 Steps)

### Step 1: Deploy Firestore Security Rules

**Option A: Using the Batch Script (Easiest on Windows)**
```bash
# Double-click this file in Windows Explorer:
deploy-firestore-rules.bat

# OR run from command prompt:
.\deploy-firestore-rules.bat
```

**Option B: Manual Command**
```bash
# Make sure you have Firebase CLI installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy the rules
firebase deploy --only firestore:rules
```

**Option C: Firebase Console (No CLI needed)**
1. Go to: https://console.firebase.google.com/
2. Select project: **bharatam-f3cd7**
3. Click **Firestore Database** → **Rules** tab
4. Copy contents from `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Step 2: Verify Your User Role in Firestore

Your user account needs the correct role to create courses:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/bharatam-f3cd7/firestore
   
2. **Find your user document**
   - Open the `bharatam_users` collection
   - Find your user by phone number or email
   
3. **Check/Add the role field**
   
   For **Trainers** (can create courses):
   ```json
   {
     "role": "trainer",
     "fullName": "Your Name",
     "phoneNumber": "+1234567890"
   }
   ```
   
   OR for **Super Admin** (full access):
   ```json
   {
     "role": "superadmin",
     "isSuperAdmin": true,
     "fullName": "Admin Name",
     "phoneNumber": "+1234567890"
   }
   ```

4. **If the field doesn't exist, add it**
   - Click on your user document
   - Click "Add field"
   - Field name: `role`
   - Value: `trainer` (or `superadmin`)
   - Click "Add"

### Step 3: Start Both Servers

**Terminal 1 - Backend Server (MUST be running for uploads):**
```bash
cd server
node index.js
```
You should see:
```
Server listening on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🎯 Complete Workflow

Once setup is complete, here's how to create a course with video:

### 1. Create a Course

1. Login to your application
2. Navigate to Staff Portal / Dashboard
3. Click **"Create New Course"** button
4. Fill in the form:
   - **Title**: e.g., "Vedic Mathematics Basics"
   - **Category**: Select from dropdown (e.g., "Vedic Math")
   - **Description**: Course description
   - **Price**: e.g., "499" (or leave "0" for free)
   - **Thumbnail** (optional): Upload course thumbnail image
5. Click **"Create as Draft"** or **"Publish"**

✅ **Course created successfully!**

### 2. Upload Video to Course

After creating the course:

1. Find your course in the course list
2. Click on the course card to expand it
3. Click **"Upload Video"** or **"Add Content"** button
4. In the upload form:
   - **Select File**: Click to choose your video file (.mp4, .mov, etc.)
   - **Title**: Give your video a title (e.g., "Introduction to Vedic Math")
   - **Access Type**: 
     - Choose "Free" if you want it accessible to all
     - Choose "Paid" if only enrolled students can view
5. Click **"Upload"**
6. Wait for the upload to complete (progress bar will show)

✅ **Video uploaded to Bunny Stream!**

The video will be:
- ✅ Uploaded to Bunny.net Stream CDN
- ✅ Saved to Firestore with the course
- ✅ Available for playback with embedded player

### 3. Upload PDF to Course

Similar process for PDFs:

1. Click **"Upload PDF"** button
2. Select your PDF file
3. Add title and access type
4. Click **"Upload"**

✅ **PDF uploaded to Bunny Storage and linked to course!**

## 📋 What the New Rules Allow

### For Trainers (role: "trainer" or "staff"):
- ✅ Create new courses (with their trainerId)
- ✅ Read their own courses (any status)
- ✅ Update their own courses
- ✅ Delete their own courses
- ✅ Upload videos/PDFs/images to their courses
- ✅ Manage all media in their courses
- ❌ Cannot see other trainers' draft courses
- ❌ Cannot modify other trainers' courses

### For Super Admin (role: "superadmin" or isSuperAdmin: true):
- ✅ Read ALL courses (any status)
- ✅ Update ANY course (approve/reject)
- ✅ Delete ANY course
- ✅ Manage all media for any course
- ✅ Manage categories
- ✅ Manage advertisements
- ✅ View all users
- ✅ Full system access

### For Regular Users/Students:
- ✅ Read APPROVED courses only
- ✅ Read their own profile
- ✅ Update their own profile
- ✅ Create enrollment/payment records
- ❌ Cannot see draft or pending courses
- ❌ Cannot create courses

## 🔧 Troubleshooting

### Issue 1: Still getting permission error after deploying rules
**Solution:**
1. Clear browser cache and cookies
2. Logout and login again
3. Wait 30 seconds (rules take time to propagate)
4. Verify your user document has the `role` field set correctly
5. Check Firebase Console → Firestore → Usage tab for rule evaluation details

### Issue 2: "Backend server not running" error during video upload
**Solution:**
```bash
cd server
npm install
node index.js
```
Make sure you see: `Server listening on http://localhost:4000`

### Issue 3: Thumbnail upload fails
**Solution:**
1. Ensure backend server is running (see above)
2. Check that `.env` file has all Bunny.net credentials:
   ```env
   VITE_BUNNY_STORAGE_ZONE=bhartamproject
   VITE_BUNNY_STORAGE_ENDPOINT=https://storage.bunnycdn.com
   VITE_BUNNY_ACCESS_KEY=ee76b2b6-6b5a-418c-9afbe57e1282-1cfa-42d7
   VITE_BUNNY_CDN_URL=https://bhartamproject.b-cdn.net
   ```
3. Test backend: Open http://localhost:4000 in browser (should show "Bunny upload proxy running")

### Issue 4: Video uploaded but not showing
**Solution:**
1. Check browser console for errors
2. Verify video was uploaded to Bunny.net dashboard
3. Check Firestore to see if video document was created in subcollection
4. Make sure video status is not "Rejected" (check with Super Admin)

### Issue 5: Course created but can't see it
**Solution:**
1. If you're a trainer: Check that the course `trainerId` matches your user `uid`
2. If you're a student: Only approved courses are visible to students
3. Check course status in Firestore (should be "Draft", "Pending Review", or "Approved")

## 📊 Data Structure

### Course Document Structure:
```javascript
bharatam_courses/{courseId}
  ├── id: "auto-generated"
  ├── title: "Course Title"
  ├── description: "Course description"
  ├── category: "Vedic Math"
  ├── price: "499"
  ├── thumbnail: "https://cdn.url/image.jpg"
  ├── trainerId: "user_uid_here"
  ├── trainerName: "Trainer Name"
  ├── status: "Draft" | "Pending Review" | "Approved" | "Rejected"
  ├── approvalStatus: "draft" | "pending" | "approved" | "rejected"
  ├── createdAt: Timestamp
  │
  ├── videos/ (subcollection)
  │   └── {videoId}
  │       ├── title: "Video Title"
  │       ├── bunnyVideoId: "guid-from-bunny"
  │       ├── url: "embed-url"
  │       ├── contentType: "video"
  │       ├── accessType: "free" | "paid"
  │       ├── status: "Pending" | "Approved" | "Rejected"
  │       └── createdAt: Timestamp
  │
  └── pdfs/ (subcollection)
      └── {pdfId}
          ├── title: "PDF Title"
          ├── storageUrl: "https://cdn.url/file.pdf"
          ├── contentType: "pdf"
          ├── accessType: "free" | "paid"
          ├── status: "Pending" | "Approved"
          └── createdAt: Timestamp
```

## ✨ Testing Checklist

After deployment, test these scenarios:

- [ ] Login as trainer
- [ ] Create a new course (with thumbnail)
- [ ] Course appears in course list
- [ ] Upload a video to the course
- [ ] Video appears in course media list
- [ ] Upload a PDF to the course
- [ ] PDF appears in course media list
- [ ] Submit course for review (status → "Pending Review")
- [ ] Login as Super Admin (if you have that role)
- [ ] See all courses including pending ones
- [ ] Approve a course
- [ ] Approve individual videos/PDFs

## 🎓 Complete Setup Commands

Run these in order:

```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Deploy Firestore rules
firebase deploy --only firestore:rules

# 4. Start backend server (Terminal 1)
cd server
npm install
node index.js

# 5. Start frontend (Terminal 2 - new terminal window)
npm run dev
```

## 📞 Need More Help?

1. **Check Firebase Console Logs:**
   - Go to: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/usage
   - Look at "Rules evaluation" to see which rule is blocking

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for red error messages
   - Share the full error message for debugging

3. **Verify Server Status:**
   - Backend: http://localhost:4000 (should show text)
   - Frontend: http://localhost:5173 (your app)

4. **Database Check:**
   - Go to Firestore Console
   - Check `bharatam_users` collection → find your user → verify `role` field
   - Check `bharatam_courses` collection → see if courses are being created

## 🔐 Security Notes

- ✅ Bunny.net API keys are kept secure on backend server
- ✅ Firestore rules prevent unauthorized access
- ✅ Users can only modify their own content
- ✅ Super Admin has audit trail of all changes
- ⚠️ Never commit `.env` files to Git (already in `.gitignore`)

---

**You're all set! 🎉**

Now you can create courses, upload videos to Bunny Stream, and manage your e-learning platform!
