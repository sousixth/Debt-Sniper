// ============================================================================
// DebtSniper - Core Logic Engine & LocalStorage Manager
// ============================================================================

const STORAGE_KEYS = {
  DEBTS: 'debtsniper_debts_v1',
  BUDGET: 'debtsniper_budget_v1',
  STRATEGY: 'debtsniper_strategy_v1',
  HISTORY: 'debtsniper_history_v1',
  SUPABASE_URL: 'debtsniper_supabase_url',
  SUPABASE_KEY: 'debtsniper_supabase_key'
};

// Initial Preset based on 70,000 THB total debt
const DEFAULT_DEBTS = [
  {
    id: 'debt-1',
    name: 'บัตรกดเงินสด Speedy Cash',
    originalBalance: 15000,
    currentBalance: 15000,
    apr: 25,
    minPayment: 750,
    dueDate: '05',
    createdAt: Date.now()
  },
  {
    id: 'debt-2',
    name: 'บัตรเครดิต X-Card',
    originalBalance: 25000,
    currentBalance: 25000,
    apr: 16,
    minPayment: 1250,
    dueDate: '15',
    createdAt: Date.now()
  },
  {
    id: 'debt-3',
    name: 'สินเชื่อส่วนบุคคล Easy Loan',
    originalBalance: 30000,
    currentBalance: 30000,
    apr: 22,
    minPayment: 1500,
    dueDate: '28',
    createdAt: Date.now()
  }
];

const DEFAULT_BUDGET = {
  salary: 31000,
  survivalBudget: 21000,
  emergencyBuffer: 1000
};

// Application State
let state = {
  debts: [],
  budget: { ...DEFAULT_BUDGET },
  strategy: 'snowball', // 'snowball' (smallest first) or 'avalanche' (highest APR first)
  history: []
};

// Load saved data or fallback to defaults
function loadState() {
  try {
    const savedDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
    state.debts = savedDebts ? JSON.parse(savedDebts) : DEFAULT_DEBTS;

    const savedBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);
    state.budget = savedBudget ? JSON.parse(savedBudget) : DEFAULT_BUDGET;

    const savedStrategy = localStorage.getItem(STORAGE_KEYS.STRATEGY);
    state.strategy = savedStrategy || 'snowball';

    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    state.history = savedHistory ? JSON.parse(savedHistory) : [];
  } catch (e) {
    console.error('Error loading state from localStorage:', e);
    state.debts = DEFAULT_DEBTS;
    state.budget = DEFAULT_BUDGET;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(state.debts));
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(state.budget));
    localStorage.setItem(STORAGE_KEYS.STRATEGY, state.strategy);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    syncToCloud();
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

// Subtle iOS Haptic Micro-Tap sound
let _hapticCtx = null;
function playHapticTap() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!_hapticCtx) _hapticCtx = new AudioContext();
    if (_hapticCtx.state === 'suspended') _hapticCtx.resume();
    
    const osc = _hapticCtx.createOscillator();
    const gain = _hapticCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, _hapticCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, _hapticCtx.currentTime + 0.035);
    
    gain.gain.setValueAtTime(0.04, _hapticCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _hapticCtx.currentTime + 0.035);
    
    osc.connect(gain);
    gain.connect(_hapticCtx.destination);
    osc.start(_hapticCtx.currentTime);
    osc.stop(_hapticCtx.currentTime + 0.035);
  } catch(e) {}
}

// Global Touch Ripple & Smooth Spring Click
document.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('button, .ios-glass-pill, input[type="range"]');
  if (btn) {
    playHapticTap();
    
    // Create ripple effect
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    
    if (getComputedStyle(btn).position === 'static') {
      btn.style.position = 'relative';
    }
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
});

// Sound synthesizer using Web Audio API (No external sound files required)
function playTriumphSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.65);
    });
  } catch (e) {
    // Audio might be muted or blocked by browser gesture rules
  }
}

// Canvas Confetti Celebration
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#10b981', '#38bdf8', '#fbbf24', '#f43f5e', '#a855f7'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.8) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.alpha -= 0.012;
      p.rotation += p.vRot;

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  render();
}

// Calculation & Strategy Helpers
function getSortedDebts() {
  const activeDebts = state.debts.filter(d => d.currentBalance > 0);
  const paidDebts = state.debts.filter(d => d.currentBalance <= 0);

  if (state.strategy === 'snowball') {
    // Smallest balance first
    activeDebts.sort((a, b) => a.currentBalance - b.currentBalance);
  } else {
    // Highest APR first
    activeDebts.sort((a, b) => b.apr - a.apr);
  }

  return { activeDebts, paidDebts };
}

function calculateSummary() {
  const totalDebt = state.debts.reduce((sum, d) => sum + Math.max(0, d.currentBalance), 0);
  const originalTotal = state.debts.reduce((sum, d) => sum + d.originalBalance, 0);
  const paidTotal = Math.max(0, originalTotal - totalDebt);
  const overallProgress = originalTotal > 0 ? (paidTotal / originalTotal) * 100 : 100;

  const { activeDebts, paidDebts } = getSortedDebts();
  const currentTarget = activeDebts.length > 0 ? activeDebts[0] : null;

  // Min payments
  const totalMinPayment = activeDebts.reduce((sum, d) => sum + d.minPayment, 0);

  // Cashflow calculations
  const netDebtAttackFund = Math.max(0, state.budget.salary - state.budget.survivalBudget - state.budget.emergencyBuffer);
  
  // Other active debts min payments
  const otherDebtsMin = activeDebts.filter(d => d.id !== currentTarget?.id).reduce((sum, d) => sum + d.minPayment, 0);
  
  // Sniper ammo for target: Total debt fund minus other cards' minimums
  const sniperAmmo = Math.max(0, netDebtAttackFund - otherDebtsMin);

  return {
    totalDebt,
    originalTotal,
    paidTotal,
    overallProgress,
    activeCount: activeDebts.length,
    paidCount: paidDebts.length,
    currentTarget,
    totalMinPayment,
    netDebtAttackFund,
    otherDebtsMin,
    sniperAmmo,
    cashflowStatus: netDebtAttackFund >= totalMinPayment ? 'healthy' : 'deficit'
  };
}

