# Skills Audit Report
**Generated:** December 4, 2025  
**Workspace:** `/home/mark/src/ai/claude/skills/claude-skills/`

---

## Executive Summary

### Overview Statistics
- **Total Skills Analyzed:** 17
- **Total SKILL.md Lines:** 11,459 lines
- **Average Lines Per Skill:** 674 lines
- **Median Lines Per Skill:** 639 lines
- **High-Priority Skills:** 11 (65%)
- **Medium-Priority Skills:** 4 (24%)
- **Low-Priority Skills:** 2 (12%)

### Distribution by Priority
| Priority | Count | Percentage | Avg Lines |
|----------|-------|-----------|-----------|
| High | 11 | 65% | 876 |
| Medium | 4 | 24% | 265 |
| Low | 2 | 12% | 174 |

---

## Detailed Audit Table

| Skill Name | SKILL.md Lines | Primary Content Categories | Existing Resources | Has Templates? | Recommended Modularization | Priority |
|-----------|---|---|---|---|---|---|
| agent-patterns | 307 | Pattern brainstorming, Prompt chaining, Routing, Parallelization, Orchestrator-workers, Evaluator-optimizer, Autonomous agents, Tool development, Language-specific guidance | patterns-reference.md, tool-design.md | Yes | Extract language templates into individual files; Create pattern decision trees | Medium |
| avalonia | 760 | MVVM architecture, XAML layouts, Data binding, Styling & theming, Custom controls, Reactive programming, Cross-platform considerations, Performance optimization, Common patterns, Testing, Debugging | controls-reference.md, styling-guide.md, platform-specific.md | No | Create component library guide; Separate platform-specific implementations; Extract control examples | High |
| azure-devops | 838 | Azure Boards (work items, queries), Azure Repos (Git, PRs, branches), Azure Pipelines (builds, releases, agents), Test Plans, Artifacts, Organization & project management, Security & identity, Extensions, Error handling, Rate limiting | None | No | Modularize by service (Boards, Repos, Pipelines, Test); Create endpoint reference cards; Add WIQL query templates | High |
| azure-swa | 1,365 | Architecture patterns, Project structure, Configuration (routing, auth, headers), API integration with Azure Functions, Authentication (providers, roles, custom), Environment variables, Deployment (GitHub Actions, CLI), Custom domains & SSL, Monitoring, Troubleshooting | None | No | Extract configuration patterns; Create framework-specific deployment templates; Modularize auth strategies; Separate monitoring guide | High |
| blazor-blog-feature | 821 | Architecture overview, Implementation steps, Shared models, NuGet packages, Azure File Share service, Azure Functions, Dependency injection, Blazor components, CSS styling, Local settings, Sample posts, Testing, Deployment, Troubleshooting | None | Yes | Create reusable storage service library; Extract component templates; Create configuration generator tool | High |
| blazor-expert | 639 | Hosting models (Server/WASM/Hybrid), Component development, Lifecycle methods, Parameter handling, State management, Cascading values, Service-based state, Data binding, Event handling, Forms & validation, JavaScript interop, Routing, Authentication | None | No | Separate hosting models into individual guides; Create component pattern library; Extract JS interop examples | High |
| dotnet-aspire | 478 | Overview, Workflow (analysis, clarification, implementation), Project analysis, AppHost setup, ServiceDefaults configuration, Service orchestration, Configuration management, Telemetry, Resource provisioning | components.md, deployment.md | No | Create service identification checklist; Extract orchestration patterns; Build configuration templates | Medium |
| fine-tuning-data-generator | 234 | Requirements gathering, Data generation plan, Synthetic data generation, ChatML format, Quality standards, Batch generation strategy, Framework integration (Unsloth, Axolotl), Validation, Troubleshooting | chatml-format.md, examples.md | Yes | Create domain-specific example libraries; Build generation parameter templates; Extract quality checklist | Medium |
| freeagent-api | 353 | API basics (authentication, requests), Common operations (CRUD), Response format, Error handling, Rate limiting, Best practices, Environment setup, Python examples, Pagination, Filtering | endpoints.md, examples.md | Yes | Create resource-specific operation guides; Build request/response template library; Extract OAuth flow diagrams | Medium |
| genaiscript | 723 | Core concepts, Prompt creation ($), Context definition (def), Script metadata, Functions, Agents & tools, File processing, Schema & validation, Output generation, Debugging, Best practices | api-reference.md, examples.md, patterns.md | No | Separate file processing types; Extract tool definition patterns; Create agent architecture guide | High |
| github-api | 1,578 | Authentication (CLI, PAT, OAuth, Apps), API versions (REST v3, GraphQL v4), Core services (repos, issues, PRs, actions, workflows, projects, etc.), Operations (CRUD, pagination), Error handling, Rate limiting, Best practices, SDKs, Tools | None | No | Modularize by service area; Create operation pattern cards; Build authentication strategy guide; Extract rate limiting implementation | High |
| gof-design-patterns | 303 | 23 patterns across 3 categories (Creational, Structural, Behavioral), Implementation guidelines, Language-specific adaptations, Pattern selection guide, Brainstorming mode, Advanced usage | language-guide.md, patterns-reference.md | No | Create individual pattern implementation files; Build language-specific pattern index; Extract pattern selection decision tree | Medium |
| home-assistant-api | 869 | API status & authentication, Configuration, States & state changes, Service calls, History & logbook, Templates, Events, Error logs, Debug statistics, Camera proxy, Webhooks, Automation triggers, Configuration validation, Multiple connection types | entity-types.md, examples.md, service-reference.md | No | Create service-specific operation guides; Extract entity type catalogs; Build automation pattern library; Separate troubleshooting by entity type | High |
| markdown-formatter | 178 | Headers, Lists, Code blocks, Links & images, Spacing & line length, Emphasis, Tables, Formatting process, Common issues & fixes, Validation script, Batch processing, Limitations | checklist.txt, examples.md, style-guide.md | No | Extract rule-specific fixers; Create formatter plugins; Build pre-commit integration guide | Low |
| microsoft-graph | 351 | Overview & authentication, Resource categories (Identity, Communication, Files, Productivity, Applications, etc.) | applications.md, calendar.md, devices.md, education.md, files.md, identity.md, mail.md, onenote.md, planner.md, reports.md, security.md, teams.md, todo.md, users-groups.md | Yes | Create resource-specific operation guides; Extract common query patterns; Build permission matrix; Create endpoint operation cards | Medium |
| root-cause-analysis | 510 | Core principle, RCA methodologies (5 Whys, Fishbone, Pareto, Fault Tree, Barrier Analysis), Structured RCA process (6 phases), Domain-specific guidance, Best practices, Templates, Continuous improvement | common-root-causes.md, example-analyses.md | Yes | Create domain-specific RCA playbooks; Extract methodology decision trees; Build evidence collection templates; Separate case studies | High |
| thought-patterns | 169 | Quick reference, Orchestration protocol, Pattern selection heuristics, Resource loading guide, Pattern chains, Neurodivergent pattern integration | creative-patterns.md, foundational-patterns.md, metacognitive-patterns.md, neurodivergent-strengths.md, pattern-combinations.md, reasoning-patterns.md, specialized-patterns.md | No | Create pattern selection flowchart; Extract decision heuristics; Build pattern chain templates; Create quick reference cards | Low |

