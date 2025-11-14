/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

// App state
let allProducts = [];
let selectedProductIds = new Set();
let chatHistory = []; // {role: 'user'|'assistant'|'system', content: '...'}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Create HTML for product cards with description toggle */
function displayProducts(products) {
  if (!products || products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">No products found for this category.</div>`;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (p) => `
    <div class="product-card" data-id="${p.id}">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="brand">${p.brand}</p>
        <button class="toggle-desc" aria-expanded="false">Show description</button>
        <div class="description" style="display:none; margin-top:8px; font-size:14px; color:#444;">${p.description}</div>
      </div>
    </div>
  `
    )
    .join("");

  // Re-apply selection styles for previously selected items
  selectedProductIds.forEach((id) => {
    const card = productsContainer.querySelector(
      `.product-card[data-id='${id}']`
    );
    if (card) card.classList.add("selected");
  });
}

/* Update the Selected Products panel from selectedProductIds */
function renderSelectedProducts() {
  const selected = [...selectedProductIds]
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean);
  if (selected.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected</div>`;
    return;
  }

  selectedProductsList.innerHTML =
    selected
      .map(
        (p) => `
      <div class="selected-item" data-id="${p.id}" style="border:1px solid #ccc;padding:8px;border-radius:6px;display:flex;align-items:center;gap:8px;">
        <img src="${p.image}" alt="${p.name}" style="width:48px;height:48px;object-fit:contain;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600">${p.name}</div>
          <div style="font-size:13px;color:#666">${p.brand}</div>
        </div>
        <button class="remove-selected" aria-label="Remove ${p.name}" title="Remove">✕</button>
      </div>
    `
      )
      .join("") +
    `
    <button id="clearSelections" style="margin-top:10px;width:100%;padding:8px;border-radius:6px;border:none;background:#e74c3c;color:#fff;cursor:pointer;">Clear All</button>`;
}

/* Persist selections to localStorage */
function saveSelections() {
  localStorage.setItem(
    "selectedProductIds",
    JSON.stringify([...selectedProductIds])
  );
}

/* Load selections from localStorage */
function loadSelections() {
  try {
    const raw = localStorage.getItem("selectedProductIds");
    if (!raw) return;
    const arr = JSON.parse(raw);
    selectedProductIds = new Set(arr);
  } catch (e) {
    console.error("Failed to load selections", e);
  }
}

/* Persist chat history */
function saveChatHistory() {
  try {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  } catch (e) {
    console.error("Failed to save chat history", e);
  }
}

/* Load chat history */
function loadChatHistory() {
  try {
    const raw = localStorage.getItem("chatHistory");
    if (!raw) return;
    chatHistory = JSON.parse(raw);
    // render existing messages
    chatWindow.innerHTML = "";
    chatHistory.forEach((m) => appendMessageToChat(m.role, m.content));
  } catch (e) {
    console.error("Failed to load chat history", e);
  }
}

/* Append message to chat window */
function appendMessageToChat(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = role === "user" ? "chat-user" : "chat-assistant";
  wrapper.style.marginBottom = "12px";
  wrapper.style.whiteSpace = "pre-wrap";
  wrapper.innerText = (role === "user" ? "You: " : "Advisor: ") + text;
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );
  displayProducts(filteredProducts);
});

/* Event delegation for product card interactions: select/toggle description */
productsContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;
  const id = Number(card.dataset.id);

  // Toggle description
  if (e.target.matches(".toggle-desc")) {
    const desc = card.querySelector(".description");
    const btn = card.querySelector(".toggle-desc");
    const isHidden = desc.style.display === "none";
    desc.style.display = isHidden ? "block" : "none";
    btn.innerText = isHidden ? "Hide description" : "Show description";
    btn.setAttribute("aria-expanded", isHidden ? "true" : "false");
    return;
  }

  // Toggle selection when clicking elsewhere on the card
  if (selectedProductIds.has(id)) {
    selectedProductIds.delete(id);
    card.classList.remove("selected");
  } else {
    selectedProductIds.add(id);
    card.classList.add("selected");
  }

  renderSelectedProducts();
  saveSelections();
});

/* Handle removal from selected products panel */
selectedProductsList.addEventListener("click", (e) => {
  if (e.target.id === "clearSelections") {
    selectedProductIds.clear();
    saveSelections();
    renderSelectedProducts();
    // clear selected class in grid
    document
      .querySelectorAll(".product-card.selected")
      .forEach((c) => c.classList.remove("selected"));
    return;
  }

  const item = e.target.closest(".selected-item");
  if (item && e.target.classList.contains("remove-selected")) {
    const id = Number(item.dataset.id);
    selectedProductIds.delete(id);
    saveSelections();
    renderSelectedProducts();
    // remove visual selection in grid
    const card = productsContainer.querySelector(
      `.product-card[data-id='${id}']`
    );
    if (card) card.classList.remove("selected");
  }
});

