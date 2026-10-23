# Split Cheslax into two Git repositories

The original monorepo stays untouched as `origin`. Do **not** force-push or delete it.

`backend/` is the backend repository tree. `frontend/` is the frontend repository tree. Each already has its own `.gitignore`, `.env.example`, Dockerfile, and README.

## Option A — preserve subdirectory history (`git subtree`)

Run from a clean clone of this repository:

```bash
git subtree split -P backend -b cheslax-be
git subtree split -P frontend -b cheslax-fe

mkdir -p ../cheslax-be ../cheslax-fe
git clone --branch cheslax-be --single-branch . ../cheslax-be
git clone --branch cheslax-fe --single-branch . ../cheslax-fe
```

In each new clone, make `main` the default branch and add a **new** remote when you are ready (GitHub/GitLab/etc.). Do not push over `khanglt1701/ChesLax`.

```bash
cd ../cheslax-be
git checkout -B main
git remote remove origin
git remote add origin git@github.com:<you>/cheslax-be.git
# git push -u origin main   # only after you create the empty remote

cd ../cheslax-fe
git checkout -B main
git remote remove origin
git remote add origin git@github.com:<you>/cheslax-fe.git
# git push -u origin main
```

Trade-off: history contains only commits that touched that subdirectory. Root files (`README.md`, `deploy/`) stay in the original monorepo.

Copy `deploy/nginx/cheslax.conf` into the frontend repo or onto the VPS after the split.

## Option B — fresh history (simpler, loses old commits)

```bash
rsync -a --exclude .git backend/ ../cheslax-be/
rsync -a --exclude .git frontend/ ../cheslax-fe/
cd ../cheslax-be && git init && git add . && git commit -m "Initial Cheslax API repository."
cd ../cheslax-fe && git init && git add . && git commit -m "Initial Cheslax frontend repository."
```

Do not nest a `.git` directory inside the other project.

## After the split

1. Generate `frontend/package-lock.json` in the FE repo with `npm install` if it is missing.
2. Keep `server/` (legacy Socket.IO) only in the original monorepo; it is not part of either new repo.
3. Production secrets live in `/etc` or a root-owned `.env` on the VPS, never in Git.
