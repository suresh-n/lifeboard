# Milestones

A colorful, responsive Kanban board for personal goals and tasks — add a task, set a priority, and move it through **To do → In progress → Done**. Works entirely offline in the browser, and can optionally sync to a Google Sheet you own, so your data never sits on anyone else's server.

- No sign-up, no account, no backend required to try it
- Your data stays in your own browser (and optionally your own Google Sheet)
- Takes about 10 minutes to set up the free hosted version

---


## 1. Try it with no setup

Download `index.html` and open it directly in a browser (double-click it, or drag it into a browser tab). You can add tasks, set priority, and drag cards between columns right away — everything is saved to your browser's local storage. This works even without doing anything below.

The steps below are only needed if you want your board reachable from **any device**, at a real URL, backed by a Google Sheet you can open and edit yourself.

---

## 2. Host the board on GitHub Pages (free, ~5 minutes)

1. Create a free [GitHub](https://github.com) account if you don't have one.
2. Create a new **public** repository — name it anything, e.g. `my-milestones`.
3. Upload `index.html` to that repository (use "Add file → Upload files" in the GitHub web UI, or `git push` if you're comfortable with Git).
4. In the repository, go to **Settings → Pages**.
5. Under "Build and deployment," set **Source: Deploy from a branch**, branch: `main`, folder: `/ (root)`. Save.
6. Wait a minute or two, then GitHub will show your live URL — something like:
   ```
   https://<your-username>.github.io/my-milestones/
   ```

That's your board's permanent address. Open it on your phone, bookmark it, share the link — it works the same as the local file, just reachable from anywhere.

---

## 3. Connect it to your own Google Sheet (optional but recommended)

Without this step, your tasks only live in the browser you're using — clearing browser data or switching devices loses them. Connecting a Sheet gives you a real, permanent, cross-device copy of your data that you fully own and can open like any spreadsheet.

### 3a. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Rename the first tab (bottom-left) to exactly: `Tasks`
3. In row 1, add these column headers exactly as written, one per cell, left to right:
   ```
   id | title | category | priority | status | dueDate | notes | order | createdAt | updatedAt
   ```

### 3b. Add the backend script

1. In your Sheet, go to **Extensions → Apps Script**. (Important: it must be opened this way, *from inside the Sheet* — not as a separate project at script.google.com — so the script is correctly linked to your Sheet.)
2. Delete any starter code in the editor, then paste in the full contents of `Code.gs` (included with this project).
3. Click the **Save** icon (or Ctrl/Cmd+S).

### 3c. Set your secret token

This token is what keeps your data private — without it, anyone who ever discovers your script's URL could read or write your tasks.

1. Still in the Apps Script editor, click the **gear icon (Project Settings)** on the left sidebar.
2. Scroll to **Script Properties → Add script property**.
3. Property name: `AUTH_TOKEN`
   Value: any long random string you make up (e.g. mash your keyboard for 20+ characters). Save it somewhere — you'll paste the same value into the app in a moment.
4. Click **Save script properties**.

### 3d. Deploy it as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Execute as:** Me
   - **Who has access:** Anyone

   *(This must say exactly "Anyone" — not "Anyone with a Google account." That setting is what makes the URL reachable from your GitHub Pages site. Your token from step 3c is what keeps it actually private.)*
4. Click **Deploy**. The first time, Google will ask you to authorize the script — click through the consent screens (you'll see an "unverified app" warning since this is your own personal script; click **Advanced → Go to [project name] (unsafe)** to proceed — this is expected for private scripts you write yourself).
5. Copy the **Web app URL** shown — it ends in `/exec`. This is the address your board will talk to.

### 3e. Connect the board

1. Open your GitHub Pages link (or the local `index.html`).
2. Click the **gear icon** (top right).
3. Paste the `/exec` URL into **Apps Script Web App URL**.
4. Paste your token from step 3c into **Auth token**.
5. Click **Test & save**. You should see "Connected to your sheet."

From now on, every task you add, edit, move, or delete saves locally first (so it's instant and works offline) and syncs to your Sheet in the background. Any card that hasn't synced yet shows a small "Not synced" tag, and a red dot appears on the settings gear if anything is still pending.

---

## 4. If something goes wrong

**"CORS error" or "403 Forbidden" in the browser console when syncing:**
- Re-check step 3b — the script must be opened via Extensions → Apps Script *from the Sheet*, not as a standalone project.
- Re-check step 3d — after *any* edit to `Code.gs`, you must deploy again: **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. Just saving the code doesn't update the live URL.
- Confirm "Who has access" is exactly **Anyone**.
- Paste your `/exec` URL directly into a new browser tab. You should see raw text like `[]`. If you instead see a Google sign-in page, the access setting in step 3d is wrong.

**Tasks aren't showing up in the Sheet:**
- Open the Sheet and confirm the tab is named exactly `Tasks` and the header row matches step 3a exactly (case-sensitive).

**Lost your token:**
- Go back to Apps Script → Project Settings → Script Properties, and either read or reset the `AUTH_TOKEN` value, then update it in the board's Settings too.

---

## 5. Customizing

Everything — colors, categories, priorities — lives near the top of the `<script>` section in `index.html`:

```js
const CATEGORIES = [
  {id:'home', label:'Home', color:'var(--cat-home)'},
  ...
];
```

Add, remove, or rename categories and priorities there, and adjust their colors in the `:root` CSS variables near the top of the `<style>` section (e.g. `--cat-home`, `--pri-high`).

---

## Privacy note

Nobody's data is shared between users of this project — every person who sets this up creates their **own** Sheet, their **own** Apps Script deployment, and their **own** token. There's no shared server anywhere. Your tasks only ever touch your browser and your Google account.
