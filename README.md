# hasanbuttar.com

Static portfolio website for Hasan Buttar, deployed on GitHub Pages at https://hasanbuttar.com/.

## Structure

- `index.html` - main portfolio page
- `login.html` - lab dashboard login
- `dashboard.html` - lab dashboard for user location records
- `assets/site.css` - custom responsive styling
- `assets/site.js` - navigation, year helper, and explicit location consent flow
- `assets/favicon.svg` - site icon
- `assets/hasan-buttar-profile.jpg` - profile portrait
- `robots.txt` and `sitemap.xml` - search engine metadata

The current homepage is intentionally dependency-free: no build step and no WordPress runtime. On first scroll, it records approximate IP-based location through `https://ipwho.is/` and posts the result to `https://api.hasanbuttar.com/api/updateprofile`. The precise browser location flow remains explicit opt-in and posts only after the visitor taps the location button and responds to the browser permission prompt. The lab dashboard logs in through `https://api.hasanbuttar.com/api/login` and reads from `https://api.hasanbuttar.com/api/getprofiles`.
