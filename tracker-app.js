const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "monthly-money-tracker-v1";
const ENCOURAGING_MESSAGES = [
  "You're doing okay 🌿",
  "Let's take a look together",
  "One step at a time",
];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

function getCurrentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "";
  }

  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isInCurrentMonth(dateValue, monthKey = getCurrentMonthKey()) {
  return typeof dateValue === "string" && dateValue.startsWith(monthKey);
}

function clampMoney(value) {
  return Math.round(value * 100) / 100;
}

function loadState() {
  const fallback = {
    estimatedMonthlyIncome: "",
    incomeEntries: [],
    fixedExpenses: [],
    extraExpenses: [],
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return {
      estimatedMonthlyIncome: parsed?.estimatedMonthlyIncome ?? "",
      incomeEntries: Array.isArray(parsed?.incomeEntries) ? parsed.incomeEntries : [],
      fixedExpenses: Array.isArray(parsed?.fixedExpenses) ? parsed.fixedExpenses : [],
      extraExpenses: Array.isArray(parsed?.extraExpenses) ? parsed.extraExpenses : [],
    };
  } catch (error) {
    return fallback;
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Keep the app usable even if storage is unavailable.
  }
}

function WalletIcon() {
  return (
    <svg
      className="wallet-icon"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M48 79C31 70.6 20 60.4 20 46.3C20 36.9 27.1 30 36.2 30C41.8 30 46.1 32.4 48 36.2C49.9 32.4 54.2 30 59.8 30C68.9 30 76 36.9 76 46.3C76 60.4 65 70.6 48 79Z"
        fill="#A8C9A5"
      />
      <rect x="19" y="38" width="58" height="35" rx="14" fill="#7FAF8F" />
      <rect x="27" y="46" width="42" height="19" rx="9.5" fill="#E8EFE6" />
      <circle cx="68" cy="31" r="8" fill="#F2C6A0" />
      <circle cx="58" cy="23" r="6" fill="#E7A977" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <p className="empty-title">Let's add your first income 🌼</p>
      <p className="empty-copy">Start with one number. We can do the rest together.</p>
    </div>
  );
}

