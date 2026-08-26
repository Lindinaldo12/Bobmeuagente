// COMO DEVE FICAR (CORRIGIDO):
const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY || process.env.OPEN_ROUTER_KEY;

headers: {
    "Authorization": `Bearer ${apiKey}`,
    "HTTP-Referer": "https://bobmeuagente.onrender.com",
    "X-Title": "Bob AI X",
    "Content-Type": "application/json"
}
