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

            // Separate the OVERALL category
            const { OVERALL, ...otherCategories } = data;

            // Populate summary banner with OVERALL info
            const summary = document.getElementById('summary');
            if (OVERALL) {
                const score = OVERALL[0];
                const pct = Math.round(score * 100);
                document.body.style.backgroundColor = scoreToColor(score);
                summary.style.borderBottomColor = scoreToColor(score);

                let vibeLabel;
                if (pct < 15) {
                    vibeLabel = 'nothing to see here';
                } else if (pct < 30) {
                    vibeLabel = 'slow news day';
                } else if (pct < 45) {
                    vibeLabel = 'worth a skim';
                } else if (pct < 55) {
                    vibeLabel = 'maybe start paying attention';
                } else if (pct < 65) {
                    vibeLabel = 'this is getting interesting';
                } else if (pct < 75) {
                    vibeLabel = 'buckle up';
                } else if (pct < 88) {
                    vibeLabel = 'history is happening';
                } else {
                    vibeLabel = 'call your mom';
                }

                let underwearMsg;
                let underwearClass;
                if (score < 0.4) {
                    underwearMsg = 'Underwear status: nominal.';
                    underwearClass = 'underwear underwear-nominal';
                } else if (score <= 0.7) {
                    underwearMsg = 'Consider clean underwear.';
                    underwearClass = 'underwear underwear-advisory';
                } else {
                    underwearMsg = 'PUT ON CLEAN UNDERWEAR.';
                    underwearClass = 'underwear underwear-urgent';
                }

                summary.innerHTML = `
                    <div class="summary-headline"><span class="summary-pct">${pct}%</span><span class="summary-vibe">${vibeLabel}</span></div>
                    <div class="summary-description">${OVERALL[1]}</div>
                    <div class="${underwearClass}">${underwearMsg}</div>
                `;
            }

            // Sort and display other categories
            const sortedData = Object.keys(otherCategories).map(key => {
                return { category: key, score: otherCategories[key][0], description: otherCategories[key][1] };
            }).sort((a, b) => b.score - a.score);

            sortedData.forEach(item => {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.style.backgroundColor = scoreToColor(item.score);
                tile.innerHTML = `<h2>${item.category}</h2><p>${Math.round(item.score * 100)}% chance this makes history class in 10 years<br>${item.description}</p>`;
                container.appendChild(tile);
            });
        })
        .catch(error => {
            console.error('Error fetching the news data:', error);
            const container = document.getElementById('container');
            container.innerHTML = '<p>Error loading news data: ' + error + '</p>';
        });
});

