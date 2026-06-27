const App = (() => {
"use strict";

/* ================= STORE ================= */
const Store = (() => {
  const KEY = "finance_saas";

  let state = {
    transactions:[]
  };

  const load = () => {
    const data = localStorage.getItem(KEY);
    if(data) state = JSON.parse(data);
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

  return { load, save, add, set, get };
})();

/* ================= SERVICES ================= */
const Services = (() => {

  const filter = () => {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    const cat = document.getElementById("categoryFilter").value;

    return Store.get().filter(t => {
      return (!start || t.date >= start)
        && (!end || t.date <= end)
        && (!cat || t.category === cat);
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
    const rows = Store.get();

    const csv = rows.map(r =>
      `${r.description},${r.amount},${r.category},${r.date}`
    ).join("\n");

    const blob = new Blob([csv]);
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "data.csv";
    a.click();
  };

  const importExcel = (file) => {
    const reader = new FileReader();

    reader.onload = e => {
      const wb = XLSX.read(e.target.result, { type:"array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const data = json.map(r => ({
        id: Date.now()+Math.random(),
        description: r.Descrição,
        amount: Number(r.Valor),
        category: r.Categoria,
        date: r.Data
      }));

      Store.set(data);
      UI.render();
    };

    reader.readAsArrayBuffer(file);
  };

  return { filter, analytics, exportCSV, importExcel };
})();

/* ================= UI ================= */
const UI = (() => {

  const format = v => v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  const renderList = () => {
    const list = document.getElementById("list");
    list.innerHTML = "";

    Services.filter().forEach(t => {
      const li = document.createElement("li");
      li.textContent = `${t.description} - ${format(t.amount)}`;
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

    select.innerHTML = `<option value="">Todas</option>` +
      cats.map(c=>`<option>${c}</option>`).join("");
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

/* ================= CHARTS ================= */
const Charts = (() => {

  let catChart, monthChart;

  const render = () => {
    const {cat, month} = Services.analytics();

    if(catChart) catChart.destroy();
    if(monthChart) monthChart.destroy();

    catChart = new Chart(document.getElementById("catChart"), {
      type:"pie",
      data:{
        labels:Object.keys(cat),
        datasets:[{data:Object.values(cat)}]
      }
    });

    monthChart = new Chart(document.getElementById("monthChart"), {
      type:"bar",
      data:{
        labels:Object.keys(month),
        datasets:[{data:Object.values(month)}]
      }
    });
  };

  return { render };
})();

/* ================= CONTROLLER ================= */
const Controller = (() => {

  const init = () => {

    document.getElementById("add").onclick = () => {
      Store.add({
        id:Date.now(),
        description:desc.value,
        amount:Number(amount.value),
        category:category.value,
        date:date.value
      });

      UI.render();
    };

    document.getElementById("export").onclick = Services.exportCSV;

    document.getElementById("import").onchange = e =>
      Services.importExcel(e.target.files[0]);

    ["startDate","endDate","categoryFilter"]
      .forEach(id =>
        document.getElementById(id).onchange = UI.render
      );

    document.getElementById("themeToggle").onclick = () => {
      const dark = document.documentElement.getAttribute("data-theme")==="dark";
      document.documentElement.setAttribute("data-theme", dark?"light":"dark");
    };
  };

  return { init };
})();

/* ================= INIT ================= */
const init = () => {
  Store.load();
  Controller.init();
  UI.render();
};

return { init };

})();

App.init();
