import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Static prompt (Gemini instructions)
const priceScrapingPrompt = `
You are an expert web scraping assistant, specializing in identifying and extracting pricing information from HTML structures. Your task is to analyze a given HTML \`div\` element, recursively traverse its subcomponents, and pinpoint the specific element(s) that represent the price of an item.

**Your Goal:** Return a CSS selector or an XPath expression that precisely targets the price element(s). If multiple elements could represent the price (e.g., original price and sale price), identify both.

**Input:**
A string containing the HTML of a \`div\` element and its entire subtree.

**Output (JSON format):**
A JSON object with the following structure. If no price is found, the \`selector\` and \`type\` fields should be \`null\` and \`price_found\` should be \`false\`.

\`\`\`json
{
  "price_found": true,
  "selectors": [
    {
      "selector": "CSS_SELECTOR_OR_XPATH_FOR_PRICE_1",
      "type": "css" | "xpath",
      "confidence": "high" | "medium" | "low",
      "Price": "Price of the item"
    },

  ],
}
\`\`\`

**Key Considerations and Heuristics to Employ:**

1.  **Text Content Analysis:**
    * Look for text containing common currency symbols: \`$, €, £, ¥, ₹\`, etc.
    * Look for text containing numbers with decimal points (e.g., \`12.99\`, \`1,234.50\`).
    * Consider words like "price", "cost", "total", "sale", "discount", "from", "now", "original".
    * Prioritize elements with a single numeric value or a clear price range.

2.  **Element Attributes:**
    * Examine \`class\` names: \`price\`, \`product-price\`, \`current-price\`, \`sale-price\`, \`original-price\`, \`amount\`, \`value\`, \`money\`, \`currency\`.
    * Examine \`id\` attributes: similar to class names.
    * Examine \`itemprop\` attributes, specifically \`price\`, \`offers\`, \`priceAmount\`, \`priceCurrency\` (Schema.org microdata).
    * Look for \`data-price\`, \`data-amount\`, \`data-value\` attributes.

3.  **Structural Clues:**
    * **Proximity to Product Name/Image:** Prices are often near product titles or images.
    * **\`<span>\`, \`<strong>\`, \`<b>\` tags:** Prices are frequently wrapped in these for styling.
    * **\`div\` or \`p\` tags:** Common containers for price information.
    * **List Items (\`<li>\`):** In product listings, prices might be within list items.
    * **Presence of Old Price/Sale Price:** If two prices are present, one is often struck through or styled differently (e.g., smaller font, lighter color). Identify both.

4.  **Exclusionary Rules (What *not* to scrape):**
    * Quantities (e.g., "3 items", "pack of 6").
    * Dates or years.
    * Phone numbers.
    * Arbitrary numbers not clearly associated with currency.
    * Shipping costs *unless explicitly part of the total item price*.
    * Tax information *unless explicitly part of the total item price*.

5.  **Selector Preference:**
    * **CSS Selectors:** Prefer specific and robust CSS selectors using classes and IDs first.
    * **XPath:** Use XPath when CSS selectors are insufficient, particularly for traversing up the DOM or selecting based on text content (e.g., \`contains(text(), '$')\`).
    * **Prioritize Specificity:** A selector targeting a unique \`id\` is generally better than a generic class that might appear elsewhere.
    * **Avoid Overly Generic Selectors:** e.g., \`div span\` is too broad.

6.  **Confidence Score:**
    * **High:** Unique ID or highly descriptive class name with currency symbol/decimal number present. Strong Schema.org \`itemprop\`.
    * **Medium:** Common class names (\`price\`, \`amount\`) with numerical content and currency.
    * **Low:** Generic tags (\`span\`, \`div\`) with only numerical content, but no explicit currency or strong contextual clues.
7.  **Price Format:**
    * **Single Price:** If only one price is found, return it.
    * **Price format:** retrun only the int, no currecny and no floats.
    * **Multiple Prices:** If multiple prices are found, return the smaller.

**Example Input HTML:**

\`\`\`html
<div id="product-info-panel">
  <h3>Product XYZ</h3>
  <p>Some product details here.</p>
  <div>
    <span>Our low everyday price:</span>
    <span style="font-weight: bold;">12.50 €</span>
  </div>
  <p>Quantity: 1 piece</p>
</div>
\`\`\`
`;

// Lambda handler function
export const handler = async (event) => {
  // ✅ Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: JSON.stringify({ message: "CORS preflight successful" }),
    };
  }

  try {
    console.log("Incoming event:", JSON.stringify(event));

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const html = body.html;

    if (!html) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: JSON.stringify({ error: "Missing 'html' field" }),
      };
    }

    const prompt = `${priceScrapingPrompt}\nHTML to analyze:\n${html}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: JSON.stringify({ gemini_response: text }),
    };
  } catch (err) {
    console.error("Unhandled error:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: JSON.stringify({ error: err.message || 'Unknown error' }),
    };
  }
};

