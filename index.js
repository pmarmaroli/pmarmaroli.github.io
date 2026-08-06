document.addEventListener("DOMContentLoaded", async function () {
  const timestamp = new Date().getTime();

  try {
    const csvData = await fetch(`/data.csv?t=${timestamp}`).then((r) => r.text());
    const items = parseCSV(csvData);
    const portfolioItems = items.filter((item) => item["Menu"] === "Portfolio");

    buildPortfolioUI(portfolioItems);
  } catch (error) {
    console.error("Error loading portfolio:", error);
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = '<p style="color:#6b7280;text-align:center;">Could not load projects.</p>';
    }
  }
});

// Display order: consulting/business first, personal experiments last
const CATEGORY_ORDER = [
  "Business & Enterprise Platforms",
  "Audio & Signal Processing",
  "Healthcare & Speech Therapy",
  "AI-Powered Products",
  "Tools & Experiments",
];

// Confidential client work: description stays, external links are withheld
const CONFIDENTIAL_TITLES = new Set([
  "RBE Electronic Signature Platform",
  "RBE Alliance Control System (ERP)",
  "RBE Timesheet Portal",
  "Explosive Event Acoustic Detection and Classification",
]);

// Real screenshots, keyed by exact Title — everything else falls back to an icon tile
const TITLE_IMAGES = {
  "Vocametrix Audio Analysis & Games Platform For Speech Therapy": "vocametrix",
  "Audio Comparison Tool": "audiocompare",
  "ChefFantastique": "cheffantastique",
  "Symptom Tracker": "stlogo",
  "AI-Powered YouTube Thumbnail Generator": "thumbly",
  "TroubleShot": "troubleshot",
};

function buildPortfolioUI(items) {
  const filtersContainer = document.getElementById("industry-filters");
  const content = document.getElementById("content");
  const prompt = document.getElementById("portfolio-prompt");
  if (!filtersContainer || !content) return;

  const industryIcons = {
    "Business & Enterprise Platforms": "fas fa-building",
    "Audio & Signal Processing": "fas fa-wave-square",
    "Healthcare & Speech Therapy": "fas fa-heartbeat",
    "AI-Powered Products": "fas fa-robot",
    "Tools & Experiments": "fas fa-flask",
  };

  // Group by industry
  const byIndustry = {};
  items.forEach((item) => {
    const industry = item["Industry"] || "Tools & Experiments";
    if (!byIndustry[industry]) byIndustry[industry] = [];
    byIndustry[industry].push(item);
  });

  const knownOrder = CATEGORY_ORDER.filter((c) => byIndustry[c]);
  const leftovers = Object.keys(byIndustry)
    .filter((c) => !CATEGORY_ORDER.includes(c))
    .sort();
  const industries = [...knownOrder, ...leftovers];

  // Build filter buttons
  industries.forEach((industry, i) => {
    const btn = document.createElement("button");
    const icon = industryIcons[industry] || "fas fa-folder";
    const count = byIndustry[industry].length;
    btn.innerHTML = `<i class="${icon}"></i> ${industry} <span class="filter-count">${count}</span>`;
    btn.className = "filter-btn";
    btn.addEventListener("click", () => {
      // Toggle active state
      const wasActive = btn.classList.contains("active");
      filtersContainer.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));

      if (wasActive) {
        btn.classList.remove("active");
        content.innerHTML = "";
        if (prompt) prompt.style.display = "";
      } else {
        btn.classList.add("active");
        if (prompt) prompt.style.display = "none";
        showProjects(byIndustry[industry], content, icon);
      }
    });
    filtersContainer.appendChild(btn);

    // Lead with the category most relevant to consulting clients
    if (i === 0) btn.click();
  });
}

