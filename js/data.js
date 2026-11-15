export const SUBJECTS = [
  { key: 'dsa', label: 'Data Structures' },
  { key: 'maths', label: 'Engg. Mathematics' },
  { key: 'dbms', label: 'Database Systems' },
  { key: 'comm', label: 'Professional Comm.' },
  { key: 'lab', label: 'Practical Lab' },
];

export const DEFAULT_THRESHOLDS = {
  passScore: 40,
  alertScore: 55,
  alertAttendance: 75,
  reviewScore: 68,
  reviewAttendance: 82,
};

export const DEFAULT_FACULTY_PROFILE = {
  name: 'Dr. Meenakshi Sundaram',
  designation: 'Dean of Academics',
  facultyId: 'FAC-IN-408',
  department: 'Computer Science & Engg.',
  email: 'm.sundaram@nit-campus.ac.in',
  office: 'Academic Block A, Room 214',
  officeHours: 'Mon–Fri · 2:30 PM – 4:30 PM IST',
  bio: 'Overseeing undergraduate CBCS academic progression, early-warning mentorship, and UGC 75% attendance compliance.',
};

export const INITIAL_STUDENTS = [
  {
    id: '24CSE101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@nit-campus.ac.in',
    department: 'Computer Science & Engg.',
    programme: 'B.Tech (CSE)',
    term: 'Odd Sem 2026',
    year: '3rd Year',
    credits: 22,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '2 hours ago',
    attendance: 94,
    completion: 97,
    scores: { dsa: 92, maths: 89, dbms: 94, comm: 86, lab: 95 },
    milestones: [86, 89, 92, 91],
    notes: [
      { date: '2026-10-18', action: 'Merit Commendation', text: 'Scored 94% in DBMS and led Practical Lab project showcase.' },
    ],
  },
  {
    id: '24CSE102',
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@nit-campus.ac.in',
    department: 'Computer Science & Engg.',
    programme: 'B.Tech (CSE)',
    term: 'Odd Sem 2026',
    year: '2nd Year',
    credits: 20,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '5 days ago',
    attendance: 67,
    completion: 71,
    scores: { dsa: 48, maths: 44, dbms: 54, comm: 66, lab: 51 },
    milestones: [58, 54, 51, 53],
    notes: [
      { date: '2026-10-29', action: 'Attendance Shortage Notice', text: 'Attendance dropped to 67% (< 75% UGC norm). Parent & mentor intimation issued.' },
    ],
  },
  {
    id: '24ECE103',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@nit-campus.ac.in',
    department: 'Electronics & Comm.',
    programme: 'B.Tech (ECE)',
    term: 'Odd Sem 2026',
    year: '4th Year',
    credits: 18,
    advisor: 'Prof. Rajeshwar Iyer',
    lastActive: '1 hour ago',
    attendance: 95,
    completion: 96,
    scores: { dsa: 85, maths: 94, dbms: 88, comm: 84, lab: 91 },
    milestones: [84, 87, 89, 88],
    notes: [],
  },
  {
    id: '24ME104',
    name: 'Vikramaditya Rao',
    email: 'vikram.rao@nit-campus.ac.in',
    department: 'Mechanical Engg.',
    programme: 'B.Tech (ME)',
    term: 'Odd Sem 2026',
    year: '3rd Year',
    credits: 21,
    advisor: 'Prof. Arvind Kulkarni',
    lastActive: 'Yesterday',
    attendance: 88,
    completion: 90,
    scores: { dsa: 72, maths: 77, dbms: 79, comm: 82, lab: 88 },
    milestones: [74, 77, 80, 80],
    notes: [],
  },
  {
    id: '24COM105',
    name: 'Diya Nair',
    email: 'diya.nair@nit-campus.ac.in',
    department: 'Commerce & Economics',
    programme: 'B.Com (Hons)',
    term: 'Odd Sem 2026',
    year: '2nd Year',
    credits: 20,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '3 days ago',
    attendance: 73,
    completion: 76,
    scores: { dsa: 58, maths: 54, dbms: 65, comm: 74, lab: 61 },
    milestones: [66, 63, 61, 62],
    notes: [
      { date: '2026-11-02', action: 'Remedial Class Referral', text: 'Assigned evening tutorial batch for Quantitative Mathematics.' },
    ],
  },
  {
    id: '24CSE106',
    name: 'Karthik Subramanian',
    email: 'karthik.s@nit-campus.ac.in',
    department: 'Computer Science & Engg.',
    programme: 'B.Tech (CSE)',
    term: 'Odd Sem 2026',
    year: '3rd Year',
    credits: 22,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '4 hours ago',
    attendance: 91,
    completion: 94,
    scores: { dsa: 88, maths: 83, dbms: 87, comm: 79, lab: 90 },
    milestones: [81, 84, 86, 85],
    notes: [],
  },
  {
    id: '24COM107',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@nit-campus.ac.in',
    department: 'Commerce & Economics',
    programme: 'B.Com (Hons)',
    term: 'Odd Sem 2026',
    year: '4th Year',
    credits: 18,
    advisor: 'Dr. Kavita Deshpande',
    lastActive: '3 hours ago',
    attendance: 96,
    completion: 97,
    scores: { dsa: 81, maths: 84, dbms: 89, comm: 93, lab: 86 },
    milestones: [83, 85, 87, 87],
    notes: [],
  },
  {
    id: '24ME108',
    name: 'Arjun Malhotra',
    email: 'arjun.malhotra@nit-campus.ac.in',
    department: 'Mechanical Engg.',
    programme: 'B.Tech (ME)',
    term: 'Odd Sem 2026',
    year: '1st Year',
    credits: 20,
    advisor: 'Prof. Arvind Kulkarni',
    lastActive: '8 days ago',
    attendance: 61,
    completion: 64,
    scores: { dsa: 38, maths: 36, dbms: 46, comm: 55, lab: 49 },
    milestones: [48, 45, 43, 45],
    notes: [],
  },
  {
    id: '24ECE109',
    name: 'Meera Krishnan',
    email: 'meera.krishnan@nit-campus.ac.in',
    department: 'Electronics & Comm.',
    programme: 'B.Tech (ECE)',
    term: 'Odd Sem 2026',
    year: '2nd Year',
    credits: 21,
    advisor: 'Prof. Rajeshwar Iyer',
    lastActive: 'Yesterday',
    attendance: 89,
    completion: 91,
    scores: { dsa: 79, maths: 87, dbms: 83, comm: 77, lab: 81 },
    milestones: [77, 80, 82, 81],
    notes: [],
  },
  {
    id: '24CSE110',
    name: 'Siddharth Joshi',
    email: 'siddharth.joshi@nit-campus.ac.in',
    department: 'Computer Science & Engg.',
    programme: 'B.Tech (CSE)',
    term: 'Odd Sem 2026',
    year: '1st Year',
    credits: 20,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '2 days ago',
    attendance: 79,
    completion: 82,
    scores: { dsa: 69, maths: 65, dbms: 72, comm: 71, lab: 74 },
    milestones: [67, 69, 71, 70],
    notes: [],
  },
  {
    id: '24COM111',
    name: 'Pooja Verma',
    email: 'pooja.verma@nit-campus.ac.in',
    department: 'Commerce & Economics',
    programme: 'B.Com (Hons)',
    term: 'Even Sem 2026',
    year: '3rd Year',
    credits: 20,
    advisor: 'Dr. Kavita Deshpande',
    lastActive: '5 hours ago',
    attendance: 92,
    completion: 95,
    scores: { dsa: 78, maths: 81, dbms: 88, comm: 92, lab: 84 },
    milestones: [81, 83, 85, 85],
    notes: [],
  },
  {
    id: '24CSE112',
    name: 'Aditya Chatterjee',
    email: 'aditya.chatterjee@nit-campus.ac.in',
    department: 'Computer Science & Engg.',
    programme: 'B.Tech (CSE)',
    term: 'Even Sem 2026',
    year: '4th Year',
    credits: 18,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '1 hour ago',
    attendance: 96,
    completion: 98,
    scores: { dsa: 95, maths: 91, dbms: 93, comm: 85, lab: 94 },
    milestones: [89, 91, 92, 92],
    notes: [],
  },
  {
    id: '24ME113',
    name: 'Kavya Reddy',
    email: 'kavya.reddy@nit-campus.ac.in',
    department: 'Mechanical Engg.',
    programme: 'B.Tech (ME)',
    term: 'Even Sem 2026',
    year: '2nd Year',
    credits: 21,
    advisor: 'Prof. Arvind Kulkarni',
    lastActive: 'Yesterday',
    attendance: 86,
    completion: 89,
    scores: { dsa: 70, maths: 74, dbms: 78, comm: 81, lab: 87 },
    milestones: [74, 76, 78, 78],
    notes: [],
  },
  {
    id: '24ECE114',
    name: 'Pranav Kulkarni',
    email: 'pranav.kulkarni@nit-campus.ac.in',
    department: 'Electronics & Comm.',
    programme: 'B.Tech (ECE)',
    term: 'Even Sem 2026',
    year: '3rd Year',
    credits: 20,
    advisor: 'Prof. Rajeshwar Iyer',
    lastActive: '4 days ago',
    attendance: 71,
    completion: 75,
    scores: { dsa: 56, maths: 59, dbms: 61, comm: 58, lab: 57 },
    milestones: [61, 59, 58, 58],
    notes: [
      { date: '2026-04-12', action: 'Mentor 1:1 Check-In', text: 'Reviewed lab attendance shortage and mapped makeup practical hours.' },
    ],
  },
  {
    id: '24ECE115',
    name: 'Nandini Menon',
    email: 'nandini.menon@nit-campus.ac.in',
    department: 'Electronics & Comm.',
    programme: 'B.Tech (ECE)',
    term: 'Even Sem 2026',
    year: '4th Year',
    credits: 18,
    advisor: 'Prof. Rajeshwar Iyer',
    lastActive: '6 hours ago',
    attendance: 93,
    completion: 94,
    scores: { dsa: 86, maths: 92, dbms: 89, comm: 82, lab: 85 },
    milestones: [83, 86, 87, 87],
    notes: [],
  },
  {
    id: '24COM116',
    name: 'Varun Kapoor',
    email: 'varun.kapoor@nit-campus.ac.in',
    department: 'Commerce & Economics',
    programme: 'B.Com (Hons)',
    term: 'Even Sem 2026',
    year: '1st Year',
    credits: 20,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '7 days ago',
    attendance: 64,
    completion: 67,
    scores: { dsa: 46, maths: 42, dbms: 52, comm: 61, lab: 50 },
    milestones: [55, 52, 50, 50],
    notes: [],
  },
  {
    id: '24ME117',
    name: 'Ishita Banerjee',
    email: 'ishita.banerjee@nit-campus.ac.in',
    department: 'Mechanical Engg.',
    programme: 'B.Tech (ME)',
    term: 'Even Sem 2026',
    year: '3rd Year',
    credits: 21,
    advisor: 'Prof. Arvind Kulkarni',
    lastActive: 'Yesterday',
    attendance: 90,
    completion: 92,
    scores: { dsa: 76, maths: 79, dbms: 83, comm: 87, lab: 91 },
    milestones: [79, 81, 83, 83],
    notes: [],
  },
  {
    id: '24CSE118',
    name: 'Harshvardhan Patel',
    email: 'harsh.patel@nit-campus.ac.in',
    department: 'Computer Science & Engg.',
    programme: 'B.Tech (CSE)',
    term: 'Odd Sem 2025',
    year: '2nd Year',
    credits: 21,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: 'Yesterday',
    attendance: 84,
    completion: 87,
    scores: { dsa: 80, maths: 77, dbms: 79, comm: 74, lab: 83 },
    milestones: [75, 77, 79, 79],
    notes: [],
  },
  {
    id: '24COM119',
    name: 'Riya Sengupta',
    email: 'riya.sengupta@nit-campus.ac.in',
    department: 'Commerce & Economics',
    programme: 'B.Com (Hons)',
    term: 'Odd Sem 2025',
    year: '4th Year',
    credits: 18,
    advisor: 'Dr. Kavita Deshpande',
    lastActive: '5 hours ago',
    attendance: 89,
    completion: 91,
    scores: { dsa: 75, maths: 80, dbms: 85, comm: 89, lab: 79 },
    milestones: [78, 80, 82, 82],
    notes: [],
  },
  {
    id: '24ECE120',
    name: 'Nikhil Agrawal',
    email: 'nikhil.agrawal@nit-campus.ac.in',
    department: 'Electronics & Comm.',
    programme: 'B.Tech (ECE)',
    term: 'Odd Sem 2025',
    year: '2nd Year',
    credits: 20,
    advisor: 'Prof. Rajeshwar Iyer',
    lastActive: '3 days ago',
    attendance: 76,
    completion: 79,
    scores: { dsa: 66, maths: 70, dbms: 68, comm: 65, lab: 67 },
    milestones: [65, 67, 68, 67],
    notes: [],
  },
  {
    id: '24ME121',
    name: 'Tanvi Gokhale',
    email: 'tanvi.gokhale@nit-campus.ac.in',
    department: 'Mechanical Engg.',
    programme: 'B.Tech (ME)',
    term: 'Odd Sem 2025',
    year: '4th Year',
    credits: 18,
    advisor: 'Prof. Arvind Kulkarni',
    lastActive: '2 hours ago',
    attendance: 95,
    completion: 96,
    scores: { dsa: 82, maths: 85, dbms: 87, comm: 89, lab: 93 },
    milestones: [84, 86, 87, 87],
    notes: [],
  },
  {
    id: '24CSE122',
    name: 'Devansh Mehta',
    email: 'devansh.mehta@nit-campus.ac.in',
    department: 'Computer Science & Engg.',
    programme: 'B.Tech (CSE)',
    term: 'Odd Sem 2025',
    year: '1st Year',
    credits: 20,
    advisor: 'Dr. Meenakshi Sundaram',
    lastActive: '9 days ago',
    attendance: 58,
    completion: 60,
    scores: { dsa: 36, maths: 34, dbms: 42, comm: 51, lab: 44 },
    milestones: [45, 43, 41, 41],
    notes: [
      { date: '2025-11-19', action: 'Remedial Class Referral', text: 'Enrolled in peer mentorship for Data Structures and Calculus.' },
    ],
  },
  {
    id: '24ECE123',
    name: 'Shruti Tiwari',
    email: 'shruti.tiwari@nit-campus.ac.in',
    department: 'Electronics & Comm.',
    programme: 'B.Tech (ECE)',
    term: 'Odd Sem 2025',
    year: '3rd Year',
    credits: 21,
    advisor: 'Prof. Rajeshwar Iyer',
    lastActive: 'Yesterday',
    attendance: 91,
    completion: 94,
    scores: { dsa: 84, maths: 91, dbms: 87, comm: 81, lab: 86 },
    milestones: [82, 85, 86, 86],
    notes: [],
  },
  {
    id: '24COM124',
    name: 'Aishwarya Pillai',
    email: 'aishwarya.pillai@nit-campus.ac.in',
    department: 'Commerce & Economics',
    programme: 'B.Com (Hons)',
    term: 'Odd Sem 2025',
    year: '3rd Year',
    credits: 20,
    advisor: 'Dr. Kavita Deshpande',
    lastActive: '2 days ago',
    attendance: 83,
    completion: 85,
    scores: { dsa: 71, maths: 74, dbms: 80, comm: 83, lab: 75 },
    milestones: [73, 75, 77, 77],
    notes: [],
  },
];

