# 🎯 START HERE - Fix Course Creation Error

> **Problem:** Getting "Missing or insufficient permissions" when creating courses
> 
> **Solution:** Deploy Firestore security rules + Set user role

---

## 🚨 The Problem

```
❌ Failed to create course: Missing or insufficient permissions
```

**Why?** Your Firestore database has no security rules configured, so it blocks all write operations by default.

---

## ✅ The Solution (3 Easy Steps)

### 📍 STEP 1: Deploy Firestore Rules

Choose ONE method:

#### Method A: Windows Batch Script ⭐ EASIEST
```bash
# Just double-click this file in Windows Explorer:
deploy-firestore-rules.bat
```

#### Method B: Command Line
```bash
firebase login
firebase deploy --only firestore:rules
```

#### Method C: Firebase Console (No CLI needed)
1. Open: https://console.firebase.google.com/project/bharatam-f3cd7/firestore
2. Click **Rules** tab
3. Copy all text from `firestore.rules` file
4. Paste in the editor
5. Click **Publish** button

---

### 📍 STEP 2: Set Your User Role

1. Open: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data
2. Click on `bharatam_users` collection
3. Find YOUR user (search by your phone number)
4. Click on your user document
5. Click **"Add field"** button
6. Add this field:
   - **Field name:** `role`
   - **Type:** string
   - **Value:** `trainer` (or `superadmin` for full access)
7. Click **"Add"**

**Your user document should look like:**
```javascript
{
  fullName: "Your Name",
  phoneNumber: "+1234567890",
  role: "trainer",  // ← ADD THIS!
  email: "you@example.com"
}
```

---

### 📍 STEP 3: Start Both Servers

#### Terminal 1 - Backend Server (MUST RUN for uploads):
```bash
cd server
npm install
node index.js
```

**Wait for this message:**
```
Server listening on http://localhost:4000
```

✅ **Backend ready!**

#### Terminal 2 - Frontend (open new terminal):
```bash
npm install
npm run dev
```

**Wait for this message:**
```
Local: http://localhost:5173
```

✅ **Frontend ready!**

---

## 🎬 Now Create Your Course!

### 1️⃣ Create Course
1. Login to http://localhost:5173
2. Go to **Staff Portal** or **Dashboard**
3. Click **"Create New Course"** button
4. Fill the form:
   ```
   Title: "Introduction to Vedic Math"
   Category: "Vedic Math"
   Description: "Learn the ancient art of Vedic Mathematics"
   Price: 499 (or 0 for free)
   Thumbnail: Upload an image (optional)
   ```
5. Click **"Create as Draft"**

✅ **SUCCESS! Course created!**

### 2️⃣ Upload Video
1. Find your course in the list
2. Click to expand it
3. Click **"Upload Video"** button
4. Select your video file (.mp4, .mov, etc.)
5. Enter video title: "Lesson 1 - Introduction"
6. Choose access: **Free** or **Paid**
7. Click **"Upload"**
8. Wait for progress bar to reach 100%

✅ **SUCCESS! Video uploaded to Bunny Stream!**

### 3️⃣ Upload PDF (optional)
1. Click **"Upload PDF"** button
2. Select PDF file
3. Enter title: "Course Material - Lesson 1"
4. Click **"Upload"**

✅ **SUCCESS! PDF uploaded!**

---

## 🎉 What You Just Did

```
✅ Created course in Firestore database
✅ Uploaded video to Bunny Stream CDN (676379)
✅ Uploaded PDF to Bunny Storage (bhartamproject)
✅ All files linked to your course
✅ Ready for students to enroll!
```

---

## 🔧 Troubleshooting

### ❌ Still getting permission error?

**Check 1:** Are the rules deployed?
```bash
# Go to Firebase Console
https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules

# Should show your rules with timestamp
```

**Check 2:** Do you have the role field?
```bash
# Go to Firestore data
https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data

# Find your user in bharatam_users
# Must have: role: "trainer"
```

**Check 3:** Clear cache and re-login
```bash
# In your browser:
# 1. Press Ctrl+Shift+Delete
# 2. Clear cache
# 3. Logout from app
# 4. Login again
```

---

### ❌ Backend server error?

