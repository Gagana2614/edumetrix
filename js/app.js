import {
  SUBJECTS,
  DEFAULT_THRESHOLDS,
  loadStudents,
  saveStudents,
  resetStoredStudents,
  loadAttendanceSessions,
  saveAttendanceSessions,
  loadThresholds,
  saveThresholds,
  loadFacultyProfile,
  saveFacultyProfile,
  loadTheme,
  saveTheme,
} from './data.js';
import {
  enrichStudent,
  scoreToCgpa,
  scoreToLetter,
  getStudentStanding,
  computeCohortSummary,
  computeGradeDistribution,
  computeMilestoneTrends,
  computeSubjectStats,
  computeDepartmentStats,
  computePercentileRank,
  studentsToCsv,
  parseCsvStudents,
} from './analytics.js';
import { renderTrendChart, renderGradeChart, renderScatterChart } from './charts.js';

const FACULTY_PORTRAIT = new URL('../src/assets/images/avatar_indian_dean_1794732658457.jpg', import.meta.url).href;
const STUDENT_PORTRAIT = new URL('../src/assets/images/avatar_indian_student_1794732658725.jpg', import.meta.url).href;

const VIEW_LABELS = {
  overview: 'Overview',
  students: 'Student Roster',
  attendance: 'Attendance Register',
  subjects: 'Subjects & Branches',
  interventions: 'Intervention Queue',
  reports: 'Reports & CSV',
  'student-dashboard': 'My Dashboard',
  'student-simulator': 'CGPA Simulator',
  'student-advising': 'Grade Card & Mentor',
  profile: 'My Profile',
};

const state = {
  students: loadStudents(),
  attendanceSessions: loadAttendanceSessions(),
  attendanceDraft: {
    date: new Date().toISOString().slice(0, 10),
    subject: 'dsa',
    department: 'all',
    term: 'all',
    marks: {},
  },
  thresholds: loadThresholds(),
  facultyProfile: loadFacultyProfile(),
  role: 'faculty',
  activeStudentId: '24CSE101',
  simulatorState: null,
  activeView: 'overview',
  filters: {
    term: 'all',
    department: 'all',
    status: 'all',
    gradeTier: null,
    search: '',
  },
  trendMode: 'score',
  queueFilter: 'flagged',
  sort: { key: 'average', dir: 'desc' },
  selectedStudentId: null,
  theme: loadTheme(),
  ai: {
    cohort: { status: 'idle', data: null, error: '', cacheKey: '' },
    studentById: {},
    drawerById: {},
  },
};

if (!state.students.some((s) => s.id === state.activeStudentId) && state.students.length) {
  state.activeStudentId = state.students[0].id;
}