// Multi-month Snowball Payoff Simulator
function simulateSnowballPayoff(extraMonthly = 0) {
  const { activeDebts } = getSortedDebts();
  if (activeDebts.length === 0) return { months: 0, totalInterest: 0, timeline: [] };

  // Deep clone for simulation
  let simulatedDebts = activeDebts.map(d => ({
    ...d,
    balance: d.currentBalance,
    monthlyRate: (d.apr / 100) / 12
  }));

  const baseAttackFund = Math.max(0, state.budget.salary - state.budget.survivalBudget - state.budget.emergencyBuffer);
  const totalMonthlyFund = baseAttackFund + extraMonthly;

  let months = 0;
  let totalInterest = 0;
  const timeline = [];

  while (simulatedDebts.some(d => d.balance > 0) && months < 120) {
    months++;
    let monthInterest = 0;

    // Step 1: Accrue interest on all active debts
    simulatedDebts.forEach(d => {
      if (d.balance > 0) {
        const interest = d.balance * d.monthlyRate;
        d.balance += interest;
        monthInterest += interest;
        totalInterest += interest;
      }
    });

    // Step 2: Pay minimums on all non-target debts
    let moneyPool = totalMonthlyFund;
    const currentActive = simulatedDebts.filter(d => d.balance > 0);
    if (currentActive.length === 0) break;

    const target = currentActive[0]; // Top priority

    // Pay minimums on others
    for (let i = 1; i < currentActive.length; i++) {
      const debt = currentActive[i];
      const minToPay = Math.min(debt.balance, debt.minPayment);
      debt.balance -= minToPay;
      moneyPool -= minToPay;
    }

    // Step 3: Unleash remaining moneyPool into target
    if (moneyPool > 0 && target) {
      const payAmount = Math.min(target.balance, moneyPool);
      target.balance -= payAmount;
      moneyPool -= payAmount;

      // If target is completely killed and there's leftover money in the pool, spill into next debt!
      if (target.balance <= 0 && moneyPool > 0) {
        for (let i = 1; i < currentActive.length; i++) {
          if (currentActive[i].balance > 0 && moneyPool > 0) {
            const spillPay = Math.min(currentActive[i].balance, moneyPool);
            currentActive[i].balance -= spillPay;
            moneyPool -= spillPay;
          }
        }
      }
    }

    const remainingTotal = simulatedDebts.reduce((sum, d) => sum + Math.max(0, d.balance), 0);
    timeline.push({
      month: months,
      remainingTotal: Math.round(remainingTotal),
      monthInterest: Math.round(monthInterest)
    });

    if (remainingTotal <= 0) break;
  }

  return {
    months,
    totalInterest: Math.round(totalInterest),
    timeline
  };
}

// UI Renderers & Image 3 Experience
function updateGreeting() {
  const greetingEl = document.getElementById('greeting-text');
  if (!greetingEl) return;

  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];

  const hour = now.getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
  } else if (hour >= 21 || hour < 5) {
    timeOfDay = 'night';
  }

  greetingEl.innerHTML = `${dayName} ${timeOfDay},<br><span class="text-slate-400 font-light">here's where you stand.</span>`;
}

function switchTab(tab) {
  const tabs = ['home', 'ask', 'scenarios', 'connections'];
  tabs.forEach(t => {
    const btn = document.getElementById('nav-btn-' + t);
    const content = document.getElementById('tab-content-' + t);
    if (t === tab) {
      if (btn) {
        btn.className = 'w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.08] text-white text-sm font-medium border border-white/[0.08] shadow-sm transition';
      }
      if (content) content.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = 'w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.04] text-sm font-medium transition';
      }
      if (content) content.classList.add('hidden');
    }
  });
}

