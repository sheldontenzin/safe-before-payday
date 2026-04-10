const STORAGE_KEY = "payday-safe-spend";
const EXPENSES_STORAGE_KEY = "payday-safe-spend-purchases";
const RING_CIRCUMFERENCE = 2 * Math.PI * 46;

const budgetForm = document.getElementById("budget-form");
const expenseForm = document.getElementById("expense-form");
const clearDataButton = document.getElementById("clear-data-button");
const clearHistoryButton = document.getElementById("clear-history-button");
const plannerTab = document.getElementById("planner-tab");
const trackerTab = document.getElementById("tracker-tab");
const plannerScreen = document.getElementById("planner-screen");
const trackerScreen = document.getElementById("tracker-screen");

const paydayInput = document.getElementById("payday");
const periodBudgetInput = document.getElementById("period-budget");
const needBudgetInput = document.getElementById("need-budget");
const wantBudgetInput = document.getElementById("want-budget");
const expenseAmountInput = document.getElementById("expense-amount");
const expenseNoteInput = document.getElementById("expense-note");

const budgetMatchNote = document.getElementById("budget-match-note");
const progressRingFill = document.getElementById("progress-ring-fill");
const progressPercent = document.getElementById("progress-percent");
const progressCenterAmount = document.getElementById("progress-center-amount");
const dashboardCopy = document.getElementById("dashboard-copy");
const totalBudgetOutput = document.getElementById("total-budget");
const totalUsedOutput = document.getElementById("total-used");
const totalLeftOutput = document.getElementById("total-left");
const daysLeftOutput = document.getElementById("days-left");
const needBudgetTotalOutput = document.getElementById("need-budget-total");
const needUsedOutput = document.getElementById("need-used");
const needLeftOutput = document.getElementById("need-left");
const wantBudgetTotalOutput = document.getElementById("want-budget-total");
const wantUsedOutput = document.getElementById("want-used");
const wantLeftOutput = document.getElementById("want-left");
const needCard = document.getElementById("need-card");
const wantCard = document.getElementById("want-card");
const trackerTotalLeftOutput = document.getElementById("tracker-total-left");
const trackerSummaryNote = document.getElementById("tracker-summary-note");
const expensePreview = document.getElementById("expense-preview");
const needTotalOutput = document.getElementById("need-total");
const wantTotalOutput = document.getElementById("want-total");
const expenseHistoryList = document.getElementById("expense-history-list");

let currentPlan = null;
let savedExpenses = [];

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function clampToCurrency(value) {
  return Math.round(value * 100) / 100;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getDaysUntilPayday(paydayValue) {
  if (!paydayValue) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const payday = new Date(`${paydayValue}T00:00:00`);
  payday.setHours(0, 0, 0, 0);

  const difference = payday.getTime() - today.getTime();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.ceil(difference / millisecondsPerDay));
}

function normalizeExpenseType(type) {
  if (type === "Need to buy") {
    return "Need";
  }

  if (type === "Nice to buy") {
    return "Want";
  }

  return type === "Need" ? "Need" : "Want";
}

function getPlanFormData() {
  return {
    nextPaycheckDate: paydayInput.value,
    periodBudget: Number.parseFloat(periodBudgetInput.value) || 0,
    needBudget: Number.parseFloat(needBudgetInput.value) || 0,
    wantBudget: Number.parseFloat(wantBudgetInput.value) || 0,
  };
}

function getExpenseFormData() {
  const checked = document.querySelector('input[name="expenseType"]:checked');

  return {
    amount: Number.parseFloat(expenseAmountInput.value) || 0,
    type: checked ? checked.value : "",
    note: expenseNoteInput.value.trim(),
  };
}

