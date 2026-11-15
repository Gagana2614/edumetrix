import { SUBJECTS, DEFAULT_THRESHOLDS } from './data.js';

export function getStudentAverage(student) {
  const vals = SUBJECTS.map((s) => Number(student.scores[s.key]) || 0);
  return vals.reduce((sum, v) => sum + v, 0) / vals.length;
}

// Standard Indian University 10-Point CBCS Grade Point Scale
export function scoreToCgpa(score) {
  if (score >= 90) return 10.0;
  if (score >= 80) return 9.0;
  if (score >= 70) return 8.0;
  if (score >= 60) return 7.0;
  if (score >= 50) return 6.0;
  if (score >= 45) return 5.0;
  if (score >= 40) return 4.0;
  return 0.0;
}

// Standard Indian CBCS Letter Grades (O, A+, A, B+, B, C, P, F)
export function scoreToLetter(score) {
  if (score >= 90) return 'O';
  if (score >= 80) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 60) return 'B+';
  if (score >= 50) return 'B';
  if (score >= 45) return 'C';
  if (score >= 40) return 'P';
  return 'F';
}

export function getStudentStanding(student, thresholds = DEFAULT_THRESHOLDS) {
  const avg = getStudentAverage(student);
  const hasBacklog = SUBJECTS.some((s) => (Number(student.scores[s.key]) || 0) < thresholds.passScore);
  if (avg < thresholds.alertScore || student.attendance < thresholds.alertAttendance || hasBacklog) {
    return 'Academic Alert';
  }
  if (
    avg < thresholds.reviewScore ||
    student.attendance < thresholds.reviewAttendance ||
    student.completion < 80
  ) {
    return 'Needs Review';
  }
  return 'On Track';
}

export function getStudentDiagnostics(student, thresholds = DEFAULT_THRESHOLDS) {
  const avg = getStudentAverage(student);
  const factors = [];
  if (avg < thresholds.alertScore) {
    factors.push(`Aggregate ${avg.toFixed(1)}% is below ${thresholds.alertScore}% alert threshold`);
  } else if (avg < thresholds.reviewScore) {
    factors.push(`Aggregate ${avg.toFixed(1)}% is below ${thresholds.reviewScore}% merit benchmark`);
  }
  if (student.attendance < thresholds.alertAttendance) {
    factors.push(`Attendance ${student.attendance}% violates ${thresholds.alertAttendance}% UGC exam eligibility norm`);
  } else if (student.attendance < thresholds.reviewAttendance) {
    factors.push(`Attendance ${student.attendance}% is nearing the ${thresholds.alertAttendance}% minimum`);
  }
  if (student.completion < 80) {
    factors.push(`CIA / Assignment submission at ${student.completion}% (< 80%)`);
  }
  const backlogs = SUBJECTS.filter((s) => (Number(student.scores[s.key]) || 0) < thresholds.passScore).map((s) => s.label);
  if (backlogs.length) {
    factors.push(`Arrear / Backlog risk (< ${thresholds.passScore}%): ${backlogs.join(', ')}`);
  }
  if (!factors.length) {
    factors.push('Eligible for End-Sem examinations · Meeting all CBCS academic and 75% attendance norms.');
  }
  return factors;
}

export function enrichStudent(student, thresholds = DEFAULT_THRESHOLDS) {
  const average = getStudentAverage(student);
  const cgpa = scoreToCgpa(average);
  const letter = scoreToLetter(average);
  const status = getStudentStanding(student, thresholds);
  const diagnostics = getStudentDiagnostics(student, thresholds);
  const examEligible = student.attendance >= thresholds.alertAttendance;
  const totalClasses = Number(student.totalClasses) || 40;
  const attendedClasses =
    typeof student.attendedClasses === 'number'
      ? student.attendedClasses
      : Math.round((Number(student.attendance) / 100) * totalClasses);
  return {
    ...student,
    programme: student.programme || 'B.Tech',
    year: student.year || '2nd Year',
    credits: student.credits || 20,
    advisor: student.advisor || 'Dr. Meenakshi Sundaram',
    lastActive: student.lastActive || 'Today',
    totalClasses,
    attendedClasses,
    average,
    cgpa,
    letter,
    status,
    examEligible,
    diagnostics,
  };
}

