# Fuqiao Xue Website

Personal website for Fuqiao Xue.

The site is built with [Hexo](https://hexo.io/) and a custom local theme named
`fuqiao-xue`.

## Requirements

- Node.js
- npm

## Getting Started

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run server
```

The site is served at <http://localhost:4000/>.

## Common Commands

```sh
npm run clean   # Remove generated output
npm run build   # Generate the static site in public/
npm test        # Run the Node.js test suite
```

## Project Structure

```text
source/                  Site content
source/_posts/           Writing posts
source/_data/projects.yml
source/_data/talks.yml   Data-driven project and talk listings
themes/fuqiao-xue/       Custom Hexo theme
scaffolds/post.md        Default front matter for new posts
tests/                   Configuration, content, and build-output tests
public/                  Generated site output
```

## Content Notes

- English writing lives in `source/_posts/` with `lang: en`.
- Primary pages live under `source/`, including `writing`, `projects`, `talks`,
  `about`, and `zh-Hans`.
- Projects and talks are maintained through YAML data files in `source/_data/`.
- Generated files in `public/` should be rebuilt with `npm run build` instead of
  edited directly.

## Verification

Before publishing changes, run:

```sh
npm test
npm run build
```
