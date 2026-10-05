# Mohasby (محاسبي) — Design Plan & Architectural Blueprint

## 1. Palette Tokens (Sampled from Essentra)

The palette is derived directly from Essentra: deep pine greens, crisp canvas, pure white card surfaces, 1px structural hairlines, and warm rose-accent highlights. No leftover olive, cream, or brass tokens exist.

| Token Name | Hex Code | Role & Usage | Contrast Ratio (WCAG) |
| :--- | :--- | :--- | :--- |
| `--green-950` | `#040E0B` | Deep pine dark panel background, footer base, contrast text on accent | 10.74:1 on `--accent-500` (AAA) |
| `--green-900` | `#071C18` | Primary button hover state | 17.67:1 with white text (AAA) |
| `--green-700` | `#1F4E42` | **Primary Brand Color**: Primary buttons, headlines, input focus border | 9.43:1 with white text (AAA) |
| `--canvas` | `#F7F5F3` | **Page Background Canvas**: Crisp warm foundation | Baseline canvas |
| `--white` | `#FFFFFF` | Card surfaces, inputs, forms, modal backgrounds | 16.01:1 against `--ink-900` |
| `--border` | `#E4E0DC` | 1px hairline border, structural column separators | Hairline structural boundary |
| `--accent-500` | `#E8B4A8` | **Accent Token**: Single primary CTA, audited tick marks, focus ring | 10.74:1 with `--green-950` text (AAA) |
| `--accent-600` | `#D89A8C` | Hover state for accent CTA | 8.32:1 with `--green-950` text (AAA) |
| `--ink-900` | `#1C2321` | High-contrast primary reading text, numbers, balances | 16.01:1 on white (AAA), 14.72:1 on canvas (AAA) |
| `--ink-600` | `#6B7370` | Secondary descriptive text on white cards only | 4.87:1 on white (AA). On canvas: 4.48:1 |
| `--ink-canvas` | `#58605D` | Darkened secondary text for canvas surfaces | 5.95:1 on canvas (AA) |
| `--danger` | `#B4514A` | Negative amounts `(25,000.00)`, error states | 4.98:1 on white (AA) |
| `--success` | `#4C7A5E` | Reconciled indicators, audited tags | 4.94:1 on white (AA) |

---

## 2. Typography Strategy

| Role | Family | Weights | Characteristics & Usage |
| :--- | :--- | :--- | :--- |
| **Arabic Display** | `Noto Kufi Arabic` | 600, 700, 800 | Architectural, balanced, geometric, horizontal baseline dignity. Used for main headlines. Never slanted/italic. |
| **Body & Interface** | `IBM Plex Sans Arabic` | 400, 500, 600 | Clear counters, exceptional legibility at 13–15px, native Arabic curves. Used for all body text, forms, and tables. |
| **Numbers & Figures** | `IBM Plex Sans Arabic` | 500, 600 | Set to `font-variant-numeric: tabular-nums` across all journals and tables. Digits align vertically to prevent column wobble. |
| **Latin Display** | `Familjen Grotesk` | 600, 700 | Distinctive European industrial grotesk; pairs with Kufi geometry without looking like standard Inter/Helvetica. |

---

## 3. Egyptian Accounting Specifics (5 Core Principles)

1. **The Distrust of Hidden Formulas (Excel Scars):**
   Egyptian accountants in agricultural export (stations in Sadat, Nubaria, Badr) and cold storage manage millions in volatile seasonal crops (potatoes, citrus, onions). A single corrupted Excel formula can hide a 500,000 EGP deficit. Mohasby's visual language emphasizes *strict, un-editable journal lineage* over flashy graphs.
2. **Double-Entry Equilibrium as Visual Truth:**
   In Egyptian fiscal law and commercial audits, an unbalanced voucher is a legal liability. The primary visual focal point of the platform is the **Balanced Journal Entry** (`متزن ✓`), flanked by single rules (subtotals) and double rules (grand totals).
3. **Weight Slips & Shrinkage Reality:**
   Unlike generic SaaS software that treats inventory as simple integers, Egyptian storage involves gross weight, tare weight, dust/shrinkage deductions, and lot numbers. The layout treats these data points with tabular respect rather than decorative badges.
4. **Bilingual Dual-Currency Realities (EGP & USD):**
   Agricultural exporters calculate farm purchase costs in Egyptian Pounds (`ج.م`) and freight/port clearance in US Dollars (`USD`). Numerical columns support side-by-side currency columns with explicit `<bdi>` directional isolation.
