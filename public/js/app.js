let chart;

async function fetchData() {
    const url = document.getElementById('urlInput').value;
    if (!url) {
        alert("URLを入力してください");
        return;
    }

    try {
        const response = await fetch(`/scrape?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        updateChart(data);
        renderTable(data);
    } catch (error) {
        console.error("データ取得エラー", error);
        alert("データを取得できませんでした。");
    }
}

function updateChart(data) {
    const ctx = document.getElementById('lapChart').getContext('2d');
    if (chart) chart.destroy();

    const cumulativeTimes = data.lapTimes.reduce((arr, val) => {
        arr.push((arr[arr.length - 1] || 0) + val);
        return arr;
    }, []);

    chart = new Chart(ctx, {
        data: {
            labels: data.distances,
            datasets: [
                {
                    type: 'line',
                    yAxisID: "y-axis-1",
                    label: '累計タイム',
                    data: cumulativeTimes,
                    fill: false
                },
                {
                    type: 'bar',
                    yAxisID: "y-axis-2",
                    label: 'ラップタイム',
                    data: data.lapTimes,
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: {
                        display: true,
                        text: '距離 (km)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + 'km';
                        }
                    },
                    type: 'linear'
                },
                'y-axis-1': {
                    title: { display: true, text: '累計タイム (時:分:秒)' },
                    position: "left",
                    ticks: {
                        callback: function(value) {
                            const hours = Math.floor(value / 3600);
                            const minutes = Math.floor((value % 3600) / 60);
                            const seconds = value % 60;
                            return formatTime(value);
                        }
                    }
                },
                'y-axis-2': {
                    title: { display: true, text: 'ラップタイム (分:秒)' },
                    position: "right",
                    tick: {
                        beginAtZero: true,
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        callback: function(value) {
                            const minutes = Math.floor(value / 60);
                            const seconds = value % 60;
                            return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    callbacks: {
                        title: function(context) {
                            return context[0].label + "km地点";
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';

                            if (label) {
                                label += ': ';
                            }
                            const value = context.parsed.y;
                            const hours = Math.floor(value / 3600);
                            const minutes = Math.floor((value % 3600) / 60);
                            const seconds = value % 60;
                            return label + formatTime(value);
                        }
                    }
                }
            }
        }
    });
}

function renderTable(data) {
    const body = document.getElementById('timeTableBody');
    body.innerHTML = '';
    let total = 0;
    data.distances.forEach((dist, i) => {
        total += data.lapTimes[i];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dist}</td>
            <td>${formatTime(total)}</td>
            <td>${formatTime(data.lapTimes[i])}</td>
        `;
        body.appendChild(row);
    });
}

function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