export function computeMean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeMedian(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeStdDev(values) {
  if (values.length < 2) return 0;
  const mean = computeMean(values);
  const sqDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

export function computePearsonAndRegression(points) {
  const n = points.length;
  if (n < 2) return { r: 0, slope: 0, intercept: 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

  const num = n * sumXY - sumX * sumY;
  const denX = n * sumX2 - sumX * sumX;
  const denY = n * sumY2 - sumY * sumY;

  const r = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
  const slope = denX > 0 ? num / denX : 0;
  const intercept = (sumY - slope * sumX) / n;

  return { r, slope, intercept };
}

export function computeCohortSummary(enrichedStudents, passScore = 40) {
  const count = enrichedStudents.length;
  if (count === 0) {
    return {
      count: 0,
      meanCgpa: 0,
      medianCgpa: 0,
      stdDevCgpa: 0,
      passRate: 0,
      passingCount: 0,
      meanAttendance: 0,
      alertCount: 0,
      pearsonR: 0,
      regression: { slope: 0, intercept: 0 },
    };
  }

  const cgpas = enrichedStudents.map((s) => s.cgpa);
  const attendances = enrichedStudents.map((s) => s.attendance);
  const passingCount = enrichedStudents.filter((s) => s.average >= passScore).length;
  const alertCount = enrichedStudents.filter((s) => s.status === 'Academic Alert').length;

  const points = enrichedStudents.map((s) => ({ x: s.attendance, y: s.average }));
  const reg = computePearsonAndRegression(points);

  return {
    count,
    meanCgpa: computeMean(cgpas),
    medianCgpa: computeMedian(cgpas),
    stdDevCgpa: computeStdDev(cgpas),
    passRate: (passingCount / count) * 100,
    passingCount,
    meanAttendance: computeMean(attendances),
    alertCount,
    pearsonR: reg.r,
    regression: { slope: reg.slope, intercept: reg.intercept },
  };
}

export function computeGradeDistribution(enrichedStudents) {
  const tiers = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];
  const counts = Object.fromEntries(tiers.map((t) => [t, 0]));
  for (const s of enrichedStudents) {
    if (counts[s.letter] !== undefined) {
      counts[s.letter] += 1;
    }
  }
  const total = enrichedStudents.length || 1;
  return tiers.map((tier) => ({
    tier,
    count: counts[tier],
    pct: (counts[tier] / total) * 100,
  }));
}

export function computeMilestoneTrends(enrichedStudents, mode = 'score') {
  const labels = ['CIA 1', 'Mid-Sem', 'Lab / Viva', 'End-Sem'];
  return labels.map((label, idx) => {
    if (!enrichedStudents.length) {
      return { label, value: 0, benchmark: mode === 'cgpa' ? 7.5 : 72 };
    }
    const vals = enrichedStudents.map((s) => {
      const m = Array.isArray(s.milestones) && s.milestones[idx] !== undefined
        ? s.milestones[idx]
        : s.average;
      return mode === 'cgpa' ? scoreToCgpa(m) : m;
    });
    return {
      label,
      value: computeMean(vals),
      benchmark: mode === 'cgpa' ? 7.5 : 72,
    };
  });
}

export function computeSubjectStats(enrichedStudents, passScore = 40) {
  return SUBJECTS.map((subj) => {
    const vals = enrichedStudents.map((s) => Number(s.scores[subj.key]) || 0);
    if (!vals.length) {
      return {
        key: subj.key,
        label: subj.label,
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        passRate: 0,
      };
    }
    const passing = vals.filter((v) => v >= passScore).length;
    return {
      key: subj.key,
      label: subj.label,
      mean: computeMean(vals),
      median: computeMedian(vals),
      stdDev: computeStdDev(vals),
      min: Math.min(...vals),
      max: Math.max(...vals),
      passRate: (passing / vals.length) * 100,
    };
  });
}

export function computeDepartmentStats(enrichedStudents) {
  const groups = new Map();
  for (const s of enrichedStudents) {
    if (!groups.has(s.department)) {
      groups.set(s.department, []);
    }
    groups.get(s.department).push(s);
  }
  return Array.from(groups.entries())
    .map(([department, list]) => {
      const alerts = list.filter((s) => s.status === 'Academic Alert').length;
      return {
        department,
        count: list.length,
        meanScore: computeMean(list.map((s) => s.average)),
        meanCgpa: computeMean(list.map((s) => s.cgpa)),
        meanAttendance: computeMean(list.map((s) => s.attendance)),
        alertRate: (alerts / list.length) * 100,
      };
    })
    .sort((a, b) => b.meanCgpa - a.meanCgpa);
}

export function computePercentileRank(studentAverage, allAverages) {
  if (!allAverages.length) return 0;
  const belowOrEqual = allAverages.filter((a) => a <= studentAverage).length;
  return Math.round((belowOrEqual / allAverages.length) * 100);
}

export function studentsToCsv(enrichedStudents) {
  const headers = [
    'rollNo',
    'name',
    'email',
    'department',
    'term',
    'year',
    'credits',
    'attendance',
    'completion',
    'dsa',
    'maths',
    'dbms',
    'comm',
    'lab',
    'average',
    'cgpa',
    'grade',
    'status',
  ];
  const escape = (val) => {
    const str = String(val ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const rows = enrichedStudents.map((s) =>
    [
      s.id,
      s.name,
      s.email,
      s.department,
      s.term,
      s.year,
      s.credits,
      s.attendance,
      s.completion,
      s.scores.dsa,
      s.scores.maths,
      s.scores.dbms,
      s.scores.comm,
      s.scores.lab,
      s.average.toFixed(1),
      s.cgpa.toFixed(2),
      s.letter,
      s.status,
    ]
      .map(escape)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function parseCsvStudents(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one student row.');
  }

  const splitRow = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase());
  const idx = (name) => headers.indexOf(name.toLowerCase());

  const required = ['name', 'department', 'term', 'attendance', 'dsa', 'maths', 'dbms', 'comm', 'lab'];
  for (const req of required) {
    if (idx(req) === -1) {
      throw new Error(`Missing required CSV column: "${req}".`);
    }
  }

  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
  const parsed = [];

  for (let r = 1; r < lines.length; r += 1) {
    const cols = splitRow(lines[r]);
    const name = cols[idx('name')];
    if (!name) continue;

    const idCol = idx('rollno') !== -1 ? idx('rollno') : idx('id');
    const emailCol = idx('email');
    const compCol = idx('completion');
    const yearCol = idx('year');
    const creditsCol = idx('credits');

    const dsa = clamp(Number(cols[idx('dsa')]), 0, 100);
    const maths = clamp(Number(cols[idx('maths')]), 0, 100);
    const dbms = clamp(Number(cols[idx('dbms')]), 0, 100);
    const comm = clamp(Number(cols[idx('comm')]), 0, 100);
    const lab = clamp(Number(cols[idx('lab')]), 0, 100);
    const avg = (dsa + maths + dbms + comm + lab) / 5;

    parsed.push({
      id: (idCol !== -1 && cols[idCol]) || `24IN${200 + r}`,
      name,
      email: (emailCol !== -1 && cols[emailCol]) || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@nit-campus.ac.in`,
      department: cols[idx('department')] || 'Computer Science & Engg.',
      programme: 'B.Tech',
      term: cols[idx('term')] || 'Odd Sem 2026',
      year: (yearCol !== -1 && cols[yearCol]) || '2nd Year',
      credits: creditsCol !== -1 ? clamp(Number(cols[creditsCol]), 4, 28) : 20,
      advisor: 'Dr. Meenakshi Sundaram',
      lastActive: 'Imported today',
      attendance: clamp(Number(cols[idx('attendance')]), 0, 100),
      completion: compCol !== -1 ? clamp(Number(cols[compCol]), 0, 100) : 85,
      scores: { dsa, maths, dbms, comm, lab },
      milestones: [
        Math.round(clamp(avg - 3, 0, 100)),
        Math.round(clamp(avg - 1, 0, 100)),
        Math.round(clamp(avg + 1, 0, 100)),
        Math.round(avg),
      ],
      notes: [],
    });
  }

  if (!parsed.length) {
    throw new Error('No valid student records could be parsed from the CSV.');
  }
  return parsed;
}