5. **Seriousness Over Slogans:**
   Accountants do not want "revolutionary AI breakthroughs". They demand audit logs, permission gates, and exportability. The copy and structure reflect the tone of a seasoned senior auditor.

---

## 4. Layout Architecture & ASCII Wireframes

### 4.1 Login Page (`/login`)
**One-sentence concept:** A balanced split-screen where the dark olive brand panel anchors the dignity of the ledger on the reading-start side while the cream form panel offers a distraction-free, accessible entry point.

#### Desktop (RTL — 1440px):
```
+------------------------------------------------------+------------------------------------------------+
| [START / RIGHT: 52% Brand Panel - Olive-800]         | [END / LEFT: 48% Form Panel - Paper-100 Grain] |
|                                                      |                                                |
|                                                      |  [Lang Switch: EN | عربي]                      |
|  [Logo Lockup: Monogram + محاسبي + mohasby]           |                                                |
|                                                      |  [Small Logo Mark]                             |
|  "كل قيد في مكانه."                                  |  أهلًا بعودتك                                  |
|  نظام محاسبي متزن للشركات المصرية                    |  سجّل الدخول لمتابعة دفاترك                    |
|                                                      |                                                |
|  +------------------------------------------------+  |  [ Alert Banner (if error, role="alert") ]     |
|  | [Ruled ledger card: faint horizontal lines]    |  |                                                |
|  | قيد افتتاح #101              15/09/2026        |  |  البريد الإلكتروني                             |
|  | مدين   حساب البنك الأهلي ..... 500,000.00      |  |  [ demo@mohasby.app                        ]   |
|  | دائن   رأس المال ............. 500,000.00      |  |                                                |
|  | ============================================== |  |  كلمة المرور                                   |
|  | المجموع 500,000.00   500,000.00    ✓ متزن      |  |  [ ••••••••••••                        👁 ]   |
|  +------------------------------------------------+  |                                                |
|                                                      |  [X] تذكرني                  نسيت كلمة المرور؟ |
|  خادم سحابي مشفر • قيود غير قابلة للتلاعب            |                                                |
|                                                      |  [ زر سجّل الدخول (Olive-700 / Full Width) ]    |
|                                                      |                                                |
+------------------------------------------------------+------------------------------------------------+
```

#### Mobile (375px):
```
+------------------------------------------+
| [Brand Header: 120px - Olive-800]        |
| [Logo] محاسبي      [Lang: EN | عربي]     |
| "كل قيد في مكانه."                       |
+------------------------------------------+
| [Form Body - Paper-100 Grain]            |
| أهلًا بعودتك                             |
| سجّل الدخول لمتابعة دفاترك               |
|                                          |
| البريد الإلكتروني                        |
| [ input                                ] |
|                                          |
| كلمة المرور                              |
| [ input                              👁] |
|                                          |
| [X] تذكرني             نسيت كلمة المرور؟ |
|                                          |
| [ زر سجّل الدخول ]                       |
+------------------------------------------+
```

---

### 4.2 Landing Page (`/`)
**One-sentence concept:** An editorial financial journey from the historical discipline of bound ledgers to the clarity of modern Egyptian cloud accounting, centered on a real-time self-writing journal card and a physical Excel-to-Ledger comparison slider.

