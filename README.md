# Eco Sense AI - Intelligent Environmental Platform

Eco Sense AI is a comprehensive, unified platform integrating five powerful AI solutions designed to foster a greener tomorrow. This main dashboard serves as the central launcher and hub for monitoring, analyzing, and taking action on various environmental metrics.

## 🌟 Modules Included

The platform unifies the following specialized AI solutions:

1. **🌳 GreenPath AI** (`http://localhost:5000`)
   - Intelligent environmental route planning and analysis.
2. **🌍 GeoGuardian** (`http://localhost:3000`)
   - Geographical monitoring and environmental protection.
3. **🍃 CarbonWise AI** (`http://localhost:5173`)
   - Carbon footprint tracking and emission reduction intelligence.
4. **🧠 EcoMind AI** (`http://localhost:5174`)
   - Knowledge base and AI-driven insights for sustainable practices.
5. **🌱 Plantwise AI** (`http://localhost:5175`)
   - Plant health monitoring and agricultural intelligence.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [Python 3.x](https://www.python.org/) installed
- `npm` (Node Package Manager)

### Installation & Setup

1. **Install Root Dependencies**
   Navigate to the root directory and install the launcher dependencies:
   ```bash
   npm install
   ```

2. **Set Up Python Virtual Environments**
   Each backend module requires its own environment. Ensure you have properly set up the virtual environments in their respective directories (e.g., `ECO MIND AI/backend`, `Plantwise AI/backend`, `GreenPath AI/GreenPath AI`) and installed their required dependencies.

3. **Install Sub-module Dependencies**
   Run `npm install` inside the respective frontend directories (e.g., `carbonwise-ai-main`, `geoguardian-main`, `ECO MIND AI/frontend`, `Plantwise AI/frontend`).

### Running the Platform

You can start the entire platform with a single command:

```bash
npm run dev
```

This will launch the **Unified Dashboard** on [http://localhost:8000](http://localhost:8000) and concurrently start all other sub-modules in the background.

## 🏗️ Architecture & Scripts

The root `package.json` provides granular control over individual services. You can start them independently using:

- `npm run dev:dashboard`: Starts only the main Vite dashboard.
- `npm run dev:carbonwise`: Starts CarbonWise AI frontend.
- `npm run dev:geoguardian`: Starts GeoGuardian frontend.
- `npm run dev:ecomind`: Concurrently starts EcoMind AI backend (Uvicorn/FastAPI) & frontend.
- `npm run dev:plantwise`: Concurrently starts Plantwise AI backend (Uvicorn/FastAPI) & frontend.
- `npm run dev:greenpath`: Starts GreenPath AI Python backend.

## 🎨 Technology Stack
- **Dashboard Launcher**: HTML5, CSS3, Vite
- **Frontends**: React / Vite
- **Backends**: Python, FastAPI, Uvicorn, Flask
- **Process Management**: `concurrently` for seamless multi-module startup

---
*Built for a greener tomorrow.*