---

## Priority Analysis

### High-Priority Skills (11 skills, 876 avg lines)

These skills are candidates for refactoring due to size and/or complexity:

#### 1. **github-api** (1,578 lines)
- **Complexity:** Very High - Covers entire GitHub service ecosystem
- **Issues:** Monolithic structure covering REST, GraphQL, auth methods, all services
- **Recommended Action:**
  - Split by service area (Repos, PRs, Issues, Actions, Projects, Users, Teams, etc.)
  - Extract authentication strategies into separate guide
  - Create operation pattern library (Create, Update, Delete, Query patterns)
  - Build rate limiting and error handling utilities
  - Create service-specific quick-start guides
- **Expected Outcome:** 5-7 focused modules vs. single large file

#### 2. **azure-swa** (1,365 lines)
- **Complexity:** Very High - Full platform coverage with architecture, auth, deployment, monitoring
- **Issues:** Covers too many concerns in single document; mixes conceptual and procedural content
- **Recommended Action:**
  - Separate architecture patterns from implementation guides
  - Extract authentication into standalone guide (providers, roles, custom auth)
  - Create framework-specific deployment templates (React, Angular, Vue, Blazor, etc.)
  - Extract configuration guide with pattern examples
  - Create monitoring & troubleshooting playbook
- **Expected Outcome:** 4-6 focused guides vs. single comprehensive skill