#### Desktop (RTL — 1440px):
```
+-------------------------------------------------------------------------------------------------------+
| [Sticky Header: Transparent over hero -> Solid Paper-50 with 1px border on scroll]                   |
| [Logo] محاسبي      المميزات   القطاعات   كيف يعمل   الأسعار   الأسئلة      [EN|عربي]  [دخول] [ابدأ مجانًا] |
+-------------------------------------------------------------------------------------------------------+
| [HERO: Full Viewport, Atmospheric Olive-950 Overlay on hero-desk.jpg, Depth 100vh]                    |
|                                                                                                       |
| (Start / Right Column - 58%)                         (End / Left Column - 42%)                        |
| [● برنامج محاسبة عربي للشركات المصرية]              +-----------------------------------------------+ |
|                                                     | [REAL HTML JOURNAL CARD: Paper texture]       | |
| حساباتك متزنة                                       | قيد يومية #1042                    15/09/2026 | |
| من أول قيد.                                         | --------------------------------------------- | |
|                                                     | مدين   المشتريات ................ 250,000.00  | |
| قيود اليومية والمخازن والثلاجات ومراكز التكلفة      | مدين   ضريبة القيمة المضافة .....  35,000.00  | |
| والبنوك والمرتبات، في دفتر واحد يراجع نفسه...        | دائن   الموردون ................. 285,000.00  | |
|                                                     | ============================================= | |
| [ ابدأ تجربتك المجانية (Brass) ] [ شاهد كيف يعمل ]  | المجموع  285,000.00   285,000.00      ✓ متزن  | |
|                                                     +-----------------------------------------------+ |
| ----------------------------------------------------------------------------------------------------- |
| [Facts Row]: (1) قيد مزدوج صلب          (2) عربي من الأساس             (3) قوائم مالية جاهزة          |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 2: EXCEL COMPARISON SLIDER (#how)]                                                           |
| "من ورقة الإكسيل إلى دفتر لا ينسى"                                                                   |
| [ Interactive Before/After Splitter: Messy Excel sheet with #REF! <---> Clean Ledger with Double Rule] |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 3: MODULES INDEX (#features) - Editorial Table, NOT Card Grids]                              |
| (Start: Index rows with Dotted Leaders)              (End: Interactive Live Preview HTML Panel)       |
| • القيود واليومية ...................... سجّل مرة    +-----------------------------------------------+ |
| • المخازن والثلاجات ................... أذونات       | [Dynamic live preview swaps on hover/focus:   | |
| • مراكز التكلفة ....................... تكلفة أرض    |  Shows actual stock lot / voucher structure]   | |
| • البنوك والشيكات ..................... كشف حساب     +-----------------------------------------------+ |
| • المرتبات • القوائم المالية • الفاتورة (قريبًا)                                                     |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 4: SECTORS STRIP - Quiet Paper-200 band with storage.jpg editorial bleed]                    |
| [تجارة الجملة]    |    [تخزين وتبريد]    |    [تصنيع وتعبئة]    |    [زراعة وتصدير]                   |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 5: HOW IT WORKS - Horizontal sequence with ledger ruling]                                    |
| 1. استورد أرصدتك من Excel   --------->   2. سجّل وراجع   --------->   3. أقفل الفترة                  |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 6: REPORT PREVIEW - Trial Balance with Tabular Numbers & Accounting Double-Rule Totals]       |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 7: TRUST & COMPLIANCE - 4 text-led statements (Audit log, Permissions, Backup, Export)]      |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 8: PRICING - 3 asymmetrical tiers; middle Pro tier elevated in Olive-700]                    |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 9: FAQ - Hairline Accordion with 260ms smooth expand/collapse]                               |
+-------------------------------------------------------------------------------------------------------+
| [SECTION 10: FINAL CTA BAND - Olive-800 textured band with receipts.jpg and Brass CTA]                |
+-------------------------------------------------------------------------------------------------------+
| [FOOTER - Complete semantic footer, schema JSON-LD, sitemap, legal & copyright]                       |
+-------------------------------------------------------------------------------------------------------+
```

---

## 5. Anti-AI Design Critique (Self-Audit & Revision Log)

| Element Under Scrutiny | Initial "Generic SaaS" Habit | The Critique (Why It Screams Template/AI) | The Revised Mohasby Solution & Rationale |
| :--- | :--- | :--- | :--- |
| **Modules / Features** | 3x2 grid of rounded cards with Lucide icons in colored rounded circles. | Every AI landing page uses identical square cards with an icon on top, a generic 3-word title, and a 2-line blurb. | **Replaced with an Editorial Ledger Index.** Rows with authentic dotted leaders (`LeaderRow`) and hairline rules. Hovering swaps a live interactive HTML preview on the opposite side. |
| **Headlines** | Dual-gradient text accenting the last word in bright neon or gold (`متزنة <gradient>من أول قيد</gradient>`). | The two-tone gradient headline trick is the #1 tell of 2024 AI sites. | **Solid monochromatic Noto Kufi 800.** Dignified, clear, uniform contrast. The emphasis comes from typographic scale and whitespace, not coloring individual words. |
| **Hero Graphic** | A floating 3D dashboard mockup tilted at a 15-degree angle with artificial drop shadows. | Tilted dashboard screenshots look like template placeholders and lack tactile authenticity. | **Live Real-time Typing Journal Card.** A flat, high-density paper-textured HTML card where debits and credits type out, compute, draw a double rule, and display an official brass tick mark. |
| **Icons** | Lucide icons or emoji (`✨`, `🚀`, `💡`). | Emoji and sparkles destroy credibility for accounting software handling Egyptian Tax audits. | **Bespoke 1.5px Olive SVGs with Brass Accents** + Phosphor Light. Zero sparkles, zero emojis. |
| **CTA Buttons** | Bright purple/indigo gradient pill with a sparkle icon and a right arrow `→`. | Generic AI SaaS staple. Arrows often break or point backward in RTL Arabic. | **Structured Brass-500 Rectangle (Radius 10px)** with top inner highlight (`inset 0 1px 0 rgba(255,255,255,.28)`). No arrows. Direct verb action ("ابدأ تجربتك المجانية"). |
| **Arabic Typography** | Slanted faux-italic Arabic or letter-spaced headings. | Arabic letters are cursive; tracking/letter-spacing breaks connections and slanted Arabic looks broken and amateurish. | **Strictly connected IBM Plex Sans Arabic + Noto Kufi Arabic.** Zero letter spacing on Arabic strings; `text-wrap: balance` to prevent orphan words. |

