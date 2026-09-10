# News Chronicle AI

An intelligent multilingual newspaper analysis and entity-tracking platform. Upload scanned newspapers (OCR), then search for a name or entity and view results on a timeline with summaries in the language of your choice.

Built with React 19, TanStack Start, Tailwind CSS v4, and shadcn/ui.

## Run locally in VS Code

### Requirements

- **Node.js 20.19+ or 22.12+** — install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (`nvm install 22`)
- npm (comes with Node)

### Steps

```sh
# 1. Get the code
git clone <your-repository-url>
cd <repository-name>

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open **http://localhost:8080** in your browser. Edits you make in VS Code hot-reload automatically.

### Other commands

```sh
npm run build      # production build
npm run preview    # preview the production build
npm run lint       # run ESLint
npm run format     # format with Prettier
```

### Project structure

```text
src/
  routes/            Pages: / (Uploads), /search, /settings
  components/        Sidebar, language modal, UI primitives
  lib/news-context.tsx   App state: uploaded files, search, timeline results
  styles.css         Theme tokens (slate + indigo palette)
```

## Notes

- No backend or environment variables are required — the app runs with built-in sample data.
- To keep editing in Lovable, connect the project to GitHub; changes sync both ways.
