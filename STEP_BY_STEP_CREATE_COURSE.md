# 📚 STEP-BY-STEP GUIDE: Create Course & Upload Video

## 🎯 Complete Guide from Setup to Course Creation

---

## 🔧 PART 1: ONE-TIME SETUP (Do This First!)

### ⚡ STEP 1: Deploy Firestore Security Rules

#### 1.1 Open Firebase Console
1. Open your web browser (Chrome, Edge, Firefox)
2. Copy and paste this URL:
   ```
   https://console.firebase.google.com/project/bharatam-f3cd7/firestore/rules
   ```
3. Press Enter
4. Login to Firebase if asked

#### 1.2 You'll See the Rules Editor
You should see a page with:
- Left sidebar with "Firestore Database"
- Tabs: Data | Rules | Indexes | Usage
- A code editor with current rules

#### 1.3 Copy the New Rules
1. On your computer, open File Explorer
2. Navigate to: `C:\Users\Administrator\Desktop\E-learning\elearning-app\Bhartam`
3. Find the file: `firestore.rules`
4. Right-click → Open with → Notepad (or VS Code)
5. Press `Ctrl + A` (select all)
6. Press `Ctrl + C` (copy)

#### 1.4 Replace Rules in Firebase Console
1. Go back to your browser (Firebase Console)
2. Click inside the rules editor
3. Press `Ctrl + A` (select all existing rules)
4. Press `Delete` (delete old rules)
5. Press `Ctrl + V` (paste new rules)
6. You should see the new rules appear

#### 1.5 Publish the Rules
1. Look at the top right of the page
2. Find the blue button that says **"Publish"**
3. Click **"Publish"**
4. Wait for confirmation message: "Rules published successfully"

✅ **DONE! Step 1 complete.**

---

### 👤 STEP 2: Add Trainer Role to Your User

#### 2.1 Open Firestore Data
1. Open a new browser tab
2. Copy and paste this URL:
   ```
   https://console.firebase.google.com/project/bharatam-f3cd7/firestore/data/~2Fbharatam_users
   ```
3. Press Enter

#### 2.2 Find Your User Document
You'll see a list of user documents. Find YOUR user by:
- Looking for your **phone number** (e.g., +1234567890)
- OR looking for your **email address**
- OR looking for your **name**

#### 2.3 Open Your User Document
1. Click on your user document (it will highlight)
2. You'll see fields like:
   - fullName
   - phoneNumber
   - email
   - uid
   - createdAt

#### 2.4 Check if "role" Field Exists

**OPTION A: If you see a field called "role"**
1. Check its value
2. If it's NOT "trainer", click on the value
3. Change it to: `trainer`
4. Click "Update"

**OPTION B: If you DON'T see a "role" field**
1. Click the **"+ Add field"** button
2. Fill in:
   - **Field**: `role`
   - **Type**: Select "string" from dropdown
   - **Value**: `trainer`
3. Click **"Add"**

#### 2.5 Verify
Your user document should now look like:
```
fullName:     "Your Name"
phoneNumber:  "+1234567890"
email:        "you@example.com"
uid:          "abc123..."
role:         "trainer"    ← THIS IS IMPORTANT!
```

✅ **DONE! Step 2 complete.**

---

### 🖥️ STEP 3: Start Backend Server

#### 3.1 Open Command Prompt
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter

#### 3.2 Navigate to Server Folder
In the command prompt, type:
```bash
cd C:\Users\Administrator\Desktop\E-learning\elearning-app\Bhartam\server
```
Press Enter

#### 3.3 Install Dependencies (First Time Only)
Type:
```bash
npm install
```
Press Enter and wait for installation to complete

#### 3.4 Start the Server
Type:
```bash
node index.js
```
Press Enter

#### 3.5 Verify Server is Running
You should see:
```
Server listening on http://localhost:4000
```

**✅ Keep this window open! DO NOT CLOSE IT!**

---

### 🌐 STEP 4: Start Frontend Application

