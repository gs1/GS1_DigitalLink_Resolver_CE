/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
google.charts.load('current', { packages: ['corechart'] });

// Set a callback to run when the Google Visualization API is loaded.
// google.charts.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
async function drawChart(chartType = 'StackedBarChart') {
  try {
    const authKey = document.getElementById('chartAuthKey').value;
    const response = await fetch('/dashboard/data', { headers: { Authorization: `Bearer ${authKey}` } });
    const dataJson = await response.json();

    // extract and removed invalid or null _id from array
    const _invalidId = dataJson.findIndex((mo) => !mo._id);
    if (_invalidId > -1) {
      dataJson.splice(_invalidId, 1);
    }

    document.getElementById('chartArea').style.display = 'block';
    document.getElementById('chartLogin').style.display = 'none';
    // find the largest ai array length of MOs
    let maxAiLength = 0;
    let maxAiIndex = 0;
    dataJson.forEach((mo, i) => {
      if (mo.ai.length > maxAiLength) {
        maxAiLength = mo.ai.length;
        maxAiIndex = i;
      }
    });
    const aiArray = [];
    dataJson[maxAiIndex].ai.forEach((ai) => {
      aiArray.push(ai.shortName);
    });
    const chartArray = [['Genre', 'gcp', 'links', ...aiArray]];

    // loop through each mo and set data for chart
    dataJson.forEach((mo) => {
      const dataArr = Array(maxAiLength + 3).fill(0);
      dataArr[0] = mo.accountName;
      dataArr[1] = mo.gcpCount;
      dataArr[2] = mo.linksCount;
      // loop throught AI
      mo.ai.forEach((ai) => {
        dataArr[chartArray[0].indexOf(ai.shortName)] = ai.count;
      });
      chartArray.push(dataArr);
    });

    // Create the data table.
    const options = {
      // width: '100%',
      // height: '100%',
      legend: { position: 'bottom', maxLines: 3 },
      // bar: { groupWidth: '75%' },
      // isStacked: false,
      logScale: true,
      title: '',
      width: '100%',
      height: '100%',
      axisTitlesPosition: 'out',
      isStacked: false,
      pieSliceText: 'percentage',
      // colors: ['#0598d8', '#f97263'],
      chartArea: {
        left: '25%',
        top: '1%',
        height: '90%',
        width: '100%',
      },
      vAxis: {
        title: '',
      },
      hAxis: {
        title: 'GS1 Resolver Results',
      },
    };

    if (chartType === 'StackedBarChart') {
      chartType = 'BarChart';
      options.isStacked = true;
    }
    if (chartType === 'ColumnChart') {
      options.chartArea.left = '5%';
      // options.chartArea.width = 1000;
      // const ele = document.getElementById('chart-container');
      // ele.style.overflowX = 'scroll';
      // ele.style.overflowY = 'hidden';
      // ele.style.width = 1000;
    }
    const data = google.visualization.arrayToDataTable(chartArray);
    // const chart = new google.visualization.BarChart(document.getElementById('chart_div'));
    const chart = new google.visualization[chartType](document.getElementById('chart_div'));
    chart.draw(data, options);
  } catch (e) {
    document.getElementById('chartArea').style.display = 'none';
    document.getElementById('chartLogin').style.display = 'block';
    document.getElementById('invalidAuthKey').innerHTML = 'Entered Auth Key is Invalid';
  }
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
