/* ==========================================================================
   STATE MANAGEMENT & INITIAL SEED DATA
   ========================================================================== */

let adminAccount = { username: 'admin', password: 'admin123' };

const DEFAULT_STAFF = [
    {
        id: 'emp-1',
        name: 'John Doe',
        phone: '+1 555-0192',
        address: '123 Tech Lane, San Jose, CA',
        designation: 'Software Engineer',
        salary: 5000,
        joiningDate: '2024-01-15',
        username: 'john.doe',
        password: 'user123'
    },
    {
        id: 'emp-2',
        name: 'Sarah Smith',
        phone: '+1 555-0184',
        address: '456 Market St, San Francisco, CA',
        designation: 'UI/UX Designer',
        salary: 4500,
        joiningDate: '2024-03-01',
        username: 'sarah.smith',
        password: 'user123'
    }
];

let currentUser = null;
let currentRole = 'admin';
let staffList = [];
let attendanceRecords = []; // Records contain status: 'Full Day', 'Half Day', or 'Absent'
let payrollStatus = {};
let attendanceSettings = { fullDayHours: 8, halfDayHours: 4 };

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadStorageData();
    startLiveClock();

    const filterDateInput = document.getElementById('attendance-filter-date');
    if (filterDateInput) filterDateInput.value = getDateKey();
});

function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getPayrollSummary(staff, month) {
    const totalWorkingDays = 22;
    let fullDays = 0;
    let halfDays = 0;
    let absentDays = 0;

    attendanceRecords.forEach(record => {
        if (record.empId !== staff.id || !record.date.startsWith(month)) return;
        if (record.status === 'Full Day') fullDays++;
        else if (record.status === 'Half Day') halfDays++;
        else if (record.status === 'Absent') absentDays++;
    });

    const workedDays = fullDays + halfDays * 0.5;
    const deductions = Math.max(0, (totalWorkingDays - workedDays) * (Number(staff.salary) / totalWorkingDays));

    return {
        fullDays,
        halfDays,
        absentDays,
        deductions,
        netSalary: Math.max(0, Number(staff.salary) - deductions)
    };
}

function getPayrollSummaries(month) {
    const summaries = new Map(
        staffList.map(staff => [staff.id, { fullDays: 0, halfDays: 0, absentDays: 0 }])
    );

    attendanceRecords.forEach(record => {
        if (!record.date.startsWith(month)) return;
        const summary = summaries.get(record.empId);
        if (!summary) return;
        if (record.status === 'Full Day') summary.fullDays++;
        else if (record.status === 'Half Day') summary.halfDays++;
        else if (record.status === 'Absent') summary.absentDays++;
    });

    staffList.forEach(staff => {
        const summary = summaries.get(staff.id);
        const salary = Number(staff.salary);
        const workedDays = summary.fullDays + summary.halfDays * 0.5;
        summary.deductions = Math.max(0, (22 - workedDays) * (salary / 22));
        summary.netSalary = Math.max(0, salary - summary.deductions);
    });

    return summaries;
}

function loadStorageData() {
    // Admin password check
    const storedAdmin = localStorage.getItem('app_admin_account');
    if (storedAdmin) {
        adminAccount = JSON.parse(storedAdmin);
    } else {
        localStorage.setItem('app_admin_account', JSON.stringify(adminAccount));
    }

    // Staff list check
    const storedStaff = localStorage.getItem('app_staff_list');
    if (!storedStaff) {
        staffList = DEFAULT_STAFF;
        localStorage.setItem('app_staff_list', JSON.stringify(staffList));
    } else {
        staffList = JSON.parse(storedStaff);
    }

    // Attendance records check
    const storedAttendance = localStorage.getItem('app_attendance');
    if (!storedAttendance) {
        const todayStr = getDateKey();
        attendanceRecords = [
            { id: 'att-1', empId: 'emp-1', date: todayStr, clockIn: '09:00 AM', clockOut: '05:00 PM', status: 'Full Day' },
            { id: 'att-2', empId: 'emp-2', date: todayStr, clockIn: '09:15 AM', clockOut: '01:15 PM', status: 'Half Day' }
        ];
        localStorage.setItem('app_attendance', JSON.stringify(attendanceRecords));
    } else {
        attendanceRecords = JSON.parse(storedAttendance);
    }

    // Payroll and attendance settings
    const storedPayroll = localStorage.getItem('app_payroll');
    payrollStatus = storedPayroll ? JSON.parse(storedPayroll) : {};
    const storedAttendanceSettings = localStorage.getItem('app_attendance_settings');
    if (storedAttendanceSettings) {
        attendanceSettings = { ...attendanceSettings, ...JSON.parse(storedAttendanceSettings) };
    }
}

