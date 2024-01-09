function scoreToColor(score) {
    // Example color function - you can customize this
    const hue = (120 - (score * 120)).toString(10);
    return ["hsl(", hue, ", 100%, 50%)"].join("");
}

document.addEventListener("DOMContentLoaded", function() {
    fetch('/news.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const container = document.getElementById('container');

            // Set background color based on the OVERALL score
            if (data.OVERALL) {
                document.body.style.backgroundColor = scoreToColor(data.OVERALL[0]);
            }

            // Separate the OVERALL category
            const { OVERALL, ...otherCategories } = data;

            // Display the OVERALL category
            if (OVERALL) {
                const overallTile = document.createElement('div');
                overallTile.className = 'tile';
                overallTile.style.backgroundColor = scoreToColor(OVERALL[0]);
                overallTile.innerHTML = `<h2>OVERALL</h2><p>Score: ${OVERALL[0]}<br>${OVERALL[1]}</p>`;
                container.appendChild(overallTile);
            }

            // Sort and display other categories
            const sortedData = Object.keys(otherCategories).map(key => {
                return { category: key, score: otherCategories[key][0], description: otherCategories[key][1] };
            }).sort((a, b) => b.score - a.score);

            sortedData.forEach(item => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundColor = scoreToColor(item.score);
                tile.innerHTML = `<h2>${item.category}</h2><p>Score: ${item.score}<br>${item.description}</p>`;
                container.appendChild(tile);
            });
        })
        .catch(error => {
            console.error('Error fetching the news data:', error);
            const container = document.getElementById('container');
            container.innerHTML = '<p>Error loading news data.</p>';
        });
});

