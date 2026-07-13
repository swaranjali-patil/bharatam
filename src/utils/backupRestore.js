import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

const COLLECTIONS_TO_BACKUP = [
  'advertisements',
  'bharatam_assessment_attempts',
  'bharatam_assessments',
  'bharatam_categories',
  'bharatam_courses',
  'bharatam_faqs',
  'bharatam_support_queries',
  'bharatam_trainers',
  'bharatam_users',
  'bharatam_wallet_transactions',
  'bharatam_wallets',
  'bharatam_withdrawal_requests',
  'chats',
  'learners',
  'platform_config',
  'purchases',
  'student_progress',
  'subscribe',
  'trainers'
];

const SUBCOLLECTIONS_TO_BACKUP = {
  'bharatam_courses': ['videos', 'pdfs']
};

// Helper to convert Firestore Timestamps to ISO strings for JSON serialization
const serializeData = (data) => {
  const serialized = { ...data };
  for (const key in serialized) {
    if (serialized[key] instanceof Timestamp) {
      serialized[key] = {
        __type: 'timestamp',
        value: serialized[key].toDate().toISOString()
      };
    } else if (typeof serialized[key] === 'object' && serialized[key] !== null) {
        if (serialized[key]?.seconds !== undefined && serialized[key]?.nanoseconds !== undefined) {
             serialized[key] = {
                __type: 'timestamp',
                value: new Date(serialized[key].seconds * 1000).toISOString()
             };
        }
    }
  }
  return serialized;
};

// Helper to deserialize data back to Firestore Timestamps
const deserializeData = (data) => {
  const deserialized = { ...data };
  for (const key in deserialized) {
    if (deserialized[key] && typeof deserialized[key] === 'object' && deserialized[key].__type === 'timestamp') {
      deserialized[key] = Timestamp.fromDate(new Date(deserialized[key].value));
    }
  }
  return deserialized;
};

export const createBackup = async () => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: 1,
      collections: {}
    };

    for (const collectionName of COLLECTIONS_TO_BACKUP) {
      backupData.collections[collectionName] = {};
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      for (const docSnapshot of querySnapshot.docs) {
        const docId = docSnapshot.id;
        backupData.collections[collectionName][docId] = {
            data: serializeData(docSnapshot.data()),
            subcollections: {}
        };

        // Handle subcollections if any
        if (SUBCOLLECTIONS_TO_BACKUP[collectionName]) {
          for (const subcol of SUBCOLLECTIONS_TO_BACKUP[collectionName]) {
             const subSnapshot = await getDocs(collection(db, collectionName, docId, subcol));
             if (!subSnapshot.empty) {
                backupData.collections[collectionName][docId].subcollections[subcol] = {};
                subSnapshot.forEach(subDoc => {
                   backupData.collections[collectionName][docId].subcollections[subcol][subDoc.id] = serializeData(subDoc.data());
                });
             }
          }
        }
      }
    }

    // Trigger download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `bharatam_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    return { success: true };
  } catch (error) {
    console.error("Backup failed:", error);
    return { success: false, error: error.message };
  }
};

export const restoreBackup = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        if (!backupData.collections) {
           throw new Error("Invalid backup file format.");
        }

        let restoredCount = 0;
        let skippedCount = 0;

        for (const collectionName of Object.keys(backupData.collections)) {
           const docs = backupData.collections[collectionName];
           
           for (const [docId, docContent] of Object.entries(docs)) {
              const docRef = doc(db, collectionName, docId);
              const docSnap = await getDoc(docRef);

              if (!docSnap.exists()) {
                 await setDoc(docRef, deserializeData(docContent.data));
                 restoredCount++;
              } else {
                 skippedCount++;
              }

              // Restore subcollections
              if (docContent.subcollections) {
                 for (const [subcolName, subDocs] of Object.entries(docContent.subcollections)) {
                    for (const [subDocId, subDocData] of Object.entries(subDocs)) {
                       const subDocRef = doc(db, collectionName, docId, subcolName, subDocId);
                       const subDocSnap = await getDoc(subDocRef);

                       if (!subDocSnap.exists()) {
                           await setDoc(subDocRef, deserializeData(subDocData));
                           restoredCount++;
                       } else {
                           skippedCount++;
                       }
                    }
                 }
              }
           }
        }

        resolve({ success: true, restoredCount, skippedCount });
      } catch (error) {
        console.error("Restore failed:", error);
        reject({ success: false, error: error.message });
      }
    };
    reader.onerror = (error) => reject({ success: false, error });
    reader.readAsText(file);
  });
};