**Is it running?**
```bash
# Check terminal shows:
Server listening on http://localhost:4000

# Or open in browser:
http://localhost:4000
# Should show: "Bunny upload proxy running"
```

**Not running?**
```bash
cd server
npm install
node index.js
```

---

### ❌ Video upload fails?

**Check 1:** Backend server MUST be running
```bash
# Terminal should show:
Server listening on http://localhost:4000
```

**Check 2:** Check .env file has Bunny credentials
```env
VITE_BUNNY_VIDEO_LIBRARY_ID=676379
VITE_BUNNY_STREAM_API_KEY=e7fe790c-05ab-4cc7-8aa0fe8cefb6-b71c-4c12
```

**Check 3:** Look at browser console
```bash
# Press F12 in browser
# Check Console tab for errors
```

---

### ❌ Can't see my course?

**For Trainers:**
- Only YOUR courses are visible (where trainerId = your uid)
- Check course status: "Draft", "Pending", or "Approved"

**For Students:**
- Only "Approved" courses are visible
- Draft and Pending courses are hidden

**Check Firestore:**
```bash
# Go to:
https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data

# Navigate to: bharatam_courses
# Find your course document
# Check: trainerId matches your uid
# Check: status field value
```

---

## 📚 Documentation Files

| File | What's Inside |
|------|---------------|
| ⭐ `START_HERE.md` | This file - Quick start guide |
| 📘 `QUICK_START.md` | Fast 3-step instructions |
| 📕 `README_SETUP.md` | Complete solution overview |
| 📗 `FIX_PERMISSIONS_ERROR.md` | Detailed troubleshooting |
| 📙 `FIRESTORE_SETUP.md` | Database configuration |

---

## ⚡ Quick Commands

```bash
# Check if everything is set up correctly
check-setup.bat

# Deploy Firestore rules
deploy-firestore-rules.bat

# Start backend
cd server && node index.js

# Start frontend (new terminal)
npm run dev
```

---

## 🎯 Success Checklist

After following this guide:

- [ ] ✅ Firestore rules deployed
- [ ] ✅ User role set to "trainer" in Firestore
- [ ] ✅ Backend server running (port 4000)
- [ ] ✅ Frontend running (port 5173)
- [ ] ✅ Can login to application
- [ ] ✅ "Create Course" button works
- [ ] ✅ Course appears in list
- [ ] ✅ Can upload video
- [ ] ✅ Video shows in course
- [ ] ✅ Can preview video

---

## 🚀 You're Ready!

Your platform can now:

```
✅ Create unlimited courses
✅ Upload videos to Bunny Stream CDN
✅ Upload PDFs to Bunny Storage
✅ Manage course content
✅ Approve/reject content (if super admin)
✅ Track earnings and students
```

**Go create your first course! 🎓**

---

## 💡 Pro Tips

1. **Keep backend running** - It's needed for ALL file uploads (thumbnails, videos, PDFs)
2. **Use descriptive titles** - Makes courses easy to find
3. **Add thumbnails** - Courses with images get more clicks
4. **Mark free content** - Helps attract students
5. **Test before publishing** - Create draft → upload content → review → publish

---

## 🆘 Still Need Help?

1. **Run the setup checker:**
   ```bash
   check-setup.bat
   ```

2. **Check browser console:**
   - Press `F12`
   - Click `Console` tab
   - Look for red errors

3. **Check backend terminal:**
   - Look for error messages
   - Should show "Server listening on http://localhost:4000"

4. **Check Firebase Console:**
   - Rules: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules
   - Data: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data
   - Usage: https://console.firebase.google.com/project/bharatam-f3cd7/firestore/usage

5. **Read detailed guides:**
   - Start with `QUICK_START.md`
   - Then check `FIX_PERMISSIONS_ERROR.md`

---

## 🎊 That's It!

You now have:
- ✅ Fixed permission error
- ✅ Configured security rules
- ✅ Set up user roles
- ✅ Enabled course creation
- ✅ Enabled video upload to Bunny Stream
- ✅ Enabled PDF upload to Bunny Storage

**Your e-learning platform is ready to go! 🚀**

---

*Need to start over? Just follow these 3 steps again:*
*1. Deploy rules → 2. Set user role → 3. Start servers*

**Happy teaching! 🎓✨**
