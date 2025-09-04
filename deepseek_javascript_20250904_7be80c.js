// Default task templates
const DEFAULT_TASK_TEMPLATES = [
    {id:'skin_am', label:'Skin AM: Cleanser + Moisturizer + Sunscreen'},
    {id:'skin_pm', label:'Skin PM: Cleanser + Moisturizer + Treatment'},
    {id:'workout', label:'Workout: Strength or Cardio (30-50 min)'},
    {id:'steps', label:'Walk: 7,000 - 10,000 steps'},
    {id:'water', label:'Hydration: Drink 3 - 4 L water'},
    {id:'sleep', label:'Sleep: 7 - 8 hrs (phone off 30 min before bed)'},
    {id:'meditate', label:'Mindset: Meditation (5 - 10 min)'},
    {id:'learning', label:'Skill practice: 30 - 60 min'},
];

// Configuration
const CONFIG = {
    duration: 90,
    startDate: new Date(),
    tasks: DEFAULT_TASK_TEMPLATES
};

// Storage keys
const STORAGE_KEY = 'my_transformation_diary';

// Initialize
function initApp() {
    loadStorage();
    setupEventListeners();
    renderDayButtons();
    selectToday();
    updateStats();
}

// Load data storage
function loadStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        window.store = { days: {} };
        return;
    }
    
    try {
        window.store = JSON.parse(raw);
        if (!store.days) store.days = {};
    } catch (e) {
        console.error('Error parsing storage', e);
        window.store = { days: {} };
    }
}

// Save data to storage
function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    updateStats();
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).style.display = 'block';
        });
    });
    
    // Journal save
    document.getElementById('saveJournalBtn').addEventListener('click', saveJournal);
    
    // Clear day
    document.getElementById('clearDayBtn').addEventListener('click', clearDay);
    
    // Select all tasks
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        const dayObj = ensureDayObj(selectedDay);
        CONFIG.tasks.forEach(task => {
            dayObj.tasks[task.id] = true;
        });
        saveStore();
        renderTasks();
    });
    
    // Clear all tasks
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        const dayObj = ensureDayObj(selectedDay);
        CONFIG.tasks.forEach(task => {
            dayObj.tasks[task.id] = false;
        });
        saveStore();
        renderTasks();
    });
    
    // Export buttons
    document.getElementById('exportJsonBtn').addEventListener('click', exportData);
    document.getElementById('printBtn').addEventListener('click', printSummary);
}

// Utility functions
function dayToDate(dayIndex) {
    const d = new Date(CONFIG.startDate);
    d.setDate(d.getDate() + (dayIndex - 1));
    return d;
}

function formatDateISO(d) {
    return d.toISOString().slice(0, 10);
}

function formatPretty(d) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString(undefined, options);
}

function getDayName(d) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
}

// Selected day management
let selectedDay = 1;

function ensureDayObj(dayIndex) {
    const iso = formatDateISO(dayToDate(dayIndex));
    if (!store.days[iso]) {
        store.days[iso] = {
            tasks: {},
            journal: '',
            completed: false
        };
        
        // Initialize all tasks as not completed
        CONFIG.tasks.forEach(task => {
            store.days[iso].tasks[task.id] = false;
        });
    }
    return store.days[iso];
}

// Render day buttons
function renderDayButtons() {
    const container = document.getElementById('dayButtons');
    container.innerHTML = '';
    
    for (let d = 1; d <= CONFIG.duration; d++) {
        const date = dayToDate(d);
        const dayName = getDayName(date);
        
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.innerHTML = `
            <span class="number">${d}</span>
            <span class="label">${dayName}</span>
        `;
        btn.dataset.day = d;
        btn.addEventListener('click', () => selectDay(d));
        
        // Mark completed days
        const iso = formatDateISO(date);
        if (store.days[iso] && store.days[iso].completed) {
            btn.style.borderColor = 'var(--success)';
        }
        
        container.appendChild(btn);
    }
}

// Select a day
function selectDay(dayIndex) {
    selectedDay = dayIndex;
    
    // Update UI
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.day) === dayIndex);
    });
    
    const date = dayToDate(dayIndex);
    document.getElementById('dayNumber').textContent = dayIndex;
    document.getElementById('weekNumber').textContent = Math.ceil(dayIndex / 7);
    document.getElementById('selectedDate').textContent = formatPretty(date);
    
    renderTasks();
}

// Select today
function selectToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(CONFIG.startDate);
    start.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    const dayIndex = Math.min(Math.max(1, diff + 1), CONFIG.duration);
    
    selectDay(dayIndex);
}

