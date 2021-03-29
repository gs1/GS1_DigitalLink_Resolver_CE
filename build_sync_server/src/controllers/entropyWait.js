const crypto = require('crypto');

const buildMaxEntropySecs = process.env.BUILD_MAX_ENTROPY_SECONDS || 10;

/**
  The purpose of entropyWait() is to provide an additional period of delay time before the
 * build activates. This effect allows multiple instances ('replicas') of the Build container to balance the load
 * between then. Otherwise, replica 1 will have its setInterval time activate before replicas 2, 3, .. n, which means
 * Replica 1 will likely being doing most of the work!
 * @returns {Promise<void>}
 */
const entropyWait = async () => {
  const entropyMilliSecs = crypto.randomInt(1, parseInt(buildMaxEntropySecs, 10) * 1000);
  await new Promise((resolve) => setTimeout(resolve, entropyMilliSecs));
};

module.exports = entropyWait;
