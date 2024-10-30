document.addEventListener("DOMContentLoaded", function () {
  const timestamp = new Date().getTime(); // Use current timestamp to prevent caching
  fetch(`/data.csv?v=${timestamp}`) // Appending timestamp to CSV URL
    .then((response) => response.text())
    .then((data) => {
      const items = parseCSV(data);
      const menuItems = [...new Set(items.map((item) => item["Menu"]))];

      const menuButtonsContainer = document.getElementById("menu-buttons");
      menuItems.forEach((menuItem) => {
        const button = document.createElement("button");
        button.textContent = menuItem;
        button.style.padding = "10px";
        button.style.border = "1px solid #ccc";
        button.style.backgroundColor = "#f0f0f0";
        button.style.cursor = "pointer";

        button.addEventListener("click", function () {
          const isActive = button.classList.contains("active");

          // Remove active class and reset background color for all buttons
          const allButtons =
            menuButtonsContainer.getElementsByTagName("button");
          Array.from(allButtons).forEach((btn) => {
            btn.classList.remove("active");
            btn.style.backgroundColor = "#f0f0f0";
          });

          // If the clicked button was not active, activate it and change its color
          if (!isActive) {
            button.classList.add("active");
            button.style.backgroundColor = "#5db3db";
          }

          filterAndDisplayItems();
        });

        menuButtonsContainer.appendChild(button);
      });

      function filterAndDisplayItems() {
        const activeButtons = Array.from(
          menuButtonsContainer.getElementsByClassName("active")
        ).map((btn) => btn.textContent);

        if (activeButtons.length === 0) {
          displayItems([]);
          return;
        }

        const filteredItems = items.filter((item) =>
          activeButtons.includes(item["Menu"])
        );
        displayItems(filteredItems);
      }

      function parseCSV(text) {
        const lines = text.trim().split(/\r?\n/); // Split using both \n and \r\n line endings
        const headers = lines[0].split(",").map((header) => header.trim());

        return lines.slice(1).map((line) => {
          const values = line.split(",").map((value) => value.trim());
          return headers.reduce((object, header, index) => {
            object[header] = values[index];
            return object;
          }, {});
        });
      }

      function displayItems(items) {
        const content = document.getElementById("content");
        content.innerHTML = ""; // Clear previous content

        items.forEach((item) => {
          const div = document.createElement("div");
          div.className = "box";

          // Extracting link labels from the Markdown-style links
          const urlMatch = item["URL"].match(/\[([^\]]+)\]\(([^)]+)\)/);
          const moreInfoMatch = item["MoreInfo"].match(
            /\[([^\]]+)\]\(([^)]+)\)/
          );

          // Displaying item information with extracted labels if matches found
          const urlLabel = urlMatch ? urlMatch[1] : "";
          const moreInfoLabel = moreInfoMatch ? moreInfoMatch[1] : "";

          const urlHref = urlMatch ? urlMatch[2] : "#";
          const moreInfoHref = moreInfoMatch ? moreInfoMatch[2] : "#";

          div.innerHTML = `
            <h3>${item["Title"]}</h3>
            <p style="color:black">${item["Description"]}</p>
            <a href="${urlHref}" target="_blank">${urlLabel}</a>
            <p></p>
            <a href="${moreInfoHref}" target="_blank">${moreInfoLabel}</a>                          
        `;
          content.appendChild(div);
        });
      }
    })
    .catch((error) => console.error("Error fetching the CSV file:", error));
});
