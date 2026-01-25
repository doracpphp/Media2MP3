# Secure Media Converter

A secure media conversion tool that runs entirely in the browser. Convert audio and video files to MP3.

## Features

- **Fully Client-Side Processing**: Files are never sent to a server; all conversion happens in your browser
- **Privacy-Focused**: No uploads required, completely secure
- **Supported Formats**: WAV, M4A, MP4, MOV, AVI, MKV, and more
- **Free**: Completely free to use

## Tech Stack

- React 19
- TypeScript
- Vite
- FFmpeg (WebAssembly)

## Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and set the required values.

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_GA_ID` | Google Analytics ID |

## Development

### Start Development Server

```bash
npm run dev
```

### Run Linter

```bash
npm run lint
```

### Preview Build

```bash
npm run preview
```

## Build

### Production Build

```bash
npm run build
```

Build output will be in the `dist` directory.

### Deploy to Cloudflare Pages

```bash
npm run build && npx wrangler pages deploy dist --project-name=audio-converter
```

## License

MIT
