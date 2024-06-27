document.addEventListener("DOMContentLoaded", function() {
    fetch('linkedin/Profile.csv')
        .then(response => response.text())
        .then(data => {
            const profile = parseCSV(data)[0];
            document.getElementById('name').innerText = `${profile['First Name']} ${profile['Last Name']}`;
            document.getElementById('headline').innerText = profile['Headline'];
            document.getElementById('summary-text').innerText = profile['Summary'];
        });

    fetch('linkedin/Education.csv')
        .then(response => response.text())
        .then(data => {
            const education = parseCSV(data);
            const educationContent = document.getElementById('education-content');
            education.forEach(entry => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <h4>${entry['School Name']}</h4>
                    <p>${entry['Degree Name']}, ${entry['Start Date']} - ${entry['End Date']}</p>
                    <p>Notes: ${entry['Notes'] || 'N/A'}</p>
                    <p>Activities: ${entry['Activities'] || 'N/A'}</p>
                `;
                educationContent.appendChild(div);
            });
        });

    fetch('linkedin/Positions.csv')
        .then(response => response.text())
        .then(data => {
            const positions = parseCSV(data);
            const positionsContent = document.getElementById('positions-content');
            positions.forEach(entry => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <h4>${entry['Company Name']}</h4>
                    <p>${entry['Title']}, ${entry['Started On']} - ${entry['Finished On'] || 'Present'}</p>
                    <p>${entry['Description']}</p>
                `;
                positionsContent.appendChild(div);
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