const els = {
  sidebar: document.getElementById('sidebar'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  roleBtns: document.querySelectorAll('.role-btn[data-role]'),
  facultyNav: document.getElementById('facultyNav'),
  studentNav: document.getElementById('studentNav'),
  navItems: document.querySelectorAll('.nav-item[data-view]'),
  navStudentCount: document.getElementById('navStudentCount'),
  navAlertCount: document.getElementById('navAlertCount'),
  sidebarPortalMeta: document.getElementById('sidebarPortalMeta'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeToggleLabel: document.getElementById('themeToggleLabel'),
  themeIconSun: document.getElementById('themeIconSun'),
  themeIconMoon: document.getElementById('themeIconMoon'),

  breadcrumbPortal: document.getElementById('breadcrumbPortal'),
  breadcrumbTerm: document.getElementById('breadcrumbTerm'),
  breadcrumbView: document.getElementById('breadcrumbView'),

  // Toolbars
  cohortFilterToolbar: document.getElementById('cohortFilterToolbar'),
  studentContextToolbar: document.getElementById('studentContextToolbar'),
  toolbarStudentSelect: document.getElementById('toolbarStudentSelect'),
  studentContextMeta: document.getElementById('studentContextMeta'),
  studentContextStanding: document.getElementById('studentContextStanding'),

  filterTerm: document.getElementById('filterTerm'),
  filterDepartment: document.getElementById('filterDepartment'),
  filterStatus: document.getElementById('filterStatus'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  filterSummary: document.getElementById('filterSummary'),

  // Top Bar Actions & Profile Menu
  openMarkAttendanceBtn: document.getElementById('openMarkAttendanceBtn'),
  openAddStudentBtn: document.getElementById('openAddStudentBtn'),
  studentPrintBtn: document.getElementById('studentPrintBtn'),
  profileTriggerBtn: document.getElementById('profileTriggerBtn'),
  profilePopover: document.getElementById('profilePopover'),
  topProfilePhoto: document.getElementById('topProfilePhoto'),
  topProfileFallbackIcon: document.getElementById('topProfileFallbackIcon'),
  topProfileName: document.getElementById('topProfileName'),
  topProfileRole: document.getElementById('topProfileRole'),
  popoverProfilePhoto: document.getElementById('popoverProfilePhoto'),
  popoverFallbackIcon: document.getElementById('popoverFallbackIcon'),
  popoverProfileName: document.getElementById('popoverProfileName'),
  popoverProfileMeta: document.getElementById('popoverProfileMeta'),
  popoverCaseload: document.getElementById('popoverCaseload'),
  studentSwitchSection: document.getElementById('studentSwitchSection'),
  activeStudentSelect: document.getElementById('activeStudentSelect'),
  thresholdsForm: document.getElementById('thresholdsForm'),
  thresholdAlertScore: document.getElementById('thresholdAlertScore'),
  thresholdAlertAtt: document.getElementById('thresholdAlertAtt'),
  resetThresholdsBtn: document.getElementById('resetThresholdsBtn'),
  popoverOpenProfileBtn: document.getElementById('popoverOpenProfileBtn'),
  popoverSwitchRoleBtn: document.getElementById('popoverSwitchRoleBtn'),
  popoverOpenQueueBtn: document.getElementById('popoverOpenQueueBtn'),
  popoverExportBtn: document.getElementById('popoverExportBtn'),

  views: document.querySelectorAll('.view-section'),

  // Faculty Overview
  kpiMeanCgpa: document.getElementById('kpiMeanCgpa'),
  kpiCgpaMeta: document.getElementById('kpiCgpaMeta'),
  meterMeanCgpa: document.getElementById('meterMeanCgpa'),
  kpiPassRate: document.getElementById('kpiPassRate'),
  kpiPassMeta: document.getElementById('kpiPassMeta'),
  meterPassRate: document.getElementById('meterPassRate'),
  kpiAttendance: document.getElementById('kpiAttendance'),
  kpiCorrMeta: document.getElementById('kpiCorrMeta'),
  meterAttendance: document.getElementById('meterAttendance'),
  kpiAlertCount: document.getElementById('kpiAlertCount'),
  kpiAlertMeta: document.getElementById('kpiAlertMeta'),
  meterAlertCount: document.getElementById('meterAlertCount'),
  standingLegend: document.getElementById('standingLegend'),
  standingBar: document.getElementById('standingBar'),

  trendModeBtns: document.querySelectorAll('[data-trend-mode]'),
  trendChartSvg: document.getElementById('trendChartSvg'),
  trendTooltip: document.getElementById('trendTooltip'),
  gradeChartSvg: document.getElementById('gradeChartSvg'),
  gradeTooltip: document.getElementById('gradeTooltip'),
  clearGradeFilterBtn: document.getElementById('clearGradeFilterBtn'),
  scatterCanvas: document.getElementById('scatterCanvas'),
  scatterTooltip: document.getElementById('scatterTooltip'),
  regressionFormula: document.getElementById('regressionFormula'),
  watchlistContainer: document.getElementById('watchlistContainer'),
  viewAllAlertsBtn: document.getElementById('viewAllAlertsBtn'),
  cohortAiForm: document.getElementById('cohortAiForm'),
  cohortAiPromptInput: document.getElementById('cohortAiPromptInput'),
  generateCohortAiBtn: document.getElementById('generateCohortAiBtn'),
  cohortAiSubtext: document.getElementById('cohortAiSubtext'),
  cohortAiBody: document.getElementById('cohortAiBody'),

  // Students Table
  studentSearchInput: document.getElementById('studentSearchInput'),
  studentsTableBody: document.getElementById('studentsTableBody'),
  studentsEmptyState: document.getElementById('studentsEmptyState'),
  emptyResetBtn: document.getElementById('emptyResetBtn'),
  sortBtns: document.querySelectorAll('.sort-btn[data-sort]'),
  exportCsvQuickBtn: document.getElementById('exportCsvQuickBtn'),

  // Subjects & Cohorts
  subjectBenchmarkList: document.getElementById('subjectBenchmarkList'),
  departmentTableBody: document.getElementById('departmentTableBody'),
  subjectStatsBody: document.getElementById('subjectStatsBody'),

  // Intervention Queue
  interventionsSubtitle: document.getElementById('interventionsSubtitle'),
  queueFilterBtns: document.querySelectorAll('[data-queue-filter]'),
  interventionQueueList: document.getElementById('interventionQueueList'),

  // Attendance Register
  attSessionDate: document.getElementById('attSessionDate'),
  attSessionSubject: document.getElementById('attSessionSubject'),
  attSessionDept: document.getElementById('attSessionDept'),
  attSessionTerm: document.getElementById('attSessionTerm'),
  attSessionSummaryStrip: document.getElementById('attSessionSummaryStrip'),
  attendanceRegisterBody: document.getElementById('attendanceRegisterBody'),
  attendanceEmptyState: document.getElementById('attendanceEmptyState'),
  attendanceHistoryList: document.getElementById('attendanceHistoryList'),
  markAllPresentBtn: document.getElementById('markAllPresentBtn'),
  saveAttendanceRegisterBtn: document.getElementById('saveAttendanceRegisterBtn'),

  // Reports & CSV
  csvDropzone: document.getElementById('csvDropzone'),
  csvFileInput: document.getElementById('csvFileInput'),
  downloadTemplateBtn: document.getElementById('downloadTemplateBtn'),
  importFeedback: document.getElementById('importFeedback'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  printReportBtn: document.getElementById('printReportBtn'),
  resetSampleDataBtn: document.getElementById('resetSampleDataBtn'),

  // Student Portal Views
  studentDashSubtitle: document.getElementById('studentDashSubtitle'),
  openSimulatorFromDashBtn: document.getElementById('openSimulatorFromDashBtn'),
  openAdvisingFromDashBtn: document.getElementById('openAdvisingFromDashBtn'),
  stuKpiCgpa: document.getElementById('stuKpiCgpa'),
  stuMeterCgpa: document.getElementById('stuMeterCgpa'),
  stuKpiCgpaDelta: document.getElementById('stuKpiCgpaDelta'),
  stuKpiScore: document.getElementById('stuKpiScore'),
  stuMeterScore: document.getElementById('stuMeterScore'),
  stuKpiPercentile: document.getElementById('stuKpiPercentile'),
  stuKpiAttendance: document.getElementById('stuKpiAttendance'),
  stuMeterAttendance: document.getElementById('stuMeterAttendance'),
  stuKpiAttendanceMeta: document.getElementById('stuKpiAttendanceMeta'),
  stuKpiCompletion: document.getElementById('stuKpiCompletion'),
  stuMeterCompletion: document.getElementById('stuMeterCompletion'),
  stuKpiCredits: document.getElementById('stuKpiCredits'),
  studentVsCohortList: document.getElementById('studentVsCohortList'),
  studentTrendSvg: document.getElementById('studentTrendSvg'),
  studentTrendTooltip: document.getElementById('studentTrendTooltip'),
  stuDashStandingBadge: document.getElementById('stuDashStandingBadge'),
  stuDashDiagnostics: document.getElementById('stuDashDiagnostics'),
  stuDashNotes: document.getElementById('stuDashNotes'),
  studentAiForm: document.getElementById('studentAiForm'),
  studentAiPromptInput: document.getElementById('studentAiPromptInput'),
  generateStudentAiBtn: document.getElementById('generateStudentAiBtn'),
  studentAiBody: document.getElementById('studentAiBody'),

  // Simulator
  simulatorInputsContainer: document.getElementById('simulatorInputsContainer'),
  resetSimulatorBtn: document.getElementById('resetSimulatorBtn'),
  simCgpa: document.getElementById('simCgpa'),
  simCgpaDelta: document.getElementById('simCgpaDelta'),
  simAvg: document.getElementById('simAvg'),
  simAvgDelta: document.getElementById('simAvgDelta'),
  simLetter: document.getElementById('simLetter'),
  simPercentile: document.getElementById('simPercentile'),
  simStandingBadge: document.getElementById('simStandingBadge'),
  simAdviceText: document.getElementById('simAdviceText'),

  // Student Advising & Grade Card
  studentTranscriptBody: document.getElementById('studentTranscriptBody'),
  studentSelfLogForm: document.getElementById('studentSelfLogForm'),
  studentSelfActionSelect: document.getElementById('studentSelfActionSelect'),
  studentSelfNoteInput: document.getElementById('studentSelfNoteInput'),
  studentAdvisingHistoryList: document.getElementById('studentAdvisingHistoryList'),
  studentAttLogSummary: document.getElementById('studentAttLogSummary'),
  studentAttendanceLogList: document.getElementById('studentAttendanceLogList'),

  // Dedicated Profile View
  profileSubtitle: document.getElementById('profileSubtitle'),
  profileSwitchRoleBtn: document.getElementById('profileSwitchRoleBtn'),
  profileHeroPhoto: document.getElementById('profileHeroPhoto'),
  profileHeroFallback: document.getElementById('profileHeroFallback'),
  profileHeroKicker: document.getElementById('profileHeroKicker'),
  profileHeroName: document.getElementById('profileHeroName'),
  profileHeroDesignation: document.getElementById('profileHeroDesignation'),
  profileHeroStatus: document.getElementById('profileHeroStatus'),
  profileHeroBio: document.getElementById('profileHeroBio'),
  profileMetaEmail: document.getElementById('profileMetaEmail'),
  profileMetaSlot2Label: document.getElementById('profileMetaSlot2Label'),
  profileMetaSlot2Val: document.getElementById('profileMetaSlot2Val'),
  profileMetaSlot3Label: document.getElementById('profileMetaSlot3Label'),
  profileMetaSlot3Val: document.getElementById('profileMetaSlot3Val'),
  profileFormTitle: document.getElementById('profileFormTitle'),
  profileFormSubtitle: document.getElementById('profileFormSubtitle'),
  profileEditForm: document.getElementById('profileEditForm'),
  profNameInput: document.getElementById('profNameInput'),
  profEmailInput: document.getElementById('profEmailInput'),
  profDeptSelect: document.getElementById('profDeptSelect'),
  profSecondaryInput: document.getElementById('profSecondaryInput'),
  profSecondaryLabel: document.getElementById('profSecondaryLabel'),
  profTertiaryInput: document.getElementById('profTertiaryInput'),
  profTertiaryLabel: document.getElementById('profTertiaryLabel'),
  profQuaternaryInput: document.getElementById('profQuaternaryInput'),
  profQuaternaryLabel: document.getElementById('profQuaternaryLabel'),
  profBioInput: document.getElementById('profBioInput'),
  profBioLabel: document.getElementById('profBioLabel'),
  profileSaveConfirm: document.getElementById('profileSaveConfirm'),
  profileSideTitle: document.getElementById('profileSideTitle'),
  profileSideSubtitle: document.getElementById('profileSideSubtitle'),
  profileFacultyBox: document.getElementById('profileFacultyBox'),
  profileFacultyStats: document.getElementById('profileFacultyStats'),
  profileThresholdsForm: document.getElementById('profileThresholdsForm'),
  profThresholdPass: document.getElementById('profThresholdPass'),
  profThresholdAlertScore: document.getElementById('profThresholdAlertScore'),
  profThresholdAlertAtt: document.getElementById('profThresholdAlertAtt'),
  profThresholdReviewScore: document.getElementById('profThresholdReviewScore'),
  profResetThresholdsBtn: document.getElementById('profResetThresholdsBtn'),
  profileStudentBox: document.getElementById('profileStudentBox'),
  profileStudentSelect: document.getElementById('profileStudentSelect'),
  profileStudentStats: document.getElementById('profileStudentStats'),
  profileStudentEligibilityBox: document.getElementById('profileStudentEligibilityBox'),

  // Drawer
  studentDrawerOverlay: document.getElementById('studentDrawerOverlay'),
  studentDrawer: document.getElementById('studentDrawer'),
  drawerAvatar: document.getElementById('drawerAvatar'),
  closeDrawerBtn: document.getElementById('closeDrawerBtn'),
  drawerStudentMeta: document.getElementById('drawerStudentMeta'),
  drawerStudentName: document.getElementById('drawerStudentName'),
  drawerSubMeta: document.getElementById('drawerSubMeta'),
  drawerCgpa: document.getElementById('drawerCgpa'),
  drawerAvg: document.getElementById('drawerAvg'),
  drawerAttendance: document.getElementById('drawerAttendance'),
  drawerPercentile: document.getElementById('drawerPercentile'),
  drawerStanding: document.getElementById('drawerStanding'),
  drawerDiagnosticsList: document.getElementById('drawerDiagnosticsList'),
  drawerLastActive: document.getElementById('drawerLastActive'),
  drawerSparklineSvg: document.getElementById('drawerSparklineSvg'),
  drawerScoresForm: document.getElementById('drawerScoresForm'),
  drawerSaveConfirm: document.getElementById('drawerSaveConfirm'),
  advisorNoteForm: document.getElementById('advisorNoteForm'),
  advisorNoteInput: document.getElementById('advisorNoteInput'),
  advisorActionSelect: document.getElementById('advisorActionSelect'),
  drawerNotesList: document.getElementById('drawerNotesList'),
  generateDrawerAiBtn: document.getElementById('generateDrawerAiBtn'),
  drawerAiBody: document.getElementById('drawerAiBody'),
  deleteStudentBtn: document.getElementById('deleteStudentBtn'),
  confirmDeleteBox: document.getElementById('confirmDeleteBox'),
  confirmDeleteYesBtn: document.getElementById('confirmDeleteYesBtn'),
  confirmDeleteNoBtn: document.getElementById('confirmDeleteNoBtn'),

  // Add Student Modal
  addStudentModalBackdrop: document.getElementById('addStudentModalBackdrop'),
  addStudentModal: document.getElementById('addStudentModal'),
  closeAddModalBtn: document.getElementById('closeAddModalBtn'),
  cancelAddModalBtn: document.getElementById('cancelAddModalBtn'),
  addStudentForm: document.getElementById('addStudentForm'),

  // Toast
  toastNotification: document.getElementById('toastNotification'),
};

let toastTimer = null;
function showToast(message) {
  els.toastNotification.textContent = message;
  els.toastNotification.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toastNotification.classList.add('hidden');
  }, 3000);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function deptAvatarClass(dept) {
  if (dept === 'Computer Science & Engg.') return 'dept-cs';
  if (dept === 'Electronics & Comm.') return 'dept-math';
  if (dept === 'Mechanical Engg.') return 'dept-bio';
  return 'dept-econ';
}

function defaultProgrammeForDept(dept) {
  if (dept === 'Computer Science & Engg.') return 'B.Tech (CSE)';
  if (dept === 'Electronics & Comm.') return 'B.Tech (ECE)';
  if (dept === 'Mechanical Engg.') return 'B.Tech (ME)';
  return 'B.Com (Hons)';
}

function deptPrefixForRoll(dept) {
  if (dept === 'Computer Science & Engg.') return 'CSE';
  if (dept === 'Electronics & Comm.') return 'ECE';
  if (dept === 'Mechanical Engg.') return 'ME';
  return 'COM';
}

function profileIconSvg(size = 17) {
  return `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  `;
}

function studentProfileBadge(student, large = false) {
  const cls = deptAvatarClass(student.department);
  const sizeCls = large ? ' badge-lg' : '';
  return `<span class="student-profile-badge${sizeCls} ${cls}" title="${escapeHtml(student.name)} (${escapeHtml(student.department)})" aria-hidden="true">${profileIconSvg(large ? 22 : 17)}</span>`;
}

function barColorForScore(score) {
  if (score < state.thresholds.alertScore) return 'var(--status-alert-bar)';
  if (score < state.thresholds.reviewScore) return 'var(--status-warning-bar)';
  return 'var(--status-nominal-bar)';
}

function statusClassFor(status) {
  if (status === 'Academic Alert') return 'status-alert';
  if (status === 'Needs Review') return 'status-warning';
  return 'status-nominal';
}

function statusMarkup(status) {
  const cls = statusClassFor(status);
  const symbol = status === 'Academic Alert' ? '!' : status === 'Needs Review' ? '•' : '✓';
  return `<span class="status-text ${cls}"><span aria-hidden="true">${symbol}</span>${escapeHtml(status)}</span>`;
}

function setPortraitImage(imgEl, fallbackEl, src, altText) {
  fallbackEl.classList.add('hidden');
  imgEl.classList.remove('hidden');
  imgEl.alt = altText;
  if (imgEl.getAttribute('src') !== src) {
    imgEl.src = src;
  }
}

function getActiveStudentRecord() {
  let raw = state.students.find((s) => s.id === state.activeStudentId);
  if (!raw && state.students.length) {
    raw = state.students[0];
    state.activeStudentId = raw.id;
  }
  return raw ? enrichStudent(raw, state.thresholds) : null;
}

function resetSimulatorStateFromActive() {
  const s = getActiveStudentRecord();
  if (!s) return;
  state.simulatorState = {
    attendance: s.attendance,
    scores: { ...s.scores },
  };
}

function getFilteredStudents({ includeSearch = true, includeGradeTier = true } = {}) {
  const enriched = state.students.map((s) => enrichStudent(s, state.thresholds));
  return enriched.filter((s) => {
    if (state.filters.term !== 'all' && s.term !== state.filters.term) return false;
    if (state.filters.department !== 'all' && s.department !== state.filters.department) return false;
    if (state.filters.status !== 'all' && s.status !== state.filters.status) return false;
    if (includeGradeTier && state.filters.gradeTier && s.letter !== state.filters.gradeTier) return false;
    if (includeSearch && state.filters.search.trim()) {
      const q = state.filters.search.trim().toLowerCase();
      const hay = `${s.id} ${s.name} ${s.email} ${s.department} ${s.year} ${s.programme}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function applyTheme(theme) {
  state.theme = theme;
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    els.themeToggleLabel.textContent = 'Light theme';
    els.themeIconSun.classList.add('hidden');
    els.themeIconMoon.classList.remove('hidden');
  } else {
    document.documentElement.removeAttribute('data-theme');
    els.themeToggleLabel.textContent = 'Dark theme';
    els.themeIconSun.classList.remove('hidden');
    els.themeIconMoon.classList.add('hidden');
  }
  saveTheme(theme);
}

function switchRole(role) {
  state.role = role;
  els.roleBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });

  const isStudent = role === 'student';
  els.facultyNav.classList.toggle('hidden', isStudent);
  els.studentNav.classList.toggle('hidden', !isStudent);
  els.openMarkAttendanceBtn.classList.toggle('hidden', isStudent);
  els.openAddStudentBtn.classList.toggle('hidden', isStudent);
  els.studentPrintBtn.classList.toggle('hidden', !isStudent);
  els.sidebarPortalMeta.innerHTML = isStudent
    ? '<span>Student Self-Service · CBCS</span>'
    : '<span>Office of Academic Affairs · CBCS</span>';

  if (isStudent) {
    resetSimulatorStateFromActive();
    switchView(state.activeView === 'profile' ? 'profile' : 'student-dashboard');
  } else {
    switchView(state.activeView === 'profile' ? 'profile' : 'overview');
  }
}

function switchView(viewName) {
  state.activeView = viewName;
  els.navItems.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  els.views.forEach((sec) => {
    sec.classList.toggle('active', sec.id === `view-${viewName}`);
  });
  els.breadcrumbView.textContent = VIEW_LABELS[viewName] || 'Overview';
  closeMobileSidebar();
  renderAll();
}

function closeMobileSidebar() {
  els.sidebar.classList.remove('open');
  els.sidebarBackdrop.classList.remove('open');
}

function syncStudentSelectors() {
  const optionsHtml = state.students
    .map(
      (s) =>
        `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(s.id)} · ${escapeHtml(s.department)})</option>`
    )
    .join('');
  els.activeStudentSelect.innerHTML = optionsHtml;
  els.toolbarStudentSelect.innerHTML = optionsHtml;
  els.profileStudentSelect.innerHTML = optionsHtml;
  els.activeStudentSelect.value = state.activeStudentId;
  els.toolbarStudentSelect.value = state.activeStudentId;
  els.profileStudentSelect.value = state.activeStudentId;
}

function syncProfileUI() {
  const isStudent = state.role === 'student';
  const activeStudent = getActiveStudentRecord();
  const fac = state.facultyProfile;

  els.studentSwitchSection.classList.toggle('hidden', !isStudent);
  els.thresholdsForm.classList.toggle('hidden', isStudent);
  els.popoverOpenQueueBtn.classList.toggle('hidden', isStudent);
  els.popoverExportBtn.classList.toggle('hidden', isStudent);
  els.popoverSwitchRoleBtn.textContent = isStudent ? 'Switch to Faculty Portal' : 'Switch to Student Portal';

  if (isStudent && activeStudent) {
    setPortraitImage(els.topProfilePhoto, els.topProfileFallbackIcon, STUDENT_PORTRAIT, `${activeStudent.name} profile photo`);
    setPortraitImage(els.popoverProfilePhoto, els.popoverFallbackIcon, STUDENT_PORTRAIT, `${activeStudent.name} profile photo`);

    els.topProfileName.textContent = activeStudent.name;
    els.topProfileRole.textContent = `${activeStudent.id} · ${activeStudent.programme}`;
    els.popoverProfileName.textContent = activeStudent.name;
    els.popoverProfileMeta.textContent = `${activeStudent.email} · ${activeStudent.year}`;
    els.popoverCaseload.textContent = `${activeStudent.term} · ${activeStudent.credits} Credits · CGPA ${activeStudent.cgpa.toFixed(2)}`;

    els.breadcrumbPortal.textContent = 'Student Portal';
    els.breadcrumbTerm.textContent = activeStudent.term;
    els.studentContextMeta.textContent = `${activeStudent.id} · ${activeStudent.programme} · ${activeStudent.year} · Mentor: ${activeStudent.advisor}`;
    els.studentContextStanding.innerHTML = statusMarkup(activeStudent.status);
  } else {
    setPortraitImage(els.topProfilePhoto, els.topProfileFallbackIcon, FACULTY_PORTRAIT, `${fac.name} profile photo`);
    setPortraitImage(els.popoverProfilePhoto, els.popoverFallbackIcon, FACULTY_PORTRAIT, `${fac.name} profile photo`);

    els.topProfileName.textContent = fac.name;
    els.topProfileRole.textContent = fac.designation;
    els.popoverProfileName.textContent = fac.name;
    els.popoverProfileMeta.textContent = `${fac.email} · ${fac.facultyId}`;

    const caseload = state.students.filter((s) => (s.advisor || fac.name) === fac.name).length;
    els.popoverCaseload.textContent = `Assigned mentees: ${caseload} student${caseload === 1 ? '' : 's'} · ${fac.office}`;
    els.thresholdAlertScore.value = state.thresholds.alertScore;
    els.thresholdAlertAtt.value = state.thresholds.alertAttendance;

    els.breadcrumbPortal.textContent = 'Faculty Portal';
  }
}

function updateToolbarsVisibility() {
  const isStudent = state.role === 'student';
  const hideCohortToolbar = state.activeView === 'profile' || state.activeView === 'attendance';
  const showCohortFilters = !hideCohortToolbar && (!isStudent || state.activeView === 'subjects');
  const showStudentContext = !hideCohortToolbar && isStudent && state.activeView !== 'subjects';
  els.cohortFilterToolbar.classList.toggle('hidden', !showCohortFilters);
  els.studentContextToolbar.classList.toggle('hidden', !showStudentContext);
}

function updateFilterBarUI(cohortList) {
  const { term, department, status, gradeTier } = state.filters;
  const hasFilter = term !== 'all' || department !== 'all' || status !== 'all' || Boolean(gradeTier);
  els.resetFiltersBtn.classList.toggle('hidden', !hasFilter);
  els.clearGradeFilterBtn.classList.toggle('hidden', !gradeTier);
  if (state.role === 'faculty') {
    els.breadcrumbTerm.textContent = term === 'all' ? 'All Semesters' : term;
  }
  els.filterSummary.textContent = `Showing ${cohortList.length} of ${state.students.length} students${gradeTier ? ` · Grade ${gradeTier}` : ''}`;

  const allEnriched = state.students.map((s) => enrichStudent(s, state.thresholds));
  els.navStudentCount.textContent = allEnriched.length;
  els.navAlertCount.textContent = allEnriched.filter((s) => s.status === 'Academic Alert').length;
  els.interventionsSubtitle.textContent = `Students flagged below ${state.thresholds.alertScore}% aggregate, <${state.thresholds.passScore}% arrear/backlog, or <${state.thresholds.alertAttendance}% UGC attendance.`;
}

function renderOverview(cohortList) {
  const summary = computeCohortSummary(cohortList, state.thresholds.passScore);

  els.kpiMeanCgpa.textContent = summary.meanCgpa.toFixed(2);
  els.kpiCgpaMeta.textContent = `Median ${summary.medianCgpa.toFixed(2)} · SD ${summary.stdDevCgpa.toFixed(2)} (10.0 scale)`;
  els.meterMeanCgpa.style.width = `${Math.min(100, (summary.meanCgpa / 10.0) * 100).toFixed(1)}%`;

  els.kpiPassRate.textContent = `${summary.passRate.toFixed(1)}%`;
  els.kpiPassMeta.textContent = `${summary.passingCount} of ${summary.count} students passing`;
  els.meterPassRate.style.width = `${summary.passRate.toFixed(1)}%`;

  els.kpiAttendance.textContent = `${summary.meanAttendance.toFixed(1)}%`;
  els.kpiCorrMeta.textContent = `r = ${summary.pearsonR.toFixed(2)} score correlation`;
  els.meterAttendance.style.width = `${summary.meanAttendance.toFixed(1)}%`;

  els.kpiAlertCount.textContent = summary.alertCount;
  const alertPct = summary.count > 0 ? (summary.alertCount / summary.count) * 100 : 0;
  els.kpiAlertMeta.textContent =
    summary.count > 0
      ? `Below ${state.thresholds.alertScore}% score or ${state.thresholds.alertAttendance}% UGC att.`
      : 'No students in selection';
  els.meterAlertCount.style.width = `${alertPct.toFixed(1)}%`;

  const total = cohortList.length || 1;
  const onTrack = cohortList.filter((s) => s.status === 'On Track').length;
  const needsReview = cohortList.filter((s) => s.status === 'Needs Review').length;
  const alerts = cohortList.filter((s) => s.status === 'Academic Alert').length;

  const pctOnTrack = (onTrack / total) * 100;
  const pctReview = (needsReview / total) * 100;
  const pctAlerts = (alerts / total) * 100;

  els.standingLegend.innerHTML = `
    <span class="standing-legend-item"><span class="standing-swatch seg-nominal"></span>On Track: ${onTrack} (${cohortList.length ? pctOnTrack.toFixed(0) : 0}%)</span>
    <span class="standing-legend-item"><span class="standing-swatch seg-warning"></span>Needs Review: ${needsReview} (${cohortList.length ? pctReview.toFixed(0) : 0}%)</span>
    <span class="standing-legend-item"><span class="standing-swatch seg-alert"></span>Academic Alert: ${alerts} (${cohortList.length ? pctAlerts.toFixed(0) : 0}%)</span>
  `;

  els.standingBar.innerHTML = cohortList.length
    ? `
      <div class="standing-seg seg-nominal" style="width: ${pctOnTrack}%" title="On Track: ${onTrack}"></div>
      <div class="standing-seg seg-warning" style="width: ${pctReview}%" title="Needs Review: ${needsReview}"></div>
      <div class="standing-seg seg-alert" style="width: ${pctAlerts}%" title="Academic Alert: ${alerts}"></div>
    `
    : '';

  const trendData = computeMilestoneTrends(cohortList, state.trendMode);
  renderTrendChart(els.trendChartSvg, els.trendTooltip, trendData, state.trendMode);

  const cohortForDist = getFilteredStudents({ includeSearch: false, includeGradeTier: false });
  const distData = computeGradeDistribution(cohortForDist);
  renderGradeChart(
    els.gradeChartSvg,
    els.gradeTooltip,
    distData,
    state.filters.gradeTier,
    (tier) => {
      state.filters.gradeTier = tier;
      renderAll();
    }
  );

  const slopeSign = summary.regression.intercept >= 0 ? '+' : '-';
  els.regressionFormula.textContent = `y = ${summary.regression.slope.toFixed(2)}x ${slopeSign} ${Math.abs(summary.regression.intercept).toFixed(1)}`;
  renderScatterChart(
    els.scatterCanvas,
    els.scatterTooltip,
    cohortList,
    summary.regression,
    (studentId) => openStudentDrawer(studentId)
  );

  const watchlist = [...cohortList]
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);

  if (!watchlist.length) {
    els.watchlistContainer.innerHTML = `<div class="empty-state"><p class="empty-desc">No students match the current filter criteria.</p></div>`;
    renderCohortAiPanel(cohortList);
    return;
  }

  els.watchlistContainer.innerHTML = watchlist
    .map(
      (s) => `
      <button type="button" class="watchlist-row" data-inspect-id="${escapeHtml(s.id)}">
        <div class="watchlist-left">
          ${studentProfileBadge(s)}
          <div class="watchlist-info">
            <div class="watchlist-name">${escapeHtml(s.name)}</div>
            <div class="watchlist-meta">${escapeHtml(s.id)} · ${escapeHtml(s.department)} · ${escapeHtml(s.year)}</div>
          </div>
        </div>
        <div class="watchlist-metrics">
          <span>${s.average.toFixed(1)}%</span>
          <span>${s.attendance}%</span>
          ${statusMarkup(s.status)}
        </div>
      </button>
    `
    )
    .join('');

  els.watchlistContainer.querySelectorAll('[data-inspect-id]').forEach((btn) => {
    btn.addEventListener('click', () => openStudentDrawer(btn.dataset.inspectId));
  });

  renderCohortAiPanel(cohortList);
}

// AI INSIGHTS HELPERS & RENDERERS
function getCohortFilterKey(cohortList) {
  return `${state.filters.term}|${state.filters.department}|${state.filters.status}|${state.filters.gradeTier || ''}|${cohortList.length}`;
}

function aiPriorityMarkup(priorityLevel) {
  if (priorityLevel === 'critical') {
    return `<span class="status-text status-alert"><span aria-hidden="true">!</span>Critical Priority</span>`;
  }
  if (priorityLevel === 'watch') {
    return `<span class="status-text status-warning"><span aria-hidden="true">•</span>Needs Attention</span>`;
  }
  return `<span class="status-text status-nominal"><span aria-hidden="true">✓</span>On Track</span>`;
}

function buildCohortAiContext(cohortList) {
  const summary = computeCohortSummary(cohortList, state.thresholds.passScore);
  const subjectStats = computeSubjectStats(cohortList, state.thresholds.passScore);
  const deptStats = computeDepartmentStats(cohortList);
  const milestones = computeMilestoneTrends(cohortList, 'score');
  const priorityCases = [...cohortList]
    .filter((s) => s.status !== 'On Track')
    .sort((a, b) => a.average - b.average)
    .slice(0, 8)
    .map((s) => ({
      rollNo: s.id,
      name: s.name,
      department: s.department,
      term: s.term,
      averagePct: Number(s.average.toFixed(1)),
      cgpa: Number(s.cgpa.toFixed(2)),
      attendancePct: s.attendance,
      status: s.status,
      backlogSubjects: SUBJECTS.filter((sub) => (Number(s.scores[sub.key]) || 0) < state.thresholds.passScore).map((sub) => sub.label),
    }));

  return {
    activeFilters: { ...state.filters },
    thresholds: { ...state.thresholds },
    cohortSummary: {
      studentCount: summary.count,
      meanCgpa: Number(summary.meanCgpa.toFixed(2)),
      medianCgpa: Number(summary.medianCgpa.toFixed(2)),
      passRatePct: Number(summary.passRate.toFixed(1)),
      meanAttendancePct: Number(summary.meanAttendance.toFixed(1)),
      alertCount: summary.alertCount,
      attendanceScorePearsonR: Number(summary.pearsonR.toFixed(2)),
    },
    assessmentTrajectory: milestones.map((m) => ({ stage: m.label, meanPct: Number(m.value.toFixed(1)) })),
    subjectStats: subjectStats.map((st) => ({
      subject: st.label,
      meanPct: Number(st.mean.toFixed(1)),
      minPct: st.min,
      maxPct: st.max,
      passRatePct: Number(st.passRate.toFixed(1)),
    })),
    departmentStats: deptStats.map((d) => ({
      department: d.department,
      students: d.count,
      meanCgpa: Number(d.meanCgpa.toFixed(2)),
      meanAttendancePct: Number(d.meanAttendance.toFixed(1)),
      alertRatePct: Number(d.alertRate.toFixed(1)),
    })),
    priorityCases,
  };
}

function buildStudentAiContext(student) {
  const allEnriched = state.students.map((s) => enrichStudent(s, state.thresholds));
  const subjectStats = computeSubjectStats(allEnriched, state.thresholds.passScore);
  const cohortSummary = computeCohortSummary(allEnriched, state.thresholds.passScore);
  const percentile = computePercentileRank(
    student.average,
    allEnriched.map((s) => s.average)
  );

  const normRatio = state.thresholds.alertAttendance / 100;
  let classesNeededForUgc = 0;
  if (student.attendance < state.thresholds.alertAttendance && normRatio < 1) {
    classesNeededForUgc = Math.max(
      0,
      Math.ceil((normRatio * student.totalClasses - student.attendedClasses) / (1 - normRatio))
    );
  }

  return {
    thresholds: { ...state.thresholds },
    student: {
      rollNo: student.id,
      name: student.name,
      programme: student.programme,
      department: student.department,
      term: student.term,
      year: student.year,
      credits: student.credits,
      averagePct: Number(student.average.toFixed(1)),
      cgpa: Number(student.cgpa.toFixed(2)),
      cbcsGrade: student.letter,
      cohortPercentile: percentile,
      cohortMeanCgpa: Number(cohortSummary.meanCgpa.toFixed(2)),
      attendancePct: student.attendance,
      attendedClasses: student.attendedClasses,
      totalClasses: student.totalClasses,
      examEligible: student.examEligible,
      classesNeededForUgcNorm: classesNeededForUgc,
      ciaCompletionPct: student.completion,
      standing: student.status,
      diagnostics: student.diagnostics,
      milestones: {
        cia1: student.milestones[0],
        midSem: student.milestones[1],
        labViva: student.milestones[2],
        endSem: student.milestones[3],
      },
      subjects: subjectStats.map((st) => ({
        subject: st.label,
        scorePct: Number(student.scores[st.key]) || 0,
        grade: scoreToLetter(Number(student.scores[st.key]) || 0),
        cohortMeanPct: Number(st.mean.toFixed(1)),
        passed: (Number(student.scores[st.key]) || 0) >= state.thresholds.passScore,
      })),
      recentNotes: (student.notes || []).slice(0, 3),
    },
  };
}

async function requestAiInsights(mode, contextData, question = '') {
  const response = await fetch('/api/ai/insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, contextData, question }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404 || response.status === 405) {
      throw new Error(
        'AI Insights requires the backend server (run "npm run dev" with node server.js). All other dashboards, charts, attendance, and simulator features work standalone.'
      );
    }
    throw new Error(payload.error || `AI request failed (${response.status})`);
  }
  return payload;
}

function renderAiInsightView(containerEl, entry, { placeholderHtml, loadingLabel, actionHeading, compact = false, onRetry, onUseNote }) {
  if (!entry || entry.status === 'idle') {
    containerEl.innerHTML = `<div class="ai-placeholder${compact ? ' ai-placeholder-compact' : ''}">${placeholderHtml}</div>`;
    return;
  }

  if (entry.status === 'loading') {
    containerEl.innerHTML = `
      <div class="ai-loading-box" role="status" aria-live="polite">
        <div class="ai-loading-label">${escapeHtml(loadingLabel)}</div>
        <div class="ai-skeleton-line" style="width: 82%;"></div>
        <div class="ai-skeleton-line" style="width: 94%;"></div>
        <div class="ai-skeleton-line" style="width: 68%;"></div>
      </div>
    `;
    return;
  }

  if (entry.status === 'error') {
    containerEl.innerHTML = `
      <div class="ai-error-box" role="alert">
        <span>${escapeHtml(entry.error || 'Failed to generate AI insights.')}</span>
        <button type="button" class="btn btn-secondary btn-sm" data-ai-retry="true">Retry</button>
      </div>
    `;
    const retryBtn = containerEl.querySelector('[data-ai-retry]');
    if (retryBtn && onRetry) {
      retryBtn.addEventListener('click', onRetry);
    }
    return;
  }

  const d = entry.data;
  const highlightsHtml = (d.highlights || [])
    .map(
      (h) => `
      <div class="ai-highlight-card">
        <div class="ai-highlight-title">${escapeHtml(h.title)}</div>
        <div class="ai-highlight-impact">${escapeHtml(h.impact)}</div>
        <div class="ai-highlight-detail">${escapeHtml(h.detail)}</div>
      </div>
    `
    )
    .join('');

  const actionsHtml = (d.actionPlan || [])
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join('');

  const mentorNoteHtml =
    compact && d.suggestedMentorNote
      ? `
      <div class="ai-drawer-note-preview">
        <div><strong>Suggested Mentor Note:</strong> ${escapeHtml(d.suggestedMentorNote)}</div>
        <div class="ai-drawer-note-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-use-ai-note="true">Copy to Note Draft</button>
        </div>
      </div>
    `
      : '';

  containerEl.innerHTML = `
    <div class="ai-summary-card">
      <div class="ai-summary-top">
        <h3 class="ai-headline">${escapeHtml(d.headline)}</h3>
        ${aiPriorityMarkup(d.priorityLevel)}
      </div>
      <p class="ai-summary-text">${escapeHtml(d.summary)}</p>
    </div>
    ${highlightsHtml ? `<div class="ai-highlights-grid"${compact ? ' style="grid-template-columns: 1fr;"' : ''}>${highlightsHtml}</div>` : ''}
    ${
      actionsHtml
        ? `
      <div class="ai-actions-box">
        <div class="ai-actions-title">${escapeHtml(actionHeading)}</div>
        <ol class="ai-actions-list">${actionsHtml}</ol>
      </div>
    `
        : ''
    }
    ${mentorNoteHtml}
  `;

  const useBtn = containerEl.querySelector('[data-use-ai-note]');
  if (useBtn && onUseNote) {
    useBtn.addEventListener('click', () => onUseNote(d.suggestedMentorNote));
  }
}

function renderCohortAiPanel(cohortList) {
  const currentKey = getCohortFilterKey(cohortList);
  const entry = state.ai.cohort;
  if (entry.status === 'ready' && entry.cacheKey && entry.cacheKey !== currentKey) {
    els.cohortAiSubtext.textContent = 'Filters updated — click Generate Insights to refresh for the active selection';
  } else {
    els.cohortAiSubtext.textContent = 'CBCS backlog diagnostics, branch gaps, and UGC 75% attendance guidance';
  }

  els.generateCohortAiBtn.disabled = entry.status === 'loading';
  els.generateCohortAiBtn.textContent = entry.status === 'loading' ? 'Analyzing...' : entry.status === 'ready' ? 'Refresh Insights' : 'Generate Insights';

  renderAiInsightView(els.cohortAiBody, entry, {
    placeholderHtml:
      'Click <strong>Generate Insights</strong> to analyze the active filtered cohort for CBCS arrear patterns, subject bottlenecks, and urgent faculty mentoring priorities.',
    loadingLabel: `Analyzing ${cohortList.length} student records across CBCS & UGC 75% norms...`,
    actionHeading: 'Recommended Faculty Actions',
    onRetry: () => triggerCohortAiInsights(),
  });
}

async function triggerCohortAiInsights() {
  const cohortList = getFilteredStudents({ includeSearch: false, includeGradeTier: true });
  if (!cohortList.length) {
    showToast('No students match current filters to analyze');
    return;
  }

  const question = els.cohortAiPromptInput.value.trim();
  const cacheKey = getCohortFilterKey(cohortList);
  state.ai.cohort = { status: 'loading', data: null, error: '', cacheKey };
  renderCohortAiPanel(cohortList);

  try {
    const contextData = buildCohortAiContext(cohortList);
    const data = await requestAiInsights('cohort', contextData, question);
    state.ai.cohort = { status: 'ready', data, error: '', cacheKey };
  } catch (err) {
    state.ai.cohort = { status: 'error', data: null, error: err.message, cacheKey };
  }

  if (state.activeView === 'overview') {
    renderCohortAiPanel(getFilteredStudents({ includeSearch: false, includeGradeTier: true }));
  }
}

function renderStudentAiPanel(student) {
  const entry = state.ai.studentById[student.id] || { status: 'idle', data: null, error: '' };
  els.generateStudentAiBtn.disabled = entry.status === 'loading';
  els.generateStudentAiBtn.textContent =
    entry.status === 'loading' ? 'Analyzing...' : entry.status === 'ready' ? 'Refresh Plan' : 'Analyze My Performance';

  renderAiInsightView(els.studentAiBody, entry, {
    placeholderHtml:
      'Click <strong>Analyze My Performance</strong> for a personalized subject-by-subject study plan, backlog prevention check, and End-Sem target roadmap.',
    loadingLabel: `Generating personalized CBCS study coaching for ${student.name}...`,
    actionHeading: 'Weekly Study & Attendance Action Plan',
    onRetry: () => triggerStudentAiCoach(),
  });
}

async function triggerStudentAiCoach() {
  const student = getActiveStudentRecord();
  if (!student) return;

  const question = els.studentAiPromptInput.value.trim();
  state.ai.studentById[student.id] = { status: 'loading', data: null, error: '' };
  renderStudentAiPanel(student);

  try {
    const contextData = buildStudentAiContext(student);
    const data = await requestAiInsights('student', contextData, question);
    state.ai.studentById[student.id] = { status: 'ready', data, error: '' };
  } catch (err) {
    state.ai.studentById[student.id] = { status: 'error', data: null, error: err.message };
  }

  const activeNow = getActiveStudentRecord();
  if (state.activeView === 'student-dashboard' && activeNow && activeNow.id === student.id) {
    renderStudentAiPanel(activeNow);
  }
}

function renderDrawerAiPanel(student) {
  const entry = state.ai.drawerById[student.id] || { status: 'idle', data: null, error: '' };
  els.generateDrawerAiBtn.disabled = entry.status === 'loading';
  els.generateDrawerAiBtn.textContent =
    entry.status === 'loading' ? 'Generating...' : entry.status === 'ready' ? 'Refresh Brief' : 'Generate Brief';

  renderAiInsightView(els.drawerAiBody, entry, {
    placeholderHtml: 'Generate a tailored 1:1 CBCS mentor brief and draft intervention note for this student.',
    loadingLabel: `Preparing 1:1 mentor brief for ${student.name}...`,
    actionHeading: '1:1 Mentoring Steps',
    compact: true,
    onRetry: () => triggerDrawerAiBrief(),
    onUseNote: (noteText) => {
      els.advisorNoteInput.value = noteText;
      els.advisorNoteInput.focus();
      showToast('Copied AI draft to mentor note field');
    },
  });
}

async function triggerDrawerAiBrief() {
  const raw = state.students.find((s) => s.id === state.selectedStudentId);
  if (!raw) return;
  const student = enrichStudent(raw, state.thresholds);

  state.ai.drawerById[student.id] = { status: 'loading', data: null, error: '' };
  renderDrawerAiPanel(student);

  try {
    const contextData = buildStudentAiContext(student);
    const data = await requestAiInsights('drawer', contextData);
    state.ai.drawerById[student.id] = { status: 'ready', data, error: '' };
  } catch (err) {
    state.ai.drawerById[student.id] = { status: 'error', data: null, error: err.message };
  }

  if (state.selectedStudentId === student.id) {
    renderDrawerAiPanel(enrichStudent(raw, state.thresholds));
  }
}

function renderStudentsTable() {
  const list = getFilteredStudents({ includeSearch: true, includeGradeTier: true });
  const { key, dir } = state.sort;
  const mult = dir === 'asc' ? 1 : -1;

  list.sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * mult;
    }
    return String(va).localeCompare(String(vb)) * mult;
  });

  els.sortBtns.forEach((btn) => {
    const indicator = btn.querySelector('.sort-indicator');
    if (btn.dataset.sort === key) {
      indicator.textContent = dir === 'asc' ? '▲' : '▼';
    } else {
      indicator.textContent = '';
    }
  });

  if (!list.length) {
    els.studentsTableBody.innerHTML = '';
    els.studentsEmptyState.classList.remove('hidden');
    return;
  }

  els.studentsEmptyState.classList.add('hidden');
  els.studentsTableBody.innerHTML = list
    .map(
      (s) => `
      <tr>
        <td class="tabular-nums" style="font-family: var(--font-mono); font-size: 12px;">${escapeHtml(s.id)}</td>
        <td>
          <div class="student-cell">
            ${studentProfileBadge(s)}
            <div class="student-name-cell">
              <strong>${escapeHtml(s.name)}</strong>
              <span class="student-email">${escapeHtml(s.email)}</span>
            </div>
          </div>
        </td>
        <td>${escapeHtml(s.department)} · ${escapeHtml(s.term)}</td>
        <td class="num-col tabular-nums">
          <div class="inline-score-cell">
            <span class="mini-bar-track" aria-hidden="true">
              <span class="mini-bar-fill" style="display: block; width: ${s.average.toFixed(0)}%; background-color: ${barColorForScore(s.average)};"></span>
            </span>
            <span>${s.average.toFixed(1)}% (${escapeHtml(s.letter)})</span>
          </div>
        </td>
        <td class="num-col tabular-nums">${s.cgpa.toFixed(2)}</td>
        <td class="num-col tabular-nums">${s.attendance}%</td>
        <td class="num-col tabular-nums">${s.completion}%</td>
        <td>${statusMarkup(s.status)}</td>
        <td class="action-col">
          <button type="button" class="btn btn-secondary btn-sm" data-inspect-id="${escapeHtml(s.id)}">Inspect</button>
        </td>
      </tr>
    `
    )
    .join('');

  els.studentsTableBody.querySelectorAll('[data-inspect-id]').forEach((btn) => {
    btn.addEventListener('click', () => openStudentDrawer(btn.dataset.inspectId));
  });
}

function renderSubjectsView(cohortList) {
  const subjectStats = computeSubjectStats(cohortList, state.thresholds.passScore);
  const deptStats = computeDepartmentStats(cohortList);

  if (!cohortList.length) {
    els.subjectBenchmarkList.innerHTML = `<p class="empty-desc">No cohort data in current filter.</p>`;
    els.departmentTableBody.innerHTML = '';
    els.subjectStatsBody.innerHTML = '';
    return;
  }

  els.subjectBenchmarkList.innerHTML = subjectStats
    .map(
      (st) => `
      <div class="subject-bar-item">
        <div class="subject-bar-head">
          <span class="subject-bar-name">${escapeHtml(st.label)}</span>
          <span class="subject-bar-nums tabular-nums">Mean ${st.mean.toFixed(1)}% · Range ${st.min}–${st.max}%</span>
        </div>
        <div class="subject-track" title="Range ${st.min}% to ${st.max}%, Mean ${st.mean.toFixed(1)}%">
          <div class="subject-target-line" aria-hidden="true"></div>
          <div class="subject-range" style="left: ${st.min}%; width: ${Math.max(st.max - st.min, 1)}%;"></div>
          <div class="subject-mean-dot" style="left: ${st.mean.toFixed(1)}%;"></div>
        </div>
      </div>
    `
    )
    .join('');

  els.departmentTableBody.innerHTML = deptStats
    .map(
      (d) => `
      <tr>
        <td><strong>${escapeHtml(d.department)}</strong></td>
        <td class="num-col tabular-nums">${d.count}</td>
        <td class="num-col tabular-nums">${d.meanScore.toFixed(1)}%</td>
        <td class="num-col tabular-nums">${d.meanCgpa.toFixed(2)}</td>
        <td class="num-col tabular-nums">${d.meanAttendance.toFixed(1)}%</td>
        <td class="num-col tabular-nums">${d.alertRate.toFixed(1)}%</td>
      </tr>
    `
    )
    .join('');

  els.subjectStatsBody.innerHTML = subjectStats
    .map(
      (st) => `
      <tr>
        <td><strong>${escapeHtml(st.label)}</strong></td>
        <td class="num-col tabular-nums">${st.mean.toFixed(1)}%</td>
        <td class="num-col tabular-nums">${st.median.toFixed(1)}%</td>
        <td class="num-col tabular-nums">${st.stdDev.toFixed(1)}</td>
        <td class="num-col tabular-nums">${st.min}%</td>
        <td class="num-col tabular-nums">${st.max}%</td>
        <td class="num-col tabular-nums">${st.passRate.toFixed(1)}%</td>
      </tr>
    `
    )
    .join('');
}

function renderInterventionQueue(cohortList) {
  const filtered = cohortList.filter((s) => {
    if (state.queueFilter === 'resolved') {
      return Array.isArray(s.notes) && s.notes.length > 0;
    }
    return s.status === 'Academic Alert' || s.status === 'Needs Review';
  });

  filtered.sort((a, b) => a.average - b.average);

  if (!filtered.length) {
    els.interventionQueueList.innerHTML = `
      <article class="surface empty-state" style="grid-column: 1 / -1;">
        <h3 class="empty-title">No students in this queue view</h3>
        <p class="empty-desc">All students in the active filter meet CBCS passing marks and 75% UGC attendance norms.</p>
      </article>
    `;
    return;
  }

  els.interventionQueueList.innerHTML = filtered
    .map((s) => {
      const latestNote = s.notes && s.notes.length ? s.notes[0] : null;
      return `
        <article class="surface intervention-card">
          <div class="intervention-head">
            <div class="intervention-identity">
              ${studentProfileBadge(s)}
              <div>
                <div class="intervention-student">${escapeHtml(s.name)}</div>
                <div class="intervention-meta">${escapeHtml(s.id)} · ${escapeHtml(s.department)} · ${escapeHtml(s.year)}</div>
              </div>
            </div>
            ${statusMarkup(s.status)}
          </div>
          <div class="intervention-metrics">
            <div>
              <span class="metric-pair-label">Aggregate</span>
              <span class="metric-pair-val tabular-nums">${s.average.toFixed(1)}%</span>
            </div>
            <div>
              <span class="metric-pair-label">CGPA</span>
              <span class="metric-pair-val tabular-nums">${s.cgpa.toFixed(2)}</span>
            </div>
            <div>
              <span class="metric-pair-label">Attendance</span>
              <span class="metric-pair-val tabular-nums">${s.attendance}%</span>
            </div>
          </div>
          <div class="intervention-note-preview">
            ${
              latestNote
                ? `<strong>${escapeHtml(latestNote.action)} (${escapeHtml(latestNote.date)}):</strong> ${escapeHtml(latestNote.text)}`
                : escapeHtml(s.diagnostics[0])
            }
          </div>
          <div class="intervention-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-inspect-id="${escapeHtml(s.id)}">Open Mentor Record</button>
          </div>
        </article>
      `;
    })
    .join('');

  els.interventionQueueList.querySelectorAll('[data-inspect-id]').forEach((btn) => {
    btn.addEventListener('click', () => openStudentDrawer(btn.dataset.inspectId));
  });
}

// STUDENT PORTAL RENDERERS
function renderStudentDashboard() {
  const student = getActiveStudentRecord();
  if (!student) return;

  const allEnriched = state.students.map((s) => enrichStudent(s, state.thresholds));
  const cohortSummary = computeCohortSummary(allEnriched, state.thresholds.passScore);
  const allAverages = allEnriched.map((s) => s.average);
  const percentile = computePercentileRank(student.average, allAverages);
  const subjectStats = computeSubjectStats(allEnriched, state.thresholds.passScore);

  els.studentDashSubtitle.textContent = `${student.name} (${student.id}) · ${student.programme} · ${student.term}`;

  const cgpaDiff = student.cgpa - cohortSummary.meanCgpa;
  const cgpaSign = cgpaDiff >= 0 ? '+' : '';
  els.stuKpiCgpa.textContent = student.cgpa.toFixed(2);
  els.stuMeterCgpa.style.width = `${Math.min(100, (student.cgpa / 10.0) * 100).toFixed(1)}%`;
  els.stuKpiCgpaDelta.textContent = `${cgpaSign}${cgpaDiff.toFixed(2)} vs ${cohortSummary.meanCgpa.toFixed(2)} cohort mean`;

  els.stuKpiScore.textContent = `${student.average.toFixed(1)}% (${student.letter})`;
  els.stuMeterScore.style.width = `${student.average.toFixed(1)}%`;
  els.stuKpiPercentile.textContent = `${percentile}th cohort percentile`;

  els.stuKpiAttendance.textContent = `${student.attendance}%`;
  els.stuMeterAttendance.style.width = `${student.attendance}%`;
  els.stuKpiAttendanceMeta.textContent = student.examEligible
    ? `Eligible for End-Sem (≥ ${state.thresholds.alertAttendance}% UGC norm)`
    : `Shortage: below ${state.thresholds.alertAttendance}% UGC exam norm`;

  els.stuKpiCompletion.textContent = `${student.completion}%`;
  els.stuMeterCompletion.style.width = `${student.completion}%`;
  els.stuKpiCredits.textContent = `${student.credits} CBCS credits · ${student.year}`;

  els.studentVsCohortList.innerHTML = subjectStats
    .map((st) => {
      const myScore = Number(student.scores[st.key]) || 0;
      const diff = myScore - st.mean;
      const diffSign = diff >= 0 ? '+' : '';
      return `
        <div class="subject-bar-item">
          <div class="subject-bar-head">
            <span class="subject-bar-name">${escapeHtml(st.label)}</span>
            <span class="subject-bar-nums tabular-nums">You: ${myScore}% (${diffSign}${diff.toFixed(1)}% vs ${st.mean.toFixed(1)}% avg)</span>
          </div>
          <div class="subject-track" title="Your score: ${myScore}%, Batch mean: ${st.mean.toFixed(1)}%">
            <div class="student-course-fill" style="width: ${myScore}%;"></div>
            <div class="cohort-mean-marker" style="left: ${st.mean.toFixed(1)}%;" title="Batch mean ${st.mean.toFixed(1)}%"></div>
          </div>
        </div>
      `;
    })
    .join('');

  const trendData = computeMilestoneTrends([student], 'score');
  renderTrendChart(els.studentTrendSvg, els.studentTrendTooltip, trendData, 'score');

  els.stuDashStandingBadge.innerHTML = statusMarkup(student.status);
  els.stuDashDiagnostics.innerHTML = student.diagnostics
    .map((d) => `<li>• ${escapeHtml(d)}</li>`)
    .join('');

  const notes = student.notes || [];
  els.stuDashNotes.innerHTML = notes.length
    ? notes
        .slice(0, 3)
        .map(
          (n) => `
          <li class="note-item">
            <div class="note-item-head">
              <span class="note-item-action">${escapeHtml(n.action)}</span>
              <span class="tabular-nums">${escapeHtml(n.date)}</span>
            </div>
            <div class="note-item-body">${escapeHtml(n.text)}</div>
          </li>
        `
        )
        .join('')
    : `<li class="note-item"><div class="note-item-body">No mentor notes or study reflections logged yet.</div></li>`;

  renderStudentAiPanel(student);
}

function updateSimulatorCalculations() {
  const student = getActiveStudentRecord();
  if (!student || !state.simulatorState) return;

  const simStudent = {
    ...student,
    attendance: state.simulatorState.attendance,
    scores: state.simulatorState.scores,
  };
  const simAvg =
    SUBJECTS.reduce((sum, s) => sum + (Number(simStudent.scores[s.key]) || 0), 0) / SUBJECTS.length;
  const simCgpa = scoreToCgpa(simAvg);
  const simLetter = scoreToLetter(simAvg);
  const simStanding = getStudentStanding(simStudent, state.thresholds);

  const allAverages = state.students.map((s) => enrichStudent(s, state.thresholds).average);
  const simPercentile = computePercentileRank(simAvg, allAverages);

  const cgpaDelta = simCgpa - student.cgpa;
  const avgDelta = simAvg - student.average;

  els.simCgpa.textContent = simCgpa.toFixed(2);
  els.simCgpaDelta.textContent = `${cgpaDelta >= 0 ? '+' : ''}${cgpaDelta.toFixed(2)} vs current`;
  els.simCgpaDelta.className = `sim-metric-delta tabular-nums ${cgpaDelta > 0.005 ? 'delta-positive' : cgpaDelta < -0.005 ? 'delta-negative' : ''}`;

  els.simAvg.textContent = `${simAvg.toFixed(1)}%`;
  els.simAvgDelta.textContent = `${avgDelta >= 0 ? '+' : ''}${avgDelta.toFixed(1)}% vs current`;
  els.simAvgDelta.className = `sim-metric-delta tabular-nums ${avgDelta > 0.05 ? 'delta-positive' : avgDelta < -0.05 ? 'delta-negative' : ''}`;

  els.simLetter.textContent = simLetter;
  els.simPercentile.textContent = `${simPercentile}th percentile`;
  els.simStandingBadge.innerHTML = statusMarkup(simStanding);

  const hasBacklog = SUBJECTS.some((s) => (Number(simStudent.scores[s.key]) || 0) < state.thresholds.passScore);
  if (hasBacklog) {
    els.simAdviceText.textContent = `Simulated marks show a subject below ${state.thresholds.passScore}% (Arrear/Backlog risk). Every subject must score at least ${state.thresholds.passScore}% to clear the semester.`;
  } else if (simStudent.attendance < state.thresholds.alertAttendance) {
    els.simAdviceText.textContent = `Attendance below ${state.thresholds.alertAttendance}% violates UGC End-Sem exam eligibility rules. Raise projected attendance to ${state.thresholds.alertAttendance}%+ to avoid detention risk.`;
  } else if (simStanding === 'Academic Alert') {
    els.simAdviceText.textContent = `Simulated metrics fall under Academic Alert. Aim for at least ${state.thresholds.alertScore}% aggregate and ${state.thresholds.alertAttendance}% attendance.`;
  } else if (simStanding === 'Needs Review') {
    els.simAdviceText.textContent = `Projected standing is Needs Review. Raising marks above ${state.thresholds.reviewScore}% and attendance above ${state.thresholds.reviewAttendance}% moves you to On Track.`;
  } else {
    els.simAdviceText.textContent = `Strong CBCS trajectory: all subjects clear the ${state.thresholds.passScore}% pass mark, attendance meets UGC norms, and you rank in the ${simPercentile}th percentile.`;
  }
}

function renderStudentSimulator() {
  const student = getActiveStudentRecord();
  if (!student) return;
  if (!state.simulatorState) {
    resetSimulatorStateFromActive();
  }

  const rows = [
    ...SUBJECTS.map((s) => ({
      key: s.key,
      label: s.label,
      value: state.simulatorState.scores[s.key],
    })),
    {
      key: 'attendance',
      label: 'Attendance (%)',
      value: state.simulatorState.attendance,
    },
  ];

  els.simulatorInputsContainer.innerHTML = rows
    .map(
      (r) => `
      <div class="sim-slider-row">
        <label class="sim-slider-label" for="sim-range-${r.key}">${escapeHtml(r.label)}</label>
        <input
          type="range"
          id="sim-range-${r.key}"
          class="sim-range"
          min="0"
          max="100"
          value="${r.value}"
          data-sim-key="${r.key}"
        />
        <input
          type="number"
          id="sim-num-${r.key}"
          class="score-num-input tabular-nums"
          min="0"
          max="100"
          value="${r.value}"
          data-sim-key="${r.key}"
        />
      </div>
    `
    )
    .join('');

  els.simulatorInputsContainer.querySelectorAll('[data-sim-key]').forEach((input) => {
    input.addEventListener('input', (e) => {
      const key = e.target.dataset.simKey;
      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
      if (key === 'attendance') {
        state.simulatorState.attendance = val;
      } else {
        state.simulatorState.scores[key] = val;
      }
      document.getElementById(`sim-range-${key}`).value = val;
      document.getElementById(`sim-num-${key}`).value = val;
      updateSimulatorCalculations();
    });
  });

  updateSimulatorCalculations();
}

function renderStudentAdvising() {
  const student = getActiveStudentRecord();
  if (!student) return;

  const allEnriched = state.students.map((s) => enrichStudent(s, state.thresholds));
  const subjectStats = computeSubjectStats(allEnriched, state.thresholds.passScore);
  const creditsPerCourse = (student.credits / SUBJECTS.length).toFixed(1);

  els.studentTranscriptBody.innerHTML = subjectStats
    .map((st) => {
      const score = Number(student.scores[st.key]) || 0;
      const letter = scoreToLetter(score);
      const pts = scoreToCgpa(score).toFixed(1);
      const passed = score >= state.thresholds.passScore;
      const status = passed ? 'Pass' : 'Arrear / Fail';
      const statusCls = passed ? 'status-nominal' : 'status-alert';
      return `
        <tr>
          <td><strong>${escapeHtml(st.label)}</strong></td>
          <td class="num-col tabular-nums">${creditsPerCourse}</td>
          <td class="num-col tabular-nums">${score}%</td>
          <td class="num-col tabular-nums">${escapeHtml(letter)}</td>
          <td class="num-col tabular-nums">${pts}</td>
          <td class="num-col tabular-nums">${st.mean.toFixed(1)}%</td>
          <td><span class="status-text ${statusCls}">${status}</span></td>
        </tr>
      `;
    })
    .join('');

  const notes = student.notes || [];
  els.studentAdvisingHistoryList.innerHTML = notes.length
    ? notes
        .map(
          (n) => `
          <li class="note-item">
            <div class="note-item-head">
              <span class="note-item-action">${escapeHtml(n.action)}</span>
              <span class="tabular-nums">${escapeHtml(n.date)}</span>
            </div>
            <div class="note-item-body">${escapeHtml(n.text)}</div>
          </li>
        `
        )
        .join('')
    : `<li class="note-item"><div class="note-item-body">No mentoring entries yet. Use the form to request a check-in or log a study goal.</div></li>`;

  els.studentAttLogSummary.textContent = `${student.attendedClasses} / ${student.totalClasses} classes attended (${student.attendance}%) · ${
    student.examEligible
      ? `Eligible (≥ ${state.thresholds.alertAttendance}% UGC norm)`
      : `Shortage (< ${state.thresholds.alertAttendance}% UGC norm)`
  }`;

  const stuSessions = state.attendanceSessions.filter((sess) => sess.records && sess.records[student.id]);
  els.studentAttendanceLogList.innerHTML = stuSessions.length
    ? stuSessions
        .map((sess) => {
          const code = sess.records[student.id];
          const label = code === 'P' ? 'Present' : code === 'OD' ? 'On-Duty (OD)' : 'Absent';
          const cls = code === 'P' ? 'status-nominal' : code === 'OD' ? 'status-warning' : 'status-alert';
          return `
            <li class="note-item">
              <div class="note-item-head">
                <span class="note-item-action">${escapeHtml(sess.subjectLabel)}</span>
                <span class="tabular-nums">${escapeHtml(sess.date)}</span>
              </div>
              <div class="note-item-body">
                Marked <span class="status-text ${cls}">${escapeHtml(label)}</span> · Saved by ${escapeHtml(sess.markedBy || state.facultyProfile.name)}
              </div>
            </li>
          `;
        })
        .join('')
    : `<li class="note-item"><div class="note-item-body">No daily roll-call sessions recorded yet. When faculty mark the Attendance Register, each lecture appears here.</div></li>`;
}

// FACULTY DAILY ATTENDANCE REGISTER
function getAttendanceRollCallStudents() {
  const enriched = state.students.map((s) => enrichStudent(s, state.thresholds));
  return enriched.filter((s) => {
    if (state.attendanceDraft.department !== 'all' && s.department !== state.attendanceDraft.department) return false;
    if (state.attendanceDraft.term !== 'all' && s.term !== state.attendanceDraft.term) return false;
    return true;
  });
}

function hydrateAttendanceDraftForSession() {
  const { date, subject } = state.attendanceDraft;
  const sessionId = `${date}|${subject}`;
  const existing = state.attendanceSessions.find((s) => s.id === sessionId);
  const nextMarks = {};
  for (const stu of state.students) {
    nextMarks[stu.id] = existing && existing.records[stu.id] ? existing.records[stu.id] : 'P';
  }
  state.attendanceDraft.marks = nextMarks;
}

function renderAttendanceRegister() {
  els.attSessionDate.value = state.attendanceDraft.date;
  els.attSessionSubject.value = state.attendanceDraft.subject;
  els.attSessionDept.value = state.attendanceDraft.department;
  els.attSessionTerm.value = state.attendanceDraft.term;

  const list = getAttendanceRollCallStudents();
  let presentCount = 0;
  let absentCount = 0;
  let odCount = 0;

  for (const s of list) {
    const mark = state.attendanceDraft.marks[s.id] || 'P';
    if (mark === 'P') presentCount += 1;
    else if (mark === 'A') absentCount += 1;
    else odCount += 1;
  }

  els.attSessionSummaryStrip.innerHTML = `
    <div class="profile-stat-box">
      <span class="profile-stat-label">Roll-Call Headcount</span>
      <span class="profile-stat-val tabular-nums">${list.length}</span>
    </div>
    <div class="profile-stat-box">
      <span class="profile-stat-label">Present (P)</span>
      <span class="profile-stat-val tabular-nums status-nominal">${presentCount}</span>
    </div>
    <div class="profile-stat-box">
      <span class="profile-stat-label">Absent (A)</span>
      <span class="profile-stat-val tabular-nums status-alert">${absentCount}</span>
    </div>
    <div class="profile-stat-box">
      <span class="profile-stat-label">On-Duty / Medical (OD)</span>
      <span class="profile-stat-val tabular-nums">${odCount}</span>
    </div>
  `;

  if (!list.length) {
    els.attendanceRegisterBody.innerHTML = '';
    els.attendanceEmptyState.classList.remove('hidden');
  } else {
    els.attendanceEmptyState.classList.add('hidden');
    els.attendanceRegisterBody.innerHTML = list
      .map((s) => {
        const mark = state.attendanceDraft.marks[s.id] || 'P';
        const ugcBadge = s.examEligible
          ? `<span class="status-text status-nominal"><span aria-hidden="true">✓</span>UGC Eligible</span>`
          : `<span class="status-text status-alert"><span aria-hidden="true">!</span>Shortage (&lt;${state.thresholds.alertAttendance}%)</span>`;
        return `
          <tr>
            <td class="tabular-nums" style="font-family: var(--font-mono); font-size: 12px;">${escapeHtml(s.id)}</td>
            <td>
              <div class="student-cell">
                ${studentProfileBadge(s)}
                <div class="student-name-cell">
                  <strong>${escapeHtml(s.name)}</strong>
                  <span class="student-email">${escapeHtml(s.year)} · ${escapeHtml(s.programme)}</span>
                </div>
              </div>
            </td>
            <td>${escapeHtml(s.department)} · ${escapeHtml(s.term)}</td>
            <td class="num-col tabular-nums">${s.attendedClasses} / ${s.totalClasses}</td>
            <td class="num-col tabular-nums">${s.attendance}%</td>
            <td>${ugcBadge}</td>
            <td class="action-col">
              <div class="att-toggle-group" role="group" aria-label="Attendance status for ${escapeHtml(s.name)}">
                <button type="button" class="att-toggle-btn ${mark === 'P' ? 'active-present' : ''}" data-att-id="${escapeHtml(s.id)}" data-att-val="P">Present</button>
                <button type="button" class="att-toggle-btn ${mark === 'A' ? 'active-absent' : ''}" data-att-id="${escapeHtml(s.id)}" data-att-val="A">Absent</button>
                <button type="button" class="att-toggle-btn ${mark === 'OD' ? 'active-od' : ''}" data-att-id="${escapeHtml(s.id)}" data-att-val="OD">OD</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    els.attendanceRegisterBody.querySelectorAll('[data-att-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.attendanceDraft.marks[btn.dataset.attId] = btn.dataset.attVal;
        renderAttendanceRegister();
      });
    });
  }

  els.attendanceHistoryList.innerHTML = state.attendanceSessions.length
    ? state.attendanceSessions
        .map((sess) => {
          const vals = Object.values(sess.records || {});
          const p = vals.filter((v) => v === 'P').length;
          const a = vals.filter((v) => v === 'A').length;
          const od = vals.filter((v) => v === 'OD').length;
          return `
            <li class="note-item att-history-item">
              <div>
                <div class="note-item-action">${escapeHtml(sess.date)} · ${escapeHtml(sess.subjectLabel)}</div>
                <div class="note-item-body tabular-nums">
                  ${vals.length} marked: ${p} Present · ${a} Absent · ${od} OD · Saved by ${escapeHtml(sess.markedBy || state.facultyProfile.name)}
                </div>
              </div>
              <div class="att-history-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-load-session="${escapeHtml(sess.id)}">Load / Edit</button>
              </div>
            </li>
          `;
        })
        .join('')
    : `<li class="note-item"><div class="note-item-body">No roll-call registers saved yet. Mark Present / Absent / OD above and click "Save Attendance Register".</div></li>`;

  els.attendanceHistoryList.querySelectorAll('[data-load-session]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sess = state.attendanceSessions.find((x) => x.id === btn.dataset.loadSession);
      if (!sess) return;
      state.attendanceDraft.date = sess.date;
      state.attendanceDraft.subject = sess.subject;
      state.attendanceDraft.department = sess.department || 'all';
      state.attendanceDraft.term = sess.term || 'all';
      hydrateAttendanceDraftForSession();
      renderAttendanceRegister();
      showToast(`Loaded register for ${sess.date} (${sess.subjectLabel})`);
    });
  });
}

