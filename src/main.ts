const $ = <T extends HTMLElement>(q: string) => document.querySelector(q)! as T

const picker = $('#picker')
const viewer = $('#viewer')
const btnPick = $('#btnPick') as HTMLButtonElement
const pickStatus = $('#pickStatus') as HTMLParagraphElement

const tablesSel = $('#tables') as HTMLSelectElement
const btnLoad = $('#load') as HTMLButtonElement
const statusEl = $('#status') as HTMLSpanElement;
const grid = $('#grid') as HTMLDivElement
const beforeLoading = $('#before-loading') as HTMLDivElement
const afterLoading = $('#after-loading') as HTMLDivElement
const noDbLabel = $('#no-db') as HTMLDivElement

const searchBar = $('#searchbar') as HTMLDivElement
const searchInput = $('#searchInput') as HTMLInputElement
const searchRun = $('#searchRun') as HTMLButtonElement
const searchClear = $('#searchClear') as HTMLButtonElement

let assetsDir: string | null = null;

window.api.onAssetsDirChanged((dir: string) => {
  assetsDir = dir;
  statusEl.textContent = `Cartella assets: ${dir}`;
  // Se la tabella è già visibile, aggiorna la tabella per abilitare i link "Apri"
  const table = tablesSel.value;
  if (table) {
    window.api.loadRows(table).then(({ columns, rows, foreignKeys }) => {
      renderTable(columns, rows, foreignKeys);
    });
  }
});

btnPick.addEventListener('click', async () => {
  const path = await window.api.pickDb()
  if (!path) { pickStatus.textContent = 'Nessun file selezionato.'; return }
  pickStatus.textContent = `File: ${path}`
  await window.api.openDb(path)

  // passa al viewer
  //picker.style.display = 'none'
  viewer.style.display = 'block'
  beforeLoading.style.display = 'none'
  afterLoading.style.display = 'flex'
  noDbLabel.style.display = 'none'

  const tables = await window.api.getTables()
  tablesSel.innerHTML = tables.map((t: string) => `<option>${t}</option>`).join('')
  statusEl.textContent = `Trovate ${tables.length} tabelle.`
})

btnLoad.addEventListener('click', async () => {
  const table = tablesSel.value
  const { columns, rows, foreignKeys } = await window.api.loadRows(table, 1000)
  renderTable(columns, rows, foreignKeys)
  statusEl.textContent = `Caricate ${rows.length} righe, colonne: ${columns.length}.`
})

// Apertura dalla voce di menu File → Cerca…
window.api.onOpenSearch(() => openSearchBar(searchInput.value))

// Pulsanti nella barra
searchRun.addEventListener('click', runSearch)
searchClear.addEventListener('click', () => { closeSearchBar(); statusEl.textContent = 'Ricerca chiusa.' })

// Tasti: Enter per cercare, Esc per chiudere
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runSearch()
  else if (e.key === 'Escape') closeSearchBar()
})

// Fallback: intercetta Ctrl/⌘+F anche dal renderer (opzionale)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    openSearchBar(searchInput.value)
  }
})

function openSearchBar(initial = '') {
  searchBar.style.display = 'flex'
  searchInput.value = initial
  searchInput.focus()
  searchInput.select()
}

function closeSearchBar() {
  searchBar.style.display = 'none'
  searchInput.value = ''
}

async function runSearch() {
  const table = tablesSel.value
  const q = searchInput.value.trim()
  if (!table) { statusEl.textContent = 'Seleziona una tabella prima di cercare.'; return }
  if (!q) { statusEl.textContent = 'Inserisci un testo da cercare.'; return }
  statusEl.textContent = `Cerco "${q}"...`
  const { columns, rows, foreignKeys } = await window.api.searchRows(table, q, 1000)
  renderTable(columns, rows, foreignKeys)
  statusEl.textContent = `Trovate ${rows.length} righe per "${q}". Premi "Carica" per ripristinare l’intera tabella.`
}

