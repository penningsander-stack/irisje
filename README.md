<p align="center">
  <img src="frontend/public/logo.png" alt="Irisje.nl logo" width="180"/>
</p>

# 🌸 Irisje.nl  
**Vergelijk lokale bedrijven & vraag direct offertes – snel, gratis en betrouwbaar.**

---

**Status:**  
![Frontend Deploy](https://github.com/penningsander-stack/irisje/actions/workflows/deploy.yml/badge.svg)
![Backend Deploy](https://github.com/penningsander-stack/irisje/actions/workflows/deploy-backend.yml/badge.svg)
![Cleanup](https://github.com/penningsander-stack/irisje/actions/workflows/cleanup.yml/badge.svg)
![Formatter](https://github.com/penningsander-stack/irisje/actions/workflows/auto-format.yml/badge.svg)
![Linter](https://github.com/penningsander-stack/irisje/actions/workflows/auto-lint.yml/badge.svg)
![HTML-Check](https://github.com/penningsander-stack/irisje/actions/workflows/check-html-layout.yml/badge.svg)

---

## 🧭 Over het project

**Irisje.nl** is een modern platform waar klanten eenvoudig offertes kunnen aanvragen bij betrouwbare lokale bedrijven — vergelijkbaar met Trustoo.nl.  
Bedrijven ontvangen leads, beheren aanvragen via hun eigen dashboard, en klanten kunnen reviews achterlaten.  

De site is ontwikkeld met **Node.js, Express, MongoDB** en een **TailwindCSS-frontend**,  
volledig open-source en met automatische CI/CD via **GitHub Actions**.

---

## 🏗️ Architectuur

```
Irisje.nl
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── admin.html
│   ├── css/style.css
│   └── js/
│       ├── dashboard.js
│       ├── admin.js
│       └── ...
├── backend/
│   ├── server.js
│   ├── models/
│   ├── routes/
│   └── utils/
└── .github/
    └── workflows/
```

- **Frontend:** TailwindCSS + Vanilla JS  
- **Backend:** Express + MongoDB (Mongoose)  
- **Hosting:** [Render.com](https://render.com/)  
- **CI/CD:** GitHub Actions (volledig geautomatiseerd)  

---

## ⚙️ Automatisering & CI/CD

De repository bevat een complete reeks workflows die automatisch controleren, formatteren, opschonen en deployen.

### 🚀 Deploy Workflows
| Workflow | Trigger | Doel |
|-----------|----------|------|
| **🚀 Deploy Irisje.nl Frontend** | Push naar `main` of handmatige start | Stuurt een deploy-trigger naar Render voor de frontend |
| **🚀 Deploy Irisje.nl Backend** | Push naar `main` of handmatige start | Stuurt een deploy-trigger naar Render voor de backend |
| **✅ Irisje.nl Deploy Status** | Na elke succesvolle deploy | Meldt “✅ Irisje.nl succesvol bijgewerkt” in Actions |

### 🧩 Onderhoud & Kwaliteitscontrole
| Workflow | Functie |
|-----------|----------|
| **🔍 Controleer & herstel HTML-layout** | Controleert de HTML-structuur en herstelt fouten |
| **🎨 Auto Formatter** | Formatteert HTML/CSS/JS automatisch met Prettier |
| **🧠 JavaScript Linter** | Controleert JS-codekwaliteit met ESLint |
| **🧹 Repository Cleanup** | Wekelijkse opschoning van oude workflow-runs, artifacts en branches |

### ⚙️ Configuratiebestanden
| Bestand | Beschrijving |
|----------|---------------|
| `.eslintrc.json` | Lint-regels voor JavaScript |
| `.prettierrc` | Formatteringsregels voor HTML/CSS/JS |

### 🔒 Secrets
| Secret | Gebruikt door | Doel |
|---------|----------------|------|
| `RENDER_DEPLOY_HOOK` | `deploy.yml` | Frontend-deploy naar Render |
| `RENDER_BACKEND_HOOK` | `deploy-backend.yml` | Backend-deploy naar Render |

---

## 🧠 Samenvatting van de automatisering

Elke push naar `main` zorgt automatisch voor:  
- ✅ Controle, linting en formatting van de code  
- 🚀 Nieuwe build & deploy op Render (frontend + backend)  
- 🧹 Wekelijkse automatische schoonmaak  
- 🧾 Statusmelding “✅ Irisje.nl succesvol bijgewerkt” in *Actions*

Volledig geautomatiseerd — *geen handmatige deploys meer nodig!* 🚀  

---

## 🧰 Installatie (lokaal testen)

1. **Clone de repository**
   ```bash
   git clone https://github.com/penningsander-stack/irisje.git
   cd irisje
   ```

2. **Installeer afhankelijkheden**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Maak een `.env`-bestand aan**  
   Vul minimaal in:
   ```env
   MONGO_URI=<jouw MongoDB-URI>
   JWT_SECRET=<sterk geheim>
   SMTP_HOST=smtp.irisje.nl
   SMTP_USER=info@irisje.nl
   SMTP_PASS=<wachtwoord>
   ```

4. **Start de server**
   ```bash
   cd backend
   node server.js
   ```

5. **Open de frontend**
   Ga in je browser naar  
   [http://localhost:3000](http://localhost:3000)

---

## 📊 Belangrijkste functies

- 📝 **Aanvraagmodule** – klanten sturen aanvragen naar max. vijf bedrijven  
- 🏢 **Bedrijfsdashboard** – overzicht van aanvragen, filters, statistieken, reviews  
- 💬 **Review-systeem** – klanten kunnen beoordelingen achterlaten  
- ⚙️ **Adminpaneel** – meldingen en beheer van gemelde reviews  
- 💰 **Lead-betaling (Mollie/Stripe)** – voorbereid voor toekomstige integratie  
- 📧 **E-mail via SMTP (PHPMailer)** – klaar voor activatie  

---

## 🧹 Onderhoudstaken (automatisch)
- Verwijdert oude workflow-runs (>14 dagen)  
- Opruimen van artifacts, Node-cache en oude branches  
- Wekelijks uitgevoerd via `cleanup.yml`

---

## 🧩 Technische details

- **Node.js** v22  
- **Express.js**  
- **MongoDB (Mongoose)**  
- **TailwindCSS**  
- **PHPMailer** (SMTP)  
- **Render (deploy)**  
- **GitHub Actions (CI/CD)**  

---

## 🖼️ Toekomstige uitbreidingen

- 🔔 Automatische e-mailnotificaties bij nieuwe aanvragen  
- 💳 Integratie Mollie/Stripe-betalingen  
- 📱 Push-notificaties via PWA-support  
- 🧮 Statistieken-dashboard voor admins  

---

## 👨‍💻 Auteur

**Sander Penning**  
📍 Burgh-Haamstede, Nederland  
📧 info@irisje.nl  

---

### 📜 Licentie
Dit project is auteursrechtelijk beschermd © 2025 **Sander Penning**.  
Gebruik of herpublicatie is alleen toegestaan met schriftelijke toestemming.

---