// DEDICATED MY PROFILE RENDERER (FACULTY & STUDENT)
function renderProfileView() {
  const isStudent = state.role === 'student';
  const activeStudent = getActiveStudentRecord();
  const fac = state.facultyProfile;
  const allEnriched = state.students.map((s) => enrichStudent(s, state.thresholds));

  els.profileSaveConfirm.classList.add('hidden');
  els.profileSwitchRoleBtn.textContent = isStudent ? 'Switch to Faculty Portal' : 'Switch to Student Portal';
  els.profileFacultyBox.classList.toggle('hidden', isStudent);
  els.profileStudentBox.classList.toggle('hidden', !isStudent);

  if (isStudent && activeStudent) {
    setPortraitImage(els.profileHeroPhoto, els.profileHeroFallback, STUDENT_PORTRAIT, `${activeStudent.name} portrait`);
    els.profileSubtitle.textContent = 'Manage your student roll profile, campus email, and UGC exam eligibility status.';
    els.profileHeroKicker.textContent = `${activeStudent.id} · ${activeStudent.programme} · ${activeStudent.term}`;
    els.profileHeroName.textContent = activeStudent.name;
    els.profileHeroDesignation.textContent = `${activeStudent.department} · ${activeStudent.year} · Mentor: ${activeStudent.advisor}`;
    els.profileHeroStatus.innerHTML = statusMarkup(activeStudent.status);
    els.profileHeroBio.textContent =
      activeStudent.bio ||
      `Enrolled in ${activeStudent.programme} (${activeStudent.credits} CBCS credits) under mentorship of ${activeStudent.advisor}.`;

    els.profileMetaEmail.textContent = activeStudent.email;
    els.profileMetaSlot2Label.textContent = 'Faculty Mentor';
    els.profileMetaSlot2Val.textContent = activeStudent.advisor;
    els.profileMetaSlot3Label.textContent = 'Exam Eligibility';
    els.profileMetaSlot3Val.textContent = activeStudent.examEligible
      ? `Eligible (${activeStudent.attendance}% ≥ ${state.thresholds.alertAttendance}% UGC)`
      : `Detention Risk (${activeStudent.attendance}% < ${state.thresholds.alertAttendance}% UGC)`;

    els.profileFormTitle.textContent = 'Edit Student Profile';
    els.profileFormSubtitle.textContent = 'Update your personal campus contact details and study focus';
    els.profSecondaryLabel.textContent = 'Degree Programme';
    els.profTertiaryLabel.textContent = 'Year of Study';
    els.profQuaternaryLabel.textContent = 'Faculty Mentor';
    els.profBioLabel.textContent = 'Academic Goal / Bio';

    els.profNameInput.value = activeStudent.name;
    els.profEmailInput.value = activeStudent.email;
    els.profDeptSelect.value = activeStudent.department;
    els.profSecondaryInput.value = activeStudent.programme;
    els.profTertiaryInput.value = activeStudent.year;
    els.profQuaternaryInput.value = activeStudent.advisor;
    els.profBioInput.value = activeStudent.bio || '';

    els.profileSideTitle.textContent = 'Academic Snapshot & Switcher';
    els.profileSideSubtitle.textContent = 'Quickly switch active Indian student accounts or verify CBCS eligibility';

    const allAverages = allEnriched.map((s) => s.average);
    const pctRank = computePercentileRank(activeStudent.average, allAverages);
    els.profileStudentStats.innerHTML = `
      <div class="profile-stat-box">
        <span class="profile-stat-label">Semester CGPA</span>
        <span class="profile-stat-val tabular-nums">${activeStudent.cgpa.toFixed(2)} / 10</span>
      </div>
      <div class="profile-stat-box">
        <span class="profile-stat-label">Aggregate &amp; Grade</span>
        <span class="profile-stat-val tabular-nums">${activeStudent.average.toFixed(1)}% (${escapeHtml(activeStudent.letter)})</span>
      </div>
      <div class="profile-stat-box">
        <span class="profile-stat-label">Attendance</span>
        <span class="profile-stat-val tabular-nums">${activeStudent.attendance}%</span>
      </div>
      <div class="profile-stat-box">
        <span class="profile-stat-label">Cohort Rank</span>
        <span class="profile-stat-val tabular-nums">${pctRank}th pct</span>
      </div>
    `;

    els.profileStudentEligibilityBox.innerHTML = activeStudent.diagnostics
      .map((d) => `<li>• ${escapeHtml(d)}</li>`)
      .join('');
  } else {
    setPortraitImage(els.profileHeroPhoto, els.profileHeroFallback, FACULTY_PORTRAIT, `${fac.name} portrait`);
    els.profileSubtitle.textContent = 'Manage your faculty advisor credentials, consultation hours, and CBCS/UGC institutional rules.';
    els.profileHeroKicker.textContent = `${fac.facultyId} · ${fac.department}`;
    els.profileHeroName.textContent = fac.name;
    els.profileHeroDesignation.textContent = `${fac.designation} · ${fac.office}`;
    els.profileHeroStatus.innerHTML = `<span class="status-text status-nominal"><span aria-hidden="true">✓</span>Active Academic Dean</span>`;
    els.profileHeroBio.textContent = fac.bio;

    els.profileMetaEmail.textContent = fac.email;
    els.profileMetaSlot2Label.textContent = 'Consultation Hours';
    els.profileMetaSlot2Val.textContent = fac.officeHours;
    els.profileMetaSlot3Label.textContent = 'Academic Framework';
    els.profileMetaSlot3Val.textContent = `CBCS 10.0 · Pass ${state.thresholds.passScore}% · UGC ${state.thresholds.alertAttendance}%`;

    els.profileFormTitle.textContent = 'Edit Faculty Profile';
    els.profileFormSubtitle.textContent = 'Changes persist to localStorage and update the top bar immediately';
    els.profSecondaryLabel.textContent = 'Designation';
    els.profTertiaryLabel.textContent = 'Cabin / Office Location';
    els.profQuaternaryLabel.textContent = 'Consultation Hours (IST)';
    els.profBioLabel.textContent = 'Mentorship & Governance Bio';

    els.profNameInput.value = fac.name;
    els.profEmailInput.value = fac.email;
    els.profDeptSelect.value = fac.department;
    els.profSecondaryInput.value = fac.designation;
    els.profTertiaryInput.value = fac.office;
    els.profQuaternaryInput.value = fac.officeHours;
    els.profBioInput.value = fac.bio;

    els.profileSideTitle.textContent = 'Mentorship Load & CBCS Governance';
    els.profileSideSubtitle.textContent = 'Live institutional metrics and configurable UGC/CBCS alert norms';

    const mentees = allEnriched.filter((s) => (s.advisor || fac.name) === fac.name);
    const summary = computeCohortSummary(allEnriched, state.thresholds.passScore);
    const alertCount = allEnriched.filter((s) => s.status === 'Academic Alert').length;

    els.profileFacultyStats.innerHTML = `
      <div class="profile-stat-box">
        <span class="profile-stat-label">Direct Mentees</span>
        <span class="profile-stat-val tabular-nums">${mentees.length}</span>
      </div>
      <div class="profile-stat-box">
        <span class="profile-stat-label">Cohort Alerts</span>
        <span class="profile-stat-val tabular-nums">${alertCount}</span>
      </div>
      <div class="profile-stat-box">
        <span class="profile-stat-label">Cohort Mean CGPA</span>
        <span class="profile-stat-val tabular-nums">${summary.meanCgpa.toFixed(2)}</span>
      </div>
      <div class="profile-stat-box">
        <span class="profile-stat-label">Pass Rate (≥${state.thresholds.passScore}%)</span>
        <span class="profile-stat-val tabular-nums">${summary.passRate.toFixed(1)}%</span>
      </div>
    `;

    els.profThresholdPass.value = state.thresholds.passScore;
    els.profThresholdAlertScore.value = state.thresholds.alertScore;
    els.profThresholdAlertAtt.value = state.thresholds.alertAttendance;
    els.profThresholdReviewScore.value = state.thresholds.reviewScore;
  }
}

