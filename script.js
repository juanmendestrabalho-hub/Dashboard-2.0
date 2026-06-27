(() => {
  "use strict";

  const STORAGE_KEY = "financeData";

  let state = {
    transactions: []
  };

  let chart;

  const elements = {
    form: document.getElementById("transactionForm"),
    description: document.getElementById("description"),
    amount: document.getElementById("amount"),
    list: document.getElementById("transactionList"),
    balance: document.getElementById("balance"),
    themeToggle: document.getElementById("themeToggle")
  };

  const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const loadState = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) state = JSON.parse(data);
  };

  const formatCurrency = (value) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const calculateBalance = () =>
    state.transactions.reduce((acc, t) => acc + t.amount, 0);

  const addTransaction = (description, amount) => {
    const transaction = {
      id: Date.now(),
      description,
      amount: Number(amount)
    };

    state.transactions.push(transaction);
    saveState();
    render();
  };

  const deleteTransaction = (id) => {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveState();
    render();
  };

  const renderList = () => {
    elements.list.innerHTML = "";

    state.transactions.forEach(({ id, description, amount }) => {
      const li = document.createElement("li");

      li.innerHTML = `
        <span>${description}</span>
        <span class="${amount >= 0 ? "income" : "expense"}">
          ${formatCurrency(amount)}
        </span>
      `;

      li.addEventListener("click", () => deleteTransaction(id));

      elements.list.appendChild(li);
    });
  };

  const renderBalance = () => {
    const balance = calculateBalance();
    elements.balance.textContent = formatCurrency(balance);
  };

  const renderChart = () => {
    const income = state.transactions
      .filter(t => t.amount > 0)
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = state.transactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => acc + t.amount, 0);

    if (chart) chart.destroy();

    const ctx = document.getElementById("financeChart").getContext("2d");

    chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Receitas", "Despesas"],
        datasets: [{
          data: [income, Math.abs(expense)],
          backgroundColor: ["#4CAF50", "#e74c3c"]
        }]
      }
    });
  };

  const render = () => {
    renderList();
    renderBalance();
    renderChart();
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
  };

  const loadTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }
  };

  const initEvents = () => {
    elements.form.addEventListener("submit", (e) => {
      e.preventDefault();

      const desc = elements.description.value.trim();
      const amount = elements.amount.value;

      if (!desc || !amount) return;

      addTransaction(desc, amount);

      elements.form.reset();
    });

    elements.themeToggle.addEventListener("click", toggleTheme);
  };

  const init = () => {
    loadState();
    loadTheme();
    initEvents();
    render();
  };

  init();
})();