---

## 6. Logo Design & Monogram Exploration (Part 4)

Three distinct monogram directions were explored:
1. **Direction 1 (The Balance Beam):** The letter **م** whose descending tail elongates horizontally to form the rigid beam of an analytical balance scale.
2. **Direction 2 (The Audited Counter):** The circular head of the letter **م** contains a miniature precision brass tick mark (`✓`) signifying balance, equilibrium, and audit approval.
3. **Direction 3 (The Folded Ledger):** A geometric letter **م** merged with the folded upper corner of an official ledger sheet.

**Decision & Rationale:**
**Direction 2 (The Audited Counter with Tick Mark)** is chosen as the primary brand mark. 
*Why:* At 16×16px (favicon scale) and on invoice stamps, the balance beam in Direction 1 becomes illegible hairline noise, while the folded corner in Direction 3 reads like a generic document icon. Direction 2 keeps the bold, unmistakable geometric silhouette of the Arabic Meem (`م`) while integrating the accent tick mark directly into its negative space—communicating "Balanced & Certified" instantly in one color.

---

## 7. Regenerated Photography Prompts Table (Essentra Color Grade)

Image color grade: **deep pine-green shadows (`#040E0B`, `#071C18`), warm white highlights (`#FFFFFF`, `#F7F5F3`), subtle film grain, and clean documentary contrast.** No faces, no smiling stock models, no neon, no purple.

| File | Resolution | Regenerated Prompt (Deep Pine-Green & Warm White Grade) |
|---|---|---|
| `hero-desk.jpg` | 2400×1350 (16:9) | Editorial documentary photograph of an Egyptian senior accountant's desk at dusk: an open bound financial ledger with faint green rule lines, a vintage pen, a desk calculator displaying balanced numbers, a glass cup of traditional black tea with mint, warm white side light from a tall window, deep pine-green wall softly out of focus, film grain, muted pine and warm white palette with rose-brass accents, no text, no logos, no faces, photorealistic. |
| `storage.jpg` | 1800×1200 (3:2) | Industrial documentary photo of an Egyptian agricultural cold-storage facility in Sadat City: towering aisles of stacked wooden produce crates and burlap sacks of export potatoes, cool high window light, atmospheric refrigeration mist, deep pine-green shadows, warm incandescent inspection lamp in background, wide angle, strictly no people, authentic documentary. |
| `receipts.jpg` | 1600×1200 (4:3) | Macro close-up of a neat stack of Egyptian commercial invoices and tax receipts held by a solid metal paper clip on a warm white wooden desk, fountain pen resting nearby, shallow depth of field, natural window lighting, deep pine shadows with warm white paper highlights, no legible text. |
| `ledger-texture.jpg` | 1600×1600 (1:1) | Archival macro texture of ruled accounting ledger paper with a faint crimson margin rule, crisp warm white tone, soft directional shadow at left edge, strictly no text. |

> **Negative Prompt for all images:** fake text, watermarks, distorted hands, extra fingers, cartoon, 3D render, purple, neon, stock-photo smiling people.

---

## 8. Dashboard Shell Layout & Architecture (Front-End Foundation)

### 8.1 Concept & Operational Context
The Mohasby dashboard transitions an Egyptian commercial/agricultural enterprise from a massive 46-sheet Excel workbook (`حسابات عامة.xlsx`) to a high-density, ergonomic web interface. The Excel's `Home` sheet was an 8-column navigation board linking to every sheet. In the web dashboard:
- The 8 pillars become **collapsible sidebar groups**.
- The underlying sheets become **44 distinct, typed pages**.
- The primary reading direction is **Arabic (RTL)** with seamless English (LTR) mirroring.
- Zero fake data, zero decorative AI blobs, zero bouncy cartoon animations.

