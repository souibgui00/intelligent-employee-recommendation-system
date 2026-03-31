# Frontend Activity Filtering Analysis
## Role-Based Activity Display Logic

---

## 1. FILES WITH ROLE-BASED ACTIVITY FILTERING

### Employee Activities Display
- **File**: [app/employee/activities/page.jsx](app/employee/activities/page.jsx)
- **File Size**: Large component with two main activity lists

### Manager Activities Display
- **File**: [app/manager/activities/page.jsx](app/manager/activities/page.jsx)
- **Related Files**:
  - [app/manager/activities/ActivityDetailsView.jsx](app/manager/activities/ActivityDetailsView.jsx)
  - [app/manager/activities/details/[activityId]/page.jsx](app/manager/activities/details/[activityId]/page.jsx)

### Admin Activities Display
- **File**: [app/admin/activities/page.jsx](app/admin/activities/page.jsx)

### Shared Components Used Across Roles
- **File**: [components/activities/activity-list.jsx](components/activities/activity-list.jsx) - Generic activity list (used by HR/Admin)
- **File**: [components/dashboard/upcoming-activities.jsx](components/dashboard/upcoming-activities.jsx) - Dashboard widget on all dashboards

### Data Management
- **File**: [lib/data-store.jsx](lib/data-store.jsx) - Central data store with role-aware notifications

---

## 2. ACTIVITY FILTERING LOGIC BY ROLE

