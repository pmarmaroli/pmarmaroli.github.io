document.addEventListener("DOMContentLoaded", async function () {
  const timestamp = new Date().getTime();

  // List of HTML files to process in 'moreinfo' folder
  const moreinfoFiles = [
    "audio_analysis_platform.html",
    "audio_comparison_tool.html",
    "cheffantastique.html",
    "hadithgpt.html",
    "pronunciation_assessment_game.html",
    "symptom-tracker.html",
    "troubleshot.html",
    "vehicle_audio_detection_and_classification.html",
  ];

  try {
    // Step 1: Fetch and process CSV data
    const csvData = await fetch(`/data.csv`).then((response) =>
      response.text()
    );
    const items = parseCSV(csvData);

    const descriptions = items.map((item) => item["Description"]).join(" ");
    const csvKeywords = extractKeywords(descriptions);

    // Step 2: Fetch and process HTML files for keywords
    const htmlKeywords = {};
    for (const file of moreinfoFiles) {
      const htmlData = await fetch(`/moreinfo/${file}`).then((response) =>
        response.text()
      );
      const textContent = stripHTML(htmlData);
      const keywords = extractKeywords(textContent);

      for (const [word, count] of Object.entries(keywords)) {
        htmlKeywords[word] = (htmlKeywords[word] || 0) + count;
      }
    }

    // Combine keywords from CSV and HTML for word cloud
    const combinedKeywords = { ...csvKeywords, ...htmlKeywords };
    const wordArray = Object.entries(combinedKeywords).map(([text, weight]) => [
      text,
      weight,
    ]);

    // Render the word cloud using wordcloud2.js
    WordCloud(document.getElementById("word-cloud-container"), {
      list: wordArray,
      gridSize: 15,
      weightFactor: 8,
      fontFamily: "Arial",
      color: function () {
        // Random color from the theme palette
        const colors = "lightgrey"; //["#5db3db", "#b7d3e1", "#333333", "#333333"];
        return colors; //[Math.floor(Math.random() * colors.length)];
      },
      backgroundColor: "transparent",
      rotateRatio: 0.5,
    });

    // Step 3: Create menu buttons
    const menuItems = [...new Set(items.map((item) => item["Menu"]))];
    const menuButtonsContainer = document.getElementById("menu-buttons");

    menuItems.forEach((menuItem) => {
      const button = document.createElement("button");
      button.textContent = menuItem;
      button.style.padding = "10px";
      button.style.fontSize = "20px";
      button.style.border = "1px solid #ccc";
      button.style.backgroundColor = "#f0f0f0";
      button.style.cursor = "pointer";

      // Change background color on hover
      button.addEventListener("mouseenter", function () {
        button.style.backgroundColor = "#5db3db"; // Set to blue on hover
        button.style.color = "white"; // Optional: Change text color for contrast
      });

      button.addEventListener("mouseleave", function () {
        button.style.backgroundColor = "#f0f0f0"; // Revert to original color
        button.style.color = "black"; // Optional: Revert text color
      });

      button.addEventListener("click", function () {
        const isActive = button.classList.contains("active");

        // Remove active class and reset background color for all buttons
        Array.from(menuButtonsContainer.getElementsByTagName("button")).forEach(
          (btn) => {
            btn.classList.remove("active");
            btn.style.backgroundColor = "#f0f0f0";
          }
        );

        if (!isActive) {
          button.classList.add("active");
          button.style.backgroundColor = "#5db3db";
        }

        filterAndDisplayItems();
      });

      menuButtonsContainer.appendChild(button);
    });

    // Step 4: Filter and display items based on active menu selection
    function filterAndDisplayItems() {
      const activeButtons = Array.from(
        menuButtonsContainer.getElementsByClassName("active")
      ).map((btn) => btn.textContent);
      const filteredItems =
        activeButtons.length === 0
          ? []
          : items.filter((item) => activeButtons.includes(item["Menu"]));
      displayItems(filteredItems);
    }

    function parseCSV(text) {
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0].split(",").map((header) => header.trim());
      return lines.slice(1).map((line) => {
        const values = line.split(",").map((value) => value.trim());
        return headers.reduce((object, header, index) => {
          object[header] = values[index];
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
      content.innerHTML = "";

      items.forEach((item) => {
        const div = document.createElement("div");
        div.className = "box";

        const urlMatch = item["URL"].match(/\[([^\]]+)\]\(([^)]+)\)/);
        const moreInfoMatch = item["MoreInfo"].match(/\[([^\]]+)\]\(([^)]+)\)/);

        const urlLabel = urlMatch ? urlMatch[1] : "";
        const moreInfoLabel = moreInfoMatch ? moreInfoMatch[1] : "";

        const urlHref = urlMatch ? urlMatch[2] : "#";
        const moreInfoHref = moreInfoMatch ? moreInfoMatch[2] : "#";

        div.innerHTML = `
          <h1>${item["Title"]}</h1>
          <p style="color:black">${item["Description"]}</p>
          <a href="${urlHref}" target="_blank">${urlLabel}</a>
          <p></p>
          <a href="${moreInfoHref}" target="_blank">${moreInfoLabel}</a>                          
        `;
        content.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Error fetching files:", error);
  }
});