function loadPlan() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if ("periodBudget" in parsed || "needBudget" in parsed || "wantBudget" in parsed) {
      return {
        nextPaycheckDate: parsed.nextPaycheckDate ?? "",
        periodBudget: Number(parsed.periodBudget) || 0,
        needBudget: Number(parsed.needBudget) || 0,
        wantBudget: Number(parsed.wantBudget) || 0,
      };
    }

    return null;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function savePlan(plan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function loadExpenses() {
  const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((expense) => ({
      id: expense.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount: clampToCurrency(Number(expense.amount) || 0),
      type: normalizeExpenseType(expense.type),
      note: typeof expense.note === "string" ? expense.note : "",
    }));
  } catch (error) {
    localStorage.removeItem(EXPENSES_STORAGE_KEY);
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(savedExpenses));
}

function fillPlanForm(plan) {
  paydayInput.value = plan.nextPaycheckDate ?? "";
  periodBudgetInput.value = plan.periodBudget ?? "";
  needBudgetInput.value = plan.needBudget ?? "";
  wantBudgetInput.value = plan.wantBudget ?? "";
}

function computeBudgetState(plan, expenses) {
  const safePlan = plan ?? {
    nextPaycheckDate: "",
    periodBudget: 0,
    needBudget: 0,
    wantBudget: 0,
  };

  const totalUsed = clampToCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0));
  const needUsed = clampToCurrency(
    expenses
      .filter((expense) => expense.type === "Need")
      .reduce((sum, expense) => sum + expense.amount, 0)
  );
  const wantUsed = clampToCurrency(
    expenses
      .filter((expense) => expense.type === "Want")
      .reduce((sum, expense) => sum + expense.amount, 0)
  );

  const totalLeft = clampToCurrency(safePlan.periodBudget - totalUsed);
  const needLeft = clampToCurrency(safePlan.needBudget - needUsed);
  const wantLeft = clampToCurrency(safePlan.wantBudget - wantUsed);
  const daysUntilPayday = getDaysUntilPayday(safePlan.nextPaycheckDate);
  const budgetDifference = clampToCurrency(
    safePlan.needBudget + safePlan.wantBudget - safePlan.periodBudget
  );

  const rawProgress = safePlan.periodBudget > 0 ? totalUsed / safePlan.periodBudget : 0;
  const progressRatio = Math.max(0, Math.min(rawProgress, 1));
  const progressPercentValue = Math.round(progressRatio * 100);

  return {
    ...safePlan,
    totalUsed,
    totalLeft,
    needUsed,
    needLeft,
    wantUsed,
    wantLeft,
    daysUntilPayday,
    budgetDifference,
    progressRatio,
    progressPercentValue,
  };
}

function renderBudgetMatchNote(plan) {
  const budgetDifference = clampToCurrency(plan.needBudget + plan.wantBudget - plan.periodBudget);
  budgetMatchNote.className = "inline-note";

  if (plan.periodBudget === 0 && plan.needBudget === 0 && plan.wantBudget === 0) {
    budgetMatchNote.textContent =
      "Your need and want budgets should add up to your total period budget.";
    return;
  }

  if (budgetDifference === 0) {
    budgetMatchNote.classList.add("good");
    budgetMatchNote.textContent = "Nice. Your need and want budgets match your total period budget.";
    return;
  }

  if (budgetDifference < 0) {
    budgetMatchNote.classList.add("warning");
    budgetMatchNote.textContent = `Your need and want budgets are ${formatMoney(
      Math.abs(budgetDifference)
    )} under your total budget.`;
    return;
  }

  budgetMatchNote.classList.add("warning");
  budgetMatchNote.textContent = `Your need and want budgets are ${formatMoney(
    budgetDifference
  )} over your total budget.`;
}

function renderProgressRing(state) {
  progressRingFill.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  progressRingFill.style.strokeDashoffset = String(
    RING_CIRCUMFERENCE - state.progressRatio * RING_CIRCUMFERENCE
  );
  progressPercent.textContent = `${state.progressPercentValue}%`;

  if (state.periodBudget === 0) {
    progressCenterAmount.textContent = "$0 left";
    return;
  }

  if (state.totalLeft >= 0) {
    progressCenterAmount.textContent = `${formatMoney(state.totalLeft)} left`;
    return;
  }

  progressCenterAmount.textContent = `${formatMoney(Math.abs(state.totalLeft))} over`;
}

