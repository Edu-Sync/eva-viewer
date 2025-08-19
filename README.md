# EduSync Data Viewer

**EduSync Data Viewer** è un'applicazione **cross-platform** (macOS Apple Silicon e Windows x64) sviluppata con **Electron + Vite**.  
Permette di **aprire database SQLite offline**, esplorarne le tabelle, navigare le relazioni tramite **foreign key**, cercare all’interno dei dati e **esportare in CSV**.

> Pensato per offrire un accesso permanente ai dati anche dopo la fine di un abbonamento a servizi online.

---

## ✨ Funzionalità

- 🔌 **Apertura database SQLite** da file `.db`, `.sqlite`, `.sqlite3`  
- 📑 **Elenco automatico delle tabelle** presenti nel DB  
- 🔗 **Navigazione tra tabelle tramite foreign key**  
- 🔍 **Ricerca full-text** (trova corrispondenze in qualsiasi colonna)  
- 📤 **Export CSV** della tabella corrente  
- 📁 **Supporto a risorse locali**: possibilità di associare una cartella contenente asset offline  
- 🖥 **Interfaccia nativa**: menu integrato con macOS e Windows

---

## 🚀 Installazione

Scarica l’ultima release per il tuo sistema operativo dalla sezione **[Releases](https://github.com/Edu-Sync/eva-viewer/releases)**.

### macOS (Apple Silicon)
- Scarica il file `.dmg`
- Apri e trascina l’applicazione in `Applicazioni`
- Se compare il messaggio “sviluppatore non identificato”, apri con **clic destro → Apri** la prima volta

### Windows (x64)
- Scarica l’installer `.exe`
- Esegui e segui i passaggi guidati

---

## 🛠 Per sviluppatori

Clona la repo ed esegui in locale:

```bash
git clone https://github.com/<TUO-USERNAME>/eva-viewer.git
cd eva-viewer
npm install
npm run dev
```

### Build produzione

```bash
npm run build:mac
npm run build:win
```

## Screenshots
![Screenshot 1](./screenshots/screenshot1.png)

## Licenza
Distribuito sotto la licenza MIT. Vedi `LICENSE` per ulteriori informazioni.