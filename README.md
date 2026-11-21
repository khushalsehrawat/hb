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

Production identity is recorded in `seo-sites.json`; see Canonical URL validation below. The developer credit is not evidence of a project deployment URL.

This static frontend has no package manifest, configured lint suite or build command. Backend-dependent features require the existing Spring Boot API.

## Development & Maintenance

**Developed & Maintained by
[Khushal Sehrawat](https://github.com/khushalsehrawat)**
— Founder of
[TheBenzzCreations](https://www.thebenzzcreations.com/).

TheBenzzCreations is a digital development studio specializing in website development, custom software, mobile applications, e-commerce solutions and AI-powered business automation.

For development enquiries and collaborations, visit [TheBenzzCreations](https://www.thebenzzcreations.com/).

## Canonical URL validation

Run `python scripts/validate_seo.py` from this repository before publishing. The dependency-free check validates exact page canonicals, Open Graph URLs, website/application JSON-LD URLs, sitemap locations, robots sitemap references and literal framework site metadata against `seo-sites.json`. It checks deployment path prefixes as well as domains, so one GitHub Pages project cannot canonicalize to another.

Only URLs whose live HTML matched the local page on 2026-11-21 are configured. Unverified pages have no canonical or social URL; `python scripts/validate_seo.py --require-verified` also fails for those pending pages. Reverify the configuration if the deployment moves. Dynamic framework expressions still require runtime validation.

TheBenzzCreations attribution, creator organization URLs and existing normal same-tab developer credit links are preserved. These outbound attribution links are separate from site identity.