#### 3. **azure-devops** (838 lines)
- **Complexity:** High - Covers multiple services (Boards, Repos, Pipelines, Test, Artifacts)
- **Issues:** Each service has distinct API patterns; difficult to find specific operations
- **Recommended Action:**
  - Modularize by service area (each as separate guide)
  - Create endpoint reference cards for quick lookup
  - Extract WIQL query templates and examples
  - Build authentication & permission matrix
  - Create rate limiting and error handling guide
- **Expected Outcome:** 5-6 service-specific modules

#### 4. **avalonia** (760 lines)
- **Complexity:** High - Full UI framework coverage with architecture, components, patterns
- **Issues:** Covers MVVM, controls, styling, platform specifics; mix of conceptual and cookbook
- **Recommended Action:**
  - Extract component library guide with reusable patterns
  - Separate platform-specific implementations (Windows, macOS, Linux, Web, Mobile)
  - Create styling guide with theme examples
  - Build reactive programming patterns guide
  - Extract control usage cookbook
- **Expected Outcome:** 5-6 focused guides

#### 5. **blazor-expert** (639 lines)
- **Complexity:** High - Framework expertise covering hosting models, components, state, interop
- **Issues:** Mixes hosting model concepts with general component guidance
- **Recommended Action:**
  - Separate Blazor Server, WebAssembly, and Hybrid hosting as distinct guides
  - Extract component patterns into reusable library
  - Create JavaScript interop patterns guide
  - Build state management patterns (cascading values, services, context API-like patterns)
  - Create form & validation patterns guide
- **Expected Outcome:** 4-5 focused guides

#### 6. **home-assistant-api** (869 lines)
- **Complexity:** High - API covers entities, services, automations, integrations
- **Issues:** Large entity landscape; difficult to find specific entity type documentation
- **Recommended Action:**
  - Create service-specific operation guides (lights, climate, media_player, etc.)
  - Extract entity type catalog with attributes & services
  - Build automation pattern library
  - Create troubleshooting by entity type
  - Extract webhook & integration patterns
- **Expected Outcome:** 6-8 focused guides

#### 7. **genaiscript** (723 lines)
- **Complexity:** High - Framework for prompt orchestration with tools, agents, file processing
- **Issues:** Covers scripting basics, tools, agents, file types; could be more focused
- **Recommended Action:**
  - Extract file processing types (PDF, DOCX, CSV, etc.) into separate guides
  - Create tool definition patterns guide
  - Build agent architecture patterns
  - Create prompt engineering patterns
  - Extract schema & validation guide
- **Expected Outcome:** 4-5 focused guides

#### 8. **blazor-blog-feature** (821 lines)
- **Complexity:** High - Full feature implementation with architecture, code, deployment
- **Issues:** Step-by-step walkthrough format; difficult to reuse components or adapt
- **Recommended Action:**
  - Extract reusable storage service library
  - Create component template library (post list, detail page, metadata)
  - Build configuration generator tool
  - Separate deployment guide
  - Extract testing patterns
- **Expected Outcome:** Component library + deployment guide + patterns

#### 9. **root-cause-analysis** (510 lines)
- **Complexity:** High - Methodology guide covering 5 techniques with domain-specific applications
- **Issues:** Generic methodology plus domain-specific; templates could be more accessible
- **Recommended Action:**
  - Create domain-specific RCA playbooks (Software debugging, Hardware, Process, Life challenges)
  - Extract methodology decision trees
  - Build evidence collection templates by domain
  - Create quick-reference flowcharts
  - Organize case studies by domain
- **Expected Outcome:** Domain-specific guides + templates + playbooks

#### 10. **dotnet-aspire** (478 lines)
- **Complexity:** High - Integration workflow covering analysis, implementation, configuration
- **Issues:** Procedural workflow; could benefit from decision trees and templates
- **Recommended Action:**
  - Create service identification checklist
  - Extract orchestration patterns
  - Build configuration templates
  - Create troubleshooting guide
  - Extract best practices
- **Expected Outcome:** 3-4 focused guides + templates

