module.exports = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    publicApiKey: process.env.publicApiKey || '',
    authDomain: process.env.FIREBASE_AUTH_HOST || '',
    projectId: process.env.projectId || '',
  },
};