function saveData() {
    localStorage.setItem('app_admin_account', JSON.stringify(adminAccount));
    localStorage.setItem('app_staff_list', JSON.stringify(staffList));
    localStorage.setItem('app_attendance', JSON.stringify(attendanceRecords));
    localStorage.setItem('app_payroll', JSON.stringify(payrollStatus));
    localStorage.setItem('app_attendance_settings', JSON.stringify(attendanceSettings));
}

function startLiveClock() {
    const updateClock = () => {
        const now = new Date();
        const dateText = now.toLocaleDateString();
        const timeText = now.toLocaleTimeString();
        ['live-date', 'login-date'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerText = dateText;
        });
        ['live-clock', 'login-clock'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerText = timeText;
        });
    };

    updateClock();
    setInterval(updateClock, 1000);
}

/* ==========================================================================
   AUTHENTICATION & NAVIGATION
   ========================================================================== */
function switchLoginTab(role) {
    currentRole = role;
    const btnAdmin = document.getElementById('tab-admin');
    const btnStaff = document.getElementById('tab-staff');
    const demoAdmin = document.getElementById('demo-creds-admin');
    const demoStaff = document.getElementById('demo-creds-staff');

    if (role === 'admin') {
        btnAdmin.className = "flex-1 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm bg-white dark:bg-slate-600 text-brand-600 dark:text-white";
        btnStaff.className = "flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700";
        demoAdmin.classList.remove('hidden');
        demoStaff.classList.add('hidden');
    } else {
        btnStaff.className = "flex-1 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm bg-white dark:bg-slate-600 text-brand-600 dark:text-white";
        btnAdmin.className = "flex-1 py-2 text-sm font-semibold rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-700";
        demoStaff.classList.remove('hidden');
        demoAdmin.classList.add('hidden');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value.trim();

    if (currentRole === 'admin') {
        if (usernameInput === adminAccount.username && passwordInput === adminAccount.password) {
            currentUser = { name: 'Administrator', role: 'admin' };
            showToast('Welcome back, Administrator!', 'success');
            launchDashboard();
        } else {
            showToast('Invalid Admin Credentials!', 'error');
        }
    } else {
        const foundStaff = staffList.find(s => s.username === usernameInput && s.password === passwordInput);
        if (foundStaff) {
            currentUser = { ...foundStaff, role: 'staff' };
            showToast(`Welcome, ${currentUser.name}!`, 'success');
            launchDashboard();
        } else {
            showToast('Invalid Staff Username or Password!', 'error');
        }
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    showToast('Logged out successfully.', 'info');
}

function launchDashboard() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');

    const badge = document.getElementById('current-role-badge');
    const navName = document.getElementById('nav-user-name');
    const navSub = document.getElementById('nav-user-sub');
    const avatarInitial = document.getElementById('user-avatar-initial');
    const avatarPhoto = document.getElementById('user-avatar-photo');

    badge.innerText = currentUser.role.toUpperCase();
    navName.innerText = currentUser.name;
    navSub.innerText = currentUser.role === 'admin' ? 'System Administrator' : currentUser.designation;
    avatarInitial.innerText = currentUser.name.charAt(0);
    avatarPhoto.src = currentUser.photo || '';
    avatarPhoto.classList.toggle('hidden', !currentUser.photo);
    avatarInitial.classList.toggle('hidden', !!currentUser.photo);

    buildNavigationMenu();

    if (currentUser.role === 'admin') {
        switchPage('admin-dashboard', 'Dashboard Overview', 'Overview of staff metrics and daily log');
    } else {
        switchPage('staff-portal', 'Staff Self-Service', 'Mark attendance & view your profile details');
    }
}

function buildNavigationMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.innerHTML = '';

    let links = [];
    if (currentUser.role === 'admin') {
        links = [
            { id: 'admin-dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
            { id: 'admin-staff', label: 'Staff Directory', icon: 'fa-users' },
            { id: 'admin-attendance', label: 'Attendance & Status', icon: 'fa-calendar-check' },
            { id: 'admin-payroll', label: 'Payroll Manager', icon: 'fa-file-invoice-dollar' },
            { id: 'admin-settings', label: 'Admin Settings', icon: 'fa-lock' }
        ];
    } else {
        links = [
            { id: 'staff-portal', label: 'Attendance Clock', icon: 'fa-clock' },
            { id: 'staff-payslips', label: 'My Payslips', icon: 'fa-receipt' }
        ];
    }

    links.forEach(link => {
        const btn = document.createElement('button');
        btn.className = `w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:text-white hover:bg-slate-800 nav-link-${link.id}`;
        btn.onclick = () => switchPage(link.id, link.label, getPageSubtitle(link.id));
        btn.innerHTML = `<i class="fa-solid ${link.icon} w-5 text-center"></i><span>${link.label}</span>`;
        navMenu.appendChild(btn);
    });
}

function getPageSubtitle(pageId) {
    const subtitles = {
        'admin-dashboard': 'Overview of staff metrics and daily log',
        'admin-staff': 'Manage employee records and login credentials',
        'admin-attendance': 'Review and set Full Day, Half Day, or Absent statuses',
        'admin-payroll': 'Calculate monthly payouts based on attendance',
        'admin-settings': 'Update admin security preferences and password',
        'staff-portal': 'Mark daily time logs and view personal records',
        'staff-payslips': 'View monthly payslip breakdown'
    };
    return subtitles[pageId] || '';
}

function switchPage(pageId, title, subtitle) {
    document.getElementById('page-title').innerText = title;
    document.getElementById('page-subtitle').innerText = subtitle;

    const sections = ['admin-dashboard', 'admin-staff', 'admin-attendance', 'admin-payroll', 'admin-settings', 'staff-portal', 'staff-payslips'];
    sections.forEach(sec => {
        const el = document.getElementById(`view-${sec}`);
        if (el) el.classList.add('hidden');
    });

    document.querySelectorAll('#nav-menu button').forEach(b => {
        b.classList.remove('bg-brand-600', 'text-white');
        b.classList.add('text-slate-400');
    });

    const activeBtn = document.querySelector(`.nav-link-${pageId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-brand-600', 'text-white');
        activeBtn.classList.remove('text-slate-400');
    }

    const targetSection = document.getElementById(`view-${pageId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    if (pageId === 'admin-dashboard') renderAdminDashboard();
    if (pageId === 'admin-staff') renderAdminStaff();
    if (pageId === 'admin-attendance') renderAdminAttendance();
    if (pageId === 'admin-payroll') renderAdminPayroll();
    if (pageId === 'admin-settings') {
        document.getElementById('full-day-hours').value = attendanceSettings.fullDayHours;
        document.getElementById('half-day-hours').value = attendanceSettings.halfDayHours;
    }
    if (pageId === 'staff-portal') renderStaffPortal();
    if (pageId === 'staff-payslips') renderStaffPayslip();
}

/* ==========================================================================
   ADMIN CONTROLLERS & ATTENDANCE STATUS OVERRIDE
   ========================================================================== */
function renderAdminDashboard() {
    const todayStr = getDateKey();
    const todayLogs = new Map(
        attendanceRecords
            .filter(record => record.date === todayStr)
            .map(record => [record.empId, record])
    );

    const totalStaff = staffList.length;
    const dailyLogs = [...todayLogs.values()];
    const presentCount = dailyLogs.filter(record => record.status === 'Full Day').length;
    const halfDayOrAbsent = dailyLogs.filter(record => record.status === 'Half Day' || record.status === 'Absent').length;

    const totalPayrollEst = staffList.reduce((sum, s) => sum + Number(s.salary), 0);

    document.getElementById('stat-total-staff').innerText = totalStaff;
    document.getElementById('stat-present-today').innerText = presentCount;
    document.getElementById('stat-absent-today').innerText = halfDayOrAbsent;
    document.getElementById('stat-monthly-payroll').innerText = `$${totalPayrollEst.toLocaleString()}`;

    const tbody = document.getElementById('today-attendance-table');
    tbody.innerHTML = '';

    staffList.forEach(staff => {
        const log = todayLogs.get(staff.id);
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
        
        let badgeColor = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        if (log) {
            if (log.status === 'Full Day') badgeColor = 'bg-emerald-100 text-emerald-700';
            else if (log.status === 'Half Day') badgeColor = 'bg-amber-100 text-amber-700';
            else if (log.status === 'Absent') badgeColor = 'bg-rose-100 text-rose-700';
        }

        tr.innerHTML = `
            <td class="py-3.5 px-6 font-medium text-slate-900 dark:text-white">${staff.name}</td>
            <td class="py-3.5 px-6 text-slate-500">${staff.designation}</td>
            <td class="py-3.5 px-6">${log ? log.clockIn : '--'}</td>
            <td class="py-3.5 px-6">${log ? log.clockOut : '--'}</td>
            <td class="py-3.5 px-6">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}">
                    ${log ? log.status : 'Not Recorded'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAdminStaff() {
    const tbody = document.getElementById('staff-management-table');
    tbody.innerHTML = '';

    staffList.forEach(staff => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
        tr.innerHTML = `
            <td class="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">${staff.name}</td>
            <td class="py-3.5 px-6 text-xs text-slate-500">
                <div><i class="fa-solid fa-phone mr-1"></i>${staff.phone}</div>
                <div><i class="fa-solid fa-location-dot mr-1"></i>${staff.address}</div>
            </td>
            <td class="py-3.5 px-6 text-slate-600 dark:text-slate-300">${staff.designation}</td>
            <td class="py-3.5 px-6 font-mono font-medium text-slate-800 dark:text-slate-200">$${Number(staff.salary).toLocaleString()}</td>
            <td class="py-3.5 px-6 font-mono text-xs text-brand-600 dark:text-brand-400">${staff.username}</td>
            <td class="py-3.5 px-6 text-right space-x-2">
                <button onclick="openStaffModal('${staff.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="deleteStaff('${staff.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openStaffModal(empId = null) {
    const modal = document.getElementById('staff-modal');
    const title = document.getElementById('modal-staff-title');
    modal.classList.remove('hidden');

    if (empId) {
        const staff = staffList.find(s => s.id === empId);
        title.innerText = 'Edit Employee Profile';
        document.getElementById('staff-id').value = staff.id;
        document.getElementById('form-name').value = staff.name;
        document.getElementById('form-phone').value = staff.phone;
        document.getElementById('form-designation').value = staff.designation;
        document.getElementById('form-address').value = staff.address;
        document.getElementById('form-salary').value = staff.salary;
        document.getElementById('form-joining').value = staff.joiningDate;
        document.getElementById('form-username').value = staff.username;
        document.getElementById('form-password').value = staff.password;
        document.getElementById('form-photo').value = '';
    } else {
        title.innerText = 'Add New Staff Member';
        document.getElementById('staff-form').reset();
        document.getElementById('staff-id').value = '';
    }
}

function closeStaffModal() {
    document.getElementById('staff-modal').classList.add('hidden');
}

function saveStaff(e) {
    e.preventDefault();
    const id = document.getElementById('staff-id').value;
    const existingStaff = id ? staffList.find(staff => staff.id === id) : null;
    const photoInput = document.getElementById('form-photo');
    const photoFile = photoInput.files[0];

    const saveStaffRecord = photoData => {
        const staffData = {
            id: id || 'emp-' + Date.now(),
            name: document.getElementById('form-name').value,
        phone: document.getElementById('form-phone').value,
        designation: document.getElementById('form-designation').value,
        address: document.getElementById('form-address').value,
        salary: Number(document.getElementById('form-salary').value),
        joiningDate: document.getElementById('form-joining').value,
            username: document.getElementById('form-username').value,
            password: document.getElementById('form-password').value,
            photo: photoData || existingStaff?.photo || ''
        };

        if (id) {
            const index = staffList.findIndex(s => s.id === id);
            staffList[index] = staffData;
            showToast('Staff profile updated!', 'success');
        } else {
            staffList.push(staffData);
            showToast('New staff member added!', 'success');
        }

        saveData();
        closeStaffModal();
        renderAdminStaff();
    };

    if (photoFile) {
        const reader = new FileReader();
        reader.onload = event => saveStaffRecord(event.target.result);
        reader.readAsDataURL(photoFile);
    } else {
        saveStaffRecord();
    }
}

function deleteStaff(empId) {
    if (confirm('Are you sure you want to remove this employee record?')) {
        staffList = staffList.filter(s => s.id !== empId);
        saveData();
        renderAdminStaff();
        showToast('Employee removed successfully.', 'info');
    }
}

function renderAdminAttendance() {
    const dateVal = document.getElementById('attendance-filter-date').value;
    const tbody = document.getElementById('admin-attendance-table');
    tbody.innerHTML = '';

    const logsByEmployee = new Map(
        attendanceRecords
            .filter(record => record.date === dateVal)
            .map(record => [record.empId, record])
    );

    staffList.forEach(staff => {
        const log = logsByEmployee.get(staff.id);
        const currentStatus = log ? log.status : 'Absent';

        let badgeColor = 'bg-rose-100 text-rose-700';
        if (currentStatus === 'Full Day') badgeColor = 'bg-emerald-100 text-emerald-700';
        if (currentStatus === 'Half Day') badgeColor = 'bg-amber-100 text-amber-700';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
        tr.innerHTML = `
            <td class="py-3.5 px-6 font-mono text-xs text-slate-500">${dateVal}</td>
            <td class="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">${staff.name}</td>
            <td class="py-3.5 px-6 text-xs">${log ? log.clockIn : '--'}</td>
            <td class="py-3.5 px-6 text-xs">${log ? log.clockOut : '--'}</td>
            <td class="py-3.5 px-6">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}">
                    ${currentStatus}
                </span>
            </td>
            <td class="py-3.5 px-6 text-right space-x-2">
                <button onclick="printAttendanceSlip('${staff.id}', '${dateVal}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors">
                    <i class="fa-solid fa-print mr-1"></i> Slip
                </button>
                <select onchange="updateAttendanceStatus('${staff.id}', '${dateVal}', this.value)" class="px-2 py-1 bg-slate-100 border border-slate-200 dark:bg-slate-700 dark:border-slate-600 rounded-lg text-xs font-medium">
                    <option value="Full Day" ${currentStatus === 'Full Day' ? 'selected' : ''}>Full Day</option>
                    <option value="Half Day" ${currentStatus === 'Half Day' ? 'selected' : ''}>Half Day</option>
                    <option value="Absent" ${currentStatus === 'Absent' ? 'selected' : ''}>Absent</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function exportAttendanceExcel() {
    const dateInput = document.getElementById('attendance-filter-date');
    const dateStr = dateInput?.value || getDateKey();
    const escapeCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const logsByEmployee = new Map(
        attendanceRecords
            .filter(record => record.date === dateStr)
            .map(record => [record.empId, record])
    );
    const rows = [
        ['Date', 'Employee', 'Designation', 'Phone', 'Clock In', 'Clock Out', 'Status'],
        ...staffList.map(staff => {
            const log = logsByEmployee.get(staff.id);
            return [
                dateStr,
                staff.name,
                staff.designation,
                staff.phone,
                log?.clockIn || '--',
                log?.clockOut || '--',
                log?.status || 'Absent'
            ];
        })
    ];

    const csv = rows.map(row => row.map(escapeCell).join(',')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-sheet-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Attendance sheet exported successfully.', 'success');
}

function updateAttendanceStatus(empId, dateStr, newStatus) {
    let log = attendanceRecords.find(r => r.empId === empId && r.date === dateStr);
    if (log) {
        log.status = newStatus;
    } else {
        attendanceRecords.push({
            id: 'att-' + Date.now(),
            empId: empId,
            date: dateStr,
            clockIn: newStatus === 'Absent' ? '--' : '09:00 AM',
            clockOut: newStatus === 'Absent' ? '--' : (newStatus === 'Half Day' ? '01:00 PM' : '05:00 PM'),
            status: newStatus
        });
    }
    saveData();
    renderAdminAttendance();
    showToast(`Status updated to ${newStatus}.`, 'info');
}

/* ==========================================================================
   ADMIN SETTINGS
   ========================================================================== */
function saveAttendanceSettings(e) {
    e.preventDefault();
    const fullDayHours = Number(document.getElementById('full-day-hours').value);
    const halfDayHours = Number(document.getElementById('half-day-hours').value);

    if (!Number.isFinite(fullDayHours) || !Number.isFinite(halfDayHours) ||
        fullDayHours <= 0 || halfDayHours <= 0 || halfDayHours >= fullDayHours) {
        showToast('Enter valid hour thresholds; Half Day must be greater than 0 and less than Full Day.', 'error');
        return;
    }

    attendanceSettings = { fullDayHours, halfDayHours };
    saveData();
    showToast('Attendance settings saved.', 'success');
}

/* ==========================================================================
   ADMIN CHANGE PASSWORD FUNCTIONALITY
   ========================================================================== */
function handleAdminPasswordChange(e) {
    e.preventDefault();
    const oldPass = document.getElementById('admin-old-pass').value;
    const newPass = document.getElementById('admin-new-pass').value;
    const confirmPass = document.getElementById('admin-confirm-pass').value;

    if (oldPass !== adminAccount.password) {
        showToast('Current password does not match!', 'error');
        return;
    }

    if (newPass !== confirmPass) {
        showToast('New passwords do not match!', 'error');
        return;
    }

    adminAccount.password = newPass;
    saveData();
    showToast('Admin password changed successfully!', 'success');
    e.target.reset();
}

/* ==========================================================================
   PAYROLL CONTROLLERS & DEDUCTION CALCULATIONS
   ========================================================================== */
function renderAdminPayroll() {
    const selectedMonth = document.getElementById('payroll-month-select').value;
    const tbody = document.getElementById('admin-payroll-table');
    const summaries = getPayrollSummaries(selectedMonth);
    tbody.innerHTML = '';

    staffList.forEach(staff => {
        const key = `${staff.id}-${selectedMonth}`;
        const currentStatus = payrollStatus[key] || 'Pending';

        const { fullDays, halfDays, absentDays, deductions, netSalary } = summaries.get(staff.id);

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
        tr.innerHTML = `
            <td class="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">${staff.name}</td>
            <td class="py-3.5 px-6 font-mono text-slate-600 dark:text-slate-300">$${Number(staff.salary).toLocaleString()}</td>
            <td class="py-3.5 px-6 text-xs">
                <div>Full: ${fullDays}d | Half: ${halfDays}d</div>
                <div class="text-slate-400">Absent: ${absentDays}d</div>
            </td>
            <td class="py-3.5 px-6 font-mono text-xs text-rose-500">-$${deductions.toFixed(2)}</td>
            <td class="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">$${netSalary.toFixed(2)}</td>
            <td class="py-3.5 px-6">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${currentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                    ${currentStatus}
                </span>
            </td>
            <td class="py-3.5 px-6 text-right space-x-2">
                <button onclick="printPaymentSlip('${staff.id}', '${selectedMonth}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-colors">
                    <i class="fa-solid fa-print mr-1"></i> Slip
                </button>
                <button onclick="togglePayrollStatus('${key}')" class="px-3 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-medium rounded-lg transition-colors">
                    Mark ${currentStatus === 'Paid' ? 'Pending' : 'Paid'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function togglePayrollStatus(key) {
    payrollStatus[key] = payrollStatus[key] === 'Paid' ? 'Pending' : 'Paid';
    saveData();
    renderAdminPayroll();
    showToast('Payment status updated.', 'success');
}

/* ==========================================================================
   STAFF PORTAL CONTROLLERS & ACTIONS
   ========================================================================== */
function renderStaffPortal() {
    if (!currentUser) return;

    document.getElementById('staff-profile-name').innerText = currentUser.name;
    document.getElementById('staff-profile-designation').innerText = currentUser.designation;
    document.getElementById('staff-profile-phone').innerText = currentUser.phone;
    document.getElementById('staff-profile-address').innerText = currentUser.address;
    document.getElementById('staff-profile-joining').innerText = currentUser.joiningDate;
    document.getElementById('staff-profile-salary').innerText = `$${Number(currentUser.salary).toLocaleString()}`;

    const profilePhoto = document.getElementById('staff-profile-photo');
    const profileIcon = document.getElementById('staff-profile-icon');
    profilePhoto.src = currentUser.photo || '';
    profilePhoto.classList.toggle('hidden', !currentUser.photo);
    profileIcon.classList.toggle('hidden', !!currentUser.photo);

    const dateInput = document.getElementById('staff-attendance-date');
    if (!dateInput.value || dateInput.value > getDateKey()) dateInput.value = getDateKey();
    dateInput.max = getDateKey();
    const selectedDate = dateInput.value;
    const todayLog = attendanceRecords.find(
        record => record.empId === currentUser.id && record.date === selectedDate
    );
    document.getElementById('staff-today-clock-in').innerText = todayLog?.clockIn || '--';
    document.getElementById('staff-today-clock-out').innerText = todayLog?.clockOut || '--';

    const tbody = document.getElementById('staff-attendance-log-table');
    tbody.innerHTML = '';

    const logs = attendanceRecords
        .filter(r => r.empId === currentUser.id)
        .sort((a, b) => b.date.localeCompare(a.date));
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-xs text-slate-400">No attendance logs found</td></tr>`;
    } else {
        logs.forEach(log => {
            let badgeColor = 'bg-emerald-100 text-emerald-700';
            if (log.status === 'Half Day') badgeColor = 'bg-amber-100 text-amber-700';
            if (log.status === 'Absent') badgeColor = 'bg-rose-100 text-rose-700';

            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors";
            tr.innerHTML = `
                <td class="py-3 px-4 font-mono text-xs text-slate-500">${log.date}</td>
                <td class="py-3 px-4 text-xs">${log.clockIn}</td>
                <td class="py-3 px-4 text-xs">${log.clockOut || 'Active'}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-[11px] font-semibold ${badgeColor}">
                        ${log.status}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function getSelectedAttendanceDate() {
    const dateInput = document.getElementById('staff-attendance-date');
    const selectedDate = dateInput?.value || getDateKey();
    return selectedDate > getDateKey() ? getDateKey() : selectedDate;
}

function handleClockIn() {
    if (!currentUser) return;
    const selectedDate = getSelectedAttendanceDate();
    const existing = attendanceRecords.find(r => r.empId === currentUser.id && r.date === selectedDate);

    if (existing) {
        showToast('Attendance is already recorded for this date.', 'info');
        return;
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    attendanceRecords.push({
        id: 'att-' + Date.now(),
        empId: currentUser.id,
        date: selectedDate,
        clockIn: nowTime,
        clockInAt: Date.now(),
        clockOut: '',
        status: 'Full Day'
    });

    saveData();
    renderStaffPortal();
    renderAdminDashboard();
    showToast(`Clocked in for ${selectedDate} at ${nowTime}.`, 'success');
}

function handleClockOut() {
    if (!currentUser) return;
    const selectedDate = getSelectedAttendanceDate();
    const log = attendanceRecords.find(r => r.empId === currentUser.id && r.date === selectedDate);

    if (!log) {
        showToast('Please clock in for the selected date first.', 'error');
        return;
    }

    if (log.clockOut) {
        showToast('You have already clocked out for this date.', 'info');
        return;
    }

    const now = Date.now();
    const nowTime = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    log.clockOut = nowTime;

    if (log.clockInAt) {
        const hoursWorked = Math.max(0, (now - log.clockInAt) / (1000 * 60 * 60));
        if (hoursWorked >= Number(attendanceSettings.fullDayHours)) {
            log.status = 'Full Day';
        } else if (hoursWorked >= Number(attendanceSettings.halfDayHours)) {
            log.status = 'Half Day';
        } else {
            log.status = 'Absent';
        }
    }

    saveData();
    renderStaffPortal();
    renderAdminDashboard();
    showToast(`Clocked out for ${selectedDate} at ${nowTime}.`, 'success');
}

function printSlip(title, content) {
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
        showToast('Please allow pop-ups to print the slip.', 'error');
        return;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
        <style>body{font-family:Arial,sans-serif;color:#1e293b;padding:40px;max-width:760px;margin:auto}h1{color:#1d4ed8;border-bottom:2px solid #1d4ed8;padding-bottom:12px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:12px 0}.label{color:#64748b}.total{font-size:20px;font-weight:bold;margin-top:20px}</style>
        </head><body><h1>${title}</h1>${content}<p style="margin-top:40px;color:#64748b;font-size:12px">Generated on ${new Date().toLocaleString()}</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function printAttendanceSlip(empId, dateStr) {
    const staff = staffList.find(s => s.id === empId);
    const log = attendanceRecords.find(r => r.empId === empId && r.date === dateStr);
    if (!staff) return;

    printSlip('Attendance Slip', `
        <div class="row"><span class="label">Employee</span><strong>${staff.name}</strong></div>
        <div class="row"><span class="label">Designation</span><strong>${staff.designation}</strong></div>
        <div class="row"><span class="label">Date</span><strong>${dateStr}</strong></div>
        <div class="row"><span class="label">Check In</span><strong>${log?.clockIn || '--'}</strong></div>
        <div class="row"><span class="label">Check Out</span><strong>${log?.clockOut || '--'}</strong></div>
        <div class="row"><span class="label">Attendance Status</span><strong>${log?.status || 'Absent'}</strong></div>
    `);
}

function printPaymentSlip(empId, month) {
    const staff = staffList.find(s => s.id === empId);
    if (!staff) return;
    const summary = getPayrollSummary(staff, month);
    const key = `${empId}-${month}`;
    const status = payrollStatus[key] || 'Pending';

    printSlip('Payment Slip', `
        <div class="row"><span class="label">Employee</span><strong>${staff.name}</strong></div>
        <div class="row"><span class="label">Pay Period</span><strong>${month}</strong></div>
        <div class="row"><span class="label">Base Salary</span><strong>$${Number(staff.salary).toFixed(2)}</strong></div>
        <div class="row"><span class="label">Full Days</span><strong>${summary.fullDays}</strong></div>
        <div class="row"><span class="label">Half Days</span><strong>${summary.halfDays}</strong></div>
        <div class="row"><span class="label">Absent Days</span><strong>${summary.absentDays}</strong></div>
        <div class="row"><span class="label">Payment Status</span><strong>${status}</strong></div>
        <div class="total">Net Payable: $${summary.netSalary.toFixed(2)}</div>
    `);
}

function printPayslip() {
    if (!currentUser) return;
    printPaymentSlip(currentUser.id, getDateKey().slice(0, 7));
}

function renderStaffPayslip() {
    if (!currentUser) return;

    const currentMonth = getDateKey().slice(0, 7);
    const key = `${currentUser.id}-${currentMonth}`;
    const status = payrollStatus[key] || 'Pending';
    const { deductions, netSalary } = getPayrollSummary(currentUser, currentMonth);

    const statusBadge = document.getElementById('payslip-status-badge');
    statusBadge.innerText = status;
    statusBadge.className = `px-3 py-1 rounded-full text-xs font-semibold ${status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`;

    document.getElementById('payslip-emp-name').innerText = currentUser.name;
    document.getElementById('payslip-base').innerText = `$${Number(currentUser.salary).toFixed(2)}`;
    document.getElementById('payslip-deductions').innerText = `-$${deductions.toFixed(2)}`;
    document.getElementById('payslip-final').innerText = `$${netSalary.toFixed(2)}`;
}

/* ==========================================================================
   UI UTILITIES & TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const colors = {
        success: 'bg-emerald-600 text-white',
        error: 'bg-rose-600 text-white',
        info: 'bg-slate-800 text-white'
    };

    toast.className = `p-3 rounded-xl shadow-xl text-xs font-medium flex items-center justify-between transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-3 opacity-70 hover:opacity-100"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}