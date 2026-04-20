# 📝 TGNAS No Due Form Generator - SRIT

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://lolakshay.github.io/no-due-form-srit/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**TGNAS No Due Form Generator** is a specialized web utility designed for students at **Sri Ramakrishna Institute of Technology (SRIT)**. It automates the tedious process of filling out "No Due" or "Clearance" forms by dynamically generating a professional PDF pre-filled with subjects, elective units, and faculty details.

---

## 🚀 Key Features

- **Department-Wise Automation**: Supports CSE, ECE, EEE, IT, and ME departments with tailored curriculum data.
- **Dynamic Semester Loading**: Automatically fetches subjects based on the selected semester.
- **Intelligent Elective Handling**: Dynamically substitutes "Professional Elective" and "Open Elective" placeholders with specific subject lists.
- **Interactive Drag-and-Drop**: Rearrange subject order easily with a custom HTML5 drag-and-drop interface (Touch-enabled for mobile!).
- **Searchable Dropdowns**: Custom-built searchable UI for quick faculty and subject selection.
- **Client-Side PDF Merging**: Merges user-generated tables with official institutional PDF templates entirely in the browser.
- **Mobile Optimized**: Responsive design with a specific "Hold-to-Drag" feature for smartphones.
- **SEO Ready**: Optimized with JSON-LD structured data, meta-tags, and semantic HTML for high search discoverability.

---

## 🛠 Technical Stack

- **Frontend**: Vanilla HTML5, CSS3 (Modern Responsive Layout), Vanilla JavaScript (ES6+).
- **Libraries**:
  - [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable): For generating the dynamic table PDF.
  - [pdf-lib](https://github.com/Hopding/pdf-lib): For merging the generated table with the official background template.
  - [mobile-drag-drop](https://github.com/timruffles/mobile-drag-drop): Polyfill for touch-screen drag-and-drop support.
- **Data Persistence**: Local browser processing (Zero server-side storage for maximum privacy).

---

## 📂 Project Structure

```text
├── database/
│   ├── cse_dept-semester-wise-subjects.json  # Semester-specific subjects
│   ├── elective-cse.json                     # Department-specific electives
│   ├── faculty.json                          # Centralized faculty list
│   └── ... (similar for other departments)
├── supporting-docs/
│   └── no-due-default.pdf                    # Official SRIT PDF Template
├── index.html                                # Main Entry Point
├── script.js                                 # Core Logic & PDF Engines
├── style.css                                 # Modern Responsive UI
├── sitemap.xml                               # For SEO Indexing
└── robots.txt                                # Crawler Instructions
```

---

## 🔧 How to Use

1. **Select Department**: Choose your major to load the correct database.
2. **Select Semester**: Academic subjects for that specific semester will appear.
3. **Add Subjects**:
   - Click **Add All Regular Subjects** to populate the table instantly.
   - Use **Add Custom Subject** for one-off units.
4. **Assign Faculty**: Use the searchable dropdown in the table to assign professors to each subject.
5. **Reorder & Finalize**: Drag the `↕` handles to reorder rows.
6. **Download**: Click **Download PDF** to get your merged, ready-to-print clearance form.

---

## 📈 SEO Performance

This project is built with a focus on discoverability:
- **Semantic HTML**: Uses `<main>`, `<article>`, and `<header>` tags.
- **JSON-LD**: Includes Schema.org `SoftwareApplication` markup for Google "Rich Snippets".
- **Responsive Web Design**: Passes mobile-friendly tests.
- **Metadata**: Pre-configured Social Graph (Open Graph/Twitter) tags for professional link sharing.

---

## 🤝 Contributing

Created with ❤️ for the SRIT student community. Feel free to fork and suggest improvements via PRs!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
