const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "monthly-money-tracker-v1";
const REPEAT_OPTIONS = [
  { value: "once", label: "One time" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "friday", label: "Every Friday" },
  { value: "first", label: "Every 1st" },
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

function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function dateFromValue(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function valueFromDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  const targetDay = nextDate.getDate();
  nextDate.setDate(1);
  nextDate.setMonth(nextDate.getMonth() + months);
  const lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
  nextDate.setDate(Math.min(targetDay, lastDay));
  return nextDate;
}

function nextWeekdayOnOrAfter(date, weekday) {
  const nextDate = new Date(date);
  const difference = (weekday - nextDate.getDay() + 7) % 7;
  nextDate.setDate(nextDate.getDate() + difference);
  return nextDate;
}

function firstOfMonthOnOrAfter(date) {
  if (date.getDate() === 1) {
    return new Date(date);
  }

  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function buildRecurringDates(startValue, pattern, repeatsValue) {
  const count = Math.max(1, Math.min(24, Number.parseInt(repeatsValue, 10) || 1));
  const dates = [];
  let currentDate = dateFromValue(startValue || getTodayValue());

  if (pattern === "friday") {
    currentDate = nextWeekdayOnOrAfter(currentDate, 5);
  }

  if (pattern === "first") {
    currentDate = firstOfMonthOnOrAfter(currentDate);
  }

  for (let index = 0; index < count; index += 1) {
    dates.push(valueFromDate(currentDate));

    if (pattern === "once") {
      break;
    }

    if (pattern === "weekly" || pattern === "friday") {
      currentDate = addDays(currentDate, 7);
      continue;
    }

    if (pattern === "biweekly") {
      currentDate = addDays(currentDate, 14);
      continue;
    }

    if (pattern === "monthly" || pattern === "first") {
      currentDate = addMonths(currentDate, 1);
    }
  }

  return dates;
}

function getNextOccurrenceAfter(dateValue, pattern) {
  const currentDate = dateFromValue(dateValue || getTodayValue());

  if (pattern === "weekly" || pattern === "friday") {
    return valueFromDate(addDays(currentDate, 7));
  }

  if (pattern === "biweekly") {
    return valueFromDate(addDays(currentDate, 14));
  }

  if (pattern === "monthly" || pattern === "first") {
    return valueFromDate(addMonths(currentDate, 1));
  }

  return getTodayValue();
}

function getDateDifferenceInDays(startValue, endValue) {
  const difference = dateFromValue(endValue).getTime() - dateFromValue(startValue).getTime();
  return Math.round(difference / (24 * 60 * 60 * 1000));
}

function inferRepeatPattern(dateValues) {
  const uniqueDates = [...new Set(dateValues)].sort();

  if (uniqueDates.length < 2) {
    return "once";
  }

  const latest = uniqueDates[uniqueDates.length - 1];
  const previous = uniqueDates[uniqueDates.length - 2];
  const difference = getDateDifferenceInDays(previous, latest);
  const latestDate = dateFromValue(latest);
  const previousDate = dateFromValue(previous);

  if (difference === 14) {
    return "biweekly";
  }

  if (difference === 7) {
    return latestDate.getDay() === 5 ? "friday" : "weekly";
  }

  if (latestDate.getDate() === 1 && previousDate.getDate() === 1) {
    return "first";
  }

  if (
    latestDate.getDate() === previousDate.getDate() &&
    (latestDate.getMonth() !== previousDate.getMonth() || latestDate.getFullYear() !== previousDate.getFullYear())
  ) {
    return "monthly";
  }

  return "once";
}

function getNextFutureDate(dateValue, pattern, todayValue) {
  if (!dateValue || pattern === "once") {
    return todayValue;
  }

  let nextDate = getNextOccurrenceAfter(dateValue, pattern);

  while (nextDate <= todayValue && pattern !== "once") {
    nextDate = getNextOccurrenceAfter(nextDate, pattern);
  }

  return nextDate;
}

function buildLabelProfiles(entries, labelKey, dateKey) {
  const profileMap = new Map();

  entries.forEach((entry) => {
    const label = String(entry?.[labelKey] || "").trim();
    const dateValue = String(entry?.[dateKey] || "").trim();

    if (!label || !dateValue) {
      return;
    }

    const normalized = normalizeLabel(label);
    const amount = Number(entry?.amount) || 0;
    const existing = profileMap.get(normalized) ?? {
      key: normalized,
      label,
      lastDate: dateValue,
      count: 0,
      dates: [],
      recentAmount: amount,
      amountCounts: new Map(),
    };

    existing.count += 1;
    existing.dates.push(dateValue);

    if (dateValue >= existing.lastDate) {
      existing.label = label;
      existing.lastDate = dateValue;
      existing.recentAmount = amount;
    }

    const amountKey = String(clampMoney(amount));
    const currentAmountCount = existing.amountCounts.get(amountKey) ?? {
      amount,
      count: 0,
      lastDate: dateValue,
    };

    currentAmountCount.count += 1;
    if (dateValue >= currentAmountCount.lastDate) {
      currentAmountCount.lastDate = dateValue;
      currentAmountCount.amount = amount;
    }

    existing.amountCounts.set(amountKey, currentAmountCount);
    profileMap.set(normalized, existing);
  });

  return [...profileMap.values()]
    .map((profile) => {
      const mostLikelyAmount = [...profile.amountCounts.values()].sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return right.lastDate.localeCompare(left.lastDate);
      })[0];

      return {
        key: profile.key,
        label: profile.label,
        count: profile.count,
        lastDate: profile.lastDate,
        amount: mostLikelyAmount?.amount ?? profile.recentAmount,
        repeat: inferRepeatPattern(profile.dates),
      };
    })
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return right.lastDate.localeCompare(left.lastDate);
    });
}