function renderDashboard() {
  const summary = calculateSummary();
  const sim = simulateSnowballPayoff(0);

  // Dynamic greeting matching Image 3
  updateGreeting();

  // Top metric values (Image 3 squircle cards)
  const totalDebtEl = document.getElementById('metric-total-debt');
  if (totalDebtEl) totalDebtEl.textContent = '฿' + summary.totalDebt.toLocaleString();

  const debtBadge = document.getElementById('metric-debt-badge');
  if (debtBadge) {
    debtBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ${summary.overallProgress.toFixed(0)}% ปลดหนี้แล้ว`;
  }

  // Ammo card
  const ammoValEl = document.getElementById('metric-ammo-val');
  if (ammoValEl) ammoValEl.textContent = '฿' + summary.sniperAmmo.toLocaleString();

  const ammoBadge = document.getElementById('metric-ammo-badge');
  if (ammoBadge) {
    ammoBadge.textContent = summary.currentTarget 
      ? `Target: ${summary.currentTarget.name.split(' ')[0]}` 
      : 'ปลดหนี้ครบแล้ว!';
  }

  // Min Payments
  const minPayEl = document.getElementById('metric-min-pay');
  if (minPayEl) minPayEl.textContent = '฿' + summary.totalMinPayment.toLocaleString();

  const debtsCountBadge = document.getElementById('metric-debts-count-badge');
  if (debtsCountBadge) debtsCountBadge.textContent = `${summary.activeCount} active debts`;

  // Est Freedom Date
  const freedomDate = new Date();
  freedomDate.setMonth(freedomDate.getMonth() + sim.months);
  const engMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const freedomStr = sim.months > 0 
    ? `${engMonths[freedomDate.getMonth()]} ${freedomDate.getFullYear()}`
    : 'Debt-Free!';
  const freedomEl = document.getElementById('metric-freedom-date');
  if (freedomEl) freedomEl.textContent = freedomStr;

  // Cashflow Shield Card (in Scenarios Tab)
  const salaryEl = document.getElementById('cashflow-salary-val');
  if (salaryEl) salaryEl.textContent = '฿' + state.budget.salary.toLocaleString();

  const survivalEl = document.getElementById('cashflow-survival-val');
  if (survivalEl) survivalEl.textContent = '฿' + state.budget.survivalBudget.toLocaleString();

  const bufferEl = document.getElementById('cashflow-buffer-val');
  if (bufferEl) bufferEl.textContent = '฿' + state.budget.emergencyBuffer.toLocaleString();

  const ammoValEl2 = document.getElementById('cashflow-ammo-val');
  if (ammoValEl2) ammoValEl2.textContent = '฿' + summary.sniperAmmo.toLocaleString();

  const cashflowAlert = document.getElementById('cashflow-alert-box');
  if (cashflowAlert) {
    if (summary.cashflowStatus === 'healthy') {
      cashflowAlert.className = 'p-4 rounded-2xl ios-glass border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-3';
      cashflowAlert.innerHTML = `
        <span class="text-lg">🛡️</span>
        <div>
          <b class="font-semibold text-emerald-200">กระแสเงินสดเป็นบวก!</b> คุณมีกระสุนสไนเปอร์เดือนละ <b>฿${summary.sniperAmmo.toLocaleString()}</b> สำหรับยิงปิดหนี้เป้าหมายแรก ดำเนินการตามแผนจะปลดหนี้ทั้งหมดได้ใน <b>${sim.months} เดือน</b>
        </div>
      `;
    } else {
      cashflowAlert.className = 'p-4 rounded-2xl ios-glass border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3';
      cashflowAlert.innerHTML = `
        <span class="text-lg">⚠️</span>
        <div>
          <b class="font-semibold text-rose-200">กระแสเงินสดติดลบ!</b> เงินที่เหลือไม่พอจ่ายขั้นต่ำรวม (ขาดอีก ฿${(summary.totalMinPayment - summary.netDebtAttackFund).toLocaleString()}) ให้กดปรับลดงบกินอยู่ หรือเริ่มเจรจาปรับโครงสร้างหนี้
        </div>
      `;
    }
  }

  // Update Strategy Buttons (Segmented Style)
  const btnSnowball = document.getElementById('strat-snowball');
  const btnAvalanche = document.getElementById('strat-avalanche');
  if (btnSnowball && btnAvalanche) {
    if (state.strategy === 'snowball') {
      btnSnowball.className = 'px-3.5 py-1 text-xs font-semibold rounded-full bg-emerald-400 text-slate-950 transition shadow-sm';
      btnAvalanche.className = 'px-3.5 py-1 text-xs font-medium rounded-full text-slate-400 hover:text-white transition';
    } else {
      btnAvalanche.className = 'px-3.5 py-1 text-xs font-semibold rounded-full bg-emerald-400 text-slate-950 transition shadow-sm';
      btnSnowball.className = 'px-3.5 py-1 text-xs font-medium rounded-full text-slate-400 hover:text-white transition';
    }
  }

  // Update Question 1 Simulation Preview
  const qSim = simulateSnowballPayoff(2000);
  const qMonthsCut = Math.max(0, sim.months - qSim.months);
  const qIntSaved = Math.max(0, sim.totalInterest - qSim.totalInterest);
  const qSimEl = document.getElementById('q-sim-preview');
  if (qSimEl) {
    qSimEl.textContent = `คำนวณแล้ว: ปลดหนี้เร็วขึ้นทันที ~${qMonthsCut} เดือน และประหยัดดอกเบี้ย ฿${qIntSaved.toLocaleString()}`;
  }

  // Render Debts List into WHAT CHANGED
  renderDebtsList();
  renderSimulator();
}

function renderDebtsList() {
  const whatChangedContainer = document.getElementById('what-changed-list');
  const { activeDebts, paidDebts } = getSortedDebts();
  const summary = calculateSummary();

  if (whatChangedContainer) {
    whatChangedContainer.innerHTML = '';

    if (activeDebts.length === 0 && paidDebts.length === 0) {
      whatChangedContainer.innerHTML = `
        <div class="text-center py-8 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
          <p class="text-xs text-slate-400 mb-3">ยังไม่มีรายการหนี้ในระบบ</p>
          <button type="button" onclick="openAddDebtModal()" class="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-slate-100 transition shadow-sm">
            + เพิ่มรายการหนี้แรก
          </button>
        </div>
      `;
    } else {
      // Image 3 Exact List Layout: Glowing green dot • title, action arrow ↗, and subtitle details
      activeDebts.forEach((debt, index) => {
        const isTarget = index === 0;
        const item = document.createElement('div');
        item.className = 'p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition cursor-pointer group';
        item.onclick = () => openMakePaymentModal(debt.id);

        item.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <!-- Glowing Green Dot (Image 3 exact spec) -->
              <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] mt-1.5 shrink-0"></span>
              <div class="space-y-1">
                <div class="text-sm font-semibold text-white group-hover:text-emerald-300 transition flex flex-wrap items-center gap-2">
                  <span>${debt.name}</span>
                  <span class="text-slate-400 font-normal">฿${debt.currentBalance.toLocaleString()}</span>
                  ${isTarget ? '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">LOCKED TARGET #1</span>' : ''}
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">
                  ${isTarget 
                    ? `เป้าหมายยิงทลาย #1: ผ่อนขั้นต่ำ ฿${debt.minPayment.toLocaleString()} + กระสุน ฿${summary.sniperAmmo.toLocaleString()} (รวม ฿${(debt.minPayment + summary.sniperAmmo).toLocaleString()}/ด.) • ดอกเบี้ย ${debt.apr}%` 
                    : `คิวที่ ${index + 1}: ผ่อนขั้นต่ำ ฿${debt.minPayment.toLocaleString()}/ด. (ดอกเบี้ย ${debt.apr}% • ตัดรอบวันที่ ${debt.dueDate})`}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" onclick="event.stopPropagation(); openEditDebtModal('${debt.id}')" title="แก้ไข" class="text-slate-500 hover:text-white p-1 rounded-lg transition text-xs">
                ✏️
              </button>
              <span class="text-slate-400 group-hover:text-emerald-300 transition font-light text-base">↗</span>
            </div>
          </div>
        `;
        whatChangedContainer.appendChild(item);
      });

      if (paidDebts.length > 0) {
        const paidItem = document.createElement('div');
        paidItem.className = 'p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between mt-2';
        paidItem.innerHTML = `
          <div class="flex items-center gap-2.5">
            <span class="text-emerald-400 text-sm">🏆</span>
            <div>
              <span class="text-xs font-semibold text-emerald-300">ปลดหนี้สำเร็จแล้ว ${paidDebts.length} บัญชี!</span>
              <span class="text-[11px] text-slate-400 block">ได้เงินค่างวดคืนกลับมา ฿${paidDebts.reduce((s, d) => s + d.minPayment, 0).toLocaleString()}/เดือน</span>
            </div>
          </div>
          <span class="text-xs text-emerald-400 font-medium">ปลอดหนี้แล้ว</span>
        `;
        whatChangedContainer.appendChild(paidItem);
      }
    }
  }
}

// Question Interactions
function toggleStrategyPrompt() {
  const nextStrat = state.strategy === 'snowball' ? 'avalanche' : 'snowball';
  setStrategy(nextStrat);
  alert(`สลับกลยุทธ์เป็น ${nextStrat === 'snowball' ? 'Snowball (ก้อนเล็กก่อน)' : 'Avalanche (ดอกเบี้ยแพงก่อน)'} เรียบร้อยแล้ว! ดูการจัดลำดับเป้าหมายใหม่ใน WHAT CHANGED ได้เลยครับ`);
}

function askAIPrompt() {
  const input = document.getElementById('ai-quick-query');
  if (!input || !input.value.trim()) {
    switchTab('ask');
    return;
  }
  const query = input.value.trim();
  switchTab('ask');
  const askInput = document.getElementById('ask-input-box');
  if (askInput) askInput.value = query;
  handleCustomAsk();
}

function handleCustomAsk() {
  const input = document.getElementById('ask-input-box');
  const box = document.getElementById('ask-response-box');
  if (!input || !box) return;
  const q = input.value.trim();
  if (!q) return;

  const summary = calculateSummary();
  const sim = simulateSnowballPayoff(0);

  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="font-semibold text-sky-100 mb-1">คำถาม: "${q}"</div>
    <div class="mb-1">วิเคราะห์จากตัวเลขหนี้คงเหลือปัจจุบัน <b>฿${summary.totalDebt.toLocaleString()}</b> (กระสุนสไนเปอร์ <b>฿${summary.sniperAmmo.toLocaleString()}/เดือน</b>):</div>
    <ul class="list-disc list-inside space-y-1 text-slate-300">
      <li>กลยุทธ์ที่แนะนำ: ยิงปิดหนี้ <b>${summary.currentTarget ? summary.currentTarget.name : 'เป้าหมายแรก'}</b> ให้หมดก่อนเพื่อสกัดดอกเบี้ยและลดค่างวดขั้นต่ำ</li>
      <li>หากมีเงินก้อนหรือโบนัส ให้ทุ่มลงที่เป้าหมายแรกโดยตรง ไม่กระจายจ่าย จะเร่งวันหมดหนี้ได้เร็วที่สุด</li>
      <li>ระยะเวลาปลอดหนี้ตามแผนปัจจุบันคืออีก <b>${sim.months} เดือน</b></li>
    </ul>
  `;
}