const STORAGE_KEY = 'scholametrics_in_students_v1';
const THRESHOLDS_KEY = 'scholametrics_in_thresholds_v1';
const PROFILE_KEY = 'scholametrics_in_faculty_profile_v1';
const ATTENDANCE_SESSIONS_KEY = 'scholametrics_in_attendance_v1';
const THEME_KEY = 'scholametrics_theme_v1';

export function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(INITIAL_STUDENTS);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : structuredClone(INITIAL_STUDENTS);
  } catch {
    return structuredClone(INITIAL_STUDENTS);
  }
}

export function saveStudents(students) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetStoredStudents() {
  const fresh = structuredClone(INITIAL_STUDENTS);
  saveStudents(fresh);
  try {
    localStorage.removeItem(ATTENDANCE_SESSIONS_KEY);
  } catch {
    // Ignore storage errors
  }
  return fresh;
}

export function loadAttendanceSessions() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttendanceSessions(sessions) {
  try {
    localStorage.setItem(ATTENDANCE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadThresholds() {
  try {
    const raw = localStorage.getItem(THRESHOLDS_KEY);
    if (!raw) return { ...DEFAULT_THRESHOLDS };
    return { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_THRESHOLDS };
  }
}

export function saveThresholds(thresholds) {
  try {
    localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadFacultyProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_FACULTY_PROFILE };
    return { ...DEFAULT_FACULTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_FACULTY_PROFILE };
  }
}

export function saveFacultyProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage quota errors
  }
}
