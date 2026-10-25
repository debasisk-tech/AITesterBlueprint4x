# 💼 Local-First Job Tracker (Kanban)

A modern, fast, local-first Job Application Tracker built as a single-page React application with Vite, Tailwind CSS, and IndexedDB via the `idb` library.

---

## 🚀 Quick Start

From the `Chapter_Jobtracker` directory:

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the Vite local development server
npm run dev

# 3. Open in your browser (typically http://localhost:5173)
```

To build for production:
```bash
npm run build
npm run preview
```

---

## ✨ Features

- **100% Local-First & Offline**: All application cards, resume tags, and timestamps are stored securely in your browser's **IndexedDB** (`JobTrackerDB`) with zero server roundtrips or logins needed.
- **Kanban Pipeline**: Drag-and-drop cards between 6 customizable stages:
  1. **Wishlist** — Saved jobs to review & prepare
  2. **Applied** — Application submitted
  3. **Follow-up** — Followed up with recruiter / referral
  4. **Interview** — Active interview rounds
  5. **Offer** — Offer received
  6. **Rejected** — Not moving forward
- **Card Data Model**:
  - Company name & Job title / role (with validation)
  - Clickable LinkedIn job URL (opens target tab directly)
  - Resume tag (e.g., `SDE_Resume_v3`, `QA_Lead_Resume`) with autocomplete & quick pills
  - Date applied with dynamic relative tags (`Applied today`, `Applied 3d ago`)
  - Salary range (e.g. `₹25-30 LPA` or `$150-180K`)
  - Notes for recruiter contact info, referral context, and interview notes
  - Status & Column mapping with status-specific accent borders
- **Smooth Drag-and-Drop**: Built using `@dnd-kit/core` and `@dnd-kit/sortable` with collision detection and drag overlays.
- **Search & Filters**:
  - Instant live search by Company name, Role, or Notes
  - Filter by Resume version tag
  - Sort by Newest Applied, Oldest Applied, Company (A-Z), or Role (A-Z)
  - Column header count badges
- **Backup & Restore**:
  - Export all IndexedDB jobs and resumes as a timestamped `.json` file
  - Restore / import JSON backups anytime with a single click
- **Theme Support**: Seamless Light / Dark mode toggle with persisted preference.
- **Independent Column Scrolling**: Linear / Trello-inspired sleek layout with custom slim scrollbars.

---

## 🛠️ Architecture

```
Chapter_Jobtracker/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── constants/
    │   └── columns.js       # Column definitions, colors, initial resumes
    ├── db/
    │   └── indexedDB.js     # IndexedDB wrapper using 'idb' with seed data
    ├── utils/
    │   └── dateUtils.js     # Relative days ago & formatted date helpers
    └── components/
        ├── Navbar.jsx            # Brand, theme toggle, stats, quick add
        ├── FilterBar.jsx         # Search, resume filter, sorting controls
        ├── KanbanBoard.jsx       # DndContext & drag overlay orchestration
        ├── KanbanColumn.jsx      # Column droppable container & card lists
        ├── JobCard.jsx           # Draggable job card with metadata & actions
        ├── JobModal.jsx          # Add & Edit modal with field validation
        ├── DeleteConfirmModal.jsx # Confirmation dialog before deleting
        └── BackupModal.jsx       # JSON export and restore modal
```

