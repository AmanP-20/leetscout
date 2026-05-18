# LeetScout

LeetScout is an advanced, high-performance web application designed to reconstruct and playback real-time typing events and code replays from LeetCode contests.

## Features
- **God-Level UI**: A sleek, "Deep Space" themed interface featuring glassmorphism and macOS-inspired window frames.
- **Real-Time Replay Engine**: Precisely recreates keystrokes, multi-cursor edits, and template flushes exactly as they happened using a highly optimized `requestAnimationFrame` virtual timeline.
- **Zero-Lag Syntax Highlighting**: Custom, extremely fast syntax tokenizer that processes C++, Python, Java, and JS natively via `dangerouslySetInnerHTML` without causing React DOM thrashing.
- **Full-Stack Architecture**: Next.js 15 App Router frontend paired with an Express.js backend proxy to securely interface with LeetCode's undocumented GraphQL API.

## Project Structure
- `/frontend`: Next.js 15 application (App Router, Tailwind CSS, Lucide Icons).
- `/backend`: Node.js Express server acting as a GraphQL proxy and data aggregator.

## Getting Started

1. Clone the repository
2. Install dependencies for both backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Create a `.env` file in the root directory.
4. Start the unified development server:
   ```bash
   cd frontend
   npm run dev
   ```
   *(Note: The frontend `server.ts` seamlessly proxies API requests to the backend logic.)*

## Technologies Used
- Next.js 15
- React 19
- Tailwind CSS
- Express.js
- GraphQL Fetch API
