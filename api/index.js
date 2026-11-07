// Vercel Node.js function — serves the Expo Router server build (Spec 002
// REQ-047, ADR-0009). Static assets come from dist/client via vercel.json.
const path = require('node:path');
const { createRequestHandler } = require('expo-server/adapter/vercel');

module.exports = createRequestHandler({
  build: path.join(__dirname, '../dist/server'),
});
