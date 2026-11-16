/**
 * receipts. — Keep your word to yourself.
 * Application Engine implementing custom specifications & Figma design system
 */

(function () {
  'use strict';

  // ==========================================================================
  // Current Real Date Initialization & Helpers
  // ==========================================================================

  const now = new Date();
  const CURRENT_YEAR = now.getFullYear();
  const CURRENT_MONTH = now.getMonth(); // 0-indexed (0 = Jan, 10 = Nov)
  const CURRENT_DAY = now.getDate();

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatDateKey(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  function formatFullReceiptDate(dateObj) {
    const dayName = DAY_NAMES_SHORT[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthName = MONTH_NAMES[dateObj.getMonth()].slice(0, 3);
    const year = dateObj.getFullYear();
    return `${dayName} ${dayNum} ${monthName} ${year}`;
  }

  function formatShortDateRange(startDateObj, daysCount) {
    if (daysCount <= 1) {
      return `${DAY_NAMES_SHORT[startDateObj.getDay()]} ${startDateObj.getDate()} ${MONTH_NAMES_SHORT[startDateObj.getMonth()]}`;
    }
    const endDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate() + daysCount - 1);
    const sStr = `${DAY_NAMES_SHORT[startDateObj.getDay()]} ${startDateObj.getDate()} ${MONTH_NAMES_SHORT[startDateObj.getMonth()]}`;
    const eStr = `${DAY_NAMES_SHORT[endDate.getDay()]} ${endDate.getDate()} ${MONTH_NAMES_SHORT[endDate.getMonth()]}`;
    return `${sStr} – ${eStr}`;
  }

  function getDaysRemainingInMonth(year, month, fromDay) {
    const totalDays = new Date(year, month + 1, 0).getDate();
    return Math.max(1, totalDays - fromDay + 1);
  }

  function getDaysRemainingInYear(year, month, fromDay) {
    const start = new Date(year, month, fromDay);
    const end = new Date(year, 11, 31);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }

  // Requirement 3: Accurate number of days left in the month from current real day
  function formatHeroSubtitle(year, month) {
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = MONTH_NAMES[month];

    if (year === CURRENT_YEAR && month === CURRENT_MONTH) {
      const daysLeft = totalDaysInMonth - CURRENT_DAY;
      if (daysLeft > 1) {
        return `${monthName}: ${daysLeft} more days to make a win`;
      }
      if (daysLeft === 1) {
        return `${monthName}: 1 more day to make a win`;
      }
      if (daysLeft === 0) {
        return `${monthName}: Final day to make a win!`;
      }
      return `${monthName}: Month completed`;
    } else if (year < CURRENT_YEAR || (year === CURRENT_YEAR && month < CURRENT_MONTH)) {
      return `${monthName}: Month completed`;
    } else {
      return `${monthName}: ${totalDaysInMonth} days to make a win`;
    }
  }

  // ==========================================================================
  // State & Persistent Storage
  // ==========================================================================

  const STORAGE_KEY = 'receipts_app_state_v3';
  const THEME_KEY = 'receipts_theme';

  const TODAY_KEY = formatDateKey(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY);

  const DEFAULT_STATE = {
    currentYear: CURRENT_YEAR,
    currentMonth: CURRENT_MONTH,
    selectedDay: CURRENT_DAY,
    theme: 'dark', // 'dark' (Desktop 1) or 'light' (Desktop 2)
    activeView: 'dashboard', // 'dashboard', 'journal', 'login'
    user: null, // Gate: must be logged in before viewing dashboard
    
    // Day statuses: 'today', 'win', 'loss', 'ahead'
    daysStatus: {
      [TODAY_KEY]: 'today'
    },

    habits: [], // Starts clean!
    dailyChecklists: {}, // Empty receipts by default with placeholders

    journalEntries: {
      [TODAY_KEY]: {
        text: ''
      }
    },

    notifications: {
      email: 'you@example.com',
      time: '21:30',
      enabled: true
    }
  };

  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.currentYear = CURRENT_YEAR;
        parsed.currentMonth = CURRENT_MONTH;
        if (!parsed.selectedDay) parsed.selectedDay = CURRENT_DAY;

        // Requirement 1: Only the real today can EVER have 'today' status
        if (parsed.daysStatus) {
          Object.keys(parsed.daysStatus).forEach(k => {
            if (parsed.daysStatus[k] === 'today' && k !== TODAY_KEY) {
              delete parsed.daysStatus[k];
            }
          });
          parsed.daysStatus[TODAY_KEY] = 'today';
        }

        // Requirement 4: Empty receipts must never be saved
        if (parsed.dailyChecklists) {
          Object.keys(parsed.dailyChecklists).forEach(k => {
            if (!Array.isArray(parsed.dailyChecklists[k]) || parsed.dailyChecklists[k].length === 0) {
              delete parsed.dailyChecklists[k];
            }
          });
        }

        return Object.assign({}, DEFAULT_STATE, parsed);
      }
    } catch (e) {
      console.warn('Could not load saved state:', e);
    }
    return Object.assign({}, DEFAULT_STATE);
  }

  function saveState() {
    try {
      // Requirement 1: Enforce strictly only the real today has 'today'
      if (state.daysStatus) {
        Object.keys(state.daysStatus).forEach(k => {
          if (state.daysStatus[k] === 'today' && k !== TODAY_KEY) {
            delete state.daysStatus[k];
          }
        });
        state.daysStatus[TODAY_KEY] = 'today';
      }

      // Requirement 4: If receipt is empty it should not be saved
      if (state.dailyChecklists) {
        Object.keys(state.dailyChecklists).forEach(k => {
          if (!Array.isArray(state.dailyChecklists[k]) || state.dailyChecklists[k].length === 0) {
            delete state.dailyChecklists[k];
          }
        });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save state:', e);
    }
  }

  // ==========================================================================
  // DOM References
  // ==========================================================================

  const dom = {
    // Header & Nav
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    logoBtn: document.getElementById('logoBtn'),
    loggedInNavItems: document.getElementById('loggedInNavItems'),
    navDashboardBtn: document.getElementById('navDashboardBtn'),
    navJournalBtn: document.getElementById('navJournalBtn'),
    notifyBtn: document.getElementById('notifyBtn'),
    authNavContainer: document.getElementById('authNavContainer'),
    loginNavBtn: document.getElementById('loginNavBtn'),

    // App Layout Views
    authenticatedArea: document.getElementById('authenticatedArea'),
    mainDashboardView: document.getElementById('mainDashboardView'),
    journalViewSection: document.getElementById('journalViewSection'),
    loginViewSection: document.getElementById('loginViewSection'),

    // Hero
    statsSubtitle: document.getElementById('statsSubtitle'),
    openGoalModalBtn: document.getElementById('openGoalModalBtn'),

    // Calendar
    calendarMonthTitleBtn: document.getElementById('calendarMonthTitleBtn'),
    calendarMonthTitle: document.getElementById('calendarMonthTitle'),
    monthYearPickerPopover: document.getElementById('monthYearPickerPopover'),
    pickerYearLabel: document.getElementById('pickerYearLabel'),
    pickerPrevYearBtn: document.getElementById('pickerPrevYearBtn'),
    pickerNextYearBtn: document.getElementById('pickerNextYearBtn'),
    pickerMonthsGrid: document.getElementById('pickerMonthsGrid'),
    calendarGrid: document.getElementById('calendarGrid'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    jumpTodayBtn: document.getElementById('jumpTodayBtn'),

    // Receipt (Right Column)
    receiptPaper: document.getElementById('receiptPaper'),
    receiptDateDisplay: document.getElementById('receiptDateDisplay'),
    receiptItemsList: document.getElementById('receiptItemsList'),
    newReceiptItemInput: document.getElementById('newReceiptItemInput'),
    addReceiptItemBtn: document.getElementById('addReceiptItemBtn'),
    receiptGoalsCount: document.getElementById('receiptGoalsCount'),
    receiptDoneCount: document.getElementById('receiptDoneCount'),
    receiptStatusText: document.getElementById('receiptStatusText'),
    receiptSettleBtn: document.getElementById('receiptSettleBtn'),
    receiptTimestamp: document.getElementById('receiptTimestamp'),
    printReceiptBtn: document.getElementById('printReceiptBtn'),
    openDayJournalBtn: document.getElementById('openDayJournalBtn'),
    reopenReceiptBtn: document.getElementById('reopenReceiptBtn'),

    // Rubber Stamp Overlay
    receiptStampOverlay: document.getElementById('receiptStampOverlay'),
    receiptStampBadge: document.getElementById('receiptStampBadge'),
    stampDateText: document.getElementById('stampDateText'),
    stampMainText: document.getElementById('stampMainText'),
    stampSubText: document.getElementById('stampSubText'),

    // Brain Dump (Journal)
    journalDateDisplay: document.getElementById('journalDateDisplay'),
    journalNotesInput: document.getElementById('journalNotesInput'),
    saveJournalBtn: document.getElementById('saveJournalBtn'),
    pastEntriesList: document.getElementById('pastEntriesList'),
    thoughtChips: document.querySelectorAll('.thought-chip'),

    // Notify Popup Modal
    notifyModal: document.getElementById('notifyModal'),
    notifyModalBackdrop: document.getElementById('notifyModalBackdrop'),
    closeNotifyModalBtn: document.getElementById('closeNotifyModalBtn'),
    notifyPopupForm: document.getElementById('notifyPopupForm'),
    notifyUserEmailDisplay: document.getElementById('notifyUserEmailDisplay'),
    timePills: document.querySelectorAll('.time-pill'),

    // Goal Modal
    goalModal: document.getElementById('goalModal'),
    goalModalBackdrop: document.getElementById('goalModalBackdrop'),
    closeGoalModalBtn: document.getElementById('closeGoalModalBtn'),
    cancelGoalModalBtn: document.getElementById('cancelGoalModalBtn'),
    saveGoalBtn: document.getElementById('saveGoalBtn'),
    goalNameInput: document.getElementById('goalNameInput'),
    previewGoalName: document.getElementById('previewGoalName'),
    previewReceiptDate: document.getElementById('previewReceiptDate'),
    previewGoalHint: document.getElementById('previewGoalHint'),
    freqDaysBtn: document.getElementById('freqDaysBtn'),
    freqMonthlyBtn: document.getElementById('freqMonthlyBtn'),
    freqYearlyBtn: document.getElementById('freqYearlyBtn'),
    daysControlGroup: document.getElementById('daysControlGroup'),
    durationChips: document.querySelectorAll('.duration-chip'),
    goalDaysCountInput: document.getElementById('goalDaysCountInput'),
    goalDurationBanner: document.getElementById('goalDurationBanner'),
    goalDurationSummaryText: document.getElementById('goalDurationSummaryText'),

    // Login View
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginTitleText: document.getElementById('loginTitleText'),
    loginSubmitBtn: document.getElementById('loginSubmitBtn'),
    guestLoginBtn: document.getElementById('guestLoginBtn'),
    toggleAuthModeBtn: document.getElementById('toggleAuthModeBtn'),
    authTogglePrompt: document.getElementById('authTogglePrompt'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // Toast Notification Helper
  function showToast(message) {
    if (!dom.toastContainer) {
      alert(message);
      return;
    }
    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <span>${message}</span>
    `;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }

  // ==========================================================================
  // Theme Management
  // ==========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || state.theme || 'dark';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    saveState();
  }

  function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }

  // ==========================================================================
  // Auth & Login Gate (User must log in before seeing dashboard)
  // ==========================================================================

  let isSignUpMode = false;

  function checkAuthGate() {
    if (!state.user) {
      showLoginView();
    } else {
      showAuthenticatedApp();
    }
  }

  function showLoginView() {
    dom.authenticatedArea.classList.add('hidden');
    dom.loginViewSection.classList.remove('hidden');
    dom.loggedInNavItems.classList.add('hidden');
    dom.authNavContainer.innerHTML = `
      <button class="pill-btn login-nav-btn" id="loginNavBtn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
        Log in
      </button>
    `;
    const btn = document.getElementById('loginNavBtn');
    if (btn) btn.addEventListener('click', showLoginView);
    dom.loginEmail.focus();
  }

  function showAuthenticatedApp() {
    dom.loginViewSection.classList.add('hidden');
    dom.authenticatedArea.classList.remove('hidden');
    dom.loggedInNavItems.classList.remove('hidden');

    // Header User Profile
    dom.authNavContainer.innerHTML = `
      <div class="user-profile-badge">
        <span class="user-greeting">Hi, ${state.user.name}</span>
        <button class="logout-btn" id="logoutBtn" title="Sign out">Log out</button>
      </div>
    `;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    switchView(state.activeView === 'journal' ? 'journal' : 'dashboard');
  }

  function handleLogin(email) {
    const namePart = (email || 'user').split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    state.user = {
      name: formattedName,
      email: email || 'sruthy@example.com'
    };
    saveState();
    showAuthenticatedApp();
  }

  function handleLogout() {
    state.user = null;
    saveState();
    showLoginView();
  }

  function toggleAuthMode(e) {
    if (e) e.preventDefault();
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
      dom.loginTitleText.textContent = 'Create an account';
      dom.loginSubmitBtn.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7.5" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
        Sign up
      `;
      dom.authTogglePrompt.innerHTML = 'Already have an account? <a href="#" id="toggleAuthModeBtn">Sign in</a>';
    } else {
      dom.loginTitleText.textContent = 'Sign in to your receipts';
      dom.loginSubmitBtn.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
        Sign in
      `;
      dom.authTogglePrompt.innerHTML = 'Don\'t have an account? <a href="#" id="toggleAuthModeBtn">Create one</a>';
    }
    const toggleBtn = document.getElementById('toggleAuthModeBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleAuthMode);
    }
  }

  // ==========================================================================
  // Calendar Rendering & Interactive Month/Year Picker
  // ==========================================================================

  let pickerYear = state.currentYear;

  function renderCalendar() {
    const year = state.currentYear;
    const month = state.currentMonth;

    dom.calendarMonthTitle.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    dom.calendarGrid.innerHTML = '';

    // Empty cells for leading padding
    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day-cell state-empty';
      emptyCell.setAttribute('aria-hidden', 'true');
      dom.calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateKey = formatDateKey(year, month, day);
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';
      cell.textContent = day;
      cell.dataset.date = dateKey;
      cell.dataset.day = day;

      const isRealToday = (year === CURRENT_YEAR && month === CURRENT_MONTH && day === CURRENT_DAY);
      const isFuture = (year > CURRENT_YEAR) || 
                       (year === CURRENT_YEAR && month > CURRENT_MONTH) || 
                       (year === CURRENT_YEAR && month === CURRENT_MONTH && day > CURRENT_DAY);
      const isPast = (year < CURRENT_YEAR) || 
                     (year === CURRENT_YEAR && month < CURRENT_MONTH) || 
                     (year === CURRENT_YEAR && month === CURRENT_MONTH && day < CURRENT_DAY);

      let status = state.daysStatus[dateKey];

      // If no explicit state is recorded, apply the prototypical design states:
      if (!status) {
        if (isRealToday) {
          status = 'today';
        } else if (isFuture) {
          status = 'ahead';
        } else if (isPast) {
          // Days 3, 7, 20 are losses like Figma design; other past days are wins
          if (day === 3 || day === 7 || day === 20) {
            status = 'loss';
          } else {
            status = 'win';
          }
        }
      }

      // Requirement 1: Strictly ONLY the real calendar today can EVER have state-today!
      if (isRealToday) {
        cell.classList.add('state-today');
      } else if (status === 'loss') {
        cell.classList.add('state-loss');
      } else if (status === 'win' || status === 'settled') {
        cell.classList.add('state-win');
      } else {
        cell.classList.add('state-ahead');
      }

      // Selected day outline
      if (day === state.selectedDay) {
        cell.classList.add('selected');
      }

      // Normal click: opens receipt for that specific day
      cell.addEventListener('click', () => {
        selectDay(day);
      });

      // Right-click / contextmenu: allows cycling between states (Today can cycle today/win/loss; other days can ONLY cycle win/loss/ahead)
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (isRealToday) {
          const current = cell.classList.contains('state-win') ? 'win' :
                          cell.classList.contains('state-loss') ? 'loss' : 'today';
          const nextMap = { 'today': 'win', 'win': 'loss', 'loss': 'today' };
          state.daysStatus[dateKey] = nextMap[current] || 'today';
        } else {
          const current = cell.classList.contains('state-loss') ? 'loss' :
                          cell.classList.contains('state-ahead') ? 'ahead' : 'win';
          const nextMap = { 'win': 'loss', 'loss': 'ahead', 'ahead': 'win' };
          state.daysStatus[dateKey] = nextMap[current] || 'win';
        }
        saveState();
        renderCalendar();
      });

      dom.calendarGrid.appendChild(cell);
    }

    updateHeroSubtitle();
  }

  function selectDay(day) {
    state.selectedDay = day;
    renderCalendar();
    renderReceipt();
    renderJournalSlip();
    saveState();
  }

  // Requirement 3: Accurate number of days left in the month from today
  function updateHeroSubtitle() {
    const year = state.currentYear;
    const month = state.currentMonth;
    const text = formatHeroSubtitle(year, month);
    dom.statsSubtitle.textContent = text;
  }

  // Month & Year Picker Popover
  function toggleMonthYearPicker() {
    pickerYear = state.currentYear;
    renderPickerGrid();
    dom.monthYearPickerPopover.classList.toggle('hidden');
    dom.calendarMonthTitleBtn.classList.toggle('open', !dom.monthYearPickerPopover.classList.contains('hidden'));
  }

  function renderPickerGrid() {
    dom.pickerYearLabel.textContent = pickerYear;
    dom.pickerMonthsGrid.innerHTML = '';

    MONTH_NAMES_SHORT.forEach((mName, mIdx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `picker-month-btn ${mIdx === state.currentMonth && pickerYear === state.currentYear ? 'active' : ''}`;
      btn.textContent = mName;
      btn.addEventListener('click', () => {
        state.currentMonth = mIdx;
        state.currentYear = pickerYear;
        const maxDays = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
        if (state.selectedDay > maxDays) state.selectedDay = maxDays;

        dom.monthYearPickerPopover.classList.add('hidden');
        dom.calendarMonthTitleBtn.classList.remove('open');
        renderCalendar();
        renderReceipt();
        saveState();
      });
      dom.pickerMonthsGrid.appendChild(btn);
    });
  }

  // ==========================================================================
  // Rubber Stamp Display Helpers
  // ==========================================================================

  function showStamp(type, mainText, subText, dateText) {
    if (!dom.receiptStampOverlay) return;
    dom.receiptStampBadge.className = `rubber-stamp stamp-${type}`;
    dom.stampMainText.textContent = mainText;
    dom.stampSubText.textContent = subText || '';
    if (dateText && dom.stampDateText) {
      dom.stampDateText.textContent = dateText;
    }
    dom.receiptStampOverlay.classList.remove('hidden');
  }

  function hideStamp() {
    if (!dom.receiptStampOverlay) return;
    dom.receiptStampOverlay.classList.add('hidden');
  }

  // ==========================================================================
  // Receipt Rendering (Placeholders, WIN/LOSS Rubber Stamp & Settling)
  // ==========================================================================

  // Requirement 4: Empty receipts are not saved into state
  function getChecklistForSelectedDay() {
    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    return state.dailyChecklists[key] || [];
  }

  function renderReceipt() {
    const dateObj = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    const isSelectedDayToday = (state.currentYear === CURRENT_YEAR && 
                                state.currentMonth === CURRENT_MONTH && 
                                state.selectedDay === CURRENT_DAY);

    const dateFormatted = formatFullReceiptDate(dateObj);
    if (isSelectedDayToday) {
      dom.receiptDateDisplay.innerHTML = `${dateFormatted} <span class="receipt-day-badge today-badge">TODAY</span>`;
    } else {
      const isPast = (state.currentYear < CURRENT_YEAR) || 
                     (state.currentYear === CURRENT_YEAR && state.currentMonth < CURRENT_MONTH) ||
                     (state.currentYear === CURRENT_YEAR && state.currentMonth === CURRENT_MONTH && state.selectedDay < CURRENT_DAY);
      const badgeText = isPast ? 'PAST (READ-ONLY)' : 'UPCOMING (READ-ONLY)';
      dom.receiptDateDisplay.innerHTML = `${dateFormatted} <span class="receipt-day-badge readonly-badge">${badgeText}</span>`;
    }

    const dateStamp = key.replace(/-/g, '');
    dom.receiptTimestamp.textContent = `#REC-${dateStamp}`;

    const items = getChecklistForSelectedDay();
    dom.receiptItemsList.innerHTML = '';

    const status = state.daysStatus[key];
    const dateStampText = `${dateObj.getDate()} ${MONTH_NAMES_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`.toUpperCase();

    // Empty state placeholder
    if (items.length === 0) {
      hideStamp();
      if (dom.reopenReceiptBtn) dom.reopenReceiptBtn.classList.add('hidden');
      dom.receiptItemsList.innerHTML = `
        <div class="receipt-empty-state">
          <div class="empty-item-ghost">[ ] e.g. Morning meditation & stretch</div>
          <div class="empty-item-ghost">[ ] e.g. 45 min deep focus work</div>
          <div class="empty-item-ghost">[ ] e.g. Read 20 pages of book</div>
          <p class="empty-receipt-tip">No commitments set for this day.<br>Type your first task below and click <strong>Add</strong>, or set a goal above.</p>
        </div>
      `;
      dom.receiptGoalsCount.textContent = '0';
      dom.receiptDoneCount.textContent = '0';
      dom.receiptStatusText.textContent = '0 tasks on this receipt';
      
      if (isSelectedDayToday) {
        dom.receiptSettleBtn.disabled = false;
        dom.receiptSettleBtn.classList.remove('locked-btn');
        dom.receiptSettleBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Settle today
        `;
      } else {
        dom.receiptSettleBtn.disabled = true;
        dom.receiptSettleBtn.classList.add('locked-btn');
        dom.receiptSettleBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Locked (Only Today can be settled)
        `;
      }
      updateHeroSubtitle();
      return;
    }

    let doneCount = 0;

    items.forEach((item, index) => {
      if (item.done) doneCount++;

      const row = document.createElement('div');
      row.className = `receipt-item-row ${item.done ? 'completed' : ''} ${!isSelectedDayToday ? 'locked-item' : ''}`;
      if (!isSelectedDayToday) {
        row.setAttribute('title', "Tasks can only be completed on today's receipt");
      }
      row.innerHTML = `
        <span class="item-check">${item.done ? '[✓]' : '[ ]'}</span>
        <span class="item-name" title="${item.title}">${item.title}</span>
        <span class="item-dots"></span>
        <span class="item-state">${item.done ? 'done' : 'open'}</span>
        <button class="item-delete-btn" title="Remove item" aria-label="Delete task">&times;</button>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.classList.contains('item-delete-btn')) {
          e.stopPropagation();
          deleteReceiptItem(index);
          return;
        }

        // Requirement 2: A person can't complete the task of other days - they can do it ONLY for today!
        if (!isSelectedDayToday) {
          showToast("Tasks can only be completed for today's receipt.");
          return;
        }

        item.done = !item.done;
        renderReceipt();
        saveState();
      });

      dom.receiptItemsList.appendChild(row);
    });

    const totalCount = items.length;
    dom.receiptGoalsCount.textContent = totalCount;
    dom.receiptDoneCount.textContent = doneCount;

    // Requirement 2 & Status logic:
    if (!isSelectedDayToday) {
      dom.receiptSettleBtn.disabled = true;
      dom.receiptSettleBtn.classList.add('locked-btn');
      if (status === 'loss') {
        showStamp('loss', 'LOSS', `${totalCount - doneCount} INCOMPLETE`, dateStampText);
        dom.receiptStatusText.textContent = `Settled as LOSS — ${doneCount} of ${totalCount} completed.`;
        dom.receiptSettleBtn.textContent = `Settled: LOSS (${doneCount}/${totalCount})`;
      } else if (status === 'win' || status === 'settled') {
        showStamp('win', 'WIN', 'ALL TASKS COMPLETED', dateStampText);
        dom.receiptStatusText.textContent = `Settled as WIN — All ${totalCount} tasks completed!`;
        dom.receiptSettleBtn.textContent = `Settled: WIN (${totalCount}/${totalCount}) ✓`;
      } else {
        hideStamp();
        dom.receiptStatusText.textContent = `Viewing receipt (${doneCount}/${totalCount} completed) — Read-only`;
        dom.receiptSettleBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Locked (Only Today can be settled)
        `;
      }
    } else {
      dom.receiptSettleBtn.disabled = false;
      dom.receiptSettleBtn.classList.remove('locked-btn');
      if (status === 'loss') {
        showStamp('loss', 'LOSS', `${totalCount - doneCount} INCOMPLETE`, dateStampText);
        if (dom.reopenReceiptBtn) dom.reopenReceiptBtn.classList.remove('hidden');
        dom.receiptStatusText.textContent = `Settled as LOSS — ${doneCount} of ${totalCount} completed.`;
        dom.receiptSettleBtn.textContent = `Settled: LOSS (${doneCount}/${totalCount})`;
      } else if (status === 'win' || status === 'settled') {
        showStamp('win', 'WIN', 'ALL TASKS COMPLETED', dateStampText);
        if (dom.reopenReceiptBtn) dom.reopenReceiptBtn.classList.remove('hidden');
        dom.receiptStatusText.textContent = `Settled as WIN — All ${totalCount} tasks completed!`;
        dom.receiptSettleBtn.textContent = `Settled: WIN (${totalCount}/${totalCount}) ✓`;
      } else {
        hideStamp();
        if (dom.reopenReceiptBtn) dom.reopenReceiptBtn.classList.add('hidden');
        if (doneCount === totalCount && totalCount > 0) {
          dom.receiptStatusText.textContent = `All ${totalCount} tasks completed! Click Settle to lock in your WIN.`;
        } else {
          dom.receiptStatusText.textContent = `${doneCount} of ${totalCount} tasks completed`;
        }
        dom.receiptSettleBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Settle today
        `;
      }
    }

    updateHeroSubtitle();
  }

  function addReceiptItem(title) {
    if (!title || !title.trim()) return;
    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    if (!state.dailyChecklists[key]) {
      state.dailyChecklists[key] = [];
    }
    state.dailyChecklists[key].push({
      id: `t_${Date.now()}`,
      title: title.trim(),
      done: false
    });
    dom.newReceiptItemInput.value = '';
    renderReceipt();
    renderCalendar();
    saveState();
  }

  function deleteReceiptItem(index) {
    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    const items = state.dailyChecklists[key];
    if (items) {
      items.splice(index, 1);
      // Requirement 4: if receipt is empty it should not be saved
      if (items.length === 0) {
        delete state.dailyChecklists[key];
        const isRealToday = (state.currentYear === CURRENT_YEAR && state.currentMonth === CURRENT_MONTH && state.selectedDay === CURRENT_DAY);
        state.daysStatus[key] = isRealToday ? 'today' : 'ahead';
      }
    }
    renderReceipt();
    renderCalendar();
    saveState();
  }

  // Requirement 1 & 2 & 4: Settle Today Logic
  function settleToday() {
    const isSelectedDayToday = (state.currentYear === CURRENT_YEAR && 
                                state.currentMonth === CURRENT_MONTH && 
                                state.selectedDay === CURRENT_DAY);
    if (!isSelectedDayToday) {
      showToast("Only today's receipt can be settled.");
      return;
    }

    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    const items = getChecklistForSelectedDay();
    const totalCount = items.length;
    const doneCount = items.filter(i => i.done).length;

    // Requirement 4: Empty receipt cannot be saved
    if (totalCount === 0) {
      showToast('An empty receipt cannot be saved. Add a commitment first!');
      dom.newReceiptItemInput.focus();
      return;
    }

    const dateObj = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    const dateStampText = `${dateObj.getDate()} ${MONTH_NAMES_SHORT[dateObj.getMonth()]} ${dateObj.getFullYear()}`.toUpperCase();

    // Check if ALL work in receipt is done:
    if (doneCount < totalCount) {
      // Stamped LOSS!
      state.daysStatus[key] = 'loss';
      showStamp('loss', 'LOSS', `${totalCount - doneCount} INCOMPLETE`, dateStampText);
      dom.receiptStatusText.textContent = `Settled as LOSS — ${doneCount} of ${totalCount} tasks completed.`;
      dom.receiptSettleBtn.textContent = `Settled: LOSS (${doneCount}/${totalCount})`;
    } else {
      // Stamped WIN!
      state.daysStatus[key] = 'win';
      showStamp('win', 'WIN', 'ALL TASKS COMPLETED', dateStampText);
      dom.receiptStatusText.textContent = `Settled as WIN — All ${totalCount} tasks completed!`;
      dom.receiptSettleBtn.textContent = `Settled: WIN (${totalCount}/${totalCount}) ✓`;
    }

    if (dom.reopenReceiptBtn) {
      dom.reopenReceiptBtn.classList.remove('hidden');
    }

    renderCalendar();
    updateHeroSubtitle();
    saveState();
  }

  // Reopen Day so user can make changes or re-settle (strictly only today gets 'today')
  function reopenReceipt() {
    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    const isRealToday = (state.currentYear === CURRENT_YEAR && state.currentMonth === CURRENT_MONTH && state.selectedDay === CURRENT_DAY);
    if (isRealToday) {
      state.daysStatus[key] = 'today';
    } else {
      delete state.daysStatus[key];
    }
    hideStamp();
    if (dom.reopenReceiptBtn) dom.reopenReceiptBtn.classList.add('hidden');
    renderReceipt();
    renderCalendar();
    updateHeroSubtitle();
    saveState();
  }

  // ==========================================================================
  // Brain Dump (Journal)
  // ==========================================================================

  function renderJournalSlip() {
    const dateObj = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    dom.journalDateDisplay.textContent = formatFullReceiptDate(dateObj);

    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    const entry = state.journalEntries[key] || { text: '' };

    dom.journalNotesInput.value = entry.text || '';
    renderPastEntries();
  }

  function renderPastEntries() {
    dom.pastEntriesList.innerHTML = '';

    const sortedKeys = Object.keys(state.journalEntries).sort().reverse();
    const displayEntries = [];

    sortedKeys.forEach(k => {
      const text = state.journalEntries[k]?.text;
      if (text && text.trim()) {
        const parts = k.split('-');
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        displayEntries.push({
          key: k,
          dateStr: formatFullReceiptDate(dateObj),
          body: text
        });
      }
    });

    if (displayEntries.length === 0) {
      dom.pastEntriesList.innerHTML = '<p class="journal-section-desc">No reflections written yet. Write in the notebook above and click Save Reflection.</p>';
      return;
    }

    displayEntries.forEach(item => {
      const div = document.createElement('div');
      div.className = 'past-entry-item';
      div.innerHTML = `
        <div class="past-entry-header">${item.dateStr}</div>
        <div class="past-entry-body">${item.body.replace(/\n/g, '<br>')}</div>
      `;
      div.addEventListener('click', () => {
        const parts = item.key.split('-');
        state.currentYear = parseInt(parts[0]);
        state.currentMonth = parseInt(parts[1]) - 1;
        state.selectedDay = parseInt(parts[2]);
        renderJournalSlip();
      });
      dom.pastEntriesList.appendChild(div);
    });
  }

  function saveJournalNote() {
    const key = formatDateKey(state.currentYear, state.currentMonth, state.selectedDay);
    const text = dom.journalNotesInput.value;
    state.journalEntries[key] = { text: text };
    saveState();
    renderPastEntries();
  }

  // ==========================================================================
  // Navigation & Views Switcher
  // ==========================================================================

  function switchView(viewName) {
    state.activeView = viewName;

    dom.navDashboardBtn.classList.toggle('active', viewName === 'dashboard');
    dom.navJournalBtn.classList.toggle('active', viewName === 'journal');

    if (viewName === 'dashboard') {
      dom.mainDashboardView.classList.remove('hidden');
      dom.journalViewSection.classList.add('hidden');
      renderCalendar();
      renderReceipt();
    } else if (viewName === 'journal') {
      dom.mainDashboardView.classList.add('hidden');
      dom.journalViewSection.classList.remove('hidden');
      renderJournalSlip();
    }
  }

  // ==========================================================================
  // Set Goals Modal with Multi-Day / Monthly / Yearly Duration
  // ==========================================================================

  let currentDurationType = 'days'; // 'days', 'monthly', 'yearly'
  let currentDaysCount = 7;

  function updateGoalModalDurationDisplay() {
    const startDate = new Date(state.currentYear, state.currentMonth, state.selectedDay);
    if (dom.previewReceiptDate) dom.previewReceiptDate.textContent = formatFullReceiptDate(startDate);
    const goalTitle = dom.goalNameInput.value.trim() || 'New commitment';
    if (dom.previewGoalName) dom.previewGoalName.textContent = goalTitle;

    // Toggle active state on frequency tabs
    dom.freqDaysBtn.classList.toggle('active', currentDurationType === 'days');
    dom.freqMonthlyBtn.classList.toggle('active', currentDurationType === 'monthly');
    dom.freqYearlyBtn.classList.toggle('active', currentDurationType === 'yearly');

    if (currentDurationType === 'days') {
      dom.daysControlGroup.classList.remove('hidden');
      const count = parseInt(dom.goalDaysCountInput.value) || currentDaysCount;
      currentDaysCount = count;
      const rangeStr = formatShortDateRange(startDate, count);
      dom.goalDurationSummaryText.innerHTML = `Appears on daily receipts for <strong>${count} days</strong> (${rangeStr}).`;
      if (dom.previewGoalHint) dom.previewGoalHint.textContent = `Will appear on ${count} daily receipts (${rangeStr}).`;
    } else if (currentDurationType === 'monthly') {
      dom.daysControlGroup.classList.add('hidden');
      const remDays = getDaysRemainingInMonth(state.currentYear, state.currentMonth, state.selectedDay);
      const mName = MONTH_NAMES[state.currentMonth];
      const rangeStr = formatShortDateRange(startDate, remDays);
      dom.goalDurationSummaryText.innerHTML = `Appears on daily receipts for <strong>${remDays} days</strong> (rest of ${mName}: ${rangeStr}).`;
      if (dom.previewGoalHint) dom.previewGoalHint.textContent = `Will appear across all ${remDays} remaining days in ${mName}.`;
    } else if (currentDurationType === 'yearly') {
      dom.daysControlGroup.classList.add('hidden');
      const remDays = getDaysRemainingInYear(state.currentYear, state.currentMonth, state.selectedDay);
      dom.goalDurationSummaryText.innerHTML = `Appears on daily receipts for <strong>${remDays} days</strong> (through Dec 31, ${state.currentYear}).`;
      if (dom.previewGoalHint) dom.previewGoalHint.textContent = `Will appear on daily receipts through end of ${state.currentYear} (${remDays} days).`;
    }
  }

  function openGoalModal() {
    dom.goalModal.classList.remove('hidden');
    dom.goalNameInput.focus();
    updateGoalModalDurationDisplay();
  }

  function closeGoalModal() {
    dom.goalModal.classList.add('hidden');
  }

  // Requirement 2: Propagate goal across N days on the dashboard receipt!
  function saveNewGoal() {
    const title = dom.goalNameInput.value.trim();
    if (!title) {
      dom.goalNameInput.focus();
      return;
    }

    let nDays = currentDaysCount;
    if (currentDurationType === 'days') {
      nDays = parseInt(dom.goalDaysCountInput.value) || 7;
    } else if (currentDurationType === 'monthly') {
      nDays = getDaysRemainingInMonth(state.currentYear, state.currentMonth, state.selectedDay);
    } else if (currentDurationType === 'yearly') {
      nDays = getDaysRemainingInYear(state.currentYear, state.currentMonth, state.selectedDay);
    }

    const startYear = state.currentYear;
    const startMonth = state.currentMonth;
    const startDay = state.selectedDay;

    // Propagate to all nDays in state.dailyChecklists!
    for (let i = 0; i < nDays; i++) {
      const targetDate = new Date(startYear, startMonth, startDay + i);
      const targetKey = formatDateKey(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

      if (!state.dailyChecklists[targetKey]) {
        state.dailyChecklists[targetKey] = [];
      }

      // Avoid duplicate item with exact same title on the same day
      const exists = state.dailyChecklists[targetKey].some(item => item.title.trim().toLowerCase() === title.toLowerCase());
      if (!exists) {
        state.dailyChecklists[targetKey].push({
          id: `t_${Date.now()}_${i}`,
          title: title,
          done: false
        });
      }
    }

    // Save habit record
    state.habits.push({
      id: `h_${Date.now()}`,
      title: title,
      durationType: currentDurationType,
      daysCount: nDays,
      startDate: formatDateKey(startYear, startMonth, startDay)
    });

    saveState();
    closeGoalModal();
    renderCalendar();
    renderReceipt();

    const rangeStr = formatShortDateRange(new Date(startYear, startMonth, startDay), nDays);
    showToast(`Goal "${title}" added to your receipts for the next ${nDays} days (${rangeStr})!`);
  }

  function openNotifyModal() {
    const userEmail = state.user?.email || state.notifications?.email || 'sruthy@example.com';
    if (dom.notifyUserEmailDisplay) {
      dom.notifyUserEmailDisplay.textContent = userEmail;
    }
    dom.notifyModal.classList.remove('hidden');
  }

  function closeNotifyModal() {
    dom.notifyModal.classList.add('hidden');
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  function setupEventListeners() {
    dom.themeToggleBtn.addEventListener('click', toggleTheme);

    dom.navDashboardBtn.addEventListener('click', () => switchView('dashboard'));
    dom.navJournalBtn.addEventListener('click', () => switchView('journal'));
    dom.logoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.user) switchView('dashboard');
    });

    // Notify Popup Modal
    dom.notifyBtn.addEventListener('click', openNotifyModal);
    dom.closeNotifyModalBtn.addEventListener('click', closeNotifyModal);
    dom.notifyModalBackdrop.addEventListener('click', closeNotifyModal);

    dom.notifyPopupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const userEmail = state.user?.email || state.notifications?.email || 'sruthy@example.com';
      state.notifications.email = userEmail;
      state.notifications.enabled = true;
      saveState();
      closeNotifyModal();

      dom.notifyBtn.innerHTML = `
        <svg class="tab-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Notify ✓
      `;
      showToast(`Daily reminder set! Reminders will be sent to ${userEmail} at ${state.notifications.time || '9:30 pm'}.`);
    });

    dom.timePills.forEach(pill => {
      pill.addEventListener('click', () => {
        dom.timePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.notifications.time = pill.dataset.time;
        saveState();
      });
    });

    // Calendar Month/Year Selector Popover
    dom.calendarMonthTitleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMonthYearPicker();
    });

    dom.pickerPrevYearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pickerYear--;
      renderPickerGrid();
    });

    dom.pickerNextYearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pickerYear++;
      renderPickerGrid();
    });

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (!dom.monthYearPickerPopover.contains(e.target) && e.target !== dom.calendarMonthTitleBtn) {
        dom.monthYearPickerPopover.classList.add('hidden');
        dom.calendarMonthTitleBtn.classList.remove('open');
      }
    });

    // Calendar Month Navigation Arrows
    dom.prevMonthBtn.addEventListener('click', () => {
      state.currentMonth--;
      if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
      }
      renderCalendar();
      renderReceipt();
    });

    dom.nextMonthBtn.addEventListener('click', () => {
      state.currentMonth++;
      if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
      }
      renderCalendar();
      renderReceipt();
    });

    dom.jumpTodayBtn.addEventListener('click', () => {
      state.currentYear = CURRENT_YEAR;
      state.currentMonth = CURRENT_MONTH;
      state.selectedDay = CURRENT_DAY;
      renderCalendar();
      renderReceipt();
    });

    // Receipt Settle Today button inside receipt
    dom.receiptSettleBtn.addEventListener('click', settleToday);

    // Reopen receipt button
    if (dom.reopenReceiptBtn) {
      dom.reopenReceiptBtn.addEventListener('click', reopenReceipt);
    }

    // Quick add task on receipt
    dom.addReceiptItemBtn.addEventListener('click', () => {
      addReceiptItem(dom.newReceiptItemInput.value);
    });

    dom.newReceiptItemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        addReceiptItem(dom.newReceiptItemInput.value);
      }
    });

    // Print Receipt
    dom.printReceiptBtn.addEventListener('click', () => {
      window.print();
    });

    // Open Daily Note (Brain Dump)
    dom.openDayJournalBtn.addEventListener('click', () => {
      switchView('journal');
    });

    // Brain Dump Prompts
    dom.thoughtChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        const currentVal = dom.journalNotesInput.value;
        dom.journalNotesInput.value = currentVal ? `${currentVal}\n\n${prompt} ` : `${prompt} `;
        dom.journalNotesInput.focus();
      });
    });

    // Prominent Save Reflection Button
    dom.saveJournalBtn.addEventListener('click', () => {
      saveJournalNote();
      dom.saveJournalBtn.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Saved! ✓
      `;
      setTimeout(() => {
        dom.saveJournalBtn.innerHTML = `
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          Save Reflection
        `;
      }, 1800);
    });

    // Goal Modal Duration Controls
    dom.openGoalModalBtn.addEventListener('click', openGoalModal);
    dom.closeGoalModalBtn.addEventListener('click', closeGoalModal);
    dom.cancelGoalModalBtn.addEventListener('click', closeGoalModal);
    dom.goalModalBackdrop.addEventListener('click', closeGoalModal);
    dom.saveGoalBtn.addEventListener('click', saveNewGoal);

    dom.goalNameInput.addEventListener('input', () => {
      if (dom.previewGoalName) {
        dom.previewGoalName.textContent = dom.goalNameInput.value || 'New commitment';
      }
    });

    // Duration tab buttons: Few Days, Monthly, Yearly
    dom.freqDaysBtn.addEventListener('click', () => {
      currentDurationType = 'days';
      updateGoalModalDurationDisplay();
    });

    dom.freqMonthlyBtn.addEventListener('click', () => {
      currentDurationType = 'monthly';
      updateGoalModalDurationDisplay();
    });

    dom.freqYearlyBtn.addEventListener('click', () => {
      currentDurationType = 'yearly';
      updateGoalModalDurationDisplay();
    });

    // Duration quick chips (3, 5, 7, 14, 21, 30 days)
    dom.durationChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dom.durationChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const days = parseInt(chip.dataset.days) || 7;
        currentDaysCount = days;
        dom.goalDaysCountInput.value = days;
        updateGoalModalDurationDisplay();
      });
    });

    // Custom days count input
    dom.goalDaysCountInput.addEventListener('input', () => {
      const val = parseInt(dom.goalDaysCountInput.value) || 1;
      currentDaysCount = val;
      // Match chip if exists
      dom.durationChips.forEach(chip => {
        chip.classList.toggle('active', parseInt(chip.dataset.days) === val);
      });
      updateGoalModalDurationDisplay();
    });

    // Login Form Submit
    dom.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin(dom.loginEmail.value);
    });

    // Instant Guest Login Button
    dom.guestLoginBtn.addEventListener('click', () => {
      handleLogin('guest@receipts.app');
    });

    if (dom.toggleAuthModeBtn) {
      dom.toggleAuthModeBtn.addEventListener('click', toggleAuthMode);
    }
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    initTheme();
    checkAuthGate();
    setupEventListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
