document.addEventListener("DOMContentLoaded", async function () {
  const timestamp = new Date().getTime();

  // List of HTML files to process in 'moreinfo' folder
  const moreinfoFiles = [
    "audio_analysis_platform.html",
    "audio_comparison_tool.html",
    "cheffantastique.html",
    "fitplan_ai_fitness.html",
    "hadithgpt.html",
    "pronunciation_assessment_game.html",
    "symptom-tracker.html",
    "troubleshot.html",
    "vehicle_audio_detection_and_classification.html",
    "zelda_quiz_game.html",
  ];

  try {
    // Step 1: Fetch and process CSV data
    const csvData = await fetch(`/data.csv?t=${timestamp}`).then((response) =>
      response.text()
    );
    const items = parseCSV(csvData);

    // Keyword extraction disabled since word cloud was removed
    // const descriptions = items.map((item) => item["Description"]).join(" ");
    // const csvKeywords = extractKeywords(descriptions);

    // Step 2: Fetch and process HTML files for keywords (disabled)
    // const htmlKeywords = {};
    // for (const file of moreinfoFiles) {
    //   const htmlData = await fetch(`/moreinfo/${file}`).then((response) =>
    //     response.text()
    //   );
    //   const textContent = stripHTML(htmlData);
    //   const keywords = extractKeywords(textContent);

    //   for (const [word, count] of Object.entries(keywords)) {
    //     htmlKeywords[word] = (htmlKeywords[word] || 0) + count;
    //   }
    // }

    // Combine keywords from CSV and HTML for word cloud (disabled)
    // const combinedKeywords = { ...csvKeywords, ...htmlKeywords };
    // const wordArray = Object.entries(combinedKeywords).map(([text, weight]) => [
    //   text,
    //   weight,
    // ]);

    // Render the word cloud using wordcloud2.js (disabled - container removed)
    // WordCloud(document.getElementById("word-cloud-container"), {
    //   list: wordArray,
    //   gridSize: 15,
    //   weightFactor: 8,
    //   fontFamily: "Arial",
    //   color: function () {
    //     // Random color from the theme palette
    //     const colors = "lightgrey"; //["#5db3db", "#b7d3e1", "#333333", "#333333"];
    //     return colors; //[Math.floor(Math.random() * colors.length)];
    //   },
    //   backgroundColor: "transparent",
    //   rotateRatio: 0.5,
    // });

    // Step 2: Create menu buttons
    const menuItems = [...new Set(items.map((item) => item["Menu"]))];
    const menuButtonsContainer = document.getElementById("menu-buttons");

    menuItems.forEach((menuItem) => {
      const button = document.createElement("button");
      button.textContent = menuItem;

      button.addEventListener("click", function () {
        const isActive = button.classList.contains("active");

        // Remove active class from all buttons
        Array.from(menuButtonsContainer.getElementsByTagName("button")).forEach(
          (btn) => {
            btn.classList.remove("active");
          }
        );

        if (!isActive) {
          button.classList.add("active");
        }

        filterAndDisplayItems();
      });

      menuButtonsContainer.appendChild(button);
    });

    // Step 3: Filter and display items based on active menu selection
    function filterAndDisplayItems() {
      const activeButtons = Array.from(
        menuButtonsContainer.getElementsByClassName("active")
      ).map((btn) => btn.textContent);
      
      const placeholderText = document.getElementById("placeholder-text");
      const content = document.getElementById("content");
      
      if (activeButtons.length === 0) {
        // Show welcome message when no buttons are active
        if (placeholderText) {
          placeholderText.style.display = "block";
        }
        content.innerHTML = "";
        content.className = "";
      } else {
        // Show filtered items
        const filteredItems = items.filter((item) => activeButtons.includes(item["Menu"]));
        
        // If showing Portfolio, organize them by industry
        if (activeButtons.includes("Portfolio")) {
          displayItemsByIndustry(filteredItems);
        } else {
          displayItems(filteredItems);
        }
      }
    }

    function displayItemsByIndustry(items) {
      const content = document.getElementById("content");
      const placeholderText = document.getElementById("placeholder-text");
      
      if (placeholderText) {
        placeholderText.style.display = "none";
      }
      
      content.innerHTML = "";
      content.className = "industry-organized-content";

      // Separate Portfolio and other items
      const sideProjects = items.filter(item => item["Menu"] === "Portfolio");
      const otherItems = items.filter(item => item["Menu"] !== "Portfolio");

      // Group Portfolio by industry
      const industriesMap = {};
      sideProjects.forEach(item => {
        const industry = item["Industry"] || "Other";
        if (!industriesMap[industry]) {
          industriesMap[industry] = [];
        }
        industriesMap[industry].push(item);
      });

      // Industry icons mapping
      const industryIcons = {
        "Healthcare & Accessibility": "fas fa-heartbeat",
        "Security & Privacy": "fas fa-shield-alt",
        "Content Creation & Media": "fas fa-video",
        "Education & Learning": "fas fa-graduation-cap",
        "Fitness & Wellness": "fas fa-dumbbell",
        "Food & Lifestyle": "fas fa-utensils",
        "Transportation & Safety": "fas fa-car",
        "Developer Tools": "fas fa-code",
        "Audio Technology": "fas fa-volume-up"
      };

      // Create industry sections
      Object.keys(industriesMap).sort().forEach((industry, sectionIndex) => {
        const industrySection = document.createElement("div");
        industrySection.className = "industry-section fade-in";
        industrySection.style.animationDelay = `${sectionIndex * 0.2}s`;

        const icon = industryIcons[industry] || "fas fa-folder";
        const projectCount = industriesMap[industry].length;

        industrySection.innerHTML = `
          <div class="industry-header">
            <div class="industry-title">
              <i class="${icon}"></i>
              <h3>${industry}</h3>
              <span class="project-count">${projectCount} project${projectCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div class="industry-projects"></div>
        `;

        const projectsContainer = industrySection.querySelector('.industry-projects');
        
        industriesMap[industry].forEach((item, index) => {
          const div = document.createElement("div");
          div.className = "project-card fade-in";
          div.style.animationDelay = `${(sectionIndex * 0.2) + (index * 0.1)}s`;

          const urlMatch = item["URL"].match(/\[([^\]]+)\]\(([^)]+)\)/);
          const moreInfoMatch = item["MoreInfo"].match(/\[([^\]]+)\]\(([^)]+)\)/);

          const urlLabel = urlMatch ? urlMatch[1] : "";
          const moreInfoLabel = moreInfoMatch ? moreInfoMatch[1] : "";
          const urlHref = urlMatch ? urlMatch[2] : "#";
          const moreInfoHref = moreInfoMatch ? moreInfoMatch[2] : "#";

          const linksHTML = [];
          if (urlLabel && urlHref !== "#") {
            linksHTML.push(`<a href="${urlHref}" target="_blank" class="project-link">
              <i class="fas fa-external-link-alt"></i> ${urlLabel}
            </a>`);
          }
          if (moreInfoLabel && moreInfoHref !== "#") {
            linksHTML.push(`<a href="${moreInfoHref}" target="_blank" class="project-link">
              <i class="fas fa-info-circle"></i> ${moreInfoLabel}
            </a>`);
          }

          div.innerHTML = `
            <h4>${item["Title"]}</h4>
            <p>${item["Description"]}</p>
            ${linksHTML.length > 0 ? `<div class="project-links">${linksHTML.join('')}</div>` : ''}
          `;
          
          projectsContainer.appendChild(div);
        });

        content.appendChild(industrySection);
      });

      // Add other items if any
      if (otherItems.length > 0) {
        const otherSection = document.createElement("div");
        otherSection.className = "other-items-section";
        otherSection.innerHTML = `<div class="projects-grid"></div>`;
        
        const gridContainer = otherSection.querySelector('.projects-grid');
        otherItems.forEach((item, index) => {
          const div = document.createElement("div");
          div.className = "project-card fade-in";
          div.style.animationDelay = `${index * 0.1}s`;
          // ... rest of project card creation logic
        });
        
        content.appendChild(otherSection);
      }
      
      // Show content with animation
      content.style.opacity = '0';
      setTimeout(() => {
        content.style.opacity = '1';
        content.style.transition = 'opacity 0.5s ease';
      }, 100);
    }

    function parseCSV(text) {
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0].split(",").map((header) => header.trim());
      return lines.slice(1).map((line) => {
        const values = line.split(",").map((value) => value.trim());
        return headers.reduce((object, header, index) => {
          object[header] = values[index] || '';
          return object;
        }, {});
      });
    }

    function extractKeywords(text) {
      const commonWords = [
        "and",
        "for",
        "the",
        "with",
        "of",
        "a",
        "to",
        "in",
        "using",
        "on",
        "this",
        "that",
        "is",
        "it",
        "by",
        "from",
        "at",
        "an",
        "be",
        "are",
        "or",
        "as",
        "was",
        "were",
        "has",
        "have",
        "had",
        "can",
        "will",
        "would",
        "which",
        "also",
        "tool",
        "based",
        "system",
        "application",
        "technologies",
        "different",
        "platform",
        "project",
        "various",
        "features",
        "provide",
        "provides",
        "help",
        "helps",
        "enable",
        "enables",
        "use",
        "uses",
        "user",
        "users",
        "control",
        "controls",
        "development",
        "support",
        "supports",
        "including",
        "engineer",
        "engineering",
        "designed",
        "design",
        "years",
        "time",
        "high",
        "level",
        "types",
        "type",
        "management",
        "projects",
        "between",
        "more",
        "global",
        "france",
        "modern",
        "required",
        "somewhat",
        "receive",
        "layer",
        "upon",
        "better",
        "generation",
        "giving",
        "file",
        "rieur",
        "generates",
        "deliver",
        "individual",
        "then",
        "goal",
        "premium",
        "inspired",
        "evaluates",
        "instantaneous",
        "utilized",
        "built",
        "julien",
        "both",
        "some",
        "final",
        "switch",
        "line",
        "list",
        "well",
        "improve",
        "helpful",
        "reacts",
        "achieved",
        "needing",
        "lightweight",
        "alongside",
        "https",
        "directories",
        "their",
        "over",
        "tools",
        "versatile",
        "available",
        "computer",
        "visitors",
        "need",
        "leverages",
        "detected",
        "incorporates",
        "browser",
        "unlock",
        "source",
        "appeal",
        "shortly",
        "focused",
        "capabilities",
        "pause",
        "functionalities",
        "text",
        "marmaroli",
        "real",
        "customs",
        "custom",
        "includes",
        "providing",
        "make",
        "command",
        "future",
        "find",
        "where",
        "reading",
        "links",
        "write",
        "convert",
        "although",
        "facilitate",
        "store",
        "name",
        "configured",
        "maintaining",
        "patrick",
        "about",
        "maintain",
        "detailed",
        "assessment",
        "young",
        "uploading",
        "description",
        "session",
        "identifying",
        "state",
        "give",
        "cookies",
        "idea",
        "responses",
        "many",
        "color",
        "texts",
        "displaying",
        "appealing",
        "here",
        "payments",
        "steps",
        "script",
        "shareable",
        "manages",
        "correctly",
        "across",
        "such",
        "cleanup",
        "them",
        "results",
        "minor",
        "significantly",
        "velo",
        "clutter",
        "checks",
        "choose",
        "proof",
        "secrets",
        "guided",
        "field",
        "create",
        "tips",
        "lists",
        "stored",
        "correction",
        "providers",
        "fetch",
        "unique",
        "baccalaureate",
        "handled",
        "adjusts",
        "easily",
        "share",
        "easy"
      ];
      const wordCounts = {};
      const words = text.match(/\b\w+\b/g);

      words.forEach((word) => {
        const lowerWord = word.toLowerCase();
        // Filter out years (specific four-digit numbers) and common words
        if (
          !commonWords.includes(lowerWord) &&
          lowerWord.length > 3 &&
          !/^\d{4}$/.test(lowerWord) // excludes words that are four-digit numbers
        ) {
          wordCounts[lowerWord] = (wordCounts[lowerWord] || 0) + 1;
        }
      });

      return wordCounts;
    }

    function stripHTML(html) {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    }

    function displayItems(items) {
      const content = document.getElementById("content");
      const placeholderText = document.getElementById("placeholder-text");
      
      // Hide placeholder when showing projects
      if (placeholderText) {
        placeholderText.style.display = "none";
      }
      
      content.innerHTML = "";
      content.className = "projects-grid";

      items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "project-card fade-in";
        div.style.animationDelay = `${index * 0.1}s`;

        const urlMatch = item["URL"].match(/\[([^\]]+)\]\(([^)]+)\)/);
        const moreInfoMatch = item["MoreInfo"].match(/\[([^\]]+)\]\(([^)]+)\)/);

        const urlLabel = urlMatch ? urlMatch[1] : "";
        const moreInfoLabel = moreInfoMatch ? moreInfoMatch[1] : "";

        const urlHref = urlMatch ? urlMatch[2] : "#";
        const moreInfoHref = moreInfoMatch ? moreInfoMatch[2] : "#";

        // Create links HTML
        const linksHTML = [];
        if (urlLabel && urlHref !== "#") {
          linksHTML.push(`<a href="${urlHref}" target="_blank" class="project-link">
            <i class="fas fa-external-link-alt"></i> ${urlLabel}
          </a>`);
        }
        if (moreInfoLabel && moreInfoHref !== "#") {
          linksHTML.push(`<a href="${moreInfoHref}" target="_blank" class="project-link">
            <i class="fas fa-info-circle"></i> ${moreInfoLabel}
          </a>`);
        }

        // Get category icon
        const categoryIcons = {
          "Portfolio": "fas fa-rocket",
          "Education": "fas fa-graduation-cap",
          "Positions": "fas fa-briefcase",
          "Contact": "fas fa-envelope"
        };
        
        const categoryIcon = categoryIcons[item["Menu"]] || "fas fa-project-diagram";

        div.innerHTML = `
          <div class="project-header">
            <i class="${categoryIcon}" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
            <span class="project-category">${item["Menu"]}</span>
          </div>
          <h3>${item["Title"]}</h3>
          <p>${item["Description"]}</p>
          ${linksHTML.length > 0 ? `<div class="project-links">${linksHTML.join('')}</div>` : ''}
        `;
        
        content.appendChild(div);
      });
      
      // Show content with animation
      content.style.opacity = '0';
      setTimeout(() => {
        content.style.opacity = '1';
        content.style.transition = 'opacity 0.5s ease';
      }, 100);
    }
  } catch (error) {
    console.error("Error fetching files:", error);
  }
});

// Function to click the Portfolio button
function clickSideProjectsButton() {
  // Wait a bit to ensure buttons are loaded
  setTimeout(() => {
    const menuButtonsContainer = document.getElementById("menu-buttons");
    if (menuButtonsContainer) {
      const buttons = menuButtonsContainer.getElementsByTagName("button");
      // Find the "Portfolio" button
      for (let button of buttons) {
        if (button.textContent === "Portfolio") {
          button.click();
          return;
        }
      }
      // Fallback: click the first button if "Portfolio" not found
      if (buttons.length > 0) {
        buttons[0].click();
      }
    }
  }, 100);
}
