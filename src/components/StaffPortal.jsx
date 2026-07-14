import { useState, useEffect, useMemo } from 'react';
import { LogOut, User, Phone, Building, CreditCard, Save, Wallet, Users, Library, BarChart2, BookOpen, Plus, Upload, ArrowLeft, ArrowRight, ChevronDown, Video, FileText, Trash2, CheckCircle, Users as Users2, Clock, File, Image, History, TrendingUp, CheckCircle as CheckCircle2, Camera, Mail, Search, SlidersHorizontal, Download, ExternalLink, Eye, EyeOff, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, arrayUnion, arrayRemove, setDoc, writeBatch, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { uploadToBunny, uploadToBunnyStream, normalizeBunnyUrl, checkCdnFile, resolveBunnyVideoUrl } from '../utils/bunny';
import { mockCourses, mockAds } from '../utils/fallbackData';

// High-quality mock transaction data for fallback
const sampleTransactions = [
  {
    id: "TXN-2026-001",
    type: "credit",
    title: "Course Purchase: Vedic Math Secrets",
    date: "2026-07-02",
    amount: 1499,
    status: "Completed",
    studentName: "Rajesh Kumar",
    studentEmail: "rajesh.kumar@gmail.com",
    courseId: "mock-1"
  },
  {
    id: "TXN-2026-002",
    type: "credit",
    title: "Course Purchase: Speed Reading Masterclass",
    date: "2026-06-30",
    amount: 1999,
    status: "Completed",
    studentName: "Priya Sharma",
    studentEmail: "priya.sharma@yahoo.com",
    courseId: "mock-2"
  },
  {
    id: "TXN-2026-003",
    type: "debit",
    title: "Withdrawal Requested — A/C ****4321",
    date: "2026-06-25",
    amount: 15000,
    status: "Completed",
    method: "Bank Account",
    bankName: "State Bank of India",
    accountNo: "****4321"
  },
  {
    id: "TXN-2026-004",
    type: "credit",
    title: "Course Purchase: Vedic Math Secrets",
    date: "2026-06-20",
    amount: 1499,
    status: "Completed",
    studentName: "Aman Gupta",
    studentEmail: "aman.g@outlook.com",
    courseId: "mock-1"
  },
  {
    id: "TXN-2026-005",
    type: "credit",
    title: "Course Purchase: Mental Abacus for Kids",
    date: "2026-06-15",
    amount: 999,
    status: "Completed",
    studentName: "Rohan Malhotra",
    studentEmail: "rohan.m@gmail.com",
    courseId: "mock-3"
  },
  {
    id: "TXN-2026-006",
    type: "debit",
    title: "Withdrawal Requested — UPI: test@okaxis",
    date: "2026-06-10",
    amount: 8000,
    status: "Completed",
    method: "UPI",
    upiId: "test@okaxis"
  },
  {
    id: "TXN-2026-007",
    type: "credit",
    title: "Course Purchase: Speed Reading Masterclass",
    date: "2026-05-28",
    amount: 1999,
    status: "Completed",
    studentName: "Divya Teja",
    studentEmail: "divya.t@gmail.com",
    courseId: "mock-2"
  },
  {
    id: "TXN-2026-008",
    type: "credit",
    title: "Course Purchase: Vedic Math Secrets",
    date: "2026-05-12",
    amount: 1499,
    status: "Completed",
    studentName: "Sanjay Dutt",
    studentEmail: "sanjay@gmail.com",
    courseId: "mock-1"
  },
  {
    id: "TXN-2026-009",
    type: "credit",
    title: "Course Purchase: Mental Abacus for Kids",
    date: "2026-04-25",
    amount: 999,
    status: "Completed",
    studentName: "Neha Nair",
    studentEmail: "neha.n@gmail.com",
    courseId: "mock-3"
  },
  {
    id: "TXN-2026-010",
    type: "credit",
    title: "Course Purchase: Speed Reading Masterclass",
    date: "2026-04-05",
    amount: 1999,
    status: "Completed",
    studentName: "Vikram Rathore",
    studentEmail: "vikram.r@gmail.com",
    courseId: "mock-2"
  },
  {
    id: "TXN-2026-011",
    type: "credit",
    title: "Course Purchase: Vedic Math Secrets",
    date: "2026-03-20",
    amount: 1499,
    status: "Completed",
    studentName: "Ananya Roy",
    studentEmail: "ananya.r@gmail.com",
    courseId: "mock-1"
  },
  {
    id: "TXN-2026-012",
    type: "credit",
    title: "Course Purchase: Speed Reading Masterclass",
    date: "2026-02-15",
    amount: 1999,
    status: "Completed",
    studentName: "Karan Johar",
    studentEmail: "karan.j@gmail.com",
    courseId: "mock-2"
  }
];

// Normalize various upload responses into a playable URL/embed
const normalizeSavedVideoUrl = (raw) => {
  if (!raw) return '';
  // If it's already an object
  if (typeof raw === 'object') {
    if (raw.embed) return raw.embed;
    if (raw.url) return raw.url;
    if (raw.playbackUrl) return raw.playbackUrl;
    if (raw.guid) return resolveBunnyVideoUrl(raw.guid);
  }
  // If it's a JSON string containing fields
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        if (parsed.embed) return parsed.embed;
        if (parsed.url) return parsed.url;
        if (parsed.playbackUrl) return parsed.playbackUrl;
        if (parsed.guid) return resolveBunnyVideoUrl(parsed.guid);
      }
    } catch (e) {
      // not JSON — continue
    }
    // Otherwise try to resolve as a GUID or full URL/path
    try {
      return resolveBunnyVideoUrl(trimmed);
    } catch (err) {
      return trimmed;
    }
  }
  return String(raw);
};

const getNextMediaOrder = (items = []) => {
  const maxOrder = items.reduce((max, item) => {
    const order = Number(item?.order || 0);
    return Number.isFinite(order) && order > max ? order : max;
  }, 0);
  return Math.max(maxOrder, items.length) + 1;
};

