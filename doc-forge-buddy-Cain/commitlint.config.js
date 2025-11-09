// Commitlint configuration following conventional commits standard
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Subject line maximum length
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 50],
    
    // Body line maximum length
    'body-max-line-length': [2, 'always', 72],
    
    // Header (type + scope) rules
    'header-max-length': [2, 'always', 72],
    
    // Type rules
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Code change that improves performance
        'test',     // Adding missing tests or correcting existing tests
        'build',    // Changes that affect the build system or external dependencies
        'ci',       // Changes to CI configuration files and scripts
        'chore',    // Other changes that don't modify src or test files
        'revert'    // Revert a previous commit
      ]
    ]
  },
  // Parser configuration for better parsing
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)(?:\(([\w$-]+)\))?: (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject']
    }
  }
};