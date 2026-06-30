# hasanbuttar.com

Static portfolio website for Hasan Buttar, deployed on GitHub Pages at https://hasanbuttar.com/.

## Structure

- `index.html` - main portfolio page
- `login.html` - lab dashboard login
- `dashboard.html` - lab dashboard for user location records
- `assets/site.css` - custom responsive styling
- `assets/site.js` - small navigation and year helper
- `assets/favicon.svg` - site icon
- `assets/hasan-buttar-profile.jpg` - profile portrait
- `robots.txt` and `sitemap.xml` - search engine metadata

The current homepage is intentionally dependency-free: no build step, no WordPress runtime, and no visitor telemetry or geolocation prompts. The lab dashboard logs in through `https://api.hasanbuttar.com/api/login` and reads from `https://api.hasanbuttar.com/api/getprofiles`.