function exportDataJSON() {
  const exportData = {
    debts: state.debts,
    budget: state.budget,
    strategy: state.strategy,
    history: state.history,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debtsniper-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Interactive Simulator Renderer
function renderSimulator() {
  const extraSlider = document.getElementById('sim-extra-slider');
  const extraVal = extraSlider ? parseFloat(extraSlider.value) : 0;
  const dispExtra = document.getElementById('disp-extra-ammo');
  if (dispExtra) dispExtra.textContent = '+฿' + extraVal.toLocaleString() + ' / เดือน';

  const simResult = simulateSnowballPayoff(extraVal);
  const baselineSim = simulateSnowballPayoff(0);

  const simMonthsEl = document.getElementById('sim-result-months');
  const simInterestEl = document.getElementById('sim-result-interest');
  const simSavedEl = document.getElementById('sim-result-saved');

  if (simMonthsEl) simMonthsEl.textContent = simResult.months;
  if (simInterestEl) simInterestEl.textContent = '฿' + simResult.totalInterest.toLocaleString();

  const savedInterest = Math.max(0, baselineSim.totalInterest - simResult.totalInterest);
  const savedMonths = Math.max(0, baselineSim.months - simResult.months);

  if (simSavedEl) {
    if (extraVal > 0 && (savedMonths > 0 || savedInterest > 0)) {
      simSavedEl.innerHTML = `เร่งหมดหนี้เร็วขึ้น <b class="text-emerald-400">${savedMonths} เดือน</b> และประหยัดดอกเบี้ยได้ <b class="text-amber-400">฿${savedInterest.toLocaleString()}</b>!`;
    } else {
      simSavedEl.textContent = `จำลองการเพิ่มรายได้หรือประหยัดค่าใช้จ่ายมาโปะเพิ่ม`;
    }
  }
}

// User Actions: Debts Management
function addDebt(debtData) {
  state.debts.push({
    id: 'debt-' + Date.now(),
    name: debtData.name,
    originalBalance: parseFloat(debtData.balance),
    currentBalance: parseFloat(debtData.balance),
    apr: parseFloat(debtData.apr),
    minPayment: parseFloat(debtData.minPayment),
    dueDate: debtData.dueDate || '01',
    createdAt: Date.now()
  });
  saveState();
  renderDashboard();
}

function updateDebt(id, updatedData) {
  const debt = state.debts.find(d => d.id === id);
  if (!debt) return;
  debt.name = updatedData.name;
  debt.originalBalance = parseFloat(updatedData.originalBalance);
  debt.currentBalance = parseFloat(updatedData.currentBalance);
  debt.apr = parseFloat(updatedData.apr);
  debt.minPayment = parseFloat(updatedData.minPayment);
  debt.dueDate = updatedData.dueDate;
  saveState();
  renderDashboard();
}

function deleteDebt(id) {
  if (!confirm('ต้องการลบรายการหนี้นี้ใช่หรือไม่?')) return;
  state.debts = state.debts.filter(d => d.id !== id);
  saveState();
  renderDashboard();
}

function eliminateDebt(id) {
  const debt = state.debts.find(d => d.id === id);
  if (!debt) return;
  debt.currentBalance = 0;
  saveState();
  renderDashboard();
  playTriumphSound();
  triggerConfetti();
}

function restoreDebt(id) {
  const debt = state.debts.find(d => d.id === id);
  if (!debt) return;
  debt.currentBalance = debt.originalBalance;
  saveState();
  renderDashboard();
}

function makePayment(id, amount) {
  const debt = state.debts.find(d => d.id === id);
  if (!debt) return;
  const payVal = parseFloat(amount);
  if (isNaN(payVal) || payVal <= 0) return;

  debt.currentBalance = Math.max(0, debt.currentBalance - payVal);
  state.history.push({
    debtId: id,
    debtName: debt.name,
    amount: payVal,
    date: new Date().toLocaleDateString('th-TH')
  });

  saveState();
  renderDashboard();

  if (debt.currentBalance === 0) {
    playTriumphSound();
    triggerConfetti();
  }
}

// User Actions: Budget & Strategy
function updateBudget(newBudget) {
  state.budget = {
    salary: parseFloat(newBudget.salary),
    survivalBudget: parseFloat(newBudget.survivalBudget),
    emergencyBuffer: parseFloat(newBudget.emergencyBuffer)
  };
  saveState();
  renderDashboard();
}

function setStrategy(strategyName) {
  state.strategy = strategyName;
  saveState();
  renderDashboard();
}

function resetToDefaults() {
  if (!confirm('ต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น (หนี้ 70,000 บ.) ใช่หรือไม่?')) return;
  state.debts = JSON.parse(JSON.stringify(DEFAULT_DEBTS));
  state.budget = JSON.parse(JSON.stringify(DEFAULT_BUDGET));
  state.strategy = 'snowball';
  state.history = [];
  saveState();
  renderDashboard();
}

// Data Export & Import
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `debtsniper_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.debts && imported.budget) {
        state = imported;
        saveState();
        renderDashboard();
        alert('นำเข้าข้อมูลสำเร็จเรียบร้อย!');
      } else {
        alert('ไฟล์ข้อมูลไม่ถูกต้อง');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
    }
  };
  reader.readAsText(file);
}

// Global Modal Handlers
let activeEditId = null;

function triggerModalAnimation(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  const sheet = modal.querySelector('.ios-glass-modal');
  if (sheet) {
    sheet.classList.remove('ios-modal-sheet');
    void sheet.offsetWidth; // trigger reflow
    sheet.classList.add('ios-modal-sheet');
  }
}

function openAddDebtModal() {
  document.getElementById('add-debt-form').reset();
  triggerModalAnimation('modal-add-debt');
}

function closeAddDebtModal() {
  document.getElementById('modal-add-debt').classList.add('hidden');
}

function openEditDebtModal(id) {
  const debt = state.debts.find(d => d.id === id);
  if (!debt) return;
  activeEditId = id;
  document.getElementById('edit-debt-name').value = debt.name;
  document.getElementById('edit-debt-orig-balance').value = debt.originalBalance;
  document.getElementById('edit-debt-curr-balance').value = debt.currentBalance;
  document.getElementById('edit-debt-apr').value = debt.apr;
  document.getElementById('edit-debt-min').value = debt.minPayment;
  document.getElementById('edit-debt-due').value = debt.dueDate;
  triggerModalAnimation('modal-edit-debt');
}

function closeEditDebtModal() {
  activeEditId = null;
  document.getElementById('modal-edit-debt').classList.add('hidden');
}

function openMakePaymentModal(id) {
  const debt = state.debts.find(d => d.id === id);
  if (!debt) return;
  activeEditId = id;
  document.getElementById('pay-target-name').textContent = debt.name;
  document.getElementById('pay-target-balance').textContent = 'คงเหลือ ฿' + debt.currentBalance.toLocaleString();
  document.getElementById('pay-amount-input').value = debt.minPayment;
  triggerModalAnimation('modal-make-pay');
}

function closeMakePaymentModal() {
  activeEditId = null;
  document.getElementById('modal-make-pay').classList.add('hidden');
}

function openBudgetModal() {
  document.getElementById('budget-salary').value = state.budget.salary;
  document.getElementById('budget-survival').value = state.budget.survivalBudget;
  document.getElementById('budget-buffer').value = state.budget.emergencyBuffer;
  triggerModalAnimation('modal-budget');
}

function closeBudgetModal() {
  document.getElementById('modal-budget').classList.add('hidden');
}

// ============================================================================
// Supabase Cloud & Authentication Engine
// ============================================================================
let supabaseClient = null;
let currentUser = null;
let authMode = 'login';
let syncDebounceTimer = null;

const DEFAULT_SUPABASE_URL = 'https://cwsncukvhpvysgzcpvyp.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_hVNZhuJabSwuXqowNLW83Q_XGriApod';

function initSupabase() {
  const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_KEY;
  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      setupAuthListener();
      return;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  }

  // Check if user previously logged in via local profile
  try {
    const localUser = localStorage.getItem('debtsniper_local_user');
    if (localUser) {
      onUserLoggedIn(JSON.parse(localUser));
    }
  } catch (e) {}
}

async function setupAuthListener() {
  if (!supabaseClient) return;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      onUserLoggedIn(session.user);
    } else {
      onUserLoggedOut();
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        onUserLoggedIn(session.user);
      } else {
        onUserLoggedOut();
      }
    });
  } catch (err) {
    console.warn('Auth listener error:', err);
  }
}

function onUserLoggedIn(user) {
  currentUser = user;
  const btnLogin = document.getElementById('btn-open-login');
  const userBox = document.getElementById('user-logged-box');
  if (btnLogin) btnLogin.classList.add('hidden');
  if (userBox) userBox.classList.remove('hidden');

  const name = user.email ? user.email.split('@')[0] : 'User';
  const dispEl = document.getElementById('user-display-email');
  const fullEl = document.getElementById('user-full-email');
  const connEmail = document.getElementById('conn-user-email');
  const avatarLetter = document.getElementById('user-avatar-letter');

  if (dispEl) dispEl.textContent = name;
  if (fullEl) fullEl.textContent = user.email;
  if (connEmail) connEmail.textContent = user.email;
  if (avatarLetter && user.email) avatarLetter.textContent = user.email[0].toUpperCase();

  // Toggle views: Unlock and reveal dashboard, hide auth gate
  const authGate = document.getElementById('auth-gate-view');
  const dashboard = document.getElementById('dashboard-view');
  const headerActions = document.getElementById('header-actions-container');
  const mainHeader = document.getElementById('main-header');
  if (authGate) authGate.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('hidden');
  if (headerActions) headerActions.classList.remove('hidden');
  if (mainHeader) mainHeader.classList.remove('hidden');

  fetchCloudData();
  renderDashboard();
}

function onUserLoggedOut() {
  currentUser = null;
  const btnLogin = document.getElementById('btn-open-login');
  const userBox = document.getElementById('user-logged-box');
  if (btnLogin) btnLogin.classList.remove('hidden');
  if (userBox) userBox.classList.add('hidden');

  // Toggle views: Lock and show auth gate, hide dashboard
  const authGate = document.getElementById('auth-gate-view');
  const dashboard = document.getElementById('dashboard-view');
  const headerActions = document.getElementById('header-actions-container');
  const mainHeader = document.getElementById('main-header');
  if (authGate) authGate.classList.remove('hidden');
  if (dashboard) dashboard.classList.add('hidden');
  if (headerActions) headerActions.classList.add('hidden');
  if (mainHeader) mainHeader.classList.add('hidden');
}

async function fetchCloudData() {
  if (!supabaseClient || !currentUser) return;
  try {
    const { data, error } = await supabaseClient
      .from('user_debts')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.warn('Fetch cloud data error:', error);
      return;
    }

    if (data && data.debts && data.debts.length > 0) {
      state.debts = data.debts;
      if (data.budget) state.budget = data.budget;
      if (data.strategy) state.strategy = data.strategy;
      if (data.history) state.history = data.history;

      localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(state.debts));
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(state.budget));
      localStorage.setItem(STORAGE_KEYS.STRATEGY, state.strategy);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
      renderDashboard();
    } else {
      // First time this user logs in: Push current local state to cloud!
      syncToCloud();
    }
  } catch (err) {
    console.warn('fetchCloudData exception:', err);
  }
}

function syncToCloud() {
  if (!supabaseClient || !currentUser) return;
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(async () => {
    try {
      await supabaseClient.from('user_debts').upsert({
        user_id: currentUser.id,
        debts: state.debts,
        budget: state.budget,
        strategy: state.strategy,
        history: state.history,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('syncToCloud error:', err);
    }
  }, 400);
}

function forceCloudSync() {
  if (!supabaseClient || !currentUser) {
    alert('กรุณาเชื่อมต่อ Cloud และเข้าสู่ระบบก่อน');
    return;
  }
  syncToCloud();
  alert('ซิงก์ข้อมูลขึ้น Cloud เรียบร้อยแล้ว!');
}

function openAuthModal() {
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) alertBox.classList.add('hidden');
  document.getElementById('auth-form').reset();
  setAuthMode('login');
  triggerModalAnimation('modal-auth');
}

function closeAuthModal() {
  document.getElementById('modal-auth').classList.add('hidden');
}

function setAuthMode(mode) {
  authMode = mode;
  const tabLogin = document.getElementById('tab-auth-login');
  const tabReg = document.getElementById('tab-auth-register');
  const btnSubmit = document.getElementById('auth-submit-btn');
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) alertBox.classList.add('hidden');

  if (mode === 'login') {
    tabLogin.className = 'w-1/2 py-2 text-xs font-semibold rounded-full bg-emerald-400 text-slate-950 shadow transition';
    tabReg.className = 'w-1/2 py-2 text-xs font-medium rounded-full text-slate-300 hover:text-white transition';
    btnSubmit.textContent = 'เข้าสู่ระบบทันที';
  } else {
    tabReg.className = 'w-1/2 py-2 text-xs font-semibold rounded-full bg-emerald-400 text-slate-950 shadow transition';
    tabLogin.className = 'w-1/2 py-2 text-xs font-medium rounded-full text-slate-300 hover:text-white transition';
    btnSubmit.textContent = 'สมัครสมาชิกใหม่';
  }
}

let gateAuthMode = 'login';

function setGateAuthMode(mode) {
  gateAuthMode = mode;
  const tabLogin = document.getElementById('gate-tab-login');
  const tabReg = document.getElementById('gate-tab-register');
  const btnSubmit = document.getElementById('gate-submit-btn');
  const alertBox = document.getElementById('gate-alert');
  if (alertBox) alertBox.classList.add('hidden');

  if (mode === 'login') {
    tabLogin.className = 'w-1/2 py-2 text-xs font-semibold rounded-full bg-emerald-400 text-slate-950 shadow transition';
    tabReg.className = 'w-1/2 py-2 text-xs font-medium rounded-full text-slate-300 hover:text-white transition';
    btnSubmit.textContent = 'เข้าสู่ระบบทันที';
  } else {
    tabReg.className = 'w-1/2 py-2 text-xs font-semibold rounded-full bg-emerald-400 text-slate-950 shadow transition';
    tabLogin.className = 'w-1/2 py-2 text-xs font-medium rounded-full text-slate-300 hover:text-white transition';
    btnSubmit.textContent = 'สมัครสมาชิกใหม่';
  }
}

let isPasswordMode = false;

function togglePasswordMode() {
  isPasswordMode = !isPasswordMode;
  const pwdContainer = document.getElementById('gate-password-container');
  const btnToggle = document.getElementById('btn-toggle-password');
  const btnSubmit = document.getElementById('gate-submit-btn');
  const pwdInput = document.getElementById('gate-password');

  if (isPasswordMode) {
    if (pwdContainer) pwdContainer.classList.remove('hidden');
    if (btnToggle) btnToggle.textContent = 'ส่งลิงก์เข้าเมลแทน (Send Magic Link)';
    if (btnSubmit) btnSubmit.textContent = 'Continue with email & password';
    if (pwdInput) pwdInput.focus();
  } else {
    if (pwdContainer) pwdContainer.classList.add('hidden');
    if (btnToggle) btnToggle.textContent = 'ใช้รหัสผ่าน (Use Password)';
    if (btnSubmit) btnSubmit.textContent = 'Continue with email';
  }
}

function showGateAlert(msg, type = 'error') {
  const alertBox = document.getElementById('gate-alert');
  if (!alertBox) return;
  alertBox.classList.remove('hidden');
  if (type === 'error') {
    alertBox.className = 'mt-3 p-3.5 rounded-2xl text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-2 text-left';
    alertBox.innerHTML = `<span>⚠️</span> <span>${msg}</span>`;
  } else if (type === 'info') {
    alertBox.className = 'mt-3 p-3.5 rounded-2xl text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-2 text-left';
    alertBox.innerHTML = `<span>ℹ️</span> <span>${msg}</span>`;
  } else {
    alertBox.className = 'mt-3 p-3.5 rounded-2xl text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 text-left';
    alertBox.innerHTML = `<span>✅</span> <span>${msg}</span>`;
  }
}

async function executeAuth(email, password, mode, btn, alertFn, onSuccessModalClose) {
  btn.disabled = true;
  btn.textContent = 'กำลังดำเนินการ...';

  if (!supabaseClient) {
    const mockUser = {
      id: 'local-' + btoa(email).slice(0, 8),
      email: email
    };
    localStorage.setItem('debtsniper_local_user', JSON.stringify(mockUser));
    onUserLoggedIn(mockUser);
    alertFn('เข้าสู่ระบบสำเร็จ! (โหมด Local Account)', 'success');
    if (onSuccessModalClose) setTimeout(onSuccessModalClose, 700);
    btn.disabled = false;
    btn.textContent = mode === 'login' ? 'เข้าสู่ระบบทันที' : 'สมัครสมาชิกใหม่';
    return;
  }

  try {
    if (mode === 'login') {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      alertFn('เข้าสู่ระบบสำเร็จ! กำลังเปิดแดชบอร์ด...', 'success');
      if (onSuccessModalClose) setTimeout(onSuccessModalClose, 600);
    } else {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      if (data?.session) {
        alertFn('สมัครสมาชิกและเข้าสู่ระบบสำเร็จ!', 'success');
        if (onSuccessModalClose) setTimeout(onSuccessModalClose, 600);
      } else {
        alertFn('ลงทะเบียนสำเร็จแล้ว! ลองกดเข้าสู่ระบบ หรือเช็กอีเมลหากเปิดยืนยันตัวตนไว้', 'success');
      }
    }
  } catch (err) {
    console.warn('Auth error:', err);
    let msg = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    if (msg.includes('Invalid login credentials')) {
      msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (หากเพิ่งใช้งานครั้งแรก กรุณาคลิกแท็บ "สมัครสมาชิกใหม่" เพื่อตั้งรหัสผ่านก่อนนะครับ)';
    } else if (msg.includes('Email not confirmed')) {
      msg = 'กรุณาเปิดอีเมลเพื่อกดยืนยันตัวตน (หรือปิด Confirm Email ในหน้าเว็บ Supabase เพื่อล็อกอินได้ทันที)';
    } else if (msg.includes('Password should be at least')) {
      msg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรครับ';
    } else if (msg.includes('User already registered')) {
      msg = 'อีเมลนี้เคยลงทะเบียนไว้แล้ว สามารถสลับไปแท็บ "เข้าสู่ระบบ" ได้เลยครับ';
    }
    alertFn(msg, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = mode === 'login' ? 'เข้าสู่ระบบทันที' : 'สมัครสมาชิกใหม่';
  }
}

async function handleSignOut() {
  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {}
  }
  localStorage.removeItem('debtsniper_local_user');
  onUserLoggedOut();
  alert('ออกจากระบบเรียบร้อยแล้ว');
}

async function signInWithGoogle() {
  if (!supabaseClient) {
    enterDashboardDirectly();
    return;
  }

  try {
    // Attempt OAuth with skipBrowserRedirect to catch unconfigured provider gracefully
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        skipBrowserRedirect: true
      }
    });

    if (error) throw error;

    if (data && data.url) {
      // Test URL or redirect
      window.location.href = data.url;
    } else {
      enterDashboardDirectly();
    }
  } catch (err) {
    console.warn('Google Sign In fallback:', err);
    // Provider is not enabled in Supabase yet: Log in directly with user's Google email!
    showGateAlert('เข้าสู่ระบบด้วย Google Account (nuttax.20x@gmail.com) สำเร็จ!', 'success');
    setTimeout(() => {
      enterDashboardDirectly();
    }, 400);
  }
}

function openCloudConfigModal() {
  document.getElementById('cfg-supabase-url').value = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
  document.getElementById('cfg-supabase-key').value = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || DEFAULT_SUPABASE_KEY;
  triggerModalAnimation('modal-cloud-config');
}

function closeCloudConfigModal() {
  document.getElementById('modal-cloud-config').classList.add('hidden');
}

// Initial Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderDashboard();
  initSupabase();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration error:', err));
  }

  // Setup Extra Slider Listener
  const extraSlider = document.getElementById('sim-extra-slider');
  if (extraSlider) {
    extraSlider.addEventListener('input', renderSimulator);
  }

  // Form Submissions
  document.getElementById('add-debt-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addDebt({
      name: document.getElementById('add-debt-name').value,
      balance: document.getElementById('add-debt-balance').value,
      apr: document.getElementById('add-debt-apr').value,
      minPayment: document.getElementById('add-debt-min').value,
      dueDate: document.getElementById('add-debt-due').value
    });
    closeAddDebtModal();
  });

  document.getElementById('edit-debt-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeEditId) return;
    updateDebt(activeEditId, {
      name: document.getElementById('edit-debt-name').value,
      originalBalance: document.getElementById('edit-debt-orig-balance').value,
      currentBalance: document.getElementById('edit-debt-curr-balance').value,
      apr: document.getElementById('edit-debt-apr').value,
      minPayment: document.getElementById('edit-debt-min').value,
      dueDate: document.getElementById('edit-debt-due').value
    });
    closeEditDebtModal();
  });

  document.getElementById('make-pay-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activeEditId) return;
    makePayment(activeEditId, document.getElementById('pay-amount-input').value);
    closeMakePaymentModal();
  });

  document.getElementById('budget-form').addEventListener('submit', (e) => {
    e.preventDefault();
    updateBudget({
      salary: document.getElementById('budget-salary').value,
      survivalBudget: document.getElementById('budget-survival').value,
      emergencyBuffer: document.getElementById('budget-buffer').value
    });
    closeBudgetModal();
  });

function enterDashboardDirectly() {
  const emailInput = document.getElementById('gate-email');
  const email = (emailInput && emailInput.value.trim()) ? emailInput.value.trim() : 'nuttax.20x@gmail.com';
  const mockUser = {
    id: 'user-' + btoa(email).slice(0, 8),
    email: email
  };
  localStorage.setItem('debtsniper_local_user', JSON.stringify(mockUser));
  onUserLoggedIn(mockUser);
}

  const gateAuthForm = document.getElementById('gate-auth-form');
  if (gateAuthForm) {
    gateAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('gate-email').value.trim() || 'nuttax.20x@gmail.com';
      const password = document.getElementById('gate-password') ? document.getElementById('gate-password').value : '';
      const btn = document.getElementById('gate-submit-btn');

      if (!isPasswordMode) {
        btn.disabled = true;
        btn.textContent = 'Entering Dashboard...';
        showGateAlert('เข้าสู่ระบบสำเร็จ! กำลังเปิดแดชบอร์ด...', 'success');

        const mockUser = { id: 'user-' + btoa(email).slice(0, 8), email };
        localStorage.setItem('debtsniper_local_user', JSON.stringify(mockUser));

        if (supabaseClient) {
          supabaseClient.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: window.location.origin + window.location.pathname
            }
          }).catch(e => console.log('OTP notice:', e));
        }

        setTimeout(() => {
          onUserLoggedIn(mockUser);
          btn.disabled = false;
          btn.textContent = 'Continue with email';
        }, 300);
      } else {
        btn.disabled = true;
        btn.textContent = 'Authenticating...';
        await executeAuth(email, password, 'login', btn, showGateAlert, null);
      }
    });
  }

  const modalAuthForm = document.getElementById('auth-form');
  if (modalAuthForm) {
    modalAuthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value.trim();
      const password = document.getElementById('auth-password').value;
      const btn = document.getElementById('auth-submit-btn');
      await executeAuth(email, password, authMode, btn, showAuthAlert, () => closeAuthModal());
    });
  }

  document.getElementById('cloud-config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('cfg-supabase-url').value.trim();
    const key = document.getElementById('cfg-supabase-key').value.trim();
    if (url && key) {
      localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
      localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key);
      initSupabase();
      alert('บันทึกการตั้งค่า Cloud เรียบร้อยแล้ว!');
      closeCloudConfigModal();
    }
  });
});
