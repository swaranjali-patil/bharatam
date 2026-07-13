import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";

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

async function runMigration() {
  console.log("Starting migration of course media to subcollections...");
  try {
    const coursesSnap = await getDocs(collection(db, "bharatam_courses"));
    console.log(`Found ${coursesSnap.docs.length} courses.`);

    for (const courseDoc of coursesSnap.docs) {
      const courseId = courseDoc.id;
      const data = courseDoc.data();
      console.log(`Migrating course: ${data.title} (${courseId})...`);

      const videos = data.videos || [];
      const pdfs = data.pdfs || [];

      console.log(`  Videos array count: ${videos.length}`);
      console.log(`  PDFs array count: ${pdfs.length}`);

      // Migrate videos to subcollection 'videos'
      for (const video of videos) {
        if (!video.id) continue;
        const videoDocRef = doc(db, "bharatam_courses", courseId, "videos", video.id);
        const firestoreVideoDoc = {
          approvalStatus: video.status === 'Approved' ? 'approved' : 'pending',
          approvedAt: video.status === 'Approved' ? new Date() : null,
          bunnyVideoId: video.url || '',
          storageUrl: video.url || '',
          contentType: 'video',
          createdAt: new Date(),
          updatedAt: new Date(),
          durationMinutes: Number(video.duration || 0),
          fileName: video.title || '',
          title: video.title || '',
          thumbnailUrl: '',
          views: 0,
          isFree: video.accessType === 'free' || video.isFree || false,
          order: Number(video.order || 0),
          status: video.status === 'Approved' ? 'active' : 'pending'
        };
        await setDoc(videoDocRef, firestoreVideoDoc);
        console.log(`    Migrated video: ${video.title} -> subcollections/videos/${video.id}`);
      }

      // Migrate pdfs to subcollection 'pdfs' and 'pdf'
      for (const pdf of pdfs) {
        if (!pdf.id) continue;
        const firestorePdfDoc = {
          approvalStatus: pdf.status === 'Approved' ? 'approved' : 'pending',
          approvedAt: pdf.status === 'Approved' ? new Date() : null,
          bunnyVideoId: '', 
          storageUrl: pdf.url || '',
          contentType: 'pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
          durationMinutes: Number(pdf.durationMinutes || 0),
          fileName: pdf.title || '',
          title: pdf.title || '',
          thumbnailUrl: '',
          views: 0,
          isFree: pdf.accessType === 'free' || pdf.isFree || false,
          order: Number(pdf.order || 0),
          status: pdf.status === 'Approved' ? 'active' : 'pending'
        };

        const pdfsDocRef = doc(db, "bharatam_courses", courseId, "pdfs", pdf.id);
        const pdfDocRef = doc(db, "bharatam_courses", courseId, "pdf", pdf.id);

        await setDoc(pdfsDocRef, firestorePdfDoc);
        await setDoc(pdfDocRef, firestorePdfDoc);
        console.log(`    Migrated PDF: ${pdf.title} -> subcollections/pdfs/${pdf.id} & subcollections/pdf/${pdf.id}`);
      }

      // Update parent course document fields if needed
      const categoryEmoji = getCategoryEmoji(data.subject || data.category || 'Default');
      const priceVal = Number(data.price || 0);

      await updateDoc(doc(db, "bharatam_courses", courseId), {
        category: data.subject || data.category || 'Yoga',
        lifetimePrice: data.lifetimePrice || priceVal,
        limitedTimePrice: data.limitedTimePrice || priceVal,
        approvalStatus: data.status === 'Approved' ? 'approved' : (data.status === 'Pending Review' ? 'pending' : 'draft'),
        isApproved: data.status === 'Approved',
        emoji: data.emoji || categoryEmoji
      });
      console.log(`  Updated course parent document successfully.`);
    }

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

function getCategoryEmoji(cat) {
  const mapping = {
    'Vedic Math': '🔢',
    'Maths': '🔢',
    'Science': '🧪',
    'History': '🏛️',
    'English': '📚',
    'Computer Science': '💻',
    'Physics': '🌌',
    'Chemistry': '🧪',
    'Biology': '🧬',
    'Yoga': '🧘'
  };
  return mapping[cat] || '📚';
}

runMigration();
