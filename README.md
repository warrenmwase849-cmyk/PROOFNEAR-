# PROOFNEAR starter website

This is a front-end prototype for the PROOFNEAR employment and services marketplace.

## Files
- `index.html` — page structure
- `styles.css` — responsive visual design
- `app.js` — demo listings, filtering and preview forms

## Run it on a computer
1. Extract the ZIP.
2. Open `index.html` in Chrome, Edge or Firefox.
3. Try the search, category buttons, listing filters and "Post an opportunity" form.

## Publish a free prototype with Cloudflare Pages
1. Create a free GitHub account at https://github.com/ and a free Cloudflare account at https://dash.cloudflare.com/
2. Create a GitHub repository named `proofnear`.
3. Upload the three website files to the repository root.
4. In Cloudflare, open Workers & Pages, choose Create, then Pages, then Connect to Git.
5. Select the `proofnear` repository. For a plain HTML site, leave the build command blank and set the output directory to `/` (or `.` if the interface asks for a relative directory).
6. Deploy. Cloudflare will provide a temporary `*.pages.dev` web address.

## Important prototype limitations
- The listings are sample/demo data, not real jobs.
- Form submissions only create a preview in the browser; they are not saved or sent.
- There is no login, database, payment collection, messaging, identity verification or moderation backend yet.
- Do not enter real personal information into this prototype.
- Before commercial recruitment activity, obtain Ugandan legal advice on recruitment-agency licensing and data protection obligations.

Next development milestone: connect Supabase for real user accounts, worker profiles, job/service listings and admin moderation.