function renderDashboard(state) {
  renderProgressRing(state);

  totalBudgetOutput.textContent = formatMoney(state.periodBudget);
  totalUsedOutput.textContent = formatMoney(state.totalUsed);
  totalLeftOutput.textContent = formatMoney(state.totalLeft);
  daysLeftOutput.textContent = String(state.daysUntilPayday);
  needBudgetTotalOutput.textContent = formatMoney(state.needBudget);
  needUsedOutput.textContent = formatMoney(state.needUsed);
  needLeftOutput.textContent = formatMoney(state.needLeft);
  wantBudgetTotalOutput.textContent = formatMoney(state.wantBudget);
  wantUsedOutput.textContent = formatMoney(state.wantUsed);
  wantLeftOutput.textContent = formatMoney(state.wantLeft);
  trackerTotalLeftOutput.textContent = formatMoney(state.totalLeft);

  needCard.classList.toggle("over-budget", state.needLeft < 0);
  wantCard.classList.toggle("over-budget", state.wantLeft < 0);
  totalLeftOutput.classList.toggle("negative", state.totalLeft < 0);

  if (state.periodBudget === 0) {
    dashboardCopy.textContent = "Set your budget below to start tracking this pay period.";
    trackerSummaryNote.textContent =
      "Save your budget on the Plan tab to see how much is left before payday.";
    return;
  }

  if (state.totalLeft >= 0) {
    dashboardCopy.textContent = `You have ${formatMoney(
      state.totalLeft
    )} left in this period budget before payday.`;
  } else {
    dashboardCopy.textContent = `You are ${formatMoney(
      Math.abs(state.totalLeft)
    )} over this period budget before payday.`;
  }

  if (state.daysUntilPayday === 0) {
    trackerSummaryNote.textContent = "Your payday is today.";
  } else if (state.daysUntilPayday === 1) {
    trackerSummaryNote.textContent = "You have 1 day until payday.";
  } else {
    trackerSummaryNote.textContent = `You have ${state.daysUntilPayday} days until payday.`;
  }
}

function renderExpensePreview(state) {
  const expense = getExpenseFormData();
  expensePreview.className = "expense-preview";

  if (state.periodBudget === 0) {
    expensePreview.textContent = "Save your budget first, then add expenses here.";
    return;
  }

  if (!expense.type || expense.amount <= 0) {
    expensePreview.textContent = "Enter an amount to see how it would affect this pay period.";
    return;
  }

  const nextTotalLeft = clampToCurrency(state.totalLeft - expense.amount);
  const currentBucketLeft = expense.type === "Need" ? state.needLeft : state.wantLeft;
  const nextBucketLeft = clampToCurrency(currentBucketLeft - expense.amount);

  if (nextBucketLeft >= 0 && nextTotalLeft >= 0) {
    expensePreview.classList.add("safe");
    expensePreview.textContent = `After this ${expense.type.toLowerCase()} expense, you would have ${formatMoney(
      nextBucketLeft
    )} left in ${expense.type.toLowerCase()} and ${formatMoney(
      nextTotalLeft
    )} left before payday.`;
    return;
  }

  expensePreview.classList.add("warning");

  if (nextBucketLeft < 0 && nextTotalLeft < 0) {
    expensePreview.textContent = `This would put your ${expense.type.toLowerCase()} budget ${formatMoney(
      Math.abs(nextBucketLeft)
    )} over and your total period budget ${formatMoney(
      Math.abs(nextTotalLeft)
    )} over.`;
    return;
  }

  if (nextBucketLeft < 0) {
    expensePreview.textContent = `This would put your ${expense.type.toLowerCase()} budget ${formatMoney(
      Math.abs(nextBucketLeft)
    )} over.`;
    return;
  }

  expensePreview.textContent = `This would put your total period budget ${formatMoney(
    Math.abs(nextTotalLeft)
  )} over before payday.`;
}

