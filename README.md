# EduSync Data Viewer

**EduSync Data Viewer** is a **cross-platform** application (macOS Apple Silicon and Windows x64) developed with **Electron + Vite**.
It allows you to **open SQLite databases offline**, explore their tables, navigate relationships via **foreign key**, search within the data, and **export to CSV**.

> Designed to offer permanent access to data even after an online service subscription ends.

---

## ✨ Features

- 🔌 **Open SQLite databases** from `.db`, `.sqlite`, `.sqlite3` files
- 📑 **Automatic table listing** present in the DB
- 🔗 **Table navigation via foreign key**
- 🔍 **Full-text search** (find matches in any column)
- 📤 **Export CSV** of the current table
- 📁 **Local resource support**: ability to associate a folder containing offline assets
- 🖥 **Native interface**: integrated menu with macOS and Windows

---

## 🚀 Installation

Download the latest release for your operating system from the **[Releases](https://github.com/Edu-Sync/eva-viewer/releases)** section.

### macOS (Apple Silicon)
- Download the `.dmg` file
- Open and drag the application to `Applications`
- If the message “unidentified developer” appears, open with **right click → Open** the first time

### Windows (x64)
- Download the `.exe` installer
- Run and follow the guided steps

---

## 🛠 For Developers

Clone the repo and run locally:

```bash
git clone https://github.com/Edu-Sync/eva-viewer.git
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
![Screenshot 1](https://github.com/Edu-Sync/eva-viewer/blob/main/assets/images/screenshot.png?raw=true)

## License
Distributed under the MIT License. See `LICENSE` for more information.