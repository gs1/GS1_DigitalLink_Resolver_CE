const express = require('express');
const processGTINDigitalLinkRouter = require('./processGTINDigitalLinkRouter');
const processDigitalLinkRouter = require('./processDigitalLinkRouter');

const aiRouterApp = express();

// Global Trade Item Number (GTIN)
aiRouterApp.use('/01', processGTINDigitalLinkRouter);
aiRouterApp.use('/gtin', processGTINDigitalLinkRouter);

// Global Location Number (GLN)
aiRouterApp.use('/414', processDigitalLinkRouter);
aiRouterApp.use('/gln', processDigitalLinkRouter);

// Party Global Location Number (only numeric '417' will work for Party GLN)
aiRouterApp.use('/417', processDigitalLinkRouter);

// Global Location Number Extension (GLNX)
aiRouterApp.use('/254', processDigitalLinkRouter);
aiRouterApp.use('/glnx', processDigitalLinkRouter);

// Serial Shipping Container Code (SSCC)
aiRouterApp.use('/00', processDigitalLinkRouter);
aiRouterApp.use('/sscc', processDigitalLinkRouter);

// Global Returnable Asset Identifier (GRAI)
aiRouterApp.use('/8003', processDigitalLinkRouter);
aiRouterApp.use('/grai', processDigitalLinkRouter);

// Global Individual Asset Identifier (GIAI)
aiRouterApp.use('/8004', processDigitalLinkRouter);
aiRouterApp.use('/giai', processDigitalLinkRouter);

// Global Service Relation Number - Provider (GSRNP)
aiRouterApp.use('/8017', processDigitalLinkRouter);
aiRouterApp.use('/gsrnp', processDigitalLinkRouter);

// Global Service Relation Number - Recipient (GSRN)
aiRouterApp.use('/8018', processDigitalLinkRouter);
aiRouterApp.use('/gsrn', processDigitalLinkRouter);

// Global Document type Identifier (GDTI)
aiRouterApp.use('/253', processDigitalLinkRouter);
aiRouterApp.use('/gdti', processDigitalLinkRouter);

// Global Identification Number for Consignment (GINC)
aiRouterApp.use('/401', processDigitalLinkRouter);
aiRouterApp.use('/ginc', processDigitalLinkRouter);

// Global Shipping Identification Number (GSIN)
aiRouterApp.use('/402', processDigitalLinkRouter);
aiRouterApp.use('/gsin', processDigitalLinkRouter);

// Global Coupon Number (GCN)
aiRouterApp.use('/255', processDigitalLinkRouter);
aiRouterApp.use('/gcn', processDigitalLinkRouter);

// Component/ Part Identifier (CPID)
aiRouterApp.use('/8010', processDigitalLinkRouter);
aiRouterApp.use('/cpid', processDigitalLinkRouter);

// Global Model Number (for medical devices) (GMN)
aiRouterApp.use('/8013', processDigitalLinkRouter);
aiRouterApp.use('/gmn', processDigitalLinkRouter);

// Temporary for compressed GTINS
// aiRouterApp.use('/', processDigitalLinkRouter);

module.exports = aiRouterApp;
