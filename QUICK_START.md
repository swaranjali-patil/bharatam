# 🚀 Quick Start - Fix Course Creation & Video Upload

## ⚡ TL;DR - 3 Steps to Fix

```bash
# Step 1: Deploy Firestore rules
firebase deploy --only firestore:rules

# Step 2: Start backend server (keep running)
cd server
node index.js

# Step 3: Start frontend (new terminal)
npm run dev
```

Then verify your user role in Firebase Console and you're done! ✅

---

## 📝 Detailed Instructions

### Step 1️⃣: Fix Firestore Permissions

**Using Windows Batch Script (Easiest):**
```bash
# Double-click this file:
deploy-firestore-rules.bat
```

**Using Firebase CLI manually:**
```bash
firebase login
firebase deploy --only firestore:rules
```

**Using Firebase Console (No CLI needed):**
1. Go to https://console.firebase.google.com/project/bharatam-f3cd7/firestore
2. Click "Rules" tab
3. Copy contents from `firestore.rules` file
4. Paste and click "Publish"

### Step 2️⃣: Set Your User Role

1. Go to https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data
2. Open `bharatam_users` collection
3. Find your user document (by phone/email)
4. Add or edit the `role` field:
   - For trainers: `role: "trainer"`
   - For super admin: `role: "superadmin"`

### Step 3️⃣: Start Both Servers

**Terminal 1 - Backend (Required for uploads):**
```bash
cd server
npm install  # First time only
node index.js
```
Wait for: `Server listening on http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
npm install  # First time only
npm run dev
```
Wait for: `Local: http://localhost:5173`

---

## 🎬 How to Create Course & Upload Video

### Creating a Course

1. **Login** to your app
2. Go to **Staff Portal** or **Dashboard**
3. Click **"Create New Course"**
4. Fill in:
   - Title: "My First Course"
   - Category: Select from dropdown
   - Description: Course details
   - Price: Enter amount (or 0 for free)
   - Thumbnail: Upload image (optional)
5. Click **"Create as Draft"**

✅ **Course created!**

### Uploading Video

1. **Find your course** in the list
2. Click on it to view details
3. Click **"Upload Video"** button
4. In the upload form:
   - **File**: Select your video (.mp4, .mov, etc.)
   - **Title**: "Introduction to Course"
   - **Access**: Free or Paid
5. Click **"Upload"**
6. Wait for upload progress to complete

✅ **Video uploaded to Bunny Stream!**

The video is now:
- Stored on Bunny.net CDN
- Linked to your course in Firestore
- Ready to play with embedded player

### Uploading PDF

1. Click **"Upload PDF"** button
2. Select PDF file
3. Add title and access type
4. Click **"Upload"**

✅ **PDF uploaded to Bunny Storage!**

---

## 🔧 Quick Troubleshooting

### ❌ "Missing or insufficient permissions"
→ Deploy Firestore rules (Step 1 above)
→ Check your user role in Firestore (Step 2 above)
→ Logout and login again

### ❌ "Backend server not running"
→ Start backend: `cd server && node index.js`
→ Should see: `Server listening on http://localhost:4000`

### ❌ Video upload fails
→ Check backend server is running
→ Check `.env` file has Bunny credentials
→ Check browser console for errors

### ❌ Course created but can't see it
→ If you're a trainer: Check `trainerId` matches your `uid`
→ If you're a student: Only approved courses are visible
→ Check course status in Firestore

---

## 📊 What You Get

### Security Rules Allow:

**Trainers can:**
- ✅ Create courses
- ✅ Upload videos/PDFs to their courses
- ✅ Edit their own courses
- ✅ Submit courses for review

**Super Admin can:**
- ✅ See all courses (any status)
- ✅ Approve/reject courses
- ✅ Manage all content
- ✅ Manage categories & ads

**Students can:**
- ✅ View approved courses
- ✅ Enroll in courses
- ❌ Cannot see draft courses

---

## 📁 Files Created

✅ `firestore.rules` - Security rules for Firestore
✅ `firebase.json` - Firebase configuration
✅ `firestore.indexes.json` - Database indexes
✅ `deploy-firestore-rules.bat` - Deployment script
✅ `check-setup.bat` - Setup verification script
✅ `FIX_PERMISSIONS_ERROR.md` - Detailed guide
✅ `FIRESTORE_SETUP.md` - Setup instructions
✅ `QUICK_START.md` - This file

---

## 🎯 Verification Checklist

After setup, verify:

- [ ] Firestore rules deployed (no error in Firebase Console)
- [ ] User has `role: "trainer"` or `role: "superadmin"` in Firestore
- [ ] Backend server running on port 4000
- [ ] Frontend running on port 5173
- [ ] Can login to application
- [ ] Can click "Create Course" button
- [ ] Course creation succeeds (no permission error)
- [ ] Course appears in course list
- [ ] Can click "Upload Video"
- [ ] Video upload succeeds
- [ ] Video appears in course media list

---

## 🆘 Need Help?

**Run the setup checker:**
```bash
check-setup.bat
```

**Check logs:**
- Backend server terminal for upload errors
- Browser console (F12) for frontend errors
- Firebase Console → Firestore → Usage for rule evaluation

**Read detailed guides:**
- `FIX_PERMISSIONS_ERROR.md` - Complete troubleshooting
- `FIRESTORE_SETUP.md` - Firestore configuration details

**Common files to check:**
- `.env` - Bunny.net credentials
- `firestore.rules` - Security rules
- `server/index.js` - Backend upload proxy

---

## 🎉 Success!

Once everything is set up, you'll be able to:

1. ✅ Create courses with thumbnails
2. ✅ Upload videos to Bunny Stream
3. ✅ Upload PDFs to Bunny Storage
4. ✅ Manage course content
5. ✅ Submit courses for approval
6. ✅ Track earnings and students

**Happy teaching! 🎓**
