const fs = require('fs');
const mongoose = require('mongoose');

function loadEnv() {
  const content = fs.readFileSync('.env', 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

function asId(value) {
  return value ? value.toString() : null;
}

async function postJson(url, body, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

async function getJson(url, token) {
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  loadEnv();
  const apiBase = process.env.API_BASE || 'http://127.0.0.1:3001';

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const activities = db.collection('activities');
  const participations = db.collection('participations');
  const assignments = db.collection('assignments');

  const employee = await users.findOne(
    { role: 'EMPLOYEE' },
    { projection: { _id: 1, email: 1, name: 1, department_id: 1 } },
  );

  const anyActivity = await activities.findOne(
    {},
    { projection: { _id: 1, title: 1, intent: 1, workflowStatus: 1, targetDepartments: 1 } },
  );

  const managerCandidates = await users
    .find(
      { role: { $in: ['MANAGER', 'ADMIN'] } },
      { projection: { _id: 1, email: 1, role: 1 } },
    )
    .limit(10)
    .toArray();

  const approvedActivities = await activities
    .find(
      { workflowStatus: 'approved' },
      { projection: { _id: 1, title: 1, intent: 1, targetDepartments: 1 } },
    )
    .toArray();

  let firstApprovedWithEligible = null;
  const allEmployees = await users
    .find(
      { role: 'EMPLOYEE' },
      { projection: { _id: 1, email: 1, name: 1, department_id: 1 } },
    )
    .toArray();

  for (const activity of approvedActivities) {
    const targetDepartments = activity.targetDepartments || [];

    let eligible = allEmployees.filter((u) => {
      const userDepartment = asId(u.department_id?._id) || asId(u.department_id);
      return targetDepartments.length === 0 || (userDepartment && targetDepartments.includes(userDepartment));
    });

    const participationRows = await participations
      .find({ activityId: new mongoose.Types.ObjectId(activity._id) }, { projection: { userId: 1 } })
      .toArray();
    const assignmentRows = await assignments
      .find({ activityId: new mongoose.Types.ObjectId(activity._id) }, { projection: { userId: 1 } })
      .toArray();

    const excluded = new Set([
      ...participationRows.map((x) => asId(x.userId)).filter(Boolean),
      ...assignmentRows.map((x) => asId(x.userId)).filter(Boolean),
    ]);

    eligible = eligible.filter((u) => !excluded.has(asId(u._id)));

    if (eligible.length > 0) {
      firstApprovedWithEligible = {
        activityId: asId(activity._id),
        title: activity.title,
        intent: activity.intent,
        eligibleCount: eligible.length,
      };
      break;
    }
  }

  await mongoose.disconnect();

  const report = {
    data: {
      employee: employee
        ? { id: asId(employee._id), email: employee.email, name: employee.name }
        : null,
      anyActivity: anyActivity
        ? {
            id: asId(anyActivity._id),
            title: anyActivity.title,
            intent: anyActivity.intent || null,
            workflowStatus: anyActivity.workflowStatus || null,
          }
        : null,
      approvedActivityCount: approvedActivities.length,
      approvedWithEligible: firstApprovedWithEligible,
      managers: managerCandidates.map((m) => ({ id: asId(m._id), email: m.email, role: m.role })),
    },
    auth: { success: false, usedEmail: null },
    predict: null,
    recommendations: null,
  };

  const loginAttempts = [
    { email: 'manager.test@maghrebia.local', password: 'ManagerTest!2025' },
    { email: 'admin@test.com', password: 'AdminTest!2025' },
    { email: 'manager@test.com', password: 'ManagerTest!2025' },
  ];

  let token = null;
  for (const attempt of loginAttempts) {
    const loginResult = await postJson(`${apiBase}/auth/login`, {
      email: attempt.email,
      password: attempt.password,
    });
    const t = loginResult.json?.access_token || loginResult.json?.accessToken || loginResult.json?.token;
    if (loginResult.ok && t) {
      token = t;
      report.auth = {
        success: true,
        usedEmail: attempt.email,
      };
      break;
    }
  }

  if (token && report.data.employee && report.data.anyActivity) {
    const predictResult = await getJson(
      `${apiBase}/api/scoring/predict/${report.data.employee.id}/${report.data.anyActivity.id}`,
      token,
    );
    report.predict = {
      status: predictResult.status,
      success: !!predictResult.json?.success,
      score: predictResult.json?.score,
      scorePercent: predictResult.json?.scorePercent,
      label: predictResult.json?.label,
    };
  }

  if (token && report.data.approvedWithEligible) {
    const recommendationsResult = await getJson(
      `${apiBase}/api/scoring/activity/${report.data.approvedWithEligible.activityId}/recommendations?context=medium&limit=5`,
      token,
    );

    const firstRec = recommendationsResult.json?.recommendations?.[0] || null;
    report.recommendations = {
      status: recommendationsResult.status,
      success: !!recommendationsResult.json?.success,
      totalRecommendations: recommendationsResult.json?.totalRecommendations ?? 0,
      firstRecommendationKeys: firstRec ? Object.keys(firstRec) : [],
    };
  } else {
    report.recommendations = {
      skipped: true,
      reason: report.data.approvedWithEligible
        ? 'Authentication failed'
        : 'No approved activity with eligible employees in current DB',
    };
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
