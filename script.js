/* --- State & Initialization --- */
let courses = JSON.parse(localStorage.getItem('courses')) || [];
let timetables = JSON.parse(localStorage.getItem('timetables')) || [];
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
let currentUserRole = localStorage.getItem('userRole') || '';
let currentUserName = localStorage.getItem('userName') || '';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setYear();
    
    if (isLoggedIn) {
        showApp();
    } else {
        showLogin();
    }

    // Event Listeners
    setupEventListeners();
});

/* --- General UI & Navigation --- */
function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('toggle-password').addEventListener('click', togglePasswordVisibility);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    // Sidebar Navigation
    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            navigateTo(e.currentTarget.dataset.target);
            if(window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    });

    // Mobile Sidebar
    document.getElementById('open-sidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
    });
    document.getElementById('close-sidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Modals
    document.getElementById('open-add-course-modal').addEventListener('click', () => openModal('course-modal-overlay'));
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => closeModal('course-modal-overlay'));
    });

    // Course Management
    document.getElementById('course-form').addEventListener('submit', handleSaveCourse);
    document.getElementById('search-course').addEventListener('input', (e) => renderCourses(e.target.value));

    // Timetable Creation
    document.getElementById('create-timetable-form').addEventListener('submit', handleSaveTimetable);
    document.getElementById('reset-timetable-form').addEventListener('click', () => document.getElementById('create-timetable-form').reset());
    document.getElementById('timetable-course').addEventListener('change', handleCourseSelection);

    // Timetable Viewing
    document.getElementById('search-timetable').addEventListener('input', renderTimetable);
    document.getElementById('filter-day').addEventListener('change', renderTimetable);
    document.getElementById('print-timetable').addEventListener('click', () => window.print());
}

function showLogin() {
    document.getElementById('login-section').classList.add('active');
    document.getElementById('app-section').classList.remove('active');
}

function showApp() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('app-section').classList.add('active');
    
    if (currentUserRole === 'admin') {
        document.body.classList.add('role-admin');
    } else {
        document.body.classList.remove('role-admin');
        // redirect to view timetable if student is on a restricted page
        const activeNav = document.querySelector('.nav-links li.active');
        if (activeNav && activeNav.classList.contains('admin-only')) {
            navigateTo('dashboard-view');
            document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
            document.querySelector('.nav-links li[data-target="dashboard-view"]').classList.add('active');
        }
    }
    
    document.getElementById('topbar-user-name').textContent = currentUserName || 'User';
    document.getElementById('topbar-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName || 'User')}&background=2563EB&color=fff`;
    
    refreshAllData();
}

function navigateTo(targetId) {
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(targetId).classList.add('active');
    
    // Update Page Title
    const titles = {
        'dashboard-view': 'Dashboard',
        'manage-courses-view': 'Manage Courses',
        'create-timetable-view': 'Create Timetable',
        'view-timetable-view': 'View Timetable'
    };
    document.getElementById('page-title').textContent = titles[targetId];

    if (targetId === 'dashboard-view') updateDashboardStats();
    if (targetId === 'manage-courses-view') renderCourses();
    if (targetId === 'create-timetable-view') populateCourseDropdown();
    if (targetId === 'view-timetable-view') renderTimetable();
}

/* --- Authentication --- */
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let role = '';
    let name = '';

    if (email === 'admin@university.edu' && password === 'admin123') {
        role = 'admin';
        name = 'Admin';
    } else if (email === 'student@university.edu' && password === 'student123') {
        role = 'student';
        name = 'Student';
    } else {
        showToast('Invalid credentials. Check email and password.', 'error');
        return;
    }

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
    isLoggedIn = true;
    currentUserRole = role;
    currentUserName = name;
    
    showToast(`Welcome back, ${name}!`, 'success');
    showApp();
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    isLoggedIn = false;
    currentUserRole = '';
    currentUserName = '';
    document.body.classList.remove('role-admin');
    showToast('Logged out successfully.', 'success');
    showLogin();
}

function togglePasswordVisibility() {
    const pwdInput = document.getElementById('password');
    const icon = document.getElementById('toggle-password');
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        pwdInput.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

/* --- Theme & UI Utilities --- */
function initTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const icon = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    document.getElementById('theme-toggle').innerHTML = icon;
}