// Render tasks
function renderTasks() {
    const container = document.getElementById('tasks');
    container.innerHTML = '';
    
    const dayObj = ensureDayObj(selectedDay);
    
    CONFIG.tasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task ${dayObj.tasks[task.id] ? 'completed' : ''}`;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = dayObj.tasks[task.id];
        checkbox.id = `task-${task.id}`;
        checkbox.addEventListener('change', () => {
            dayObj.tasks[task.id] = checkbox.checked;
            
            // Check if all tasks are completed
            const allCompleted = CONFIG.tasks.every(t => dayObj.tasks[t.id]);
            dayObj.completed = allCompleted;
            
            saveStore();
            renderTasks();
            renderDayButtons(); // Update day buttons to reflect completion
        });
        
        const label = document.createElement('label');
        label.htmlFor = `task-${task.id}`;
        label.className = 'label';
        label.textContent = task.label;
        
        taskEl.appendChild(checkbox);
        taskEl.appendChild(label);
        container.appendChild(taskEl);
    });
    
    // Update progress
    updateProgress(dayObj);
    
    // Load journal
    document.getElementById('journalText').value = dayObj.journal || '';
}

// Update progress bar
function updateProgress(dayObj) {
    const total = CONFIG.tasks.length;
    const completed = Object.values(dayObj.tasks).filter(v => v).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('checkedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('percent').textContent = `${percent}%`;
    document.getElementById('progressBar').style.width = `${percent}%`;
}

// Save journal
function saveJournal() {
    const dayObj = ensureDayObj(selectedDay);
    dayObj.journal = document.getElementById('journalText').value;
    saveStore();
    
    // Show confirmation
    const btn = document.getElementById('saveJournalBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Saved!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Clear day
function clearDay() {
    if (!confirm('Clear all tasks and journal for this day?')) return;
    
    const iso = formatDateISO(dayToDate(selectedDay));
    store.days[iso] = {
        tasks: {},
        journal: '',
        completed: false
    };
    
    CONFIG.tasks.forEach(task => {
        store.days[iso].tasks[task.id] = false;
    });
    
    saveStore();
    renderTasks();
}

// Update statistics
function updateStats() {
    const days = Object.keys(store.days).length;
    const completedDays = Object.values(store.days).filter(day => day.completed).length;
    const completionRate = days > 0 ? Math.round((completedDays / days) * 100) : 0;
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < CONFIG.duration; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const iso = formatDateISO(date);
        
        if (store.days[iso] && store.days[iso].completed) {
            streak++;
        } else {
            break;
        }
    }
    
    // Calculate total tasks completed
    let totalTasks = 0;
    Object.values(store.days).forEach(day => {
        totalTasks += Object.values(day.tasks).filter(v => v).length;
    });
    
    document.getElementById('daysCompleted').textContent = completedDays;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
    document.getElementById('currentStreak').textContent = streak;
    document.getElementById('totalTasks').textContent = totalTasks;
    
    renderCheckpoints();
}

// Render checkpoints
function renderCheckpoints() {
    const container = document.getElementById('checkpoints');
    container.innerHTML = '';
    
    for (let week = 1; week <= Math.ceil(CONFIG.duration / 7); week++) {
        const weekStartDay = (week - 1) * 7 + 1;
        const weekEndDay = Math.min(week * 7, CONFIG.duration);
        
        const weekEl = document.createElement('div');
        weekEl.style.marginBottom = '20px';
        
        const header = document.createElement('h4');
        header.textContent = `Week ${week} (Day ${weekStartDay}-${weekEndDay})`;
        header.style.marginBottom = '8px';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress';
        progressBar.style.marginBottom = '8px';
        
        const progressFill = document.createElement('i');
        progressBar.appendChild(progressFill);
        
        // Calculate week completion
        let weekCompleted = 0;
        for (let d = weekStartDay; d <= weekEndDay; d++) {
            const iso = formatDateISO(dayToDate(d));
            if (store.days[iso] && store.days[iso].completed) {
                weekCompleted++;
            }
        }
        
        const weekPercent = Math.round((weekCompleted / (weekEndDay - weekStartDay + 1)) * 100);
        progressFill.style.width = `${weekPercent}%`;
        
        const stats = document.createElement('div');
        stats.className = 'sub';
        stats.textContent = `${weekCompleted}/${weekEndDay - weekStartDay + 1} days completed (${weekPercent}%)`;
        
        weekEl.appendChild(header);
        weekEl.appendChild(progressBar);
        weekEl.appendChild(stats);
        
        container.appendChild(weekEl);
    }
}

// Export data
function exportData() {
    const data = {
        config: CONFIG,
        data: store
    };
    
    const exportContent = JSON.stringify(data, null, 2);
    const blob = new Blob([exportContent], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transformation_diary_export.json';
    a.click();
    
    URL.revokeObjectURL(url);
}

// Print summary
function printSummary() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Transformation Diary Summary</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; }
                    .summary-section { margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>Transformation Diary Summary</h1>
                <div class="summary-section">
                    <h2>Progress Overview</h2>
                    <p>Days Completed: ${document.getElementById('daysCompleted').textContent}</p>
                    <p>Completion Rate: ${document.getElementById('completionRate').textContent}</p>
                    <p>Current Streak: ${document.getElementById('currentStreak').textContent} days</p>
                    <p>Total Tasks Completed: ${document.getElementById('totalTasks').textContent}</p>
                </div>
                <div class="summary-section">
                    <h2>Weekly Progress</h2>
                    ${document.getElementById('checkpoints').innerHTML}
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Initialize the app
window.store = { days: {} };
window.addEventListener('load', initApp);
window.addEventListener('beforeunload', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
});