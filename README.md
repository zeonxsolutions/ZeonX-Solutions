# ZeonX Solutions Website

## Included pages
- Home page with detailed content, domains, duration and fee structure
- About page
- Intern ID verification page
- One login page for students and admin
- Student dashboard with profile, projects, GitHub submission and documents
- Admin dashboard with student list, status, add/delete student and extra projects
- Google Sheets + Apps Script backend
- Offer letter and certificate PDF automation

## Demo login
Student: student@demo.com / student123
Admin: admin@zeonx.com / admin123

## Connect Google Sheets
1. Create a new Google Sheet.
2. Open Extensions > Apps Script.
3. Paste `apps-script/Code.gs` and add `appsscript.json`.
4. Run `setupZeonX()` once and allow permissions.
5. In the Settings sheet, change the admin password and paste Google Docs template IDs and output Drive folder ID.
6. Your Google Docs templates should contain: `{{NAME}}`, `{{INTERN_ID}}`, `{{DOMAIN}}`, `{{DURATION}}`, and `{{DATE}}`.
7. Deploy Apps Script as Web app: Execute as Me; access Anyone.
8. Copy the deployment URL into `assets/js/config.js` as `API_URL`.
9. Change `DEMO_MODE` to `false`.

## Payment and document workflow
- Registration button opens the supplied Google Form.
- After payment is checked, add the student through Admin Dashboard or Sheet.
- `confirmPayment({internId})` generates and emails the offer letter.
- Admin project approval can call `approveProject({internId,index})`.
- When completed project count reaches required project count, the certificate is generated and emailed automatically.

## Hosting
Upload the complete folder to Netlify, GitHub Pages, Hostinger, or any static hosting service. Do not open the HTML directly using `file://` for production.

## Important security note
For a public production portal, use hashed passwords or Google authentication. The included Apps Script version is suitable for a small basic portal but should be strengthened before storing sensitive personal data.


## Google Sheets live database

1. Create a Google Sheet and open Extensions > Apps Script.
2. Paste `apps-script/Code.gs`, save, and run `setupZeonX()` once.
3. Deploy as Web app: Execute as Me; access Anyone.
4. Copy the `/exec` URL into `assets/js/config.js`.
5. Set `DEMO_MODE:false`.

### Sheets created
- Students: student login and internship details.
- Projects: Intern ID, Student Name, Student Email, project title, GitHub URL, status and submission time.
- Settings: admin credentials and document configuration.

The website reads the sheet on every load and refreshes every 30 seconds. Manual edits in Google Sheets therefore appear on the website after Refresh, refocus, or within 30 seconds.
