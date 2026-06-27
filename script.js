const App = (() => {
"use strict";

/* ========= HELPERS ========= */

const normalizeDate = (d) => {
  if (!d) return "";

  if (typeof d === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + d * 86400000);
    return date.toISOString().slice(0, 10);
  }

  const parsed = new Date(d);
  if (isNaN(parsed)) return "";

  return parsed.toISOString().slice(0, 10);
};

const escapeCSV = (value) =>
  `"${String(value).replace(/"/g, '""')}"`;

/* ========= STORE ========= */

const Store = (() => {
  const KEY = "finance_saas";

  let state = { transactions: [] };

  const load = () => {
    try {
      const data = localStorage.getItem(KEY);
      if (data) state = JSON.parse(data);
    } catch {
      state = { transactions: [] };
    }
  };

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(state));
  };

  const add = (t) => {
    state.transactions.push(t);
    save();
  };

  const set = (data) => {
    state.transactions = data;
    save();
  };

  const get = () => state.transactions;

  return { load, add, set, get };
})();

/* ========= SERVICES ========= */

const Services = (() => {

  const filter = () => {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const cat = document.getElementById("categoryFilter").value;

    return Store.get().filter(t => {
      const d = normalizeDate(t.date);
      return (!start || d >= start) &&
             (!end || d <= end) &&
             (!cat || t.category === cat);
    });
  };

  const analytics = () => {
    const cat = {};
    const month = {};

    filter().forEach(t => {
      cat[t.category] = (cat[t.category] || 0) + t.amount;

      const m = t.date.slice(0,7);
      month[m] = (month[m] || 0) + t.amount;
    });

    return { cat, month };
  };

  const exportCSV = () => {
    const header = "Descrição,Valor,Categoria,Data\n";

    const csv = header + Store.get().map(r =>
      [
        escapeCSV(r.description),
        r.amount,
        escapeCSV(r.category),
        r.date
      ].join(",")
    ).join("\n");

    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "finance.csv";
    a.click();
  };

  const importExcel = (file) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type:"array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        const data = json.map(r => {
          if (!r.Descrição || !r.Valor || !r.Data) return null;

          return {
            id: crypto.randomUUID(),
            description: String(r.Descrição),
            amount: Number(r.Valor),
            category: String(r.Categoria || "outros").toLowerCase(),
            date: normalizeDate(r.Data)
          };
        }).filter(Boolean);

        Store.set(data);
        UI.render();

      } catch {
        alert("Erro ao processar arquivo");
      }
    };

    reader.onerror = () => alert("Erro ao ler arquivo");

    reader.readAsArrayBuffer(file);
  };

  return { filter, analytics, exportCSV, importExcel };
})();

/* ========= UI ========= */

const UI = (() => {

  const format = v =>
    v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  const renderList = () => {
    const list = document.getElementById("list");
    list.innerHTML = "";

    Services.filter().forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.description} - ${format(t.amount)} (${t.category})`;
      list.appendChild(li);
    });
  };

  const renderBalance = () => {
    const total = Services.filter()
      .reduce((a,b)=>a+b.amount,0);

    document.getElementById("balance").textContent = format(total);
  };

  const renderCategories = () => {
    const select = document.getElementById("categoryFilter");
    const cats = [...new Set(Store.get().map(t=>t.category))];

    select.innerHTML =
      `<option value="">Todas</option>` +
      cats.map(c=>`<option value="${c}">${c}</option>`).join("");
  };

  return {
    render: () => {
      renderList();
      renderBalance();
      renderCategories();
      Charts.render();
    }
  };
})();

/* ========= CHARTS ========= */

const Charts = (() => {

  let catChart, monthChart;

  const render = () => {
    const {cat, month} = Services.analytics();

    const catCanvas = document.getElementById("catChart");
    const monthCanvas = document.getElementById("monthChart");

    if (!catCanvas || !monthCanvas) return;

    if (catChart) catChart.destroy();
    if (monthChart) monthChart.destroy();

    const safeCat = Object.keys(cat).length ? cat : { "Sem dados": 1 };
    const safeMonth = Object.keys(month).length ? month : { "Sem dados": 1 };

    catChart = new Chart(catCanvas.getContext("2d"), {
      type:"pie",
      data:{
        labels:Object.keys(safeCat),
        datasets:[{data:Object.values(safeCat)}]
      }
    });

    monthChart = new Chart(monthCanvas.getContext("2d"), {
      type:"bar",
      data:{
        labels:Object.keys(safeMonth),
        datasets:[{data:Object.values(safeMonth)}]
      }
    });
  };

  return { render };
})();

/* ========= CONTROLLER ========= */

const Controller = (() => {

  const init = () => {

    const descEl = document.getElementById("desc");
    const amountEl = document.getElementById("amount");
    const categoryEl = document.getElementById("category");
    const dateEl = document.getElementById("date");

    document.getElementById("add").onclick = () => {

      const amount = Number(amountEl.value);

      if (!descEl.value || !dateEl.value || isNaN(amount)) {
        alert("Preencha corretamente os campos");
        return;
      }

      Store.add({
        id: crypto.randomUUID(),
        description: descEl.value.trim(),
        amount,
        category: categoryEl.value.trim().toLowerCase() || "outros",
        date: normalizeDate(dateEl.value)
      });

      descEl.value = "";
      amountEl.value = "";
      categoryEl.value = "";
      dateEl.value = "";

      UI.render();
    };

    document.getElementById("export").onclick = Services.exportCSV;

    document.getElementById("import").onchange = e => {
      const file = e.target.files[0];
      if (file) Services.importExcel(file);
    };

    ["startDate","endDate","categoryFilter"]
      .forEach(id =>
        document.getElementById(id).onchange = UI.render
      );

    document.getElementById("themeToggle").onclick = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";

      const newTheme = isDark ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    };
  };

  return { init };
})();

/* ========= INIT ========= */

const init = () => {
  Store.load();

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  Controller.init();
  UI.render();
};

return { init };

})();

App.init();