#### 4.1 Open Another Command Prompt
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter

#### 4.2 Navigate to Project Folder
In the new command prompt, type:
```bash
cd C:\Users\Administrator\Desktop\E-learning\elearning-app\Bhartam
```
Press Enter

#### 4.3 Install Dependencies (First Time Only)
Type:
```bash
npm install
```
Press Enter and wait

#### 4.4 Start the Frontend
Type:
```bash
npm run dev
```
Press Enter

#### 4.5 Verify Frontend is Running
You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **DONE! Setup complete.**

---

## 📝 PART 2: CREATE YOUR FIRST COURSE

### 🔐 STEP 5: Login to Application

#### 5.1 Open the Application
1. Open your web browser
2. Go to: `http://localhost:5173`
3. You should see your e-learning app homepage

#### 5.2 Login
1. Click the **"Login"** or **"Sign In"** button
2. Enter your credentials:
   - Phone number or email
   - Password
3. Click **"Sign In"** or **"Login"**

#### 5.3 Navigate to Staff Portal
After logging in:
1. Look for **"Staff Portal"** or **"Dashboard"** link/button
2. Click on it
3. You should see your instructor dashboard

✅ **You're now logged in as a trainer.**

---

### ➕ STEP 6: Create a New Course

#### 6.1 Click Create Course Button
1. Look for a button that says:
   - "Create New Course" OR
   - "Add Course" OR
   - "+ Create Course"
2. Click on it

#### 6.2 A Form Will Appear
You'll see a modal/popup with fields:

---

#### 6.3 Fill in Course Title
1. Find the **"Title"** or **"Course Title"** field
2. Click in the box
3. Type your course name, for example:
   ```
   Introduction to Vedic Mathematics
   ```

---

#### 6.4 Select Category
1. Find the **"Category"** dropdown
2. Click on it
3. Select a category from the list:
   - Vedic Math
   - Science
   - History
   - English
   - Computer Science
   - Physics
   - Chemistry
   - Biology
   
   Example: Select **"Vedic Math"**

---

#### 6.5 Write Description
1. Find the **"Description"** field
2. Click in the text area
3. Type a description, for example:
   ```
   Learn the ancient art of Vedic Mathematics. 
   This course covers fundamental techniques for 
   fast mental calculation and problem-solving.
   ```

---

#### 6.6 Set Price
1. Find the **"Price"** field
2. Click in the box
3. Type a price in rupees, for example:
   ```
   499
   ```
   OR type `0` if you want it to be free

---

#### 6.7 Upload Thumbnail (Optional)
1. Find the **"Thumbnail"** section
2. Click **"Choose File"** or **"Upload Image"** button
3. Browse your computer for an image
4. Select an image (JPG, PNG, WEBP)
5. Click **"Open"**
6. You should see a preview of the image

**Tip:** Use images that are:
- At least 1200x630 pixels
- Less than 5MB in size
- Relevant to your course topic

---

#### 6.8 Save the Course
At the bottom of the form, you'll see buttons:

**OPTION A: Save as Draft**
1. Click **"Save Draft"** button
2. Course will be saved but not published
3. Only you can see it

**OPTION B: Publish/Submit**
1. Click **"Submit"** or **"Publish"** button
2. Course will be submitted for review
3. Super admin will need to approve it

**Click your preferred button.**

---

#### 6.9 Success!
You should see:
```
✅ Course created successfully!
   Now you can upload videos and PDFs from the course list.
```

✅ **Your course is created!**

---

## 📹 PART 3: UPLOAD VIDEO TO COURSE

### 🎥 STEP 7: Open Course for Editing

#### 7.1 Find Your Course
1. You should now be back at your dashboard
2. Look for your course in the course list
3. You'll see a card with:
   - Course thumbnail
   - Course title
   - Category badge
   - Price

#### 7.2 Open Course Details
1. Click anywhere on the course card
2. OR look for an **"Edit"** or **"Manage"** button
3. Course details will expand or open

