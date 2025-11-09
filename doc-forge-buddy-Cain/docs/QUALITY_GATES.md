# 📊 Quality Gates Configuration

## 🎯 Overview
Este documento define os quality gates para o projeto doc-forge-buddy-Cain.

## 📋 Quality Gates

### 1. **Coverage Minimums**
- **Global Coverage**: 80% (statements, functions, lines, branches)
- **Components Coverage**: 90% (statements, functions, lines)
- **Critical Components**: 95% (priority files)

### 2. **Test Quality**
- **Unit Tests**: 100% pass rate
- **E2E Tests**: 100% pass rate
- **No failing tests**: Mandatory
- **Test execution time**: < 30s for unit tests

### 3. **Code Quality**
- **TypeScript**: 0 compilation errors
- **ESLint**: 0 warnings/errors (except allowed patterns)
- **Prettier**: Code formatting consistent
- **Bundle Size**: < 500KB gzipped

### 4. **Security**
- **Vulnerabilities**: 0 high/critical
- **Dependencies**: All up to date or approved exceptions

## 🚦 Quality Gate Checks

### Pre-Commit Hooks
```bash
✅ Lint and format code
✅ Run unit tests on changed files
✅ TypeScript compilation check
✅ Basic coverage validation
```

### CI/CD Pipeline
```bash
✅ Full linting suite
✅ Complete TypeScript check
✅ All unit tests with coverage
✅ E2E test suite
✅ Coverage threshold validation
✅ Security audit
✅ Bundle analysis
```

### PR Quality Gates
```bash
✅ Coverage must not decrease by > 5%
✅ All quality gates must pass
✅ No new ESLint warnings
✅ No new TypeScript errors
```

## 📊 Reporting

### Coverage Reports
- **HTML**: `coverage/index.html`
- **Dashboard**: `coverage/reports/coverage-dashboard.html`
- **JSON**: `coverage/coverage-summary.json`
- **Markdown**: `coverage/reports/coverage-report.md`

### PR Comments
- Automatic coverage summary
- File-level coverage breakdown
- Quality gate status
- Links to detailed reports

### CI Notifications
- Slack notifications on failures
- GitHub status checks
- Codecov integration

## 🔧 Usage

### Running Quality Gates Locally
```bash
# Full quality check
npm run quality-gates

# Coverage validation only
npm run coverage:threshold

# Generate reports
npm run coverage:reports

# CI simulation
npm run ci:full
```

### CI/CD Integration
```bash
# GitHub Actions automatically runs:
# - lint
# - type-check  
# - test:coverage
# - coverage:threshold
# - test:e2e
# - security:audit
```

## 📈 Thresholds by Component

| Component Type | Coverage Required | Priority |
|---------------|------------------|----------|
| Core Utils | 95% | High |
| UI Components | 90% | High |
| Business Logic | 85% | Medium |
| API Integrations | 80% | Medium |
| Test Utils | 70% | Low |

## ⚠️ Failure Handling

### Coverage Below Threshold
1. Add missing unit tests
2. Review test coverage for gaps
3. Update component tests
4. Re-run validation

### Linting Issues
1. Run `npm run lint:fix`
2. Manual code formatting if needed
3. Review ESLint configuration

### TypeScript Errors
1. Fix all type errors
2. Update type definitions
3. Review interface changes

## 🎯 Success Criteria

A feature is ready for production when:
- ✅ All quality gates pass
- ✅ Coverage is within thresholds
- ✅ No build or test failures
- ✅ Code review approved
- ✅ Performance budgets met
- ✅ Security scan clean

## 📞 Support

For quality gate issues:
1. Check coverage reports
2. Review CI logs
3. Run diagnostics locally
4. Contact dev team if blockers

---
*Last updated: ${new Date().toLocaleDateString()}*