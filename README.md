# Family SaaS Monorepo

Welcome to the **Family SaaS** project repository. This monorepo contains the central application, documentation, and the Velzon SaaS demo.

## 🚀 Quick Start

This repository is organized into three main components:

| Component | Path | Description |
| --- | --- | --- |
| **Main App** | [`/project`](./project) | The core SaaS application (Inertia.js + Laravel). |
| **Velzon Demo** | [`/velzon/Saas`](./velzon/Saas) | A production-ready SaaS demo using the Velzon theme. |
| **Documentation** | [`/docs`](./docs) | Technical guides and onboarding documentation. |

## 🛠️ Infrastructure Overview

The application is deployed on **Ubuntu** with the following stack:
- **Web Server**: Nginx (serving via PHP-FPM)
- **Domain**: `appsah.my.id`
- **Subdomain**: `velzon.appsah.my.id`
- **Process Manager**: PM2 (Handling Queue Workers, Reverb, and Docs)

## 📖 Documentation

Detailed documentation is available at [https://docs.appsah.my.id](https://docs.appsah.my.id).

To run documentation locally:
```bash
npm run docs:dev
```

## 🔐 Credentials (Demo)
- **Email**: `admin@themesbrand.com`
- **Password**: `password`

---
Copyright © 2026 mutihakim
