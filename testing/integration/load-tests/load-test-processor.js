/**
 * Artillery load test processor
 * Provides custom functions for load tests
 */

module.exports = {
  generateRandomEmail,
  generateRandomPhone,
};

function generateRandomEmail(userContext, events, done) {
  userContext.vars.randomEmail = `loadtest${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
  return done();
}

function generateRandomPhone(userContext, events, done) {
  const randomNumber = Math.floor(Math.random() * 900000000) + 100000000;
  userContext.vars.randomPhone = `+249${randomNumber}`;
  return done();
}