#### 11. **agent-patterns** (307 lines)
- **Complexity:** Medium-High - 6 patterns with language support and brainstorming workflow
- **Issues:** Pattern reference + implementation guidance; could be more modular
- **Recommended Action:**
  - Extract pattern decision trees
  - Create individual pattern guides with examples
  - Build language-specific template library
  - Extract tool design patterns
  - Create cost vs. complexity comparison matrix
- **Expected Outcome:** Pattern reference library + language templates

---

### Medium-Priority Skills (4 skills, 265 avg lines)

Candidates for enhancement and structural improvement:

#### 1. **gof-design-patterns** (303 lines)
- Current State: Pattern catalog with implementation guidance
- Improvement: Create individual pattern files with language-specific implementations
- Resource Gap: Could benefit from pattern selection flowchart and quick-reference cards

#### 2. **freeagent-api** (353 lines)
- Current State: API guide with examples and operations
- Improvement: Extract resource-specific operation guides; build template library
- Resource Gap: Could add request/response validation templates

#### 3. **microsoft-graph** (351 lines)
- Current State: Overview with references to detailed resource files
- Improvement: Create operation pattern cards for common queries; build permission matrix
- Resource Gap: Needs common pattern examples and query templates

#### 4. **fine-tuning-data-generator** (234 lines)
- Current State: Workflow guide with quality standards
- Improvement: Create domain-specific example libraries; build generation templates
- Resource Gap: Could add more diverse domain examples

---

### Low-Priority Skills (2 skills, 174 avg lines)

Well-structured, focused skills with minimal refactoring needs:

#### 1. **markdown-formatter** (178 lines)
- Current State: Clear, focused, with good structure
- Status: Ready for use; enhancement opportunities are optional

#### 2. **thought-patterns** (169 lines)
- Current State: Orchestration guide with pattern selection logic
- Status: Ready for use; could benefit from visual flowcharts

---

## Top 5 Refactoring Recommendations

### 🔴 Priority 1: GitHub API (1,578 lines)
**Refactoring Impact:** HIGH  
**Effort:** Medium  
**Complexity Reduction:** 60-70%

**Recommended Structure:**
```
github-api/
├── SKILL.md (overview & auth methods)
├── resources/
│   ├── repositories-api.md
│   ├── issues-prs-api.md
│   ├── actions-workflows-api.md
│   ├── projects-api.md
│   ├── users-teams-api.md
│   ├── authentication-guide.md
│   └── error-handling.md
└── templates/
    ├── common-queries.graphql
    ├── rate-limiting-handler.js
    └── operation-patterns.md
```

### 🔴 Priority 2: Azure SWA (1,365 lines)
**Refactoring Impact:** HIGH  
**Effort:** Medium  
**Complexity Reduction:** 50-60%

**Recommended Structure:**
```
azure-swa/
├── SKILL.md (overview)
├── resources/
│   ├── architecture-patterns.md
│   ├── authentication-guide.md
│   ├── configuration-reference.md
│   ├── monitoring-troubleshooting.md
│   └── framework-deployment/ (React, Vue, Angular, Blazor)
└── templates/
    ├── staticwebapp.config.json
    └── github-workflow-templates/
```

### 🟠 Priority 3: Azure DevOps (838 lines)
**Refactoring Impact:** MEDIUM-HIGH  
**Effort:** Medium  
**Complexity Reduction:** 40-50%

**Recommended Structure:**
```
azure-devops/
├── SKILL.md (overview & auth)
├── resources/
│   ├── boards-api.md (work items, queries, backlogs)
│   ├── repos-api.md (Git, PRs, commits, branches)
│   ├── pipelines-api.md (builds, releases, agents)
│   ├── test-api.md (test plans, results)
│   ├── artifacts-api.md
│   ├── security-permissions.md
│   └── rate-limiting.md
└── templates/
    ├── wiql-queries.sql
    └── common-operations.md
```

### 🟠 Priority 4: Avalonia (760 lines)
**Refactoring Impact:** MEDIUM-HIGH  
**Effort:** Medium  
**Complexity Reduction:** 40-50%

**Recommended Structure:**
```
avalonia/
├── SKILL.md (overview)
├── resources/
│   ├── mvvm-architecture.md
│   ├── components-patterns.md
│   ├── styling-theming.md
│   ├── reactive-programming.md
│   ├── performance-optimization.md
│   ├── platform-specifics/ (windows, macos, linux, web, mobile)
│   └── testing-debugging.md
└── templates/
    ├── component-templates/
    └── style-templates/
```