---

### 📤 STEP 8: Upload Video

#### 8.1 Click Upload Video Button
Look for a button that says:
- "Upload Video" OR
- "Add Video" OR
- "+ Video"

Click on it.

---

#### 8.2 Video Upload Form Appears
You'll see a form with fields:

---

#### 8.3 Select Video File
1. Find **"Choose File"** or **"Select Video"** button
2. Click on it
3. File explorer will open
4. Browse to your video file location
5. Select your video file (.mp4, .mov, .avi, .webm)
6. Click **"Open"**

**Supported formats:**
- MP4 (recommended)
- MOV
- AVI
- WebM
- MKV

**File size:** Up to 2GB per video

---

#### 8.4 Enter Video Title
1. Find the **"Title"** or **"Video Title"** field
2. Type a descriptive title, for example:
   ```
   Lesson 1: Introduction to Vedic Math
   ```

---

#### 8.5 Choose Access Type
Find the **"Access Type"** or **"Visibility"** option:

**OPTION 1: Free**
- Click on "Free" radio button or dropdown option
- Anyone can watch this video

**OPTION 2: Paid**
- Click on "Paid" radio button or dropdown option
- Only enrolled students can watch

Choose based on your preference.

---

#### 8.6 Upload the Video
1. Find the **"Upload"** or **"Submit"** button
2. Click on it
3. You'll see a progress bar

**What happens now:**
```
Uploading to Bunny Stream... ░░░░░░░░░░ 0%
Uploading to Bunny Stream... ████░░░░░░ 40%
Uploading to Bunny Stream... ████████░░ 80%
✅ Upload complete!          ██████████ 100%
```

**Wait for upload to complete.** This may take:
- 1-2 minutes for small videos (< 100MB)
- 5-10 minutes for large videos (> 500MB)

**✅ DO NOT CLOSE THE PAGE during upload!**

---

#### 8.7 Success!
You should see:
```
✅ Video uploaded successfully!
```

The video will now appear in your course media list.

---

## 📄 PART 4: UPLOAD PDF TO COURSE (Optional)

### 📎 STEP 9: Upload PDF Document

#### 9.1 Click Upload PDF Button
Look for:
- "Upload PDF" OR
- "Add PDF" OR
- "+ PDF"

Click on it.

---

#### 9.2 Select PDF File
1. Click **"Choose File"**
2. Browse to your PDF location
3. Select the PDF file
4. Click **"Open"**

---

#### 9.3 Enter PDF Title
Type a title, for example:
```
Course Material - Lesson 1 Notes
```

---

#### 9.4 Choose Access Type
- **Free**: Anyone can download
- **Paid**: Only enrolled students

---

#### 9.5 Upload
1. Click **"Upload"** button
2. Wait for progress to complete
3. See success message

✅ **PDF uploaded!**

---

## 🎉 PART 5: VERIFY EVERYTHING WORKS

### ✅ STEP 10: Check Your Course

#### 10.1 View Course List
1. Go back to your dashboard
2. Your course should appear in the list
3. You should see:
   - ✅ Course thumbnail
   - ✅ Course title
   - ✅ Category badge
   - ✅ Price
   - ✅ Status (Draft/Pending/Approved)

---

#### 10.2 View Course Details
1. Click on your course
2. You should see:
   - ✅ Course information
   - ✅ List of videos
   - ✅ List of PDFs
   - ✅ Edit/Delete options

---

#### 10.3 Preview Video
1. Find your uploaded video in the list
2. Look for **"Preview"** or **"Play"** icon/button
3. Click on it
4. Video should play in embedded player

✅ **Everything is working!**

---

## 📊 QUICK REFERENCE

### Required Information for Course:
```
✅ Course Title (required)
✅ Category (required)
✅ Description (optional but recommended)
✅ Price (required - can be 0 for free)
✅ Thumbnail image (optional but recommended)
```