/* Prepare payload for the AI: selected products data */
function getSelectedProductsPayload() {
  const selected = [...selectedProductIds]
    .map((id) => {
      const p = allProducts.find((x) => x.id === id);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description,
      };
    })
    .filter(Boolean);
  return selected;
}

/* Send selected products to Worker or OpenAI API to generate a routine */
async function generateRoutine() {
  const selected = getSelectedProductsPayload();
  if (selected.length === 0) {
    appendMessageToChat(
      "assistant",
      "Please select at least one product before generating a routine."
    );
    chatHistory.push({
      role: "assistant",
      content:
        "Please select at least one product before generating a routine.",
    });
    saveChatHistory();
    return;
  }

  // Show a compact, human-readable message in the chat instead of raw JSON
  appendMessageToChat(
    "user",
    `Generate a personalized routine using ${selected.length} selected product(s).`
  );
  chatHistory.push({
    role: "user",
    content: `Generate a personalized routine using ${selected.length} selected product(s).`,
  });
  saveChatHistory();

  // Build messages for the API: include system prompt to constrain the assistant
  const systemPrompt = `You are a helpful beauty advisor. Create a step-by-step routine using only the products provided. Be concise and clear. Indicate morning/evening steps when relevant and include short reasons for each step (1-2 sentences). Keep the entire routine brief — aim for ~200 words or less.`;
  // Include the structured product list as a system message so it's not shown as raw JSON
  const productSystemMessage = {
    role: "system",
    content: "PRODUCTS_JSON:" + JSON.stringify(selected),
  };

  const messages = [
    { role: "system", content: systemPrompt },
    productSystemMessage,
    ...chatHistory,
  ];

  appendMessageToChat("assistant", "Generating routine — please wait...");

  try {
    // Require Cloudflare Worker for API calls to avoid exposing API keys client-side
    if (typeof WORKER_URL === "undefined" || !WORKER_URL) {
      const msg =
        "Server endpoint not configured. Please set WORKER_URL in secrets.js to your Cloudflare Worker URL.";
      appendMessageToChat("assistant", msg);
      chatHistory.push({ role: "assistant", content: msg });
      saveChatHistory();
      return;
    }

    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, selected }),
    });
    const data = await res.json();
    const assistantText =
      data.result ||
      data.choices?.[0]?.message?.content ||
      JSON.stringify(data);
    appendMessageToChat("assistant", assistantText);
    chatHistory.push({ role: "assistant", content: assistantText });
    saveChatHistory();
  } catch (err) {
    console.error(err);
    appendMessageToChat(
      "assistant",
      "Sorry — failed to generate routine. Please try again later."
    );
    chatHistory.push({
      role: "assistant",
      content: "Sorry — failed to generate routine. Please try again later.",
    });
    saveChatHistory();
  }
}

/* Chat form submission handler: send follow-up questions referencing chatHistory */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;
  appendMessageToChat("user", text);
  chatHistory.push({ role: "user", content: text });
  saveChatHistory();

  // Build messages to send (system + full conversation)
  const systemPrompt = `You are a helpful beauty advisor. Answer follow up questions referencing the user's routine and selected products where appropriate. Be brief — aim for ~100 words or less.`;
  const messages = [{ role: "system", content: systemPrompt }, ...chatHistory];

  // Indicate thinking
  appendMessageToChat("assistant", "Thinking...");

  try {
    if (typeof WORKER_URL === "undefined" || !WORKER_URL) {
      const msg =
        "Server endpoint not configured. Please set WORKER_URL in secrets.js to your Cloudflare Worker URL.";
      appendMessageToChat("assistant", msg);
      chatHistory.push({ role: "assistant", content: msg });
      saveChatHistory();
      input.value = "";
      return;
    }

    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    const assistantText =
      data.result ||
      data.choices?.[0]?.message?.content ||
      JSON.stringify(data);
    appendMessageToChat("assistant", assistantText);
    chatHistory.push({ role: "assistant", content: assistantText });
    saveChatHistory();
    input.value = "";
  } catch (err) {
    console.error(err);
    appendMessageToChat("assistant", "Sorry — I could not get a response.");
    chatHistory.push({
      role: "assistant",
      content: "Sorry — I could not get a response.",
    });
    saveChatHistory();
  }
});

/* Wire up Generate Routine button */
generateRoutineBtn.addEventListener("click", generateRoutine);

/* Initialization */
(async function init() {
  await loadProducts();
  loadSelections();
  loadChatHistory();
  renderSelectedProducts();
})();