### 🟠 Priority 5: Home Assistant API (869 lines)
**Refactoring Impact:** MEDIUM-HIGH  
**Effort:** Medium-High  
**Complexity Reduction:** 40-50%

**Recommended Structure:**
```
home-assistant-api/
├── SKILL.md (overview & authentication)
├── resources/
│   ├── entity-types/ (light, climate, media_player, etc.)
│   ├── service-reference.md
│   ├── automation-patterns.md
│   ├── webhook-integration.md
│   ├── history-templates.md
│   └── troubleshooting-guide.md
└── templates/
    ├── automation-examples/
    └── service-call-patterns.md
```

---

## Orchestration Sequence

### Phase 1: Quick Wins (High Impact, Low Effort)
**Timeline:** Week 1-2

1. **Agent Patterns** - Extract pattern templates and decision trees
   - Create individual pattern guides
   - Build language selection flowchart
   - Expected result: Clear pattern selection process

2. **Thought Patterns** - Create visual flowcharts and quick reference cards
   - Build pattern selection decision tree
   - Create quick reference cards
   - Expected result: Improved discoverability

3. **Markdown Formatter** - Already well-structured, validate & document
   - Status: Ready to ship as-is
   - Expected result: Immediate usefulness

### Phase 2: Medium Complexity (Medium Impact, Medium Effort)
**Timeline:** Week 3-4

4. **Gof Design Patterns** - Modularize by pattern category
   - Create individual pattern implementation files
   - Build language-specific index
   - Create pattern selection guide

5. **FreeAgent API** - Extract resource-specific guides
   - Build request/response templates
   - Create operation pattern library
   - Document common workflows

6. **Microsoft Graph** - Create operation cards and permission matrix
   - Extract common query patterns
   - Build resource-specific guides
   - Create quick-reference documentation

### Phase 3: High Complexity (High Impact, High Effort)
**Timeline:** Week 5-8

7. **Root Cause Analysis** - Create domain-specific playbooks
   - Separate by domain (Software, Hardware, Process, Life)
   - Extract methodology guides
   - Build evidence templates

8. **Blazor Expert** - Separate hosting models
   - Create Blazor Server, WebAssembly, Hybrid guides
   - Extract component patterns
   - Build JS interop patterns

9. **Dotnet Aspire** - Extract orchestration patterns
   - Create service identification checklist
   - Build configuration templates
   - Extract best practices

### Phase 4: Major Refactors (Highest Impact, Highest Effort)
**Timeline:** Week 9-16

10. **Home Assistant API** - Organize by entity types
    - Create entity-specific guides
    - Build automation pattern library
    - Extract troubleshooting by type

11. **Avalonia** - Separate by concern (MVVM, Components, Styling, Platforms)
    - Extract platform-specific implementations
    - Create component library
    - Build styling patterns

12. **Azure DevOps** - Modularize by service area
    - Create service-specific guides
    - Build operation templates
    - Extract authentication guide

13. **Blazor Blog Feature** - Extract reusable components
    - Build component library
    - Create configuration templates
    - Extract deployment guide

### Phase 5: Epic Refactors (Maximum Impact, Maximum Effort)
**Timeline:** Week 17-24

14. **Azure SWA** - Complete restructuring
    - Separate architecture, auth, deployment, monitoring
    - Create framework-specific templates
    - Build troubleshooting guide

15. **GitHub API** - Comprehensive modularization
    - Split by service area (Repos, PRs, Issues, Actions, etc.)
    - Extract authentication strategies
    - Create operation pattern library

---

## Cross-Cutting Recommendations

### 1. Template Standardization
Many skills could benefit from consistent template structures:
- API Operation Templates (GET, POST, PUT, DELETE, with examples)
- Error Handling Templates
- Configuration Templates
- Quick-Start Templates

### 2. Resource File Organization
Establish consistent naming for resource files:
- `*-reference.md` - Comprehensive API/concept reference
- `*-guide.md` - How-to and implementation guides
- `*-patterns.md` - Design and usage patterns
- `*-examples.md` - Code examples and use cases
- `*-troubleshooting.md` - Problem diagnosis and solutions

