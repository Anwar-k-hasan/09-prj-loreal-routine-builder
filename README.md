# Project 9: L'Oréal Routine Builder

L’Oréal is expanding what’s possible with AI, and now your chatbot is getting smarter. This week, you’ll upgrade it into a product-aware routine builder.

Users will be able to browse real L’Oréal brand products, select the ones they want, and generate a personalized routine using AI. They can also ask follow-up questions about their routine—just like chatting with a real advisor.

## Local development & Cloudflare Worker

- The app saves selected products and chat history to `localStorage` so selections persist after reloads.
- For production, configure a Cloudflare Worker (recommended) to proxy requests to OpenAI. Set the full Worker URL in `secrets.js` by replacing the `WORKER_URL` constant. Example:

```js
const WORKER_URL = "https://your-worker.example.workers.dev/routine";
```

- Do NOT keep your OpenAI API key in `secrets.js` for production. The repo includes `API_KEY` only for quick testing and demos.

If you need help creating a simple Cloudflare Worker to proxy requests, tell me and I can scaffold one that accepts a JSON { messages, selected } payload and forwards it to the OpenAI API using a secret stored in the Worker.
