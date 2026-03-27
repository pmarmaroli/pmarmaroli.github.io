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

function buildPortfolioUI(items) {
  const filtersContainer = document.getElementById("industry-filters");
  const content = document.getElementById("content");
  const prompt = document.getElementById("portfolio-prompt");
  if (!filtersContainer || !content) return;

  const industryIcons = {
    "Audio Technology": "fas fa-volume-up",
    "Content Creation & Media": "fas fa-video",
    "Developer Tools": "fas fa-code",
    "Education & Learning": "fas fa-graduation-cap",
    "Fitness & Wellness": "fas fa-dumbbell",
    "Food & Lifestyle": "fas fa-utensils",
    "Healthcare & Accessibility": "fas fa-heartbeat",
    "Other": "fas fa-folder",
    "Security & Privacy": "fas fa-shield-alt",
    "Transportation & Safety": "fas fa-car",
  };

  // Group by industry
  const byIndustry = {};
  items.forEach((item) => {
    const industry = item["Industry"] || "Other";
    if (!byIndustry[industry]) byIndustry[industry] = [];
    byIndustry[industry].push(item);
  });

  const industries = Object.keys(byIndustry).sort();

  // Build filter buttons
  industries.forEach((industry) => {
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
        showProjects(byIndustry[industry], content);
      }
    });
    filtersContainer.appendChild(btn);
  });
}

function showProjects(items, container) {
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "industry-projects";

  items.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "project-card fade-in";
    card.style.animationDelay = `${idx * 0.06}s`;

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

    card.innerHTML = `
      <h4>${item["Title"]}</h4>
      <p>${item["Description"]}</p>
      ${links.length ? `<div class="project-links">${links.join("")}</div>` : ""}
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
