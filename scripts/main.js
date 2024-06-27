document.addEventListener("DOMContentLoaded", function() {
    fetch('data/data.csv')
        .then(response => response.text())
        .then(data => {
            const items = parseCSV(data);
            const content = document.getElementById('content');
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'box';
                div.innerHTML = `
                    <h3>${item['Title']}</h3>
                    <a href="${item['URL']}" target="_blank">${item['URL']}</a>
                    <p>${item['Description']}</p>
                `;
                content.appendChild(div);
            });
        });

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((object, header, index) => {
                object[header.trim()] = values[index].trim();
                return object;
            }, {});
        });
    }
});
