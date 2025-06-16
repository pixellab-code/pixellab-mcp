// Test setup to reduce rate limiting by adding delays between tests
beforeEach(async () => {
  // Add a small delay between tests to avoid rate limiting
  await new Promise((resolve) => setTimeout(resolve, 2000));
});
