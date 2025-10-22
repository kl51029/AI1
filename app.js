class Todo {
  constructor(root) {
    this.root = root;
    this.listEl = root.querySelector('#list');
    this.inputText = root.querySelector('#newTask');
    this.inputDue = root.querySelector('#newDue');
    this.errEl = root.querySelector('#errors');
    this.searchEl = root.querySelector('#search');
    this.form = root.querySelector('#addForm');

    this.storageKey = 'ai1-lab-b-tasks-v1';
    this.tasks = [];
    this.term = '';
    this.editing = null;

    this.load();
    this.bindUI();
    this.draw();
  }

  bindUI() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.errEl.textContent = '';
      const text = this.inputText.value.trim();
      const dueISO = this.readDueISO();
      const err = this.validate(text, dueISO);
      if (err) { this.errEl.textContent = err; return; }
      this.add(text, dueISO);
      this.inputText.value = '';
      this.inputDue.value = '';
    });

    this.listEl.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const id = li.dataset.id;
      if (e.target.matches('button.del')) {
        this.remove(id);
        return;
      }
      if (e.target.closest('.txt')) {
        this.startEdit(li, id);
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.editing) return;
      const { li } = this.editing;
      if (!li.contains(e.target)) {
        this.commitEdit();
      }
    });

    this.searchEl.addEventListener('input', () => {
      this.term = this.searchEl.value.trim();
      this.draw();
    });
  }

  readDueISO() {
    const ms = this.inputDue.valueAsNumber;
    if (Number.isNaN(ms)) return '';
    try {
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString();
    } catch { return ''; }
  }

  validate(text, dueISO) {
    if (text.length < 3) return 'Zadanie musi mieć ≥ 3 znaki.';
    if (text.length > 255) return 'Zadanie może mieć max 255 znaków.';
    if (dueISO) {
      const now = new Date();
      const due = new Date(dueISO);
      if (due <= now) return 'Data musi być pusta albo w przyszłości.';
    }
    return '';
  }

  add(text, dueISO) {
    const t = { id: crypto.randomUUID(), text, dueISO };
    this.tasks.push(t);
    this.save();
    this.draw();
  }

  remove(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
    this.draw();
  }

  startEdit(li, id) {
    if (this.editing && this.editing.id !== id) this.commitEdit();
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const txtEl = li.querySelector('.txt');
    const dueEl = li.querySelector('.due');

    const txtInput = document.createElement('input');
    txtInput.type = 'text';
    txtInput.value = task.text;
    txtInput.maxLength = 255;
    txtInput.style.width = '100%';

    const dueInput = document.createElement('input');
    dueInput.type = 'datetime-local';
    dueInput.value = task.dueISO ? this.isoToLocal(task.dueISO) : '';

    txtEl.replaceChildren(txtInput);
    dueEl.replaceChildren(dueInput);

    txtInput.focus();

    this.editing = { id, li, txtInput, dueInput };
  }

  commitEdit() {
    if (!this.editing) return;
    const { id, txtInput, dueInput } = this.editing;
    const newText = (txtInput.value || '').trim();
    const newDueISO = (() => {
      try { return dueInput.valueAsNumber ? new Date(dueInput.valueAsNumber).toISOString() : ''; }
      catch { return ''; }
    })();

    const err = this.validate(newText, newDueISO);
    if (!err) {
      const t = this.tasks.find(x => x.id === id);
      if (t) { t.text = newText; t.dueISO = newDueISO; this.save(); }
    }
    this.editing = null;
    this.draw();
  }

  get filtered() {
    const q = this.term.toLowerCase();
    if (q.length < 2) return this.tasks;
    return this.tasks.filter(t => t.text.toLowerCase().includes(q));
  }

  draw() {
    const q = this.term.trim();
    this.listEl.replaceChildren();

    for (const t of this.filtered) {
      const li = document.createElement('li');
      li.dataset.id = t.id;

      const txt = document.createElement('div');
      txt.className = 'txt';
      txt.innerHTML = this.highlight(t.text, q);

      const due = document.createElement('div');
      due.className = 'due';
      due.textContent = t.dueISO ? ('Termin: ' + this.prettyDate(t.dueISO)) : 'Bez terminu';

      const del = document.createElement('button');
      del.className = 'del';
      del.type = 'button';
      del.textContent = 'Usuń';

      li.append(txt, due, del);
      this.listEl.appendChild(li);
    }
  }

  highlight(text, q) {
    if (!q || q.length < 2) return this.escape(text);
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safeQ, 'gi');
    return this.escape(text).replace(re, (m) => `<mark>${m}</mark>`);
  }

  escape(s) {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  prettyDate(iso) {
    try { return new Date(iso).toLocaleString('pl-PL'); }
    catch { return iso; }
  }

  isoToLocal(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.tasks = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(this.tasks)) this.tasks = [];
    } catch { this.tasks = []; }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (!('crypto' in window) || typeof crypto.randomUUID !== 'function') {
    window.crypto = window.crypto || {};
    crypto.randomUUID = function () {
      const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
      return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    };
  }

  try {
    const app = new Todo(document);

    if (app.tasks.length === 0) {
      app.tasks = [
        { id: crypto.randomUUID(), text: 'Kupić mleko', dueISO: '' },
        { id: crypto.randomUUID(), text: 'Skończyć LAB B', dueISO: '' },
        { id: crypto.randomUUID(), text: 'Oddać projekt na GIT', dueISO: '' },
      ];
      app.save();
      app.draw();
    }

    window.todo = app;
  } catch (err) {
    const box = document.getElementById('errors') || document.body;
    const p = document.createElement('pre');
    p.className = 'err';
    p.textContent = 'JS error: ' + (err && err.message ? err.message : String(err));
    box.appendChild(p);
    console.error(err);
  }
});