const dashboardUpdate = require('./controllers/buildDashboardController');

const sleepForSeconds = async (seconds) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const run = async () => {
  console.log(process.env);
  await dashboardUpdate();
  if (process.env?.DOCKER_COMPOSE_RUN === 'Y') {
    // We are running under Docker Compose so can must wait for the interval time
    let sleepSecs = process.env?.DOCKER_RUN_INTERVAL_SECS;
    if (!sleepSecs) {
      sleepSecs = 60;
    }
    console.log(`Running under Docker Compose so will now wait for ${sleepSecs} seconds before stopping (and being restarted).`);
    await sleepForSeconds(sleepSecs);
    process.exit(0);
  }
};

run().then(() => console.log('Completed'));
