# Firestore Security Rules Setup

## Problem
You're getting "Missing or insufficient permissions" error when trying to create courses because Firestore security rules are blocking write operations.

## Solution - Update Firestore Security Rules

### Option 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `bharatam-f3cd7`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab at the top

3. **Update the Rules**
   - Copy the contents from `firestore.rules` file in this project
   - Paste it into the rules editor in Firebase Console
   - Click "Publish" button

4. **Verify the Rules**
   - After publishing, you should see the rules are active
   - The status should show as "Published"

### Option 2: Using Firebase CLI

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project** (if not already done)
   ```bash
   firebase init firestore
   ```
   - Select "Use an existing project"
   - Choose: `bharatam-f3cd7`
   - Accept the default filenames

4. **Deploy the rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

## What the Rules Allow

### For Trainers/Staff:
- ✅ Create courses (with their own trainerId)
- ✅ Read their own courses (any status)
- ✅ Update their own courses
- ✅ Delete their own courses
- ✅ Upload videos/PDFs to their courses
- ✅ Manage media in their courses

### For Super Admin:
- ✅ Read all courses
- ✅ Update any course (approve/reject)
- ✅ Delete any course
- ✅ Manage categories
- ✅ Manage advertisements
- ✅ View all users

### For All Users:
- ✅ Read approved courses
- ✅ Read their own user profile
- ✅ Update their own profile

## Verify User Role

Make sure your user account has the correct role in Firestore:

1. Go to Firebase Console → Firestore Database
2. Find the `bharatam_users` collection
3. Look for your user document (by uid or phone number)
4. Ensure the document has one of these fields:
   - `role: "trainer"` or `role: "staff"` (for trainers)
   - `role: "superadmin"` or `isSuperAdmin: true` (for super admin)

## Test the Setup

After updating the rules:

1. **Start your backend server** (required for uploads):
   ```bash
   cd server
   node index.js
   ```
   Server should run on http://localhost:4000

2. **Start your frontend**:
   ```bash
   npm run dev
   ```

3. **Try creating a course**:
   - Login as a trainer
   - Click "Create New Course"
   - Fill in the details (Title, Category, Price)
   - Upload a thumbnail (optional)
   - Click "Create Course"

4. **Upload video to the course**:
   - After course is created, click on the course
   - Click "Upload Video" or "Upload PDF"
   - Select your file
   - Fill in the title
   - Click "Upload"

## Common Issues

### Issue: Still getting permission error
**Solution**: 
- Clear browser cache and reload
- Check that your user document in Firestore has the correct `role` field
- Wait a few seconds after publishing rules (rules take a moment to propagate)

### Issue: Backend server not running
**Solution**:
```bash
cd server
npm install
node index.js
```

### Issue: Thumbnail upload fails
**Solution**: 
- Make sure backend server is running on port 4000
- Check that Bunny.net credentials are in `.env` file
- Verify the `.env` file has all required BUNNY variables

## Environment Variables Check

Ensure your `.env` file has these variables:
```env
VITE_BUNNY_STORAGE_ZONE=bhartamproject
VITE_BUNNY_STORAGE_ENDPOINT=https://storage.bunnycdn.com
VITE_BUNNY_ACCESS_KEY=your-access-key
VITE_BUNNY_CDN_URL=https://bhartamproject.b-cdn.net
VITE_BUNNY_VIDEO_LIBRARY_ID=676379
VITE_BUNNY_STREAM_API_KEY=your-stream-api-key
```

## Quick Start Commands

```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Start backend server
cd server
node index.js

# 3. In another terminal, start frontend
npm run dev
```

## Need Help?

If you still have issues:
1. Check browser console for specific error messages
2. Check Firebase Console → Firestore → Usage tab for rule evaluation failures
3. Verify your user's role in Firestore database
4. Make sure backend server is running before uploading files
