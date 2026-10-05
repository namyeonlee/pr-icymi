# Rebuilding after editing the React source

The provided app.js is already built. The scheduled workflow only runs Python and deploys static files.

For source changes, from the ZIP root install dependencies and rebuild:

npm install --no-save react@19.2.6 react-dom@19.2.6 lucide-react@1.31.0 esbuild
npx esbuild source/main.tsx --bundle --format=esm --minify --jsx=automatic --define:process.env.NODE_ENV=\"production\" --outfile=app.js

Upload the rebuilt app.js and its license file. The CSS can be edited directly.
The static site fetches news.json relative to its own path, so repository subpaths work without extra configuration.