---

### 8.2 ASCII Wireframes

#### A. Desktop Expanded Viewport (1440px — Arabic RTL)
```
+-------------------------------------------------------------------------------------------------------------------+
| [CONTENT AREA: Canvas #F7F5F3 - Max Width 1440px]                             | [SIDEBAR: 280px - Green-700]      |
|                                                                               |                                   |
| +---------------------------------------------------------------------------+ | [Logo: White Lockup - 64px]       |
| | [TOPBAR: 64px - White #FFFFFF - Border-b #E4E0DC]                         | | محاسبي mohasby                    |
| |                                                                           | |-----------------------------------|
| |  [User Profile]  [🔔]  [عربي|EN]  [ ابحث عن صفحة... ⌘K ]   [الرئيسية / دليل الحسابات] | [الرئيسية]                        |
| +---------------------------------------------------------------------------+ |                                   |
|                                                                               | [v] القوائم المالية (Active Group)|
| +---------------------------------------------------------------------------+ |  |-- دليل الحسابات  [Active Bar 3px]
| | [PAGE HEADER]                                                             | |  |-- أرصدة افتتاحية               |
| | دليل الحسابات                                                             | |  |-- قيود اليومية                 |
| | شجرة الحسابات بأكوادها وطبيعة كل حساب.              [ Actions Slot ]     | |  |--------------------------------|
| +---------------------------------------------------------------------------+ |  |-- الأستاذ العام                |
|                                                                               |  |-- كشف حساب                     |
| +---------------------------------------------------------------------------+ |  |-- ميزان المراجعة               |
| | [PLACEHOLDER CARD / EMPTY STATE: White Surface #FFFFFF - Radius 12px]     | |  |-- تسوية حسابات                 |
| |                                                                           | |  |-- تسويات جردية                 |
| |  [Status Tag: قيد الإعداد]                                                 | |  |-- إهلاك الأصول                 |
| |                                                                           | |  |--------------------------------|
| |  هذه الصفحة قيد الإعداد                                                   | |  |-- قائمة الدخل                  |
| |  شجرة الحسابات بأكوادها وطبيعة كل حساب ستظهر هنا بكافة مستوياتها.         | |  |-- أرباح وخسائر                 |
| |                                                                           | |  |-- قائمة المركز المالي          |
| |  [ زر العودة إلى الرئيسية (Ghost) ]                                        | |                                   |
| |                                                                           | | [>] المخازن                       |
| |                                                                           | | [>] الثلاجات                      |
| |                                                                           | | [>] المعاملات البنكية              |
| |                                                                           | | [>] التكاليف                      |
| |                                                                           | | [>] التقارير                      |
| |                                                                           | | [>] شؤون العاملين                 |
| |                                                                           | | [>] الضبط                         |
| |                                                                           | |-----------------------------------|
| |                                                                           | | [<-] طي القائمة (Collapse Rail)   |
| +---------------------------------------------------------------------------+ +-----------------------------------+
```

#### B. Desktop Collapsed Rail with Open Flyout (1440px — Arabic RTL)
```
+-------------------------------------------------------------+-----------------------+---------------------+
| [CONTENT AREA: Canvas #F7F5F3]                              | [FLYOUT PANEL: 264px] | [RAIL: 76px]        |
|                                                             | [White #FFF - Elev.]  | [Green-700]         |
| +---------------------------------------------------------+ |                       |                     |
| | [TOPBAR: 64px]                                          | | القوائم المالية       | [Logo Mark]         |
| |  [User] [🔔] [EN] [ ابحث عن صفحة ⌘K ]   [الرئيسية / ...]  | |---------------------| [Home Icon]         |
| +---------------------------------------------------------+ | دليل الحسابات  [*]    | [Book Icon - Active]|
|                                                             | أرصدة افتتاحية        | [Boxes Icon]        |
|                                                             | قيود اليومية          | [Snowflake Icon]    |
|                                                             | --------------------- | [Bank Icon]         |
|                                                             | الأستاذ العام         | [Calculator Icon]   |
|                                                             | كشف حساب              | [ChartBar Icon]     |
|                                                             | ميزان المراجعة        | [Users Icon]        |
|                                                             | ...                   | [Sliders Icon]      |
|                                                             |                       | ------------------- |
|                                                             |                       | [->] (Expand)       |
+-------------------------------------------------------------+-----------------------+---------------------+
```