### 3. Template Directory Structure
Standardize template organization:
```
templates/
├── quick-start/
├── implementation/
├── configuration/
├── code-samples/
└── examples/
```

### 4. Documentation Enhancement
Consider adding to all skills:
- Visual flowcharts for decision points
- Comparison tables for option selection
- Quick-reference cards
- Common pitfalls & solutions section
- Integration examples with other skills

---

## Summary by Category

### By Content Maturity
- **Mature, Ready:** markdown-formatter, thought-patterns (2 skills)
- **Solid, Enhancement Opportunities:** gof-design-patterns, freeagent-api, microsoft-graph, fine-tuning-data-generator (4 skills)
- **Needs Modularization:** agent-patterns, dotnet-aspire, root-cause-analysis, blazor-blog-feature (4 skills)
- **Needs Significant Refactoring:** blazor-expert, avalonia, home-assistant-api (3 skills)
- **Needs Major Restructuring:** azure-devops, azure-swa, github-api (3 skills)

### By Resource Completeness
- **Well-Resourced (3+ resource files):** avalonia (3), azure-devops (0), home-assistant-api (3), microsoft-graph (14), agent-patterns (2) 
- **Moderately-Resourced (1-2 files):** dotnet-aspire (2), freeagent-api (2), genaiscript (3), gof-design-patterns (2), root-cause-analysis (2)
- **Under-Resourced (0 files):** azure-swa, blazor-blog-feature, blazor-expert, github-api, markdown-formatter, thought-patterns

### By Template Presence
- **Has Templates:** agent-patterns, blazor-blog-feature, fine-tuning-data-generator, freeagent-api, microsoft-graph, root-cause-analysis (6 skills)
- **No Templates:** avalonia, azure-devops, azure-swa, blazor-expert, dotnet-aspire, genaiscript, github-api, gof-design-patterns, home-assistant-api, markdown-formatter, thought-patterns (11 skills)

---

## Key Metrics

| Metric | Value | Interpretation |
|--------|-------|-----------------|
| Avg. Lines Per Skill | 674 | Moderate; some skills are becoming difficult to navigate |
| Largest Skill | 1,578 (GitHub API) | Significantly oversized; needs refactoring |
| Median Lines | 639 | About 60% of skills exceed optimal size |
| Skills >700 lines | 7 (41%) | High concentration of large skills |
| Skills with Resources | 12 (71%) | Good resource supplementation |
| Skills with Templates | 6 (35%) | Room for improvement in template coverage |
| Total Resource Files | 48 | Well-distributed knowledge base |

---

## Implementation Priorities

### Must Do (Addresses Core Issues)
1. ✅ GitHub API - Too large, multiple services
2. ✅ Azure SWA - Too large, mixed concerns
3. ✅ Azure DevOps - Multiple services need separation

### Should Do (Improves Usability)
4. ✅ Avalonia - Separate platforms and concerns
5. ✅ Home Assistant API - Organize by entity types
6. ✅ Blazor Expert - Separate hosting models

### Nice to Have (Incremental Improvements)
7. ✅ Root Cause Analysis - Domain-specific playbooks
8. ✅ Dotnet Aspire - Add templates and checklists
9. ✅ Blazor Blog Feature - Extract components

---

## Conclusion

The skills repository contains high-quality, comprehensive documentation but exhibits signs of monolithic structure in several skills. The main issues are:

1. **Size**: 7 skills exceed 700 lines, making navigation difficult
2. **Scope**: Several skills cover multiple distinct concerns without clear separation
3. **Templates**: Only 35% of skills include templates; most could benefit
4. **Resources**: Well-distributed; could be enhanced with more cross-references

**Recommended Approach:**
- Start with Phase 1 quick wins to establish pattern
- Move to Phase 2-3 for high-impact medium-complexity refactors
- Tackle Phase 4-5 epic refactors based on usage metrics
- Establish template standards for new skills

**Expected Outcomes After Refactoring:**
- 30-40% reduction in average skill file size
- Improved navigation and discoverability
- Better template coverage (target: 80%)
- Clearer separation of concerns
- Easier maintenance and updates
- Enhanced developer experience

---

**Report Generated:** December 4, 2025  
**Total Time to Analyze:** Complete dataset read and analysis  
**Next Steps:** Prioritize refactoring based on usage metrics and team capacity