export default function StaffPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('insights');
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phoneNumber || "",
    email: user?.email || "",
    bankAccount: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    photoUrl: user?.photoUrl || user?.photoURL || ""
  });
  
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(user?.photoUrl || user?.photoURL || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState(new Set());

  // Dynamic Dashboard State
  const [dashboardStats, setDashboardStats] = useState({
    earnings: 0,
    students: 0
  });

  const [globalCommission, setGlobalCommission] = useState(20);

  const [payoutAmount, setPayoutAmount] = useState('');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  // Interactive Revenue Portal States
  const [chartTimeframe, setChartTimeframe] = useState('6months'); // '30days' | '6months'
  const [chartType, setChartType] = useState('earnings'); // 'earnings' | 'withdrawals'
  const [chartHoveredIndex, setChartHoveredIndex] = useState(null);
  
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all'); // 'all' | 'credit' | 'debit'
  const [txStatusFilter, setTxStatusFilter] = useState('all'); // 'all' | 'Completed' | 'Pending' | 'Rejected'
  const [txSort, setTxSort] = useState('newest'); // 'newest' | 'oldest' | 'high' | 'low'
  const [txPage, setTxPage] = useState(1);
  const [txPerPage, setTxPerPage] = useState(5);
  const [selectedTx, setSelectedTx] = useState(null);
  
  // Interactive Profile Setup States
  const [profileSubTab, setProfileSubTab] = useState('personal'); // 'personal' | 'payout'
  const [preferredPayoutChannel, setPreferredPayoutChannel] = useState('bank'); // 'bank' | 'upi'
  const [showBankAccount, setShowBankAccount] = useState(false);

  // Profile data validations
  const isPhoneValid = useMemo(() => {
    if (!profileData.phone) return false;
    const clean = profileData.phone.replace(/[^0-9]/g, '');
    return clean.length === 10;
  }, [profileData.phone]);

  const isIfscValid = useMemo(() => {
    if (!profileData.ifscCode) return false;
    const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return regex.test(profileData.ifscCode);
  }, [profileData.ifscCode]);

  const isUpiValid = useMemo(() => {
    if (!profileData.upiId) return false;
    return profileData.upiId.includes('@') && profileData.upiId.trim().length > 3;
  }, [profileData.upiId]);

  // Form dirty checks
  const isProfileDirty = useMemo(() => {
    return (
      profileData.fullName !== (user?.fullName || "") ||
      profileData.phone !== (user?.phoneNumber || "") ||
      profileData.email !== (user?.email || "") ||
      profileData.bankAccount !== (user?.bankAccount || "") ||
      profileData.ifscCode !== (user?.ifscCode || "") ||
      profileData.bankName !== (user?.bankName || "") ||
      profileData.upiId !== (user?.upiId || "") ||
      profilePhotoFile !== null
    );
  }, [profileData, user, profilePhotoFile]);

  // Dashboard card selection — drives which graph is highlighted
  const [activeOverviewCard, setActiveOverviewCard] = useState(null); // null | 'earnings' | 'students' | 'courses'

  // Base values matching the user's screenshot
  const BASE_EARNINGS = 240000;
  const BASE_WITHDRAWN = 23000;
  const BASE_PENDING = 0;

  // Calculate dynamic metrics on top of base screenshot values
  const totalEarnings = useMemo(() => {
    const additional = transactions
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    return BASE_EARNINGS + additional;
  }, [transactions]);

  const withdrawnAmount = useMemo(() => {
    const additional = transactions
      .filter(tx => tx.type === 'debit' && tx.status === 'Completed')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    return BASE_WITHDRAWN + additional;
  }, [transactions]);

  const pendingPayout = useMemo(() => {
    const additional = transactions
      .filter(tx => tx.type === 'debit' && tx.status !== 'Completed')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    return BASE_PENDING + additional;
  }, [transactions]);

  const availableBalance = useMemo(() => {
    return totalEarnings - withdrawnAmount - pendingPayout;
  }, [totalEarnings, withdrawnAmount, pendingPayout]);

  const processedChartData = useMemo(() => {
    const now = new Date();
    
    if (chartTimeframe === '30days') {
      // Generate last 30 days array
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const dateKey = d.toISOString().split('T')[0]; // YYYY-MM-DD
        days.push({ key: dateKey, label: dayStr, amount: 0 });
      }
      
      // Populate amounts
      transactions.forEach(tx => {
        if (tx.type !== (chartType === 'earnings' ? 'credit' : 'debit')) return;
        const txDate = new Date(tx.date);
        if (isNaN(txDate)) return;
        const dateKey = txDate.toISOString().split('T')[0];
        const dayObj = days.find(d => d.key === dateKey);
        if (dayObj) {
          dayObj.amount += Number(tx.amount || 0);
        }
      });
      
      return days;
    } else {
      // 6months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        months.push({ key, label: monthNames[d.getMonth()], amount: 0 });
      }
      
      transactions.forEach(tx => {
        if (tx.type !== (chartType === 'earnings' ? 'credit' : 'debit')) return;
        const txDate = new Date(tx.date);
        if (isNaN(txDate)) return;
        const key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
        const monthObj = months.find(m => m.key === key);
        if (monthObj) {
          monthObj.amount += Number(tx.amount || 0);
        }
      });
      
      return months;
    }
  }, [transactions, chartTimeframe, chartType]);

  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const chartPoints = useMemo(() => {
    const maxAmount = Math.max(...processedChartData.map(d => d.amount), 1);
    const N = processedChartData.length;
    
    return processedChartData.map((d, i) => {
      const x = paddingLeft + (N > 1 ? (i / (N - 1)) * chartWidth : chartWidth / 2);
      const y = paddingTop + chartHeight - (d.amount / maxAmount) * chartHeight;
      return {
        x,
        y,
        amount: d.amount,
        label: d.label,
        key: d.key
      };
    });
  }, [processedChartData, chartWidth, chartHeight]);

  const bezierPathStr = useMemo(() => {
    if (chartPoints.length === 0) return '';
    let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [chartPoints]);

  const areaPathStr = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return `${bezierPathStr} L ${chartPoints[chartPoints.length - 1].x} ${paddingTop + chartHeight} L ${chartPoints[0].x} ${paddingTop + chartHeight} Z`;
  }, [chartPoints, bezierPathStr, chartHeight]);

  // Dynamic filtered, sorted, paginated transactions
  const filteredSortedTransactions = useMemo(() => {
    let list = [...transactions];

    // Search query
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase().trim();
      list = list.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.studentName && t.studentName.toLowerCase().includes(q)) ||
        (t.studentEmail && t.studentEmail.toLowerCase().includes(q))
      );
    }

    // Type Filter
    if (txTypeFilter !== 'all') {
      list = list.filter(t => t.type === txTypeFilter);
    }

    // Status Filter
    if (txStatusFilter !== 'all') {
      list = list.filter(t => t.status === txStatusFilter);
    }

    // Sorting
    list.sort((a, b) => {
      if (txSort === 'newest') {
        return new Date(b.date) - new Date(a.date);
      } else if (txSort === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      } else if (txSort === 'high') {
        return b.amount - a.amount;
      } else if (txSort === 'low') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return list;
  }, [transactions, txSearch, txTypeFilter, txStatusFilter, txSort]);

  // Paginated list
  const totalFilteredTx = filteredSortedTransactions.length;
  const totalTxPages = Math.max(1, Math.ceil(totalFilteredTx / txPerPage));
  const startIndex = (txPage - 1) * txPerPage;
  const paginatedTransactions = useMemo(() => {
    return filteredSortedTransactions.slice(startIndex, startIndex + txPerPage);
  }, [filteredSortedTransactions, startIndex, txPerPage]);

  // Adjust page if page exceeds total pages
  useEffect(() => {
    if (txPage > totalTxPages) {
      setTxPage(1);
    }
  }, [totalTxPages, txPage]);

  const handleRequestPayout = async (e) => {
    if (e) e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payout amount.");
      return;
    }
    if (amount > availableBalance) {
      alert("Insufficient balance! You can only request up to ₹" + availableBalance.toLocaleString());
      return;
    }

    try {
      // Save to Firestore bharatam_withdrawal_requests so SuperAdmin can see and approve it
      await addDoc(collection(db, 'bharatam_withdrawal_requests'), {
        trainerId:     user?.uid || '',
        trainerName:   user?.fullName || user?.displayName || '',
        trainerEmail:  user?.email || '',
        amount:        amount,
        bankAccount:   profileData.bankAccount || '',
        accountNumber: profileData.bankAccount || '',
        ifscCode:      profileData.ifscCode || '',
        bankName:      profileData.bankName || (profileData.bankAccount ? `A/C ****${profileData.bankAccount.slice(-4)}` : ''),
        upiId:         profileData.upiId || '',
        status:        'pending',
        createdAt:     serverTimestamp(),
      });

      // Also reflect in local state so the trainer sees it immediately
      const newTx = {
        id: Date.now(),
        type: 'debit',
        title: `Payout Request — A/C ****${profileData.bankAccount ? profileData.bankAccount.slice(-4) : '****'}`,
        date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }),
        amount,
        status: 'Pending',
      };
      setTransactions(prev => [newTx, ...prev]);
      setPayoutAmount('');
      setIsWithdrawModalOpen(false);
      alert("Withdrawal request submitted! Super Admin will review and approve it shortly.");
    } catch (err) {
      console.error('Failed to submit withdrawal request:', err);
      alert("Failed to submit request: " + err.message);
    }
  };

  const handleExportStatement = () => {
    if (transactions.length === 0) {
      alert("No transaction records available to export.");
      return;
    }
    
    // Generate CSV contents
    const headers = ['Transaction ID', 'Type', 'Description', 'Date', 'Amount (INR)', 'Status'];
    const rows = transactions.map(tx => [
      tx.id,
      tx.type === 'credit' ? 'Earnings' : 'Withdrawal',
      tx.title,
      tx.date,
      tx.amount,
      tx.status
    ]);
    
    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bhartam_revenue_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [courses, setCourses] = useState([]);
  // Pagination for My Courses table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // items per page
  const totalPages = Math.max(1, Math.ceil(courses.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [courses.length, totalPages]);

  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return courses.slice(start, start + pageSize);
  }, [courses, currentPage, pageSize]);
  const [advertisements, setAdvertisements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [isSubscriptionsLoaded, setIsSubscriptionsLoaded] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    const unsubscribeAds = onSnapshot(collection(db, "advertisements"), (snapshot) => {
      const activeAds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(ad => (ad.status || 'active') === 'active');
      setAdvertisements(activeAds);
    }, (error) => {
      console.error("Failed to fetch advertisements:", error);
      setAdvertisements(mockAds);
    });

    // Fetch categories from bharatam_categories collection
    const unsubscribeCategories = onSnapshot(collection(db, "bharatam_categories"), (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => {
        const data = doc.data();
        return data.name || doc.id;
      }).sort();
      setCategories(fetchedCategories);
    }, (error) => {
      console.error("Failed to fetch categories:", error);
      // Fallback categories if fetch fails
      setCategories(['Vedic Math', 'Science', 'History', 'English', 'Computer Science', 'Physics', 'Chemistry', 'Biology']);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'bharatam_settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.commissionRate === 'number') {
          setGlobalCommission(data.commissionRate);
        }
      }
    }, (error) => {
      console.error("Failed to fetch settings:", error);
    });

    return () => {
      unsubscribeAds();
      unsubscribeCategories();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const q = query(collection(db, "bharatam_courses"), where("trainerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const fetchedCourses = await Promise.all(querySnapshot.docs.map(async (courseDoc) => {
          const courseData = { id: courseDoc.id, ...courseDoc.data() };
          
          // Map new field names to legacy field names for backward compatibility
          const mappedCourseData = {
            ...courseData,
            // Map courseName to title
            title: courseData.courseName || courseData.title || '',
            // Map thumbnailUrl to thumbnail
            thumbnail: courseData.thumbnailUrl || courseData.thumbnail || '',
            // Keep both old and new field names
            courseName: courseData.courseName || courseData.title || '',
            thumbnailUrl: courseData.thumbnailUrl || courseData.thumbnail || '',
            // Map oneTimePrice to price
            price: courseData.oneTimePrice || courseData.price || '0',
            oneTimePrice: courseData.oneTimePrice || courseData.price || 0,
            // Keep category and subject the same
            subject: courseData.category || courseData.subject || '',
            category: courseData.category || courseData.subject || '',
            // Map status
            status: courseData.approvalStatus === 'approved' ? 'Approved' : (courseData.approvalStatus === 'pending' ? 'Pending Review' : (courseData.approvalStatus === 'rejected' ? 'Rejected' : 'Draft'))
          };
          
          // Fetch videos subcollection
          let subVideos = [];
          try {
            const videosSnap = await getDocs(collection(db, "bharatam_courses", courseDoc.id, "videos"));
            subVideos = videosSnap.docs.map(d => {
              const data = d.data();
              return {
                id: d.id,
                title: data.fileName || data.title || '',
                url: data.bunnyVideoId || data.url || '',
                contentType: data.contentType || 'video',
                accessType: data.isFree ? 'free' : (data.accessType || 'paid'),
                status: data.approvalStatus === 'approved' ? 'Approved' : (data.status === 'active' ? 'Approved' : (data.status || 'Pending')),
                addedAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : '',
                ...data
              };
            });
          } catch (e) {
            console.warn("Failed to fetch subcollection videos:", e);
          }

          // Fetch pdfs subcollection
          let subPdfs = [];
          try {
            const pdfsSnap = await getDocs(collection(db, "bharatam_courses", courseDoc.id, "pdfs"));
            const processPdfDoc = d => {
              const data = d.data();
              return {
                id: d.id,
                title: data.fileName || data.title || '',
                url: data.storageUrl || data.bunnyVideoId || data.url || '',
                contentType: data.contentType || 'pdf',
                accessType: data.isFree ? 'free' : (data.accessType || 'paid'),
                status: data.approvalStatus === 'approved' ? 'Approved' : (data.status === 'active' ? 'Approved' : (data.status || 'Pending')),
                addedAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : '',
                ...data
              };
            };
            subPdfs = pdfsSnap.docs.map(processPdfDoc);
          } catch (e) {
            console.warn("Failed to fetch subcollection pdfs:", e);
          }

          return {
            ...mappedCourseData,
            videos: subVideos.length > 0 ? subVideos : (mappedCourseData.videos || []),
            pdfs: subPdfs.length > 0 ? subPdfs : (mappedCourseData.pdfs || [])
          };
        }));
        
        setCourses(fetchedCourses);
      } catch (err) {
        console.error(err);
        setCourses(mockCourses);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();

    // Load current user's subscriptions + saved profile fields
    const loadSubscriptions = async () => {
      try {
        const userRef = doc(db, 'bharatam_users', user.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : null;
        // Hydrate subscriptions
        const subs = {};
        if (data && Array.isArray(data.subscriptions)) {
          data.subscriptions.forEach(s => { subs[s.id] = true; });
        }
        setSubscriptions(subs);
        // Hydrate saved payout fields so they show in the form
        if (data) {
          setProfileData(prev => ({
            ...prev,
            bankAccount: data.bankAccount || prev.bankAccount || '',
            ifscCode:    data.ifscCode    || prev.ifscCode    || '',
            bankName:    data.bankName    || prev.bankName    || '',
            upiId:       data.upiId       || prev.upiId       || '',
          }));
        }
      } catch (err) {
        console.error('Failed to load subscriptions', err);
      } finally {
        setIsSubscriptionsLoaded(true);
      }
    };
    loadSubscriptions();
  }, [user]);

  // Set initial preferred payout channel based on loaded data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (profileData.upiId && !profileData.bankAccount) {
        setPreferredPayoutChannel('upi');
      } else {
        setPreferredPayoutChannel('bank');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [profileData.upiId, profileData.bankAccount]);

  // Load real transactions from Firestore if available
  useEffect(() => {
    if (!user?.uid) return;
    const fetchTransactions = async () => {
      try {
        const collectionsToTry = ['payments', 'orders', 'enrollments'];
        let fetched = [];

        for (const colName of collectionsToTry) {
          const q = query(collection(db, colName), where('trainerId', '==', user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const mapped = snap.docs.map(d => {
              const data = d.data();
              return {
                id: d.id,
                type: data.type === 'payout' || data.type === 'debit' ? 'debit' : 'credit',
                title: data.title || data.description || `Course Enrollment - ${data.courseTitle || ''}`,
                date: data.date || (data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString() : (data.createdAt || '')),
                amount: data.amount || 0,
                status: data.status || 'Completed'
              };
            });
            fetched = fetched.concat(mapped);
          }
        }

        // Also fetch payouts if a 'payouts' collection exists
        const payoutQ = query(collection(db, 'payouts'), where('trainerId', '==', user.uid));
        const payoutSnap = await getDocs(payoutQ);
        if (!payoutSnap.empty) {
          const mappedPayouts = payoutSnap.docs.map(d => {
            const data = d.data();
            return {
              id: `payout-${d.id}`,
              type: 'debit',
              title: data.title || 'Payout Transferred to Bank',
              date: data.date || (data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString() : (data.createdAt || '')),
              amount: data.amount || 0,
              status: data.status || 'Completed'
            };
          });
          fetched = fetched.concat(mappedPayouts);
        }

        if (fetched.length > 0) {
          // sort by date if possible (best-effort), else keep as-is
          fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
          setTransactions(fetched);
        } else {
          setTransactions(sampleTransactions);
        }
      } catch (err) {
        console.error('Failed to load transactions from Firestore', err);
        setTransactions(sampleTransactions);
      }
    };
    fetchTransactions();

    // Real-time listener: trainer's own withdrawal requests → reflect approved/rejected status
    const withdrawQ = query(
      collection(db, 'bharatam_withdrawal_requests'),
      where('trainerId', '==', user.uid)
    );
    const unsubWithdraw = onSnapshot(withdrawQ, (snap) => {
      const firestoreRequests = snap.docs.map(d => {
        const data = d.data();
        const dateVal = data.createdAt;
        const dateStr = dateVal
          ? (dateVal.seconds ? new Date(dateVal.seconds * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }) : new Date(dateVal).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' }))
          : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
        const status = data.status === 'approved' ? 'Completed' : data.status === 'rejected' ? 'Rejected' : 'Pending';
        return {
          id: `wr-${d.id}`,
          type: 'debit',
          title: `Withdrawal Request${data.bankAccount ? ` — A/C ****${String(data.bankAccount).slice(-4)}` : ''}`,
          date: dateStr,
          amount: Number(data.amount || 0),
          status,
          _fromFirestore: true,
        };
      });
      // Merge: keep local-only debit entries and replace with Firestore ones
      setTransactions(prev => {
        const localOnly = prev.filter(t => t.type === 'credit' || !t._fromFirestore);
        return [...firestoreRequests, ...localOnly.filter(t => t.type !== 'debit' || !t.id?.startsWith('wr-'))];
      });
    }, () => {/* ignore errors */});

    return () => unsubWithdraw();
  }, [user]);

  // Compute dynamic dashboard stats: earnings from purchases, students from unique purchasers
  useEffect(() => {
    if (!user?.uid) return;
    const computeStats = async () => {
      try {
        // Calculate earnings and students from purchases collection
        let totalEarnings = 0;
        let uniqueStudents = new Set();
        let hasPurchaseData = false;

        // METHOD 1: Fetch purchases where this trainer's courses were bought (PRIMARY)
        try {
          const purchasesQ = query(
            collection(db, 'purchases'), 
            where('trainerId', '==', user.uid)
          );
          const purchasesSnap = await getDocs(purchasesQ);
          
          if (!purchasesSnap.empty) {
            hasPurchaseData = true;
            purchasesSnap.docs.forEach(doc => {
              const data = doc.data();
              const amount = Number(data.amount || data.price || data.totalAmount || 0);
              
              // Calculate dynamic trainer share based on course or global commission
              const matchedCourse = courses.find(c => c.id === data.courseId);
              const commission = typeof data.commission === 'number'
                ? data.commission
                : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
              const trainerShare = (100 - commission) / 100;
              const trainerAmount = amount * trainerShare;
              
              totalEarnings += trainerAmount;
              
              // Track unique students who purchased
              if (data.userId) {
                uniqueStudents.add(data.userId);
              }
            });
          }
        } catch (e) {
          console.warn('Purchases collection not found or error:', e);
        }

        // METHOD 2: Fallback - Try enrollments collection to count students
        if (!hasPurchaseData || uniqueStudents.size === 0) {
          try {
            // Fetch all enrollments for this trainer's courses
            const coursesQ = query(collection(db, 'bharatam_courses'), where('trainerId', '==', user.uid));
            const coursesSnap = await getDocs(coursesQ);
            const trainerCourseIds = coursesSnap.docs.map(doc => doc.id);

            if (trainerCourseIds.length > 0) {
              // Fetch enrollments for trainer's courses
              const enrollmentsQ = collection(db, 'enrollments');
              const enrollmentsSnap = await getDocs(enrollmentsQ);
              
              enrollmentsSnap.docs.forEach(doc => {
                const data = doc.data();
                // Check if enrollment is for one of this trainer's courses
                if (trainerCourseIds.includes(data.courseId) && data.userId) {
                  uniqueStudents.add(data.userId);
                  
                  // If we didn't get earnings from purchases, calculate from enrollments
                  if (!hasPurchaseData && data.amount) {
                    const amount = Number(data.amount || data.price || 0);
                    if (data.type !== 'payout' && data.type !== 'debit') {
                      const matchedCourse = courses.find(c => c.id === data.courseId);
                      const commission = typeof data.commission === 'number'
                        ? data.commission
                        : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
                      const trainerShare = (100 - commission) / 100;
                      totalEarnings += (amount * trainerShare);
                    }
                  }
                }
              });
            }
          } catch (e) {
            console.warn('Failed to fetch enrollments:', e);
          }
        }

        // METHOD 3: Try payments, orders collections as additional fallback
        if (!hasPurchaseData) {
          const collectionsToTry = ['payments', 'orders'];
          
          for (const colName of collectionsToTry) {
            try {
              const q = query(collection(db, colName), where('trainerId', '==', user.uid));
              const snap = await getDocs(q);
              
              if (!snap.empty) {
                hasPurchaseData = true;
                snap.docs.forEach(doc => {
                  const data = doc.data();
                  const amount = Number(data.amount || data.price || 0);
                  
                  // Only count credits (revenue) for total earnings display
                  if (data.type !== 'payout' && data.type !== 'debit') {
                    const matchedCourse = courses.find(c => c.id === data.courseId);
                    const commission = typeof data.commission === 'number'
                      ? data.commission
                      : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
                    const trainerShare = (100 - commission) / 100;
                    totalEarnings += (amount * trainerShare);
                    
                    // Track unique students
                    if (data.userId) {
                      uniqueStudents.add(data.userId);
                    }
                  }
                });
                break;
              }
            } catch (e) {
              console.warn(`Failed to fetch from ${colName}:`, e);
            }
          }
        }

        // METHOD 4: Last resort - use transactions-based calculation
        if (!hasPurchaseData && transactions.length > 0) {
          const credits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0);
          const trainerShare = (100 - globalCommission) / 100;
          totalEarnings = credits * trainerShare;
        }

        // Final student count (unique purchasers/enrollees)
        const studentsCount = uniqueStudents.size;

        // Ensure earnings is never negative (show 0 instead)
        const finalEarnings = Math.max(0, Math.round(totalEarnings));

        setDashboardStats({
          earnings: finalEarnings,
          students: studentsCount
        });
      } catch (err) {
        console.error('Failed to compute dashboard stats:', err);
        // Keep previous values on error
      }
    };
    computeStats();
  }, [transactions, user, courses]);

  const subscribeToTrainer = async (trainerId, trainerName) => {
    if (!user?.uid) {
      alert('Please sign in to subscribe');
      return;
    }
    if (trainerId === user.uid) {
      alert("You can't subscribe to yourself");
      return;
    }
    try {
      const trainerRef = doc(db, 'bharatam_users', trainerId);
      const userRef = doc(db, 'bharatam_users', user.uid);
      await updateDoc(trainerRef, { subscribers: arrayUnion({ id: user.uid, name: user.fullName || user.name || '' }) });
      await updateDoc(userRef, { subscriptions: arrayUnion({ id: trainerId, name: trainerName }) });
      setSubscriptions(prev => ({ ...prev, [trainerId]: true }));
    } catch (err) {
      console.error(err);
      alert('Failed to subscribe');
    }
  };

  const unsubscribeFromTrainer = async (trainerId, trainerName) => {
    if (!user?.uid) return;
    try {
      const trainerRef = doc(db, 'bharatam_users', trainerId);
      const userRef = doc(db, 'bharatam_users', user.uid);
      await updateDoc(trainerRef, { subscribers: arrayRemove({ id: user.uid, name: user.fullName || user.name || '' }) });
      await updateDoc(userRef, { subscriptions: arrayRemove({ id: trainerId, name: trainerName }) });
      setSubscriptions(prev => { const copy = { ...prev }; delete copy[trainerId]; return copy; });
    } catch (err) {
      console.error(err);
      alert('Failed to unsubscribe');
    }
  };

  // Media Panel State
  const [mediaPanel, setMediaPanel] = useState({ open: false, courseId: null, type: null }); // type: 'videos' | 'pdfs'

  // Media Panel Form States
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedMediaFiles, setSelectedMediaFiles] = useState([]);
  const [mediaContentType, setMediaContentType] = useState('video');
  const [mediaAccessType, setMediaAccessType] = useState('paid');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [uploadContentFilter, setUploadContentFilter] = useState('all');

  const openMediaPanel = (courseId, type) => {
    setMediaPanel({ open: true, courseId, type });
    setMediaContentType(type === 'videos' ? 'video' : 'pdf');
    setMediaTitle('');
    setMediaUrl('');
    setSelectedMediaFiles([]);
    setMediaAccessType('paid');
  };

  const closeMediaPanel = () => {
    setMediaPanel({ open: false, courseId: null, type: null });
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isAssessmentSectionOpen, setIsAssessmentSectionOpen] = useState(true);
  const [newCourseForm, setNewCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    lifetimePrice: '',
    limitedTimePrice: '',
    thumbnail: '',
    thumbnailFile: null,
    assessment: {
      passingPercentage: 70,
      timeLimit: 0,
      questions: [
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOption: 'A'
        }
      ]
    }
  });

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

  const handleThumbnailError = (courseId) => {
    console.warn(`Thumbnail failed to load for course: ${courseId}`);
    setFailedThumbnails(prev => new Set([...prev, courseId]));
  };

  const handleAssessmentChange = (updater) => {
    setNewCourseForm(prev => ({
      ...prev,
      assessment: updater(prev.assessment)
    }));
  };

  const handleAddQuestion = () => {
    handleAssessmentChange(current => ({
      ...current,
      questions: [
        ...current.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOption: 'A'
        }
      ]
    }));
  };

  const handleRemoveQuestion = (index) => {
    handleAssessmentChange(current => ({
      ...current,
      questions: current.questions.filter((_, idx) => idx !== index)
    }));
  };

  const handleQuestionTextChange = (index, value) => {
    handleAssessmentChange(current => ({
      ...current,
      questions: current.questions.map((q, idx) => 
        idx === index ? { ...q, questionText: value } : q
      )
    }));
  };

  const handleOptionTextChange = (questionIndex, optionIndex, value) => {
    handleAssessmentChange(current => ({
      ...current,
      questions: current.questions.map((q, idx) => {
        if (idx !== questionIndex) return q;
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      })
    }));
  };

  const handleCorrectOptionChange = (questionIndex, optionLetter) => {
    handleAssessmentChange(current => ({
      ...current,
      questions: current.questions.map((q, idx) => 
        idx === questionIndex ? { ...q, correctOption: optionLetter } : q
      )
    }));
  };

  const handleCreateCourse = async (status) => {
    if (!newCourseForm.title || !newCourseForm.category) {
      alert('Please fill in Course Title and Category');
      return;
    }
    try {
      setIsSaving(true);
      let thumbnailUrl = '';

      if (newCourseForm.thumbnailFile) {
        // Upload thumbnail — this MUST succeed before creating the course
        try {
          const { cdnUrl } = await uploadToBunny(newCourseForm.thumbnailFile, 'bharatm_library/thumbnails');
          if (!cdnUrl) throw new Error('CDN URL not returned from storage');
          thumbnailUrl = cdnUrl;
        } catch (uploadErr) {
          console.error('Thumbnail upload failed:', uploadErr);
          alert(
            'Thumbnail upload failed. Please make sure the backend server is running on port 4000.\n\n' +
            'Error: ' + (uploadErr.message || uploadErr) +
            '\n\nRun: cd server && node index.js'
          );
          setIsSaving(false);
          return; // ✋ Stop — do NOT create course without thumbnail
        }
      } else if (newCourseForm.thumbnail) {
        // Use base64 preview as-is (data URL) when no Bunny upload needed
        thumbnailUrl = newCourseForm.thumbnail;
      }

      const oneTimePriceVal = Number(newCourseForm.price || 0);
      const lifetimePriceVal = Number(newCourseForm.lifetimePrice || newCourseForm.price || 0);
      const limitedTimePriceVal = Number(newCourseForm.limitedTimePrice || newCourseForm.price || 0);
      const trainerId = user?.uid || user?.phoneNumber || 'unknown';

      // ONLY include the specified fields in bharatam_courses
      const newCourseData = {
        // Basic Info
        courseName: newCourseForm.title,
        category: newCourseForm.category,
        description: newCourseForm.description || '',
        
        // Pricing
        oneTimePrice: oneTimePriceVal,
        lifetimePrice: lifetimePriceVal,
        limitedTimePrice: limitedTimePriceVal,
        limitedTimeDays: 30, // Default 30 days for limited time offer
        
        // Thumbnail
        thumbnailUrl: thumbnailUrl,
        
        // Assessment
        assessment: newCourseForm.assessment || {
          passingPercentage: 70,
          timeLimit: 0,
          questions: []
        },
        
        // Trainer Info
        trainerId: trainerId,
        trainerName: user?.fullName || 'Trainer',
        
        // Approval Status
        approvalStatus: status === 'Approved' ? 'approved' : (status === 'Pending Review' ? 'pending' : 'draft'),
        isApproved: status === 'Approved',
        approvedAt: status === 'Approved' ? serverTimestamp() : null,
        
        // Content Status
        contentApprovalStatus: 'pending',
        hasPendingContent: true,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "bharatam_courses"), newCourseData);
      // For local state, map to legacy field names for compatibility
      const localCourseData = {
        id: docRef.id,
        ...newCourseData,
        // Legacy field mappings
        title: newCourseData.courseName,
        thumbnail: newCourseData.thumbnailUrl,
        price: newCourseData.oneTimePrice,
        subject: newCourseData.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCourses([localCourseData, ...courses]);
      setIsCreateCourseModalOpen(false);
      setNewCourseForm({ 
        title: '', 
        description: '', 
        category: '', 
        price: '', 
        lifetimePrice: '',
        limitedTimePrice: '',
        thumbnail: '', 
        thumbnailFile: null,
        assessment: {
          passingPercentage: 70,
          timeLimit: 0,
          questions: [
            {
              questionText: '',
              options: ['', '', '', ''],
              correctOption: 'A'
            }
          ]
        }
      });
      alert("Course created successfully! Now you can upload videos and PDFs from the course list.");
    } catch(err) {
      console.error(err);
      alert("Failed to create course: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitCourseForReview = async (courseId) => {
    if (!confirm('Submit this course and all its media for Superadmin approval?')) return;
    try {
      const targetCourse = courses.find(c => c.id === courseId);
      if (!targetCourse) return;

      // Mark all media items as Pending
      const markPending = (arr) => (arr || []).map(item => ({ ...item, status: item.status === 'Approved' ? 'Approved' : 'Pending' }));

      const pendingVideos = markPending(targetCourse.videos);
      const pendingPdfs = markPending(targetCourse.pdfs);
      const pendingImages = markPending(targetCourse.images);

      const courseRef = doc(db, "bharatam_courses", courseId);
      await updateDoc(courseRef, {
        approvalStatus: 'pending',
        isApproved: false,
        updatedAt: serverTimestamp()
      });

      // Also update subcollections best-effort
      for (const video of pendingVideos) {
        if (video.id) {
          try {
            const videoRef = doc(db, "bharatam_courses", courseId, "videos", video.id);
            await updateDoc(videoRef, {
              approvalStatus: video.status === 'Approved' ? 'approved' : 'pending',
              status: video.status === 'Approved' ? 'active' : 'pending'
            });
          } catch (e) {
            console.warn("Failed to update video subcol doc:", e);
          }
        }
      }

      for (const pdf of pendingPdfs) {
        if (pdf.id) {
          try {
            const pdfRef = doc(db, "bharatam_courses", courseId, "pdfs", pdf.id);
            await updateDoc(pdfRef, {
              approvalStatus: pdf.status === 'Approved' ? 'approved' : 'pending',
              status: pdf.status === 'Approved' ? 'active' : 'pending'
            });
          } catch (e) {
            console.warn("Failed to update pdf subcol doc:", e);
          }
        }
      }

      // Update local state
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'Pending Review', approvalStatus: 'pending', videos: pendingVideos, pdfs: pendingPdfs, images: pendingImages } : c));
      alert('Course submitted for review. Superadmin will be notified.');
    } catch (err) {
      console.error(err);
      alert('Failed to submit course for review');
    }
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setProfilePhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      let photoUrl = profileData.photoUrl;

      // Upload profile photo if selected
      if (profilePhotoFile) {
        setIsUploadingPhoto(true);
        try {
          const { cdnUrl } = await uploadToBunny(profilePhotoFile, 'bharatm_library/profile_photos');
          if (!cdnUrl) throw new Error('CDN URL not returned from storage');
          photoUrl = cdnUrl;
          console.log('Profile photo uploaded:', cdnUrl);
        } catch (uploadErr) {
          console.error('Profile photo upload failed:', uploadErr);
          alert(
            'Profile photo upload failed. Please make sure the backend server is running on port 4000.\n\n' +
            'Error: ' + (uploadErr.message || uploadErr) +
            '\n\nRun: cd server && node index.js'
          );
          setIsSaving(false);
          setIsUploadingPhoto(false);
          return;
        }
        setIsUploadingPhoto(false);
      }

      // Update user profile in Firebase
      if (user?.uid) {
        const userRef = doc(db, 'bharatam_users', user.uid);
        await updateDoc(userRef, {
          fullName: profileData.fullName,
          phoneNumber: profileData.phone,
          email: profileData.email,
          bankAccount: profileData.bankAccount,
          ifscCode: profileData.ifscCode,
          bankName: profileData.bankName,
          upiId: profileData.upiId,
          photoUrl: photoUrl,
          updatedAt: serverTimestamp()
        });

        // Update local state
        setProfileData(prev => ({ ...prev, photoUrl }));
        setProfilePhotoPreview(photoUrl);
        setProfilePhotoFile(null);

        alert('Trainer profile updated successfully!');
      } else {
        alert('User ID not found. Please try logging in again.');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to update profile: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (activeTab === 'insights') {
      const now = new Date();

      // ── Weekly date labels (last 5 weeks) ─────────────────────────────────
      const weekLabels = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (4 - i) * 7);
        return d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
      });

      // ── Build earnings per week from real transactions ─────────────────────
      const earningsRaw = [0, 0, 0, 0, 0];
      transactions.forEach(tx => {
        if (tx.type !== 'credit') return;
        const d = new Date(tx.date);
        if (isNaN(d)) return;
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        const amt = Number(tx.amount || 0);
        if (diff < 7) earningsRaw[4] += amt;
        else if (diff < 14) earningsRaw[3] += amt;
        else if (diff < 21) earningsRaw[2] += amt;
        else if (diff < 28) earningsRaw[1] += amt;
        else if (diff < 35) earningsRaw[0] += amt;
      });
      const hasEarningsData = earningsRaw.some(v => v > 0);
      const earningsPts = hasEarningsData ? earningsRaw : [500, 1200, 1800, 3200, 7203];
      const earningsMax = Math.max(...earningsPts, 1);
      const yMax = Math.ceil(earningsMax / 1000) * 1000 || 1000;
      const earningsYLabels = Array.from({ length: 5 }, (_, i) => {
        const v = Math.round((i / 4) * yMax);
        return v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`;
      });

      // ── Build student count per week ───────────────────────────────────────
      // Use unique enrolled students per week from transactions (credit entries = enrollment)
      const studentRaw = [0, 0, 0, 0, 0];
      const seenStudents = new Set();
      transactions.forEach(tx => {
        if (tx.type !== 'credit') return;
        const d = new Date(tx.date);
        if (isNaN(d)) return;
        const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        const key = tx.studentId || tx.userId || (tx.id + '_' + diff);
        if (!seenStudents.has(key)) {
          seenStudents.add(key);
          if (diff < 7) studentRaw[4]++;
          else if (diff < 14) studentRaw[3]++;
          else if (diff < 21) studentRaw[2]++;
          else if (diff < 28) studentRaw[1]++;
          else if (diff < 35) studentRaw[0]++;
        }
      });
      const hasStudentData = studentRaw.some(v => v > 0);
      const studentVals = hasStudentData ? studentRaw : [1, 2, 3, 5, dashboardStats.students || 3];
      const studentMax = Math.max(...studentVals, 1);
      const studentYTicks = [0, Math.round(studentMax * 0.33), Math.round(studentMax * 0.66), studentMax];

      // ── Sparkline helper ───────────────────────────────────────────────────
      const Spark = ({ data, active }) => {
        const max = Math.max(...data, 1);
        const W = 80, H = 36;
        const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - (v / max) * H }));
        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
        const area = `${line} L${W},${H} L0,${H} Z`;
        const color = active ? '#ea580c' : '#f97316';
        const gid = `sp-${active ? 'a' : 'i'}-${Math.random().toString(36).slice(2,6)}`;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-9" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={active ? 0.4 : 0.25} />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      };

      const approvedCourses = courses.filter(c => c.status === 'Approved').length;

      const statCards = [
        { id: 'earnings', label: 'Total Earnings', value: `₹${dashboardStats.earnings.toLocaleString()}`, sub: 'All Time Earnings',    icon: '💰', spark: earningsPts },
        { id: 'students', label: 'Total Students', value: dashboardStats.students,                         sub: 'Enrolled Students',    icon: '👥', spark: studentVals },
        { id: 'courses',  label: 'Total Courses',  value: courses.length,                                  sub: `${approvedCourses} Active`, icon: '📚', spark: Array.from({ length: 5 }, (_, i) => i < courses.length ? courses.length - i : 0).reverse() },
      ];

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl mx-auto pb-24 md:pb-0 space-y-6"
        >
          {/* ── Header ── */}
          <div className="mt-4 md:mt-0">
            <h2 className="text-2xl font-black text-gray-900">
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {user?.fullName?.split(' ')[0] || 'Trainer'}! 👋
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Here's what's happening with your courses today.</p>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((c) => {
              const isActive = activeOverviewCard === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveOverviewCard(prev => prev === c.id ? null : c.id)}
                  className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between cursor-pointer transition-all select-none
                    ${isActive
                      ? 'border-orange-400 shadow-orange-100 shadow-md ring-2 ring-orange-100'
                      : 'border-gray-100 hover:shadow-md hover:border-orange-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border transition-colors
                      ${isActive ? 'bg-orange-100 border-orange-200' : 'bg-orange-50 border-orange-100'}`}>
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400">{c.label}</p>
                      <p className={`text-2xl font-black leading-tight transition-colors ${isActive ? 'text-orange-600' : 'text-gray-900'}`}>{c.value}</p>
                      <p className="text-[11px] text-gray-400">{c.sub}</p>
                    </div>
                  </div>
                  <Spark data={c.spark} active={isActive} />
                </div>
              );
            })}
          </div>

          {/* ── Recent Courses ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-gray-900">Recent Courses</h3>
              <button onClick={() => setActiveTab('courses')} className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courses.slice(0, 4).map(course => {
                const isApproved = course.status === 'Approved';
                const isPending = course.status === 'Pending Review' || course.status === 'Pending';
                const videoCount = (course.videos || []).length;
                const studentCount = course.enrollmentCount || course.studentsEnrolled || 0;
                const createdDate = course.createdAt
                  ? (() => { try { const d = course.createdAt.seconds ? new Date(course.createdAt.seconds * 1000) : new Date(course.createdAt); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return ''; } })()
                  : '';
                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                      {course.thumbnail
                        ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                        : '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{course.title}</p>
                      <p className="text-xs text-gray-400 truncate">{course.subject || course.category || 'General'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {studentCount}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Video className="w-2.5 h-2.5" /> {videoCount}</span>
                        {createdDate && <span className="text-[10px] text-gray-400">{createdDate}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 border
                      ${isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : isPending ? 'bg-orange-50 text-orange-500 border-orange-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {isApproved ? 'Approved' : isPending ? 'Pending' : course.status || 'Draft'}
                    </span>
                  </div>
                );
              })}
              {courses.length === 0 && (
                <div className="col-span-2 bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400 font-bold text-sm">
                  No courses yet.{' '}
                  <button onClick={() => setActiveTab('courses')} className="text-orange-500 underline">Create one</button>
                </div>
              )}
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Earnings Overview — Line Chart */}
            {(() => {
              const isActive = activeOverviewCard === 'earnings';
              const W = 300, H = 120, pL = 36, pB = 22, pT = 12;
              const cH = H - pB - pT, cW = W - pL - 8;
              const points = earningsPts.map((v, i) => ({
                x: pL + (i / (earningsPts.length - 1)) * cW,
                y: pT + cH - (v / earningsMax) * cH,
              }));
              const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              const area = `${line} L${points[points.length - 1].x.toFixed(1)},${(pT + cH).toFixed(1)} L${points[0].x.toFixed(1)},${(pT + cH).toFixed(1)} Z`;
              const totalRevenue = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
              return (
                <motion.div
                  animate={{ borderColor: isActive ? '#f97316' : '#f3f4f6', boxShadow: isActive ? '0 4px 24px 0 #fed7aa80' : '0 1px 3px 0 #0001' }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl border p-5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Earnings Overview</h4>
                      {isActive && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-orange-500 font-semibold mt-0.5">
                          Total: ₹{totalRevenue.toLocaleString()} {!hasEarningsData && '(sample)'}
                        </motion.p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                      <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">This Month ▾</span>
                    </div>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3" style={{ height: '140px' }} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trainerEG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={isActive ? 0.35 : 0.2} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {earningsYLabels.map((l, i) => {
                      const y = pT + cH - (i / (earningsYLabels.length - 1)) * cH;
                      return (
                        <g key={i}>
                          <line x1={pL} y1={y} x2={W - 8} y2={y} stroke={isActive ? '#fed7aa' : '#f3f4f6'} strokeWidth="1" />
                          <text x={pL - 4} y={y + 3} fontSize="7" fill="#9ca3af" textAnchor="end">{l}</text>
                        </g>
                      );
                    })}
                    <path d={area} fill="url(#trainerEG)" />
                    <path d={line} fill="none" stroke="#f97316" strokeWidth={isActive ? 3 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={isActive ? 4.5 : 3.5} fill="white" stroke="#f97316" strokeWidth={isActive ? 2.5 : 2} />
                    ))}
                  </svg>
                  <div className="flex justify-between mt-1">
                    {weekLabels.map((l, i) => <span key={i} className="text-[10px] font-medium text-gray-400">{l}</span>)}
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
                      <span className="w-3 h-0.5 bg-orange-500 rounded-full" />
                      <span className="text-[10px] text-gray-400 font-medium">Earnings (₹)</span>
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* Student Growth — Bar Chart */}
            {(() => {
              const isActive = activeOverviewCard === 'students';
              return (
                <motion.div
                  animate={{ borderColor: isActive ? '#f97316' : '#f3f4f6', boxShadow: isActive ? '0 4px 24px 0 #fed7aa80' : '0 1px 3px 0 #0001' }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl border p-5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Student Growth</h4>
                      {isActive && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-orange-500 font-semibold mt-0.5">
                          Total: {dashboardStats.students} students {!hasStudentData && '(sample)'}
                        </motion.p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
                      <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">This Month ▾</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3" style={{ height: '140px' }}>
                    <div className="flex flex-col justify-between pb-6 shrink-0">
                      {[...studentYTicks].reverse().map((t, i) => (
                        <span key={i} className="text-[9px] font-medium text-gray-300 text-right w-5">{t}</span>
                      ))}
                    </div>
                    <div className="flex-1 flex items-end gap-2 pb-6">
                      {studentVals.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                          <motion.div
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                            style={{ height: `${Math.max((v / studentMax) * 100, 4)}%`, transformOrigin: 'bottom' }}
                            className={`w-full rounded-t-lg transition-colors ${
                              isActive
                                ? (i === studentVals.length - 1 ? 'bg-orange-600' : 'bg-orange-400')
                                : (i === studentVals.length - 1 ? 'bg-orange-500' : 'bg-orange-300')
                            }`}
                          />
                          <span className="text-[9px] font-medium text-gray-400 leading-none whitespace-nowrap">{weekLabels[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1.5 pt-3 border-t border-gray-50">
                      <span className="w-3 h-3 rounded-sm bg-orange-500 shrink-0" />
                      <span className="text-[10px] text-gray-400 font-medium">New Students</span>
                    </div>
                  )}
                </motion.div>
              );
            })()}

          </div>
        </motion.div>
      );
    }

    if (activeTab === 'courses') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl mx-auto pb-24 md:pb-0"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-4 md:mt-0 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Courses</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your courses and content uploads</p>
            </div>
            <motion.button 
              onClick={() => setIsCreateCourseModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all self-start md:self-auto"
            >
              <Plus className="w-5 h-5" />
              New Course
            </motion.button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total', value: courses.length, icon: BookOpen, gradient: 'from-indigo-500 to-blue-500', bg: 'from-indigo-100 to-blue-100' },
              { label: 'Approved', value: courses.filter(c => c.status === 'Approved').length, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500', bg: 'from-emerald-100 to-teal-100' },
              { label: 'Pending', value: courses.filter(c => c.status !== 'Approved').length, icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'from-amber-100 to-orange-100' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-white/50 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Table */}
          {isLoadingCourses ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-bold text-base">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 shadow-md">
                <BookOpen className="w-10 h-10 text-indigo-500" />
              </div>
              <h5 className="font-extrabold text-gray-800 text-xl mb-2">No Courses Yet</h5>
              <p className="text-base text-gray-500 max-w-sm mb-8">Create your first course to get started.</p>
              <motion.button 
                onClick={() => setIsCreateCourseModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all text-lg"
              >
                + Create Course
              </motion.button>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                      <th className="text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider px-6 py-5">Course</th>
                      <th className="text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider px-5 py-5">Category</th>
                      <th className="text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider px-5 py-5">Price</th>
                      <th className="text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider px-5 py-5">Content</th>
                      <th className="text-left text-[11px] font-bold text-gray-600 uppercase tracking-wider px-5 py-5">Status</th>
                      <th className="text-right text-[11px] font-bold text-gray-600 uppercase tracking-wider px-6 py-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedCourses.map((course, idx) => {
                      const videoCount = (course.videos || []).length;
                      const pdfCount = (course.pdfs || []).length;
                      const statusColor = course.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : course.status === 'Draft'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-100 text-amber-700';

                      return (
                        <motion.tr 
                          key={course.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-gradient-to-r from-indigo-50 to-purple-50 transition-all"
                        >
                          {/* Course name + thumbnail */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-200 shadow-sm">
                                {course.thumbnail && !failedThumbnails.has(course.id) ? (
                                  <img 
                                    src={course.thumbnail} 
                                    alt={course.title}
                                    onError={() => handleThumbnailError(course.id)}
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-indigo-50 to-purple-50">
                                    {getCategoryEmoji(course.subject || course.category)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{course.title}</p>
                                <p className="text-[11px] text-gray-500 font-medium truncate max-w-[200px]">{course.description || 'No description'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                              {course.subject || course.category || '—'}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-4">
                            <span className={`text-sm font-bold ${!course.price || course.price === '0' ? 'text-emerald-500' : 'text-gray-800'}`}>
                              {!course.price || course.price === '0' ? 'Free' : `₹${course.price}`}
                            </span>
                            {!course.price || course.price === '0' ? null : (
                              <span className="text-[10px] text-gray-400 font-semibold block mt-0.5" title="Platform commission fee deducted from sales">
                                Platform Fee: {course.commission !== undefined && course.commission !== null ? `${course.commission}%` : `${globalCommission}% (Global)`}
                              </span>
                            )}
                          </td>

                          {/* Content counts */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                <Video className="w-3 h-3" /> {videoCount}
                              </span>
                              <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                                <FileText className="w-3 h-3" /> {pdfCount}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${statusColor}`}>
                              {course.status || 'Draft'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openMediaPanel(course.id, 'videos')}
                                title="Add Videos"
                                className="p-2 rounded-xl hover:bg-purple-50 text-gray-400 hover:text-purple-500 transition-colors"
                              >
                                <Video className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openMediaPanel(course.id, 'pdfs')}
                                title="Add PDF"
                                className="p-2 rounded-xl hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              {course.status !== 'Pending Review' && course.status !== 'Approved' && (
                                <button
                                  onClick={() => handleSubmitCourseForReview(course.id)}
                                  title="Submit for Review"
                                  className="p-2 rounded-xl hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors"
                                >
                                  <Upload className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (confirm('Delete "' + course.title + '"?')) {
                                    try {
                                      await deleteDoc(doc(db, "bharatam_courses", course.id));
                                      setCourses(courses.filter(c => c.id !== course.id));
                                    } catch(err) {
                                      console.error("Failed to delete course", err);
                                      alert("Failed to delete");
                                    }
                                  }
                                }}
                                title="Delete"
                                className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="px-6 py-4 bg-white/80 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(courses.length === 0) ? 0 : ((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, courses.length)} of {courses.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-lg text-sm font-bold ${currentPage === 1 ? 'text-gray-300 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-100'}`}
                  >
                    Prev
                  </button>

                  {/* Page numbers (limited to a few) */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      // show first, last, current, and neighbors
                      if (totalPages > 7 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm font-bold ${pageNum === currentPage ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-lg text-sm font-bold ${currentPage === totalPages ? 'text-gray-300 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-100'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    if (activeTab === 'revenue') {
      const latestWithdrawal = transactions.find(t => t.type === 'debit');
      
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl mx-auto pb-24 md:pb-0 space-y-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 md:mt-0">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Trainer Wallet</h2>
              <p className="text-gray-500 mt-1 font-medium">Manage your earnings, payouts, and view transaction history</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={handleExportStatement}
                className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 bg-white font-bold rounded-xl shadow-sm hover:bg-gray-55 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export Statement
              </button>
              
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:-translate-y-0.5 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
              >
                <CreditCard className="w-5 h-5" />
                Withdraw Funds
              </button>
            </div>
          </div>

          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Premium Available Balance Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group col-span-1 md:col-span-2">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-orange-500/30 transition-all duration-700"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
              
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    Secured
                  </span>
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-1">Available Balance</p>
                  <h3 className="text-4xl font-black text-white tracking-tight">
                    ₹{availableBalance.toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-orange-200 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] bg-orange-50 text-orange-600 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Gross</span>
              </div>
              <div className="mt-4">
                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Total Earnings</p>
                <p className="text-2xl font-black text-gray-900 mt-1">₹{totalEarnings.toLocaleString()}</p>
              </div>
            </div>

            {/* Withdrawn Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Cleared</span>
              </div>
              <div className="mt-4">
                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Withdrawn</p>
                <p className="text-2xl font-black text-gray-900 mt-1">₹{withdrawnAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Columns: Trend Chart & Transaction List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Custom SVG Interactive Chart */}
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Revenue Analytics</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {chartTimeframe === '6months' ? 'Last 6 Months Trend' : 'Last 30 Days Activity'}
                    </p>
                  </div>
                  
                  {/* Toggles */}
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-gray-50 p-1 rounded-xl flex border border-gray-100 text-[10px] font-bold">
                      <button
                        onClick={() => { setChartTimeframe('6months'); setChartHoveredIndex(null); }}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${chartTimeframe === '6months' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        6M
                      </button>
                      <button
                        onClick={() => { setChartTimeframe('30days'); setChartHoveredIndex(null); }}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${chartTimeframe === '30days' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        30D
                      </button>
                    </div>

                    <div className="bg-gray-50 p-1 rounded-xl flex border border-gray-100 text-[10px] font-bold">
                      <button
                        onClick={() => { setChartType('earnings'); setChartHoveredIndex(null); }}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'earnings' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Credits
                      </button>
                      <button
                        onClick={() => { setChartType('withdrawals'); setChartHoveredIndex(null); }}
                        className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'withdrawals' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Debits
                      </button>
                    </div>
                  </div>
                </div>

                {/* SVG Render Area */}
                {chartPoints.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm font-semibold">
                    No data recorded for this selection.
                  </div>
                ) : (
                  <div className="relative">
                    <svg 
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                      className="w-full h-auto overflow-visible select-none"
                    >
                      <defs>
                        <linearGradient id="chartGradientEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="chartGradientWithdrawals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines and Y Labels */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = paddingTop + ratio * chartHeight;
                        const maxAmount = Math.max(...processedChartData.map(d => d.amount), 1);
                        const labelVal = Math.round((1 - ratio) * maxAmount);
                        return (
                          <g key={`grid-${idx}`} className="opacity-40">
                            <line 
                              x1={paddingLeft} 
                              y1={y} 
                              x2={svgWidth - paddingRight} 
                              y2={y} 
                              stroke="#f1f5f9" 
                              strokeWidth="1"
                            />
                            <text 
                              x={paddingLeft - 8} 
                              y={y + 3} 
                              textAnchor="end" 
                              className="text-[9px] font-bold fill-gray-400"
                            >
                              ₹{labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : labelVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Path Area */}
                      <path
                        d={areaPathStr}
                        fill={chartType === 'earnings' ? 'url(#chartGradientEarnings)' : 'url(#chartGradientWithdrawals)'}
                        className="transition-all duration-300"
                      />

                      {/* Stroke Line */}
                      <path
                        d={bezierPathStr}
                        fill="none"
                        stroke={chartType === 'earnings' ? '#f97316' : '#3b82f6'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />

                      {/* Circular Dots */}
                      {chartPoints.map((pt, idx) => (
                        <circle
                          key={`pt-${idx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={chartHoveredIndex === idx ? "6" : "3.5"}
                          fill="#ffffff"
                          stroke={chartType === 'earnings' ? '#f97316' : '#3b82f6'}
                          strokeWidth={chartHoveredIndex === idx ? "3" : "2"}
                          className="transition-all duration-150"
                        />
                      ))}

                      {/* X Labels */}
                      {chartPoints.map((pt, idx) => {
                        const N = chartPoints.length;
                        const labelStep = chartTimeframe === '6months' ? 1 : 5;
                        if (idx % labelStep !== 0 && idx !== N - 1) return null;
                        return (
                          <text
                            key={`x-lbl-${idx}`}
                            x={pt.x}
                            y={svgHeight - 12}
                            textAnchor="middle"
                            className="text-[9px] font-bold fill-gray-400"
                          >
                            {pt.label}
                          </text>
                        );
                      })}

                      {/* Vertical line tracker on hover */}
                      {chartHoveredIndex !== null && chartPoints[chartHoveredIndex] && (
                        <g>
                          <line
                            x1={chartPoints[chartHoveredIndex].x}
                            y1={paddingTop}
                            x2={chartPoints[chartHoveredIndex].x}
                            y2={paddingTop + chartHeight}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx={chartPoints[chartHoveredIndex].x}
                            cy={chartPoints[chartHoveredIndex].y}
                            r="8"
                            fill={chartType === 'earnings' ? '#f97316' : '#3b82f6'}
                            stroke="#ffffff"
                            strokeWidth="3"
                            className="shadow"
                          />
                        </g>
                      )}

                      {/* Columns hover catchers */}
                      {chartPoints.map((pt, idx) => {
                        const colWidth = chartWidth / Math.max(chartPoints.length - 1, 1);
                        const startX = pt.x - colWidth / 2;
                        return (
                          <rect
                            key={`trig-${idx}`}
                            x={startX}
                            y={paddingTop}
                            width={colWidth}
                            height={chartHeight}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setChartHoveredIndex(idx)}
                            onMouseLeave={() => setChartHoveredIndex(null)}
                          />
                        );
                      })}
                    </svg>

                    {/* Floating Tooltip Card */}
                    {chartHoveredIndex !== null && chartPoints[chartHoveredIndex] && (
                      <div
                        className="absolute z-20 bg-gray-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-xl border border-gray-800 text-[10px] pointer-events-none transition-all"
                        style={{
                          left: `${((chartPoints[chartHoveredIndex].x - paddingLeft) / chartWidth) * 90 + 5}%`,
                          top: `${Math.max(10, chartPoints[chartHoveredIndex].y - 80)}px`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="font-bold text-gray-400 mb-0.5">{chartPoints[chartHoveredIndex].label}</div>
                        <div className="font-black text-sm text-white">
                          ₹{chartPoints[chartHoveredIndex].amount.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-gray-500 mt-1 font-semibold">
                          {chartType === 'earnings' ? 'Course Purchases' : 'Requested Withdrawals'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Transaction List Card */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <History className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">Transaction History</h3>
                  </div>

                  {/* Search, Filter Pills & Sort Box */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:max-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={txSearch}
                        onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500 w-full font-semibold"
                      />
                    </div>

                    <div className="relative">
                      <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={txTypeFilter}
                        onChange={(e) => { setTxTypeFilter(e.target.value); setTxPage(1); }}
                        className="appearance-none pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white font-semibold cursor-pointer text-gray-700"
                      >
                        <option value="all">All Types</option>
                        <option value="credit">Earnings</option>
                        <option value="debit">Withdrawals</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={txSort}
                        onChange={(e) => { setTxSort(e.target.value); setTxPage(1); }}
                        className="appearance-none pl-4 pr-8 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500 bg-white font-semibold cursor-pointer text-gray-700"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="high">Amount: High to Low</option>
                        <option value="low">Amount: Low to High</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {paginatedTransactions.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                        <Search className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900 mb-1">No Matching Records</h4>
                      <p className="text-xs text-gray-500 max-w-xs">Try adjusting your filters, search term, or sorting preferences.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {paginatedTransactions.map((tx) => (
                        <div 
                          key={tx.id} 
                          onClick={() => setSelectedTx(tx)}
                          className="group flex items-center justify-between p-4 rounded-2xl hover:bg-orange-50/30 transition-all border border-transparent hover:border-orange-100/30 cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${
                              tx.type === 'credit' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-100/50' 
                                : 'bg-orange-50 text-orange-600 border border-orange-100 group-hover:bg-orange-100/50'
                            }`}>
                              {tx.type === 'credit' ? <TrendingUp className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">{tx.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-500 font-bold">{tx.date}</span>
                                <span className="text-gray-300 text-[10px]">•</span>
                                <span className="text-[10px] text-gray-400 font-bold select-all">ID: {tx.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-4 flex flex-col items-end">
                            <p className={`font-black text-base ${tx.type === 'credit' ? 'text-emerald-500' : 'text-gray-900'}`}>
                              {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 mt-1 text-[8px] font-bold uppercase tracking-wider rounded-md border ${
                              tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : tx.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                              : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination Buttons */}
                  {totalFilteredTx > txPerPage && (
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs px-2">
                      <div className="text-gray-400 font-bold">
                        Showing {startIndex + 1} - {Math.min(txPage * txPerPage, totalFilteredTx)} of {totalFilteredTx} entries
                      </div>
                      <div className="flex gap-2 font-bold">
                        <button
                          onClick={() => setTxPage(p => Math.max(1, p - 1))}
                          disabled={txPage === 1}
                          className="px-3.5 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalTxPages }).map((_, idx) => (
                            <button
                              key={`tx-pg-${idx}`}
                              onClick={() => setTxPage(idx + 1)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${
                                txPage === idx + 1 
                                  ? 'bg-orange-500 text-white border-orange-500 shadow' 
                                  : 'border-transparent text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                          disabled={txPage === totalTxPages}
                          className="px-3.5 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Columns: Payout target info & Payout Timeline */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Payout Settings Card */}
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <h4 className="text-base font-black text-gray-900">Payout Account</h4>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="text-xs text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    Edit Info
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {profileData.bankAccount || profileData.upiId ? (
                  <div className="space-y-3.5">
                    {profileData.bankAccount && (
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                            <Building className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bank Transfer</p>
                            <h5 className="text-xs font-black text-gray-800 mt-0.5">{profileData.bankName || 'Linked Bank'}</h5>
                            <p className="text-[11px] text-gray-500 mt-0.5 font-bold">A/C: ****{profileData.bankAccount.slice(-4)}</p>
                          </div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      </div>
                    )}
                    
                    {profileData.upiId && (
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">UPI Account</p>
                            <h5 className="text-xs font-black text-gray-800 mt-0.5 truncate max-w-[120px]">{profileData.upiId}</h5>
                          </div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50/55 p-4 rounded-2xl border border-amber-100/50 text-center space-y-3">
                    <p className="text-xs text-amber-800 font-bold leading-relaxed">
                      You haven't linked a payout method yet. Please link your bank details or UPI ID to withdraw funds.
                    </p>
                    <button 
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-100 active:scale-95 transition-all w-full cursor-pointer"
                    >
                      Configure Details Now
                    </button>
                  </div>
                )}
              </div>

              {/* Stepper timeline tracking of last withdrawal request */}
              <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-5">
                <h4 className="text-base font-black text-gray-900 border-b border-gray-50 pb-4">Withdrawal Tracker</h4>

                {!latestWithdrawal ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-xs text-gray-400 font-bold">No Withdrawal Requests Yet</p>
                    <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto font-medium">When you request a payout, the tracking timeline will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100 text-xs">
                      <span className="text-gray-400 font-bold">Latest Request</span>
                      <span className="text-gray-800 font-black">₹{latestWithdrawal.amount.toLocaleString()}</span>
                    </div>

                    <div className="relative pl-6 space-y-5 text-xs font-bold mt-2">
                      <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-gray-100"></div>

                      {/* Step 1 */}
                      <div className="relative">
                        <span className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
                        <p className="text-emerald-600">Payout Initiated</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">{latestWithdrawal.date}</p>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <span className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white ${
                          latestWithdrawal.status === 'Completed' ? 'bg-emerald-500' 
                          : latestWithdrawal.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          {latestWithdrawal.status === 'Completed' ? '✓' : latestWithdrawal.status === 'Pending' ? '•' : '✕'}
                        </span>
                        <p className={latestWithdrawal.status === 'Completed' ? 'text-emerald-600' : latestWithdrawal.status === 'Pending' ? 'text-amber-600 animate-pulse' : 'text-red-600'}>
                          Verification & Approval
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {latestWithdrawal.status === 'Completed' ? 'Approved by Admin.' : latestWithdrawal.status === 'Pending' ? 'Awaiting Admin review.' : 'Request rejected.'}
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <span className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white ${
                          latestWithdrawal.status === 'Completed' ? 'bg-emerald-500' 
                          : latestWithdrawal.status === 'Pending' ? 'bg-gray-200 text-transparent' : 'bg-red-500'
                        }`}>
                          {latestWithdrawal.status === 'Completed' ? '✓' : latestWithdrawal.status === 'Pending' ? '•' : '✕'}
                        </span>
                        <p className={latestWithdrawal.status === 'Completed' ? 'text-emerald-600' : latestWithdrawal.status === 'Pending' ? 'text-gray-400' : 'text-red-600'}>
                          Funds Transferred
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {latestWithdrawal.status === 'Completed' ? 'Credited to your account.' : latestWithdrawal.status === 'Pending' ? 'Funds transfer pending approval.' : 'Transfer cancelled.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Modal Popup */}
          <AnimatePresence>
            {selectedTx && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedTx(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-md w-full relative z-10 border border-gray-100 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900">Receipt Details</h3>
                    <button 
                      onClick={() => setSelectedTx(null)}
                      className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Status header */}
                    <div className="text-center p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2.5 ${
                        selectedTx.type === 'credit' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'
                      }`}>
                        {selectedTx.type === 'credit' ? <TrendingUp className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                      </span>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedTx.type === 'credit' ? 'Credit Earnings' : 'Withdrawal Request'}</p>
                      <h4 className="text-2xl font-black text-gray-900 mt-1">₹{selectedTx.amount.toLocaleString()}</h4>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 mt-2 text-xs font-bold rounded-full border ${
                        selectedTx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : selectedTx.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                        : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedTx.status === 'Completed' ? 'bg-emerald-500' : selectedTx.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>
                        {selectedTx.status}
                      </span>
                    </div>

                    {/* Fields */}
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                        <span className="text-gray-400 font-bold">Transaction ID</span>
                        <span className="text-gray-900 font-black select-all">{selectedTx.id}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                        <span className="text-gray-400 font-bold">Date & Time</span>
                        <span className="text-gray-900 font-black">{selectedTx.date}</span>
                      </div>
                      
                      {selectedTx.type === 'credit' ? (
                        <>
                          <div className="flex justify-between items-start text-sm border-b border-gray-50 pb-2.5">
                            <span className="text-gray-400 font-bold shrink-0">Item Purchased</span>
                            <span className="text-gray-900 font-black text-right max-w-[200px] truncate">{selectedTx.title}</span>
                          </div>
                          {selectedTx.studentName && (
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                              <span className="text-gray-400 font-bold">Student Name</span>
                              <span className="text-gray-900 font-black">{selectedTx.studentName}</span>
                            </div>
                          )}
                          {selectedTx.studentEmail && (
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                              <span className="text-gray-400 font-bold">Student Email</span>
                              <span className="text-gray-900 font-black">{selectedTx.studentEmail}</span>
                            </div>
                          )}
                          {/* Split values */}
                          {(() => {
                            const matchedCourse = courses.find(c => c.id === selectedTx.courseId);
                            const commission = typeof selectedTx.commission === 'number'
                              ? selectedTx.commission
                              : ((matchedCourse && typeof matchedCourse.commission === 'number') ? matchedCourse.commission : globalCommission);
                            const feeAmt = Math.round((selectedTx.amount * commission) / 100);
                            const netAmt = Math.max(0, selectedTx.amount - feeAmt);

                            return (
                              <div className="bg-orange-50/50 p-4 rounded-2xl space-y-2 mt-4 text-[11px] border border-orange-100/30">
                                <div className="flex justify-between text-gray-500">
                                  <span>Student Price (Gross)</span>
                                  <span className="font-bold">₹{selectedTx.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 border-b border-orange-100/40 pb-2">
                                  <span>Platform Fee ({commission}%)</span>
                                  <span className="font-bold">-₹{feeAmt.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-orange-700 font-black text-xs pt-1">
                                  <span>Net Earnings ({100 - commission}%)</span>
                                  <span>₹{netAmt.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                            <span className="text-gray-400 font-bold">Payout Method</span>
                            <span className="text-gray-900 font-black">{selectedTx.method || 'Bank Transfer'}</span>
                          </div>
                          {selectedTx.bankName && (
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                              <span className="text-gray-400 font-bold">Bank Name</span>
                              <span className="text-gray-900 font-black">{selectedTx.bankName}</span>
                            </div>
                          )}
                          {selectedTx.accountNo && (
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                              <span className="text-gray-400 font-bold">Account Number</span>
                              <span className="text-gray-900 font-black">{selectedTx.accountNo}</span>
                            </div>
                          )}
                          {selectedTx.upiId && (
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2.5">
                              <span className="text-gray-400 font-bold">UPI Handle</span>
                              <span className="text-gray-900 font-black">{selectedTx.upiId}</span>
                            </div>
                          )}

                          {/* Tracker stepper */}
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status Progress</h5>
                            <div className="relative pl-6 space-y-4 text-[11px] font-bold">
                              <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-gray-100"></div>
                              
                              <div className="relative">
                                <span className="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
                                <p className="text-emerald-600">Request Submitted</p>
                                <p className="text-[10px] text-gray-400 font-medium">Payout request has been registered.</p>
                              </div>
                              
                              <div className="relative">
                                <span className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white ${
                                  selectedTx.status === 'Completed' ? 'bg-emerald-500' 
                                  : selectedTx.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                                }`}>
                                  {selectedTx.status === 'Completed' ? '✓' : selectedTx.status === 'Pending' ? '•' : '✕'}
                                </span>
                                <p className={selectedTx.status === 'Completed' ? 'text-emerald-600' : selectedTx.status === 'Pending' ? 'text-amber-600' : 'text-red-600'}>
                                  Admin Review
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {selectedTx.status === 'Completed' ? 'Verified and approved.' : selectedTx.status === 'Pending' ? 'Verifying payment details.' : 'Request declined.'}
                                </p>
                              </div>

                              <div className="relative">
                                <span className={`absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white ${
                                  selectedTx.status === 'Completed' ? 'bg-emerald-500' 
                                  : selectedTx.status === 'Pending' ? 'bg-gray-200 text-transparent' : 'bg-red-500'
                                }`}>
                                  {selectedTx.status === 'Completed' ? '✓' : selectedTx.status === 'Pending' ? '•' : '✕'}
                                </span>
                                <p className={selectedTx.status === 'Completed' ? 'text-emerald-600' : selectedTx.status === 'Pending' ? 'text-gray-400' : 'text-red-600'}>
                                  Disbursed
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {selectedTx.status === 'Completed' ? 'Funds transferred to destination.' : selectedTx.status === 'Pending' ? 'Processing transfer.' : 'Request cancelled.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    if (activeTab === 'profile') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl mx-auto pb-24 md:pb-8"
        >
          {/* Header */}
          <div className="relative mb-8 rounded-[2rem] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50/70 p-8 md:p-12 text-slate-800 shadow-xl shadow-orange-100/40 border border-orange-100/70">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              
              {/* Profile Photo Upload */}
              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-white border-4 border-orange-100/80 shadow-2xl relative group transition-all duration-300 hover:scale-[1.03]">
                  {profilePhotoPreview ? (
                    <img 
                      src={profilePhotoPreview} 
                      alt={profileData.fullName || 'Trainer'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-orange-100/60 to-amber-50">
                      👨‍🏫
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                    <Upload className="w-6 h-6 text-white mb-1.5" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Upload New</span>
                  </div>
                  <input
                    id="profilePhotoInputHeader"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {/* Small indicator */}
                <div className="absolute bottom-1.5 right-1.5 w-9 h-9 bg-orange-500 rounded-full border-2 border-orange-50 flex items-center justify-center shadow-lg pointer-events-none transition-transform group-hover:scale-110">
                  <Camera className="w-4.5 h-4.5 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl md:text-4.5xl font-black tracking-tight mb-2.5 text-slate-800">
                  {profileData.fullName || user?.fullName || 'Trainer Profile'}
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black border border-emerald-100">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Verified Partner
                  </span>
                  <span className="flex items-center px-3.5 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-black border border-orange-100 font-bold">
                    Role: Educator
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Public Profile Card Preview */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.012)] p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Public Card Preview</h4>
                  
                  <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 mb-4 border border-gray-100">
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50">👨‍🏫</div>
                      )}
                    </div>
                    <h5 className="font-black text-gray-900 text-base leading-snug">{profileData.fullName || "Your Name"}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Certified Educator</p>
                    
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-3.5 text-[9px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Profile Active
                    </span>
                  </div>

                  <div className="py-6 space-y-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-50/70 flex items-center justify-center text-orange-600">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Email Address</p>
                        <p className="font-bold text-gray-800 truncate">{profileData.email || "not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-50/70 flex items-center justify-center text-orange-600">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Phone Number</p>
                        <p className="font-bold text-gray-800">{profileData.phone || "not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-100">
                    <h6 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Payout Connection</h6>
                    {((preferredPayoutChannel === 'bank' && profileData.bankAccount) || (preferredPayoutChannel === 'upi' && profileData.upiId)) ? (
                      <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/50 flex items-start gap-3">
                        <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-[11px]">
                          <p className="font-black text-emerald-800">Linked Successfully</p>
                          <p className="text-emerald-700 font-medium mt-0.5">
                            {preferredPayoutChannel === 'bank' 
                              ? `Bank ending in ••••${profileData.bankAccount.replace(/\s+/g, '').slice(-4)}` 
                              : `UPI linked: ${profileData.upiId}`}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100/50 flex items-start gap-3">
                        <span className="w-4.5 h-4.5 text-amber-500 font-black text-xs">⚠️</span>
                        <div className="text-[11px]">
                          <p className="font-black text-amber-800">Pending Setup</p>
                          <p className="text-amber-700 font-medium mt-0.5">Please fill details on the Payout tab to receive payouts.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Settings configuration Workspace */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Tab selector menu */}
                <div className="bg-gray-100/70 p-1.5 rounded-2xl flex border border-gray-200/50 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setProfileSubTab('personal')}
                    className={`flex-1 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      profileSubTab === 'personal' 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 border-orange-500 font-bold' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent'
                    }`}
                  >
                    <User className="w-4.5 h-4.5" />
                    Personal Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileSubTab('payout')}
                    className={`flex-1 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      profileSubTab === 'payout' 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 border-orange-500 font-bold' 
                        : 'text-gray-500 hover:text-gray-800 border-transparent'
                    }`}
                  >
                    <CreditCard className="w-4.5 h-4.5" />
                    Payout & Settlement
                  </button>
                </div>

                {/* Subtab Content Panels */}
                <AnimatePresence mode="wait">
                  {profileSubTab === 'personal' ? (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6"
                    >
                      <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
                        <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                          <User className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-lg">Personal Account Settings</h3>
                          <p className="text-xs text-gray-400">Configure your primary contact information</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        {/* Name Field */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                            <span>Full Name</span>
                            <span className="text-gray-400/60 lowercase font-medium">required</span>
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <User className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input
                              type="text"
                              required
                              value={profileData.fullName}
                              onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                              className="w-full bg-gray-50 pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none transition-all font-semibold text-gray-900 text-sm"
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                            <span>Phone Number</span>
                            {profileData.phone && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${isPhoneValid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {isPhoneValid ? '✓ Valid format' : '✗ Must be 10 digits'}
                              </span>
                            )}
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Phone className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input
                              type="tel"
                              required
                              value={profileData.phone}
                              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                              className={`w-full bg-gray-50 pl-11 pr-4 py-3.5 rounded-xl border focus:ring-4 focus:bg-white outline-none transition-all font-semibold text-gray-900 text-sm ${
                                profileData.phone
                                  ? isPhoneValid
                                    ? 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/10'
                                    : 'border-amber-200 focus:border-amber-500 focus:ring-amber-500/10'
                                  : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/10'
                              }`}
                              placeholder="e.g. 9898989898"
                            />
                          </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                            <span>Email Address</span>
                            <span className="text-gray-400/60 lowercase font-medium">required</span>
                          </label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Mail className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input
                              type="email"
                              required
                              value={profileData.email}
                              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                              className="w-full bg-gray-50 pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none transition-all font-semibold text-gray-900 text-sm"
                              placeholder="e.g. trainer@gmail.com"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="payout"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-6"
                    >
                      <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
                        <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                          <Building className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-lg">Settlement Methods</h3>
                          <p className="text-xs text-gray-400">Configure how you receive your net earnings</p>
                        </div>
                      </div>

                      {/* Select Channel Segmented Control */}
                      <div className="space-y-3.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferred Settlement Channel</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setPreferredPayoutChannel('bank')}
                            className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3 cursor-pointer ${
                              preferredPayoutChannel === 'bank'
                                ? 'bg-orange-50/20 border-orange-500 ring-2 ring-orange-500/10'
                                : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <Building className={`w-5 h-5 shrink-0 mt-0.5 ${preferredPayoutChannel === 'bank' ? 'text-orange-500' : 'text-gray-400'}`} />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900">Direct Bank Deposit</p>
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Settles directly via NEFT/IMPS</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreferredPayoutChannel('upi')}
                            className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3 cursor-pointer ${
                              preferredPayoutChannel === 'upi'
                                ? 'bg-orange-50/20 border-orange-500 ring-2 ring-orange-500/10'
                                : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <span className={`w-5 h-5 font-black text-center text-sm shrink-0 leading-none ${preferredPayoutChannel === 'upi' ? 'text-orange-500' : 'text-gray-400'}`}>@</span>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900">Instant UPI Handle</p>
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Settle to linked VPA address</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Display Selected Fields */}
                      <div className="pt-4 border-t border-gray-50">
                        <AnimatePresence mode="wait">
                          {preferredPayoutChannel === 'bank' ? (
                            <motion.div
                              key="bank-fields"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="space-y-4"
                            >
                              {/* Account Number */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                  <span>Bank Account Number</span>
                                  <span className="text-gray-400/60 lowercase font-medium">required</span>
                                </label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Building className="w-4.5 h-4.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                  </div>
                                  <input
                                    type={showBankAccount ? "text" : "password"}
                                    required={preferredPayoutChannel === 'bank'}
                                    value={profileData.bankAccount}
                                    onChange={(e) => setProfileData({...profileData, bankAccount: e.target.value})}
                                    className="w-full bg-gray-50 pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none transition-all font-semibold text-gray-900 text-sm font-mono tracking-wider"
                                    placeholder="Enter your bank account number"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowBankAccount(!showBankAccount)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                  >
                                    {showBankAccount ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* IFSC Code */}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                    <span>IFSC Code</span>
                                    {profileData.ifscCode && (
                                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${isIfscValid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {isIfscValid ? '✓ Valid' : '✗ Invalid format'}
                                      </span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    required={preferredPayoutChannel === 'bank'}
                                    value={profileData.ifscCode}
                                    onChange={(e) => setProfileData({...profileData, ifscCode: e.target.value.toUpperCase()})}
                                    className={`w-full bg-gray-50 px-4 py-3.5 rounded-xl border focus:ring-4 focus:bg-white outline-none transition-all font-semibold text-gray-900 text-sm uppercase ${
                                      profileData.ifscCode
                                        ? isIfscValid
                                          ? 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/10'
                                          : 'border-amber-200 focus:border-amber-500 focus:ring-amber-500/10'
                                        : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/10'
                                    }`}
                                    placeholder="e.g. SBIN0001234"
                                  />
                                </div>

                                {/* Bank Name */}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Name</label>
                                  <input
                                    type="text"
                                    required={preferredPayoutChannel === 'bank'}
                                    value={profileData.bankName}
                                    onChange={(e) => setProfileData({...profileData, bankName: e.target.value})}
                                    className="w-full bg-gray-50 px-4 py-3.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:bg-white outline-none transition-all font-semibold text-gray-900 text-sm"
                                    placeholder="e.g. State Bank of India"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="upi-fields"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="space-y-4"
                            >
                              {/* UPI ID */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                  <span>UPI Handle Address</span>
                                  {profileData.upiId && (
                                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${isUpiValid ? 'text-emerald-500' : 'text-amber-500'}`}>
                                      {isUpiValid ? '✓ Valid format' : '✗ Needs "@" symbol'}
                                    </span>
                                  )}
                                </label>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="text-gray-400 font-bold text-sm group-focus-within:text-orange-500 transition-colors">@</span>
                                  </div>
                                  <input
                                    type="text"
                                    required={preferredPayoutChannel === 'upi'}
                                    value={profileData.upiId}
                                    onChange={(e) => setProfileData({...profileData, upiId: e.target.value})}
                                    className={`w-full bg-gray-50 pl-10 pr-4 py-3.5 rounded-xl border focus:ring-4 focus:bg-white outline-none transition-all font-semibold text-gray-900 text-sm ${
                                      profileData.upiId
                                        ? isUpiValid
                                          ? 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/10'
                                          : 'border-amber-200 focus:border-amber-500 focus:ring-amber-500/10'
                                        : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/10'
                                    }`}
                                    placeholder="e.g. swaranjali@ybl"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Floating Unsaved Changes Notification Toast */}
            <AnimatePresence>
              {isProfileDirty && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  className="fixed bottom-6 left-6 md:left-[calc(16rem+1.5rem)] right-6 z-[100] bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    <div>
                      <p className="text-xs font-black">Unsaved Configuration Changes</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {isUploadingPhoto ? "Your photo is uploading..." : "You have modified details that aren't synced yet."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end sm:self-auto font-black text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.reload();
                      }}
                      className="px-4 py-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-gray-300 hover:text-white font-black"
                    >
                      Discard
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving || isUploadingPhoto}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 cursor-pointer font-black"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="w-full md:w-64 bg-white flex flex-col hidden md:flex sticky top-0 h-screen overflow-y-auto shadow-[1px_0_20px_rgba(0,0,0,0.04)] border-r border-gray-100">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
            <span className="text-xl">👨‍🏫</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-950 tracking-tight leading-none">Trainer <span className="text-orange-500">Portal</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Instructor Hub</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          <button 
            onClick={() => setActiveTab('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'insights' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'}`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="whitespace-nowrap">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('courses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'courses' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="whitespace-nowrap">My Courses</span>
          </button>

          <button 
            onClick={() => setActiveTab('revenue')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'revenue' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'}`}
          >
            <Wallet className="w-5 h-5" />
            <span className="whitespace-nowrap">Revenue</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'}`}
          >
            <User className="w-5 h-5" />
            <span className="whitespace-nowrap">Profile & Payouts</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-sm group"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        {/* Mobile Header (Only visible on non-dashboard tabs if needed, or always) */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">👨‍🏫</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2.5 bg-white shadow-sm text-red-500 rounded-xl">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {renderContent()}
      </main>

      {/* Bottom Navigation - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-5 py-4 flex justify-between items-center z-50 rounded-t-[2rem] shadow-[0_-4px_30px_rgba(0,0,0,0.08)]">
        {[
          { id: 'insights', icon: BarChart2, label: 'Insights' },
          { id: 'courses', icon: BookOpen, label: 'Courses' },
          { id: 'revenue', icon: Wallet, label: 'Revenue' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map((item, idx) => (
          <motion.button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-bold' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <item.icon className="w-6 h-6" />
            {activeTab === item.id && <span className="text-xs">{item.label}</span>}
          </motion.button>
        ))}
      </div>
    </div>

      {/* Create Course Modal */}
      {isCreateCourseModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#f8f9fc]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 bg-white border-b border-gray-100">
              <button
                onClick={() => setIsCreateCourseModalOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h3 className="text-xl font-black text-gray-900">Create Course</h3>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 max-w-2xl mx-auto w-full">
              {/* Course Title */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Course Title</label>
                <input
                  type="text"
                  value={newCourseForm.title}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, title: e.target.value })}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                  placeholder="Enter course title"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  value={newCourseForm.description}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400 resize-none"
                  placeholder="Enter course description"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Category</label>
                <div className="relative">
                  <select
                    value={newCourseForm.category}
                    onChange={(e) => setNewCourseForm({ ...newCourseForm, category: e.target.value })}
                    className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">One Time (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newCourseForm.price}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, price: e.target.value })}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                  placeholder="0 for Free"
                />
              </div>

              {/* Lifetime Price */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Lifetime Access Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newCourseForm.lifetimePrice}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, lifetimePrice: e.target.value })}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                  placeholder="Leave empty to use regular price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  One-time payment for lifetime access to the course
                </p>
              </div>

              {/* Limited Time Price */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Limited Time Offer Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newCourseForm.limitedTimePrice}
                  onChange={(e) => setNewCourseForm({ ...newCourseForm, limitedTimePrice: e.target.value })}
                  className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                  placeholder="Leave empty to use regular price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Special discounted price for limited time offers
                </p>
              </div>

              {/* Thumbnail */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  id="thumbnail-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setNewCourseForm({ ...newCourseForm, thumbnail: reader.result, thumbnailFile: file });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="w-full bg-gray-50 border-2 border-dashed border-orange-300 rounded-2xl py-10 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/30 transition-all group"
                >
                  {newCourseForm.thumbnail ? (
                    <img src={newCourseForm.thumbnail} alt="Thumbnail" className="w-full max-h-40 object-cover rounded-xl px-4" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-orange-400 group-hover:scale-110 transition-transform" />
                      <p className="text-orange-400 font-bold text-sm mt-3">Tap to upload image</p>
                    </>
                  )}
                </label>
              </div>

              {/* Assessment Questions Accordion Card */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                {/* Header Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAssessmentSectionOpen(!isAssessmentSectionOpen)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-900">Assessment Questions</h4>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {newCourseForm.assessment?.questions?.length || 0} question(s) added
                      </p>
                    </div>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      isAssessmentSectionOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                  {isAssessmentSectionOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-50 px-6 pb-6 pt-4 space-y-6 overflow-hidden"
                    >
                      {/* Passing % and Time Limit Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Passing %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newCourseForm.assessment?.passingPercentage || 70}
                            onChange={(e) => handleAssessmentChange(curr => ({
                              ...curr,
                              passingPercentage: Number(e.target.value)
                            }))}
                            className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                            placeholder="70"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700">Time Limit (min)</label>
                          <input
                            type="number"
                            min="0"
                            value={newCourseForm.assessment?.timeLimit || 0}
                            onChange={(e) => handleAssessmentChange(curr => ({
                              ...curr,
                              timeLimit: Number(e.target.value)
                            }))}
                            className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                            placeholder="0 for No Limit"
                          />
                        </div>
                      </div>

                      {/* Question List */}
                      <div className="space-y-6">
                        {newCourseForm.assessment?.questions?.map((q, qIdx) => (
                          <div 
                            key={qIdx} 
                            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] space-y-4 relative"
                          >
                            {/* Question Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
                                  {qIdx + 1}
                                </span>
                                <span className="font-bold text-gray-800">Question {qIdx + 1}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIdx)}
                                className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Question text textarea */}
                            <textarea
                              rows={3}
                              value={q.questionText}
                              onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                              className="w-full bg-gray-50 px-5 py-4 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400 resize-none"
                              placeholder="Enter the question..."
                            />

                            {/* Options A, B, C, D */}
                            <div className="space-y-3">
                              {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                                const isCorrect = q.correctOption === letter;
                                return (
                                  <div key={letter} className="flex items-center gap-3">
                                    {/* Circle Checkmark Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleCorrectOptionChange(qIdx, letter)}
                                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 shrink-0 ${
                                        isCorrect 
                                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-400'
                                      }`}
                                    >
                                      {isCorrect ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                      ) : (
                                        <span className="w-3 h-3 rounded-full border border-gray-300" />
                                      )}
                                    </button>

                                    <span className="font-bold text-gray-500 text-sm">{letter}</span>

                                    {/* Option Text Input */}
                                    <input
                                      type="text"
                                      value={q.options[optIdx]}
                                      onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                                      className="flex-1 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-gray-900 font-medium placeholder:text-gray-400"
                                      placeholder={`Option ${letter}`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            
                            <p className="text-[11px] text-gray-400 font-medium italic">
                              Tap the circle to mark the correct answer
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Add Question Button */}
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full py-4 border-2 border-dashed border-orange-200 hover:border-orange-400 rounded-2xl flex items-center justify-center gap-2 text-orange-500 font-bold hover:bg-orange-50/20 transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                        Add Question
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="px-6 py-5 bg-white border-t border-gray-100 flex gap-4">
              <button
                type="button"
                onClick={() => handleCreateCourse('Draft')}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleCreateCourse('Pending Review')}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold shadow-lg shadow-orange-200 transition-all active:scale-95"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Videos / Add PDF Full-Screen Page */}
      {mediaPanel.open && (() => {
        const currentCourse = courses.find(c => c.id === mediaPanel.courseId);
        if (!currentCourse) return null;

        const isOwner = currentCourse.trainerId === user?.uid;
        const isSuperAdmin = (user?.role || '').toLowerCase() === 'superadmin';
        if (!isOwner && !isSuperAdmin) {
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f8f9fc]">
              <div className="bg-white rounded-2xl p-8 shadow-md text-center max-w-sm mx-4">
                <h3 className="text-lg font-black text-gray-900">Access denied</h3>
                <p className="text-sm text-gray-500 mt-2">You don't have permission to view another trainer's course media.</p>
                <div className="mt-6">
                  <button
                    onClick={closeMediaPanel}
                    className="px-4 py-2 bg-orange-500 text-white rounded-full font-bold"
                  >
                    Go back
                  </button>
                </div>
              </div>
            </div>
          );
        }

        const courseVideos = currentCourse.videos || [];
        const coursePdfs = currentCourse.pdfs || [];
        const courseImages = currentCourse.images || [];
        const totalUploads = courseVideos.length + coursePdfs.length + courseImages.length;
        const allUploads = [...courseVideos, ...coursePdfs, ...courseImages];

        const handleUploadMedia = async () => {
          if (!mediaTitle.trim() && selectedMediaFiles.length === 0 && !mediaUrl.trim()) {
            alert('Please enter a title or select a file/url');
            return;
          }

          const courseRef = doc(db, "bharatam_courses", mediaPanel.courseId);
          const targetCourse = courses.find(c => c.id === mediaPanel.courseId);
          const updatedVideos = [...(targetCourse.videos || [])];
          const updatedPdfs = [...(targetCourse.pdfs || [])];
          const updatedImages = [...(targetCourse.images || [])];

          const uploadFile = async (file, folder) => {
            try {
              if (mediaContentType === 'video') {
                // Videos must go through Bunny Stream (not storage)
                const result = await uploadToBunnyStream(file, mediaTitle.trim() || file.name, undefined, (percent) => {
                  console.log('Bunny stream upload progress:', percent);
                });
                return result.embedUrl || result.url || result.playbackUrl || '';
              }

              const { cdnUrl } = await uploadToBunny(file, `bharatm_library/${folder}`, (percent) => {
                console.log('Bunny upload progress:', percent);
              });
              return cdnUrl;
            } catch (uploadErr) {
              console.error(uploadErr);
              throw uploadErr;
            }
          };

          try {
            if (mediaContentType === 'video') {
              let nextVideoOrder = getNextMediaOrder(updatedVideos);
              if (selectedMediaFiles.length > 0) {
                for (const file of selectedMediaFiles) {
                  const cdnUrl = await uploadFile(file, 'videos');
                  const playable = normalizeSavedVideoUrl(cdnUrl);
                  const itemOrder = nextVideoOrder++;

                  const subcolRef = collection(db, "bharatam_courses", mediaPanel.courseId, "videos");
                  const newDocRef = doc(subcolRef);
                  const generatedId = newDocRef.id;

                  const newItem = {
                    id: generatedId,
                    title: mediaTitle.trim() || file.name,
                    url: playable,
                    contentType: 'video',
                    accessType: mediaAccessType,
                    order: itemOrder,
                    status: 'Pending',
                    addedAt: new Date().toISOString()
                  };

                  const firestoreMediaDoc = {
                    approvalStatus: 'pending',
                    approvedAt: null,
                    bunnyVideoId: playable,
                    storageUrl: playable,
                    contentType: 'video',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    durationMinutes: 0,
                    fileName: newItem.title,
                    title: newItem.title,
                    thumbnailUrl: '',
                    views: 0,
                    isFree: mediaAccessType === 'free',
                    order: itemOrder,
                    status: 'pending'
                  };

                  await setDoc(newDocRef, firestoreMediaDoc);
                  updatedVideos.push(newItem);
                }
              } else if (mediaUrl.trim()) {
                  // If user pasted a GUID or URL, resolve to a playable URL
                  const resolved = resolveBunnyVideoUrl(mediaUrl.trim());
                  const itemOrder = nextVideoOrder++;

                  const subcolRef = collection(db, "bharatam_courses", mediaPanel.courseId, "videos");
                  const newDocRef = doc(subcolRef);
                  const generatedId = newDocRef.id;

                  const newItem = {
                    id: generatedId,
                    title: mediaTitle.trim() || 'Video Upload',
                    url: resolved,
                    contentType: 'video',
                    accessType: mediaAccessType,
                    order: itemOrder,
                    status: 'Pending',
                    addedAt: new Date().toISOString()
                  };

                  const firestoreMediaDoc = {
                    approvalStatus: 'pending',
                    approvedAt: null,
                    bunnyVideoId: resolved,
                    storageUrl: resolved,
                    contentType: 'video',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    durationMinutes: 0,
                    fileName: newItem.title,
                    title: newItem.title,
                    thumbnailUrl: '',
                    views: 0,
                    isFree: mediaAccessType === 'free',
                    order: itemOrder,
                    status: 'pending'
                  };

                  await setDoc(newDocRef, firestoreMediaDoc);
                  updatedVideos.push(newItem);
              } else {
                alert('Please select at least one video file or provide a Bunny URL');
                return;
              }
            } else {
              const file = selectedMediaFiles[0];
              if (!file) {
                alert(`Please select a ${mediaContentType === 'image' ? 'image' : 'PDF'} file to upload`);
                return;
              }

              const folder = mediaContentType === 'image' ? 'images' : 'pdfs';
              let cdnUrl = '';
              try {
                cdnUrl = await uploadFile(file, folder);
              } catch (uploadErr) {
                console.warn('PDF/image upload failed, will still save record and mark as upload_failed', uploadErr);
                // keep cdnUrl empty so UI indicates missing file; allow record creation so course shows the item
                cdnUrl = '';
                alert('Upload to storage failed. The file record was saved and you can retry uploading the file later.');
              }

              const subcolRefPdfs = collection(db, "bharatam_courses", mediaPanel.courseId, "pdfs");
              const subcolRefPdf = collection(db, "bharatam_courses", mediaPanel.courseId, "pdf");
              const subcolRefImages = collection(db, "bharatam_courses", mediaPanel.courseId, "images");
              
              const targetSubcolRef = mediaContentType === 'pdf' ? subcolRefPdfs : subcolRefImages;
              const newDocRef = doc(targetSubcolRef);
              const generatedId = newDocRef.id;
              const itemOrder = mediaContentType === 'pdf'
                ? getNextMediaOrder(updatedPdfs)
                : getNextMediaOrder(updatedImages);

              const newItem = {
                id: generatedId,
                title: mediaTitle.trim() || file.name,
                url: cdnUrl,
                contentType: mediaContentType,
                accessType: mediaAccessType,
                order: itemOrder,
                status: 'Pending',
                addedAt: new Date().toISOString()
              };

              const firestoreMediaDoc = {
                approvalStatus: 'pending',
                approvedAt: null,
                bunnyVideoId: '',
                storageUrl: cdnUrl,
                contentType: mediaContentType,
                createdAt: new Date(),
                updatedAt: new Date(),
                durationMinutes: 0,
                fileName: newItem.title,
                title: newItem.title,
                thumbnailUrl: '',
                views: 0,
                isFree: mediaAccessType === 'free',
                order: itemOrder,
                status: cdnUrl ? 'pending' : 'upload_failed'
              };

              await setDoc(newDocRef, firestoreMediaDoc);
              
              // Also write to "pdf" if it is a pdf
              if (mediaContentType === 'pdf') {
                    // No longer writing to legacy 'pdf' subcollection — only use 'pdfs'
              }

              if (mediaContentType === 'pdf') updatedPdfs.push(newItem);
              if (mediaContentType === 'image') updatedImages.push(newItem);
            }

            await updateDoc(courseRef, {
              hasPendingContent: true,
              contentApprovalStatus: 'pending',
              updatedAt: serverTimestamp()
            });

            setCourses(prevCourses => prevCourses.map(c => {
              if (c.id !== mediaPanel.courseId) return c;
              return { ...c, videos: updatedVideos, pdfs: updatedPdfs, images: updatedImages };
            }));

            setMediaTitle('');
            setMediaUrl('');
            setSelectedMediaFiles([]);
          } catch (err) {
            console.error(err);
            alert('Failed to upload media: ' + (err.message || err));
          }
        };

        const handleRemoveMedia = async (itemId, itemType) => {
          if (!confirm('Are you sure you want to delete this upload?')) return;

          const courseRef = doc(db, "bharatam_courses", mediaPanel.courseId);
          const targetCourse = courses.find(c => c.id === mediaPanel.courseId);
          if (!targetCourse) {
            alert('Course not found');
            return;
          }

          const updatedVideos = itemType === 'video' ? (targetCourse.videos || []).filter(v => v.id !== itemId) : targetCourse.videos || [];
          const updatedPdfs = itemType === 'pdf' ? (targetCourse.pdfs || []).filter(p => p.id !== itemId) : targetCourse.pdfs || [];
          const updatedImages = itemType === 'image' ? (targetCourse.images || []).filter(i => i.id !== itemId) : targetCourse.images || [];

          try {
            // Ensure parent course doc exists before calling update/delete in a batch
            const courseSnap = await getDoc(courseRef);
            if (!courseSnap.exists()) {
              // Course doc missing — delete subcollection doc only and update local state
              if (itemType === 'video' || itemType === 'pdf') {
                try {
                  const sub = itemType === 'video' ? 'videos' : 'pdfs';
                  const mediaDocRef = doc(db, "bharatam_courses", mediaPanel.courseId, sub, itemId);
                  await deleteDoc(mediaDocRef);
                } catch (subErr) {
                  console.error('Failed to delete subcollection doc when parent missing:', subErr);
                  alert('Failed to remove media (subcollection delete failed): ' + (subErr.message || subErr));
                  return;
                }
              }

              // Update local state to remove item from UI even though parent doc is gone
              setCourses(prevCourses => prevCourses.map(c => {
                if (c.id !== mediaPanel.courseId) return c;
                return { ...c, videos: updatedVideos, pdfs: updatedPdfs, images: updatedImages };
              }));
              return;
            }

            const batch = writeBatch(db);
            batch.update(courseRef, {
              updatedAt: new Date()
            });

            if (itemType === 'video' || itemType === 'pdf') {
              const sub = itemType === 'video' ? 'videos' : 'pdfs';
              const mediaDocRef = doc(db, "bharatam_courses", mediaPanel.courseId, sub, itemId);
              batch.delete(mediaDocRef);
            }

            await batch.commit();

            setCourses(prevCourses => prevCourses.map(c => {
              if (c.id !== mediaPanel.courseId) return c;
              return { ...c, videos: updatedVideos, pdfs: updatedPdfs, images: updatedImages };
            }));
          } catch (err) {
            console.error('Failed removing media (batch):', err);
            alert('Failed to remove media: ' + (err.message || err));
          }
        };

        return (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#f2f4f8] overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col h-full"
            >
              {/* ── Top Header Bar ── */}
              <div className="flex-shrink-0 bg-white border-b border-gray-100 h-16 px-8 flex items-center gap-4 shadow-sm">
                <button
                  onClick={closeMediaPanel}
                  className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-px h-5 bg-gray-100" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base font-semibold text-gray-900 truncate leading-none">{currentCourse.title}</h1>
                    <p className="text-xs text-gray-400 mt-0.5 leading-none">{currentCourse.subject || currentCourse.category || 'Course Content'}</p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${Math.min((totalUploads / 5) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{totalUploads}/5</span>
                  </div>
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-xl border ${
                    currentCourse.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : currentCourse.status === 'Pending Review' ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>{currentCourse.status || 'Draft'}</span>
                </div>
              </div>

              {/* ── Body: Two-column ── */}
              <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row bg-[#f8fafc]">

                {/* LEFT — Upload Form Panel */}
                <div className="w-full md:w-96 flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-100 flex flex-col md:overflow-y-auto shadow-sm">
                  <div className="p-7 space-y-6">
                    <div>
                      <h2 className="text-lg font-black text-slate-800 leading-tight">Add Content</h2>
                      <p className="text-xs font-semibold text-slate-400 mt-1 leading-normal">Upload videos, lectures or reference notes to this course.</p>
                    </div>

                    {/* Content Type Tabs */}
                    <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 gap-1">
                      {[
                        { type: 'video', icon: Video, label: 'Video' },
                        { type: 'pdf', icon: FileText, label: 'PDF' },
                        { type: 'image', icon: Image, label: 'Image' },
                      ].map(tab => (
                        <button key={tab.type} type="button"
                          onClick={() => { setMediaContentType(tab.type); setSelectedMediaFiles([]); setMediaUrl(''); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                            mediaContentType === tab.type
                              ? 'bg-white text-orange-600 shadow-sm border border-slate-150 scale-[1.02]'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <tab.icon className="w-3.5 h-3.5" />{tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {mediaContentType === 'video' ? 'Video Title' : mediaContentType === 'pdf' ? 'PDF Title' : 'Image Title'}
                      </label>
                      <input type="text" value={mediaTitle} onChange={e => setMediaTitle(e.target.value)}
                        placeholder={mediaContentType === 'video' ? 'e.g. Chapter 1: Introduction' : mediaContentType === 'pdf' ? 'e.g. Lecture Notes' : 'e.g. Course Banner'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100/40 transition-all shadow-sm"
                      />
                    </div>

                    {/* File Upload Zone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Upload File</label>
                      <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-2xl py-8 cursor-pointer transition-all duration-200 ${
                        selectedMediaFiles.length > 0 ? 'border-orange-300 bg-orange-50/20' : 'border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-orange-50/10'
                      }`}>
                        <input type="file" className="hidden"
                          accept={mediaContentType === 'video' ? 'video/*' : mediaContentType === 'pdf' ? 'application/pdf' : 'image/*'}
                          multiple={mediaContentType === 'video'}
                          onChange={e => setSelectedMediaFiles(Array.from(e.target.files || []))}
                        />
                        {selectedMediaFiles.length > 0 ? (
                          <div className="text-center px-4">
                            <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-sm animate-bounce">
                              <Upload className="w-5 h-5 text-orange-500" />
                            </div>
                            <p className="text-sm font-bold text-orange-600">{selectedMediaFiles.length} file{selectedMediaFiles.length > 1 ? 's' : ''} selected</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1 truncate max-w-[200px] mx-auto">{selectedMediaFiles[0].name}</p>
                            <button type="button" onClick={e => { e.preventDefault(); setSelectedMediaFiles([]); }} className="mt-2 text-xs text-red-500 hover:text-red-600 font-bold hover:underline">Remove</button>
                          </div>
                        ) : (
                          <div className="text-center px-4">
                            <div className="w-12 h-12 bg-white border border-slate-150 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-sm group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Click to select file</p>
                            <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase mt-1">{mediaContentType === 'video' ? 'MP4, MOV, MKV' : mediaContentType === 'pdf' ? 'PDF only' : 'JPG, PNG, WebP'}</p>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* OR divider + URL input (video only) */}
                    {mediaContentType === 'video' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-slate-100" />
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or paste URL</span>
                          <div className="flex-1 h-px bg-slate-100" />
                        </div>
                        <input type="text" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                          placeholder="Bunny video ID or CDN URL"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100/40 transition-all shadow-sm"
                        />
                      </div>
                    )}

                    {/* Access Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Access Mode</label>
                      <div className="flex gap-2">
                        {[{ val: 'free', label: 'Free Preview' }, { val: 'paid', label: 'Paid Only' }].map(opt => (
                          <button key={opt.val} type="button" onClick={() => setMediaAccessType(opt.val)}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all duration-200 ${
                              mediaAccessType === opt.val
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-150 scale-[1.01]'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-orange-355 hover:text-slate-700'
                            }`}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Upload Button */}
                    <button type="button" onClick={handleUploadMedia}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-orange-150 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Upload className="w-4 h-4" />
                      Upload {mediaContentType === 'video' ? 'Video' : mediaContentType === 'pdf' ? 'PDF' : 'Image'}
                    </button>
                  </div>
                </div>

                {/* RIGHT — Uploads List */}
                <div className="flex-1 flex flex-col md:overflow-hidden min-h-[500px] md:min-h-0 bg-[#f8fafc]">
                  <div className="flex-shrink-0 px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 bg-white shadow-sm">
                    <div>
                      <h3 className="text-base font-black text-slate-800 leading-tight">Uploaded Content</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-1">{allUploads.length} item{allUploads.length !== 1 ? 's' : ''} · {courseVideos.length} videos · {coursePdfs.length} PDFs</p>
                    </div>
                    {/* Filter tabs */}
                    <div className="flex flex-wrap bg-slate-50 border border-slate-150 rounded-xl p-1 gap-1 w-full sm:w-auto">
                      {[
                        { key: 'all',   label: 'All',    count: allUploads.length },
                        { key: 'video', label: 'Videos', count: courseVideos.length },
                        { key: 'pdf',   label: 'PDFs',   count: coursePdfs.length },
                        { key: 'image', label: 'Images', count: courseImages.length },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setUploadContentFilter(tab.key)}
                          className={`flex items-center gap-2 px-3.5 py-1.8 rounded-lg text-xs font-bold transition-all duration-200 ${
                            uploadContentFilter === tab.key
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab.label}
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                            uploadContentFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-400'
                          }`}>{tab.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inline video preview */}
                  {previewUrl && (
                    <div className="mx-8 mt-6 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-md flex-shrink-0">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                        <p className="text-sm font-bold text-slate-700 truncate">{previewTitle || 'Preview'}</p>
                        <button onClick={() => { setPreviewUrl(''); setPreviewTitle(''); }} className="text-xs text-slate-400 hover:text-slate-600 font-bold px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">Close</button>
                      </div>
                      {previewUrl.includes('iframe.mediadelivery.net') || previewUrl.includes('/embed/') ? (
                        <div className="relative pt-[40%] w-full bg-black">
                          <iframe src={previewUrl} loading="lazy" className="absolute inset-0 w-full h-full border-0" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen />
                        </div>
                      ) : (
                        <video controls className="w-full max-h-72 bg-black" src={previewUrl} />
                      )}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-8">
                    {allUploads.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 py-24 flex flex-col items-center gap-4 text-center shadow-sm max-w-lg mx-auto mt-10">
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 shadow-sm transition-transform duration-300 hover:rotate-6">
                          <Upload className="w-6 h-6 text-orange-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-800">No content uploaded yet</p>
                          <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs leading-relaxed">
                            Use the panel on the left to upload your video lectures, study notes, or images.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden w-full">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4 w-12">#</th>
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-4">Title</th>
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-4">Type</th>
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-4">Access</th>
                                <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-5 py-4">Status</th>
                                <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {(() => {
                                const filtered = uploadContentFilter === 'all'
                                  ? allUploads
                                  : allUploads.filter(i => i.contentType === uploadContentFilter);
                                if (filtered.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={6} className="py-16 text-center text-sm font-semibold text-slate-400">
                                        No {uploadContentFilter}s uploaded yet.
                                      </td>
                                    </tr>
                                  );
                                }
                                return filtered.map((item, idx) => {
                                  const isVideo = item.contentType === 'video';
                                  const isPdf = item.contentType === 'pdf';
                                  const typeColor = isVideo ? 'bg-blue-50 border-blue-100 text-blue-500' : isPdf ? 'bg-violet-50 border-violet-100 text-violet-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500';
                                  const TypeIcon = isVideo ? Video : isPdf ? FileText : Image;
                                  const addedDate = item.addedAt ? (() => { try { const d = new Date(item.addedAt); return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return ''; } })() : '';
                                  return (
                                    <motion.tr key={item.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="px-6 py-4 text-xs font-semibold text-slate-300">{idx + 1}</td>
                                      <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeColor}`}>
                                            <TypeIcon className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate max-w-[220px]">{item.title || 'Untitled'}</p>
                                            {addedDate && <p className="text-xs font-semibold text-slate-400 mt-0.5">{addedDate}</p>}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${typeColor}`}>{item.contentType}</span>
                                      </td>
                                      <td className="px-5 py-4">
                                        <span className={`text-xs font-bold ${item.accessType === 'free' ? 'text-emerald-600' : 'text-slate-500'}`}>{item.accessType === 'free' ? 'Free' : 'Paid'}</span>
                                      </td>
                                      <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                          item.status === 'Approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : item.status === 'Rejected' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-amber-50 border-amber-100 text-amber-600'
                                        }`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Approved' ? 'bg-emerald-500' : item.status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                          {item.status === 'Approved' ? 'Approved' : item.status === 'Rejected' ? 'Rejected' : 'Pending'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {isVideo && item.url && (
                                            <button type="button" onClick={() => { setPreviewUrl(item.url); setPreviewTitle(item.title); }}
                                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-all">Preview</button>
                                          )}
                                          {item.url && (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                                              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-600 text-xs font-bold rounded-lg transition-all">Open</a>
                                          )}
                                          <button onClick={() => handleRemoveMedia(item.id, item.contentType)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete Content"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </motion.tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-400">
                            <span className="font-bold text-slate-700">{allUploads.filter(i => i.status === 'Approved').length}</span> approved
                            {allUploads.filter(i => i.status !== 'Approved').length > 0 && <> · <span className="font-bold text-amber-600">{allUploads.filter(i => i.status !== 'Approved').length}</span> pending</>}
                          </p>
                          <p className="text-xs font-semibold text-slate-400">
                            {uploadContentFilter === 'all' ? allUploads.length : allUploads.filter(i => i.contentType === uploadContentFilter).length} {uploadContentFilter === 'all' ? 'total' : uploadContentFilter + 's'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}
      {/* Withdraw Funds Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-6 shadow-2xl max-w-sm w-full relative z-10 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">Withdraw Funds</h3>
                <button 
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100/50 flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-bold">Available Balance</span>
                  <span className="text-base font-black text-orange-600">₹{availableBalance.toLocaleString()}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Amount to Withdraw</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={availableBalance}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-gray-50 pl-8 pr-4 py-3.5 rounded-xl border-2 border-transparent focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-gray-900 text-sm"
                    />
                  </div>
                </div>

                {(!profileData.bankAccount || !profileData.ifscCode) && (
                  <div className="bg-amber-50 text-amber-700 p-3.5 rounded-xl text-[11px] font-semibold border border-amber-100/50 leading-relaxed">
                    ⚠️ Please configure bank details in the Profile tab first to receive payouts.
                  </div>
                )}

                <button
                  onClick={handleRequestPayout}
                  disabled={availableBalance <= 0 || !payoutAmount}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-extrabold py-4 rounded-xl transition-all shadow-lg shadow-orange-100 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  💳 Confirm Payout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
