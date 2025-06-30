# 🎯 BettingTable Refactor Session - Project Roadmap

## 📋 **SESSION GOAL**
Refactor the 11+ duplicated betting table components into a single, generic `BettingTable<T>` component to eliminate ~1,500 lines of duplicated code while maintaining 100% functional compatibility.

## 🔥 **THE PROBLEM**
- **11+ table components** with 90%+ identical code structure
- **~1,500 lines** of near-duplicate code
- **Maintenance nightmare**: Changes require updating 11+ files
- **Bug amplification**: Same bugs exist in multiple places
- **Developer confusion**: Unclear which table to use as reference

### Affected Components:
**Main Tables:**
- `SidesTable.tsx` (160 lines)
- `TotalsTable.tsx` (200 lines) 
- `PlayerPropsTable.tsx` (150 lines)
- `FirstInningTable.tsx` (171 lines)
- `ScoringOrderPropsTable.tsx` (125 lines)
- `SeriesTable.tsx` (93 lines)

**Comparison Tables:**
- `ComparisonSidesTable.tsx` (108 lines)
- `ComparisonTotalsTable.tsx` (138 lines)
- `ComparisonPlayerPropsTable.tsx` (112 lines)
- `ComparisonFirstInningPropsTable.tsx` (88 lines)
- `ComparisonScoringOrderPropsTable.tsx` (102 lines)

## ✅ **SUCCESS CRITERIA**
1. **Functional Parity**: All existing table behavior preserved
2. **Code Reduction**: ~1,500 lines → ~200 lines (87% reduction)
3. **Test Coverage**: 90%+ test coverage on new generic component
4. **Zero Regressions**: All existing tests pass
5. **Performance**: No performance degradation
6. **Maintainability**: Single source of truth for table logic

## 🛠️ **SOLUTION APPROACH**
Create a generic `BettingTable<T>` component that accepts:
- **Column Configuration**: Defines structure, formatting, display rules
- **Data Formatter Function**: Transforms raw data for display
- **Comparison Rules**: Optional color coding for comparison tables
- **Table Options**: Sorting, filtering, styling options

---

## 📋 **DETAILED EXECUTION PLAN**

### **PHASE 1: Test Foundation Setup** ⏱️ *Week 1*

#### Step 1.1: Environment Setup
- [ ] Create `tests/unit/` directory structure
- [ ] Set up Jest + React Testing Library configuration
- [ ] Create test data fixtures from real simulation results
- [ ] Verify test runner works with existing codebase

#### Step 1.2: Data Formatting Tests (Critical Foundation)
- [ ] **File**: `tests/unit/data-formatting.test.ts`
- [ ] Test `displayAmericanOdds()` function
  - [ ] Positive odds: `150` → `"+150"`
  - [ ] Negative odds: `-200` → `"-200"`
  - [ ] Edge cases: `0`, large numbers, `NaN`
- [ ] Test `formatDecimal()` function
  - [ ] Standard decimals: `0.1234` → `"0.12"`
  - [ ] Percentage conversion: `0.1234 * 100` → `"12.34%"`
  - [ ] Edge cases: `NaN`, `Infinity`, very small numbers
- [ ] Test `formatROIDemandPrice()` function
  - [ ] Various price formats and edge cases

#### Step 1.3: Column Configuration Tests
- [ ] **File**: `tests/unit/column-configs.test.ts`
- [ ] Test each table's column configuration:
  - [ ] `sidesColumns` - verify required fields, types, widths
  - [ ] `totalsColumns` - verify over/under columns
  - [ ] `playerPropsColumns` - verify player-specific fields
  - [ ] `firstInningColumns` - verify specialized columns
  - [ ] `scoringOrderPropsColumns` - verify prop types
  - [ ] `seriesColumns` - verify series-specific fields
  - [ ] All comparison table columns
- [ ] Verify frozen columns, display rules, sorting config

#### Step 1.4: Data Transformation Tests
- [ ] **File**: `tests/unit/data-transformers.test.ts`
- [ ] Test all `format*Data()` functions:
  - [ ] `formatSidesData()` - percentage and odds formatting
  - [ ] `formatTotalsData()` - over/under/push percentages
  - [ ] `formatPlayerPropsData()` - player stats formatting
  - [ ] `formatFirstInningData()` - specialized calculations
  - [ ] `formatScoringOrderPropsData()` - prop formatting
  - [ ] `formatSeriesData()` - series win percentages
  - [ ] All comparison data formatters

