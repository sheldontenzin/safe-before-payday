const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "monthly-money-tracker-v1";
const COVER_IMAGE = "/public/cover.png";
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

function normalizeBillEntry(entry) {
  if (entry?.dueDate) {
    return {
      id: entry.id ?? createId("bill"),
      name: typeof entry.name === "string" ? entry.name : "",
      amount: Number(entry.amount) || 0,
      dueDate: entry.dueDate,
    };
  }

  if (entry?.day) {
    const now = new Date();
    const day = Math.max(1, Math.min(31, Number(entry.day) || 1));
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    return {
      id: entry.id ?? createId("bill"),
      name: typeof entry.name === "string" ? entry.name : "",
      amount: Number(entry.amount) || 0,
      dueDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    };
  }

  return {
    id: entry?.id ?? createId("bill"),
    name: typeof entry?.name === "string" ? entry.name : "",
    amount: Number(entry?.amount) || 0,
    dueDate: getTodayValue(),
  };
}

function loadState() {
  const fallback = {
    currentBalance: "",
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
      currentBalance: parsed?.currentBalance ?? "",
      estimatedMonthlyIncome: parsed?.estimatedMonthlyIncome ?? "",
      incomeEntries: Array.isArray(parsed?.incomeEntries) ? parsed.incomeEntries : [],
      fixedExpenses: Array.isArray(parsed?.fixedExpenses)
        ? parsed.fixedExpenses.map(normalizeBillEntry)
        : [],
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
  const [billForm, setBillForm] = useState({ name: "", amount: "", dueDate: getTodayValue() });
  const [spendingForm, setSpendingForm] = useState({
    amount: "",
    note: "",
    date: getTodayValue(),
  });
  const balanceRef = useRef(null);
  const incomeRef = useRef(null);
  const spendingRef = useRef(null);
  const billsRef = useRef(null);

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
  const incomeThisMonth = trackerState.incomeEntries.filter((entry) => isInCurrentMonth(entry.date, currentMonthKey));

  const totals = useMemo(() => {
    const currentBalance = clampMoney(Number(trackerState.currentBalance) || 0);
    const totalIncome = clampMoney(
      trackerState.incomeEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const incomeThisMonthTotal = clampMoney(
      incomeThisMonth.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const totalBills = clampMoney(
      trackerState.fixedExpenses.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
    );
    const totalExtra = clampMoney(
      trackerState.extraExpenses.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const totalSpent = clampMoney(totalBills + totalExtra);
    const availableMoney = clampMoney(currentBalance + totalIncome - totalSpent);

    return {
      currentBalance,
      totalIncome,
      incomeThisMonthTotal,
      totalBills,
      totalExtra,
      totalSpent,
      availableMoney,
    };
  }, [incomeThisMonth, trackerState.currentBalance, trackerState.extraExpenses, trackerState.fixedExpenses, trackerState.incomeEntries]);

  const upcomingBills = useMemo(() => {
    return [...trackerState.fixedExpenses]
      .map((bill) => {
        const dueDate = new Date(`${bill.dueDate}T00:00:00`);

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

  const forecast = useMemo(() => {
    const todayValue = getTodayValue();
    const startingBalance = clampMoney(Number(trackerState.currentBalance) || 0);
    const futureEvents = [
      ...trackerState.incomeEntries.map((entry) => ({
        date: entry.date,
        amount: Number(entry.amount) || 0,
        kind: "income",
        sortOrder: 2,
      })),
      ...trackerState.fixedExpenses.map((bill) => ({
        date: bill.dueDate,
        amount: Number(bill.amount) || 0,
        kind: "bill",
        sortOrder: 0,
      })),
      ...trackerState.extraExpenses.map((entry) => ({
        date: entry.date,
        amount: Number(entry.amount) || 0,
        kind: "spending",
        sortOrder: 1,
      })),
    ]
      .filter((event) => event.date && event.date >= todayValue)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date > b.date ? 1 : -1;
        }

        return a.sortOrder - b.sortOrder;
      });

    let runningBalance = startingBalance;
    let firstNegativeDate = null;
    let firstTightDate = null;
    const tightThreshold = Math.max(100, startingBalance * 0.2);

    futureEvents.forEach((event) => {
      if (event.kind === "income") {
        runningBalance = clampMoney(runningBalance + event.amount);
      } else {
        runningBalance = clampMoney(runningBalance - event.amount);
      }

      if (!firstNegativeDate && runningBalance < 0) {
        firstNegativeDate = event.date;
      }

      if (!firstTightDate && runningBalance >= 0 && runningBalance <= tightThreshold) {
        firstTightDate = event.date;
      }
    });

    return {
      projectedBalance: runningBalance,
      firstNegativeDate,
      firstTightDate,
      hasFutureEvents: futureEvents.length > 0,
    };
  }, [trackerState.currentBalance, trackerState.extraExpenses, trackerState.fixedExpenses, trackerState.incomeEntries]);

  const allIncomeEntries = [...trackerState.incomeEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recentSpending = [...trackerState.extraExpenses].sort((a, b) => (a.date < b.date ? 1 : -1));

  function updateEstimatedIncome(value) {
    setTrackerState((current) => ({
      ...current,
      estimatedMonthlyIncome: value,
    }));
  }

  function updateCurrentBalance(value) {
    setTrackerState((current) => ({
      ...current,
      currentBalance: value,
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

    if (!billForm.name.trim() || !amount || amount <= 0 || !billForm.dueDate) {
      return;
    }

    setTrackerState((current) => ({
      ...current,
      fixedExpenses: [
        {
          id: createId("bill"),
          name: billForm.name.trim(),
          amount,
          dueDate: billForm.dueDate,
        },
        ...current.fixedExpenses,
      ],
    }));

    setBillForm({ name: "", amount: "", dueDate: getTodayValue() });
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

  function scrollToSection(sectionRef) {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getSupportMessage() {
    if (totals.currentBalance === 0 && totals.totalIncome === 0) {
      return "Let's add your first income 🌼";
    }

    if (totals.availableMoney < 0) {
      return "You're a little over right now. That happens.";
    }

    if (totals.availableMoney <= Math.max(150, (totals.currentBalance + totals.totalIncome) * 0.2)) {
      return "Things are a little tight. Take it slow for a few days.";
    }

    return "You have money available right now. Small steps are enough.";
  }

  function getForecastMessage() {
    if (forecast.firstNegativeDate) {
      return `You may run out around ${formatDateLabel(forecast.firstNegativeDate)}.`;
    }

    if (forecast.firstTightDate) {
      return `Things might be tight in a few days, around ${formatDateLabel(
        forecast.firstTightDate
      )}.`;
    }

    if (!forecast.hasFutureEvents) {
      return "Add a bill, income, or spending date to see what is coming up.";
    }

    return "You're on track this month.";
  }

  return (
    <main className="money-app">
      <div className="app-stack">
        <section className="hero-card">
          <img
            className="hero-image"
            src={COVER_IMAGE}
            alt=""
            aria-hidden="true"
          />
          <div className="hero-overlay" aria-hidden="true"></div>
          <div className="hero-content">
            <div className="hero-row">
              <div>
                <p className="hero-label">Monthly money tracker</p>
                <h1>{ENCOURAGING_MESSAGES[messageIndex]}</h1>
              </div>
              <div className="hero-logo-shell" aria-hidden="true">
                <img className="hero-logo" src={COVER_IMAGE} alt="" />
              </div>
            </div>
            <p className="hero-copy">Money in. Money out. A simple look at what is left.</p>
          </div>
        </section>

        {totals.currentBalance === 0 && totals.totalIncome === 0 ? (
          <EmptyState />
        ) : (
          <section className="main-card">
            <p className="main-label">Money available</p>
            <p className="main-value">{formatCurrency(totals.availableMoney)}</p>
            <p className="soft-note">{getSupportMessage()}</p>

            <div className="main-summary">
              <button
                className="summary-pill summary-action"
                type="button"
                onClick={() => scrollToSection(balanceRef)}
              >
                <span>Current balance</span>
                <strong>{formatCurrency(totals.currentBalance)}</strong>
              </button>
              <button
                className="summary-pill summary-action"
                type="button"
                onClick={() => scrollToSection(incomeRef)}
              >
                <span>Income</span>
                <strong>{formatCurrency(totals.totalIncome)}</strong>
              </button>
              <button
                className="summary-pill summary-action"
                type="button"
                onClick={() => scrollToSection(spendingRef)}
              >
                <span>Spent</span>
                <strong>{formatCurrency(totals.totalSpent)}</strong>
              </button>
            </div>

            <div className="sub-summary">
              <button
                className="sub-card summary-action"
                type="button"
                onClick={() => scrollToSection(billsRef)}
              >
                <p>Bills total</p>
                <strong>{formatCurrency(totals.totalBills)}</strong>
              </button>
              <button
                className="sub-card summary-action"
                type="button"
                onClick={() => scrollToSection(spendingRef)}
              >
                <p>Other spending</p>
                <strong>{formatCurrency(totals.totalExtra)}</strong>
              </button>
            </div>
          </section>
        )}

        <section className="card">
          <div className="section-head">
            <div>
              <p className="section-label">Looking ahead</p>
              <h2>This month</h2>
            </div>
          </div>

          <div className="insight-card">
            <p className="insight-copy">{getForecastMessage()}</p>
            <p className="insight-meta">
              Looking at your balance today plus dated money in, bills, and spending.
            </p>
          </div>
        </section>

        <div className="inline-actions">
          <a className="inline-button primary" href="#income-form">
            Add money
          </a>
          <a className="inline-button secondary" href="#spending-form">
            Add spending
          </a>
        </div>

        <section className="card" ref={balanceRef}>
          <div className="section-head">
            <div>
              <p className="section-label">Right now</p>
              <h2>Current balance</h2>
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

          <label className="balance-field">
            <span>Current balance</span>
            <input
              type="number"
              inputMode="decimal"
              min="-999999"
              step="0.01"
              placeholder="0.00"
              value={trackerState.currentBalance}
              onChange={(event) => updateCurrentBalance(event.target.value)}
            />
          </label>
        </section>

        <section className="card" id="income-form" ref={incomeRef}>
          <div className="section-head">
            <div>
              <p className="section-label">Money in</p>
              <h2>Add money</h2>
            </div>
            <div className="section-total">{formatCurrency(totals.incomeThisMonthTotal)}</div>
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
              Money available uses all income entries in this list.
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

        <section className="card" ref={billsRef}>
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
              <span>Due date</span>
              <input
                type="date"
                value={billForm.dueDate}
                onChange={(event) =>
                  setBillForm((current) => ({ ...current, dueDate: event.target.value }))
                }
              />
            </label>

            <button className="soft-button" type="submit">
              Add bill
            </button>
          </form>

          <p className="list-help">Each bill saves right away and is counted on its own due date.</p>

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

        <section className="card" id="spending-form" ref={spendingRef}>
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

      </div>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