function showProjects(items, container, categoryIcon) {
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "industry-projects";

  items.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "project-card fade-in";
    card.style.animationDelay = `${idx * 0.06}s`;

    const isConfidential = CONFIDENTIAL_TITLES.has(item["Title"]);
    const image = TITLE_IMAGES[item["Title"]];

    const thumb = image
      ? `<div class="project-thumb">
           <picture>
             <source srcset="/moreinfo/${image}.webp" type="image/webp">
             <img src="/moreinfo/${image}.png" alt="" loading="lazy" width="320" height="180">
           </picture>
         </div>`
      : `<div class="project-thumb project-thumb--fallback"><i class="${categoryIcon || "fas fa-folder"}"></i></div>`;

    let linksHtml = "";
    if (isConfidential) {
      linksHtml = `<div class="confidential-note"><i class="fas fa-lock"></i> Confidential client project</div>`;
    } else {
      const urlMatch = (item["URL"] || "").match(/\[([^\]]+)\]\(([^)]+)\)/);
      const moreInfoMatch = (item["MoreInfo"] || "").match(/\[([^\]]+)\]\(([^)]+)\)/);

      const links = [];
      if (urlMatch && urlMatch[2] && urlMatch[2] !== "#") {
        links.push(
          `<a href="${urlMatch[2]}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> ${urlMatch[1]}</a>`
        );
      }
      if (moreInfoMatch && moreInfoMatch[2] && moreInfoMatch[2] !== "#") {
        links.push(
          `<a href="${moreInfoMatch[2]}" target="_blank" class="project-link"><i class="fas fa-info-circle"></i> ${moreInfoMatch[1]}</a>`
        );
      }
      linksHtml = links.length ? `<div class="project-links">${links.join("")}</div>` : "";
    }

    card.innerHTML = `
      ${thumb}
      <div class="project-body">
        <h4>${item["Title"]}</h4>
        <p>${item["Description"]}</p>
        ${linksHtml}
      </div>
    `;

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const numCols = headers.length; // 6: Menu, Title, URL, Description, MoreInfo, Industry

  return lines.slice(1).map((line) => {
    const parts = line.split(",");

    let values;
    if (parts.length === numCols) {
      values = parts.map((v) => v.trim());
    } else {
      // Commas inside fields — reconstruct by anchoring on first 2 and last 1 columns
      // Menu (no commas), Title (no commas), ..middle.., Industry (no commas)
      const menu = parts[0].trim();
      const title = parts[1].trim();
      const industry = parts[parts.length - 1].trim();

      // Rejoin the middle (URL + Description + MoreInfo)
      const middle = parts.slice(2, parts.length - 1).join(",");

      // Split middle into URL, Description, MoreInfo
      // URL is a markdown link [text](url) or empty
      // MoreInfo is a markdown link [text](url) or empty
      // Description is everything between them
      let url = "", description = "", moreInfo = "";

      // Extract URL (first markdown link at the start, or empty)
      const urlPattern = /^\s*(\[[^\]]*\]\([^)]*\))\s*,\s*/;
      const urlEmpty = /^\s*,\s*/;
      let rest = middle;

      const urlM = rest.match(urlPattern);
      if (urlM) {
        url = urlM[1].trim();
        rest = rest.slice(urlM[0].length);
      } else if (rest.match(urlEmpty)) {
        url = "";
        rest = rest.replace(urlEmpty, "");
      }

      // Extract MoreInfo (last markdown link at the end, or empty)
      // Look for the last occurrence of ,[markdown link] or just trailing empty
      const moreInfoPattern = /,\s*(\[[^\]]*\]\([^)]*\)(?:\s*\w*)?)\s*$/;
      const moreInfoM = rest.match(moreInfoPattern);
      if (moreInfoM) {
        moreInfo = moreInfoM[1].trim();
        rest = rest.slice(0, rest.length - moreInfoM[0].length);
      }

      description = rest.trim();
      values = [menu, title, url, description, moreInfo, industry];
    }

    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] || "";
      return obj;
    }, {});
  });
}
