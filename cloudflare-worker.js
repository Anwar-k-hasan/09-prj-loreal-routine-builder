// Cloudflare Worker script to proxy requests to OpenAI
// Save this as your Worker script and set a Worker secret named OPENAI_API_KEY

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "OPENAI_API_KEY not configured in Worker environment",
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Build messages for OpenAI. If `selected` is provided, attach it as a system message
    const messages = Array.isArray(body.messages) ? [...body.messages] : [];
    if (body.selected) {
      try {
        const productsJson = JSON.stringify(body.selected);
        messages.unshift({
          role: "system",
          content: "PRODUCTS_JSON:" + productsJson,
        });
      } catch (e) {
        // ignore serialization errors
      }
    }

    // Optional: allow passing model and other params from client, with safe defaults
    const model = body.model || "gpt-4o";
    const max_tokens = body.max_tokens || 300;
    const temperature =
      typeof body.temperature === "number" ? body.temperature : 0.8;

    const requestBody = {
      model,
      messages,
      max_tokens,
      temperature,
    };

    try {
      const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await apiRes.json();

      // Simplify the response for the client: return assistant text in `result` where possible
      const assistantText =
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
          ? data.choices[0].message.content
          : null;

      return new Response(
        JSON.stringify({ success: true, result: assistantText, raw: data }),
        { headers: corsHeaders }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Request failed", details: String(err) }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