function renderExpenseHistory() {
  const needSpent = clampToCurrency(
    savedExpenses
      .filter((expense) => expense.type === "Need")
      .reduce((sum, expense) => sum + expense.amount, 0)
  );
  const wantSpent = clampToCurrency(
    savedExpenses
      .filter((expense) => expense.type === "Want")
      .reduce((sum, expense) => sum + expense.amount, 0)
  );

  needTotalOutput.textContent = formatMoney(needSpent);
  wantTotalOutput.textContent = formatMoney(wantSpent);

  if (savedExpenses.length === 0) {
    expenseHistoryList.innerHTML = '<li class="history-empty">No expenses yet.</li>';
    return;
  }

  expenseHistoryList.innerHTML = savedExpenses
    .map(
      (expense) => `
        <li class="history-item">
          <div class="history-main">
            <div>
              <p class="history-amount">${formatMoney(expense.amount)}</p>
              <p class="history-type">${expense.type}</p>
              ${expense.note ? `<p class="history-note">${escapeHtml(expense.note)}</p>` : ""}
            </div>
          </div>
          <button class="history-delete" type="button" data-id="${expense.id}">
            Delete
          </button>
        </li>
      `
    )
    .join("");
}

function renderAll() {
  const state = computeBudgetState(currentPlan, savedExpenses);
  renderBudgetMatchNote(currentPlan ?? getPlanFormData());
  renderDashboard(state);
  renderExpensePreview(state);
  renderExpenseHistory();
}

function addExpense() {
  const expense = getExpenseFormData();

  if (!expense.type || expense.amount <= 0) {
    return;
  }

  savedExpenses.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: clampToCurrency(expense.amount),
    type: expense.type,
    note: expense.note,
  });

  saveExpenses();
}

function deleteExpense(id) {
  savedExpenses = savedExpenses.filter((expense) => expense.id !== id);
  saveExpenses();
}

function showView(viewName) {
  const plannerIsActive = viewName === "planner";

  plannerTab.classList.toggle("active", plannerIsActive);
  trackerTab.classList.toggle("active", !plannerIsActive);
  plannerScreen.classList.toggle("active", plannerIsActive);
  trackerScreen.classList.toggle("active", !plannerIsActive);
}

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();

  currentPlan = getPlanFormData();
  savePlan(currentPlan);
  renderAll();
});

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!expenseForm.reportValidity()) {
    return;
  }

  addExpense();
  expenseForm.reset();
  renderAll();
});

periodBudgetInput.addEventListener("input", renderAll);
needBudgetInput.addEventListener("input", renderAll);
wantBudgetInput.addEventListener("input", renderAll);
paydayInput.addEventListener("input", renderAll);
expenseAmountInput.addEventListener("input", renderAll);
expenseNoteInput.addEventListener("input", renderAll);
expenseForm.addEventListener("change", renderAll);

clearDataButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  budgetForm.reset();
  currentPlan = null;
  renderAll();
  showView("planner");
});

clearHistoryButton.addEventListener("click", () => {
  savedExpenses = [];
  localStorage.removeItem(EXPENSES_STORAGE_KEY);
  renderAll();
});

expenseHistoryList.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const expenseId = target.getAttribute("data-id");

  if (target.classList.contains("history-delete") && expenseId) {
    deleteExpense(expenseId);
    renderAll();
  }
});

plannerTab.addEventListener("click", () => {
  showView("planner");
});

trackerTab.addEventListener("click", () => {
  showView("tracker");
});

currentPlan = loadPlan();
savedExpenses = loadExpenses();

if (currentPlan) {
  fillPlanForm(currentPlan);
}

renderAll();
