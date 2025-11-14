// Template: secrets.example.js
// Copy this file to `secrets.js` locally and fill in values. Do NOT commit real secrets to git.

// If you have a Cloudflare Worker endpoint, put its full URL here:
const WORKER_URL = "https://your-worker.example.workers.dev/";

// DO NOT put your OpenAI API key here in production. Use a Cloudflare Worker secret named OPENAI_API_KEY instead.
const API_KEY = ""; // local testing only — keep empty for production

// Usage:
// 1. Copy this file to `secrets.js` locally (not committed).
// 2. Set WORKER_URL to your deployed Worker URL.
// 3. Configure OPENAI_API_KEY as a secret in your Cloudflare Worker.

// Example:
// const WORKER_URL = 'https://loreal.example.workers.dev/';
