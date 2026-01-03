## HabbitTracker Frontend (Luxury UI)

This is a static HTML + Bootstrap + JS frontend for the HabbitTracker Spring Boot API.

### Run

1. Start the backend on `http://localhost:8080`.
2. Start VS Code Live Server from `Frontend/index.html` (often runs on `http://127.0.0.1:5500`).
3. If you get CORS errors in the browser, your backend must allow your frontend origin (ex: `http://127.0.0.1:5500`) in CORS.
4. Open the URL Live Server shows (example: `http://127.0.0.1:5500/index.html`).

### Backend connection

All backend calls are isolated in:
- `Frontend/src/js/config.js` (base URL)
- `Frontend/src/js/endpoints.js` (all endpoint paths in one place)
- `Frontend/src/js/api.js` (fetch wrapper + grouped API functions)

Theme changes live in:
- `Frontend/assets/css/theme.css`
- `Frontend/assets/css/app.css`