### **PHASE 2: Component Baseline Tests** ⏱️ *Week 1-2*

#### Step 2.1: Component Rendering Tests
- [ ] **File**: `tests/unit/table-components.test.ts`
- [ ] Test each existing table component:
  - [ ] Renders with valid data
  - [ ] Handles empty data arrays
  - [ ] Handles `null`/`undefined` values gracefully
  - [ ] Displays formatted data correctly
  - [ ] Applies correct CSS classes and styles

#### Step 2.2: Integration Tests
- [ ] **File**: `tests/integration/table-integration.test.ts`
- [ ] End-to-end data flow tests:
  - [ ] Raw simulation data → transformation → table display
  - [ ] Verify complete data pipeline for each table type
  - [ ] Test with realistic MLB simulation results

#### Step 2.3: Baseline Test Run
- [ ] Run all tests and establish baseline
- [ ] Document any existing bugs/issues found
- [ ] Fix critical issues that would interfere with refactor
- [ ] **MILESTONE**: Complete test coverage of existing behavior

### **PHASE 3: Generic Component Design** ⏱️ *Week 2*

#### Step 3.1: Interface Design
- [ ] **File**: `src/renderer/apps/simDash/components/BettingTable/types.ts`
- [ ] Define generic interfaces:
  ```typescript
  interface BettingTableProps<T>
  interface ColumnConfig<T>
  interface FormatterFunction<T>
  interface ComparisonConfig<T>
  ```

#### Step 3.2: Column Configuration System
- [ ] **File**: `src/renderer/apps/simDash/components/BettingTable/columns.ts`
- [ ] Create column config factory functions
- [ ] Migrate existing column configs to new system
- [ ] Add validation for column configurations

#### Step 3.3: Formatter Function System
- [ ] **File**: `src/renderer/apps/simDash/components/BettingTable/formatters.ts`
- [ ] Create generic formatter interface
- [ ] Migrate existing format functions
- [ ] Add composition utilities for complex formatting

### **PHASE 4: Generic Component Implementation** ⏱️ *Week 2-3*

#### Step 4.1: Core Component
- [ ] **File**: `src/renderer/apps/simDash/components/BettingTable/BettingTable.tsx`
- [ ] Implement generic table component using TDD approach
- [ ] Support all existing functionality:
  - [ ] Column rendering with custom formatters
  - [ ] Sorting capabilities
  - [ ] Frozen columns
  - [ ] Custom display rules
  - [ ] Comparison color coding

#### Step 4.2: Comparison Table Support
- [ ] **File**: `src/renderer/apps/simDash/components/BettingTable/ComparisonBettingTable.tsx`
- [ ] Extend base component for comparison tables
- [ ] Implement color-coding logic
- [ ] Support difference calculations

#### Step 4.3: Configuration Presets
- [ ] **File**: `src/renderer/apps/simDash/components/BettingTable/presets.ts`
- [ ] Create preset configurations for each table type
- [ ] Export convenience components with pre-configured settings

### **PHASE 5: Migration Implementation** ⏱️ *Week 3*

#### Step 5.1: Replace Components One-by-One
- [ ] **Strategy**: Feature flag approach for safe rollout
- [ ] Create new components using generic table:
  - [ ] `SidesTable` (start with simplest)
  - [ ] `SeriesTable`
  - [ ] `PlayerPropsTable`
  - [ ] `ScoringOrderPropsTable`
  - [ ] `FirstInningTable`
  - [ ] `TotalsTable` (most complex)
- [ ] Update imports in consuming components
- [ ] Run tests after each migration

#### Step 5.2: Comparison Tables Migration
- [ ] Migrate all comparison tables:
  - [ ] `ComparisonSidesTable`
  - [ ] `ComparisonTotalsTable`
  - [ ] `ComparisonPlayerPropsTable`
  - [ ] `ComparisonFirstInningPropsTable`
  - [ ] `ComparisonScoringOrderPropsTable`

#### Step 5.3: Cleanup Legacy Code
- [ ] Remove old table component files
- [ ] Update all imports and references
- [ ] Clean up unused utility functions
- [ ] Update documentation

### **PHASE 6: Verification & Optimization** ⏱️ *Week 4*

