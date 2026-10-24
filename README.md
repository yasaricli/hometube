# HomeTube

Your own video library for the homelab. Paste a YouTube link, HomeTube downloads the video to your server, and it shows up on a familiar home page where you can watch it any time, even when the original is gone or you're offline.

## Features

- **Add by link.** Click **Add video**, paste a YouTube link (watch, youtu.be, shorts, embed or live URLs) and press **Fetch**.
- **Live download progress.** Each video shows a progress bar on its card while it downloads; downloads run one at a time and resume after a restart.
- **Plays everywhere.** Videos are saved as MP4 (H.264, up to 1080p) with the thumbnail, so every browser can play and seek them.
- **Channels.** Videos are grouped by their YouTube channel automatically, each with its own page.
- **Categories.** Create categories in the sidebar, filter the home page with the chips on top, and set a video's category when you add it or on its page.
- **Search** across titles and channel names.
- **Light and dark** themes follow your system.

## Use it responsibly

HomeTube is meant for a private homelab: download only videos you have the right to keep (your own uploads, content with a permissive license, or where the creator allows it), keep the server on your private network, and don't share the library publicly. Downloading may be against YouTube's Terms of Service; you are responsible for how you use it.

## Install with Docker Compose

Requirements: Docker with the Compose plugin.

```sh
git clone <this repository> hometube
cd hometube
docker compose up -d --build
```

Open **http://localhost:3100** and click **Add video**.

Videos are stored in the `media` folder next to `compose.yaml` (one folder per video with `video.mp4` and `thumb.jpg`); the library itself lives in MongoDB's `mongo-data` volume. yt-dlp updates itself every time the container starts, so a `docker compose restart app` fixes most "can't download" errors after YouTube changes something.

To store videos somewhere else, for example on a NAS mount, put your own settings in `compose.override.yaml`:

```yaml
services:
  app:
    volumes: !override
      - /mnt/nas/videos:/media
```

## Updating

To move an existing install to the latest version, run this in the `hometube` folder:

```sh
git pull
docker compose pull mongo
docker compose up -d --build
```

Your videos stay in `media` and the library in the `mongo-data` volume; there is no migration step. Downloads that were running pick up where they left off.

## Configuration

All three variables are required; the app exits with `missing env X` if one is absent. Compose sets them for you.

| Variable      | Example                               |
| ------------- | ------------------------------------- |
| `MONGODB_URI` | `mongodb://localhost:27017/hometube` |
| `PORT`        | `3100`                                |
| `MEDIA_DIR`   | `./media`                             |

## Local development

Requires Node.js 24, MongoDB, [yt-dlp](https://github.com/yt-dlp/yt-dlp) and ffmpeg on your `PATH`.

```sh
cp .env.example .env
npm install
npm run dev     # http://localhost:3100
npm test        # YouTube link parsing self-check
```

## How it works

A single Node process (`server.js`) runs Next.js, socket.io and the download queue. Adding a link reads the video's details with `yt-dlp -J`, saves it to MongoDB and queues it; the queue runs `yt-dlp` and streams its progress to every open browser. Finished files are served from `/media/<id>/…` with HTTP range support, so the player can seek.

Stack: Next.js, React, zustand, SCSS modules, socket.io, MongoDB (mongoose), yt-dlp, ffmpeg.

## License

[MIT](LICENSE)
