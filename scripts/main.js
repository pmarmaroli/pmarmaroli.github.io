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
    const headers = lines[0].split(",");
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      return headers.reduce((object, header, index) => {
        object[header.trim()] = values[index].trim();
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
      div.innerHTML = `
                <h3>${item["Title"]}</h3>
                <a href="${item["URL"]}" target="_blank">${item["URL"]}</a>
                <p>${item["Description"]}</p>
                <p>${item["MoreInfo"]}</p>
            `;
      content.appendChild(div);
    });
  }
});