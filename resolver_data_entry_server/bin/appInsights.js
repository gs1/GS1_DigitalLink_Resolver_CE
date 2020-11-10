const appInsights = require('applicationinsights');
const utills = require('./resolver_utils');

// Initialize App Insight call using instrumentation key
const initializeAppInsight = () => {
  const instrumentationKey = process.env.INSTRUMENTATION_KEY || null;
  if (instrumentationKey) {
    utills.logThis(`Setting App Insights running key value  ${instrumentationKey}`);
    appInsights
      .setup(instrumentationKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .start();
    const client = appInsights.defaultClient;
    global.appInsightsClient = client;
    client.config.endpointUrl = process.env.INGESTION_ENDPOINT ? process.env.INGESTION_ENDPOINT : client.config.endpointUrl;
  } else {
    utills.logThis('App Insight is disabled');
  }
};

module.exports = { initializeAppInsight };
