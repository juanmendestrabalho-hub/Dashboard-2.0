:root {
  --bg:#ffffff;
  --text:#222;
}

[data-theme="dark"] {
  --bg:#121212;
  --text:#ffffff;
}

body {
  background:var(--bg);
  color:var(--text);
  font-family:sans-serif;
  margin:0;
}

header {
  display:flex;
  justify-content:space-between;
  padding:1rem;
  background:#4CAF50;
  color:white;
}

.container {
  max-width:900px;
  margin:auto;
  padding:1rem;
}

.filters, .form, .actions {
  display:flex;
  gap:0.5rem;
  flex-wrap:wrap;
  margin-bottom:1rem;
}

input, button, select {
  padding:0.6rem;
  border-radius:5px;
  border:1px solid #ccc;
}

button {
  cursor:pointer;
  background:#4CAF50;
  color:white;
}

ul {
  list-style:none;
  padding:0;
}

li {
  padding:0.5rem;
  border-bottom:1px solid #ccc;
}