#### C. Mobile Drawer (375px & 768px Viewport — Arabic RTL)
```
+------------------------------------------+  +------------------------------------------+
| [MOBILE DRAWER: 300px - Green-700]       |  | [MOBILE TOPBAR: 56px - Canvas Background]|
| (Scrim overlay over background content)  |  |                                          |
|                                          |  | [Menu ☰]     دليل الحسابات       [User 👤] |
| [Logo: محاسبي]                [Close ✕]  |  +------------------------------------------+
| ---------------------------------------- |  | [PAGE TITLE: 18px Bold Noto Kufi]        |
| [الرئيسية]                                |  | دليل الحسابات                            |
|                                          |  | شجرة الحسابات بأكوادها وطبيعة كل حساب.   |
| [v] القوائم المالية                      |  +------------------------------------------+
|   |-- دليل الحسابات             [*]      |  | [PLACEHOLDER CARD: 16px Padding]         |
|   |-- أرصدة افتتاحية                     |  |                                          |
|   |-- قيود اليومية                       |  | هذه الصفحة قيد الإعداد                   |
|   |-- الأستاذ العام                      |  |                                          |
| [>] المخازن                              |  | [ زر العودة للرئيسية ]                   |
| [>] الثلاجات                             |  +------------------------------------------+
| [>] المعاملات البنكية                    |
| [>] التكاليف                             |
| [>] التقارير                             |
| [>] شؤون العاملين                        |
| [>] الضبط                                |
+------------------------------------------+
```

---

### 8.3 Dashboard Shell Critique & Revision Log

| Design Vector | Initial Naive/AI Instinct | The Critique (Operational Flaws) | Revised Mohasby Architecture |
| :--- | :--- | :--- | :--- |
| **Sidebar Hierarchy** | Giving every sub-page its own colorful Lucide icon inside the menu. | 44 icons create visual chaos and visual noise; users cannot scan 17 financial statement items quickly when their eyes are bombarded by meaningless icons. | **Hierarchical Typography & Guide Line:** Sub-items are clean text-only rows (14px, weight 400), connected by a subtle 1px vertical guide line (`rgba(255,255,255,0.14)`). Only the 8 parent groups carry purposeful icons. |
| **Sidebar Active State** | Filling the whole active button in high-contrast solid neon green or bright orange. | Vibrantly colored active blocks overpower the page content and tire the accountant's eyes during 8-hour ledger shifts. | **Subtle Accent Wash + 3px Precision End-Edge Bar:** Background is `--accent-500` at 14% (`#E8B4A8/14`) with a sharp 3px vertical accent bar at the reading edge. High-contrast white text (weight 600). |
| **Nested Group Clusters** | Labeling sub-headers ("Basic Statements", "Advanced Ledger") inside accordion menus. | Creates unnecessary cognitive layers and vertical bloat in already long lists. | **Hairline Separator Clusters:** Logical clusters (e.g. core setups vs ledger vs final statements) are demarcated solely by a quiet 1px hairline (`rgba(255,255,255,0.10)`) with 8px vertical breathing room. |
| **Breadcrumbs & Page Title** | Giant hero banner on top of every dashboard page with gradients and decorative illustrations. | Wastes valuable vertical screen space where table data and ledger vouchers need to start as high as possible. | **Compact Sticky Topbar (64px) + Lean Page Header:** Breadcrumb shows exact ancestry (`الرئيسية / القوائم المالية / دليل الحسابات`). Page header is an uncluttered, single-line title + description + hairline. |
| **Empty States for Placeholders** | Cartoon illustrations of people holding giant blank papers or empty boxes. | Demeans enterprise accounting software. Accountants look at screens for operational clarity, not stock illustrations. | **Text-Led Minimal Dignity:** A crisp white surface with a subtle muted status tag (`قيد الإعداد`), an exact operational purpose statement derived from the company's ledger requirements, and a clean ghost CTA back to home. |
| **RTL Alignment & Isolation** | Hardcoding `pr-` or `pl-` classes, or letting digits/shortcuts flip inconsistently. | In RTL, English shortcuts like `Ctrl K` or `dd/mm/yyyy` dates get scrambled into inverted syntax (`K Ctrl` or `yyyy/mm/dd`). | **Logical Properties + `<bdi>` Isolates:** Use `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`. All shortcut badges, codes, and numerical data wrapped in `<bdi dir="ltr">` or `tabular-nums`. |
