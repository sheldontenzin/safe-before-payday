const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "monthly-money-tracker-v1";

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
      <p className="empty-title">Add your first income</p>
    </div>
  );
}

function App() {
  const [trackerState, setTrackerState] = useState(loadState);
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

  const monthlyRemaining = clampMoney(totals.incomeThisMonthTotal - totals.totalExtra - totals.totalBills);

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
      return "Add income to get started.";
    }

    if (totals.availableMoney < 0) {
      return "Below zero right now.";
    }

    if (totals.availableMoney <= Math.max(150, (totals.currentBalance + totals.totalIncome) * 0.2)) {
      return "Tight right now.";
    }

    return "Money available right now.";
  }

  function getHeaderMessage() {
    if (totals.incomeThisMonthTotal === 0 && totals.totalExtra === 0 && totals.totalBills === 0) {
      return "You're on track this month";
    }

    if (monthlyRemaining < 0) {
      return `You're ${formatCurrency(Math.abs(monthlyRemaining))} over budget`;
    }

    return `You have ${formatCurrency(monthlyRemaining)} available`;
  }

  function getForecastMessage() {
    if (totals.incomeThisMonthTotal === 0 && totals.totalExtra === 0 && totals.totalBills === 0) {
      return {
        headline: "You're on track this month",
        instruction: "Keep spending under $0",
      };
    }

    if (monthlyRemaining < 0) {
      const amountOver = Math.abs(monthlyRemaining);

      return {
        headline: `You're ${formatCurrency(amountOver)} over budget`,
        instruction: `Add income or reduce spending by ${formatCurrency(amountOver)}`,
      };
    }

    return {
      headline: `You have ${formatCurrency(monthlyRemaining)} left this month`,
      instruction: `Keep spending under ${formatCurrency(monthlyRemaining)}`,
    };
  }

  const forecastMessage = getForecastMessage();

  return (
    <main className="money-app">
      <div className="app-stack">
        <section className="hero-card">
          <p className="hero-label">This month</p>
          <h1>{getHeaderMessage()}</h1>
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
            </div>
          </div>

          <div className={`insight-card${monthlyRemaining < 0 ? " insight-card-warning" : ""}`}>
            <p className="insight-copy">{forecastMessage.headline}</p>
            <p className="insight-note">{forecastMessage.instruction}</p>
          </div>

          <div className="inline-actions">
            <a className="inline-button primary" href="#income-form">
              Add income
            </a>
            <a className="inline-button secondary" href="#spending-form">
              Review spending
            </a>
          </div>
        </section>

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
              <p className="section-label">Income</p>
              <h2>Add income</h2>
            </div>
            <div className="section-total">{formatCurrency(totals.incomeThisMonthTotal)}</div>
          </div>

          <p className="section-helper">Add expected income (salary, freelance, etc.)</p>

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
              Add income
            </button>
          </form>

          <div className="list-block">
            <p className="list-title">All money added</p>
            <p className="list-help">
              Money available uses all income entries in this list.
            </p>
            {allIncomeEntries.length === 0 ? (
              <p className="list-empty">No income added yet.</p>
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
