document.addEventListener("DOMContentLoaded", function () {
  fetch("data/data.csv")
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
    const lines = text.trim().split("\n");
    const headers = lines[0].split(";").map((header) => header.trim());

    return lines.slice(1).map((line) => {
      const values = line
        .split(/;(?![^"]*"(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((value) => value.replace(/(^"|"$)/g, "").trim());

      // Replace URL and MoreInfo with markdown links if they are URLs
      const formattedValues = values.map((value, index) => {
        if (headers[index] === "URL" || headers[index] === "MoreInfo") {
          if (value.startsWith("http")) {
            return `[${headers[index]}](${value})`;
          } else {
            return value; // If not a URL, return as is
          }
        } else {
          return value;
        }
      });

      return headers.reduce((object, header, index) => {
        object[header] = formattedValues[index];
        return object;
      }, {});
    });
  }

  window.filterItems = function (menu) {
    fetch("data/data.csv")
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
      let url = item["URL"];
      // Handle Markdown format for URL
      if (url.startsWith("[") && url.includes("](")) {
        const match = url.match(/\[(.*?)\]\((.*?)\)/);
        url = match ? match[2] : url;
      }
      let urlinfo = item["MoreInfo"];
      // Handle Markdown format for URL
      if (urlinfo.startsWith("[") && urlinfo.includes("](")) {
        const match = urlinfo.match(/\[(.*?)\]\((.*?)\)/);
        urlinfo = match ? match[2] : urlinfo;
      }
      div.innerHTML = `
                  <h3>${item["Title"]}</h3>
                  <a href="${url}" target="_blank">${url}</a>
                  <p></p>
                  <a href="${urlinfo}" target="_blank">${urlinfo}</a>
                  <p>${item["Description"]}</p>                  
              `;
      content.appendChild(div);
    });
  }
});
