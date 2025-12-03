# Rodrigo Embalagens

This is a React application built with Vite and Tailwind CSS, using Firebase for backend services.

## Development

To run the application locally in development mode (with hot reloading):

```bash
npm install
npm run dev
```

## Production Build

To build the application for production:

```bash
npm run build
```

This will generate the production artifacts in the `docs/` folder.

## Deployment (GitHub Pages)

This project is configured to be deployed to GitHub Pages using the `docs/` folder.

1.  Commit and push your changes to GitHub.
2.  Go to your repository settings on GitHub.
3.  Navigate to "Pages" in the sidebar.
4.  Under "Build and deployment", select **Deploy from a branch**.
5.  Select your branch (e.g., `main` or `deployment-setup`) and strictly select the **/docs** folder (NOT the root `/`).
6.  Click **Save**.

Your site will be live at `https://<username>.github.io/<repo-name>/`.

### Troubleshooting "Failed to load module script"

If you see an error like `Failed to load module script: ... MIME type of "text/jsx"`, it means you are trying to serve the source code (`index.html` in the root) directly. Browsers cannot run JSX files. You must serve the built application in the `docs/` folder.
