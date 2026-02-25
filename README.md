# Desintesa MVP

**Demo en vivo:** [https://nicco6482.github.io/desintesa/frontend/](https://nicco6482.github.io/desintesa/frontend/)

MVP Full-Stack para gestion de servicios de control de plagas y desinfeccion.

## Estructura de carpetas

```text
MVP DESINTESA/
  backend/
    package.json
    .env.example
    src/
      index.js
      data/orders.json
      routes/orders.js
      schema/serviceOrder.schema.json
      utils/dataStore.js
  frontend/
    package.json
    .env.example
    index.html
    postcss.config.js
    tailwind.config.js
    vite.config.js
    src/
      App.jsx
      main.jsx
      index.css
      components/
        Dashboard.jsx
        ServiceOrders.jsx
        Agenda.jsx
        CertificateView.jsx
      services/api.js
      utils/pdf.js
```

## Backend (Express + JSON DB)

```bash
cd backend
npm install
npm run dev
```

API base: `http://localhost:4000/api`

Endpoints clave:
- `GET /orders`
- `POST /orders`
- `PUT /orders/:id`
- `DELETE /orders/:id`
- `GET /dashboard/:clientId`
- `GET /agenda`
- `POST /orders/:id/issue-certificate`
- `GET /orders/:id/certificate`

## Frontend (React + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Regla de validacion implementada

- La `nextVisitDate` siempre debe ser posterior a `applicationDate` (validada en frontend y backend).
