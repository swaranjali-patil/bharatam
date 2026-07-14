import { Fragment, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  LogOut,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  BookOpen,
  Video,
  FileText,
  ArrowRight,
  Plus,
  Upload,
  ArrowLeft,
  Percent,
  ShieldAlert,
  Bell,
  Shield,
  CloudUpload,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Megaphone,
  Tags,
  Trash2,
  Wallet,
  ArrowDownLeft,
  CreditCard,
  DollarSign,
  BadgeCheck,
  Ban,
  Database,
  MessageSquare,
  Inbox,
  AlertCircle,
  Printer
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, updateDoc, onSnapshot, addDoc, setDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { uploadToBunny, uploadToBunnyStream, normalizeBunnyUrl, resolveBunnyVideoUrl } from '../utils/bunny';
import { createBackup, restoreBackup } from '../utils/backupRestore';
import { mockCourses, mockUsers, mockAds, mockCategories } from '../utils/fallbackData';

export default function SuperAdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [approvalTab, setApprovalTab] = useState('all'); // all, pending, approved_courses
  const [peopleTab, setPeopleTab] = useState('students'); // 'students' or 'trainers'
  const [transactionSubTab, setTransactionSubTab] = useState('transactions'); // transactions, withdrawals, trainer_wallet
  const [transactionMenuOpen, setTransactionMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [materialFilter, setMaterialFilter] = useState('all');
  const [coursePage, setCoursePage] = useState(1);
  const [isManageAdsOpen, setIsManageAdsOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAdFormOpen, setIsAdFormOpen] = useState(false);
  // Approve Payout Modal
  const [approvePayoutModal, setApprovePayoutModal] = useState(null); // null | { withdrawal doc }
  const [approvePayoutForm, setApprovePayoutForm] = useState({ payAmount: '', utrId: '', proofFile: null, proofPreview: '', proofUrl: '' });
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isUploadingAd, setIsUploadingAd] = useState(false);
  const [advertisements, setAdvertisements] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagsList, setTagsList] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [categoryActiveTab, setCategoryActiveTab] = useState('categories'); // 'categories' | 'tags'
  const [policies, setPolicies] = useState({ terms: '', privacy: '', trainerGuidelines: '' });
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [policiesInput, setPoliciesInput] = useState({ terms: '', privacy: '', trainerGuidelines: '' });
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);
  const [newAdForm, setNewAdForm] = useState({ title: '', imageUrl: '', linkUrl: '' });
  const [withdrawalsList, setWithdrawalsList] = useState([]);
  const [trainerWalletsList, setTrainerWalletsList] = useState([]);

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.isSuperAdmin === true;
  const [coursesList, setCoursesList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [learnersList, setLearnersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasesList, setPurchasesList] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);

  const getPurchaseAmount = (purchase) => {
    if (!purchase) return 0;
    return Number(
      purchase.amount ??
      purchase.price ??
      purchase.totalAmount ??
      purchase.paymentAmount ??
      purchase.paidAmount ??
      purchase.amountPaid ??
      0
    ) || 0;
  };

  // Create Course State
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  // Overview card selection — which card is active (drives graph highlight)
  const [activeOverviewCard, setActiveOverviewCard] = useState(null); // null | 'earnings' | 'students' | 'courses' | 'enrollments'
  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    isFree: false,
    thumbnail: null,
    thumbnailFile: null
  });

  // Upload Media State
  const [isUploadMediaOpen, setIsUploadMediaOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newMediaForm, setNewMediaForm] = useState({
    courseId: '',
    title: '',
    url: '',
    duration: '',
    price: '',
    moduleId: '',
    order: '',
    type: 'video'
  });
  const [previewModal, setPreviewModal] = useState({ open: false, url: '', title: '', mediaType: '' });

  // Support & FAQ States
  const [supportQueries, setSupportQueries] = useState([]);
  const [supportFaqs, setSupportFaqs] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [queryFilter, setQueryFilter] = useState('all');
  const [querySearch, setQuerySearch] = useState('');
  const [replyQueryId, setReplyQueryId] = useState(null); // ID of ticket currently replying to
  const [replyText, setReplyText] = useState('');
  const [newFaqForm, setNewFaqForm] = useState({ question: '', answer: '', category: 'general' });
  const [isFaqFormOpen, setIsFaqFormOpen] = useState(false);

  // Dynamic Commission States
  const [globalCommission, setGlobalCommission] = useState(20);
  const [isEditCommissionOpen, setIsEditCommissionOpen] = useState(false);
  const [commissionInput, setCommissionInput] = useState(20);
  const [approveCourseModal, setApproveCourseModal] = useState(null);
  const [approveCommissionInput, setApproveCommissionInput] = useState('');
  const [useCustomCommission, setUseCustomCommission] = useState(false);

  // Date Filter States for Transactions
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');

  // Pagination page states
  const [txPage, setTxPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [walletPage, setWalletPage] = useState(1);

  // Backup & Restore States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);

  useEffect(() => {
    setCoursePage(1);
  }, [approvalTab, searchQuery, coursesList.length]);

  useEffect(() => {
    setTxPage(1);
  }, [txStartDate, txEndDate, transactionSubTab]);

  useEffect(() => {
    setWithdrawalPage(1);
    setWalletPage(1);
  }, [transactionSubTab]);

  const openPreview = (rawUrl, title = '', mediaType = '') => {
    try {
      // If this looks like a PDF, open in a new tab to avoid iframe/embed restrictions
      const looksLikePdf = (mediaType === 'pdf') || (/\.pdf($|\?)/i.test(String(rawUrl || '')));
      if (looksLikePdf) {
        const pdfUrl = resolveBunnyVideoUrl(rawUrl) || rawUrl;
        window.open(pdfUrl, '_blank', 'noopener');
        return;
      }

      if (mediaType === 'video' || /iframe\.mediadelivery\.net|embed|play\//i.test(rawUrl)) {
        const resolved = resolveBunnyVideoUrl(rawUrl);
        setPreviewModal({ open: true, url: resolved, title: title || '', mediaType: 'video' });
        return;
      }
      // For other file types (non-pdf), attempt to preview in-modal via iframe/video
      setPreviewModal({ open: true, url: rawUrl || '', title: title || '', mediaType: mediaType || '' });
    } catch (e) {
      setPreviewModal({ open: true, url: rawUrl || '', title: title || '', mediaType: mediaType || '' });
    }
  };

  const closePreview = () => setPreviewModal({ open: false, url: '', title: '', mediaType: '' });

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'approvals', icon: CheckSquare, label: 'Approvals' },
    { id: 'people', icon: Users, label: 'People' },
    {
      id: 'transactions_group',
      icon: CreditCard,
      label: 'Transactions',
      isGroup: true,
      children: [
        { id: 'transactions', icon: DollarSign, label: 'Transactions' },
        { id: 'withdrawals', icon: ArrowDownLeft, label: 'Withdrawals' },
        { id: 'trainer_wallet', icon: Wallet, label: 'Trainer Wallet' },
      ]
    },
    { id: 'support', icon: ShieldAlert, label: 'Support & FAQs' },
    { id: 'backup_restore', icon: Database, label: 'Backup & Restore' },
    { id: 'settings', icon: Settings, label: 'System Settings' },
  ];

  // Fetch courses and users from Firestore real-time
  useEffect(() => {
    const unsubscribeCourses = onSnapshot(collection(db, "bharatam_courses"), async (snapshot) => {
      const courseDocs = snapshot.docs;
      const fetchedCourses = await Promise.all(courseDocs.map(async (courseDoc) => {
        const courseData = { id: courseDoc.id, ...courseDoc.data() };

        // Map new field names to legacy field names for backward compatibility
        const mappedCourseData = {
          ...courseData,
          title: courseData.courseName || courseData.title || '',
          thumbnail: courseData.thumbnailUrl || courseData.thumbnail || '',
          courseName: courseData.courseName || courseData.title || '',
          thumbnailUrl: courseData.thumbnailUrl || courseData.thumbnail || '',
          price: courseData.oneTimePrice !== undefined ? (courseData.oneTimePrice === 0 ? 'Free' : String(courseData.oneTimePrice)) : (courseData.price || 'Free'),
          oneTimePrice: courseData.oneTimePrice || 0,
          subject: courseData.category || courseData.subject || '',
          category: courseData.category || courseData.subject || '',
          status: courseData.approvalStatus === 'approved' ? 'Approved' : (courseData.approvalStatus === 'pending' ? 'Pending Review' : (courseData.approvalStatus === 'rejected' ? 'Rejected' : 'Draft'))
        };

        // Fetch videos subcollection
        let subVideos = [];
        try {
          const videosSnap = await getDocs(collection(db, "bharatam_courses", courseDoc.id, "videos"));
          subVideos = videosSnap.docs.map(d => {
            const data = d.data();
            // Determine status consistently
            let status = 'Pending';
            if (data.approvalStatus === 'approved' || data.status === 'active') {
              status = 'Approved';
            } else if (data.approvalStatus === 'rejected' || data.status === 'rejected') {
              status = 'Rejected';
            }

            return {
              id: d.id,
              title: data.fileName || data.title || '',
              url: data.bunnyVideoId || data.url || '',
              contentType: data.contentType || 'video',
              accessType: data.isFree ? 'free' : (data.accessType || 'paid'),
              status: status,
              approvalStatus: data.approvalStatus || (status === 'Approved' ? 'approved' : 'pending'),
              addedAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : '',
              ...data
            };
          });
        } catch (e) {
          // ignore
        }

        // Fetch pdfs subcollection
        let subPdfs = [];
        try {
          const pdfsSnap = await getDocs(collection(db, "bharatam_courses", courseDoc.id, "pdfs"));
          const processPdfDoc = d => {
            const data = d.data();
            // Determine status consistently
            let status = 'Pending';
            if (data.approvalStatus === 'approved' || data.status === 'active') {
              status = 'Approved';
            } else if (data.approvalStatus === 'rejected' || data.status === 'rejected') {
              status = 'Rejected';
            }

            return {
              id: d.id,
              title: data.fileName || data.title || '',
              url: data.storageUrl || data.bunnyVideoId || data.url || '',
              contentType: data.contentType || 'pdf',
              accessType: data.isFree ? 'free' : (data.accessType || 'paid'),
              status: status,
              approvalStatus: data.approvalStatus || (status === 'Approved' ? 'approved' : 'pending'),
              addedAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : '',
              ...data
            };
          };
          subPdfs = pdfsSnap.docs.map(processPdfDoc);
        } catch (e) {
          // ignore
        }

        return {
          ...mappedCourseData,
          videos: subVideos.length > 0 ? subVideos : (mappedCourseData.videos || []),
          pdfs: subPdfs.length > 0 ? subPdfs : (mappedCourseData.pdfs || [])
        };
      }));

      setCoursesList(fetchedCourses);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching courses:", error);
      setCoursesList(mockCourses);
      setIsLoading(false);
    });

    // Fetch users from bharatam_users (for trainers and admins)
    const unsubscribeUsers = onSnapshot(collection(db, "bharatam_users"), (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsersList(fetchedUsers);
    }, (error) => {
      console.error("Error fetching users:", error);
      setUsersList(mockUsers);
    });

    // Fetch learners from learners collection (for students count)
    const unsubscribeLearners = onSnapshot(collection(db, "learners"), (snapshot) => {
      const fetchedLearners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('📊 SuperAdmin Dashboard - Learners fetched:', {
        totalLearners: fetchedLearners.length,
        source: 'learners collection'
      });

      setLearnersList(fetchedLearners);
    }, (error) => {
      console.error("Error fetching learners:", error);
      // Fallback: try to get students from bharatam_users if learners collection fails
      console.log('⚠️ Falling back to bharatam_users for student count');
      setLearnersList([]);
    });

    const unsubscribeAds = onSnapshot(collection(db, "advertisements"), (snapshot) => {
      const fetchedAds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setAdvertisements(fetchedAds);
    }, (error) => {
      console.error("Error fetching advertisements:", error);
      setAdvertisements(mockAds);
    });

    const unsubscribeCategories = onSnapshot(collection(db, "bharatam_categories"), (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aT = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const bT = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return bT - aT;
        });
      setCategoriesList(fetched);
    }, (error) => {
      console.error("Error fetching categories:", error);
      setCategoriesList(mockCategories);
    });

    const unsubscribeTags = onSnapshot(collection(db, "bharatam_tags"), (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const aT = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const bT = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return bT - aT;
        });
      setTagsList(fetched);
    }, (error) => {
      console.error("Error fetching tags:", error);
      setTagsList([]);
    });

    const loadFallbackPurchases = async () => {
      const collectionsToTry = ['payments', 'orders', 'enrollments'];
      for (const collectionName of collectionsToTry) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          if (snapshot.docs.length > 0) {
            setPurchasesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            return;
          }
        } catch (e) {
          console.warn(`Fallback collection ${collectionName} not available:`, e);
        }
      }
      setPurchasesList([]);
    };

    // Fetch purchases for revenue calculation
    const unsubscribePurchases = onSnapshot(collection(db, "purchases"), async (snapshot) => {
      const fetchedPurchases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (fetchedPurchases.length > 0) {
        setPurchasesList(fetchedPurchases);
      } else {
        await loadFallbackPurchases();
      }
    }, async (error) => {
      console.error("Error fetching purchases:", error);
      await loadFallbackPurchases();
    });

    // Fetch payouts for payout calculation (if you have a payouts collection)
    const unsubscribePayouts = onSnapshot(collection(db, "payouts"), (snapshot) => {
      const fetchedPayouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayoutsList(fetchedPayouts);
    }, (error) => {
      console.error("Error fetching payouts:", error);
      setPayoutsList([]);
    });

    // Fetch bharatam_withdrawal_requests for Withdrawals tab
    const unsubscribeWithdrawals = onSnapshot(collection(db, 'bharatam_withdrawal_requests'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const aT = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt || 0).getTime() / 1000;
        const bT = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt || 0).getTime() / 1000;
        return bT - aT;
      });
      setWithdrawalsList(data);
    }, (err) => {
      console.error('Error fetching bharatam_withdrawal_requests:', err);
      setWithdrawalsList([]);
    });

    // Fetch trainer_wallets for Trainer Wallet tab
    const unsubscribeTrainerWallets = onSnapshot(collection(db, 'trainer_wallets'), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTrainerWalletsList(data);
    }, (err) => {
      console.error('Error fetching trainer_wallets:', err);
      setTrainerWalletsList([]);
    });

    // Fetch support queries
    const unsubscribeSupportQueries = onSnapshot(collection(db, "bharatam_support_queries"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const aT = new Date(a.createdAt || 0).getTime();
        const bT = new Date(b.createdAt || 0).getTime();
        return bT - aT;
      });
      setSupportQueries(data);
    }, (err) => {
      console.error('Error fetching support queries:', err);
      setSupportQueries([]);
    });

    // Fetch FAQs
    const unsubscribeSupportFaqs = onSnapshot(collection(db, "bharatam_faqs"), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSupportFaqs(data);
    }, (err) => {
      console.error('Error fetching FAQs:', err);
      setSupportFaqs([]);
    });

    // Fetch global settings
    const unsubscribeSettings = onSnapshot(doc(db, 'bharatam_settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.commissionRate === 'number') {
          setGlobalCommission(data.commissionRate);
        }
      }
    }, (err) => {
      console.error('Error fetching settings:', err);
    });

    const unsubscribePolicies = onSnapshot(doc(db, 'bharatam_settings', 'policies'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPolicies({
          terms: data.terms || '',
          privacy: data.privacy || '',
          trainerGuidelines: data.trainerGuidelines || '',
        });
      } else {
        setPolicies({
          terms: 'Standard terms of use apply to all courses.',
          privacy: 'We respect user data and privacy.',
          trainerGuidelines: 'Trainers must provide high-quality educational material.',
        });
      }
    }, (err) => {
      console.error('Error fetching policies:', err);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeUsers();
      unsubscribeLearners();
      unsubscribeAds();
      unsubscribeCategories();
      unsubscribeTags();
      unsubscribePurchases();
      unsubscribePayouts();
      unsubscribeWithdrawals();
      unsubscribeTrainerWallets();
      unsubscribeSupportQueries();
      unsubscribeSupportFaqs();
      unsubscribeSettings();
      unsubscribePolicies();
    };
  }, []);

  const handleCourseStatus = async (courseId, newStatus) => {
    try {
      // Optimistic state update for instant UI feedback
      setCoursesList(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus } : c));

      const courseRef = doc(db, "bharatam_courses", courseId);
      await updateDoc(courseRef, {
        approvalStatus: newStatus === 'Approved' ? 'approved' : (newStatus === 'Rejected' ? 'rejected' : 'pending'),
        isApproved: newStatus === 'Approved',
        approvedAt: newStatus === 'Approved' ? new Date() : null,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update course status", err);
      alert("Failed to update course status");
    }
  };

  const handleMediaStatus = async (courseId, mediaId, type, newStatus) => {
    try {
      // Optimistic state update for instant UI feedback (update immediately)
      setCoursesList(prev => prev.map(course => {
        if (course.id !== courseId) return course;

        const mediaKey = type === 'video' ? 'videos' : 'pdfs';
        const updatedMedia = (course[mediaKey] || []).map(m =>
          m.id === mediaId ? { ...m, status: newStatus, approvalStatus: newStatus === 'Approved' ? 'approved' : (newStatus === 'Rejected' ? 'rejected' : 'pending') } : m
        );

        return { ...course, [mediaKey]: updatedMedia };
      }));

      // Update Firestore
      const courseRef = doc(db, "bharatam_courses", courseId);
      const course = coursesList.find(c => c.id === courseId);
      if (!course) return;

      const mediaArray = type === 'video' ? course.videos : course.pdfs;
      const updatedMedia = mediaArray.map(m =>
        m.id === mediaId
          ? {
            ...m,
            status: newStatus,
            approvalStatus: newStatus === 'Approved' ? 'approved' : (newStatus === 'Rejected' ? 'rejected' : 'pending')
          }
          : m
      );

      await updateDoc(courseRef, { updatedAt: serverTimestamp() });

      // Update subcollection document
      try {
        const mediaDocRef = doc(db, "bharatam_courses", courseId, type === 'video' ? 'videos' : 'pdfs', mediaId);
        await updateDoc(mediaDocRef, {
          approvalStatus: newStatus === 'Approved' ? 'approved' : (newStatus === 'Rejected' ? 'rejected' : 'pending'),
          approvedAt: newStatus === 'Approved' ? new Date() : null,
          status: newStatus === 'Approved' ? 'active' : 'pending'
        });
      } catch (subErr) {
        console.warn("Failed to update subcollection document:", subErr);
      }
      // If after this change all media for the course are approved, mark the course Approved too
      try {
        const updatedCourse = (await getDocs(collection(db, "bharatam_courses"))).docs.find(d => d.id === courseId)?.data();
        // We prefer to use local `updatedMedia` arrays rather than re-fetch; check local state
        const localCourse = coursesList.find(c => c.id === courseId);
        const allVideosApproved = (localCourse?.videos || []).every(m => (m.id === mediaId ? (newStatus === 'Approved') : (m.status === 'Approved')));
        const allPdfsApproved = (localCourse?.pdfs || []).every(m => (m.id === mediaId ? (newStatus === 'Approved') : (m.status === 'Approved')));
        if (allVideosApproved && allPdfsApproved) {
          const courseRef = doc(db, "bharatam_courses", courseId);
          try {
            await updateDoc(courseRef, {
              approvalStatus: 'approved',
              isApproved: true,
              approvedAt: new Date(),
              updatedAt: serverTimestamp()
            });
            setCoursesList(prev => prev.map(c => c.id === courseId ? { ...c, status: 'Approved', approvalStatus: 'approved' } : c));
          } catch (e) {
            console.warn('Failed to set course Approved after media approvals', e);
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error("Failed to update media status", err);
      alert("Failed to update media status");
    }
  };

  const handleRemoveMedia = async (courseId, mediaId, type) => {
    try {
      const course = coursesList.find(c => c.id === courseId);
      if (!course) {
        // If parent course missing, just remove subcollection doc
        await deleteDoc(doc(db, "bharatam_courses", courseId, type === 'video' ? 'videos' : 'pdfs', mediaId));
        return;
      }

      const mediaArray = type === 'video' ? (course.videos || []) : (course.pdfs || []);
      const updatedArray = mediaArray.filter(m => m.id !== mediaId);

      const courseRef = doc(db, "bharatam_courses", courseId);
      await updateDoc(courseRef, { updatedAt: serverTimestamp() });

      try {
        await deleteDoc(doc(db, "bharatam_courses", courseId, type === 'video' ? 'videos' : 'pdfs', mediaId));
      } catch (subErr) {
        console.warn('Failed to delete subcollection doc:', subErr);
      }
    } catch (err) {
      console.error('Failed to remove media:', err);
      alert('Failed to remove media: ' + (err.message || err));
    }
  };

  // No expansion — render all courses and their media inline in a table for easier scanning

  // Approve / reject course and all its media in one action
  const handleApproveCourseAndAllMedia = async (courseId, approve = true) => {
    try {
      const proceed = confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this course and ALL its media?`);
      if (!proceed) return;
      const newStatus = approve ? 'Approved' : 'Rejected';
      const courseRef = doc(db, 'bharatam_courses', courseId);
      await updateDoc(courseRef, {
        approvalStatus: approve ? 'approved' : 'rejected',
        isApproved: approve,
        approvedAt: approve ? new Date() : null,
        updatedAt: serverTimestamp()
      });

      // Update media subcollection documents and update parent arrays optimistically
      const course = coursesList.find(c => c.id === courseId) || { videos: [], pdfs: [] };
      const updateMediaDoc = async (media, sub) => {
        try {
          const mediaRef = doc(db, 'bharatam_courses', courseId, sub, media.id);
          await updateDoc(mediaRef, {
            approvalStatus: approve ? 'approved' : 'rejected',
            approvedAt: approve ? new Date() : null,
            status: approve ? 'active' : 'rejected'
          });
        } catch (e) {
          // ignore per-item failures
          console.warn('Failed to update media doc', media.id, e);
        }
      };

      for (const v of (course.videos || [])) await updateMediaDoc(v, 'videos');
      for (const p of (course.pdfs || [])) await updateMediaDoc(p, 'pdfs');

      // Refresh local state
      setCoursesList(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus, approvalStatus: approve ? 'approved' : 'rejected', videos: (c.videos || []).map(m => ({ ...m, status: newStatus, approvalStatus: approve ? 'approved' : 'rejected' })), pdfs: (c.pdfs || []).map(m => ({ ...m, status: newStatus, approvalStatus: approve ? 'approved' : 'rejected' })) } : c));
      // If we approved, switch to approved courses tab so UI reflects change
      if (approve) setApprovalTab('approved_courses');
    } catch (err) {
      console.error('Failed to approve/reject course and media', err);
      alert('Failed to update course and media: ' + (err.message || err));
    }
  };

  const handleConfirmCourseApproval = async (courseId, commissionVal) => {
    try {
      const newStatus = 'Approved';
      const courseRef = doc(db, 'bharatam_courses', courseId);
      await updateDoc(courseRef, {
        approvalStatus: 'approved',
        isApproved: true,
        approvedAt: new Date(),
        commission: commissionVal,
        updatedAt: serverTimestamp()
      });

      // Update media subcollection documents and update parent arrays optimistically
      const course = coursesList.find(c => c.id === courseId) || { videos: [], pdfs: [] };
      const updateMediaDoc = async (media, sub) => {
        try {
          const mediaRef = doc(db, 'bharatam_courses', courseId, sub, media.id);
          await updateDoc(mediaRef, {
            approvalStatus: 'approved',
            approvedAt: new Date(),
            status: 'active'
          });
        } catch (e) {
          console.warn('Failed to update media doc', media.id, e);
        }
      };

      for (const v of (course.videos || [])) await updateMediaDoc(v, 'videos');
      for (const p of (course.pdfs || [])) await updateMediaDoc(p, 'pdfs');

      // Refresh local state
      setCoursesList(prev => prev.map(c => c.id === courseId ? { 
        ...c, 
        status: newStatus, 
        approvalStatus: 'approved',
        commission: commissionVal,
        videos: (c.videos || []).map(m => ({ ...m, status: newStatus, approvalStatus: 'approved' })), 
        pdfs: (c.pdfs || []).map(m => ({ ...m, status: newStatus, approvalStatus: 'approved' })) 
      } : c));

      setApprovalTab('approved_courses');
      setApproveCourseModal(null);
      alert("Course approved successfully!");
    } catch (err) {
      console.error('Failed to approve course', err);
      alert('Failed to approve course: ' + (err.message || err));
    }
  };

  const handleSaveGlobalCommission = async () => {
    try {
      const parsed = Number(commissionInput);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        alert("Please enter a valid percentage between 0 and 100.");
        return;
      }
      const settingsRef = doc(db, 'bharatam_settings', 'global');
      await setDoc(settingsRef, {
        commissionRate: parsed,
        updatedAt: new Date()
      }, { merge: true });
      setIsEditCommissionOpen(false);
      alert("Global commission rate updated successfully!");
    } catch (err) {
      console.error("Failed to save global commission:", err);
      alert("Failed to save commission rate: " + err.message);
    }
  };

  const handleExportTrainerReport = (trainer, walletData) => {
    try {
      const courses = coursesList.filter(c => c.trainerId === trainer.id || c.trainerUid === trainer.id);
      const purchases = purchasesList.filter(p => p.trainerId === trainer.id || p.trainerUid === trainer.id);
      const withdrawals = withdrawalsList.filter(w => w.trainerId === trainer.id);

      const helperFormatDate = (val) => {
        if (!val) return '—';
        let d = null;
        if (typeof val.toDate === 'function') {
          d = val.toDate();
        } else if (val.seconds !== undefined) {
          d = new Date(val.seconds * 1000);
        } else if (val._seconds !== undefined) {
          d = new Date(val._seconds * 1000);
        } else if (val instanceof Date) {
          d = val;
        } else {
          const sec = val.seconds || val._seconds;
          if (sec !== undefined) {
            d = new Date(sec * 1000);
          } else {
            d = new Date(val);
          }
        }
        return !d || isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      const formatPhone = (phone) => {
        if (!phone) return '—';
        const clean = String(phone).trim();
        return `="${clean}"`; // Prevent scientific notation and retain leading zeros
      };

      const formatText = (val) => {
        if (val === undefined || val === null || val === '') return '="—"';
        const cleaned = String(val).replace(/"/g, '""');
        return `="${cleaned}"`;
      };

      const formatCurrency = (val) => {
        const num = Number(val || 0);
        return `="₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`;
      };

      let csvContent = "\uFEFF"; // UTF-8 BOM

      // Report Header Title
      csvContent += "BHARTAM E-LEARNING — TRAINER HISTORY & AUDIT REPORT\n";
      csvContent += `Generated On,="${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN')}"\n\n`;

      // ── Trainer Profile & Financial Overview in Key-Value format (Columns A & B) ──
      csvContent += "=== TRAINER OVERVIEW ===,\n";
      csvContent += `Trainer Name,${formatText(trainer.fullName || 'Unknown')}\n`;
      csvContent += `Email Address,${formatText(trainer.email || trainer.emailAddress || '—')}\n`;
      csvContent += `Contact Number,${formatPhone(trainer.phoneNumber || trainer.studentContact)}\n`;
      csvContent += `Joined Date,${formatText(helperFormatDate(trainer.createdAt))}\n`;
      csvContent += `Total Earnings,${formatCurrency(walletData.totalEarnings)}\n`;
      csvContent += `Total Withdrawn,${formatCurrency(walletData.withdrawn)}\n`;
      csvContent += `Available Balance,${formatCurrency(walletData.available)}\n`;
      csvContent += `Pending Withdrawal Requests,${formatText(walletData.pending)}\n\n`;

      // ── Tabular Sections (Row tables) ──

      // Section 1: Uploaded Courses
      csvContent += "=== UPLOADED COURSES ===\n";
      csvContent += "Course ID,Title,Category,Price (INR),Status,Commission Rate\n";
      if (courses.length === 0) {
        csvContent += "No courses uploaded,,,,,\n";
      } else {
        courses.forEach(c => {
          const comm = c.commission !== undefined && c.commission !== null ? `${c.commission}%` : `${globalCommission}% (Global)`;
          const priceStr = c.price === 'Free' ? 'Free' : formatCurrency(c.price);
          csvContent += `${formatText(c.id)},${formatText(c.title)},${formatText(c.subject || c.subject || c.category || 'General')},${priceStr},${formatText(c.status || 'Pending')},${formatText(comm)}\n`;
        });
      }
      csvContent += "\n";

      // Section 2: Course Purchases (Sales History)
      csvContent += "=== COURSE PURCHASES (SALES HISTORY) ===\n";
      csvContent += "Transaction ID,Date,Course Title,Student Name,Gross Price (INR),Commission (%),Platform Cut (INR),Net Credited (INR)\n";
      if (purchases.length === 0) {
        csvContent += "No sales transactions found,,,,,,,\n";
      } else {
        purchases.forEach(p => {
          const matchedCourse = coursesList.find(c => c.id === p.courseId);
          const commission = typeof p.commission === 'number'
            ? p.commission
            : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
          const gross = getPurchaseAmount(p);
          const platformCut = Math.round((gross * commission) / 100);
          const net = gross - platformCut;

          csvContent += `${formatText(p.id)},${formatText(helperFormatDate(p.createdAt))},${formatText(p.courseTitle || matchedCourse?.title || 'Course')},${formatText(p.studentName || 'Learner')},${formatCurrency(gross)},${formatText(commission + '%')},${formatCurrency(platformCut)},${formatCurrency(net)}\n`;
        });
      }
      csvContent += "\n";

      // Section 3: Withdrawal Requests
      csvContent += "=== WITHDRAWAL HISTORY ===\n";
      csvContent += "Request ID,Requested Date,Amount (INR),Method,Status,Approved Date,UTR/Transaction ID\n";
      if (withdrawals.length === 0) {
        csvContent += "No withdrawals requested,,,,,,\n";
      } else {
        withdrawals.forEach(w => {
          csvContent += `${formatText(w.id)},${formatText(helperFormatDate(w.createdAt))},${formatCurrency(w.amount)},${formatText(w.method || 'BankTransfer')},${formatText(w.status || 'pending')},${formatText(helperFormatDate(w.approvedAt))},${formatText(w.utrId || '—')}\n`;
        });
      }

      // Trigger browser download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bhartam_trainer_report_${trainer.fullName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert("Failed to generate report: " + err.message);
    }
  };

  const handleExportTrainerPDF = (trainer, walletData) => {
    try {
      const courses = coursesList.filter(c => c.trainerId === trainer.id || c.trainerUid === trainer.id);
      const purchases = purchasesList.filter(p => p.trainerId === trainer.id || p.trainerUid === trainer.id);
      const withdrawals = withdrawalsList.filter(w => w.trainerId === trainer.id);

      const helperFormatDate = (val) => {
        if (!val) return '—';
        let d = null;
        if (typeof val.toDate === 'function') {
          d = val.toDate();
        } else if (val.seconds !== undefined) {
          d = new Date(val.seconds * 1000);
        } else if (val._seconds !== undefined) {
          d = new Date(val._seconds * 1000);
        } else if (val instanceof Date) {
          d = val;
        } else {
          const sec = val.seconds || val._seconds;
          if (sec !== undefined) {
            d = new Date(sec * 1000);
          } else {
            d = new Date(val);
          }
        }
        return !d || isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN');
      };

      const helperFormatDateTime = (val) => {
        if (!val) return '—';
        let d = null;
        if (typeof val.toDate === 'function') {
          d = val.toDate();
        } else if (val.seconds !== undefined) {
          d = new Date(val.seconds * 1000);
        } else if (val._seconds !== undefined) {
          d = new Date(val._seconds * 1000);
        } else if (val instanceof Date) {
          d = val;
        } else {
          const sec = val.seconds || val._seconds;
          if (sec !== undefined) {
            d = new Date(sec * 1000);
          } else {
            d = new Date(val);
          }
        }
        if (!d || isNaN(d.getTime())) return '—';
        const day = String(d.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      };

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Pop-up blocker is enabled. Please allow popups to download PDF.");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Bhartam - Trainer History Report (${trainer.fullName || 'Trainer'})</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: #1e293b;
                margin: 0;
                padding: 40px;
                background-color: #ffffff;
                line-height: 1.5;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #ea580c;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .logo-area h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: -0.5px;
              }
              .logo-area p {
                margin: 5px 0 0 0;
                font-size: 11px;
                font-weight: 600;
                color: #ea580c;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .report-meta {
                text-align: right;
                font-size: 12px;
                color: #64748b;
              }
              .section-title {
                font-size: 14px;
                font-weight: 800;
                color: #0f172a;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 30px;
                margin-bottom: 15px;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 5px;
              }
              .profile-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 30px;
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #f1f5f9;
              }
              .profile-item {
                font-size: 13px;
              }
              .profile-item span {
                font-weight: bold;
                color: #64748b;
                display: block;
                text-transform: uppercase;
                font-size: 10px;
                margin-bottom: 2px;
              }
              .profile-item p {
                margin: 0;
                font-weight: 600;
                color: #0f172a;
              }
              .stats-row {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 30px;
              }
              .stat-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                padding: 15px;
                border-radius: 12px;
                text-align: center;
              }
              .stat-card span {
                font-size: 9px;
                font-weight: bold;
                color: #64748b;
                text-transform: uppercase;
                display: block;
              }
              .stat-card p {
                margin: 5px 0 0 0;
                font-size: 16px;
                font-weight: 800;
                color: #0f172a;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                font-size: 11px;
              }
              th {
                background: #f8fafc;
                font-weight: bold;
                color: #475569;
                text-transform: uppercase;
                font-size: 9px;
                text-align: left;
                padding: 10px 12px;
                border-bottom: 2px solid #e2e8f0;
              }
              td {
                padding: 10px 12px;
                border-bottom: 1px solid #f1f5f9;
                color: #334155;
              }
              tr:last-child td {
                border-bottom: none;
              }
              .footer {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: #94a3b8;
                border-top: 1px dashed #e2e8f0;
                padding-top: 20px;
              }
              .signature {
                text-align: center;
                width: 150px;
                border-top: 1px solid #94a3b8;
                padding-top: 5px;
                color: #475569;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-area">
                <h1>BHARTAM</h1>
                <p>Trainer History & Audit Report</p>
              </div>
              <div class="report-meta">
                Date Generated: ${new Date().toLocaleDateString('en-IN')}<br/>
                Time: ${new Date().toLocaleTimeString('en-IN')}
              </div>
            </div>

            <div class="profile-grid">
              <div class="profile-item">
                <span>Trainer Name</span>
                <p>${trainer.fullName || 'Unknown'}</p>
              </div>
              <div class="profile-item">
                <span>Email Address</span>
                <p>${trainer.email || trainer.emailAddress || '—'}</p>
              </div>
              <div class="profile-item">
                <span>Contact Number</span>
                <p>${trainer.phoneNumber || trainer.studentContact || '—'}</p>
              </div>
              <div class="profile-item">
                <span>Joined Date</span>
                <p>${helperFormatDate(trainer.createdAt)}</p>
              </div>
            </div>

            <div class="section-title">Financial Summary</div>
            <div class="stats-row">
              <div class="stat-card" style="border-left: 4px solid #ea580c;">
                <span>Total Earnings</span>
                <p>₹${walletData.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="stat-card" style="border-left: 4px solid #3b82f6;">
                <span>Total Withdrawn</span>
                <p>₹${walletData.withdrawn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="stat-card" style="border-left: 4px solid #10b981;">
                <span>Available Balance</span>
                <p>₹${walletData.available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="stat-card" style="border-left: 4px solid #f59e0b;">
                <span>Pending Requests</span>
                <p>${walletData.pending}</p>
              </div>
            </div>

            <div class="section-title">Uploaded Courses (${courses.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Course ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Commission Rate</th>
                </tr>
              </thead>
              <tbody>
                ${courses.length === 0 ? `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding: 20px;">No courses uploaded yet</td></tr>` : courses.map(c => `
                  <tr>
                    <td><code>${c.id}</code></td>
                    <td><strong>${c.title}</strong></td>
                    <td>${c.subject || c.category || 'General'}</td>
                    <td>${c.price === 'Free' ? 'Free' : '₹' + Number(c.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td>${c.status || 'Pending'}</td>
                    <td>${c.commission !== undefined && c.commission !== null ? `${c.commission}%` : `${globalCommission}% (Global)`}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="section-title">Course Sales History (${purchases.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date & Time</th>
                  <th>Course Title</th>
                  <th>Student Name</th>
                  <th>Gross Price</th>
                  <th>Commission</th>
                  <th>Platform Cut</th>
                  <th>Net Earnings</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.length === 0 ? `<tr><td colspan="10" style="text-align:center; color:#94a3b8; padding: 20px;">No sales history found</td></tr>` : purchases.map(p => {
                  const matchedCourse = coursesList.find(c => c.id === p.courseId);
                  const commission = typeof p.commission === 'number'
                    ? p.commission
                    : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
                  const gross = getPurchaseAmount(p);
                  const platformCut = Math.round((gross * commission) / 100);
                  const net = gross - platformCut;

                  return `
                    <tr>
                      <td><code>${p.id}</code></td>
                      <td>${helperFormatDateTime(p.createdAt)}</td>
                      <td><strong>${p.courseTitle || matchedCourse?.title || 'Course'}</strong></td>
                      <td>${p.studentName || 'Learner'}</td>
                      <td>₹${gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>${commission}%</td>
                      <td>₹${platformCut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td><strong>₹${net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                      <td>${p.paymentMethod || p.method || 'Razorpay'}</td>
                      <td><span style="color:#10b981; font-weight:bold;">${p.status || 'Completed'}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="section-title">Withdrawal Requests (${withdrawals.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Date Requested</th>
                  <th>Amount</th>
                  <th>Payout Method</th>
                  <th>Status</th>
                  <th>Approved Date</th>
                  <th>UTR/Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                ${withdrawals.length === 0 ? `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding: 20px;">No withdrawals requested yet</td></tr>` : withdrawals.map(w => `
                  <tr>
                    <td><code>${w.id}</code></td>
                    <td>${helperFormatDate(w.createdAt)}</td>
                    <td><strong>₹${Number(w.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                    <td>${w.method || 'BankTransfer'}</td>
                    <td>${w.status || 'pending'}</td>
                    <td>${helperFormatDate(w.approvedAt)}</td>
                    <td><code>${w.utrId || '—'}</code></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <div>Bhartam Admin Panel Operations System • Confidential Report</div>
              <div class="signature">Authorized Signature</div>
            </div>

            <script>
              window.onload = function() {
                window.print();
                // Close tab automatically when printer dialog is closed, if supported
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Failed to generate PDF report:", err);
      alert("Failed to generate PDF: " + err.message);
    }
  };

  const handleExportFilteredTransactions = (filteredList) => {
    try {
      const formatText = (val) => {
        if (val === undefined || val === null || val === '') return '="—"';
        const cleaned = String(val).replace(/"/g, '""');
        return `="${cleaned}"`;
      };

      const formatCurrency = (val) => {
        const num = Number(val || 0);
        return `="₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`;
      };

      let csvContent = "\uFEFF"; // UTF-8 BOM

      // Header Row
      csvContent += "=== BHARTAM TRANSACTION REGISTRY ===\n";
      csvContent += `Date Filter Range,${formatText(txStartDate || 'Any Start')} to ${formatText(txEndDate || 'Any End')}\n`;
      csvContent += `Export Date,="${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN')}"\n\n`;

      csvContent += "Transaction ID,Student Name,Trainer Name,Course Name,Course Price,Commission Percentage,Admin Commission,Trainer Earnings,Payment Method,Payment Status,Transaction Date & Time\n";

      if (filteredList.length === 0) {
        csvContent += "No transactions matching selected date range found,,,,,,,,,,\n";
      } else {
        filteredList.forEach(p => {
          // Join student info
          const studentId = p.userId || p.studentId || p.learnerId || p.uid;
          const matchedStudent = studentId ? learnersList.find(l => l.id === studentId || l.uid === studentId) : null;
          const studentName = p.studentName || p.userName || p.name || matchedStudent?.fullName || matchedStudent?.name || '—';

          // Join course info
          const courseId = p.courseId || p.course_id;
          const matchedCourse = courseId ? coursesList.find(c => c.id === courseId) : null;
          const courseName = p.courseName || p.courseTitle || matchedCourse?.title || '—';

          // Join trainer info
          const trainerId = p.trainerId || p.trainerUid;
          const matchedTrainer = trainerId ? usersList.find(u => u.id === trainerId || u.uid === trainerId) : null;
          const trainerName = p.trainerName || matchedTrainer?.fullName || matchedTrainer?.name || matchedCourse?.trainerName || '—';

          // Financial breakdowns
          const coursePrice = getPurchaseAmount(p);
          const commission = typeof p.commission === 'number'
            ? p.commission
            : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
          
          const adminCommission = (coursePrice * commission) / 100;
          const trainerEarnings = coursePrice - adminCommission;
          const paymentMethod = p.paymentMethod || p.method || 'Razorpay';
          const paymentStatus = p.status || 'Completed';

          // Date & Time Formatting (DD-MMM-YYYY HH:mm:ss)
          const dateVal = p.createdAt || p.purchasedAt || p.timestamp;
          let dateTimeStr = '—';
          if (dateVal) {
            const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
            const day = String(d.getDate()).padStart(2, '0');
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = months[d.getMonth()];
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            dateTimeStr = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
          }

          csvContent += `${formatText(p.id)},${formatText(studentName)},${formatText(trainerName)},${formatText(courseName)},${formatCurrency(coursePrice)},${formatText(commission + '%')},${formatCurrency(adminCommission)},${formatCurrency(trainerEarnings)},${formatText(paymentMethod)},${formatText(paymentStatus)},${formatText(dateTimeStr)}\n`;
        });
      }

      // Trigger browser download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `bhartam_transactions_report_${txStartDate || 'all'}_to_${txEndDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export transactions: " + err.message);
    }
  };

  // ── Backup & Restore Handlers ──────────────────────────────────────────
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupStatus(null);
    const result = await createBackup();
    if (result.success) {
       setBackupStatus({ type: 'success', message: `Backup created successfully at ${new Date().toLocaleString()}` });
    } else {
       setBackupStatus({ type: 'error', message: `Backup failed: ${result.error}` });
    }
    setIsBackingUp(false);
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) return;
    if (!confirm('Are you sure you want to restore data from this backup? Existing data will not be overwritten.')) return;
    
    setIsRestoring(true);
    setRestoreStatus(null);
    const result = await restoreBackup(restoreFile);
    if (result.success) {
       setRestoreStatus({ type: 'success', message: `Restore completed! Restored: ${result.restoredCount}, Skipped: ${result.skippedCount}` });
       setRestoreFile(null);
    } else {
       setRestoreStatus({ type: 'error', message: `Restore failed: ${result.error}` });
    }
    setIsRestoring(false);
  };

  // ── Support & FAQ Handlers ────────────────────────────────────────────
  const handleReplyQuery = async (queryId) => {
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(db, 'bharatam_support_queries', queryId), {
        answer: replyText.trim(),
        status: 'answered',
        answeredAt: new Date().toISOString(),
        answeredBy: user?.fullName || 'Support Team',
      });
      setReplyQueryId(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to reply:', err);
      alert('Failed to send reply: ' + err.message);
    }
  };

  const handleDeleteQuery = async (queryId) => {
    if (!confirm('Are you sure you want to delete this support query?')) return;
    try {
      await deleteDoc(doc(db, 'bharatam_support_queries', queryId));
      if (selectedQueryId === queryId) {
        setSelectedQueryId(null);
      }
    } catch (err) {
      console.error('Failed to delete query:', err);
      alert('Failed to delete query: ' + err.message);
    }
  };

  const handleToggleSolvedQuery = async (queryId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'solved' ? 'pending' : 'solved';
      await updateDoc(doc(db, 'bharatam_support_queries', queryId), {
        status: nextStatus
      });
    } catch (err) {
      console.error('Failed to update query status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleAddFaq = async () => {
    if (!newFaqForm.question.trim() || !newFaqForm.answer.trim()) return;
    try {
      await addDoc(collection(db, 'bharatam_faqs'), {
        question: newFaqForm.question.trim(),
        answer: newFaqForm.answer.trim(),
        category: newFaqForm.category || 'general',
        createdAt: new Date().toISOString(),
        clicks: 0
      });
      setNewFaqForm({ question: '', answer: '', category: 'general' });
      setIsFaqFormOpen(false);
    } catch (err) {
      console.error('Failed to add FAQ:', err);
      alert('Failed to add FAQ: ' + err.message);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await deleteDoc(doc(db, 'bharatam_faqs', faqId));
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      alert('Failed to delete FAQ: ' + err.message);
    }
  };
  // ─────────────────────────────────────────────────────────────────────

  const pendingCourses = coursesList.filter(c => c.status === 'Pending Review' || c.status === 'Pending' || c.status !== 'Approved');
  const approvedCourses = coursesList.filter(c => c.status === 'Approved');

  // Dynamic filtering - items that are pending (not approved)
  let pendingMedia = [];
  coursesList.forEach(course => {
    (course.videos || []).forEach(v => {
      const videoStatus = v.status || 'Pending';
      if (videoStatus !== 'Approved' && videoStatus !== 'active') {
        pendingMedia.push({ ...v, courseId: course.id, courseTitle: course.title, trainerName: course.trainerName, type: 'video' });
      }
    });
    (course.pdfs || []).forEach(p => {
      const pdfStatus = p.status || 'Pending';
      if (pdfStatus !== 'Approved' && pdfStatus !== 'active') {
        pendingMedia.push({ ...p, courseId: course.id, courseTitle: course.title, trainerName: course.trainerName, type: 'pdf' });
      }
    });
  });

  // Flatten all videos for the 'All' table view
  const allVideos = [];
  coursesList.forEach(course => {
    (course.videos || []).forEach(v => {
      allVideos.push({
        ...v,
        courseId: course.id,
        courseTitle: course.title,
        trainerName: course.trainerName,
      });
    });
  });

  // Approved media (videos/pdf) - items that are approved
  const approvedMedia = [];
  coursesList.forEach(course => {
    (course.videos || []).forEach(v => {
      const videoStatus = v.status || 'Pending';
      if (videoStatus === 'Approved' || videoStatus === 'active') {
        approvedMedia.push({ ...v, courseId: course.id, courseTitle: course.title, trainerName: course.trainerName, type: 'video' });
      }
    });
    (course.pdfs || []).forEach(p => {
      const pdfStatus = p.status || 'Pending';
      if (pdfStatus === 'Approved' || pdfStatus === 'active') {
        approvedMedia.push({ ...p, courseId: course.id, courseTitle: course.title, trainerName: course.trainerName, type: 'pdf' });
      }
    });
  });

  // Unified List Mappings for Unified Approvals Table
  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  const formatStatus = (s) => {
    if (!s) return 'Pending';
    const str = String(s || '');
    if (str.toLowerCase() === 'active') return 'Approved';
    return str.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const getNextMediaOrder = (items = []) => {
    const maxOrder = items.reduce((max, item) => {
      const order = Number(item?.order || 0);
      return Number.isFinite(order) && order > max ? order : max;
    }, 0);
    return Math.max(maxOrder, items.length) + 1;
  };

  const getNextOrderForSelectedMedia = () => {
    const course = coursesList.find(c => c.id === newMediaForm.courseId);
    if (!course) return '';
    const mediaKey = newMediaForm.type === 'video' ? 'videos' : 'pdfs';
    return getNextMediaOrder(course[mediaKey] || []);
  };

  const isApprovedStatus = (s) => {
    const v = (s || '').toString().toLowerCase();
    return v === 'approved' || v === 'active';
  };

  const mapCourseToUnified = (c) => ({
    id: c.id,
    unifiedType: 'course',
    typeLabel: 'Course',
    title: c.title,
    courseId: c.id,
    courseTitle: '',
    trainerName: c.trainerName || 'Unknown',
    price: c.price === 'Free' || c.price === '0' || !c.price ? 'Free' : `₹${c.price}`,
    category: c.subject || c.category || 'General',
    thumbnail: c.thumbnail || '',
    previewUrl: '',
    status: c.status || 'Pending',
    createdAt: c.createdAt || '',
    originalItem: c
  });

  const mapMediaToUnified = (m, course) => ({
    id: m.id,
    unifiedType: m.contentType === 'pdf' || m.type === 'pdf' ? 'pdf' : 'video',
    typeLabel: m.contentType === 'pdf' || m.type === 'pdf' ? 'PDF' : 'Video',
    title: m.title || m.fileName || '',
    courseId: course.id,
    courseTitle: course.title,
    trainerName: course.trainerName || 'Unknown',
    price: m.price === 'Free' || m.price === '0' || !m.price ? 'Free' : `₹${m.price}`,
    category: course.subject || course.category || 'General',
    thumbnail: course.thumbnail || '',
    previewUrl: m.url || m.storageUrl || '',
    status: m.status || 'Pending',
    createdAt: m.addedAt || m.createdAt || '',
    originalItem: m
  });

  const allUnified = [];
  coursesList.forEach(course => {
    allUnified.push(mapCourseToUnified(course));
    (course.videos || []).forEach(v => allUnified.push(mapMediaToUnified(v, course)));
    (course.pdfs || []).forEach(p => allUnified.push(mapMediaToUnified(p, course)));
  });

  const pendingUnified = allUnified.filter(item => {
    const itemStatus = item.status || 'Pending';
    return itemStatus !== 'Approved' && itemStatus !== 'active';
  });

  const approvedUnified = allUnified.filter(item => {
    const itemStatus = item.status || 'Pending';
    return itemStatus === 'Approved' || itemStatus === 'active';
  });

  const filterUnifiedList = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.courseTitle || '').toLowerCase().includes(q) ||
      (item.trainerName || '').toLowerCase().includes(q) ||
      (item.typeLabel || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  };


  const renderUnifiedTable = (items, emptyMessage) => {
    const filteredItems = filterUnifiedList(items);

    return (
      <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
        <table className="min-w-[900px] w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5 first:rounded-tl-2xl">Content</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3.5">Trainer</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3.5">Category</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3.5">Price</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3.5">Status</th>
              <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3.5 last:rounded-tr-2xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8 text-gray-200" />
                    <p className="text-gray-400 font-semibold text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isCourse = item.unifiedType === 'course';
                const isVideo = item.unifiedType === 'video';
                const isPdf = item.unifiedType === 'pdf';
                const dateStr = formatDate(item.createdAt);

                return (
                  <tr key={`${item.unifiedType}-${item.id}`} className="hover:bg-orange-50/30 transition-colors group">
                    {/* Content — Type badge + Title + Course */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail / Icon */}
                        <div className="flex-shrink-0">
                          {isCourse ? (
                            item.thumbnail ? (
                              <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                <BookOpen className="w-4.5 h-4.5 text-blue-400" />
                              </div>
                            )
                          ) : isVideo ? (
                            item.previewUrl ? (
                              <div
                                onClick={() => openPreview(item.previewUrl, item.title)}
                                className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                              >
                                <Video className="w-4.5 h-4.5 text-purple-500" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                                <Video className="w-4.5 h-4.5 text-purple-400" />
                              </div>
                            )
                          ) : (
                            item.previewUrl ? (
                              <button onClick={() => openPreview(item.previewUrl, item.title)} className="block">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 hover:bg-rose-100 transition-colors">
                                  <FileText className="w-4.5 h-4.5 text-rose-500" />
                                </div>
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
                                <FileText className="w-4.5 h-4.5 text-rose-400" />
                              </div>
                            )
                          )}
                        </div>
                        {/* Text Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${isCourse ? 'bg-blue-100 text-blue-600' :
                                isVideo ? 'bg-purple-100 text-purple-600' :
                                  'bg-rose-100 text-rose-600'
                              }`}>
                              {item.typeLabel}
                            </span>
                            {dateStr && (
                              <span className="text-[10px] text-gray-300 font-medium">{dateStr}</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-800 truncate max-w-[260px]" title={item.title}>
                            {item.title}
                          </p>
                          {!isCourse && item.courseTitle && (
                            <p className="text-[11px] text-gray-400 font-medium truncate max-w-[240px]" title={item.courseTitle}>
                              in {item.courseTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Trainer */}
                    <td className="px-4 py-4 align-middle">
                      <span className="text-sm font-semibold text-gray-600">{item.trainerName}</span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 align-middle">
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        {item.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4 align-middle">
                      <span className={`text-sm font-bold ${item.price === 'Free' ? 'text-emerald-500' : 'text-gray-800'}`}>
                        {item.price}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 align-middle">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${isApprovedStatus(item.status) ? 'bg-emerald-50 text-emerald-600' : item.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isApprovedStatus(item.status) ? 'bg-emerald-500' : item.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                        {formatStatus(item.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex justify-end items-center gap-2">
                        {(!isApprovedStatus(item.status)) && (
                          <button
                            onClick={() => isCourse ? handleCourseStatus(item.id, 'Approved') : handleMediaStatus(item.courseId, item.id, item.unifiedType, 'Approved')}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
                          >
                            Approve
                          </button>
                        )}
                        {(!isApprovedStatus(item.status) && (item.status || '').toString().toLowerCase() !== 'rejected') && (
                          <button
                            onClick={() => isCourse ? handleCourseStatus(item.id, 'Rejected') : handleMediaStatus(item.courseId, item.id, item.unifiedType, 'Rejected')}
                            className="px-3.5 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all active:scale-95"
                          >
                            Reject
                          </button>
                        )}
                        {(isApprovedStatus(item.status)) && (
                          <button
                            onClick={() => isCourse ? handleCourseStatus(item.id, 'Pending Review') : handleMediaStatus(item.courseId, item.id, item.unifiedType, 'Pending Review')}
                            className="px-3.5 py-1.5 bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-bold transition-all active:scale-95"
                          >
                            Revoke
                          </button>
                        )}
                        {!isCourse && (
                          <button
                            onClick={() => handleRemoveMedia(item.courseId, item.id, item.unifiedType)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render courses with expandable media lists for easier Superadmin review
  const renderCourseApprovalList = (coursesToRender, emptyMessage) => {
    if (!coursesToRender || coursesToRender.length === 0) {
      return (
        <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 font-bold">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Course</th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Trainer</th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Category</th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Price</th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Media Type</th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Title</th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Added</th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-4 py-3">Status</th>
              <th className="text-right text-xs font-bold text-gray-400 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coursesToRender.map(course => {
              const mediaRows = [...(course.videos || []).map(m => ({ ...m, mediaType: 'video' })), ...(course.pdfs || []).map(m => ({ ...m, mediaType: 'pdf' }))];
              const rowSpan = Math.max(1, mediaRows.length);

              if (mediaRows.length === 0) {
                return (
                  <tr key={`course-${course.id}`} className="border-t">
                    <td className="px-4 py-3 font-bold">{course.title}</td>
                    <td className="px-4 py-3">{course.trainerName || 'Unknown'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase rounded">{course.subject || course.category || 'General'}</span></td>
                    <td className="px-4 py-3">{course.price === 'Free' ? 'Free' : (course.price ? `₹${course.price}` : '—')}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">—</td>
                    <td className="px-4 py-3 text-sm text-gray-700">—</td>
                    <td className="px-4 py-3 text-sm text-gray-400">—</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-50 text-emerald-600' : (course.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>{formatStatus(course.status)}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleApproveCourseAndAllMedia(course.id, true)} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold mr-2">Approve All</button>
                      <button onClick={() => handleApproveCourseAndAllMedia(course.id, false)} className="px-3 py-1 bg-white border border-red-200 text-red-500 rounded text-xs font-bold">Reject All</button>
                    </td>
                  </tr>
                );
              }

              return (
                <>
                  {mediaRows.map((m, idx) => (
                    <tr key={`${course.id}-${m.id}`} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      {idx === 0 && (
                        <td rowSpan={rowSpan} className="px-4 py-3 font-bold align-top">{course.title}</td>
                      )}
                      {idx === 0 && (
                        <td rowSpan={rowSpan} className="px-4 py-3 align-top">{course.trainerName || 'Unknown'}</td>
                      )}
                      {idx === 0 && (
                        <td rowSpan={rowSpan} className="px-4 py-3 align-top"><span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase rounded">{course.subject || course.category || 'General'}</span></td>
                      )}
                      {idx === 0 && (
                        <td rowSpan={rowSpan} className="px-4 py-3 align-top">{course.price === 'Free' ? 'Free' : (course.price ? `₹${course.price}` : '—')}</td>
                      )}

                      <td className="px-4 py-3 text-sm font-bold">{m.mediaType.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{m.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{m.addedAt}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-full ${isApprovedStatus(m.status) ? 'bg-emerald-50 text-emerald-600' : (m.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                          <span className={`w-2 h-2 rounded-full ${isApprovedStatus(m.status) ? 'bg-emerald-500' : (m.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                          {formatStatus(m.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {m.mediaType === 'video' ? (
                            <button onClick={() => openPreview(m.url, m.title)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">Preview</button>
                          ) : (
                            <button onClick={() => openPreview(m.url, m.title)} className="px-3 py-1 bg-gray-50 text-gray-600 rounded text-xs font-bold">Open</button>
                          )}
                          {m.status !== 'Approved' && m.url && m.url !== '' && <button onClick={() => handleMediaStatus(course.id, m.id, m.mediaType === 'video' ? 'video' : 'pdf', 'Approved')} className="px-3 py-1 bg-emerald-500 text-white rounded text-xs font-bold">Approve</button>}
                          {m.status !== 'Rejected' && <button onClick={() => handleMediaStatus(course.id, m.id, m.mediaType === 'video' ? 'video' : 'pdf', 'Rejected')} className="px-3 py-1 bg-white border border-red-200 text-red-500 rounded text-xs font-bold">Reject</button>}
                          <button onClick={() => handleRemoveMedia(course.id, m.id, m.mediaType === 'video' ? 'video' : 'pdf')} className="px-2 py-1 text-gray-400 hover:text-red-500">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderGroupedCourseApprovalList = (coursesToRender, emptyMessage) => {
    if (!coursesToRender || coursesToRender.length === 0) {
      return (
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <BookOpen className="w-9 h-9 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-bold">{emptyMessage}</p>
        </div>
      );
    }

    const getCourseCategory = (course) => course.subject || course.category || 'General';
    const getCoursePrice = (course) => (
      course.price === 'Free' ? 'Free' : (course.price ? `₹${course.price}` : '-')
    );
    const getCourseMediaRows = (course) => [
      ...(course.videos || []).map(m => ({ ...m, mediaType: 'video' })),
      ...(course.pdfs || []).map(m => ({ ...m, mediaType: 'pdf' }))
    ];

    const categoryGroups = Object.entries(
      coursesToRender.reduce((groups, course) => {
        const category = getCourseCategory(course);
        if (!groups[category]) groups[category] = [];
        groups[category].push(course);
        return groups;
      }, {})
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, courses]) => {
        const mediaCount = courses.reduce((total, course) => total + getCourseMediaRows(course).length, 0);
        const pendingCount = courses.filter(course => {
          const mediaRows = getCourseMediaRows(course);
          return !isApprovedStatus(course.status) || mediaRows.some(m => !isApprovedStatus(m.status));
        }).length;
        const approvedCount = courses.filter(course => {
          const mediaRows = getCourseMediaRows(course);
          return isApprovedStatus(course.status) && mediaRows.every(m => isApprovedStatus(m.status));
        }).length;

        return { category, courses, mediaCount, pendingCount, approvedCount };
      });

    const handleCategoryDecision = async (courses, approve = true) => {
      const proceed = confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} all courses in this category group?`);
      if (!proceed) return;
      for (const course of courses) {
        await handleApproveCourseAndAllMedia(course.id, approve);
      }
    };

    return (
      <div className="space-y-5">
        {categoryGroups.map(group => (
          <section key={group.category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 bg-gray-50/70 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-base font-black text-gray-900">{group.category}</h5>
                  <p className="text-xs font-semibold text-gray-400">
                    {group.courses.length} course{group.courses.length === 1 ? '' : 's'} · {group.mediaCount} material{group.mediaCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[11px] font-bold">
                  {group.pendingCount} Pending
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                  {group.approvedCount} Approved
                </span>
                <button onClick={() => handleCategoryDecision(group.courses, true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm">
                  Approve Group
                </button>
                <button onClick={() => handleCategoryDecision(group.courses, false)} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold">
                  Reject Group
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="min-w-[980px] w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Course</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Trainer</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Price</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Material</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Added</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.courses.map(course => {
                    const mediaRows = getCourseMediaRows(course);
                    const rowSpan = Math.max(1, mediaRows.length);

                    if (mediaRows.length === 0) {
                      return (
                        <tr key={`course-${course.id}`} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-black text-gray-800">{course.title}</p>
                            <p className="text-[11px] font-semibold text-gray-400">Course only</p>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-600">{course.trainerName || 'Unknown'}</td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-800">{getCoursePrice(course)}</td>
                          <td className="px-4 py-4 text-sm text-gray-400">No material</td>
                          <td className="px-4 py-4 text-sm text-gray-400">-</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-50 text-emerald-600' : (course.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                              <span className={`w-2 h-2 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-500' : (course.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                              {formatStatus(course.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => handleApproveCourseAndAllMedia(course.id, true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold mr-2">Approve All</button>
                            <button onClick={() => handleApproveCourseAndAllMedia(course.id, false)} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold">Reject All</button>
                          </td>
                        </tr>
                      );
                    }

                    return mediaRows.map((m, idx) => (
                      <tr key={`${course.id}-${m.id}`} className="hover:bg-orange-50/20 transition-colors">
                        {idx === 0 && (
                          <td rowSpan={rowSpan} className="px-5 py-4 align-top">
                            <p className="text-sm font-black text-gray-800">{course.title}</p>
                            <p className="text-[11px] font-semibold text-gray-400">{mediaRows.length} material{mediaRows.length === 1 ? '' : 's'}</p>
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={rowSpan} className="px-4 py-4 align-top text-sm font-semibold text-gray-600">{course.trainerName || 'Unknown'}</td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={rowSpan} className="px-4 py-4 align-top text-sm font-bold text-gray-800">{getCoursePrice(course)}</td>
                        )}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${m.mediaType === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600'}`}>
                              {m.mediaType === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              {m.mediaType}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{m.title || m.fileName || 'Untitled'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-400">{formatDate(m.addedAt || m.createdAt)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-full ${isApprovedStatus(m.status) ? 'bg-emerald-50 text-emerald-600' : (m.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                            <span className={`w-2 h-2 rounded-full ${isApprovedStatus(m.status) ? 'bg-emerald-500' : (m.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                            {formatStatus(m.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {m.mediaType === 'video' ? (
                              <button onClick={() => openPreview(m.url, m.title)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Preview</button>
                            ) : (
                              <button onClick={() => openPreview(m.url, m.title)} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold">Open</button>
                            )}
                            {m.status !== 'Approved' && m.url && m.url !== '' && <button onClick={() => handleMediaStatus(course.id, m.id, m.mediaType === 'video' ? 'video' : 'pdf', 'Approved')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold">Approve</button>}
                            {m.status !== 'Rejected' && <button onClick={() => handleMediaStatus(course.id, m.id, m.mediaType === 'video' ? 'video' : 'pdf', 'Rejected')} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold">Reject</button>}
                            <button onClick={() => handleRemoveMedia(course.id, m.id, m.mediaType === 'video' ? 'video' : 'pdf')} className="px-2 py-1 text-gray-400 hover:text-red-500">Remove</button>
                            {idx === 0 && (
                              <button onClick={() => handleApproveCourseAndAllMedia(course.id, true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Approve All</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderSimpleGroupedCourseApprovalList = (coursesToRender, emptyMessage) => {
    if (!coursesToRender || coursesToRender.length === 0) {
      return (
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <BookOpen className="w-9 h-9 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-bold">{emptyMessage}</p>
        </div>
      );
    }

    const uniqueCourses = Array.from(
      new Map(coursesToRender.map(course => [
        course.id || `${course.trainerName || 'Unknown'}-${course.title}-${course.subject || course.category || 'General'}`,
        course
      ])).values()
    );

    const categoryGroups = Object.entries(
      uniqueCourses.reduce((groups, course) => {
        const category = course.subject || course.category || 'General';
        if (!groups[category]) groups[category] = [];
        groups[category].push(course);
        return groups;
      }, {})
    ).sort(([a], [b]) => a.localeCompare(b));

    const getCoursePrice = (course) => (
      course.price === 'Free' ? 'Free' : (course.price ? `₹${course.price}` : '-')
    );
    const getCourseMaterials = (course) => [
      ...(course.videos || []).map(item => ({ ...item, materialType: 'Video' })),
      ...(course.pdfs || []).map(item => ({ ...item, materialType: 'PDF' }))
    ];
    const getTrainerName = (course) => course.trainerName || course.trainer || 'Unknown';
    let serialNumber = 0;

    return (
      <div className="space-y-5">
        {categoryGroups.map(([category, courses]) => (
          <section key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-4 bg-gray-50/70 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-base font-black text-gray-900">{category}</h5>
                  <p className="text-xs font-semibold text-gray-400">{courses.length} course{courses.length === 1 ? '' : 's'}</p>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="min-w-[760px] w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Trainer Name</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Course Name</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Price</th>
                    <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {courses.map(course => {
                    const courseKey = course.id || `${course.trainerName}-${course.title}`;
                    const isExpanded = expandedCourseId === courseKey;
                    const materials = getCourseMaterials(course);

                    return (
                      <>
                        <tr key={courseKey} className="hover:bg-orange-50/20 transition-colors">
                          <td className="px-5 py-4 text-sm font-semibold text-gray-700">{course.trainerName || 'Unknown'}</td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setExpandedCourseId(isExpanded ? null : courseKey)}
                              className="text-sm font-black text-orange-600 hover:text-orange-700 hover:underline"
                            >
                              {course.title}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-800">{getCoursePrice(course)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-50 text-emerald-600' : (course.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                              <span className={`w-2 h-2 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-500' : (course.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                              {formatStatus(course.status)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => handleApproveCourseAndAllMedia(course.id, true)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold mr-2">Approve</button>
                            <button onClick={() => handleApproveCourseAndAllMedia(course.id, false)} className="px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold">Reject</button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${courseKey}-details`} className="bg-orange-50/20">
                            <td colSpan={5} className="px-5 py-4">
                              <div className="rounded-xl border border-orange-100 bg-white overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100">
                                  <h6 className="text-sm font-black text-gray-900">{course.title} Details</h6>
                                </div>
                                <table className="w-full min-w-[640px]">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-2">Type</th>
                                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-2">Title</th>
                                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-2">Added</th>
                                      <th className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-2">Status</th>
                                      <th className="text-right text-[10px] font-bold text-gray-400 uppercase px-4 py-2">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {materials.length === 0 ? (
                                      <tr>
                                        <td colSpan={5} className="px-4 py-5 text-center text-sm font-semibold text-gray-400">No course material added.</td>
                                      </tr>
                                    ) : materials.map(material => (
                                      <tr key={material.id || material.title}>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700">{material.materialType}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700">{material.title || material.fileName || 'Untitled'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-400">{formatDate(material.addedAt || material.createdAt)}</td>
                                        <td className="px-4 py-3">
                                          <span className={`inline-flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-full ${isApprovedStatus(material.status) ? 'bg-emerald-50 text-emerald-600' : (material.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                                            <span className={`w-2 h-2 rounded-full ${isApprovedStatus(material.status) ? 'bg-emerald-500' : (material.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                                            {formatStatus(material.status)}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <button onClick={() => openPreview(material.url || material.storageUrl || material.bunnyVideoId, material.title || material.fileName, material.materialType.toLowerCase())} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold">Open</button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    );
  };

  const renderTableGroupedCourseApprovalList = (coursesToRender, emptyMessage) => {
    if (!coursesToRender || coursesToRender.length === 0) {
      return (
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <BookOpen className="w-9 h-9 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-bold">{emptyMessage}</p>
        </div>
      );
    }

    const uniqueCourses = Array.from(
      new Map(coursesToRender.map(course => [
        course.id || `${course.trainerName || 'Unknown'}-${course.title}-${course.subject || course.category || 'General'}`,
        course
      ])).values()
    );

    const getCoursePrice = (course) => (
      course.price === 'Free' ? 'Free' : (course.price ? course.price : '-')
    );
    const getCourseCategory = (course) => course.subject || course.category || 'General';
    const getTrainerName = (course) => course.trainerName || course.trainer || 'Unknown';
    const getCourseMaterials = (course) => [
      ...(course.videos || []).map(item => ({ ...item, materialType: 'Video' })),
      ...(course.pdfs || []).map(item => ({ ...item, materialType: 'PDF' }))
    ];

    const sortedCourses = [...uniqueCourses].sort((a, b) => {
      const categoryCompare = getCourseCategory(a).localeCompare(getCourseCategory(b));
      if (categoryCompare !== 0) return categoryCompare;
      const trainerCompare = getTrainerName(a).localeCompare(getTrainerName(b));
      if (trainerCompare !== 0) return trainerCompare;
      return (a.title || '').localeCompare(b.title || '');
    });
    const coursesPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(sortedCourses.length / coursesPerPage));
    const safeCoursePage = Math.min(coursePage, totalPages);
    const startIndex = (safeCoursePage - 1) * coursesPerPage;
    const paginatedCourses = sortedCourses.slice(startIndex, startIndex + coursesPerPage);

    return (
      <div className="w-full overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-[6%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-5 py-3.5">Sr No</th>
                <th className="w-[13%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Trainer</th>
                <th className="w-[17%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Course</th>
                <th className="w-[18%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Category</th>
                <th className="w-[7%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Price</th>
                <th className="w-[12%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Status</th>
                <th className="w-[6%] text-center text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">View</th>
                <th className="w-[21%] text-right text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedCourses.map((course, index) => {
                const courseKey = course.id || `${getTrainerName(course)}-${course.title}`;
                const materials = getCourseMaterials(course);
                const category = getCourseCategory(course);

                return (
                  <Fragment key={courseKey}>
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 lg:px-5 py-4 text-sm font-black text-slate-500">{startIndex + index + 1}</td>
                      <td className="px-3 lg:px-4 py-4 text-sm font-semibold text-gray-700 break-words">{getTrainerName(course)}</td>
                      <td className="px-3 lg:px-4 py-4">
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setMaterialFilter('all');
                          }}
                          className="text-sm font-black text-gray-900 hover:text-orange-600 text-left break-words"
                        >
                          {course.title}
                        </button>
                        <p className="mt-1 text-[11px] font-semibold text-gray-400">{materials.length} material{materials.length === 1 ? '' : 's'}</p>
                      </td>
                      <td className="px-3 lg:px-4 py-4">
                        <span className="inline-flex max-w-full px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-[11px] font-black break-words whitespace-normal">{category}</span>
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-sm font-bold text-gray-800 break-words">{getCoursePrice(course)}</td>
                      <td className="px-3 lg:px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] lg:text-[11px] font-bold px-2 py-1 rounded-full whitespace-normal ${isApprovedStatus(course.status) ? 'bg-emerald-50 text-emerald-600' : (course.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                          <span className={`w-2 h-2 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-500' : (course.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                          {formatStatus(course.status)}
                        </span>
                      </td>
                      {/* Eye icon — view course materials */}
                      <td className="px-3 lg:px-4 py-4 text-center">
                        <button
                          type="button"
                          title={`View materials for ${course.title}`}
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setMaterialFilter('all');
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-all active:scale-95 shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-3 lg:px-5 py-4">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setApproveCourseModal(course);
                              setApproveCommissionInput(course.commission !== undefined && course.commission !== null ? course.commission : globalCommission);
                              setUseCustomCommission(course.commission !== undefined && course.commission !== null);
                            }}
                            className="px-3 lg:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-sm"
                          >
                            Approve
                          </button>
                          <button onClick={() => handleApproveCourseAndAllMedia(course.id, false)} className="px-3 lg:px-3.5 py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-black">Reject</button>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {sortedCourses.length > coursesPerPage && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-white">
            <p className="text-xs font-bold text-gray-400">
              Showing {startIndex + 1}-{Math.min(startIndex + coursesPerPage, sortedCourses.length)} of {sortedCourses.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCoursePage(page => Math.max(1, page - 1))}
                disabled={safeCoursePage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-black">
                {safeCoursePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCoursePage(page => Math.min(totalPages, page + 1))}
                disabled={safeCoursePage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-black text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCourseMaterialsPage = (course) => {
    if (!course) return null;

    const videos = (course.videos || []).map(item => ({ ...item, materialType: 'video' }));
    const pdfs = (course.pdfs || []).map(item => ({ ...item, materialType: 'pdf' }));
    const allMaterials = [...videos, ...pdfs].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    const filteredMaterials = materialFilter === 'all'
      ? allMaterials
      : allMaterials.filter(item => item.materialType === materialFilter);

    const courseCategory = course.subject || course.category || 'General';
    const coursePrice = course.price === 'Free' ? 'Free' : (course.price ? course.price : '-');

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setSelectedCourseId(null)}
                className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-orange-600 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to courses
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h3 className="text-2xl font-black text-slate-950 break-words">{course.title || 'Untitled Course'}</h3>
                <span className={`w-fit inline-flex items-center gap-2 text-[11px] font-bold px-2.5 py-1 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-50 text-emerald-600' : (course.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                  <span className={`w-2 h-2 rounded-full ${isApprovedStatus(course.status) ? 'bg-emerald-500' : (course.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                  {formatStatus(course.status)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600">{course.trainerName || course.trainer || 'Unknown Trainer'}</span>
                <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-600">{courseCategory}</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600">{coursePrice}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[260px]">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-black text-slate-950">{allMaterials.length}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">Total</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3 text-center">
                <p className="text-xl font-black text-purple-700">{videos.length}</p>
                <p className="text-[10px] font-bold uppercase text-purple-400">Videos</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 text-center">
                <p className="text-xl font-black text-rose-700">{pdfs.length}</p>
                <p className="text-[10px] font-bold uppercase text-rose-400">PDFs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Materials', count: allMaterials.length, icon: BookOpen },
              { id: 'video', label: 'Videos', count: videos.length, icon: Video },
              { id: 'pdf', label: 'PDFs', count: pdfs.length, icon: FileText }
            ].map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setMaterialFilter(filter.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-black transition-colors ${materialFilter === filter.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                  }`}
              >
                <filter.icon className="w-4 h-4" />
                {filter.label}
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${materialFilter === filter.id ? 'bg-white/20 text-white' : 'bg-white text-slate-400'}`}>{filter.count}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No materials found for this filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="w-[9%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-5 py-3.5">Order</th>
                    <th className="w-[13%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Type</th>
                    <th className="w-[31%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Title</th>
                    <th className="w-[13%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Added</th>
                    <th className="w-[15%] text-left text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-4 py-3.5">Status</th>
                    <th className="w-[19%] text-right text-[10px] lg:text-[11px] font-black text-slate-500 uppercase px-3 lg:px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map(material => {
                    const isPdf = material.materialType === 'pdf';
                    const title = material.title || material.fileName || 'Untitled';
                    const previewUrl = material.url || material.storageUrl || material.bunnyVideoId || '';
                    return (
                      <tr key={`${material.materialType}-${material.id || title}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 lg:px-5 py-4 text-sm font-black text-slate-500">{Number(material.order || 0) || '-'}</td>
                        <td className="px-3 lg:px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${isPdf ? 'bg-rose-50 text-rose-600' : 'bg-purple-50 text-purple-600'}`}>
                            {isPdf ? <FileText className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                            {isPdf ? 'PDF' : 'Video'}
                          </span>
                        </td>
                        <td className="px-3 lg:px-4 py-4">
                          <p className="text-sm font-black text-slate-950 break-words">{title}</p>
                        </td>
                        <td className="px-3 lg:px-4 py-4 text-xs lg:text-sm font-semibold text-slate-500 break-words">
                          {formatDate(material.addedAt || material.createdAt) || '-'}
                        </td>
                        <td className="px-3 lg:px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] lg:text-[11px] font-bold px-2 py-1 rounded-full whitespace-normal ${isApprovedStatus(material.status) ? 'bg-emerald-50 text-emerald-600' : (material.status === 'Rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600')}`}>
                            <span className={`w-2 h-2 rounded-full ${isApprovedStatus(material.status) ? 'bg-emerald-500' : (material.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500')}`}></span>
                            {formatStatus(material.status)}
                          </span>
                        </td>
                        <td className="px-3 lg:px-5 py-4">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {previewUrl && (
                              <button
                                type="button"
                                onClick={() => openPreview(previewUrl, title, material.materialType)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black"
                              >
                                Open
                              </button>
                            )}
                            {!isApprovedStatus(material.status) && (
                              <button
                                type="button"
                                onClick={() => handleMediaStatus(course.id, material.id, material.materialType, 'Approved')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                              >
                                Approve
                              </button>
                            )}
                            {!isApprovedStatus(material.status) && material.status !== 'Rejected' && (
                              <button
                                type="button"
                                onClick={() => handleMediaStatus(course.id, material.id, material.materialType, 'Rejected')}
                                className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-black"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Dynamic Chart Data based on user registration
  const getDynamicChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array(12).fill(0);

    usersList.forEach(user => {
      if (user.createdAt) {
        const date = user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000) : new Date(user.createdAt);
        if (date.getFullYear() === new Date().getFullYear()) {
          data[date.getMonth()] += 1;
        }
      }
    });

    // Default dummy data if platform has very few users, just to make the graph look good
    const displayData = data.reduce((a, b) => a + b, 0) < 5
      ? [12, 19, 15, 25, 22, 30, 28, 35, 40, 45, 50, 55]
      : data;

    const maxVal = Math.max(...displayData, 10);

    return {
      chartData: displayData.map((val, i) => ({ label: months[i], value: val })),
      maxChartValue: maxVal
    };
  };

  const { chartData, maxChartValue } = getDynamicChartData();

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCourseForm({ ...newCourseForm, thumbnail: reader.result, thumbnailFile: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlockUser = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "bharatam_users", userId);
      await updateDoc(userRef, { isBlocked: !currentStatus });
    } catch (err) {
      console.error("Failed to block user", err);
      alert("Failed to update user status");
    }
  };

  const getCategoryEmoji = (cat) => {
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
  };

  const handleAdminCreateCourse = async () => {
    if (!newCourseForm.title || !newCourseForm.category) {
      alert("Title and Category are required!");
      return;
    }

    try {
      let thumbnailUrl = '';
      if (newCourseForm.thumbnailFile) {
        // Upload the thumbnail image to Bunny.net
        const { cdnUrl } = await uploadToBunny(newCourseForm.thumbnailFile, 'bharatm_library/thumbnails');
        thumbnailUrl = cdnUrl;
      } else {
        thumbnailUrl = newCourseForm.thumbnail || '';
      }

      const categoryEmoji = getCategoryEmoji(newCourseForm.category);
      const priceVal = Number(newCourseForm.price || 0);

      const newCourseData = {
        approvalStatus: 'approved',
        approvedAt: serverTimestamp(),
        category: newCourseForm.category,
        contentApprovalStatus: 'approved',
        courseName: newCourseForm.title,
        createdAt: serverTimestamp(),
        description: newCourseForm.description || '',
        hasPendingContent: false,
        isApproved: true,
        lifetimePrice: priceVal,
        limitedTimeDays: 30,
        limitedTimePrice: priceVal,
        oneTimePrice: newCourseForm.isFree ? 0 : priceVal,
        thumbnailUrl: thumbnailUrl,
        trainerId: user?.uid || 'admin',
        trainerName: user?.fullName || 'Super Admin',
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "bharatam_courses"), newCourseData);
      alert("Course published successfully!");
      setIsCreateCourseOpen(false);
      setNewCourseForm({ title: '', description: '', category: '', price: '', isFree: false, thumbnail: null, thumbnailFile: null });
    } catch (err) {
      console.error(err);
      alert("Failed to publish course: " + err.message);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      alert("Please enter a category name");
      return;
    }

    try {
      const now = new Date();
      await addDoc(collection(db, "bharatam_categories"), {
        name,
        normalizedName: name.trim().toLowerCase(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      setNewCategoryName('');
    } catch (err) {
      console.error(err);
      alert("Failed to add category: " + err.message);
    }
  };

  const handleToggleCategoryActive = async (categoryId, currentIsActive) => {
    try {
      await updateDoc(doc(db, "bharatam_categories", categoryId), {
        isActive: !currentIsActive,
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Failed to toggle category:", err);
      alert("Failed to update category: " + err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "bharatam_categories", categoryId));
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert("Failed to delete category: " + err.message);
    }
  };

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      alert("Please enter a tag name");
      return;
    }
    try {
      const now = new Date();
      await addDoc(collection(db, "bharatam_tags"), {
        name,
        createdAt: now,
      });
      setNewTagName('');
    } catch (err) {
      console.error("Failed to add tag:", err);
      alert("Failed to add tag: " + err.message);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm("Delete this tag? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "bharatam_tags", tagId));
    } catch (err) {
      console.error("Failed to delete tag:", err);
      alert("Failed to delete tag: " + err.message);
    }
  };

  const handleSavePolicies = async () => {
    setIsSavingPolicies(true);
    try {
      await setDoc(doc(db, 'bharatam_settings', 'policies'), {
        ...policiesInput,
        updatedAt: new Date(),
      }, { merge: true });
      setIsPoliciesModalOpen(false);
    } catch (err) {
      console.error("Failed to save policies:", err);
      alert("Failed to save policies: " + err.message);
    } finally {
      setIsSavingPolicies(false);
    }
  };

  const handleQuickAddAdvertisement = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingAd(true);
      const { cdnUrl } = await uploadToBunny(file, 'bharatm_library/advertisements');

      await addDoc(collection(db, "advertisements"), {
        title: 'Advertisement Banner',
        imageUrl: cdnUrl,
        linkUrl: '',
        status: 'active',
        createdAt: new Date().toISOString()
      });
      alert("Advertisement added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add advertisement: " + err.message);
    } finally {
      setIsUploadingAd(false);
      e.target.value = '';
    }
  };

  const handleAddAdvertisement = async () => {
    if (!newAdForm.title.trim() || !newAdForm.imageUrl.trim()) {
      alert("Ad title and image URL are required");
      return;
    }

    try {
      await addDoc(collection(db, "advertisements"), {
        title: newAdForm.title.trim(),
        imageUrl: newAdForm.imageUrl.trim(),
        linkUrl: newAdForm.linkUrl.trim(),
        status: 'active',
        createdAt: new Date().toISOString()
      });
      alert("Advertisement added successfully!");
      setNewAdForm({ title: '', imageUrl: '', linkUrl: '' });
      setIsAdFormOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add advertisement: " + err.message);
    }
  };

  const handleDeleteAdvertisement = async (adId) => {
    if (!confirm("Delete this advertisement?")) return;

    try {
      await deleteDoc(doc(db, "advertisements", adId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete advertisement: " + err.message);
    }
  };

  const handleAdminUploadMedia = async () => {
    if (!newMediaForm.courseId || !newMediaForm.title) {
      alert("Please select a Course and enter a Title");
      return;
    }
    if (!selectedFile && !newMediaForm.url) {
      alert("Please either upload a file or paste a CDN URL");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let finalUrl = newMediaForm.url ? normalizeBunnyUrl(newMediaForm.url) : '';

      // If a file was selected, upload to Bunny.net first
      if (selectedFile) {
        if (newMediaForm.type === 'video') {
          // Try secure server-side upload first
          try {
            const fd = new FormData();
            fd.append('file', selectedFile, selectedFile.name);
            fd.append('title', newMediaForm.title || selectedFile.name);

            const proxyRes = await fetch('/api/upload', { method: 'POST', body: fd });
            if (proxyRes.ok) {
              const json = await proxyRes.json();
              finalUrl = json.embed || json.playback || json.url || (json.guid ? `https://iframe.mediadelivery.net/embed/${json.guid}` : '');
            } else {
              console.warn('Server proxy upload failed, falling back to client Stream upload', await proxyRes.text());
              throw new Error('Server proxy upload failed');
            }
          } catch (err) {
            console.warn('Server upload proxy error, falling back to client-side upload', err);
            // Upload directly to Bunny Stream Video Library
            const streamResp = await uploadToBunnyStream(selectedFile, newMediaForm.title, undefined, (pct) => {
              setUploadProgress(pct);
            });
            finalUrl = streamResp.url || streamResp.playbackUrl || streamResp.embedUrl || (streamResp.videoId ? `https://iframe.mediadelivery.net/embed/${streamResp.videoId}` : '');
          }
        } else {
          // Upload PDFs/others to Bunny Storage
          const { cdnUrl } = await uploadToBunny(selectedFile, 'pdfs', (pct) => {
            setUploadProgress(pct);
          });
          finalUrl = cdnUrl;
        }
      }

      const courseRef = doc(db, "bharatam_courses", newMediaForm.courseId);
      const course = coursesList.find(c => c.id === newMediaForm.courseId);
      if (!course) return;

      const subcolRef = collection(db, "bharatam_courses", newMediaForm.courseId, newMediaForm.type === 'video' ? 'videos' : 'pdfs');
      const newDocRef = doc(subcolRef);
      const generatedId = newDocRef.id;
      const arrayKey = newMediaForm.type === 'video' ? 'videos' : 'pdfs';
      const nextOrder = getNextMediaOrder(course[arrayKey] || []);

      const newMediaItem = {
        id: generatedId,
        title: newMediaForm.title,
        url: finalUrl,
        duration: newMediaForm.duration || '',
        price: newMediaForm.price || '',
        moduleId: newMediaForm.moduleId || '',
        order: nextOrder,
        status: 'Approved',
        createdAt: new Date().toISOString()
      };

      const firestoreMediaDoc = {
        approvalStatus: 'approved',
        approvedAt: new Date(),
        bunnyVideoId: newMediaForm.type === 'video' ? finalUrl : '',
        storageUrl: finalUrl,
        contentType: newMediaForm.type,
        createdAt: new Date(),
        updatedAt: new Date(),
        durationMinutes: Number(newMediaForm.duration || 0),
        fileName: newMediaForm.title,
        title: newMediaForm.title,
        thumbnailUrl: '',
        views: 0,
        isFree: newMediaForm.price === 'Free' || newMediaForm.price === '0' || !newMediaForm.price,
        order: nextOrder,
        status: 'active'
      };

      await setDoc(newDocRef, firestoreMediaDoc);

      if (newMediaForm.type === 'pdf') {
        try {
          const subcolRefPdf = collection(db, "bharatam_courses", newMediaForm.courseId, "pdf");
          const newDocRefPdf = doc(subcolRefPdf, generatedId);
          await setDoc(newDocRefPdf, firestoreMediaDoc);
        } catch (subErr) {
          console.warn("Failed to write to pdf subcol:", subErr);
        }
      }

      await updateDoc(courseRef, { updatedAt: serverTimestamp() });

      alert("Content published successfully!");
      setIsUploadMediaOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      setIsUploading(false);
      setNewMediaForm({ courseId: '', title: '', url: '', duration: '', price: '', moduleId: '', order: '', type: 'video' });
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert("Failed to publish content: " + err.message);
    }
  };

  return (
    <>
      <div className="h-screen bg-slate-50 flex overflow-hidden font-sans text-slate-900">

        {/* Sidebar */}
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col hidden md:flex z-20">
          <div className="px-6 py-6 flex items-center gap-3">
            <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
              <ShieldCheck className="text-orange-500 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-950 tracking-tight leading-none">Super <span className="text-orange-500">Admin</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Control Panel</p>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {menuItems.map((item) => {
              if (item.isGroup) {
                const isGroupActive = item.children.some(c => activeTab === c.id);
                const isOpen = transactionMenuOpen || isGroupActive;
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => setTransactionMenuOpen(prev => !prev)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isGroupActive
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                    >
                      <item.icon className={`w-5 h-5 ${isGroupActive ? 'text-orange-500' : 'text-slate-400'}`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 opacity-50" />
                        : <ChevronDown className="w-4 h-4 opacity-50" />}
                    </button>
                    {isOpen && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-orange-100 pl-2">
                        {item.children.map(child => (
                          <button
                            key={child.id}
                            onClick={() => { setActiveTab(child.id); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === child.id
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                              }`}
                          >
                            <child.icon className={`w-4 h-4 ${activeTab === child.id ? 'text-white' : 'text-slate-400'}`} />
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:text-red-500" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-24 md:pb-0 relative md:ml-64">
          <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-30">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 capitalize flex items-center gap-2">
                  {activeTab === 'overview' && <LayoutDashboard className="w-6 h-6 text-orange-500" />}
                  {activeTab === 'approvals' && <CheckSquare className="w-6 h-6 text-orange-500" />}
                  {activeTab === 'people' && <Users className="w-6 h-6 text-orange-500" />}
                  {activeTab === 'settings' && <Settings className="w-6 h-6 text-orange-500" />}
                  {activeTab === 'transactions' && <DollarSign className="w-6 h-6 text-orange-500" />}
                  {activeTab === 'withdrawals' && <ArrowDownLeft className="w-6 h-6 text-orange-500" />}
                  {activeTab === 'trainer_wallet' && <Wallet className="w-6 h-6 text-orange-500" />}
                  {activeTab === 'trainer_wallet' ? 'Trainer Wallet' : activeTab.replace(/_/g, ' ')}
                </h2>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-orange-300 focus:bg-white outline-none w-full md:w-72 transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-3 sm:pl-4 sm:border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 leading-none">{user?.fullName || "System Admin"}</p>
                    <p className="text-[10px] font-bold text-orange-500 uppercase mt-1 tracking-wider">Super Admin</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1500px] mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* ── Welcome Header ── */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}! 👋</h2>
                      <p className="text-sm text-slate-400 mt-0.5">Here's what's happening with your platform today.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm self-start sm:self-auto">
                      <span>📅</span>
                      <span>{new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* ── Stat Cards with Sparklines ── */}
                  {(() => {
                    // Total Students now comes from learners collection
                    const totalStudents = learnersList.length;
                    const activeCourses = coursesList.filter(c => c.status === 'Approved').length;
                    const totalRevenue = purchasesList.reduce((sum, purchase) => sum + getPurchaseAmount(purchase), 0);
                    const totalEnrollments = coursesList.reduce((s, c) => s + (c.enrollmentCount || c.studentsEnrolled || 0), 0) || purchasesList.length;

                    const getBezierPath = (pts) => {
                      if (pts.length < 2) return '';
                      let path = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const p0 = pts[i];
                        const p1 = pts[i + 1];
                        const cpX1 = p0.x + (p1.x - p0.x) / 2;
                        const cpY1 = p0.y;
                        const cpX2 = p0.x + (p1.x - p0.x) / 2;
                        const cpY2 = p1.y;
                        path += ` C${cpX1.toFixed(1)},${cpY1.toFixed(1)} ${cpX2.toFixed(1)},${cpY2.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
                      }
                      return path;
                    };

                    const getSparkPts = (items, metricType) => {
                      const now = new Date(); const pts = [0, 0, 0, 0, 0];
                      items.forEach(item => {
                        const raw = item.createdAt; if (!raw) return;
                        const d = raw.seconds ? new Date(raw.seconds * 1000) : new Date(raw);
                        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                        if (diff < 7) pts[4]++; else if (diff < 14) pts[3]++; else if (diff < 21) pts[2]++; else if (diff < 28) pts[1]++; else if (diff < 35) pts[0]++;
                      });
                      
                      const total = pts.reduce((s, v) => s + v, 0);
                      const hasHistory = pts.slice(0, 4).some(v => v > 0);
                      if (!hasHistory && total > 0) {
                        return [
                          Math.max(1, Math.round(total * 0.15)),
                          Math.max(2, Math.round(total * 0.32)),
                          Math.max(3, Math.round(total * 0.55)),
                          Math.max(4, Math.round(total * 0.78)),
                          total
                        ];
                      }
                      if (total === 0) {
                        if (metricType === 'earnings') return [2, 4, 3, 6, 5];
                        if (metricType === 'students') return [1, 3, 2, 5, 4];
                        if (metricType === 'courses') return [3, 2, 5, 4, 7];
                        return [2, 3, 1, 4, 3];
                      }
                      return pts;
                    };

                    const Spark = ({ data, color, active }) => {
                      const max = Math.max(...data, 1); const W = 90, H = 36;
                      const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - 4 - ((v / max) * (H - 8)) }));
                      const line = getBezierPath(pts);
                      const area = `${line} L${W},${H} L0,${H} Z`;
                      return (
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-24 h-10" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`spg-${color}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d={area} fill={`url(#spg-${color})`} />
                          <path d={line} fill="none" stroke={color} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      );
                    };

                    const cards = [
                      { id: 'earnings', title: 'Total Earnings', value: `₹${totalRevenue.toLocaleString()}`, icon: '💰', spark: getSparkPts(purchasesList, 'earnings'), color: '#10b981', iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600', ringColor: 'border-emerald-400 shadow-emerald-100 ring-emerald-200 hover:border-emerald-200' },
                      { id: 'students', title: 'Total Students', value: totalStudents, icon: '👥', spark: getSparkPts(learnersList, 'students'), color: '#6366f1', iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600', ringColor: 'border-indigo-400 shadow-indigo-100 ring-indigo-200 hover:border-indigo-200' },
                      { id: 'courses', title: 'Active Courses', value: activeCourses, icon: '📚', spark: getSparkPts(coursesList.filter(c => c.status === 'Approved'), 'courses'), color: '#f59e0b', iconBg: 'bg-amber-50 border-amber-100 text-amber-600', ringColor: 'border-amber-400 shadow-amber-100 ring-amber-200 hover:border-amber-200' },
                      { id: 'enrollments', title: 'Total Enrollments', value: totalEnrollments, icon: '📊', spark: getSparkPts(coursesList, 'enrollments'), color: '#8b5cf6', iconBg: 'bg-violet-50 border-violet-100 text-violet-600', ringColor: 'border-violet-400 shadow-violet-100 ring-violet-200 hover:border-violet-200' },
                    ];
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {cards.map((c, i) => {
                          const isActive = activeOverviewCard === c.id;
                          return (
                            <div
                              key={i}
                              onClick={() => setActiveOverviewCard(prev => prev === c.id ? null : c.id)}
                              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center justify-between cursor-pointer transition-all select-none
                              ${isActive ? c.ringColor : 'border-slate-100 hover:shadow-md'}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border transition-colors ${c.iconBg}`}>{c.icon}</div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-400">{c.title}</p>
                                  <p className={`text-xl font-black leading-none mt-1 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>{c.value}</p>
                                </div>
                              </div>
                              <Spark data={c.spark} color={c.color} active={isActive} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* ── Charts Row ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Earnings Overview */}
                    {(() => {
                      const isActive = activeOverviewCard === 'earnings';
                      // Build weekly buckets from real purchase data
                      const now = new Date();
                      const weekLabels = Array.from({ length: 5 }, (_, i) => {
                        const d = new Date(now); d.setDate(d.getDate() - (4 - i) * 7);
                        return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
                      });
                      const raw = [0, 0, 0, 0, 0];
                      purchasesList.forEach(p => {
                        const amt = getPurchaseAmount(p);
                        if (!p.createdAt) { raw[4] += amt; return; }
                        const d = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
                        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                        if (diff < 7) raw[4] += amt;
                        else if (diff < 14) raw[3] += amt;
                        else if (diff < 21) raw[2] += amt;
                        else if (diff < 28) raw[1] += amt;
                        else if (diff < 35) raw[0] += amt;
                      });
                      const hasRealData = raw.some(v => v > 0);
                      const pts = hasRealData ? raw : [500, 1200, 1800, 3200, 7203];
                      const maxV = Math.max(...pts, 1);
                      const W = 300, H = 120, pL = 36, pB = 22, pT = 12, cH = H - pB - pT, cW = W - pL - 8;
                      const points = pts.map((v, i) => ({ x: pL + (i / (pts.length - 1)) * cW, y: pT + cH - (v / maxV) * cH }));
                      const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                      const area = `${line} L${points[pts.length - 1].x.toFixed(1)},${(pT + cH).toFixed(1)} L${points[0].x.toFixed(1)},${(pT + cH).toFixed(1)} Z`;
                      const totalEarnings = purchasesList.reduce((s, p) => s + getPurchaseAmount(p), 0);
                      // Y-axis labels based on real max
                      const yMax = Math.ceil(maxV / 1000) * 1000 || 1000;
                      const yLbls = Array.from({ length: 5 }, (_, i) => {
                        const v = Math.round((i / (4)) * yMax);
                        return v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`;
                      });
                      return (
                        <motion.div
                          animate={{ borderColor: isActive ? '#f97316' : '#e2e8f0', boxShadow: isActive ? '0 4px 24px 0 #fed7aa80' : '0 1px 3px 0 #0001' }}
                          transition={{ duration: 0.3 }}
                          className="bg-white rounded-2xl border shadow-sm p-5"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">Earnings Overview</h4>
                              {isActive && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-orange-500 font-medium mt-0.5">
                                  Total: ₹{totalEarnings.toLocaleString()} {!hasRealData && '(sample data)'}
                                </motion.p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isActive && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                              <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">This Month ▾</span>
                            </div>
                          </div>
                          <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3" style={{ height: '160px' }} preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="eg2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity={isActive ? 0.35 : 0.2} />
                                <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
                              </linearGradient>
                            </defs>
                            {yLbls.map((l, i) => { const y = pT + cH - (i / (yLbls.length - 1)) * cH; return (<g key={i}><line x1={pL} y1={y} x2={W - 8} y2={y} stroke={isActive ? '#fed7aa' : '#f1f5f9'} strokeWidth="1" /><text x={pL - 4} y={y + 3} fontSize="7" fill="#94a3b8" textAnchor="end">{l}</text></g>); })}
                            <path d={area} fill="url(#eg2)" />
                            <motion.path
                              d={line}
                              fill="none"
                              stroke="#f97316"
                              strokeWidth={isActive ? 3 : 2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              animate={{ strokeWidth: isActive ? 3 : 2.5 }}
                            />
                            {points.map((p, i) => (
                              <motion.circle
                                key={i}
                                cx={p.x} cy={p.y}
                                r={isActive ? 4.5 : 3.5}
                                fill="white"
                                stroke="#f97316"
                                strokeWidth={isActive ? 2.5 : 2}
                                animate={{ r: isActive ? 4.5 : 3.5 }}
                              >
                                {isActive && (
                                  <title>₹{pts[i].toLocaleString()}</title>
                                )}
                              </motion.circle>
                            ))}
                          </svg>
                          <div className="flex justify-between mt-1">{weekLabels.map((m, i) => <span key={i} className="text-[10px] font-medium text-slate-400">{m}</span>)}</div>
                        </motion.div>
                      );
                    })()}
                    {/* Student Growth */}
                    {(() => {
                      const isActive = activeOverviewCard === 'students';
                      const now = new Date();
                      const weekLabels = Array.from({ length: 5 }, (_, i) => {
                        const d = new Date(now); d.setDate(d.getDate() - (4 - i) * 7);
                        return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
                      });
                      // Use learnersList for real student data
                      const raw = [0, 0, 0, 0, 0];
                      learnersList.forEach(u => {
                        if (!u.createdAt) { raw[4]++; return; }
                        const d = u.createdAt.seconds ? new Date(u.createdAt.seconds * 1000) : new Date(u.createdAt);
                        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
                        if (diff < 7) raw[4]++; else if (diff < 14) raw[3]++; else if (diff < 21) raw[2]++; else if (diff < 28) raw[1]++; else if (diff < 35) raw[0]++;
                      });
                      const hasRealData = raw.some(v => v > 0);
                      const vals = hasRealData ? raw : [5, 8, 12, 18, 30];
                      const maxV = Math.max(...vals, 1);
                      const yTicks = [0, Math.round(maxV * 0.33), Math.round(maxV * 0.66), maxV];
                      return (
                        <motion.div
                          animate={{ borderColor: isActive ? '#f97316' : '#e2e8f0', boxShadow: isActive ? '0 4px 24px 0 #fed7aa80' : '0 1px 3px 0 #0001' }}
                          transition={{ duration: 0.3 }}
                          className="bg-white rounded-2xl border shadow-sm p-5"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">Student Growth</h4>
                              {isActive && (
                                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-orange-500 font-medium mt-0.5">
                                  Total: {learnersList.length} students {!hasRealData && '(sample data)'}
                                </motion.p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isActive && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                              <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">This Month ▾</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3" style={{ height: '160px' }}>
                            <div className="flex flex-col justify-between pb-6 shrink-0">{[...yTicks].reverse().map((t, i) => <span key={i} className="text-[9px] font-medium text-slate-300 text-right w-5">{t}</span>)}</div>
                            <div className="flex-1 flex items-end gap-2 pb-6">
                              {vals.map((v, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                                  <motion.div
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1, height: `${Math.max((v / maxV) * 100, 4)}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                                    style={{ transformOrigin: 'bottom' }}
                                    className={`w-full rounded-t-lg transition-colors ${isActive
                                        ? (i === vals.length - 1 ? 'bg-orange-600' : 'bg-orange-400')
                                        : (i === vals.length - 1 ? 'bg-orange-500' : 'bg-orange-300')
                                      }`}
                                  />
                                  <span className="text-[9px] font-medium text-slate-400 leading-none whitespace-nowrap">{weekLabels[i]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </div>

                  {/* ── Recent Course Uploads + Revenue Breakdown ── */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                        <h4 className="text-sm font-semibold text-slate-900">Recent Course Uploads</h4>
                        <button onClick={() => setActiveTab('approvals')} className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors">View All</button>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {coursesList.length === 0 ? (<div className="py-10 text-center text-slate-400 text-sm">No courses yet</div>) : coursesList.slice(0, 5).map((course) => {
                          const isApproved = course.status === 'Approved'; const isPending = course.status === 'Pending Review' || course.status === 'Pending';
                          const dateStr = course.createdAt ? (() => { try { const d = course.createdAt.seconds ? new Date(course.createdAt.seconds * 1000) : new Date(course.createdAt); return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } })() : '';
                          return (<div key={course.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0 border border-orange-100">{course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-base">📚</div>}</div>
                            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{course.title}</p><p className="text-xs text-slate-400 truncate">{course.subject || course.category || 'General'}</p></div>
                            <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isPending ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{isApproved ? 'Approved' : isPending ? 'Pending Review' : course.status || 'Draft'}</span>
                            {dateStr && <span className="flex-shrink-0 text-xs text-slate-400 hidden sm:block">{dateStr}</span>}
                          </div>);
                        })}
                      </div>
                    </div>
                    {/* Revenue Breakdown Donut */}
                    {(() => {
                      const catMap = {};
                      coursesList.forEach(c => {
                        const cat = c.subject || c.category || 'General';
                        const price = Number(c.price) || 0;
                        catMap[cat] = (catMap[cat] || 0) + price;
                      });
                      const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
                      const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
                      const colors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

                      const DonutChart = () => {
                        const R = 52, cx = 64, cy = 64, stroke = 18, circ = 2 * Math.PI * R;
                        let offset = 0;
                        return (
                          <svg viewBox="0 0 128 128" className="w-36 h-36 flex-shrink-0">
                            {entries.map(([, val], i) => {
                              const pct = val / total;
                              const dash = pct * circ;
                              const gap = circ - dash;
                              const seg = <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={colors[i]} strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * circ} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />;
                              offset += pct;
                              return seg;
                            })}
                            <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">₹{total.toLocaleString()}</text>
                            <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="#94a3b8">Total Revenue</text>
                          </svg>
                        );
                      };

                      return (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                          <div className="px-5 py-4 border-b border-slate-50">
                            <h4 className="text-sm font-semibold text-slate-900">Revenue Breakdown</h4>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center gap-5 mb-4">
                              <DonutChart />
                              <div className="flex-1 min-w-0 space-y-2.5">
                                {entries.length === 0 ? (
                                  <p className="text-sm text-slate-400">No revenue data yet</p>
                                ) : entries.map(([cat, val], i) => (
                                  <div key={i} className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[i] }} />
                                      <span className="text-xs font-medium text-slate-600 truncate">{cat}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">₹{val.toLocaleString()}</span>
                                      <span className="text-[10px] text-slate-400 whitespace-nowrap">({Math.round(val / total * 100)}%)</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button onClick={() => setActiveTab('approvals')} className="w-full flex items-center justify-center gap-2 py-2.5 border border-orange-200 text-orange-500 text-xs font-medium rounded-xl hover:bg-orange-50 transition-colors">
                              <ArrowRight className="w-3.5 h-3.5" /> View Full Report
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Bottom Summary Stats ── */}
                  {(() => {
                    // Total Students from learners collection
                    const totalStudents = learnersList.length;

                    // CALCULATE REAL TOTAL REVENUE from purchases
                    const totalRevenue = purchasesList.reduce((sum, purchase) => {
                      return sum + getPurchaseAmount(purchase);
                    }, 0);

                    // CALCULATE REAL TOTAL PAYOUTS
                    // Method 1: Sum of actual completed payouts from payouts collection
                    const actualPayouts = payoutsList.reduce((sum, payout) => {
                      const amount = Number(payout.amount || 0);
                      // Only count completed/approved/paid payouts
                      if (payout.status === 'completed' || payout.status === 'approved' || payout.status === 'paid') {
                        return sum + amount;
                      }
                      return sum;
                    }, 0);

                    // Calculate based on dynamic course commissions or global commission
                    const estimatedPayouts = purchasesList.reduce((sum, p) => {
                      const amount = getPurchaseAmount(p);
                      const matchedCourse = coursesList.find(c => c.id === p.courseId);
                      const commission = typeof p.commission === 'number'
                        ? p.commission
                        : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
                      const trainerShare = (100 - commission) / 100;
                      return sum + Math.round(amount * trainerShare);
                    }, 0) || Math.round(totalRevenue * ((100 - globalCommission) / 100));

                    // Use actual payouts if available, otherwise show estimated
                    const totalPayouts = actualPayouts > 0 ? actualPayouts : estimatedPayouts;

                    return (<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[{ icon: '🎓', label: 'Total Courses', value: coursesList.length }, { icon: '👥', label: 'Total Students', value: totalStudents }, { icon: '💰', label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}` }, { icon: '💸', label: 'Total Payouts', value: `₹${totalPayouts.toLocaleString()}` }].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-orange-100">{s.icon}</div>
                          <div><p className="text-xs font-medium text-slate-400">{s.label}</p><p className="text-xl font-bold text-slate-900 leading-tight">{s.value}</p></div>
                        </div>
                      ))}
                    </div>);
                  })()}

                  {/* ── Quick Actions ── */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[{ label: 'Create Course', icon: BookOpen, bg: 'bg-orange-50', color: 'text-orange-600', border: 'border-orange-100', action: () => setIsCreateCourseOpen(true) }, { label: 'Manage Ads', icon: Megaphone, bg: 'bg-sky-50', color: 'text-sky-600', border: 'border-sky-100', action: () => setIsManageAdsOpen(true) }, { label: 'Add Category', icon: Tags, bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100', action: () => setIsAddCategoryOpen(true) }, { label: 'View People', icon: Users, bg: 'bg-violet-50', color: 'text-violet-600', border: 'border-violet-100', action: () => setActiveTab('people') }].map((a, i) => (
                        <button key={i} onClick={a.action} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border ${a.border} ${a.bg} hover:brightness-95 transition-all group`}>
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"><a.icon className={`w-4 h-4 ${a.color}`} /></div>
                          <span className={`text-sm font-medium ${a.color} text-left leading-tight`}>{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}

              {activeTab === 'approvals' && (
                <motion.div
                  key="approvals"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setApprovalTab('all')}
                        className={`px-3.5 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${approvalTab === 'all' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-orange-500'}`}>
                        <Users className="w-4 h-4" /> All
                      </button>
                      <button
                        onClick={() => setApprovalTab('pending')}
                        className={`px-3.5 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${approvalTab === 'pending' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-orange-500'}`}>
                        <Clock className="w-4 h-4" /> Pending
                      </button>
                      <button
                        onClick={() => setApprovalTab('approved_courses')}
                        className={`px-3.5 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${approvalTab === 'approved_courses' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-500'}`}>
                        <CheckCircle className="w-4 h-4" /> Approved Courses
                      </button>
                    </div>
                  </div>

                  {selectedCourseId ? (
                    renderCourseMaterialsPage(coursesList.find(c => c.id === selectedCourseId))
                  ) : isLoading ? (
                    <div className="py-20 text-center text-gray-400 font-bold text-lg">Loading...</div>
                  ) : (
                    <div className="w-full">
                      {approvalTab === 'all' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-orange-500" />
                            <h4 className="text-lg font-black text-gray-900">All Courses</h4>
                          </div>
                          {renderTableGroupedCourseApprovalList(coursesList, 'No courses currently exist on the platform.')}
                        </div>
                      )}

                      {approvalTab === 'pending' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <h4 className="text-lg font-black text-gray-900">Pending Review</h4>
                          </div>
                          {(() => {
                            const pendingList = coursesList.filter(c => {
                              if (!c) return false;
                              const videos = (c.videos || []);
                              const pdfs = (c.pdfs || []);
                              const allVideosApproved = videos.length === 0 ? true : videos.every(v => isApprovedStatus(v.status));
                              const allPdfsApproved = pdfs.length === 0 ? true : pdfs.every(p => isApprovedStatus(p.status));
                              const courseApproved = isApprovedStatus(c.status) && allVideosApproved && allPdfsApproved;
                              return !courseApproved; // include only courses that are NOT fully approved
                            });
                            return renderTableGroupedCourseApprovalList(pendingList, 'No pending courses require review.');
                          })()}
                        </div>
                      )}

                      {approvalTab === 'approved_courses' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <h4 className="text-lg font-black text-gray-900">Officially Approved Courses</h4>
                          </div>
                          {(() => {
                            const approvedList = coursesList.filter(c => {
                              if (!c) return false;
                              const videos = (c.videos || []);
                              const pdfs = (c.pdfs || []);
                              const allVideosApproved = videos.length === 0 ? true : videos.every(v => isApprovedStatus(v.status));
                              const allPdfsApproved = pdfs.length === 0 ? true : pdfs.every(p => isApprovedStatus(p.status));
                              return isApprovedStatus(c.status) && allVideosApproved && allPdfsApproved;
                            });
                            return renderTableGroupedCourseApprovalList(approvedList, 'No approved courses yet.');
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'people' && (
                <motion.div
                  key="people"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Stats Row */}
                  {(() => {
                    // Use learnersList for students count
                    const students = learnersList;
                    const trainers = usersList.filter(u => (u.role || '').toLowerCase() === 'trainer');
                    const totalUsers = learnersList.length + trainers.length;
                    const blocked = [...learnersList, ...usersList].filter(u => u.isBlocked);
                    const active = totalUsers - blocked.length;

                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Total Users', value: totalUsers, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', icon: '👥' },
                          { label: 'Students', value: students.length, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', icon: '🎓' },
                          { label: 'Trainers', value: trainers.length, color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', icon: '🏫' },
                          { label: 'Active', value: active, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', icon: '✅' },
                        ].map(stat => (
                          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{stat.icon}</div>
                            <div>
                              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                              <p className="text-2xl font-black text-gray-900 leading-tight">{stat.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Header: Tabs + Search */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col md:flex-row items-center gap-3">
                    <div className="flex gap-1 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
                      {[
                        { key: 'students', label: 'Students', icon: '🎓' },
                        { key: 'trainers', label: 'Trainers', icon: '🏫' },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setPeopleTab(tab.key)}
                          className={`flex-1 md:flex-none flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${peopleTab === tab.key
                              ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                              : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                          <span>{tab.icon}</span> {tab.label}
                          <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${peopleTab === tab.key ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {tab.key === 'students' ? learnersList.length : usersList.filter(u => (u.role || '').toLowerCase() === 'trainer').length}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="text"
                        placeholder={`Search ${peopleTab}...`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-700 placeholder:text-gray-300 outline-none focus:border-orange-300 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* People Table */}
                  {(() => {
                    // Use learnersList for students, usersList for trainers
                    const peopleList = peopleTab === 'students' ? learnersList : usersList.filter(u => (u.role || '').toLowerCase() === 'trainer');

                    const filtered = peopleList.filter(u => {
                      const q = searchQuery.toLowerCase();
                      const matchesSearch = !q ||
                        (u.fullName || u.name || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.phoneNumber || '').toLowerCase().includes(q);
                      return matchesSearch;
                    });

                    const avatarColors = ['bg-violet-100 text-violet-600', 'bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600', 'bg-indigo-100 text-indigo-600'];

                    const getJoinDate = (createdAt) => {
                      if (!createdAt) return '—';
                      try {
                        const d = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
                        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      } catch { return '—'; }
                    };

                    return (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[640px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-5 py-3.5">#</th>
                                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 py-3.5">User</th>
                                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 py-3.5">Contact</th>
                                {peopleTab === 'trainers' && (
                                  <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 py-3.5">Courses</th>
                                )}
                                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 py-3.5">Joined</th>
                                <th className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-4 py-3.5">Status</th>
                                <th className="text-right text-[11px] font-black text-gray-400 uppercase tracking-widest px-5 py-3.5">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {filtered.length === 0 ? (
                                <tr>
                                  <td colSpan={peopleTab === 'trainers' ? 7 : 6} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="text-4xl">{peopleTab === 'students' ? '🎓' : '🏫'}</span>
                                      <p className="font-bold text-gray-400 text-sm">No {peopleTab} found</p>
                                      {searchQuery && <p className="text-xs text-gray-300">Try a different search term</p>}
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                filtered.map((person, idx) => {
                                  const initials = (person.fullName || person.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                                  const colorClass = avatarColors[idx % avatarColors.length];
                                  return (
                                    <tr key={person.id} className="hover:bg-gray-50/60 transition-colors group">
                                      {/* # */}
                                      <td className="px-5 py-3.5 text-xs font-bold text-gray-300 w-10">{idx + 1}</td>

                                      {/* User */}
                                      <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                          <div className="relative flex-shrink-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden ${colorClass}`}>
                                              {person.profileUrl
                                                ? <img src={person.profileUrl} alt="" className="w-full h-full object-cover" />
                                                : initials
                                              }
                                            </div>
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${person.isBlocked ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                                              {person.fullName || person.name || 'Unknown User'}
                                            </p>
                                            {person.email && (
                                              <p className="text-[11px] text-gray-400 font-medium truncate max-w-[180px]">{person.email}</p>
                                            )}
                                          </div>
                                        </div>
                                      </td>

                                      {/* Contact */}
                                      <td className="px-4 py-3.5">
                                        <span className="text-sm font-semibold text-gray-500">
                                          {person.phoneNumber || '—'}
                                        </span>
                                      </td>

                                      {/* Courses (trainers only) */}
                                      {peopleTab === 'trainers' && (
                                        <td className="px-4 py-3.5">
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-lg">
                                            <BookOpen className="w-3 h-3" />
                                            {person.courseCount || coursesList.filter(c => c.trainerId === person.id || c.trainerName === (person.fullName || person.name)).length || 0}
                                          </span>
                                        </td>
                                      )}

                                      {/* Joined */}
                                      <td className="px-4 py-3.5">
                                        <span className="text-xs font-semibold text-gray-400">{getJoinDate(person.createdAt)}</span>
                                      </td>

                                      {/* Status */}
                                      <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${person.isBlocked
                                            ? 'bg-red-50 text-red-500'
                                            : 'bg-emerald-50 text-emerald-600'
                                          }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${person.isBlocked ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                          {person.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                      </td>

                                      {/* Action */}
                                      <td className="px-5 py-3.5 text-right">
                                        <button
                                          onClick={() => handleBlockUser(person.id, person.isBlocked)}
                                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${person.isBlocked
                                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                              : 'bg-red-50 text-red-500 hover:bg-red-100'
                                            }`}
                                        >
                                          {person.isBlocked
                                            ? <><CheckCircle className="w-3.5 h-3.5" /> Unblock</>
                                            : <><XCircle className="w-3.5 h-3.5" /> Block</>
                                          }
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Table Footer */}
                        {filtered.length > 0 && (
                          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/40">
                            <p className="text-xs font-semibold text-gray-400">
                              Showing <span className="font-black text-gray-600">{filtered.length}</span> {peopleTab}
                            </p>
                            <p className="text-xs font-semibold text-gray-400">
                              <span className="font-black text-emerald-600">{filtered.filter(u => !u.isBlocked).length}</span> active
                              {filtered.filter(u => u.isBlocked).length > 0 && (
                                <> · <span className="font-black text-red-500">{filtered.filter(u => u.isBlocked).length}</span> blocked</>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* ═══════════════ SUPPORT & FAQs TAB ═══════════════ */}
              {activeTab === 'support' && (
                <motion.div
                  key="support"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                        <ShieldAlert className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900">Support &amp; FAQs</h2>
                        <p className="text-sm text-gray-400 font-medium">
                          {supportQueries.filter(q => q.status !== 'answered').length} pending queries &middot; {supportFaqs.length} FAQs
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsFaqFormOpen(true);
                        setTimeout(() => {
                          document.getElementById('chatbot-faqs-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-orange-200 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Add FAQ
                    </button>
                  </div>

                  {/* ── Support Queries ────────────────────── */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
                    {/* Header with stats */}
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Student Support Tickets</h3>
                      </div>
                      
                      {/* Tabs Filter */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-500 self-start">
                        {[
                          { id: 'all', label: 'All', count: supportQueries.length },
                          { id: 'pending', label: 'Pending', count: supportQueries.filter(q => q.status === 'pending' || !q.status).length },
                          { id: 'answered', label: 'Answered', count: supportQueries.filter(q => q.status === 'answered').length },
                          { id: 'solved', label: 'Solved', count: supportQueries.filter(q => q.status === 'solved').length }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => { setQueryFilter(tab.id); setSelectedQueryId(null); }}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${queryFilter === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-800'}`}
                          >
                            {tab.label}
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${queryFilter === tab.id ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Master-Detail Split Pane */}
                    <div className="flex flex-col md:flex-row min-h-[480px] divide-y md:divide-y-0 md:divide-x divide-slate-100">
                      
                      {/* Left: Master Ticket List */}
                      <div className="w-full md:w-5/12 lg:w-4/12 flex flex-col bg-slate-50/30">
                        {/* Search input */}
                        <div className="p-3 border-b border-slate-100 bg-white">
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="Search by student, contact, query..."
                              value={querySearch}
                              onChange={e => setQuerySearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-orange-400 transition-all"
                            />
                          </div>
                        </div>

                        {/* Ticket list scroll area */}
                        <div className="flex-1 overflow-y-auto max-h-[420px] p-2 space-y-1">
                          {supportQueries.filter(q => {
                            if (queryFilter === 'pending' && q.status !== 'pending' && q.status) return false;
                            if (queryFilter === 'pending' && !q.status && q.answer) return false; // Edge cases
                            if (queryFilter === 'answered' && q.status !== 'answered') return false;
                            if (queryFilter === 'solved' && q.status !== 'solved') return false;
                            if (querySearch.trim() !== '') {
                              const s = querySearch.toLowerCase();
                              return (q.studentName || '').toLowerCase().includes(s) || 
                                     (q.studentContact || '').toLowerCase().includes(s) || 
                                     (q.question || '').toLowerCase().includes(s);
                            }
                            return true;
                          }).length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                              <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p className="text-xs font-bold">No matching tickets</p>
                            </div>
                          ) : (
                            supportQueries.filter(q => {
                              if (queryFilter === 'pending' && q.status !== 'pending' && q.status) return false;
                              if (queryFilter === 'answered' && q.status !== 'answered') return false;
                              if (queryFilter === 'solved' && q.status !== 'solved') return false;
                              if (querySearch.trim() !== '') {
                                const s = querySearch.toLowerCase();
                                return (q.studentName || '').toLowerCase().includes(s) || 
                                       (q.studentContact || '').toLowerCase().includes(s) || 
                                       (q.question || '').toLowerCase().includes(s);
                              }
                              return true;
                            }).map(q => {
                              const isSelected = selectedQueryId === q.id;
                              let statusPill = 'bg-amber-50 text-amber-600 border border-amber-100';
                              if (q.status === 'answered') statusPill = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                              if (q.status === 'solved') statusPill = 'bg-indigo-50 text-indigo-600 border border-indigo-100';

                              return (
                                <button
                                  key={q.id}
                                  onClick={() => { setSelectedQueryId(q.id); setReplyText(''); }}
                                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                                    isSelected 
                                      ? 'bg-orange-50/50 border-l-4 border-l-orange-500 border border-slate-100 shadow-sm' 
                                      : 'border border-transparent hover:bg-slate-100/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                                      {q.studentName || 'Learner'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium ml-auto">
                                      {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                                    </span>
                                  </div>
                                  
                                  <p className="text-[11px] text-slate-400 truncate w-full">
                                    {q.question}
                                  </p>

                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${statusPill}`}>
                                      {q.status === 'solved' ? 'Solved' : q.status === 'answered' ? 'Answered' : 'Pending'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                      {q.studentContact || ''}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Right: Detailed Conversation Pane */}
                      <div className="flex-1 flex flex-col bg-white">
                        {(() => {
                          const ticket = supportQueries.find(q => q.id === selectedQueryId);
                          if (!ticket) {
                            return (
                              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[300px]">
                                <MessageSquare className="w-12 h-12 text-slate-200 mb-3 stroke-[1.5]" />
                                <p className="text-sm font-bold text-slate-600">Select a Support Ticket</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                  Choose a query from the left list to review detailed history, post replies, or resolve customer issues.
                                </p>
                              </div>
                            );
                          }

                          const isSolved = ticket.status === 'solved';
                          const isAnswered = ticket.status === 'answered';

                          return (
                            <div className="flex-1 flex flex-col h-full divide-y divide-slate-100">
                              {/* Detail Header */}
                              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/20">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-xs font-bold text-slate-700">{ticket.studentName || 'Learner'}</h4>
                                    <span className="text-[10px] text-slate-400 font-semibold">({ticket.studentContact || 'No Contact'})</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-bold">
                                    Ticket ID: <span className="font-mono text-slate-500 uppercase">{ticket.id.slice(0, 10)}</span> &middot; Date: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </p>
                                </div>
                                
                                {/* Status Timeline Steps */}
                                <div className="flex items-center gap-1.5 self-start sm:self-center">
                                  <span className="px-2 py-1 rounded-lg bg-orange-50 border border-orange-100 text-[9px] font-black text-orange-600 uppercase">
                                    Submitted
                                  </span>
                                  <div className="w-2.5 h-0.5 bg-slate-300" />
                                  <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${
                                    isAnswered || isSolved 
                                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                                  }`}>
                                    Answered
                                  </span>
                                  <div className="w-2.5 h-0.5 bg-slate-300" />
                                  <span className={`px-2 py-1 rounded-lg border text-[9px] font-black uppercase ${
                                    isSolved 
                                      ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                                  }`}>
                                    Solved
                                  </span>
                                </div>
                              </div>

                              {/* Chat History View */}
                              <div className="flex-1 p-5 overflow-y-auto max-h-[300px] bg-slate-50/10 space-y-4">
                                {/* Student Question Bubble */}
                                <div className="flex flex-col items-start gap-1 max-w-[85%]">
                                  <div className="p-3.5 bg-slate-100 rounded-2xl rounded-tl-none text-slate-800 text-xs font-semibold leading-relaxed break-words shadow-sm">
                                    {ticket.question}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-semibold pl-1">
                                    Student &middot; {ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>

                                {/* Support Agent Answer Bubble */}
                                {ticket.answer && (
                                  <div className="flex flex-col items-end gap-1 max-w-[85%] ml-auto">
                                    <div className="p-3.5 bg-orange-500 text-white rounded-2xl rounded-tr-none text-xs font-semibold leading-relaxed break-words shadow-sm">
                                      {ticket.answer}
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-semibold pr-1">
                                      {ticket.answeredBy || 'Support Team'} &middot; {ticket.answeredAt ? new Date(ticket.answeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                )}

                                {/* Solved state message banner */}
                                {isSolved && (
                                  <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl justify-center text-[11px] font-black text-indigo-600">
                                    <CheckCircle className="w-4 h-4 text-indigo-500" />
                                    This support query has been marked as solved/resolved.
                                  </div>
                                )}
                              </div>

                              {/* Reply / Action controls at bottom */}
                              <div className="p-4 bg-slate-50/20 flex flex-col gap-3">
                                {!isSolved ? (
                                  <>
                                    <div className="flex gap-2">
                                      <textarea
                                        rows={2}
                                        placeholder={isAnswered ? "Update your reply to the student..." : "Type your reply to the student..."}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-orange-400 transition-all resize-none shadow-sm"
                                      />
                                      <button
                                        onClick={() => handleReplyQuery(ticket.id)}
                                        disabled={!replyText.trim()}
                                        className="px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-md shadow-orange-100 self-stretch"
                                      >
                                        Send Reply
                                      </button>
                                    </div>
                                    
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => handleToggleSolvedQuery(ticket.id, ticket.status)}
                                        className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        Mark as Solved
                                      </button>
                                      <button
                                        onClick={() => handleDeleteQuery(ticket.id)}
                                        className="px-3.5 py-2 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        Delete Ticket
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => handleToggleSolvedQuery(ticket.id, ticket.status)}
                                      className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                    >
                                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                                      Reopen Ticket
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuery(ticket.id)}
                                      className="px-3.5 py-2 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      Delete Ticket
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                    </div>
                  </div>

                  {/* ── FAQs ────────────────────────────────── */}
                  <div id="chatbot-faqs-section" className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Chatbot FAQs</h3>
                      <span className="text-xs text-gray-400 font-semibold">({supportFaqs.length} entries)</span>
                      <button
                        onClick={() => setIsFaqFormOpen(v => !v)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 border border-indigo-100/40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add FAQ Question
                      </button>
                    </div>

                    {/* Add FAQ Form */}
                    <AnimatePresence>
                      {isFaqFormOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-4">
                            <h3 className="text-sm font-black text-gray-800">New FAQ Entry</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Category</label>
                                <select
                                  value={newFaqForm.category}
                                  onChange={e => setNewFaqForm(p => ({ ...p, category: e.target.value }))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-indigo-400 transition-all"
                                >
                                  <option value="general">General</option>
                                  <option value="courses">Courses</option>
                                  <option value="prices">Prices</option>
                                  <option value="refunds">Refunds</option>
                                  <option value="access">Access</option>
                                  <option value="technical">Technical</option>
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5">Question</label>
                                <input
                                  type="text"
                                  placeholder="What is the question?"
                                  value={newFaqForm.question}
                                  onChange={e => setNewFaqForm(p => ({ ...p, question: e.target.value }))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 outline-none focus:border-indigo-400 transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1.5">Answer</label>
                              <textarea
                                rows={3}
                                placeholder="Type the answer here..."
                                value={newFaqForm.answer}
                                onChange={e => setNewFaqForm(p => ({ ...p, answer: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 placeholder:text-gray-300 outline-none focus:border-indigo-400 transition-all resize-none"
                              />
                            </div>
                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => { setIsFaqFormOpen(false); setNewFaqForm({ question: '', answer: '', category: 'general' }); }}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleAddFaq}
                                disabled={!newFaqForm.question.trim() || !newFaqForm.answer.trim()}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-indigo-100"
                              >
                                Save FAQ
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {supportFaqs.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-400">No FAQs added yet</p>
                        <p className="text-xs text-gray-300 mt-1">FAQs added here will appear in the student chatbot</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                        {[...supportFaqs].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).map(faq => {
                          const clicks = faq.clicks || 0;
                          return (
                            <div key={faq.id} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors group">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-black rounded-md uppercase">
                                    {faq.category || 'general'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-md">
                                    🔥 {clicks} {clicks === 1 ? 'view' : 'views'}
                                  </span>
                                </div>
                                <p className="text-sm font-bold text-gray-800 break-words">{faq.question}</p>
                                <p className="text-xs font-medium text-gray-500 mt-1 break-words">{faq.answer}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                title="Delete FAQ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {/* ═══════════════════════════════════════════════════════ */}
              {/* ════════ Backup & Restore Tab ════════ */}
              {activeTab === 'backup_restore' && (
                <motion.div
                  key="backup_restore"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 max-w-6xl mx-auto w-full pb-10"
                >
                  {/* Smart Restore Feature Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Smart Restore Feature</h3>
                        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                          <li>Backup includes all courses, users, transactions, and system data.</li>
                          <li>Restore will add ONLY missing/deleted data from backup.</li>
                          <li>Existing data will NOT be duplicated or modified.</li>
                          <li>Safe to use - no data loss risk.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create Backup */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                          <CloudUpload className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Create Backup</h3>
                          <p className="text-sm text-slate-500">Download all data</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-6 flex-grow">
                        Export all your data to a JSON file. This includes courses, users, purchases, payouts, and more.
                      </p>
                      <button
                        onClick={handleCreateBackup}
                        disabled={isBackingUp}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-50"
                      >
                        {isBackingUp ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                           <CloudUpload className="w-5 h-5" />
                        )}
                        {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
                      </button>
                      
                      {backupStatus && (
                        <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${backupStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {backupStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                          {backupStatus.message}
                        </div>
                      )}
                    </div>

                    {/* Restore Backup */}
                    <div className="bg-white border border-orange-200 rounded-3xl p-6 shadow-sm flex flex-col">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                          <Upload className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Restore Backup</h3>
                          <p className="text-sm text-slate-500">Upload backup file</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-6">
                        Upload a backup file to restore your data. This will carefully import missing data.
                      </p>

                      <div className="flex-grow space-y-4">
                         <div className="relative group">
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-center group-hover:border-orange-500 transition-colors bg-slate-50 flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                               <FileText className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                               {restoreFile ? restoreFile.name : 'Select Backup File'}
                            </div>
                         </div>

                         {restoreFile && (
                           <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
                             <div className="font-medium mb-1">File Loaded</div>
                             <div className="text-xs opacity-80">Size: {(restoreFile.size / 1024).toFixed(2)} KB</div>
                           </div>
                         )}
                      </div>

                      <button
                        onClick={handleRestoreBackup}
                        disabled={isRestoring || !restoreFile}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all disabled:opacity-50"
                      >
                        {isRestoring ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                           <Upload className="w-5 h-5" />
                        )}
                        {isRestoring ? 'Restoring Data...' : 'Restore Data'}
                      </button>

                      {restoreStatus && (
                        <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${restoreStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {restoreStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                          {restoreStatus.message}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              {/* ═══════════════════════════════════════════════════════ */}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10 max-w-5xl mx-auto w-full pb-10"
                >
                  {/* Page Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 border border-orange-400/50">
                        <Settings className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h2>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Manage platform configuration and master controls</p>
                      </div>
                    </div>
                    {/* Version Info Badge */}
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-slate-600">v1.0.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Platform Settings Group */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-5 px-1">
                      <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Platform</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          id: 'commission',
                          icon: Percent,
                          iconBg: 'bg-orange-50',
                          iconColor: 'text-orange-500',
                          title: 'Commission Settings',
                          desc: `${globalCommission}% platform fee on all paid courses`,
                          badge: `${globalCommission}%`,
                          badgeColor: 'bg-orange-100 text-orange-600 border border-orange-200',
                        },
                        {
                          id: 'policies',
                          icon: ShieldAlert,
                          iconBg: 'bg-rose-50',
                          iconColor: 'text-rose-500',
                          title: 'Content Policies',
                          desc: 'Update terms, conditions & guidelines',
                          badge: null,
                          badgeColor: '',
                        },
                        {
                          id: 'notifications',
                          icon: Bell,
                          iconBg: 'bg-violet-50',
                          iconColor: 'text-violet-500',
                          title: 'Global Notifications',
                          desc: 'Broadcast alerts to all platform users',
                          badge: null,
                          badgeColor: '',
                        },
                        {
                          id: 'categories',
                          icon: Tags,
                          iconBg: 'bg-blue-50',
                          iconColor: 'text-blue-500',
                          title: 'Categories & Tags',
                          desc: 'Manage course categories and labels',
                          badge: null,
                          badgeColor: '',
                        },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (item.id === 'commission') {
                              setCommissionInput(globalCommission);
                              setIsEditCommissionOpen(true);
                            } else if (item.id === 'categories') {
                              setCategoryActiveTab('categories');
                              setIsAddCategoryOpen(true);
                            } else if (item.id === 'policies') {
                              setPoliciesInput({ ...policies });
                              setIsPoliciesModalOpen(true);
                            }
                          }}
                          className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left group"
                        >
                          <div className={`w-12 h-12 ${item.iconBg} rounded-[0.85rem] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-sm`}>
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{item.title}</h4>
                              {item.badge && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${item.badgeColor}`}>{item.badge}</span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-500 leading-snug">{item.desc}</p>
                          </div>
                          <div className="flex items-center self-center justify-center w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-50 transition-colors flex-shrink-0">
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System Group */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-5 px-1">
                      <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">System</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          icon: Shield,
                          iconBg: 'bg-indigo-50',
                          iconColor: 'text-indigo-500',
                          title: 'Security & Roles',
                          desc: 'Manage admin access and permissions',
                          badge: null,
                          badgeColor: '',
                          status: null,
                        },
                        {
                          icon: CloudUpload,
                          iconBg: 'bg-teal-50',
                          iconColor: 'text-teal-500',
                          title: 'Data Backup',
                          desc: 'Automated cloud backup management',
                          badge: 'Active',
                          badgeColor: 'bg-teal-100 text-teal-600 border border-teal-200',
                          status: 'Last backup: 2 days ago',
                        },
                        {
                          icon: ShieldCheck,
                          iconBg: 'bg-emerald-50',
                          iconColor: 'text-emerald-500',
                          title: 'Audit Logs',
                          desc: 'View all admin actions and changes',
                          badge: null,
                          badgeColor: '',
                          status: null,
                        },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-left group"
                        >
                          <div className={`w-12 h-12 ${item.iconBg} rounded-[0.85rem] flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-sm`}>
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{item.title}</h4>
                              {item.badge && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${item.badgeColor}`}>{item.badge}</span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-500 leading-snug">{item.status || item.desc}</p>
                          </div>
                          <div className="flex items-center self-center justify-center w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-50 transition-colors flex-shrink-0">
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-5 px-1">
                      <div className="w-1.5 h-5 bg-red-500 rounded-full" />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Danger Zone</h3>
                    </div>
                    <div className="bg-white rounded-3xl border border-red-200 shadow-sm overflow-hidden p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10 opacity-50 pointer-events-none"></div>
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-red-100">
                          <Trash2 className="w-6 h-6 text-red-500" strokeWidth={2} />
                        </div>
                        <div className="text-left">
                          <h4 className="font-black text-slate-900 text-base">Clear Cache & Reset</h4>
                          <p className="text-sm font-semibold text-slate-500 mt-1">Flush platform cache and temporary data. This action is irreversible.</p>
                        </div>
                      </div>
                      <button className="px-6 py-3 bg-white hover:bg-red-50 text-red-600 text-sm font-black rounded-xl transition-all active:scale-95 border border-red-200 hover:border-red-300 shadow-sm whitespace-nowrap">
                        Reset Cache
                      </button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Transactions Tab ── */}
            <AnimatePresence mode="wait">
              {activeTab === 'transactions' && (() => {
                const filteredList = purchasesList.filter(p => {
                  const dateVal = p.createdAt || p.purchasedAt || p.timestamp;
                  if (!dateVal) return true;
                  const dateObj = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
                  const time = dateObj.getTime();

                  if (txStartDate) {
                    const start = new Date(txStartDate);
                    start.setHours(0, 0, 0, 0);
                    if (time < start.getTime()) return false;
                  }
                  if (txEndDate) {
                    const end = new Date(txEndDate);
                    end.setHours(23, 59, 59, 999);
                    if (time > end.getTime()) return false;
                  }
                  return true;
                });

                const totalRevenue = filteredList.reduce((s, p) => s + getPurchaseAmount(p), 0);
                const avgOrder = filteredList.length > 0 ? Math.round(totalRevenue / filteredList.length) : 0;

                // Pagination Calculations
                const limitCount = 10;
                const totalPages = Math.max(1, Math.ceil(filteredList.length / limitCount));
                const safeTxPage = Math.min(txPage, totalPages);
                const startIndex = (safeTxPage - 1) * limitCount;
                const paginatedList = filteredList.slice(startIndex, startIndex + limitCount);

                return (
                  <motion.div
                    key="transactions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Platform Transactions</h2>
                        <p className="text-sm text-slate-400 mt-0.5">All student purchase transactions on the platform.</p>
                      </div>
                      <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-sm font-bold text-orange-600">
                        <DollarSign className="w-4 h-4" />
                        Total: ₹{totalRevenue.toLocaleString()}
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'orange' },
                        { label: 'Total Transactions', value: filteredList.length, icon: CreditCard, color: 'blue' },
                        { label: 'Avg. Order Value', value: filteredList.length > 0 ? `₹${avgOrder.toLocaleString()}` : '₹0', icon: TrendingUp, color: 'emerald' },
                      ].map((card, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${card.color}-50 border border-${card.color}-100`}>
                            <card.icon className={`w-5 h-5 text-${card.color}-500`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">{card.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Date Filter & Export Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">From</span>
                          <input
                            type="date"
                            value={txStartDate}
                            onChange={e => setTxStartDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">To</span>
                          <input
                            type="date"
                            value={txEndDate}
                            onChange={e => setTxEndDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-orange-500 focus:bg-white transition-all"
                          />
                        </div>
                        {(txStartDate || txEndDate) && (
                          <button
                            onClick={() => { setTxStartDate(''); setTxEndDate(''); }}
                            className="px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleExportFilteredTransactions(filteredList)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black shadow-md shadow-orange-100 transition-all flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Export Excel (Filtered)
                      </button>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-50">
                        <h3 className="text-base font-black text-slate-800">Transaction History</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-6 py-3.5">#</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Student</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Course</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Amount</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Date</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredList.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-20 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                      <CreditCard className="w-7 h-7 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold">No transactions found matching the filters.</p>
                                  </div>
                                </td>
                              </tr>
                            ) : paginatedList.map((p, idx) => {
                              const amount = getPurchaseAmount(p);
                              const dateVal = p.createdAt || p.purchasedAt || p.timestamp;
                              const dateStr = dateVal ? (dateVal.seconds ? new Date(dateVal.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(dateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })) : '—';

                              // student info
                              const studentId = p.userId || p.studentId || p.learnerId || p.uid;
                              const matchedStudent = studentId ? learnersList.find(l => l.id === studentId || l.uid === studentId) : null;
                              const studentName = p.studentName || p.userName || p.name || matchedStudent?.fullName || matchedStudent?.name || matchedStudent?.displayName || '—';
                              const studentEmail = p.studentEmail || p.email || matchedStudent?.email || '';

                              // course info
                              const courseId = p.courseId || p.course_id;
                              const matchedCourse = courseId ? coursesList.find(c => c.id === courseId) : null;
                              const courseName = p.courseName || p.courseTitle || p.course_title || matchedCourse?.title || matchedCourse?.courseName || '—';

                              return (
                                <tr key={p.id} className="hover:bg-orange-50/20 transition-colors">
                                  <td className="px-6 py-4 text-xs font-bold text-slate-400">{startIndex + idx + 1}</td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-bold text-slate-800">{studentName}</p>
                                    <p className="text-[11px] text-slate-400">{studentEmail}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-slate-700 max-w-[200px] truncate">{courseName}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="text-sm font-black text-emerald-600">₹{amount.toLocaleString()}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="text-sm font-semibold text-slate-500">{dateStr}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                      {p.status || 'Completed'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {filteredList.length > limitCount && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                          <p className="text-xs font-bold text-slate-400">
                            Showing {startIndex + 1}-{Math.min(startIndex + limitCount, filteredList.length)} of {filteredList.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setTxPage(page => Math.max(1, page - 1))}
                              disabled={safeTxPage === 1}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-black">
                              {safeTxPage} / {totalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setTxPage(page => Math.min(totalPages, page + 1))}
                              disabled={safeTxPage === totalPages}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* ── Withdrawals Tab ── */}
            <AnimatePresence mode="wait">
              {activeTab === 'withdrawals' && (() => {
                // Pagination Calculations
                const limitCount = 10;
                const totalPages = Math.max(1, Math.ceil(withdrawalsList.length / limitCount));
                const safePage = Math.min(withdrawalPage, totalPages);
                const startIndex = (safePage - 1) * limitCount;
                const paginatedList = withdrawalsList.slice(startIndex, startIndex + limitCount);

                return (
                  <motion.div
                    key="withdrawals"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Withdrawal Requests</h2>
                        <p className="text-sm text-slate-400 mt-0.5">Review and approve trainer payout requests.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3.5 py-2 bg-amber-50 border border-amber-100 rounded-xl text-sm font-bold text-amber-600">
                          {withdrawalsList.filter(w => (w.status || 'pending') === 'pending').length} Pending
                        </span>
                        <span className="px-3.5 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-sm font-bold text-emerald-600">
                          {withdrawalsList.filter(w => w.status === 'approved').length} Approved
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-[750px] w-full">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-6 py-3.5">Trainer</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Amount</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Bank Details</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Requested On</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Status</th>
                              <th className="text-right text-[11px] font-black text-slate-400 uppercase tracking-wider px-6 py-3.5">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {withdrawalsList.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-20 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                      <ArrowDownLeft className="w-7 h-7 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold">No withdrawal requests yet.</p>
                                    <p className="text-slate-300 text-xs">When trainers request payouts, they'll appear here.</p>
                                  </div>
                                </td>
                              </tr>
                            ) : paginatedList.map((w) => {
                              const status = w.status || 'pending';
                              const reqDate = w.createdAt ? (w.createdAt.seconds ? new Date(w.createdAt.seconds * 1000) : new Date(w.createdAt)) : null;
                              const dateStr = reqDate ? reqDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                              return (
                                <tr key={w.id} className="hover:bg-orange-50/20 transition-colors">
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-black text-slate-800">{w.trainerName || '—'}</p>
                                    <p className="text-[11px] text-slate-400">{w.trainerEmail || ''}</p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="text-base font-black text-slate-900">₹{Number(w.amount || 0).toLocaleString()}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-xs text-slate-600 space-y-0.5">
                                      <p className="font-bold">{w.bankName || '—'}</p>
                                      <p className="text-slate-400">{w.accountNumber ? `A/C ****${String(w.accountNumber).slice(-4)}` : (w.bankAccount ? `A/C ****${String(w.bankAccount).slice(-4)}` : '')}</p>
                                      {w.ifscCode && <p className="text-slate-400 uppercase">{w.ifscCode}</p>}
                                      {w.upiId && <p className="text-slate-400">UPI: {w.upiId}</p>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className="text-sm font-semibold text-slate-500">{dateStr}</span>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        status === 'rejected' ? 'bg-red-50 text-red-500 border-red-100' :
                                          'bg-amber-50 text-amber-600 border-amber-100'
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${status === 'approved' ? 'bg-emerald-500' :
                                          status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                                        }`}></span>
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                      {status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => {
                                              setApprovePayoutModal(w);
                                              setApprovePayoutForm({ payAmount: String(w.amount || ''), utrId: '', proofFile: null, proofPreview: '', proofUrl: '' });
                                            }}
                                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                                          >
                                            <BadgeCheck className="w-3.5 h-3.5" /> Approve
                                          </button>
                                          <button
                                            onClick={async () => {
                                              if (!confirm('Reject this withdrawal request?')) return;
                                              try {
                                                await updateDoc(doc(db, 'bharatam_withdrawal_requests', w.id), { status: 'rejected', rejectedAt: new Date(), rejectedBy: user?.fullName || 'Super Admin' });
                                              } catch (err) { alert('Failed to reject: ' + err.message); }
                                            }}
                                            className="px-3.5 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                                          >
                                            <Ban className="w-3.5 h-3.5" /> Reject
                                          </button>
                                        </>
                                      )}
                                      {status === 'approved' && (
                                        <div className="flex flex-col items-end gap-1">
                                          <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                                            <BadgeCheck className="w-4 h-4" /> Approved
                                          </span>
                                          {w.utrId && <span className="text-[10px] text-slate-400 font-medium">UTR: {w.utrId}</span>}
                                          {w.paidAmount && <span className="text-[10px] text-slate-400 font-medium">Paid: ₹{Number(w.paidAmount).toLocaleString()}</span>}
                                          {w.proofUrl && (
                                            <a href={w.proofUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-orange-500 underline font-medium">View Proof</a>
                                          )}
                                        </div>
                                      )}
                                      {status === 'rejected' && (
                                        <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                                          <Ban className="w-4 h-4" /> Rejected
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {withdrawalsList.length > limitCount && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                          <p className="text-xs font-bold text-slate-400">
                            Showing {startIndex + 1}-{Math.min(startIndex + limitCount, withdrawalsList.length)} of {withdrawalsList.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setWithdrawalPage(page => Math.max(1, page - 1))}
                              disabled={safePage === 1}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-black">
                              {safePage} / {totalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setWithdrawalPage(page => Math.min(totalPages, page + 1))}
                              disabled={safePage === totalPages}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* ── Trainer Wallet Tab ── */}
            <AnimatePresence mode="wait">
              {activeTab === 'trainer_wallet' && (() => {
                // Merge trainer_wallets with trainer info from usersList
                const trainers = usersList.filter(u => u.role === 'trainer');
                // Build map from trainerWalletsList
                const walletMap = {};
                trainerWalletsList.forEach(w => { walletMap[w.id] = w; });
                // Also build wallet from purchasesList per trainer
                const earningsMap = {};
                purchasesList.forEach(p => {
                  const tid = p.trainerId || p.trainerUid;
                  if (tid) {
                    const matchedCourse = coursesList.find(c => c.id === p.courseId);
                    const commission = typeof p.commission === 'number'
                      ? p.commission
                      : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
                    const trainerShare = (100 - commission) / 100;
                    const trainerAmount = getPurchaseAmount(p) * trainerShare;
                    earningsMap[tid] = (earningsMap[tid] || 0) + trainerAmount;
                  }
                });
                // Pending withdrawal requests per trainer
                const pendingMap = {};
                withdrawalsList.filter(w => (w.status || 'pending') === 'pending').forEach(w => {
                  if (w.trainerId) pendingMap[w.trainerId] = (pendingMap[w.trainerId] || 0) + 1;
                });

                const rows = trainers.length > 0 ? trainers.map(trainer => {
                  const wallet = walletMap[trainer.id] || {};
                  const totalEarnings = Number(wallet.totalEarnings || earningsMap[trainer.id] || 0);
                  const withdrawn = Number(wallet.withdrawn || 0);
                  const available = Math.max(0, totalEarnings - withdrawn);
                  const pending = pendingMap[trainer.id] || 0;
                  return { trainer, totalEarnings, withdrawn, available, pending };
                }) : trainerWalletsList.map(w => ({
                  trainer: { id: w.id, fullName: w.trainerName || w.name || 'Unknown', email: w.email || '' },
                  totalEarnings: Number(w.totalEarnings || 0),
                  withdrawn: Number(w.withdrawn || 0),
                  available: Math.max(0, Number(w.totalEarnings || 0) - Number(w.withdrawn || 0)),
                  pending: pendingMap[w.id] || 0,
                }));

                const limitCount = 10;
                const totalPages = Math.max(1, Math.ceil(rows.length / limitCount));
                const safePage = Math.min(walletPage, totalPages);
                const startIndex = (safePage - 1) * limitCount;
                const paginatedRows = rows.slice(startIndex, startIndex + limitCount);

                return (
                  <motion.div
                    key="trainer_wallet"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Trainer Wallets</h2>
                      <p className="text-sm text-slate-400 mt-0.5">Overview of each trainer's earnings, withdrawals, and available balance.</p>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        {
                          label: 'Total Trainer Earnings',
                          value: `₹${trainerWalletsList.reduce((s, w) => s + Number(w.totalEarnings || 0), 0).toLocaleString()}`,
                          icon: TrendingUp, bg: 'bg-orange-50', border: 'border-orange-100', iconColor: 'text-orange-500'
                        },
                        {
                          label: 'Total Withdrawn',
                          value: `₹${trainerWalletsList.reduce((s, w) => s + Number(w.withdrawn || 0), 0).toLocaleString()}`,
                          icon: ArrowDownLeft, bg: 'bg-blue-50', border: 'border-blue-100', iconColor: 'text-blue-500'
                        },
                        {
                          label: 'Total Available Balance',
                          value: `₹${trainerWalletsList.reduce((s, w) => s + Math.max(0, Number(w.totalEarnings || 0) - Number(w.withdrawn || 0)), 0).toLocaleString()}`,
                          icon: Wallet, bg: 'bg-emerald-50', border: 'border-emerald-100', iconColor: 'text-emerald-500'
                        },
                      ].map((card, i) => (
                        <div key={i} className={`bg-white rounded-2xl border ${card.border} shadow-sm p-5 flex items-center gap-4`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} border ${card.border}`}>
                            <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                            <p className="text-2xl font-black text-slate-900 mt-0.5">{card.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Trainer Wallet Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-50">
                        <h3 className="text-base font-black text-slate-800">Trainer Wallet Overview</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full">
                          <thead>
                            <tr className="bg-slate-50">
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-6 py-3.5">Trainer</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Total Earnings</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Withdrawn</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Available Balance</th>
                              <th className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-3.5">Pending Requests</th>
                              <th className="text-right text-[11px] font-black text-slate-400 uppercase tracking-wider px-6 py-3.5">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {rows.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-20 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                      <Wallet className="w-7 h-7 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-bold">No trainer wallets found.</p>
                                    <p className="text-slate-300 text-xs">Wallets are created when trainers receive earnings.</p>
                                  </div>
                                </td>
                              </tr>
                            ) : paginatedRows.map(({ trainer, totalEarnings, withdrawn, available, pending }) => (
                              <tr key={trainer.id} className="hover:bg-orange-50/20 transition-colors animate-fadeIn">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 font-black text-sm flex-shrink-0">
                                      {(trainer.fullName || 'T')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-800">{trainer.fullName || 'Unknown'}</p>
                                      <p className="text-[11px] text-slate-400">{trainer.email || ''}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm font-black text-slate-800">₹{totalEarnings.toLocaleString()}</span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="text-sm font-bold text-blue-600">₹{withdrawn.toLocaleString()}</span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`text-sm font-black ${available > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>₹{available.toLocaleString()}</span>
                                </td>
                                <td className="px-4 py-4">
                                  {pending > 0 ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold rounded-full">
                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                      {pending} Pending
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-xs font-bold">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    <button
                                      onClick={() => handleExportTrainerReport(trainer, { totalEarnings, withdrawn, available, pending })}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 border border-orange-100/40"
                                      title="Export Trainer History Excel (CSV)"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Export Excel
                                    </button>
                                    <button
                                      onClick={() => handleExportTrainerPDF(trainer, { totalEarnings, withdrawn, available, pending })}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 border border-indigo-100/40"
                                      title="Export Trainer History PDF"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      Export PDF
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {rows.length > limitCount && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-white">
                          <p className="text-xs font-bold text-slate-400">
                            Showing {startIndex + 1}-{Math.min(startIndex + limitCount, rows.length)} of {rows.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setWalletPage(page => Math.max(1, page - 1))}
                              disabled={safePage === 1}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-black">
                              {safePage} / {totalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setWalletPage(page => Math.min(totalPages, page + 1))}
                              disabled={safePage === totalPages}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </main>

        {/* Full Screen Create Course Overlay */}
        <AnimatePresence>
          {isCreateCourseOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#f2f4f8] flex flex-col overflow-hidden"
            >
              {/* ── Header ── */}
              <div className="flex-shrink-0 bg-white border-b border-gray-100 h-16 px-10 flex items-center gap-4 shadow-sm">
                <button
                  onClick={() => setIsCreateCourseOpen(false)}
                  className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div className="w-px h-5 bg-gray-100" />
                <h1 className="text-lg font-semibold text-gray-900">Create New Course</h1>
                <div className="ml-auto flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                  Auto-approved on publish
                </div>
              </div>

              {/* ── Body ── */}
              <div className="flex-1 overflow-hidden flex">

                {/* LEFT — Thumbnail + Preview */}
                <div className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col p-8 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Course Thumbnail</p>
                    <label className="block cursor-pointer group">
                      <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} />
                      <div className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${newCourseForm.thumbnail
                          ? 'border-transparent'
                          : 'border-gray-200 hover:border-orange-300 bg-gray-50 hover:bg-orange-50/30'
                        }`}>
                        {newCourseForm.thumbnail ? (
                          <div className="relative w-full h-full">
                            <img src={newCourseForm.thumbnail} alt="Thumbnail" className="w-full h-full object-cover rounded-2xl" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                              <span className="text-white text-sm font-medium">Change Image</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                              <ImageIcon className="w-6 h-6 text-orange-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Click to upload</p>
                            <p className="text-xs text-gray-300 mt-1">JPG, PNG · up to 5MB</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Preview card */}
                  <div className="mt-auto">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Preview</p>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                      <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                        {newCourseForm.title || <span className="text-gray-300">Course title will appear here</span>}
                      </p>
                      {newCourseForm.category && (
                        <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-lg">
                          {newCourseForm.category}
                        </span>
                      )}
                      <p className="text-sm font-semibold text-gray-700">
                        {newCourseForm.isFree ? (
                          <span className="text-emerald-600">Free</span>
                        ) : newCourseForm.price ? (
                          <span>₹{newCourseForm.price}</span>
                        ) : (
                          <span className="text-gray-300">Price not set</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Form */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-2xl mx-auto px-10 py-8 space-y-7">

                    {/* Title */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Course Title <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Complete Python Bootcamp"
                        value={newCourseForm.title}
                        onChange={e => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Description</label>
                      <textarea
                        placeholder="What will students learn in this course?"
                        rows={4}
                        value={newCourseForm.description}
                        onChange={e => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Category <span className="text-red-400">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          // Merge Firestore categories + course-derived categories
                          const names = new Set();
                          categoriesList.forEach(c => { if (c.name) names.add(c.name.trim()); });
                          coursesList.forEach(c => { const n = (c.subject || c.category || '').trim(); if (n) names.add(n); });
                          const allCats = [...names].sort();
                          return allCats.length > 0 ? allCats : ['Mathematics', 'Language', 'Science', 'Philosophy', 'Arts'];
                        })().map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewCourseForm({ ...newCourseForm, category: cat })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${newCourseForm.category === cat
                                ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      {/* Custom category input */}
                      <input
                        type="text"
                        placeholder="Or type a custom category..."
                        value={!['Mathematics', 'Language', 'Science', 'Philosophy', 'Arts'].includes(newCourseForm.category) && !categoriesList.find(c => c.name === newCourseForm.category) && !coursesList.find(c => (c.subject || c.category) === newCourseForm.category) ? newCourseForm.category : ''}
                        onChange={e => setNewCourseForm({ ...newCourseForm, category: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all mt-2"
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-600">Pricing</label>
                      <div className="flex items-center gap-4">
                        {/* Free toggle */}
                        <button
                          type="button"
                          onClick={() => setNewCourseForm({ ...newCourseForm, isFree: !newCourseForm.isFree })}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${newCourseForm.isFree
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${newCourseForm.isFree ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                            }`}>
                            {newCourseForm.isFree && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          Free Course
                        </button>

                        {/* Price input */}
                        <div className="flex-1 relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={newCourseForm.price}
                            onChange={e => setNewCourseForm({ ...newCourseForm, price: e.target.value })}
                            disabled={newCourseForm.isFree}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Publish */}
                    <div className="flex items-center gap-4 pb-4">
                      <button
                        type="button"
                        onClick={() => setIsCreateCourseOpen(false)}
                        className="px-6 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAdminCreateCourse}
                        className="flex-1 flex items-center justify-center gap-2.5 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-orange-200"
                      >
                        <Upload className="w-4 h-4" />
                        Publish Course
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Screen Upload Content Overlay */}
        <AnimatePresence>
          {isUploadMediaOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-0 z-[100] bg-[#f8f9fc] flex flex-col overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-[#f8f9fc] px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => setIsUploadMediaOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h2 className="text-xl font-black text-gray-900">Upload Content</h2>
              </div>

              <div className="max-w-2xl mx-auto w-full p-6 pb-24 space-y-6">
                {/* Info Box */}
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3 items-center justify-center text-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold text-emerald-700 text-sm">Admin upload - files stay in external storage</span>
                </div>

                {/* Select Course */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Select Course</label>
                  <select
                    value={newMediaForm.courseId}
                    onChange={e => setNewMediaForm({ ...newMediaForm, courseId: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none focus:border-purple-300 font-bold text-gray-900 shadow-sm appearance-none"
                  >
                    <option value="" disabled>Select a course...</option>
                    {coursesList.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Video Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Video Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 1: Introduction"
                    value={newMediaForm.title}
                    onChange={e => setNewMediaForm({ ...newMediaForm, title: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none focus:border-purple-300 font-bold text-gray-900 shadow-sm placeholder:text-gray-400 placeholder:font-medium"
                  />
                </div>

                {/* File Upload Drag Zone */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Upload File</label>
                  <label className={`block w-full border-[3px] border-dashed rounded-[1.5rem] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                    }`}>
                    <input
                      type="file"
                      className="hidden"
                      accept={newMediaForm.type === 'video' ? 'video/*' : '.pdf,application/pdf'}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setSelectedFile(file);
                          setNewMediaForm({ ...newMediaForm, url: '' });
                        }
                      }}
                    />
                    {selectedFile ? (
                      <div className="text-center">
                        <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Video className="w-7 h-7 text-purple-500" />
                        </div>
                        <p className="font-bold text-purple-700">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        <button
                          onClick={e => { e.preventDefault(); setSelectedFile(null); }}
                          className="mt-3 text-xs font-bold text-red-400 hover:text-red-500"
                        >Remove</button>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-3">
                          <Upload className="w-7 h-7 text-purple-400" />
                        </div>
                        <p className="font-bold text-gray-700">Click to select a file</p>
                        <p className="text-xs text-gray-400 mt-1">{newMediaForm.type === 'video' ? 'MP4, MOV, MKV' : 'PDF'} · Uploads directly to Bunny.net</p>
                      </>
                    )}
                  </label>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or paste CDN URL</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                {/* CDN URL Input */}
                <div>
                  <input
                    type="text"
                    placeholder="https://firstprojectnew.b-cdn.net/videos/..."
                    value={newMediaForm.url}
                    disabled={!!selectedFile}
                    onChange={e => setNewMediaForm({ ...newMediaForm, url: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none focus:border-purple-300 font-bold text-gray-900 shadow-sm placeholder:text-gray-400 placeholder:font-medium disabled:opacity-40 disabled:bg-gray-50"
                  />
                </div>

                {/* Duration and Price */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Duration (min)</label>
                    <input
                      type="text"
                      placeholder="e.g. 25"
                      value={newMediaForm.duration}
                      onChange={e => setNewMediaForm({ ...newMediaForm, duration: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none focus:border-purple-300 font-bold text-gray-900 shadow-sm placeholder:text-gray-400 placeholder:font-medium"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Price (₹)</label>
                    <input
                      type="text"
                      placeholder="e.g. 49"
                      value={newMediaForm.price}
                      onChange={e => setNewMediaForm({ ...newMediaForm, price: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none focus:border-purple-300 font-bold text-gray-900 shadow-sm placeholder:text-gray-400 placeholder:font-medium"
                    />
                  </div>
                </div>

                {/* Module ID */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Module ID</label>
                  <input
                    type="text"
                    placeholder="e.g. mod_001"
                    value={newMediaForm.moduleId}
                    onChange={e => setNewMediaForm({ ...newMediaForm, moduleId: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none focus:border-purple-300 font-bold text-gray-900 shadow-sm placeholder:text-gray-400 placeholder:font-medium"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Order (Auto)</label>
                  <input
                    type="text"
                    placeholder="Select a course"
                    value={getNextOrderForSelectedMedia()}
                    readOnly
                    className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] px-5 py-4 outline-none font-bold text-gray-500 shadow-sm placeholder:text-gray-400 placeholder:font-medium"
                  />
                </div>

                {/* Content Type */}
                <div className="flex items-center gap-4 py-2">
                  <label className="block text-sm font-bold text-gray-700 ml-1">Content Type:</label>
                  <div className="flex bg-gray-50 p-1.5 rounded-[1rem] shadow-inner border border-gray-100">
                    <button
                      onClick={() => setNewMediaForm({ ...newMediaForm, type: 'video' })}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${newMediaForm.type === 'video' ? 'bg-orange-100 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {newMediaForm.type === 'video' && <CheckCircle className="w-4 h-4" />} Video
                    </button>
                    <button
                      onClick={() => setNewMediaForm({ ...newMediaForm, type: 'pdf' })}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${newMediaForm.type === 'pdf' ? 'bg-white border border-gray-200 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {newMediaForm.type === 'pdf' && <CheckCircle className="w-4 h-4" />} PDF
                    </button>
                  </div>
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="bg-white rounded-[1.5rem] p-5 border border-purple-100 shadow-sm">
                    <div className="flex justify-between mb-3">
                      <span className="text-sm font-bold text-gray-700">Uploading to Bunny.net...</span>
                      <span className="text-sm font-bold text-purple-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-orange-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    {uploadProgress === 100 && (
                      <p className="text-xs font-bold text-emerald-500 mt-2 text-center">✅ Upload complete! Saving to database...</p>
                    )}
                  </div>
                )}

                {/* Publish Button */}
                <div className="pt-2">
                  <button
                    onClick={handleAdminUploadMedia}
                    disabled={isUploading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold text-lg py-5 rounded-[1.5rem] shadow-lg shadow-orange-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {uploadProgress < 100 ? `Uploading ${uploadProgress}%...` : 'Saving...'}
                      </>
                    ) : (
                      <><Upload className="w-5 h-5" /> Publish Content</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddCategoryOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#f2f4f8] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-100 px-10 h-16 flex items-center gap-6 shadow-sm">
                <button
                  onClick={() => { setIsAddCategoryOpen(false); setNewCategoryName(''); setNewTagName(''); setCategorySearch(''); setTagSearch(''); }}
                  className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setCategoryActiveTab('categories')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoryActiveTab === 'categories' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Course Categories
                  </button>
                  <button
                    onClick={() => setCategoryActiveTab('tags')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoryActiveTab === 'tags' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Course Tags
                  </button>
                </div>

                <span className="ml-auto text-sm font-semibold text-gray-400">
                  {categoryActiveTab === 'categories' ? (
                    (() => {
                      const firestoreNames = new Set(categoriesList.map(c => (c.name || '').trim().toLowerCase()));
                      const courseNames = new Set();
                      coursesList.forEach(c => { const n = (c.subject || c.category || '').trim(); if (n) courseNames.add(n.toLowerCase()); });
                      const total = firestoreNames.size + [...courseNames].filter(n => !firestoreNames.has(n)).length;
                      return `${total} ${total === 1 ? 'category' : 'categories'}`;
                    })()
                  ) : (
                    `${tagsList.length} ${tagsList.length === 1 ? 'tag' : 'tags'}`
                  )}
                </span>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden flex">

                {/* LEFT — Add form */}
                <div className="w-96 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col p-8 gap-6">
                  {categoryActiveTab === 'categories' ? (
                    <>
                      <div>
                        <h2 className="text-base font-bold text-gray-800 mb-1">Add Category</h2>
                        <p className="text-sm text-gray-400">Enter a name to create a new course category.</p>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                          placeholder="Enter category name"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base font-medium text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-400 focus:bg-white transition-all"
                        />
                        <button
                          onClick={handleAddCategory}
                          disabled={!newCategoryName.trim()}
                          className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-all active:scale-[0.98] shadow-md shadow-orange-200"
                        >
                          <Plus className="w-5 h-5" />
                          Add Category
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-base font-bold text-gray-800 mb-1">Add Tag</h2>
                        <p className="text-sm text-gray-400">Enter a name to create a new course tag.</p>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={e => setNewTagName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                          placeholder="Enter tag name"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base font-medium text-gray-900 placeholder:text-gray-300 outline-none focus:border-orange-400 focus:bg-white transition-all"
                        />
                        <button
                          onClick={handleAddTag}
                          disabled={!newTagName.trim()}
                          className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-all active:scale-[0.98] shadow-md shadow-orange-200"
                        >
                          <Plus className="w-5 h-5" />
                          Add Tag
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* RIGHT — Taxonomy list */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {categoryActiveTab === 'categories' ? (
                    <>
                      {/* Toolbar */}
                      <div className="flex-shrink-0 px-10 py-5 flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-800">Available Categories</h3>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            type="text"
                            placeholder="Search..."
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-300 outline-none focus:border-orange-400 transition-all w-52 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto px-10 pb-10">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          {(() => {
                            const fromFirestore = categoriesList.map(cat => ({
                              id: cat.id,
                              name: cat.name || '',
                              fromFirestore: true,
                            }));

                            const firestoreNames = new Set(fromFirestore.map(c => c.name.trim().toLowerCase()));

                            const fromCourses = [];
                            const seen = new Set(firestoreNames);
                            coursesList.forEach(course => {
                              const name = (course.subject || course.category || '').trim();
                              if (name && !seen.has(name.toLowerCase())) {
                                seen.add(name.toLowerCase());
                                fromCourses.push({ id: `course-cat-${name}`, name, fromFirestore: false });
                              }
                            });

                            const allCategories = [...fromFirestore, ...fromCourses].sort((a, b) =>
                              a.name.localeCompare(b.name)
                            );

                            const filtered = allCategories.filter(cat =>
                              !categorySearch ||
                              cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                            );

                            if (filtered.length === 0) {
                              return (
                                <div className="py-20 flex flex-col items-center gap-3">
                                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                                    <Tags className="w-6 h-6 text-orange-300" />
                                  </div>
                                  <p className="text-base font-semibold text-gray-400">
                                    {categorySearch ? 'No matching categories' : 'No categories yet'}
                                  </p>
                                  <p className="text-sm text-gray-300">
                                    {categorySearch ? 'Try a different search term' : 'Add your first category on the left'}
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <ul className="divide-y divide-gray-50">
                                {filtered.map((cat, idx) => (
                                  <motion.li
                                    key={cat.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-orange-50/40 transition-colors group"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                      <Tags className="w-5 h-5 text-orange-500" />
                                    </div>

                                    <span className="flex-1 text-base font-semibold text-gray-800">
                                      {cat.name}
                                    </span>

                                    {cat.fromFirestore && (
                                      <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                      </button>
                                    )}
                                  </motion.li>
                                ))}
                              </ul>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Toolbar */}
                      <div className="flex-shrink-0 px-10 py-5 flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-800">Available Tags</h3>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            type="text"
                            placeholder="Search..."
                            value={tagSearch}
                            onChange={e => setTagSearch(e.target.value)}
                            className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 placeholder:text-gray-300 outline-none focus:border-orange-400 transition-all w-52 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto px-10 pb-10">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          {(() => {
                            const filtered = tagsList.filter(tag =>
                              !tagSearch ||
                              (tag.name || '').toLowerCase().includes(tagSearch.toLowerCase())
                            );

                            if (filtered.length === 0) {
                              return (
                                <div className="py-20 flex flex-col items-center gap-3">
                                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                    <Tags className="w-6 h-6 text-indigo-300" />
                                  </div>
                                  <p className="text-base font-semibold text-gray-400">
                                    {tagSearch ? 'No matching tags' : 'No tags yet'}
                                  </p>
                                  <p className="text-sm text-gray-300">
                                    {tagSearch ? 'Try a different search term' : 'Add your first tag on the left'}
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <ul className="divide-y divide-gray-50">
                                {filtered.map((tag, idx) => (
                                  <motion.li
                                    key={tag.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-indigo-50/40 transition-colors group"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                      <Tags className="w-5 h-5 text-indigo-500" />
                                    </div>

                                    <span className="flex-1 text-base font-semibold text-gray-800">
                                      {tag.name}
                                    </span>

                                    <button
                                      onClick={() => handleDeleteTag(tag.id)}
                                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                  </motion.li>
                                ))}
                              </ul>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPoliciesModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#f2f4f8] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-100 px-10 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsPoliciesModalOpen(false)}
                    className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-900">Content Policies & Guidelines</h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPoliciesModalOpen(false)}
                    className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePolicies}
                    disabled={isSavingPolicies}
                    className="px-6 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-rose-200 flex items-center gap-2"
                  >
                    {isSavingPolicies ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Policies'
                    )}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-10 max-w-4xl mx-auto w-full space-y-8">
                {/* Intro Card */}
                <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl flex gap-4 items-start">
                  <ShieldAlert className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-900 mb-1">Global Platform Guidelines</h3>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">
                      Updating these policy definitions will modify the dynamic legal texts presented to trainers during onboarding and students inside course catalogs. Ensure language is clear, descriptive, and complies with educational service policies.
                    </p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                  {/* Terms of Use */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-800">Terms & Conditions of Service</label>
                    <p className="text-xs text-slate-400 font-medium">Standard terms, usage limits, and course distribution conditions.</p>
                    <textarea
                      value={policiesInput.terms}
                      onChange={e => setPoliciesInput({ ...policiesInput, terms: e.target.value })}
                      placeholder="Enter terms and conditions text..."
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-rose-400 focus:bg-white transition-all resize-y"
                    />
                  </div>

                  {/* Privacy Policy */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-800">Privacy Policy</label>
                    <p className="text-xs text-slate-400 font-medium">User privacy statement, cookies usage, data handling, and telemetry.</p>
                    <textarea
                      value={policiesInput.privacy}
                      onChange={e => setPoliciesInput({ ...policiesInput, privacy: e.target.value })}
                      placeholder="Enter privacy policy text..."
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-rose-400 focus:bg-white transition-all resize-y"
                    />
                  </div>

                  {/* Trainer Guidelines */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-800">Trainer & Curriculum Guidelines</label>
                    <p className="text-xs text-slate-400 font-medium">Core rules, verification requirements, and code of conduct for content creators.</p>
                    <textarea
                      value={policiesInput.trainerGuidelines}
                      onChange={e => setPoliciesInput({ ...policiesInput, trainerGuidelines: e.target.value })}
                      placeholder="Enter trainer guidelines text..."
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-rose-400 focus:bg-white transition-all resize-y"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Approve Payout Modal ── */}
        <AnimatePresence>
          {approvePayoutModal && (
            <motion.div
              key="approve-payout-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) { setApprovePayoutModal(null); setApprovePayoutForm({ payAmount: '', utrId: '', proofFile: null, proofPreview: '', proofUrl: '' }); } }}
            >
              <motion.div
                key="approve-payout-modal"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Header */}
                <div className="px-7 pt-7 pb-5">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <BadgeCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Approve Payout</h2>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 ml-13 pl-0.5">
                    Enter payment details below before approving the payout for{' '}
                    <span className="font-semibold text-slate-600">{approvePayoutModal.trainerName || 'Trainer'}</span>.
                  </p>
                </div>

                {/* Body */}
                <div className="px-7 pb-6 space-y-5">
                  {/* Pay Amount */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Pay Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">₹</span>
                      <input
                        type="number"
                        min="1"
                        value={approvePayoutForm.payAmount}
                        onChange={e => setApprovePayoutForm(f => ({ ...f, payAmount: e.target.value }))}
                        className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* UTR / Transaction ID */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Transaction / UTR ID</label>
                    <input
                      type="text"
                      value={approvePayoutForm.utrId}
                      onChange={e => setApprovePayoutForm(f => ({ ...f, utrId: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-400 focus:bg-white transition-all"
                      placeholder="e.g. UPI Ref / UTR No"
                    />
                  </div>

                  {/* Transaction Screenshot / Proof */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Transaction Screenshot / Proof</label>
                    {approvePayoutForm.proofPreview ? (
                      <div className="relative">
                        <img
                          src={approvePayoutForm.proofPreview}
                          alt="Proof"
                          className="w-full h-40 object-cover rounded-2xl border border-slate-200"
                        />
                        <button
                          onClick={() => setApprovePayoutForm(f => ({ ...f, proofFile: null, proofPreview: '', proofUrl: '' }))}
                          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-sm font-bold text-orange-500">Choose Screenshot / Proof</span>
                        <span className="text-xs text-slate-400">PNG, JPG or PDF</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setApprovePayoutForm(f => ({
                              ...f,
                              proofFile: file,
                              proofPreview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
                            }));
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-7 pb-7 flex items-center gap-3">
                  <button
                    onClick={() => { setApprovePayoutModal(null); setApprovePayoutForm({ payAmount: '', utrId: '', proofFile: null, proofPreview: '', proofUrl: '' }); }}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmittingApproval || !approvePayoutForm.payAmount || !approvePayoutForm.utrId}
                    onClick={async () => {
                      if (!approvePayoutForm.payAmount || !approvePayoutForm.utrId) {
                        alert('Please fill in Pay Amount and Transaction/UTR ID.');
                        return;
                      }
                      setIsSubmittingApproval(true);
                      try {
                        let proofUrl = '';
                        // Upload proof image to Bunny CDN if provided
                        if (approvePayoutForm.proofFile) {
                          try {
                            const { cdnUrl } = await uploadToBunny(approvePayoutForm.proofFile, 'payout-proofs');
                            proofUrl = cdnUrl || '';
                          } catch (uploadErr) {
                            console.warn('Proof upload failed, proceeding without it:', uploadErr);
                          }
                        }

                        const w = approvePayoutModal;
                        // Update withdrawal request to approved with payment details
                        await updateDoc(doc(db, 'bharatam_withdrawal_requests', w.id), {
                          status: 'approved',
                          approvedAt: serverTimestamp(),
                          approvedBy: user?.fullName || 'Super Admin',
                          paidAmount: Number(approvePayoutForm.payAmount),
                          utrId: approvePayoutForm.utrId.trim(),
                          proofUrl,
                        });

                        // Update trainer_wallet withdrawn balance
                        if (w.trainerId) {
                          try {
                            const walletRef = doc(db, 'trainer_wallets', w.trainerId);
                            const walletSnap = await getDocs(collection(db, 'trainer_wallets'));
                            const wDoc = walletSnap.docs.find(d => d.id === w.trainerId);
                            if (wDoc) {
                              const currentWithdrawn = Number(wDoc.data().withdrawn || 0);
                              await updateDoc(walletRef, { withdrawn: currentWithdrawn + Number(approvePayoutForm.payAmount), updatedAt: new Date() });
                            }
                          } catch (walletErr) {
                            console.warn('Wallet update failed:', walletErr);
                          }
                        }

                        setApprovePayoutModal(null);
                        setApprovePayoutForm({ payAmount: '', utrId: '', proofFile: null, proofPreview: '', proofUrl: '' });
                      } catch (err) {
                        alert('Failed to approve payout: ' + err.message);
                      } finally {
                        setIsSubmittingApproval(false);
                      }
                    }}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black transition-colors shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    {isSubmittingApproval ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                    ) : (
                      <><BadgeCheck className="w-4 h-4" /> Proceed</>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isManageAdsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-y-auto"
            >
              <div className="bg-slate-50 px-5 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-10 border-b border-slate-200">
                <button onClick={() => setIsManageAdsOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <ArrowLeft className="w-6 h-6 text-slate-900" />
                </button>
                <h2 className="text-xl font-black text-slate-950">Manage Ads</h2>
              </div>

              <div className="max-w-3xl mx-auto w-full p-5 sm:p-6 space-y-5">
                <label className={`w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-2xl py-5 px-5 shadow-lg shadow-orange-200 font-black text-lg flex items-center justify-center gap-3 transition-all cursor-pointer ${isUploadingAd ? 'opacity-70 pointer-events-none' : 'hover:shadow-xl hover:-translate-y-1'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQuickAddAdvertisement}
                    disabled={isUploadingAd}
                  />
                  {isUploadingAd ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading Ad...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6" />
                      Add New Advertisement
                    </>
                  )}
                </label>

                <div className="space-y-4">
                  {advertisements.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
                      <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">No advertisements added yet.</p>
                    </div>
                  ) : advertisements.map(ad => (
                    <div key={ad.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title || 'Advertisement'}
                        className="w-28 h-20 sm:w-36 sm:h-24 rounded-2xl object-cover bg-slate-100 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-950 break-words">{ad.title || 'Advertisement Banner'}</h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">{ad.status || 'active'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteAdvertisement(ad.id)}
                        className="w-11 h-11 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center flex-shrink-0"
                        title="Delete advertisement"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Edit Global Commission Modal ── */}
        <AnimatePresence>
          {isEditCommissionOpen && (
            <motion.div
              key="edit-commission-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setIsEditCommissionOpen(false); }}
            >
              <motion.div
                key="edit-commission-modal"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 flex flex-col gap-6 relative"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-lg font-black text-slate-900">Global Commission settings</h3>
                  <button 
                    onClick={() => setIsEditCommissionOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    This rate is applied by default as the platform fee for all course transactions, unless a custom course-specific rate is set during its review and approval.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Default Rate (%)</label>
                      <span className="text-[10px] font-bold text-slate-400">Allowed: 0% to 100%</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={commissionInput === '' ? 0 : commissionInput}
                        onChange={e => setCommissionInput(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <div className="relative w-24 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={commissionInput}
                          onChange={e => {
                            let val = e.target.value;
                            if (val !== '') {
                              const num = Number(val);
                              if (num < 0) val = 0;
                              if (num > 100) val = 100;
                            }
                            setCommissionInput(val);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-300 outline-none focus:border-orange-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="e.g. 20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditCommissionOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGlobalCommission}
                    className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black transition-colors shadow-md shadow-orange-100"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Approve Course Custom Commission Modal ── */}
        <AnimatePresence>
          {approveCourseModal && (
            <motion.div
              key="approve-course-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setApproveCourseModal(null); }}
            >
              <motion.div
                key="approve-course-modal"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="w-full max-w-lg bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 flex flex-col gap-6 relative"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Approve Course</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate max-w-[360px]">{approveCourseModal.title}</p>
                  </div>
                  <button 
                    onClick={() => setApproveCourseModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Info Row */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trainer Name</p>
                      <p className="text-xs font-bold text-slate-700 mt-1">{approveCourseModal.trainerName || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Course Price</p>
                      <p className="text-xs font-black text-slate-900 mt-1">
                        {approveCourseModal.price === 'Free' ? 'Free' : `₹${approveCourseModal.price}`}
                      </p>
                    </div>
                  </div>

                  {/* Custom Commission Toggle */}
                  {approveCourseModal.price !== 'Free' && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useCustomCommission}
                          onChange={(e) => {
                            setUseCustomCommission(e.target.checked);
                            setApproveCommissionInput(e.target.checked ? globalCommission : '');
                          }}
                          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
                        />
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                          Apply specific custom commission for this course
                        </span>
                      </label>

                      {useCustomCommission && (
                        <div className="space-y-3 pl-6 animate-fadeIn">
                          <div className="flex justify-between items-center max-w-sm">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Custom Rate (%)</label>
                            <span className="text-[9px] font-bold text-slate-400">Allowed: 0% to 100%</span>
                          </div>
                          <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 max-w-sm">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={approveCommissionInput === '' ? 0 : approveCommissionInput}
                              onChange={e => setApproveCommissionInput(Number(e.target.value))}
                              className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="relative w-24 flex-shrink-0">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={approveCommissionInput}
                                onChange={e => {
                                  let val = e.target.value;
                                  if (val !== '') {
                                    const num = Number(val);
                                    if (num < 0) val = 0;
                                    if (num > 100) val = 100;
                                  }
                                  setApproveCommissionInput(val);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-7 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-300 outline-none focus:border-orange-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="e.g. 10"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Revenue Preview Cards */}
                      {(() => {
                        const originalPrice = Number(approveCourseModal.price) || 0;
                        const activeCommission = useCustomCommission ? (Number(approveCommissionInput) || 0) : globalCommission;
                        const platformCut = Math.round((originalPrice * activeCommission) / 100);
                        const trainerRevenue = Math.max(0, originalPrice - platformCut);

                        return (
                          <div className="mt-4 p-4 rounded-2xl bg-orange-50/30 border border-orange-100/60 space-y-3">
                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Transaction Share Breakup</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Student Pays</p>
                                <p className="text-sm font-black text-slate-800 mt-1">₹{originalPrice}</p>
                              </div>
                              <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 shadow-sm text-center">
                                <p className="text-[9px] font-bold text-red-500 uppercase">Platform Cut ({activeCommission}%)</p>
                                <p className="text-sm font-black text-red-600 mt-1">₹{platformCut}</p>
                              </div>
                              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
                                <p className="text-[9px] font-bold text-emerald-500 uppercase">Trainer Earns</p>
                                <p className="text-sm font-black text-emerald-600 mt-1">₹{trainerRevenue}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setApproveCourseModal(null)}
                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const comm = useCustomCommission && approveCommissionInput !== '' 
                        ? Number(approveCommissionInput) 
                        : null;
                      handleConfirmCourseApproval(approveCourseModal.id, comm);
                    }}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black transition-colors shadow-md shadow-emerald-100"
                  >
                    Approve Course
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-2 pt-3 pb-6 z-40 shadow-[0_-4px_30px_rgba(0,0,0,0.06)]">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'approvals', icon: CheckSquare, label: 'Approvals' },
            { id: 'people', icon: Users, label: 'People' },
            { id: 'transactions', icon: CreditCard, label: 'Txns' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1 px-2 py-1 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id
                  ? 'bg-orange-500 shadow-lg shadow-orange-200'
                  : 'bg-transparent'
                }`}>
                <item.icon
                  className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-white' : 'text-gray-400'}`}
                  strokeWidth={activeTab === item.id ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] font-bold transition-colors ${activeTab === item.id ? 'text-orange-500' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

      </div>
      {previewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closePreview}>
          <div className="w-full max-w-5xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-black text-lg">{previewModal.title || 'Preview'}</h3>
                <button onClick={closePreview} className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200">Close</button>
              </div>
              <div className="p-3">
                {previewModal.url && (
                  <>
                    {(previewModal.mediaType === 'pdf' || /\.pdf($|\?)/i.test(previewModal.url)) ? (
                      <iframe src={previewModal.url} title="pdf-preview" className="w-full h-[70vh] border-0" />
                    ) : (
                      (/iframe\.mediadelivery\.net|embed|play\//i.test(previewModal.url) ? (
                        <iframe src={previewModal.url} title="video-preview" className="w-full h-[70vh] border-0" allowFullScreen />
                      ) : (
                        <video controls className="w-full h-[70vh] bg-black rounded">
                          <source src={previewModal.url} />
                        </video>
                      ))
                    )}
                  </>
                )}
              </div>
              <div className="p-3 border-t flex justify-end gap-2">
                {previewModal.url && (
                  <button onClick={() => window.open(previewModal.url, '_blank', 'noopener')} className="px-3 py-2 bg-gray-50 border rounded text-sm">Open in new tab</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
