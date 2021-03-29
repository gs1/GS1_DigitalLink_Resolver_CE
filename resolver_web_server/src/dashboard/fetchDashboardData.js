const { getDashboardResolverData } = require('../db/query-controller/dashboardDBController');

exports.fetchDashboardData = async (req, res) => {
  const dbResult = await getDashboardResolverData();
  res.send(dbResult);
};