function renderDrawerSparkline(milestones) {
  const labels = ['CIA 1', 'Mid-Sem', 'Lab/Viva', 'End-Sem'];
  const pts = (Array.isArray(milestones) && milestones.length === 4 ? milestones : [72, 74, 76, 78]).map(
    (val, idx) => ({
      x: 36 + idx * 116,
      y: 60 - ((Math.max(30, Math.min(100, val)) - 30) / 70) * 44,
      val,
      label: labels[idx],
    })
  );

  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y.toFixed(1)}`).join(' ');
  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue('--accent').trim() || '#2563eb';
  const muted = styles.getPropertyValue('--text-muted').trim() || '#64748b';
  const surface = styles.getPropertyValue('--bg-surface').trim() || '#ffffff';

  els.drawerSparklineSvg.innerHTML = `
    <path d="${lineD}" fill="none" stroke="${primary}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
    ${pts
      .map(
        (p) => `
      <circle cx="${p.x}" cy="${p.y.toFixed(1)}" r="4" fill="${surface}" stroke="${primary}" stroke-width="2" />
      <text x="${p.x}" y="${(p.y - 8).toFixed(1)}" text-anchor="middle" fill="${primary}" font-size="10.5" font-family="JetBrains Mono, monospace" font-weight="600">${p.val}%</text>
      <text x="${p.x}" y="78" text-anchor="middle" fill="${muted}" font-size="10">${p.label}</text>
    `
      )
      .join('')}
  `;
}

function openStudentDrawer(studentId) {
  const raw = state.students.find((s) => s.id === studentId);
  if (!raw) return;

  state.selectedStudentId = studentId;
  const student = enrichStudent(raw, state.thresholds);
  const allAverages = state.students.map((s) => enrichStudent(s, state.thresholds).average);
  const percentile = computePercentileRank(student.average, allAverages);

  els.drawerAvatar.className = `student-profile-badge badge-lg ${deptAvatarClass(student.department)}`;
  els.drawerAvatar.innerHTML = profileIconSvg(22);
  els.drawerStudentMeta.textContent = `${student.id} · ${student.department} · ${student.term}`;
  els.drawerStudentName.textContent = student.name;
  els.drawerSubMeta.textContent = `${student.programme} · ${student.year} · ${student.credits} Credits · Mentor: ${student.advisor}`;
  els.drawerLastActive.textContent = `Last LMS activity: ${student.lastActive}`;

  els.drawerCgpa.textContent = student.cgpa.toFixed(2);
  els.drawerAvg.textContent = `${student.average.toFixed(1)}%`;
  els.drawerAttendance.textContent = `${student.attendance}%`;
  els.drawerPercentile.textContent = `${percentile}th`;
  els.drawerStanding.innerHTML = statusMarkup(student.status);

  els.drawerDiagnosticsList.innerHTML = student.diagnostics
    .map((item) => `<li>• ${escapeHtml(item)}</li>`)
    .join('');

  renderDrawerSparkline(student.milestones);

  const subjectRows = SUBJECTS.map((subj) => {
    const val = Number(student.scores[subj.key]) || 0;
    return `
      <div class="score-edit-row">
        <label class="score-edit-label" for="edit-${subj.key}">${escapeHtml(subj.label)}</label>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width: ${val}%;"></div>
        </div>
        <input
          type="number"
          id="edit-${subj.key}"
          name="${subj.key}"
          class="score-num-input tabular-nums"
          min="0"
          max="100"
          value="${val}"
          required
        />
      </div>
    `;
  }).join('');

  const attRow = `
    <div class="score-edit-row">
      <label class="score-edit-label" for="edit-attendance">Attendance (%)</label>
      <div class="score-bar-bg">
        <div class="score-bar-fill" style="width: ${student.attendance}%;"></div>
      </div>
      <input
        type="number"
        id="edit-attendance"
        name="attendance"
        class="score-num-input tabular-nums"
        min="0"
        max="100"
        value="${student.attendance}"
        required
      />
    </div>
  `;

  els.drawerScoresForm.innerHTML = subjectRows + attRow;

  renderDrawerNotes(student.notes || []);
  renderDrawerAiPanel(student);
  els.drawerSaveConfirm.classList.add('hidden');
  els.confirmDeleteBox.classList.add('hidden');
  els.deleteStudentBtn.classList.remove('hidden');

  els.studentDrawerOverlay.classList.add('open');
  els.studentDrawer.classList.add('open');
  els.studentDrawer.setAttribute('aria-hidden', 'false');
  els.closeDrawerBtn.focus();
}

function renderDrawerNotes(notes) {
  if (!notes.length) {
    els.drawerNotesList.innerHTML = `<li class="note-item"><div class="note-item-body">No mentoring notes logged for this student yet.</div></li>`;
    return;
  }
  els.drawerNotesList.innerHTML = notes
    .map(
      (n) => `
      <li class="note-item">
        <div class="note-item-head">
          <span class="note-item-action">${escapeHtml(n.action)}</span>
          <span class="tabular-nums">${escapeHtml(n.date)}</span>
        </div>
        <div class="note-item-body">${escapeHtml(n.text)}</div>
      </li>
    `
    )
    .join('');
}

function closeStudentDrawer() {
  state.selectedStudentId = null;
  els.studentDrawerOverlay.classList.remove('open');
  els.studentDrawer.classList.remove('open');
  els.studentDrawer.setAttribute('aria-hidden', 'true');
}

function openAddModal() {
  els.addStudentForm.reset();
  els.addStudentModalBackdrop.classList.add('open');
  els.addStudentModal.classList.add('open');
  els.addStudentModal.setAttribute('aria-hidden', 'false');
  document.getElementById('newStudentName').focus();
}

function closeAddModal() {
  els.addStudentModalBackdrop.classList.remove('open');
  els.addStudentModal.classList.remove('open');
  els.addStudentModal.setAttribute('aria-hidden', 'true');
}

function toggleProfilePopover(force) {
  const willOpen = typeof force === 'boolean' ? force : els.profilePopover.classList.contains('hidden');
  els.profilePopover.classList.toggle('hidden', !willOpen);
  els.profileTriggerBtn.setAttribute('aria-expanded', String(willOpen));
}

function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleCsvImportFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = parseCsvStudents(String(reader.result || ''));
      const existingIds = new Map(state.students.map((s, idx) => [s.id, idx]));
      let added = 0;
      let updated = 0;

      for (const rec of imported) {
        if (existingIds.has(rec.id)) {
          const i = existingIds.get(rec.id);
          rec.notes = state.students[i].notes || [];
          state.students[i] = rec;
          updated += 1;
        } else {
          state.students.unshift(rec);
          added += 1;
        }
      }

      saveStudents(state.students);
      els.importFeedback.textContent = `Imported ${imported.length} records (${added} added, ${updated} updated).`;
      els.importFeedback.className = 'import-feedback success';
      els.importFeedback.classList.remove('hidden');
      renderAll();
      showToast(`CSV imported: ${imported.length} records`);
    } catch (err) {
      els.importFeedback.textContent = err.message || 'Failed to parse CSV file.';
      els.importFeedback.className = 'import-feedback error';
      els.importFeedback.classList.remove('hidden');
    }
  };
  reader.readAsText(file);
}

function renderAll() {
  syncStudentSelectors();
  updateToolbarsVisibility();
  syncProfileUI();

  const cohortList = getFilteredStudents({ includeSearch: false, includeGradeTier: true });
  updateFilterBarUI(cohortList);

  if (state.activeView === 'overview') {
    renderOverview(cohortList);
  } else if (state.activeView === 'students') {
    renderStudentsTable();
  } else if (state.activeView === 'attendance') {
    renderAttendanceRegister();
  } else if (state.activeView === 'subjects') {
    renderSubjectsView(cohortList);
  } else if (state.activeView === 'interventions') {
    renderInterventionQueue(cohortList);
  } else if (state.activeView === 'student-dashboard') {
    renderStudentDashboard();
  } else if (state.activeView === 'student-simulator') {
    renderStudentSimulator();
  } else if (state.activeView === 'student-advising') {
    renderStudentAdvising();
  } else if (state.activeView === 'profile') {
    renderProfileView();
  }
}

function bindEvents() {
  els.roleBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchRole(btn.dataset.role));
  });

  els.navItems.forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.querySelector('[data-nav="home"]').addEventListener('click', (e) => {
    e.preventDefault();
    switchView(state.role === 'student' ? 'student-dashboard' : 'overview');
  });

  els.openMarkAttendanceBtn.addEventListener('click', () => {
    hydrateAttendanceDraftForSession();
    switchView('attendance');
  });
  els.cohortAiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerCohortAiInsights();
  });
  els.studentAiForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerStudentAiCoach();
  });
  els.generateDrawerAiBtn.addEventListener('click', () => {
    triggerDrawerAiBrief();
  });
  els.viewAllAlertsBtn.addEventListener('click', () => switchView('interventions'));
  els.openSimulatorFromDashBtn.addEventListener('click', () => switchView('student-simulator'));
  els.openAdvisingFromDashBtn.addEventListener('click', () => switchView('student-advising'));
  els.studentPrintBtn.addEventListener('click', () => window.print());

  const handleActiveStudentChange = (newId) => {
    state.activeStudentId = newId;
    resetSimulatorStateFromActive();
    renderAll();
  };

  els.activeStudentSelect.addEventListener('change', (e) => handleActiveStudentChange(e.target.value));
  els.toolbarStudentSelect.addEventListener('change', (e) => handleActiveStudentChange(e.target.value));
  els.profileStudentSelect.addEventListener('change', (e) => handleActiveStudentChange(e.target.value));

  els.mobileMenuBtn.addEventListener('click', () => {
    els.sidebar.classList.toggle('open');
    els.sidebarBackdrop.classList.toggle('open');
  });
  els.sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  els.themeToggleBtn.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    renderAll();
  });

  // Profile Popover & Thresholds
  els.profileTriggerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleProfilePopover();
  });

  document.addEventListener('click', (e) => {
    if (!els.profilePopover.classList.contains('hidden')) {
      if (!els.profilePopover.contains(e.target) && !els.profileTriggerBtn.contains(e.target)) {
        toggleProfilePopover(false);
      }
    }
  });

  els.popoverOpenProfileBtn.addEventListener('click', () => {
    toggleProfilePopover(false);
    switchView('profile');
  });

  els.popoverSwitchRoleBtn.addEventListener('click', () => {
    toggleProfilePopover(false);
    switchRole(state.role === 'faculty' ? 'student' : 'faculty');
  });

  els.profileSwitchRoleBtn.addEventListener('click', () => {
    switchRole(state.role === 'faculty' ? 'student' : 'faculty');
  });

  els.thresholdsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const scoreVal = Math.max(25, Math.min(75, Number(els.thresholdAlertScore.value) || 55));
    const attVal = Math.max(50, Math.min(95, Number(els.thresholdAlertAtt.value) || 75));
    state.thresholds = {
      ...state.thresholds,
      alertScore: scoreVal,
      alertAttendance: attVal,
      reviewScore: Math.min(90, scoreVal + 13),
      reviewAttendance: Math.min(98, attVal + 7),
    };
    saveThresholds(state.thresholds);
    toggleProfilePopover(false);
    renderAll();
    showToast(`Thresholds updated (${scoreVal}% score / ${attVal}% UGC att.)`);
  });

  els.resetThresholdsBtn.addEventListener('click', () => {
    state.thresholds = { ...DEFAULT_THRESHOLDS };
    saveThresholds(state.thresholds);
    renderAll();
    showToast('Restored default CBCS & UGC thresholds');
  });

  els.popoverOpenQueueBtn.addEventListener('click', () => {
    toggleProfilePopover(false);
    switchView('interventions');
  });

  // Dedicated Profile View Forms
  els.profileEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = els.profNameInput.value.trim();
    const email = els.profEmailInput.value.trim();
    const department = els.profDeptSelect.value;
    const secondary = els.profSecondaryInput.value.trim();
    const tertiary = els.profTertiaryInput.value.trim();
    const quaternary = els.profQuaternaryInput.value.trim();
    const bio = els.profBioInput.value.trim();

    if (!name || !email) return;

    if (state.role === 'student') {
      const student = state.students.find((s) => s.id === state.activeStudentId);
      if (!student) return;
      student.name = name;
      student.email = email;
      student.department = department;
      student.programme = secondary || student.programme;
      student.year = tertiary || student.year;
      student.advisor = quaternary || student.advisor;
      student.bio = bio;
      saveStudents(state.students);
      showToast(`Updated student profile for ${name}`);
    } else {
      state.facultyProfile = {
        ...state.facultyProfile,
        name,
        email,
        department,
        designation: secondary || state.facultyProfile.designation,
        office: tertiary || state.facultyProfile.office,
        officeHours: quaternary || state.facultyProfile.officeHours,
        bio: bio || state.facultyProfile.bio,
      };
      saveFacultyProfile(state.facultyProfile);
      showToast(`Updated faculty profile for ${name}`);
    }

    renderAll();
    els.profileSaveConfirm.classList.remove('hidden');
  });

  els.profileThresholdsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const passScore = Math.max(30, Math.min(55, Number(els.profThresholdPass.value) || 40));
    const alertScore = Math.max(35, Math.min(75, Number(els.profThresholdAlertScore.value) || 55));
    const alertAttendance = Math.max(60, Math.min(90, Number(els.profThresholdAlertAtt.value) || 75));
    const reviewScore = Math.max(alertScore + 5, Math.min(85, Number(els.profThresholdReviewScore.value) || 68));

    state.thresholds = {
      passScore,
      alertScore,
      alertAttendance,
      reviewScore,
      reviewAttendance: Math.min(95, alertAttendance + 7),
    };
    saveThresholds(state.thresholds);
    renderAll();
    showToast(`CBCS governance rules saved (${passScore}% pass / ${alertAttendance}% UGC att.)`);
  });

  els.profResetThresholdsBtn.addEventListener('click', () => {
    state.thresholds = { ...DEFAULT_THRESHOLDS };
    saveThresholds(state.thresholds);
    renderAll();
    showToast('Restored default CBCS & UGC thresholds');
  });

  // Student Self-Log Form & Simulator Reset
  els.resetSimulatorBtn.addEventListener('click', () => {
    resetSimulatorStateFromActive();
    renderStudentSimulator();
    showToast('Simulator reset to current marks');
  });

  els.studentSelfLogForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = state.students.find((s) => s.id === state.activeStudentId);
    if (!raw) return;

    const text = els.studentSelfNoteInput.value.trim();
    if (!text) return;

    const today = new Date().toISOString().slice(0, 10);
    raw.notes = raw.notes || [];
    raw.notes.unshift({
      date: today,
      action: els.studentSelfActionSelect.value,
      text,
    });

    els.studentSelfNoteInput.value = '';
    saveStudents(state.students);
    renderAll();
    showToast('Submitted to shared mentor log');
  });

  // Filters
  els.filterTerm.addEventListener('change', (e) => {
    state.filters.term = e.target.value;
    renderAll();
  });
  els.filterDepartment.addEventListener('change', (e) => {
    state.filters.department = e.target.value;
    renderAll();
  });
  els.filterStatus.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    renderAll();
  });

  const resetAllFilters = () => {
    state.filters = { term: 'all', department: 'all', status: 'all', gradeTier: null, search: '' };
    els.filterTerm.value = 'all';
    els.filterDepartment.value = 'all';
    els.filterStatus.value = 'all';
    els.studentSearchInput.value = '';
    renderAll();
  };

  els.resetFiltersBtn.addEventListener('click', resetAllFilters);
  els.emptyResetBtn.addEventListener('click', resetAllFilters);
  els.clearGradeFilterBtn.addEventListener('click', () => {
    state.filters.gradeTier = null;
    renderAll();
  });

  els.trendModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.trendMode = btn.dataset.trendMode;
      els.trendModeBtns.forEach((b) => b.classList.toggle('active', b === btn));
      renderAll();
    });
  });

  els.queueFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.queueFilter = btn.dataset.queueFilter;
      els.queueFilterBtns.forEach((b) => b.classList.toggle('active', b === btn));
      renderAll();
    });
  });

  els.studentSearchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderStudentsTable();
  });

  els.sortBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.sort;
      if (state.sort.key === k) {
        state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort.key = k;
        state.sort.dir = k === 'name' || k === 'id' || k === 'department' ? 'asc' : 'desc';
      }
      renderStudentsTable();
    });
  });

  els.closeDrawerBtn.addEventListener('click', closeStudentDrawer);
  els.studentDrawerOverlay.addEventListener('click', closeStudentDrawer);

  els.drawerScoresForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const student = state.students.find((s) => s.id === state.selectedStudentId);
    if (!student) return;

    const formData = new FormData(els.drawerScoresForm);
    SUBJECTS.forEach((subj) => {
      const val = Math.max(0, Math.min(100, Number(formData.get(subj.key)) || 0));
      student.scores[subj.key] = val;
    });

    const attVal = Math.max(0, Math.min(100, Number(formData.get('attendance')) ?? student.attendance));
    student.attendance = attVal;
    student.totalClasses = Number(student.totalClasses) || 40;
    student.attendedClasses = Math.round((attVal / 100) * student.totalClasses);

    const enriched = enrichStudent(student, state.thresholds);
    student.milestones = [
      student.milestones[0] || Math.round(enriched.average),
      student.milestones[1] || Math.round(enriched.average),
      student.milestones[2] || Math.round(enriched.average),
      Math.round(enriched.average),
    ];

    saveStudents(state.students);
    openStudentDrawer(student.id);
    els.drawerSaveConfirm.classList.remove('hidden');
    renderAll();
    showToast(`Updated marks & attendance for ${student.name}`);
  });

  // Attendance Register Events
  els.attSessionDate.addEventListener('change', (e) => {
    state.attendanceDraft.date = e.target.value || new Date().toISOString().slice(0, 10);
    hydrateAttendanceDraftForSession();
    renderAttendanceRegister();
  });

  els.attSessionSubject.addEventListener('change', (e) => {
    state.attendanceDraft.subject = e.target.value;
    hydrateAttendanceDraftForSession();
    renderAttendanceRegister();
  });

  els.attSessionDept.addEventListener('change', (e) => {
    state.attendanceDraft.department = e.target.value;
    renderAttendanceRegister();
  });

  els.attSessionTerm.addEventListener('change', (e) => {
    state.attendanceDraft.term = e.target.value;
    renderAttendanceRegister();
  });

  els.markAllPresentBtn.addEventListener('click', () => {
    const list = getAttendanceRollCallStudents();
    for (const s of list) {
      state.attendanceDraft.marks[s.id] = 'P';
    }
    renderAttendanceRegister();
    showToast(`Marked all ${list.length} students Present`);
  });

  els.saveAttendanceRegisterBtn.addEventListener('click', () => {
    const list = getAttendanceRollCallStudents();
    if (!list.length) {
      showToast('No students in current roll call');
      return;
    }

    const { date, subject, department, term, marks } = state.attendanceDraft;
    const sessionId = `${date}|${subject}`;
    const prevSession = state.attendanceSessions.find((s) => s.id === sessionId);
    const subjObj = SUBJECTS.find((s) => s.key === subject);
    const subjectLabel = subjObj ? subjObj.label : subject;

    const mergedRecords = { ...(prevSession?.records || {}) };

    for (const enrichedStu of list) {
      const raw = state.students.find((s) => s.id === enrichedStu.id);
      if (!raw) continue;

      raw.totalClasses = Number(raw.totalClasses) || 40;
      raw.attendedClasses =
        typeof raw.attendedClasses === 'number'
          ? raw.attendedClasses
          : Math.round((Number(raw.attendance) / 100) * raw.totalClasses);

      const newStatus = marks[raw.id] || 'P';
      const prevStatus = prevSession?.records ? prevSession.records[raw.id] : undefined;
      const nowAttended = newStatus === 'P' || newStatus === 'OD';

      if (prevStatus === undefined) {
        raw.totalClasses += 1;
        if (nowAttended) raw.attendedClasses += 1;
      } else {
        const wasAttended = prevStatus === 'P' || prevStatus === 'OD';
        if (!wasAttended && nowAttended) {
          raw.attendedClasses += 1;
        } else if (wasAttended && !nowAttended) {
          raw.attendedClasses = Math.max(0, raw.attendedClasses - 1);
        }
      }

      raw.attendance = Math.round((raw.attendedClasses / raw.totalClasses) * 100);
      raw.lastActive = 'Marked today';
      mergedRecords[raw.id] = newStatus;
    }

    const sessionRecord = {
      id: sessionId,
      date,
      subject,
      subjectLabel,
      department,
      term,
      markedBy: state.facultyProfile.name,
      records: mergedRecords,
    };

    state.attendanceSessions = [
      sessionRecord,
      ...state.attendanceSessions.filter((s) => s.id !== sessionId),
    ];

    saveStudents(state.students);
    saveAttendanceSessions(state.attendanceSessions);
    renderAll();
    showToast(`Saved attendance register for ${date} (${subjectLabel})`);
  });

  els.advisorNoteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const student = state.students.find((s) => s.id === state.selectedStudentId);
    if (!student) return;

    const text = els.advisorNoteInput.value.trim();
    if (!text) return;

    const today = new Date().toISOString().slice(0, 10);
    student.notes = student.notes || [];
    student.notes.unshift({
      date: today,
      action: els.advisorActionSelect.value,
      text,
    });

    els.advisorNoteInput.value = '';
    saveStudents(state.students);
    renderDrawerNotes(student.notes);
    renderAll();
    showToast('Mentor note recorded');
  });

  els.deleteStudentBtn.addEventListener('click', () => {
    els.deleteStudentBtn.classList.add('hidden');
    els.confirmDeleteBox.classList.remove('hidden');
  });

  els.confirmDeleteNoBtn.addEventListener('click', () => {
    els.confirmDeleteBox.classList.add('hidden');
    els.deleteStudentBtn.classList.remove('hidden');
  });

  els.confirmDeleteYesBtn.addEventListener('click', () => {
    const id = state.selectedStudentId;
    state.students = state.students.filter((s) => s.id !== id);
    if (state.activeStudentId === id && state.students.length) {
      state.activeStudentId = state.students[0].id;
    }
    saveStudents(state.students);
    closeStudentDrawer();
    renderAll();
    showToast('Student record removed');
  });

  els.openAddStudentBtn.addEventListener('click', openAddModal);
  els.closeAddModalBtn.addEventListener('click', closeAddModal);
  els.cancelAddModalBtn.addEventListener('click', closeAddModal);
  els.addStudentModalBackdrop.addEventListener('click', closeAddModal);

  els.addStudentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newStudentName').value.trim();
    const customRoll = document.getElementById('newStudentRollNo').value.trim().toUpperCase();
    const email = document.getElementById('newStudentEmail').value.trim();
    const department = document.getElementById('newStudentDept').value;
    const term = document.getElementById('newStudentTerm').value;
    const year = document.getElementById('newStudentYear').value;
    const credits = Number(document.getElementById('newStudentCredits').value);
    const attendance = Number(document.getElementById('newStudentAttendance').value);
    const completion = Number(document.getElementById('newStudentCompletion').value);

    const scores = {
      dsa: Number(document.getElementById('scoreDsa').value),
      maths: Number(document.getElementById('scoreMaths').value),
      dbms: Number(document.getElementById('scoreDbms').value),
      comm: Number(document.getElementById('scoreComm').value),
      lab: Number(document.getElementById('scoreLab').value),
    };

    const maxNum = state.students.reduce((max, s) => {
      const m = Number(String(s.id).slice(-3)) || 100;
      return Math.max(max, m);
    }, 100);

    const rollNo = customRoll || `24${deptPrefixForRoll(department)}${maxNum + 1}`;
    const avg = (scores.dsa + scores.maths + scores.dbms + scores.comm + scores.lab) / 5;
    const newStudent = {
      id: rollNo,
      name,
      email,
      department,
      programme: defaultProgrammeForDept(department),
      term,
      year,
      credits,
      advisor: state.facultyProfile.name,
      lastActive: 'Just enrolled',
      attendance,
      completion,
      scores,
      milestones: [Math.round(avg - 2), Math.round(avg - 1), Math.round(avg), Math.round(avg)],
      notes: [],
    };

    state.students.unshift(newStudent);
    saveStudents(state.students);
    closeAddModal();
    renderAll();
    showToast(`Enrolled ${name} (${newStudent.id})`);
  });

  const exportCurrentCsv = () => {
    const list = getFilteredStudents({ includeSearch: true, includeGradeTier: true });
    downloadCsv(`scholametrics-cbcs-cohort-${new Date().toISOString().slice(0, 10)}.csv`, studentsToCsv(list));
    showToast(`Exported ${list.length} student records`);
  };

  els.exportCsvQuickBtn.addEventListener('click', exportCurrentCsv);
  els.exportCsvBtn.addEventListener('click', exportCurrentCsv);
  els.popoverExportBtn.addEventListener('click', () => {
    toggleProfilePopover(false);
    exportCurrentCsv();
  });

  els.downloadTemplateBtn.addEventListener('click', () => {
    const template = [
      'rollNo,name,email,department,term,year,credits,attendance,completion,dsa,maths,dbms,comm,lab',
      '24CSE201,Vivaan Nair,vivaan.nair@nit-campus.ac.in,Computer Science & Engg.,Odd Sem 2026,3rd Year,22,92,94,89,85,91,84,92',
      '24ECE202,Tara Deshpande,tara.d@nit-campus.ac.in,Electronics & Comm.,Odd Sem 2026,2nd Year,20,71,76,62,68,65,72,64',
    ].join('\n');
    downloadCsv('scholametrics-in-template.csv', template);
  });

  els.csvDropzone.addEventListener('click', () => els.csvFileInput.click());
  els.csvDropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      els.csvFileInput.click();
    }
  });
  els.csvFileInput.addEventListener('change', (e) => {
    handleCsvImportFile(e.target.files[0]);
    els.csvFileInput.value = '';
  });
  els.csvDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.csvDropzone.classList.add('drag-over');
  });
  els.csvDropzone.addEventListener('dragleave', () => {
    els.csvDropzone.classList.remove('drag-over');
  });
  els.csvDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    els.csvDropzone.classList.remove('drag-over');
    handleCsvImportFile(e.dataTransfer.files[0]);
  });

  els.printReportBtn.addEventListener('click', () => {
    switchView('overview');
    setTimeout(() => window.print(), 100);
  });

  els.resetSampleDataBtn.addEventListener('click', () => {
    state.students = resetStoredStudents();
    state.attendanceSessions = [];
    hydrateAttendanceDraftForSession();
    state.activeStudentId = state.students[0]?.id || '24CSE101';
    resetAllFilters();
    showToast('Restored default 24-student Indian dataset');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!els.profilePopover.classList.contains('hidden')) toggleProfilePopover(false);
      if (els.addStudentModal.classList.contains('open')) closeAddModal();
      if (els.studentDrawer.classList.contains('open')) closeStudentDrawer();
      closeMobileSidebar();
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.activeView === 'overview') {
        renderOverview(getFilteredStudents({ includeSearch: false, includeGradeTier: true }));
      } else if (state.activeView === 'student-dashboard') {
        renderStudentDashboard();
      }
    }, 100);
  });
}

hydrateAttendanceDraftForSession();
applyTheme(state.theme);
bindEvents();
renderAll();