function setYear() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById('course-form').reset();
    document.getElementById('course-id').value = '';
    document.getElementById('course-modal-title').textContent = 'Add New Course';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `<i class="fa-solid ${icon} toast-icon"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* --- Data Management --- */
function refreshAllData() {
    updateDashboardStats();
    renderCourses();
    populateCourseDropdown();
    renderTimetable();
}

/* --- Dashboard --- */
function updateDashboardStats() {
    document.getElementById('stat-total-courses').textContent = courses.length;
    document.getElementById('stat-total-timetables').textContent = timetables.length;

    // Recent Timetables
    const tbody = document.getElementById('recent-timetables-body');
    tbody.innerHTML = '';
    const recent = [...timetables].reverse().slice(0, 5);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No recent entries</td></tr>';
        return;
    }

    recent.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${t.courseCode}</strong> - ${t.courseName}</td>
            <td>${t.day}</td>
            <td>${t.startTime} - ${t.endTime}</td>
            <td>${t.room}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* --- Course Management --- */
function handleSaveCourse(e) {
    e.preventDefault();
    const id = document.getElementById('course-id').value;
    const code = document.getElementById('course-code').value.toUpperCase();
    const name = document.getElementById('course-name').value;
    const lecturer = document.getElementById('course-lecturer').value;
    const credits = document.getElementById('course-credits').value;

    // Check duplicate code
    if (!id && courses.some(c => c.code === code)) {
        showToast('Course code already exists!', 'error');
        return;
    }

    const courseData = { id: id || Date.now().toString(), code, name, lecturer, credits };

    if (id) {
        // Update
        const index = courses.findIndex(c => c.id === id);
        if (index > -1) courses[index] = courseData;
        showToast('Course updated successfully!', 'success');
    } else {
        // Create
        courses.push(courseData);
        showToast('Course added successfully!', 'success');
    }

    localStorage.setItem('courses', JSON.stringify(courses));
    closeModal('course-modal-overlay');
    renderCourses();
    updateDashboardStats();
}

function renderCourses(searchTerm = '') {
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '';

    const filtered = courses.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No courses found</td></tr>';
        return;
    }

    filtered.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.code}</strong></td>
            <td>${c.name}</td>
            <td>${c.lecturer}</td>
            <td>${c.credits}</td>
            <td class="admin-only">
                <button class="btn-icon edit" onclick="editCourse('${c.id}')"><i class="fa-solid fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteCourse('${c.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editCourse = function(id) {
    const course = courses.find(c => c.id === id);
    if (course) {
        document.getElementById('course-id').value = course.id;
        document.getElementById('course-code').value = course.code;
        document.getElementById('course-name').value = course.name;
        document.getElementById('course-lecturer').value = course.lecturer;
        document.getElementById('course-credits').value = course.credits;
        document.getElementById('course-modal-title').textContent = 'Edit Course';
        openModal('course-modal-overlay');
    }
}

window.deleteCourse = function(id) {
    if(confirm('Are you sure you want to delete this course? Associated timetables may break.')) {
        courses = courses.filter(c => c.id !== id);
        localStorage.setItem('courses', JSON.stringify(courses));
        showToast('Course deleted!', 'success');
        renderCourses();
        updateDashboardStats();
    }
}

/* --- Timetable Creation --- */
function populateCourseDropdown() {
    const select = document.getElementById('timetable-course');
    select.innerHTML = '<option value="" disabled selected>Select a course</option>';
    courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.code} - ${c.name}`;
        select.appendChild(opt);
    });
}

function handleCourseSelection(e) {
    const courseId = e.target.value;
    const course = courses.find(c => c.id === courseId);
    if (course) {
        document.getElementById('timetable-lecturer').value = course.lecturer;
    }
}

function handleSaveTimetable(e) {
    e.preventDefault();
    const courseId = document.getElementById('timetable-course').value;
    const day = document.getElementById('timetable-day').value;
    const startTime = document.getElementById('timetable-start').value;
    const endTime = document.getElementById('timetable-end').value;
    const room = document.getElementById('timetable-room').value.trim();

    if(startTime >= endTime) {
        showToast('Start time must be before end time', 'error');
        return;
    }

    const course = courses.find(c => c.id === courseId);
    if(!course) return;

    // Check duplicates (Room collision on same day/time)
    const hasCollision = timetables.some(t => {
        const sameDay = t.day === day;
        const sameRoom = t.room.toLowerCase() === room.toLowerCase();
        // Time overlap logic
        const overlaps = (startTime < t.endTime) && (endTime > t.startTime);
        return sameDay && sameRoom && overlaps;
    });

    if(hasCollision) {
        showToast(`Collision detected in ${room} on ${day} during this time!`, 'error');
        return;
    }

    const entry = {
        id: Date.now().toString(),
        courseId,
        courseCode: course.code,
        courseName: course.name,
        lecturer: course.lecturer,
        day,
        startTime,
        endTime,
        room
    };

    timetables.push(entry);
    localStorage.setItem('timetables', JSON.stringify(timetables));
    
    showToast('Class scheduled successfully!', 'success');
    e.target.reset();
    updateDashboardStats();
}

/* --- View Timetable --- */
function renderTimetable() {
    const tbody = document.getElementById('timetable-body');
    const searchTerm = document.getElementById('search-timetable').value.toLowerCase();
    const filterDay = document.getElementById('filter-day').value;
    
    tbody.innerHTML = '';

    // Sort by day and then by start time
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
    
    let filtered = timetables.filter(t => {
        const matchesSearch = t.courseCode.toLowerCase().includes(searchTerm) || 
                              t.courseName.toLowerCase().includes(searchTerm) ||
                              t.room.toLowerCase().includes(searchTerm);
        const matchesDay = filterDay === 'All' || t.day === filterDay;
        return matchesSearch && matchesDay;
    });

    filtered.sort((a, b) => {
        if (dayOrder[a.day] !== dayOrder[b.day]) {
            return dayOrder[a.day] - dayOrder[b.day];
        }
        return a.startTime.localeCompare(b.startTime);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No timetable entries found</td></tr>';
        return;
    }

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${t.courseCode}</strong><br><small class="text-secondary">${t.courseName}</small></td>
            <td>${t.lecturer}</td>
            <td><span class="badge-day">${t.day}</span></td>
            <td>${t.startTime} - ${t.endTime}</td>
            <td>${t.room}</td>
            <td class="admin-only">
                <button class="btn-icon delete" onclick="deleteTimetable('${t.id}')" title="Delete Entry"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteTimetable = function(id) {
    if(confirm('Delete this timetable entry?')) {
        timetables = timetables.filter(t => t.id !== id);
        localStorage.setItem('timetables', JSON.stringify(timetables));
        showToast('Timetable entry deleted!', 'success');
        renderTimetable();
        updateDashboardStats();
    }
}
