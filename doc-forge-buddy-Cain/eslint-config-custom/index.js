const performanceRules = require('./rules/performance');
const securityRules = require('./rules/security');
const projectSpecificRules = require('./rules/project-specific');
const complexityRules = require('./rules/complexity');
const importOrganizationRules = require('./rules/import-organization');

module.exports = {
  extends: [
    'plugin:sonarjs/recommended',
  ],
  plugins: [
    'sonarjs',
    'unused-imports',
  ],
  rules: {
    // Combine all custom rule sets
    ...performanceRules,
    ...securityRules,
    ...projectSpecificRules,
    ...complexityRules,
    ...importOrganizationRules,
  },
};