### Required Information for Video:
```
✅ Video file (.mp4, .mov, etc.)
✅ Video title
✅ Access type (free or paid)
```

### Required Information for PDF:
```
✅ PDF file
✅ PDF title
✅ Access type (free or paid)
```

---

## 🔧 TROUBLESHOOTING

### Problem: "Missing or insufficient permissions" error

**Solution:**
1. Make sure you completed PART 1 (Setup)
2. Check Firebase Rules are published
3. Verify your user has `role: "trainer"` field
4. Logout and login again
5. Try creating course again

---

### Problem: Backend server not running

**Error shows:** "Backend server not running" or "Network error"

**Solution:**
1. Check Terminal/Command Prompt where you ran `node index.js`
2. Should show: `Server listening on http://localhost:4000`
3. If not running, navigate to server folder and run:
   ```bash
   cd C:\Users\Administrator\Desktop\E-learning\elearning-app\Bhartam\server
   node index.js
   ```

---

### Problem: Video upload fails

**Solution:**
1. Make sure backend server is running (see above)
2. Check video file size (must be < 2GB)
3. Check video format (use .mp4 for best compatibility)
4. Check internet connection
5. Try smaller video first to test

---

### Problem: Can't see created course

**Solution:**
1. Refresh the page (F5)
2. Check course status:
   - **Draft**: Only you can see it
   - **Pending**: Waiting for admin approval
   - **Approved**: Everyone can see it
3. Make sure you're logged in as the same user who created it

---

### Problem: Thumbnail won't upload

**Solution:**
1. Check image file size (< 5MB)
2. Check image format (JPG, PNG, WEBP)
3. Make sure backend server is running
4. Try a different image

---

## 📋 COMPLETE CHECKLIST

### Before Creating Course:
- [ ] Firestore rules deployed ✅
- [ ] User has `role: "trainer"` ✅
- [ ] Backend server running on port 4000 ✅
- [ ] Frontend running on port 5173 ✅
- [ ] Logged into application ✅

### Creating Course:
- [ ] Clicked "Create New Course" ✅
- [ ] Entered course title ✅
- [ ] Selected category ✅
- [ ] Wrote description ✅
- [ ] Set price ✅
- [ ] Uploaded thumbnail (optional) ✅
- [ ] Clicked "Save" or "Submit" ✅
- [ ] Saw success message ✅

### Uploading Video:
- [ ] Opened course for editing ✅
- [ ] Clicked "Upload Video" ✅
- [ ] Selected video file ✅
- [ ] Entered video title ✅
- [ ] Chose access type ✅
- [ ] Clicked "Upload" ✅
- [ ] Waited for 100% progress ✅
- [ ] Saw success message ✅

### Uploading PDF:
- [ ] Clicked "Upload PDF" ✅
- [ ] Selected PDF file ✅
- [ ] Entered PDF title ✅
- [ ] Chose access type ✅
- [ ] Clicked "Upload" ✅
- [ ] Saw success message ✅

---

## 🎯 YOU'RE DONE!

Congratulations! You've successfully:
✅ Set up Firestore security rules
✅ Configured your trainer role
✅ Started backend and frontend servers
✅ Created your first course
✅ Uploaded video to Bunny Stream
✅ Uploaded PDF to Bunny Storage

**Your e-learning platform is now fully operational! 🚀**

---

## 💡 NEXT STEPS

1. **Create more courses** - Repeat PART 2
2. **Upload more videos** - Repeat PART 3 for each video
3. **Submit for review** - If you want super admin to approve
4. **Track enrollments** - Check dashboard for student stats
5. **Monitor earnings** - View payment/transaction history

---

## 📞 NEED HELP?

Check these files in your project folder:
- `FIX_NOW.txt` - Quick troubleshooting
- `DEPLOY_NOW.md` - Detailed setup guide
- `VISUAL_GUIDE.md` - Visual instructions
- `START_HERE.md` - Quick start

**Happy teaching! 🎓✨**