window.api.onExportCsv(async () => {
  await exportCsv();
});

// funzione riusabile per l'export
async function exportCsv() {
  const table = tablesSel.value;
  const { columns, rows } = await window.api.loadRows(table, 100000);
  const header = columns.join(',');
  const lines = rows.map((r: any) =>
    columns.map((c: string) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${table}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function getFileNameFromValue(v: any): string | null {
  if (!v) return null
  const s = String(v)
  try { // caso URL
    const u = new URL(s)
    const name = u.pathname.split('/').pop() || ''
    return name || null
  } catch {
    // non è un URL: se sembra un nome file (ha un’estensione), usalo
    //if (/\.[a-z0-9]{2,8}$/i.test(s)) return s.split('/').pop() || s
    return null
  }
}

function renderTable(
  columns: string[],
  rows: any[],
  foreignKeys: { table: string; from: string; to: string }[] = []
) {
  if (!columns.length) { grid.innerHTML = ''; return }

  const fkMap = new Map<string, { table: string; to: string }>()
  for (const fk of foreignKeys) fkMap.set(fk.from, { table: fk.table, to: fk.to })

  const thead = `<thead><tr>${columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>`
  const tbody = `<tbody>${rows.map(r =>
    `<tr>${columns.map(c => {
      const raw = r[c]
      const txt = esc(val(raw))

      // 1) link FK verso altra tabella (come già facevi)
      if (fkMap.has(c) && raw != null && raw !== '') {
        const fk = fkMap.get(c)!
        return `<td><a href="#" data-fk-table="${fk.table}" data-fk-to="${fk.to}" data-fk-value="${txt}">${txt}</a></td>`
      }

      // 2) se è un URL o un nome file → prepara link "Apri"
      const fileName = getFileNameFromValue(raw)
      if (fileName) {
        const disabled = assetsDir ? '' : 'data-disabled="1" title="Imposta cartella assets dal menu File"'
        return `<td>
          <span>${txt}</span>
          <a href="#" data-asset-file="${esc(fileName)}" ${disabled} style="margin-left:6px">Apri</a>
        </td>`
      }

      return `<td>${txt}</td>`
    }).join('')}</tr>`
  ).join('')}</tbody>`

  grid.innerHTML = `<table>${thead}${tbody}</table>`

  // Delegation: click su link FK
  grid.onclick = async (e) => {
    const target = e.target as HTMLElement

    // Apri asset locale
    const assetLink = target.closest('a[data-asset-file]') as HTMLAnchorElement | null
    if (assetLink) {
      e.preventDefault()
      if (!assetsDir || assetLink.dataset.disabled === '1') {
        statusEl.textContent = 'Seleziona prima la cartella assets dal menu File.'
        return
      }
      const fileName = assetLink.dataset.assetFile!
      const res = await window.api.openAsset(fileName)
      statusEl.textContent = res.ok
        ? `Aperto: ${res.path}`
        : `File non trovato in assets: ${fileName}`
      return
    }

    // Navigazione FK (come prima)
    const fk = target.closest('a[data-fk-table]') as HTMLAnchorElement | null
    if (fk) {
      e.preventDefault()
      const targetTable = fk.dataset.fkTable!
      const targetCol = fk.dataset.fkTo!
      const value = fk.dataset.fkValue!
      statusEl.textContent = `Navigo a ${targetTable}.${targetCol} = ${value} ...`
      const { columns, rows, foreignKeys } = await window.api.loadRowsFiltered(targetTable, value, targetCol)
      const opt = Array.from(tablesSel.options).find(o => o.value === targetTable)
      if (opt) tablesSel.value = targetTable
      renderTable(columns, rows, foreignKeys)
      statusEl.textContent = `Tabella ${targetTable}: ${rows.length} righe (filtrate).`
    }
  }
}

const esc = (s:any) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]!))
const val = (v:any) => v instanceof Uint8Array ? `[${v.length} bytes]` : (v==null? '' : (typeof v==='object'? JSON.stringify(v) : String(v)))