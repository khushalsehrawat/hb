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

### SEO metadata

All eight HTML pages include page-specific descriptions, developer author/creator metadata, Open Graph metadata and Twitter card metadata. Existing titles, the homepage description, HabbitTracker branding and application behavior are preserved.

The homepage (`index.html`) includes one WebSite JSON-LD block identifying TheBenzzCreations as creator, and one visible developer credit in the existing footer. The developer link uses a normal same-tab hyperlink.

The official public URL has not been supplied. Canonical links, `og:url` and the WebSite `url` are omitted until HabbitTracker's public URL is verified. Do not use the developer website as the application's canonical URL. Social image URLs are omitted until a suitable public preview image is verified. Structured data does not guarantee search rich results.

This static frontend has no package manifest, configured lint suite or build command. Backend-dependent features require the existing Spring Boot API.

## Development & Maintenance

**Developed & Maintained by
[Khushal Sehrawat](https://github.com/khushalsehrawat)**
— Founder of
[TheBenzzCreations](https://www.thebenzzcreations.com/).

TheBenzzCreations is a digital development studio specializing in website development, custom software, mobile applications, e-commerce solutions and AI-powered business automation.

For development enquiries and collaborations, visit [TheBenzzCreations](https://www.thebenzzcreations.com/).