### EMPLOYEE ROLE
**File**: [app/employee/activities/page.jsx](app/employee/activities/page.jsx#L35-L48)

#### Restriction: MUST BE APPROVED
```javascript
// Strictly only show approved activities
if (activity && activity.workflowStatus === 'approved') {
  return { ...activity, participation: p }
}
```

#### Enrolled Activities Filter (Lines 35-42)
```javascript
const enrolledActivities = participations
  ?.filter(p => p.status === 'started' || p.status === 'completed')
  .map(p => {
    const activity = typeof p.activityId === 'object' ? p.activityId : activities.find(...)
    // Strictly only show approved activities
    if (activity && activity.workflowStatus === 'approved') {
      return { ...activity, participation: p }
    }
    return null
  })
  .filter(Boolean) || []
```

#### Available Activities Filter (Lines 44-48)
```javascript
const availableActivities = activities.filter(a =>
  !enrolledIds.includes(a.id) &&
  !enrolledIds.includes(a._id) &&
  a.workflowStatus === 'approved' &&
  ["upcoming", "active", "open"].includes(a.status?.toLowerCase())
)
```

**Filters Applied**:
- ✅ `workflowStatus === 'approved'` - **HARDCODED REQUIREMENT**
- ✅ Status must be in: `["upcoming", "active", "open"]`
- ✅ Must not be already enrolled
- ✅ Participation status must be 'started' or 'completed' (for enrolled tab)

**Result**: Employees see only APPROVED and OPEN/UPCOMING/ACTIVE activities

---

### MANAGER ROLE
**File**: [app/manager/activities/page.jsx](app/manager/activities/page.jsx#L80-L82)

#### Pending Approval Activities (Line 80)
```javascript
const pendingActivities = activities.filter(a => a.workflowStatus === "pending_approval")
```

#### Approved Activities - Open for Enrollment (Line 81)
```javascript
const upcomingActivities = activities.filter(a => 
  a.status === "open" && 
  a.workflowStatus === "approved"
)
```

#### Approved Activities - In Progress (Line 82)
```javascript
const ongoingActivities = activities.filter(a => 
  a.status === "closed" && 
  a.workflowStatus === "approved"
)
```

#### Completed Activities (Implied)
```javascript
const completedActivities = activities.filter(a => a.status === "completed")
```

**Filters Applied**:
- ✅ Separate tabs for different workflow statuses
- ✅ Approves or rejects PENDING_APPROVAL activities
- ✅ Views APPROVED activities by enrollment status
- ✅ Department filtering (manager only sees their department's employees)
- ✅ Administrative actions only if `workflowStatus === "pending_approval"`

**Result**: Managers see activities in different workflows, can approve/reject pending

---

### ADMIN/HR ROLE
**File**: [app/admin/activities/page.jsx](app/admin/activities/page.jsx)

```javascript
const filteredActivities = activities?.filter(activity =>
  (activity.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  (activity.description || "").toLowerCase().includes(searchQuery.toLowerCase())
) || []
```

**Filters Applied**:
- ✅ Basic search filtering only
- ✅ NO workflow status restrictions
- ✅ See ALL activities regardless of approval status
- ✅ Can create, edit, delete activities

**Result**: Admins/HR see ALL activities - no role-based restrictions

---

## 3. WORKFLOW STATUS FILTERING SUMMARY

### Status Values Found in Code
- `approved` - Activity is approved and visible to employees/managers
- `pending_approval` - Awaiting manager review (only visible to managers for approval)
- `rejected` - Activity was rejected (visible in manager details with rejection reason)

### Key Filter: `workflowStatus === 'approved'`

This filter appears in **CRITICAL** locations:

| Component | Lines | Filter |
|-----------|-------|--------|
| Employee Activities | 36 | `workflowStatus === 'approved'` |
| Employee Activities | 48 | `workflowStatus === 'approved'` |
| Manager Activities | 81 | `workflowStatus === 'approved'` |
| Manager Activities | 82 | `workflowStatus === 'approved'` |
| Dashboard Upcoming | 15 | `workflowStatus === 'approved' \|\| !a.workflowStatus` |
| Recommendations | 57 | `workflowStatus === 'approved' \|\| !a.workflowStatus` |

---

## 4. HARDCODED RESTRICTIONS & VISIBILITY RULES

### ⛔ EMPLOYEE VIEW RESTRICTIONS

1. **Approval Requirement**
   - Activities MUST have `workflowStatus === 'approved'`
   - No pending or rejected activities visible
   - **This is strictly enforced** (see comment: "Strictly only show approved activities")

2. **Status Requirements**
   - Only statuses: `"upcoming"`, `"active"`, `"open"`
   - Excludes: `"closed"`, `"completed"`, "in_progress"

3. **Enrollment Requirements**
   - Cannot see activities already enrolled in (separate "My Curriculum" tab)
   - Participation must be in 'started' or 'completed' status

### ✅ MANAGER APPROVAL WORKFLOW

1. **Pending Queue**
   - Managers see activities with `workflowStatus === "pending_approval"`
   - Can approve (changes to "approved") or reject

2. **Approved Activities**
   - Can see approved activities across enrollment phases
   - Can only enroll their department's employees
   - Department filtering: `manager's department_id === employee's department_id`

3. **Team Scoping**
   - Managers automatically filtered to their department
   - Cannot see employees from other departments or admins
   ```javascript
   const deptEmployees = employees.filter(e => {
     if (e.role?.toLowerCase() === "admin") return false;
     // ... department matching logic
   });
   ```

### 🔓 ADMIN/HR UNRESTRICTED ACCESS

1. **No filtering on workflow status**
   - See all activities regardless of approval state
   - Can work with pending, approved, rejected equally

2. **Full CRUD operations**
   - Create new activities
   - Edit all activities
   - Delete any activity

3. **Direct data access**
   - No departmental scoping
   - See all employees

---

## 5. ACTIVITY STATUS VS WORKFLOW STATUS

### Activity `status` field (separate from workflow)
- `"open"` - Enrollment is open
- `"closed"` - Enrollment closed, activity running
- `"completed"` - Activity finished
- `"upcoming"` - Scheduled but not yet open
- `"active"` - Currently in progress

### Activity `workflowStatus` field (approval state)
- `"pending_approval"` - Awaiting management approval
- `"approved"` - Approved, visible to employees
- `"rejected"` - Rejected, with reason recorded
- `"null"` / undefined - Some activities bypass approval (older system data)

---

## 6. KEY FILTERING LOCATIONS IN CODE

### [components/dashboard/upcoming-activities.jsx](components/dashboard/upcoming-activities.jsx#L15)
```javascript
const upcomingActivities = activities
  ?.filter(a =>
    (a.status === "upcoming" || a.status === "active" || a.status === "open") &&
    (a.workflowStatus === "approved" || !a.workflowStatus)  // Fallback for older data
  )
```

### [components/recommendations/recommendation-engine.jsx](components/recommendations/recommendation-engine.jsx#L57)
```javascript
const activeActivities = activities?.filter(a =>
  (a.status === 'open' || a.status === 'upcoming') &&
  (a.workflowStatus === 'approved' || !a.workflowStatus)
) || []
```

### [app/employee/activities/page.jsx](app/employee/activities/page.jsx#L48)
```javascript
const availableActivities = activities.filter(a =>
  !enrolledIds.includes(a.id) &&
  !enrolledIds.includes(a._id) &&
  a.workflowStatus === 'approved' &&
  ["upcoming", "active", "open"].includes(a.status?.toLowerCase())
)
```

---

## 7. ACTIVITY DISPLAY DECISION FLOW

```
┌─ USER VIEWS ACTIVITIES
│
├─ EMPLOYEE ROLE?
│  ├─ APPROVED? → YES
│  ├─ STATUS in [upcoming, active, open]? → YES
│  ├─ Already enrolled? → NO
│  └─ SHOW in "My Curriculum" or "Marketplace"
│
├─ MANAGER ROLE?
│  ├─ WORKFLOW STATUS?
│  ├─ pending_approval → Show in "Requests" tab + Approve/Reject buttons
│  ├─ approved + status=open → Show in "Open for Enrollment" tab
│  ├─ approved + status=closed → Show in "In Progress" tab
│  ├─ status=completed → Show in "Completed" tab
│  └─ Only show employees from manager's department
│
├─ ADMIN/HR ROLE?
│  ├─ NO STATUS FILTERING
│  ├─ Show ALL activities (pending, approved, rejected)
│  └─ Full CRUD access
│
└─ UNKNOWN ROLE → Redirect to login
```

---

## 8. ROLE-BASED ROUTING

**File**: [src/App.jsx](src/App.jsx#L588-L625)

### Route Protection
```javascript
// Admins and HR can access anything admin-related, 
// otherwise check for requiredRole
if (requiredRole && userRole !== "admin" && userRole !== "hr" && 
    userRole !== requiredRole) {
  return <Navigate to="/login" />
}
```

### Role Normalization
```javascript
const normalizedRole = 
  r === "admin" ? "admin" : 
  r === "hr" ? "hr" : 
  r === "manager" ? "manager" : 
  "employee"
```

### Protected Routes
- `/activities` → Generic dashboard (no role filtering on page itself)
- `/employee/activities` → ProtectedRoute with requiredRole="employee"
- `/manager/activities` → ProtectedRoute with requiredRole="manager"
- `/admin/activities` → ProtectedRoute with requiredRole="admin"

---

## 9. NOTIFICATIONS BY ROLE

**File**: [lib/data-store.jsx](lib/data-store.jsx#L251-L258)

When new activities are created:
```javascript
// Notify all managers and HR users about the new activity
const managers = users.filter(u => 
  u.role === "MANAGER" || u.role === "HR" || u.role === "ADMIN"
)
managers.forEach(m => {
  addNotification({
    userId: m._id || m.id,
    title: "New Program Available",
    message: `A new ${activityData.type} program "${activityData.title}" 
              has been created...`,
    link: `/manager/activities`,
    type: "activity"
  })
})
```

**Result**: Only managers, HR, and admins notified of new activities

---

## 10. ACTIVITIES VISIBILITY MATRIX

| Role | Pending Approval | Approved | Rejected | Can Approve | Can Delete | Department Filtering |
|------|-----------------|----------|----------|------------|-----------|---------------------|
| **Employee** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes (only approved) |
| **Manager** | ✅ Yes (review) | ✅ Yes | ✅ Yes (history) | ✅ Yes | ❌ No | ✅ Yes (their dept only) |
| **Admin/HR** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No (see all) |

---

## SUMMARY

### Strictest Restrictions
1. **EMPLOYEES**: Can only see APPROVED activities with specific statuses (upcoming/active/open)
2. **MANAGERS**: Can manage their department's activities and approvals
3. **ADMINS**: Unrestricted view of all activities in any workflow state

### Critical Filter Chain
**Employee's View = ALL Activities > Approved Only > Status Filter (upcoming/active/open) > Enrollment Filter**

### Potential Issues for Activity Visibility
1. ✅ Activity NOT in status: pending_approval
2. ✅ Missing `workflowStatus: 'approved'` field
3. ✅ Activity status not in: ["upcoming", "active", "open"]
4. ✅ Employee already enrolled in activity
5. ✅ Wrong role/permissions
