document.addEventListener("DOMContentLoaded", function () {
  fetch("data.csv")
    .then((response) => response.text())
    .then((data) => {
      const items = parseCSV(data);
      const menuItems = [...new Set(items.map((item) => item["Menu"]))];

      const menu = document.getElementById("menu");
      menuItems.forEach((menuItem) => {
        const li = document.createElement("li");
        li.innerHTML = `<a onclick="filterItems('${menuItem}')">${menuItem}</a>`;
        menu.appendChild(li);
      });

      // Display all items by default
      displayItems(items);
    })
    .catch((error) => console.error("Error fetching the CSV file:", error));

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

  window.filterItems = function (menu) {
    fetch("data.csv")
      .then((response) => response.text())
      .then((data) => {
        const items = parseCSV(data);
        const filteredItems = items.filter((item) => item["Menu"] === menu);
        displayItems(filteredItems);
      })
      .catch((error) => console.error("Error fetching the CSV file:", error));
  };

  function displayItems(items) {
    const content = document.getElementById("content");
    content.innerHTML = ""; // Clear previous content

    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "box";

      // Extracting link labels from the Markdown-style links
      const urlMatch = item["URL"].match(/\[([^\]]+)\]\(([^)]+)\)/);
      const moreInfoMatch = item["MoreInfo"].match(/\[([^\]]+)\]\(([^)]+)\)/);

      // Displaying item information with extracted labels if matches found
      const urlLabel = urlMatch ? urlMatch[1] : "URL";
      const moreInfoLabel = moreInfoMatch ? moreInfoMatch[1] : "";

      const urlHref = urlMatch ? urlMatch[2] : "#";
      const moreInfoHref = moreInfoMatch ? moreInfoMatch[2] : "#";

      div.innerHTML = `
            <h3>${item["Title"]}</h3>
            <p>${item["Description"]}</p>
            <a href="${urlHref}" target="_blank">${urlLabel}</a>
            <p></p>
            <a href="${moreInfoHref}" target="_blank">${moreInfoLabel}</a>                          
        `;
      content.appendChild(div);
    });
  }
});
