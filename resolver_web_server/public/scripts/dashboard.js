/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
google.charts.load('current', { packages: ['corechart'] });

// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
async function drawChart(chartType = 'BarChart') {
  const response = await fetch('/dashboard/data');
  const [dataJson] = await response.json();

  // find the largest ai array length of MOs
  let maxAiLength = 0;
  let maxAiIndex = 0;
  dataJson.mo.forEach((mo, i) => {
    if (mo.ai.length > maxAiLength) {
      maxAiLength = mo.ai.length;
      maxAiIndex = i;
    }
  });
  const aiArray = [];
  dataJson.mo[maxAiIndex].ai.forEach((ai) => {
    aiArray.push(ai.shortName);
  });
  const chartArray = [['Genre', 'gcp', 'links', ...aiArray]];

  // loop through each mo and set data for chart
  dataJson.mo.forEach((mo) => {
    const dataArr = Array(maxAiLength + 3).fill(0);
    dataArr[0] = mo.accountName;
    dataArr[1] = mo.gcpCount;
    dataArr[2] = mo.linksCount;
    // loop throught AI
    mo.ai.forEach((ai) => {
      dataArr[chartArray[0].indexOf(ai.shortName)] = ai.items.length;
    });
    chartArray.push(dataArr);
  });

  // Create the data table.
  const options = {
    width: 1200,
    height: 400,
    legend: { position: 'bottom', maxLines: 3 },
    bar: { groupWidth: '75%' },
    isStacked: false,
  };

  if (chartType === 'StackedBarChart') {
    chartType = 'BarChart';
    options.isStacked = true;
  }
  const data = google.visualization.arrayToDataTable(chartArray);
  // const chart = new google.visualization.BarChart(document.getElementById('chart_div'));
  const chart = new google.visualization[chartType](document.getElementById('chart_div'));
  chart.draw(data, options);
}

function drawGtinChart(element = {}, i = 0) {
  const options = {
    width: 600,
    height: 400,
    legend: { position: 'bottom', maxLines: 3 },
    bar: { groupWidth: '75%' },
    isStacked: true,
    pieHole: 0.4,
  };
  const chartArr = [['Genre', `${element.accountName}-GTINs`]];
  for (const [key, value] of Object.entries(element.gtins)) {
    chartArr.push([key, value]);
  }
  const data = google.visualization.arrayToDataTable(chartArr);
  // create new div element and append to document
  const newDiv = document.createElement('div');
  newDiv.id = `chart_div${i}`;
  newDiv.className = 'chartDiv';
  document.getElementById('chart-container').append(newDiv);
  const chart = new google.visualization.ColumnChart(document.getElementById(`chart_div${i}`));
  chart.draw(data, options);
}

// eslint-disable-next-line no-unused-vars
function selectChartType() {
  const chartType = document.getElementById('charttype').value;
  drawChart(chartType);
}