function App() {
  const [trackerState, setTrackerState] = useState(loadState);
  const [messageIndex, setMessageIndex] = useState(0);
  const [incomeForm, setIncomeForm] = useState({ amount: "", date: getTodayValue() });
  const [billForm, setBillForm] = useState({ name: "", amount: "", day: "" });
  const [spendingForm, setSpendingForm] = useState({
    amount: "",
    note: "",
    date: getTodayValue(),
  });

  useEffect(() => {
    saveState(trackerState);
  }, [trackerState]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % ENCOURAGING_MESSAGES.length);
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentMonthKey = getCurrentMonthKey();
  const incomeThisMonth = trackerState.incomeEntries.filter((entry) =>
    isInCurrentMonth(entry.date, currentMonthKey)
  );
  const spendingThisMonth = trackerState.extraExpenses.filter((entry) =>
    isInCurrentMonth(entry.date, currentMonthKey)
  );

  const totals = useMemo(() => {
    const totalIncome = clampMoney(
      incomeThisMonth.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const totalBills = clampMoney(
      trackerState.fixedExpenses.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
    );
    const totalExtra = clampMoney(
      spendingThisMonth.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const totalSpent = clampMoney(totalBills + totalExtra);
    const remaining = clampMoney(totalIncome - totalSpent);

    return { totalIncome, totalBills, totalExtra, totalSpent, remaining };
  }, [incomeThisMonth, spendingThisMonth, trackerState.fixedExpenses]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return [...trackerState.fixedExpenses]
      .map((bill) => {
        const rawDay = Math.max(1, Math.min(31, Number(bill.day) || 1));
        let dueDate = new Date(currentYear, currentMonth, rawDay);

        if (dueDate < new Date(currentYear, currentMonth, today.getDate())) {
          dueDate = new Date(currentYear, currentMonth + 1, rawDay);
        }

        return {
          ...bill,
          dueDate,
          dateLabel: dueDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
        };
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [trackerState.fixedExpenses]);

  const recentIncome = [...incomeThisMonth].sort((a, b) => (a.date < b.date ? 1 : -1));
  const allIncomeEntries = [...trackerState.incomeEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recentSpending = [...spendingThisMonth].sort((a, b) => (a.date < b.date ? 1 : -1));

  function updateEstimatedIncome(value) {
    setTrackerState((current) => ({
      ...current,
      estimatedMonthlyIncome: value,
    }));
  }

  function addIncome(event) {
    event.preventDefault();
    const amount = Number(incomeForm.amount);

    if (!amount || amount <= 0) {
      return;
    }

    setTrackerState((current) => ({
      ...current,
      incomeEntries: [
        {
          id: createId("income"),
          amount,
          date: incomeForm.date || getTodayValue(),
        },
        ...current.incomeEntries,
      ],
    }));

    setIncomeForm({ amount: "", date: getTodayValue() });
  }

  function addBill(event) {
    event.preventDefault();
    const amount = Number(billForm.amount);
    const day = Number(billForm.day);

    if (!billForm.name.trim() || !amount || amount <= 0 || !day || day < 1 || day > 31) {
      return;
    }

    setTrackerState((current) => ({
      ...current,
      fixedExpenses: [
        ...current.fixedExpenses,
        {
          id: createId("bill"),
          name: billForm.name.trim(),
          amount,
          day,
        },
      ],
    }));

    setBillForm({ name: "", amount: "", day: "" });
  }

  function addSpending(event) {
    event.preventDefault();
    const amount = Number(spendingForm.amount);

    if (!amount || amount <= 0) {
      return;
    }

    setTrackerState((current) => ({
      ...current,
      extraExpenses: [
        {
          id: createId("spend"),
          amount,
          note: spendingForm.note.trim(),
          date: spendingForm.date || getTodayValue(),
        },
        ...current.extraExpenses,
      ],
    }));

    setSpendingForm({ amount: "", note: "", date: getTodayValue() });
  }

  function removeEntry(collectionKey, entryId) {
    setTrackerState((current) => ({
      ...current,
      [collectionKey]: current[collectionKey].filter((entry) => entry.id !== entryId),
    }));
  }

  function getSupportMessage() {
    if (totals.totalIncome === 0) {
      return "Let's add your first income 🌼";
    }

    if (totals.remaining < 0) {
      return "You're a little over this month. That happens. We can adjust next time.";
    }

    if (totals.remaining <= Math.max(150, totals.totalIncome * 0.2)) {
      return "Things are a little tight right now. Try to keep spending small for a few days.";
    }

    return "You still have some room this month. Small steps are enough.";
  }

  return (
    <main className="money-app">
      <div className="app-stack">
        <section className="hero-card">
          <div className="hero-row">
            <div>
              <p className="hero-label">Monthly money tracker</p>
              <h1>{ENCOURAGING_MESSAGES[messageIndex]}</h1>
            </div>
            <WalletIcon />
          </div>

          <p className="hero-copy">Money in. Money out. A simple look at what is left.</p>
        </section>

        {totals.totalIncome === 0 ? (
          <EmptyState />
        ) : (
          <section className="main-card">
            <p className="main-label">Money left this month</p>
            <p className="main-value">{formatCurrency(totals.remaining)}</p>
            <p className="soft-note">{getSupportMessage()}</p>

            <div className="main-summary">
              <div className="summary-pill">
                <span>Income</span>
                <strong>{formatCurrency(totals.totalIncome)}</strong>
              </div>
              <div className="summary-pill">
                <span>Spent</span>
                <strong>{formatCurrency(totals.totalSpent)}</strong>
              </div>
            </div>

            <div className="sub-summary">
              <div className="sub-card">
                <p>Bills total</p>
                <strong>{formatCurrency(totals.totalBills)}</strong>
              </div>
              <div className="sub-card">
                <p>Other spending</p>
                <strong>{formatCurrency(totals.totalExtra)}</strong>
              </div>
            </div>
          </section>
        )}

        <section className="card">
          <div className="section-head">
            <div>
              <p className="section-label">This month</p>
              <h2>Money left</h2>
            </div>
            <label className="mini-field">
              <span>Monthly income (estimate)</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="Optional"
                value={trackerState.estimatedMonthlyIncome}
                onChange={(event) => updateEstimatedIncome(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card" id="income-form">
          <div className="section-head">
            <div>
              <p className="section-label">Money in</p>
              <h2>Add money</h2>
            </div>
            <div className="section-total">{formatCurrency(totals.totalIncome)}</div>
          </div>

          <form className="entry-form" onSubmit={addIncome}>
            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={incomeForm.amount}
                onChange={(event) =>
                  setIncomeForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={incomeForm.date}
                onChange={(event) =>
                  setIncomeForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </label>

            <button className="primary-button" type="submit">
              Add money
            </button>
          </form>

          <div className="list-block">
            <p className="list-title">All money added</p>
            <p className="list-help">
              This month's total is at the top. Every income entry stays in this list.
            </p>
            {allIncomeEntries.length === 0 ? (
              <p className="list-empty">Let's add your first income 🌼</p>
            ) : (
              <ul className="entry-list">
                {allIncomeEntries.map((entry) => (
                  <li key={entry.id} className="entry-row">
                    <div>
                      <p className="entry-main">{formatCurrency(entry.amount)}</p>
                      <p className="entry-meta">
                        {formatDateLabel(entry.date)}
                        {isInCurrentMonth(entry.date, currentMonthKey) ? " — This month" : ""}
                      </p>
                    </div>
                    <button
                      className="ghost-inline"
                      type="button"
                      onClick={() => removeEntry("incomeEntries", entry.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="section-label">Bills</p>
              <h2>Bills coming up</h2>
            </div>
            <div className="section-total">{formatCurrency(totals.totalBills)}</div>
          </div>

          <form className="entry-form bill-form" onSubmit={addBill}>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                placeholder="Rent"
                value={billForm.name}
                onChange={(event) =>
                  setBillForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={billForm.amount}
                onChange={(event) =>
                  setBillForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Day</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                placeholder="1"
                value={billForm.day}
                onChange={(event) =>
                  setBillForm((current) => ({ ...current, day: event.target.value }))
                }
              />
            </label>

            <button className="soft-button" type="submit">
              Save bill
            </button>
          </form>

          {upcomingBills.length === 0 ? (
            <p className="list-empty">No bills yet. Add one when you're ready.</p>
          ) : (
            <ul className="entry-list bills-list">
              {upcomingBills.map((bill) => (
                <li key={bill.id} className="entry-row">
                  <div>
                    <p className="entry-main">{bill.name}</p>
                    <p className="entry-meta">
                      {formatCurrency(bill.amount)} — {bill.dateLabel}
                    </p>
                  </div>
                  <button
                    className="ghost-inline"
                    type="button"
                    onClick={() => removeEntry("fixedExpenses", bill.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" id="spending-form">
          <div className="section-head">
            <div>
              <p className="section-label">Money out</p>
              <h2>Add spending</h2>
            </div>
            <div className="section-total">{formatCurrency(totals.totalExtra)}</div>
          </div>

          <form className="entry-form" onSubmit={addSpending}>
            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={spendingForm.amount}
                onChange={(event) =>
                  setSpendingForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Note</span>
              <input
                type="text"
                placeholder="Groceries"
                value={spendingForm.note}
                onChange={(event) =>
                  setSpendingForm((current) => ({ ...current, note: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={spendingForm.date}
                onChange={(event) =>
                  setSpendingForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </label>

            <button className="primary-button" type="submit">
              Add spending
            </button>
          </form>

          {recentSpending.length === 0 ? (
            <p className="list-empty">No spending added yet.</p>
          ) : (
            <ul className="entry-list">
              {recentSpending.map((entry) => (
                <li key={entry.id} className="entry-row">
                  <div>
                    <p className="entry-main">{formatCurrency(entry.amount)}</p>
                    <p className="entry-meta">
                      {entry.note ? `${entry.note} — ` : ""}
                      {formatDateLabel(entry.date)}
                    </p>
                  </div>
                  <button
                    className="ghost-inline"
                    type="button"
                    onClick={() => removeEntry("extraExpenses", entry.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="bottom-actions">
          <a className="bottom-button primary" href="#income-form">
            Add money
          </a>
          <a className="bottom-button secondary" href="#spending-form">
            Add spending
          </a>
        </div>
      </div>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
