const fs = require('fs');
const mongoose = require('mongoose');

function loadEnv() {
  const content = fs.readFileSync('.env', 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.db.collection('users');
  const activities = mongoose.connection.db.collection('activities');
  const participations = mongoose.connection.db.collection('participations');
  const assignments = mongoose.connection.db.collection('assignments');

  const managers = await users.find({ role: { $in: ['MANAGER', 'ADMIN'] } }).project({ email: 1, role: 1 }).toArray();
  console.log('MANAGERS=' + JSON.stringify(managers));

  const employees = await users.find({ role: 'EMPLOYEE' }).project({ _id: 1, email: 1, department_id: 1, name: 1 }).toArray();
  const approvedActivities = await activities.find({ workflowStatus: 'approved' }).project({ _id: 1, title: 1, intent: 1, targetDepartments: 1, type: 1, level: 1 }).toArray();
  console.log('APPROVED_COUNT=' + approvedActivities.length);

  for (const activity of approvedActivities) {
    const targetDepartments = activity.targetDepartments || [];
    let eligible = employees.filter((user) => {
      const departmentId = user.department_id?._id?.toString?.() || user.department_id?.toString?.();
      return targetDepartments.length === 0 || (departmentId && targetDepartments.includes(departmentId));
    });

    const participationRows = await participations.find({ activityId: new mongoose.Types.ObjectId(activity._id) }).project({ userId: 1 }).toArray();
    const assignmentRows = await assignments.find({ activityId: new mongoose.Types.ObjectId(activity._id) }).project({ userId: 1 }).toArray();
    const excluded = new Set([
      ...participationRows.map((row) => row.userId.toString()),
      ...assignmentRows.map((row) => row.userId.toString()),
    ]);
    eligible = eligible.filter((user) => !excluded.has(user._id.toString()));

    if (eligible.length > 0) {
      console.log('MATCH_ACTIVITY=' + JSON.stringify({
        activityId: activity._id.toString(),
        title: activity.title,
        intent: activity.intent,
        type: activity.type,
        targetDepartments,
        eligibleCount: eligible.length,
        eligibleSample: eligible.slice(0, 5).map((user) => ({ id: user._id.toString(), email: user.email, name: user.name })),
      }));
      break;
    }
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('ERR', error);
  process.exit(1);
});
