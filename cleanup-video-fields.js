import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnmVfWqHet_eM5QZvxE4JupJ1vj_-4Hcc",
  authDomain: "bharatam-f3cd7.firebaseapp.com",
  projectId: "bharatam-f3cd7",
  storageBucket: "bharatam-f3cd7.firebasestorage.app",
  messagingSenderId: "194928349759",
  appId: "1:194928349759:web:58f5e3fb4a9e89e153de8a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fields to keep in video documents
const ALLOWED_VIDEO_FIELDS = [
  'approvalStatus',
  'approvedAt',
  'bunnyVideoId',
  'contentType',
  'createdAt',
  'durationMinutes',
  'fileName',
  'isFree',
  'order',
  'status',
  'storageUrl',
  'thumbnailUrl',
  'title',
  'updatedAt',
  'views'
];

async function cleanupVideoFields() {
  console.log("Starting cleanup of video fields in bharatam_courses...");
  console.log(`Keeping only these fields: ${ALLOWED_VIDEO_FIELDS.join(', ')}`);
  console.log("");
  
  // Safety check - ask for confirmation
  console.log("⚠️  WARNING: This will permanently remove fields from video documents.");
  console.log("⚠️  Make sure you have a backup of your Firestore database!");
  console.log("");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
  console.log("");
  
  // Wait 5 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const coursesSnap = await getDocs(collection(db, "bharatam_courses"));
    console.log(`Found ${coursesSnap.docs.length} courses to process.\n`);

    let totalVideosProcessed = 0;
    let totalFieldsRemoved = 0;
    let coursesWithVideos = 0;

    for (const courseDoc of coursesSnap.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      const courseTitle = courseData.courseName || courseData.title || courseId;
      
      console.log(`Processing course: ${courseTitle} (${courseId})`);

      // Get all videos in the subcollection
      const videosSnap = await getDocs(collection(db, "bharatam_courses", courseId, "videos"));
      
      if (videosSnap.docs.length === 0) {
        console.log(`  No videos found in this course.\n`);
        continue;
      }

      coursesWithVideos++;
      console.log(`  Found ${videosSnap.docs.length} video(s)`);

      for (const videoDoc of videosSnap.docs) {
        const videoData = videoDoc.data();
        const videoId = videoDoc.id;
        const videoTitle = videoData.title || videoData.fileName || videoId;

        // Find fields to remove
        const currentFields = Object.keys(videoData);
        const fieldsToRemove = currentFields.filter(field => !ALLOWED_VIDEO_FIELDS.includes(field));

        if (fieldsToRemove.length === 0) {
          console.log(`    ✓ Video "${videoTitle}" - Already clean (no fields to remove)`);
          totalVideosProcessed++;
          continue;
        }

        console.log(`    Processing video "${videoTitle}" (${videoId})`);
        console.log(`      Fields to remove: ${fieldsToRemove.join(', ')}`);

        // Create update object to remove unwanted fields
        const updateObj = {};
        fieldsToRemove.forEach(field => {
          updateObj[field] = deleteField();
        });

        // Update the video document
        const videoRef = doc(db, "bharatam_courses", courseId, "videos", videoId);
        await updateDoc(videoRef, updateObj);

        totalFieldsRemoved += fieldsToRemove.length;
        totalVideosProcessed++;
        
        console.log(`      ✓ Removed ${fieldsToRemove.length} field(s)`);
      }

      console.log("");
    }

    console.log("=" .repeat(60));
    console.log("CLEANUP COMPLETED SUCCESSFULLY!");
    console.log("=" .repeat(60));
    console.log(`Courses with videos: ${coursesWithVideos}`);
    console.log(`Total videos processed: ${totalVideosProcessed}`);
    console.log(`Total fields removed: ${totalFieldsRemoved}`);
    console.log(`\nAll video documents now contain ONLY these fields:`);
    console.log(ALLOWED_VIDEO_FIELDS.join(', '));
    console.log("");

  } catch (err) {
    console.error("ERROR during cleanup:", err);
    console.error("\nCleanup failed! Check the error above.");
    console.error("Your data should be intact - no changes were made after the error.");
    process.exit(1);
  }
}

// Run the cleanup
cleanupVideoFields()
  .then(() => {
    console.log("Exiting...");
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