function normalizeIncomeEntry(entry) {
  return {
    id: entry?.id ?? createId("income"),
    amount: Number(entry?.amount) || 0,
    date: typeof entry?.date === "string" ? entry.date : getTodayValue(),
    label: typeof entry?.label === "string" ? entry.label : "",
  };
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
    lastIncomeValues: {
      label: "",
      amount: "",
      repeat: "once",
      repeats: "1",
    },
    lastBillValues: {
      name: "",
      amount: "",
      repeat: "once",
      repeats: "1",
    },
    lastSpendingValues: {
      note: "",
      amount: "",
    },
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
      incomeEntries: Array.isArray(parsed?.incomeEntries)
        ? parsed.incomeEntries.map(normalizeIncomeEntry)
        : [],
      fixedExpenses: Array.isArray(parsed?.fixedExpenses)
        ? parsed.fixedExpenses.map(normalizeBillEntry)
        : [],
      extraExpenses: Array.isArray(parsed?.extraExpenses) ? parsed.extraExpenses : [],
      lastIncomeValues: {
        label: parsed?.lastIncomeValues?.label ?? "",
        amount: parsed?.lastIncomeValues?.amount ?? "",
        repeat: parsed?.lastIncomeValues?.repeat ?? "once",
        repeats: parsed?.lastIncomeValues?.repeats ?? "1",
      },
      lastBillValues: {
        name: parsed?.lastBillValues?.name ?? "",
        amount: parsed?.lastBillValues?.amount ?? "",
        repeat: parsed?.lastBillValues?.repeat ?? "once",
        repeats: parsed?.lastBillValues?.repeats ?? "1",
      },
      lastSpendingValues: {
        note: parsed?.lastSpendingValues?.note ?? "",
        amount: parsed?.lastSpendingValues?.amount ?? "",
      },
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
  const [incomeForm, setIncomeForm] = useState(() => ({
    label: trackerState.lastIncomeValues.label,
    amount: trackerState.lastIncomeValues.amount,
    date: getTodayValue(),
    repeat: trackerState.lastIncomeValues.repeat,
    repeats: trackerState.lastIncomeValues.repeats,
  }));
  const [billForm, setBillForm] = useState(() => ({
    name: trackerState.lastBillValues.name,
    amount: trackerState.lastBillValues.amount,
    dueDate: getTodayValue(),
    repeat: trackerState.lastBillValues.repeat,
    repeats: trackerState.lastBillValues.repeats,
  }));
  const [spendingForm, setSpendingForm] = useState({
    amount: trackerState.lastSpendingValues.amount,
    note: trackerState.lastSpendingValues.note,
    date: getTodayValue(),
  });
  const [undoState, setUndoState] = useState(null);
  const balanceRef = useRef(null);
  const incomeRef = useRef(null);
  const spendingRef = useRef(null);
  const billsRef = useRef(null);
  const undoTimeoutRef = useRef(null);

  useEffect(() => {
    saveState(trackerState);
  }, [trackerState]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const currentMonthKey = getCurrentMonthKey();
  const todayValue = getTodayValue();
  const incomeThisMonth = trackerState.incomeEntries.filter((entry) => isInCurrentMonth(entry.date, currentMonthKey));
  const incomeProfiles = useMemo(
    () => buildLabelProfiles(trackerState.incomeEntries, "label", "date"),
    [trackerState.incomeEntries]
  );
  const billProfiles = useMemo(
    () => buildLabelProfiles(trackerState.fixedExpenses, "name", "dueDate"),
    [trackerState.fixedExpenses]
  );
  const spendingProfiles = useMemo(
    () => buildLabelProfiles(trackerState.extraExpenses, "note", "date"),
    [trackerState.extraExpenses]
  );
  const spendingQuickPicks = useMemo(() => spendingProfiles.slice(0, 4), [spendingProfiles]);

  const totals = useMemo(() => {
    const currentBalance = clampMoney(Number(trackerState.currentBalance) || 0);
    const upcomingIncomeEntries = trackerState.incomeEntries.filter((entry) => entry.date > todayValue);
    const billsThisMonth = trackerState.fixedExpenses.filter((bill) => isInCurrentMonth(bill.dueDate, currentMonthKey));
    const upcomingBillEntries = trackerState.fixedExpenses.filter((bill) => bill.dueDate > todayValue);
    const spendingThisMonth = trackerState.extraExpenses.filter((entry) => isInCurrentMonth(entry.date, currentMonthKey));
    const upcomingSpendingEntries = trackerState.extraExpenses.filter((entry) => entry.date > todayValue);
    const totalIncome = clampMoney(
      upcomingIncomeEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const incomeThisMonthTotal = clampMoney(
      incomeThisMonth.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const totalBills = clampMoney(
      upcomingBillEntries.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
    );
    const totalBillsThisMonth = clampMoney(
      billsThisMonth.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0)
    );
    const totalExtra = clampMoney(
      upcomingSpendingEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const totalExtraThisMonth = clampMoney(
      spendingThisMonth.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)
    );
    const totalSpent = clampMoney(totalBills + totalExtra);
    const availableMoney = clampMoney(currentBalance + totalIncome - totalSpent);

    return {
      currentBalance,
      totalIncome,
      incomeThisMonthTotal,
      totalBills,
      totalBillsThisMonth,
      totalExtra,
      totalExtraThisMonth,
      totalSpent,
      availableMoney,
    };
  }, [currentMonthKey, incomeThisMonth, todayValue, trackerState.currentBalance, trackerState.extraExpenses, trackerState.fixedExpenses, trackerState.incomeEntries]);

  const monthlyRemaining = clampMoney(
    totals.incomeThisMonthTotal - totals.totalExtraThisMonth - totals.totalBillsThisMonth
  );

  const upcomingBills = useMemo(() => {
    return [...trackerState.fixedExpenses]
      .filter((bill) => bill.dueDate > todayValue)
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
  }, [todayValue, trackerState.fixedExpenses]);

  const forecast = useMemo(() => {
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
      .filter((event) => event.date && event.date > todayValue)
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
  }, [todayValue, trackerState.currentBalance, trackerState.extraExpenses, trackerState.fixedExpenses, trackerState.incomeEntries]);

  const allIncomeEntries = [...trackerState.incomeEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recentSpending = [...trackerState.extraExpenses].sort((a, b) => (a.date < b.date ? 1 : -1));

  function findProfileByLabel(profiles, value) {
    const normalized = normalizeLabel(value);
    return profiles.find((profile) => profile.key === normalized) ?? null;
  }

  function applyIncomeProfile(profile, nextLabel = profile.label) {
    if (!profile) {
      return;
    }

    setIncomeForm((current) => ({
      ...current,
      label: nextLabel,
      amount: String(profile.amount || ""),
      repeat: profile.repeat,
      date: getNextFutureDate(profile.lastDate, profile.repeat, todayValue),
    }));
  }

  function applyBillProfile(profile, nextLabel = profile.label) {
    if (!profile) {
      return;
    }

    setBillForm((current) => ({
      ...current,
      name: nextLabel,
      amount: String(profile.amount || ""),
      repeat: profile.repeat,
      dueDate: getNextFutureDate(profile.lastDate, profile.repeat, todayValue),
    }));
  }

  function applySpendingProfile(profile, nextLabel = profile.label) {
    if (!profile) {
      return;
    }

    setSpendingForm((current) => ({
      ...current,
      note: nextLabel,
      amount: String(profile.amount || ""),
    }));
  }

  function showUndoToast(payload) {
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }

    setUndoState(payload);
    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoState(null);
    }, 5000);
  }

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

    const dates = buildRecurringDates(incomeForm.date, incomeForm.repeat, incomeForm.repeats);
    const incomeEntries = dates.map((dateValue) => ({
      id: createId("income"),
      amount,
      date: dateValue,
      label: incomeForm.label.trim(),
    }));

    setTrackerState((current) => ({
      ...current,
      incomeEntries: [...incomeEntries, ...current.incomeEntries],
      lastIncomeValues: {
        label: incomeForm.label,
        amount: incomeForm.amount,
        repeat: incomeForm.repeat,
        repeats: incomeForm.repeats,
      },
    }));

    const nextDate = getNextOccurrenceAfter(dates[dates.length - 1] ?? getTodayValue(), incomeForm.repeat);
    setIncomeForm((current) => ({
      ...current,
      date: nextDate,
    }));
  }

  function addBill(event) {
    event.preventDefault();
    const amount = Number(billForm.amount);

    if (!billForm.name.trim() || !amount || amount <= 0 || !billForm.dueDate) {
      return;
    }

    const dates = buildRecurringDates(billForm.dueDate, billForm.repeat, billForm.repeats);
    const fixedExpenses = dates.map((dateValue) => ({
      id: createId("bill"),
      name: billForm.name.trim(),
      amount,
      dueDate: dateValue,
    }));

    setTrackerState((current) => ({
      ...current,
      fixedExpenses: [...fixedExpenses, ...current.fixedExpenses],
      lastBillValues: {
        name: billForm.name,
        amount: billForm.amount,
        repeat: billForm.repeat,
        repeats: billForm.repeats,
      },
    }));

    const nextDate = getNextOccurrenceAfter(dates[dates.length - 1] ?? getTodayValue(), billForm.repeat);
    setBillForm((current) => ({
      ...current,
      dueDate: nextDate,
    }));
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
      lastSpendingValues: {
        note: spendingForm.note,
        amount: spendingForm.amount,
      },
    }));

    setSpendingForm((current) => ({
      ...current,
      date: getTodayValue(),
    }));
  }

  function removeEntry(collectionKey, entryId) {
    let removedEntry = null;

    setTrackerState((current) => {
      removedEntry = current[collectionKey].find((entry) => entry.id === entryId) ?? null;

      return {
        ...current,
        [collectionKey]: current[collectionKey].filter((entry) => entry.id !== entryId),
      };
    });

    if (removedEntry) {
      showUndoToast({ collectionKey, entry: removedEntry });
    }
  }

  function undoRemove() {
    if (!undoState) {
      return;
    }

    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }

    setTrackerState((current) => ({
      ...current,
      [undoState.collectionKey]: [undoState.entry, ...current[undoState.collectionKey]],
    }));

    setUndoState(null);
  }

  function handleIncomeLabelChange(value) {
    const profile = findProfileByLabel(incomeProfiles, value);

    if (profile) {
      applyIncomeProfile(profile, value);
      return;
    }

    setIncomeForm((current) => ({
      ...current,
      label: value,
    }));
  }

  function handleBillNameChange(value) {
    const profile = findProfileByLabel(billProfiles, value);

    if (profile) {
      applyBillProfile(profile, value);
      return;
    }

    setBillForm((current) => ({
      ...current,
      name: value,
    }));
  }

  function handleSpendingNoteChange(value) {
    const profile = findProfileByLabel(spendingProfiles, value);

    if (profile) {
      applySpendingProfile(profile, value);
      return;
    }

    setSpendingForm((current) => ({
      ...current,
      note: value,
    }));
  }

  function scrollToSection(sectionRef) {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getMonthlySnapshot() {
    if (monthlyRemaining < 0) {
      const amountShort = Math.abs(monthlyRemaining);

      return {
        headline: `You'll be short ${formatCurrency(amountShort)} this month.`,
        note:
          totals.availableMoney >= 0
            ? "You can cover it with money already in your account."
            : "Add income or lower spending this month.",
      };
    }

    if (monthlyRemaining > 0) {
      return {
        headline: `You'll save ${formatCurrency(monthlyRemaining)} this month.`,
        note: "",
      };
    }

    return {
      headline: "You'll break even this month.",
      note: "",
    };
  }

  function getHeadsUpMessages() {
    const messages = [];
    const tightMonthThreshold = Math.max(150, totals.incomeThisMonthTotal * 0.1);
    const estimatedIncome = Number(trackerState.estimatedMonthlyIncome) || 0;
    const partialIncomeIncluded = estimatedIncome > 0 && totals.incomeThisMonthTotal + 50 < estimatedIncome;

    if (forecast.firstNegativeDate) {
      messages.push(`You may be low on money around ${formatDateLabel(forecast.firstNegativeDate)}.`);
    } else if (forecast.firstTightDate) {
      messages.push(`Money may get low around ${formatDateLabel(forecast.firstTightDate)}.`);
    }

    if (monthlyRemaining >= 0 && totals.incomeThisMonthTotal > 0 && monthlyRemaining <= tightMonthThreshold) {
      messages.push("There is not much extra money this month.");
    }

    const clusteredBills = upcomingBills.some((bill, index) => {
      const nextBill = upcomingBills[index + 1];

      if (!nextBill) {
        return false;
      }

      const difference = nextBill.dueDate.getTime() - bill.dueDate.getTime();
      const daysBetween = difference / (24 * 60 * 60 * 1000);

      return daysBetween <= 7;
    });

    if (clusteredBills) {
      messages.push("Several bills are close together this week.");
    }

    if (partialIncomeIncluded) {
      messages.push("Only part of this month's income is included.");

      if (totals.availableMoney >= 0 && monthlyRemaining < 0) {
        messages.push("So far, your current balance still covers this month.");
      } else if (totals.availableMoney >= 0) {
        messages.push("You may still have enough in your account to cover this month.");
      }
    } else if (totals.availableMoney >= 0 && monthlyRemaining < 0) {
      messages.push("Bills are covered so far.");
    }

    return messages;
  }

  const monthlySnapshot = getMonthlySnapshot();
  const headsUpMessages = getHeadsUpMessages();
  const nextUpcomingBill = upcomingBills[0] ?? null;

  return (
    <main className="money-app">
      <div className="app-stack" id="summary-top">
        <section className="hero-card">
          <p className="hero-label">This month</p>
          <h1>{monthlySnapshot.headline}</h1>
          {monthlySnapshot.note ? <p className="hero-note">{monthlySnapshot.note}</p> : null}
        </section>

        {totals.currentBalance === 0 && totals.totalIncome === 0 ? (
          <EmptyState />
        ) : (
          <section className="main-card">
            <p className="main-label">Available cash</p>
            <p className="main-value">{formatCurrency(totals.availableMoney)}</p>
            <p className="soft-note">
              Includes your current balance and upcoming income, minus upcoming bills and spending.
            </p>

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
                <span>Upcoming income</span>
                <strong>{formatCurrency(totals.totalIncome)}</strong>
              </button>
              <button
                className="summary-pill summary-action"
                type="button"
                onClick={() => scrollToSection(spendingRef)}
              >
                <span>Upcoming spending</span>
                <strong>{formatCurrency(totals.totalSpent)}</strong>
              </button>
            </div>

            <div className="sub-summary">
              <button
                className="sub-card summary-action"
                type="button"
                onClick={() => scrollToSection(billsRef)}
              >
                <p>Upcoming bills</p>
                <strong>{formatCurrency(totals.totalBills)}</strong>
              </button>
              <button
                className="sub-card summary-action"
                type="button"
                onClick={() => scrollToSection(spendingRef)}
              >
                <p>Other upcoming spending</p>
                <strong>{formatCurrency(totals.totalExtra)}</strong>
              </button>
            </div>
          </section>
        )}

        <section className="card">
          <div className="section-head">
            <div>
              <p className="section-label">Heads up</p>
            </div>
          </div>

          {headsUpMessages.length === 0 ? (
            <p className="list-empty">No big surprises right now.</p>
          ) : (
            <div className="insight-card">
              <ul className="heads-up-list">
                {headsUpMessages.map((message) => (
                  <li key={message} className="heads-up-item">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="inline-actions">
          <button className="inline-button primary" type="button" onClick={() => scrollToSection(incomeRef)}>
            Add income
          </button>
          <button className="inline-button secondary" type="button" onClick={() => scrollToSection(spendingRef)}>
            Add spending
          </button>
        </div>

        <section className="card" id="more-section" ref={balanceRef}>
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

          <p className="section-helper">Add upcoming income you still expect to receive.</p>
          <p className="list-help">We remember your usual income labels, amounts, and repeat pattern.</p>

          <form className="entry-form" onSubmit={addIncome}>
            <label className="field">
              <span>Label</span>
              <input
                type="text"
                placeholder="Paycheck"
                list="income-label-suggestions"
                value={incomeForm.label}
                onChange={(event) => handleIncomeLabelChange(event.target.value)}
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
                value={incomeForm.amount}
                onChange={(event) =>
                  setIncomeForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Start date</span>
              <input
                type="date"
                value={incomeForm.date}
                onChange={(event) =>
                  setIncomeForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Repeat</span>
              <select
                value={incomeForm.repeat}
                onChange={(event) =>
                  setIncomeForm((current) => ({ ...current, repeat: event.target.value }))
                }
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Repeats</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="24"
                value={incomeForm.repeats}
                onChange={(event) =>
                  setIncomeForm((current) => ({ ...current, repeats: event.target.value }))
                }
              />
            </label>

            <button className="primary-button" type="submit">
              Add income
            </button>
          </form>
          <datalist id="income-label-suggestions">
            {incomeProfiles.map((profile) => (
              <option key={profile.key} value={profile.label} />
            ))}
          </datalist>

          <div className="list-block">
            <p className="list-title">All income entered</p>
            <p className="list-help">
              Available cash only adds future income from this list.
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
                        {entry.label ? `${entry.label} — ` : ""}
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

        <section className="card" id="bills-form" ref={billsRef}>
          <div className="section-head">
            <div>
              <p className="section-label">Bills</p>
              <h2>Bills coming up</h2>
            </div>
            <div className="section-total">{formatCurrency(totals.totalBills)}</div>
          </div>
          <p className="list-help">We remember your usual bill names, amounts, and repeat pattern.</p>

          <form className="entry-form bill-form" onSubmit={addBill}>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                placeholder="Rent"
                list="bill-name-suggestions"
                value={billForm.name}
                onChange={(event) => handleBillNameChange(event.target.value)}
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
              <span>Start date</span>
              <input
                type="date"
                value={billForm.dueDate}
                onChange={(event) =>
                  setBillForm((current) => ({ ...current, dueDate: event.target.value }))
                }
              />
            </label>

            <label className="field">
              <span>Repeat</span>
              <select
                value={billForm.repeat}
                onChange={(event) =>
                  setBillForm((current) => ({ ...current, repeat: event.target.value }))
                }
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Repeats</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="24"
                value={billForm.repeats}
                onChange={(event) =>
                  setBillForm((current) => ({ ...current, repeats: event.target.value }))
                }
              />
            </label>

            <button className="soft-button" type="submit">
              Add bill
            </button>
          </form>
          <datalist id="bill-name-suggestions">
            {billProfiles.map((profile) => (
              <option key={profile.key} value={profile.label} />
            ))}
          </datalist>

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

          {spendingQuickPicks.length > 0 ? (
            <div className="preset-row">
              {spendingQuickPicks.map((profile) => (
                <button
                  key={profile.key}
                  className="preset-chip"
                  type="button"
                  onClick={() => applySpendingProfile(profile)}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          ) : null}
          <p className="list-help">Quick fills come from your own most-used spending labels.</p>

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
                list="spending-note-suggestions"
                value={spendingForm.note}
                onChange={(event) => handleSpendingNoteChange(event.target.value)}
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
          <datalist id="spending-note-suggestions">
            {spendingProfiles.map((profile) => (
              <option key={profile.key} value={profile.label} />
            ))}
          </datalist>

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
      {undoState ? (
        <div className="undo-toast" role="status" aria-live="polite">
          <span>Removed.</span>
          <button type="button" onClick={undoRemove}>
            Undo
          </button>
        </div>
      ) : null}
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