#### Step 6.1: Comprehensive Testing
- [ ] **File**: `tests/e2e/table-visual.spec.ts`
- [ ] Visual regression tests with Playwright
- [ ] Performance testing vs. old components
- [ ] Memory usage verification

#### Step 6.2: Documentation
- [ ] **File**: `src/renderer/apps/simDash/components/BettingTable/README.md`
- [ ] Usage guide for new generic component
- [ ] Migration guide for future table types
- [ ] Performance characteristics documentation

#### Step 6.3: Final Verification
- [ ] Run complete test suite
- [ ] Manual testing of all table types
- [ ] Performance benchmarking
- [ ] Code review checklist completion

---

## 🛡️ **RISK MITIGATION STRATEGIES**

### Technical Risks
- **Feature Flags**: Toggle between old/new implementations
- **Incremental Migration**: Replace one table at a time
- **Rollback Plan**: Keep old components until 100% confident
- **Extensive Testing**: 90%+ test coverage requirement

### Business Risks
- **User Testing**: Test with real customer simulation data
- **Staged Rollout**: Internal testing before customer deployment
- **Performance Monitoring**: Track component render times
- **Bug Tracking**: Monitor for regressions after deployment

### Development Risks
- **Clear Interfaces**: Well-defined TypeScript interfaces
- **Documentation**: Comprehensive usage examples
- **Code Review**: Multiple developer sign-offs
- **Testing**: Both unit and integration test coverage

---

## 📊 **PROGRESS TRACKING**

### Completed ✅
- [x] Session planning and roadmap creation
- [x] Problem analysis and solution design
- [x] **Phase 1 Step 1.1**: Environment Setup - Jest + React Testing Library configuration
- [x] **Phase 1 Step 1.2**: Data Formatting Tests - All formatting function tests passing

### In Progress 🔄
- [ ] **Phase 1 Step 1.3**: Column Configuration Tests
- [ ] **Phase 1 Step 1.4**: Data Transformation Tests

### Upcoming ⏳
- [ ] Phase 2: Component Baseline Tests
- [ ] Phase 3: Generic Component Design
- [ ] Phase 4: Generic Component Implementation
- [ ] Phase 5: Migration Implementation
- [ ] Phase 6: Verification & Optimization

---

## 🎯 **KEY METRICS**

### Current Status (Before Refactor)
- **Files**: 11+ table components
- **Lines of Code**: ~1,500 lines
- **Maintenance Cost**: High (11+ files to update per change)
- **Bug Risk**: High (same bugs in multiple places)
- **Test Coverage**: Phase 1 foundation tests ✅ (27/27 passing)

### After Refactor (Target)
- **Files**: 1 generic component + presets
- **Lines of Code**: ~200 lines (87% reduction)
- **Maintenance Cost**: Low (single source of truth)
- **Bug Risk**: Low (centralized logic)
- **Test Coverage**: 90%+

---

## 📝 **SESSION NOTES**
*Use this section to track decisions, blockers, and insights during the refactor process*

### Key Decisions Made:
- [x] **Minimal Jest Configuration**: Opted for @swc/jest over ts-jest for faster TypeScript compilation
- [x] **Test Expectations Alignment**: Updated tests to match actual function behavior rather than changing implementations
- [x] **Package Cleanup**: Removed unnecessary testing dependencies that caused memory conflicts

### Blockers Encountered:
- [x] **Jest Memory Issues**: Initial Jest configuration caused JavaScript heap out of memory errors
  - **Resolution**: Removed conflicting packages (identity-obj-proxy, jest-transform-stub, ts-jest, @testing-library/user-event, @types/jest)
- [x] **Test Failures**: Initial tests had incorrect expectations for formatting function outputs
  - **Resolution**: Analyzed actual function implementations and updated test expectations accordingly

### Insights & Learnings:
- [x] **formatROIDemandPrice()**: Returns fixed 2-decimal format (e.g., "+145.20"), not rounded integers
- [x] **displayAmericanOdds()**: Preserves input decimal precision, doesn't round to integers
- [x] **formatDecimal()**: Standard 2-decimal formatting with proper rounding
- [x] **Test Foundation**: Successfully established working Jest environment for comprehensive testing

---

**Last Updated**: January 2025
**Session Status**: Phase 1 - Test Foundation Setup (Steps 1.1-1.2 Complete ✅) 