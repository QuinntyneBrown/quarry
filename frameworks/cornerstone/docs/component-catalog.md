# Cornerstone component catalog for Liturgy and Word Up

## Purpose

This document defines the component surface Cornerstone needs in order to supply all reusable UI
building blocks used by Liturgy and Word Up. Application routes, domain data fetching, authorization,
state-machine rules, and page-specific copy remain in the applications; the visual structure,
interaction behavior, accessibility semantics, and FaithTech styling belong in Cornerstone.

The catalog covers:

- Liturgy's authenticated workspace and its 4D/5R workflow UI.
- Word Up's public site and youth, mentor, guardian, volunteer, administrator, authentication,
  settings, and system-state experiences.
- Desktop and responsive/mobile variants visible in the audited implementations.

Every catalog entry is required for complete coverage. The delivery phase indicates sequencing, not
whether an item is optional.

## Audit baseline

| Source                                               | Revision audited                                                                                                  | Primary evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Liturgy](https://github.com/QuinntyneBrown/Liturgy) | [`e5fa9a2`](https://github.com/QuinntyneBrown/Liturgy/tree/e5fa9a25b8b22f8dff477f98978e30b7f01f0e64) (2026-07-17) | [Angular pages](https://github.com/QuinntyneBrown/Liturgy/tree/e5fa9a25b8b22f8dff477f98978e30b7f01f0e64/frontend/projects/liturgy-app/src/app), [Liturgy components](https://github.com/QuinntyneBrown/Liturgy/tree/e5fa9a25b8b22f8dff477f98978e30b7f01f0e64/frontend/projects/liturgy/components/src/lib), and [application styles](https://github.com/QuinntyneBrown/Liturgy/blob/e5fa9a25b8b22f8dff477f98978e30b7f01f0e64/frontend/projects/liturgy-app/src/styles.scss)                                                                                             |
| [Word Up](https://github.com/QuinntyneBrown/word-up) | [`e8fd915`](https://github.com/QuinntyneBrown/word-up/tree/e8fd915f5ede70b8558afba6302cf09d84c94369) (2026-07-19) | [Portal pages](https://github.com/QuinntyneBrown/word-up/tree/e8fd915f5ede70b8558afba6302cf09d84c94369/frontend/projects/portal/src/app), [public-site pages](https://github.com/QuinntyneBrown/word-up/tree/e8fd915f5ede70b8558afba6302cf09d84c94369/frontend/projects/public-site/src/app), [`wu-ui`](https://github.com/QuinntyneBrown/word-up/tree/e8fd915f5ede70b8558afba6302cf09d84c94369/frontend/projects/wu-ui/src), and the [style guide](https://github.com/QuinntyneBrown/word-up/blob/e8fd915f5ede70b8558afba6302cf09d84c94369/docs/mocks/styleguide.html) |
| Cornerstone                                          | Local workspace on 2026-07-20                                                                                     | Public exports in `src/cornerstone/public-api.ts` and the Liturgy/Word Up compatibility styles                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

The audit included 20 Liturgy application/library HTML templates and 74 Word Up
application/library HTML templates. It also inspected route definitions, component APIs, CSS class
families, native controls, ARIA patterns, and Angular CDK use. Mock-only design-system examples were
used to confirm intended variants, but a component is included because an application surface needs
it, not merely because it appears in a style guide.

## Status and delivery vocabulary

| Term          | Meaning                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Available** | A public `cs-*` Angular component/directive/service already exists. Its variants may still need the enhancements listed in the catalog. |
| **Partial**   | Cornerstone has a related primitive or CSS, but not the complete behavior/API required by both applications.                            |
| **Bridge**    | Compatibility CSS can preserve current markup, but there is no first-class Cornerstone Angular API.                                     |
| **Missing**   | Cornerstone does not yet provide a meaningful component implementation.                                                                 |
| **Phase 1**   | Foundations and controls needed before either application can stop owning core UI behavior.                                             |
| **Phase 2**   | Reusable application patterns needed to migrate the majority of pages.                                                                  |
| **Phase 3**   | Rich/domain-oriented composites needed for full application coverage.                                                                   |

## Current Cornerstone coverage

Cornerstone already exports buttons, cards, badges, alerts, avatars, a linear progress bar, spinner,
skeleton, divider, empty state, text/select/textarea controls, field framing, switch, tabs,
accordion, menu directives, shell, paginator, stepper, dialog service/shell, and toast service/outlet.
It also has CSS for tables and broad compatibility styles for both source applications.

That is a strong primitive layer, but compatibility CSS is not the target component API. Full
supplier status requires replacing page-owned interaction logic and repeated DOM structures with
typed, accessible Cornerstone components.

## 1. Foundations and layout

| Proposed public API                                         | Required capability and variants                                                                                                                                       | Used by                                | Status                          | Phase |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------- | ----- |
| `CsTheme`, theme styles                                     | FaithTech color, type, spacing, radius, elevation, motion, focus, dark/high-contrast, reduced-motion, and responsive tokens; application-level theme override contract | Both                                   | **Available**                   | 1     |
| `IconComponent`, `IconRegistry`                             | Named, tree-shakeable SVG icons; decorative and labelled modes; size/fill variants; SSR-safe rendering                                                                 | Both, especially Word Up shell/actions | **Missing**                     | 1     |
| Typography styles/directives                                | Display headings, body, eyebrow, muted/meta text, monospace/code, accent/scripture quote, links, truncation, and readable prose                                        | Both                                   | **Partial**                     | 1     |
| `ContainerComponent`                                        | Default, wide, and narrow content bounds with responsive gutters                                                                                                       | Both                                   | **Bridge**                      | 1     |
| `CsStackDirective`, `CsClusterDirective`, `CsGridDirective` | Vertical stack, wrapping cluster, responsive 2/3/4/auto grid, alignment, gap, and distribution inputs                                                                  | Both                                   | **Partial** (CSS utilities)     | 1     |
| `PageComponent`                                             | Standard content frame with eyebrow, title, subtitle, actions, loading/error slots, and responsive header behavior                                                     | Both; pervasive in Word Up             | **Bridge**                      | 1     |
| `SectionComponent`, `SectionHeaderComponent`                | Label/title/description/action framing used inside dashboards, forms, reports, and marketing pages                                                                     | Both                                   | **Bridge**                      | 2     |
| `CardComponent` and slots                                   | Paper/greige/ink/lime, flat/raised/link/selected/disabled tones; header, content, footer, and actions                                                                  | Both                                   | **Available**, variants partial | 1     |
| `DividerComponent`                                          | Horizontal/vertical orientation and inset/spacing variants                                                                                                             | Both                                   | **Available**, variants partial | 1     |
| `ToolbarComponent`, `ActionBarComponent`                    | Responsive action grouping; start/end slots; sticky option; overflow strategy                                                                                          | Both                                   | **Missing**                     | 2     |
| `CsSkipLinkDirective`, `CsVisuallyHiddenDirective`          | Keyboard skip navigation and reusable screen-reader-only content                                                                                                       | Both                                   | **Partial** (CSS only)          | 1     |
| `CsResponsiveRegionDirective`                               | Shared responsive collapse/reflow behavior for tables, side panels, filters, and action bars                                                                           | Word Up                                | **Missing**                     | 2     |

## 2. Actions and form controls

| Proposed public API                            | Required capability and variants                                                                                                                           | Used by                                          | Status                                   | Phase |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | ----- |
| `CsButtonDirective`                            | Primary, secondary/dark, ghost, subtle, danger, on-dark, link, block, small/medium/large, icon-leading/trailing, loading, disabled, and locked-with-reason | Both                                             | **Available**, variants partial          | 1     |
| `CsIconButtonDirective`                        | Consistent square action with required accessible label, sizes, badge/dot, loading, and tooltip integration                                                | Both                                             | **Partial** (`icon` button variant)      | 1     |
| `ButtonGroupComponent`                         | Related actions and split primary/secondary actions; wraps safely on small screens                                                                         | Both                                             | **Missing**                              | 2     |
| `FieldComponent`                               | Label, required/optional marker, hint, error, success, character count, control ID wiring, and disabled/read-only states                                   | Both                                             | **Available**, semantics partial         | 1     |
| `CsInputDirective`                             | Text, email, password, number, URL, telephone, search, date, time, and date-time styling; prefix/suffix support                                            | Both                                             | **Available**, variants partial          | 1     |
| `CsTextareaDirective`                          | Resizable and fixed-height variants, character count, and autosize via CDK text field                                                                      | Both                                             | **Available**, autosize missing          | 1     |
| `CsSelectDirective`                            | Single native select, optgroups, empty/loading/error states, and compact form/table variants                                                               | Both                                             | **Available**, variants partial          | 1     |
| `CheckboxComponent`                            | Checked, indeterminate, validation, descriptive content, disabled, and checklist-row presentation                                                          | Both                                             | **Missing**                              | 1     |
| `RadioGroupComponent`, `RadioComponent`        | Keyboard-managed group, descriptions, validation, disabled state, and card/segmented choice presentation                                                   | Word Up                                          | **Missing**                              | 1     |
| `SwitchComponent`                              | Label/description, disabled, validation, and reactive-forms support through `ControlValueAccessor`                                                         | Word Up                                          | **Available**, forms integration partial | 1     |
| `InputGroupComponent`, `InputAddonDirective`   | Prefix/suffix text or icon and connected submit/action buttons                                                                                             | Word Up                                          | **Bridge**                               | 1     |
| `SearchFieldComponent`                         | Search icon, clear button, submit/debounce options, accessible result status                                                                               | Word Up directories, rosters, reports            | **Missing**                              | 2     |
| `ComboboxComponent`                            | CDK overlay listbox, autocomplete/typeahead, single/multiple selection, async results, empty state                                                         | Word Up people/cohort selection                  | **Missing**                              | 2     |
| `DateFieldComponent`, `DateTimeFieldComponent` | FaithTech-styled native-first date/time controls with validation and locale-safe value contract                                                            | Word Up schedule, reports, announcements         | **Partial** (raw inputs only)            | 2     |
| `FilePickerComponent`, `DropzoneComponent`     | Browse/drop, accept/size validation, selected-file summary, remove/retry, upload progress, and image/document preview                                      | Word Up imports, submissions, evidence, branding | **Missing**                              | 2     |
| `ChoiceCardComponent`, `ChoiceGroupComponent`  | Large radio/checkbox choices used for quiz answers, RSVP, mood, attendance, audience, and consent decisions                                                | Word Up                                          | **Missing**                              | 2     |
| `FormActionsComponent`                         | Primary/secondary placement, submit/loading state, cancel/back, mobile sticky treatment                                                                    | Both                                             | **Missing**                              | 2     |
| `ValidationSummaryComponent`                   | Page/form-level error summary with links to invalid fields and live announcement                                                                           | Word Up complex forms                            | **Missing**                              | 2     |
| `WizardComponent`                              | Step state, back/next/skip/finish actions, validation gates, save/resume, and compact mobile layout                                                        | Word Up onboarding and roster import             | **Partial** (`CsStepper`)                | 2     |

All form controls should implement Angular forms integration where they own a value, preserve native
form submission semantics where practical, and expose stable IDs/ARIA relationships rather than
requiring each page to construct them.

## 3. Navigation and shells

| Proposed public API                                           | Required capability and variants                                                                                                   | Used by                            | Status                                 | Phase |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------- | ----- |
| `ShellComponent`                                              | Sticky top bar, responsive side navigation/drawer, scrim, main landmark, focus restoration, and projected content                  | Both                               | **Available**, content model partial   | 1     |
| `TopbarComponent`                                             | Brand, breadcrumbs/title, context/status pills, notifications, user/account actions, and mobile menu trigger                       | Both                               | **Missing**                            | 2     |
| `SidenavComponent`, `NavGroupComponent`, `CsNavItemDirective` | Group headings, icons, badges, active/disabled states, route integration, role-filtered configuration, and compact/mobile behavior | Both                               | **Bridge**                             | 2     |
| `BottomNavComponent`                                          | Mobile primary navigation with icon/label/badge and safe-area handling                                                             | Word Up                            | **Bridge**                             | 2     |
| `BreadcrumbsComponent`                                        | Router-aware crumbs, current-page semantics, collapse/overflow, and mobile truncation                                              | Both                               | **Missing**                            | 2     |
| `AccountMenuComponent`                                        | Avatar/name trigger, profile/settings/support/sign-out actions, keyboard navigation, and outside-click/focus handling              | Word Up                            | **Partial** (`CsMenuDirective`)        | 2     |
| `TabGroupComponent`                                           | Keyboard navigation, disabled tabs, badges, lazy panels, controlled selection, and responsive overflow                             | Both                               | **Available**, controlled API partial  | 1     |
| `SegmentedControlComponent`                                   | Single-select compact view/filter switcher with roving focus                                                                       | Word Up calendar and reports       | **Bridge**                             | 2     |
| `CsMenuDirective`, `CsMenuItemDirective`, `PopoverComponent`  | Anchored menu/popover, separators, danger actions, checkable items, focus return, and collision-aware CDK positioning              | Both                               | **Available**, trigger/popover partial | 1     |
| `AccordionComponent`                                          | Single/multiple expansion, disabled items, controlled state, keyboard navigation, and lazy content                                 | Word Up long forms/content         | **Available**, behavior partial        | 2     |
| `PaginatorComponent`                                          | Previous/next, page count, page-size selection, compact mobile mode, and live result summary                                       | Word Up tables/audit; general      | **Available**, variants partial        | 2     |
| `MarketingHeaderComponent`, `MarketingFooterComponent`        | Responsive public navigation, brand, CTA, mobile menu, legal/social/link groups                                                    | Word Up public site; Liturgy cover | **Bridge**                             | 3     |

## 4. Data display, status, and feedback

| Proposed public API                               | Required capability and variants                                                                                                      | Used by                                      | Status                                | Phase |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------- | ----- |
| `BadgeComponent`                                  | Neutral, phase, success, warning, error, info, lime, ink, outline, dot, count, and locked/blocked states                              | Both                                         | **Available**, variants partial       | 1     |
| `PillComponent`, `ChipListComponent`              | Static or removable tags and single/multi-select filter pills with keyboard semantics                                                 | Word Up; Liturgy phase/filter labels         | **Bridge**                            | 2     |
| `AvatarComponent`                                 | Initials/image, deterministic palette option, xs/sm/md/lg/xl, loading/error fallback                                                  | Both                                         | **Available**, variants partial       | 1     |
| `AvatarStackComponent`, `PersonComponent`         | Overlapping group with overflow count and avatar/name/meta/action person row                                                          | Word Up                                      | **Bridge**                            | 2     |
| `AlertComponent`                                  | Success/warning/error/info/lime, optional title/icon/actions, dismissible mode, `status` versus `alert` live behavior                 | Both                                         | **Available**, variants partial       | 1     |
| `OfflineBannerComponent`                          | Offline, reconnecting, queued/syncing, restored states and shell-spacing integration                                                  | Word Up                                      | **Bridge**                            | 2     |
| `ToastService`, `ToastOutletComponent`            | Multiple-toast queue, tone, icon, title/body, action, pause-on-hover/focus, dismissal, timeout, and live-region policy                | Both                                         | **Available**, queue/action partial   | 1     |
| `SpinnerComponent`                                | Sizes, inline/full-region mode, labelled live status                                                                                  | Both                                         | **Available**, variants partial       | 1     |
| `SkeletonComponent`, `SkeletonGroupComponent`     | Text/title/circle/block/button/table-row presets and busy-region semantics                                                            | Word Up                                      | **Available**, presets partial        | 1     |
| `EmptyStateComponent`                             | Icon, eyebrow, title, description, actions, compact/card/full-page variants                                                           | Both                                         | **Available**, slots/variants partial | 1     |
| `StatePageComponent`                              | Full-page not-found, forbidden, session-expired, account state, server error, maintenance, offline, and consent-required presentation | Word Up                                      | **Partial** (`CsEmptyState`)          | 2     |
| `ProgressBarComponent`                            | Determinate/indeterminate, label/value row, thin/standard, ink/default, and native progress semantics                                 | Both                                         | **Available**, variants partial       | 1     |
| `ProgressRingComponent`                           | Size/tone/value/label, SVG accessible value semantics, indeterminate option                                                           | Word Up reports/journeys; Liturgy dial base  | **Missing**                           | 2     |
| `StatCardComponent`, `KpiComponent`               | Label, value/unit, delta/trend, supporting text, tone, selectable/link states, loading                                                | Both dashboards/reports                      | **Bridge**                            | 2     |
| `ListComponent`, `ListItemComponent`              | Leading visual, title/meta/body, trailing status/actions, selected/unread/clickable states, dividers                                  | Both                                         | **Bridge**                            | 2     |
| `DefinitionListComponent`                         | Responsive key/value details, inline/stacked and compact variants                                                                     | Word Up record/detail pages                  | **Missing**                           | 2     |
| `TableDirective`, `TableContainerComponent`       | Sticky/semantic header, compact/comfortable, row actions/selection, sorting hooks, empty/loading/error states                         | Word Up and Liturgy members                  | **Partial** (CSS only)                | 2     |
| `ResponsiveTableDirective`                        | Table-to-labelled-card reflow without losing header association or keyboard order                                                     | Word Up directories, history, reports, audit | **Missing**                           | 2     |
| `DataToolbarComponent`                            | Search, filter controls/chips, view options, result count, export and primary action; collapsible on mobile                           | Word Up                                      | **Missing**                           | 2     |
| `ProgressMatrixComponent`                         | Labelled rows/columns, done/in-progress/none/not-applicable cells, sticky headers, screen-reader summaries                            | Word Up cohort and competency progress       | **Bridge**                            | 3     |
| `MetricBarsComponent`, `ComparisonChartComponent` | Accessible horizontal bars, distributions, comparison deltas, legends, value tables, print-friendly output                            | Word Up reports                              | **Missing**                           | 3     |
| `TimelineComponent`                               | Past/current/future markers, connected rail, dates/meta/actions, vertical/mobile and compact variants                                 | Both journeys, activity, stories             | **Partial** (`CsStepper`)             | 2     |
| `ScriptureQuoteComponent`                         | FaithTech accent typography, quote, citation/reference, light/dark surface variants                                                   | Both                                         | **Bridge**                            | 3     |
| `CsTooltipDirective`                              | CDK overlay tooltip for icon-only actions and abbreviated chart/table content; hover, focus, touch, delay, positioning                | Both                                         | **Missing**                           | 1     |

## 5. Overlays and transient interaction

| Proposed public API                     | Required capability and variants                                                                                            | Used by                                   | Status                              | Phase |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------- | ----- |
| `DialogService`, `DialogShellComponent` | CDK dialog, focus trap/restore, labelled title/description, small/default/large/full-screen-mobile sizes, scroll management | Both                                      | **Available**, variants/API partial | 1     |
| `ConfirmDialogComponent`                | Confirm/cancel, danger/warning/success icon tone, typed result, async pending/error, destructive-action copy slot           | Both                                      | **Missing**                         | 2     |
| `DrawerComponent`                       | Start/end/bottom overlay panel, modal/non-modal mode, responsive full-screen option                                         | Word Up filters/editors; shell navigation | **Partial** (shell drawer only)     | 2     |
| `UnsavedChangesDialogComponent`         | Leave/stay/save choices and focus-safe integration point for Angular route guards                                           | Word Up authoring, review, attendance     | **Missing**                         | 2     |

## 6. Scheduling, communication, and content tools

| Proposed public API                                      | Required capability and variants                                                                                                               | Used by                                   | Status      | Phase |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------- | ----- |
| `CalendarComponent`                                      | Month/week views, keyboard grid navigation, today/previous/next, outside-month days, event density/overflow, selected day, timezone-safe dates | Word Up mentor/admin calendar             | **Missing** | 3     |
| `EventCardComponent`, `ScheduleListComponent`            | Date/time/location, status, RSVP/attendance metadata, actions, grouped agenda and empty/loading states                                         | Word Up all roles                         | **Missing** | 3     |
| `MessageThreadComponent`                                 | Accessible log, sent/received/system bubbles, author/time/read state, loading history, empty/assignment state, scroll anchoring                | Word Up youth/mentor                      | **Missing** | 3     |
| `MessageComposerComponent`                               | Auto-growing input, send/loading/error, character count, attachments, keyboard shortcut, queued/offline state                                  | Word Up youth/mentor                      | **Missing** | 3     |
| `ConversationListComponent`, `ConversationItemComponent` | Avatar, preview, timestamp, unread badge, selected state, responsive master/detail behavior                                                    | Word Up mentor messaging                  | **Missing** | 3     |
| `NotificationListComponent`, `NotificationItemComponent` | Read/unread, category icon, timestamp, deep link, mark-one/all-read, empty/loading states                                                      | Word Up                                   | **Missing** | 3     |
| `AnnouncementComposerComponent`                          | Audience/cohort/role targeting, now/scheduled delivery, preview, submit state; composed from Cornerstone fields                                | Word Up admin                             | **Missing** | 3     |
| `MediaViewerComponent`                                   | Responsive image/video/iframe/document display, poster/caption, loading/error, external/open/download action                                   | Word Up lessons, submissions, public site | **Missing** | 3     |
| `AttachmentListComponent`, `EvidencePreviewComponent`    | File type/size/status, image preview, remove/download/retry, safe link handling                                                                | Word Up assignments/reviews               | **Missing** | 3     |
| `CodeBlockComponent`                                     | Syntax-preserving code display, language label, wrap/scroll, copy action                                                                       | Word Up coding lessons                    | **Missing** | 3     |
| `CodeEditorComponent`, `PreviewPaneComponent`            | Accessible textarea-based editor baseline, line/character feedback, reset/run actions, output/iframe preview, error state                      | Word Up coding lessons                    | **Missing** | 3     |

## 7. Learning, people, and operational workflows

These are compound UI components. They accept view models and emit user intents; application
services retain domain rules, persistence, authorization, and orchestration.

| Proposed public API                                      | Required capability and variants                                                                                       | Used by                        | Status                         | Phase |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------ | ----- |
| `LearningJourneyComponent`, `LessonStepListComponent`    | Module/lesson progression, completed/current/locked states, prerequisites, progress summary, responsive timeline/list  | Word Up youth/guardian         | **Bridge**                     | 3     |
| `QuizComponent`, `QuizQuestionComponent`                 | Single/multiple choice and text answer types, question navigation, progress, validation, submit/confirm, review states | Word Up youth                  | **Bridge** (page-owned markup) | 3     |
| `QuizResultComponent`                                    | Score/pass state, per-question correct/incorrect feedback, explanations, next/retry actions                            | Word Up youth/mentor           | **Missing**                    | 3     |
| `AssignmentCardComponent`, `SubmissionStatusComponent`   | Due/status/meta, instructions, evidence, submit/resubmit, review feedback, version/history states                      | Word Up youth/mentor           | **Missing**                    | 3     |
| `RubricComponent`, `AssessmentEditorComponent`           | Criteria/levels/scores, comments, approval/request-changes actions, read-only and editing modes                        | Word Up mentor/admin           | **Missing**                    | 3     |
| `AchievementCardComponent`, `BadgeCollectionComponent`   | Earned/locked badge, art/icon, criteria, award date, progress, grid/list presentation                                  | Word Up                        | **Bridge**                     | 3     |
| `PersonRowComponent`, `PeopleDirectoryComponent`         | Search/filter/sort, avatar/identity/role/cohort/status, selection, row actions, responsive list/table                  | Word Up admin/mentor           | **Missing**                    | 3     |
| `PersonSummaryComponent`, `RecordTabsComponent`          | Profile header, contact/status/actions and accessible overview/progress/attendance/history sections                    | Word Up                        | **Missing**                    | 3     |
| `AttendanceRosterComponent`, `AttendanceChoiceComponent` | Roster, present/late/absent/excused choices, mark-all/clear, notes, conflict/queued status, unsaved summary            | Word Up volunteer/mentor/admin | **Missing**                    | 3     |
| `ConsentPanelComponent`                                  | Consent status/history, contact detail framing, grouped participation/media choices, revoke/update actions             | Word Up guardian/admin         | **Missing**                    | 3     |
| `CsvImportWizardComponent`                               | Upload, column mapping, validation counts, row preview/errors, confirmation, progress and result summary               | Word Up admin                  | **Missing**                    | 3     |
| `CurriculumTreeComponent`, `CurriculumEditorComponent`   | Track/module/lesson/question hierarchy, add/edit/delete/reorder, selection, nested forms, draft/dirty/published states | Word Up admin                  | **Missing**                    | 3     |
| `ProgressionBuilderComponent`, `CompetencyGridComponent` | Ordered stages/terms/competencies, editable rows, state transitions, validation and matrix visualization               | Word Up admin/mentor           | **Missing**                    | 3     |
| `ReportFiltersComponent`, `ReportDashboardComponent`     | Date/cohort/track/mentor filters, overview/youth/cohort/staff views, KPI/ring/bar composition, export/print states     | Word Up admin                  | **Missing**                    | 3     |
| `AuditLogComponent`                                      | Filters, paged event table, source/target/private indicators, expandable detail and empty/error/loading states         | Word Up admin                  | **Missing**                    | 3     |

## 8. Liturgy workflow suite

Liturgy already packages six domain-facing components, but Cornerstone should own their presentation
and CDK behavior so the application only supplies project state and handles emitted commands.

| Proposed public API                                | Replaces/current evidence                    | Required capability                                                                                                                            | Status                       | Phase |
| -------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----- |
| `ProcessRailComponent`                             | `lit-rhythm-rail`                            | Generic ordered process rail with done/current/locked steps, links, inter-step gates, nested current-stage content, responsive horizontal mode | **Bridge**                   | 3     |
| `ProcessJourneyComponent`                          | Liturgy `phase-row` journey                  | Full-content process timeline with stage cards, gate panels, current/completed/locked states                                                   | **Partial** (`CsStepper`)    | 3     |
| `GateComponent`                                    | `lit-gate`                                   | Open/blocked state, title/status, requirement checklist, locked/available advance action, helper text; emits requirement intents only          | **Bridge**                   | 3     |
| `RequirementChecklistComponent`                    | Liturgy `checklist`/`check`                  | Interactive or read-only requirements, done/to-do state, metadata, busy/error and keyboard/focus behavior                                      | **Partial** (needs checkbox) | 3     |
| `MovementDialComponent`                            | `lit-dial`                                   | Segmented radial completion display built on `CsProgressRing`, label/value, paper/dark variants                                                | **Bridge**                   | 3     |
| `MovementListComponent`                            | `lit-rlist`                                  | Ordered named movements with done/current/locked pips and compact rail/full-page variants                                                      | **Bridge**                   | 3     |
| `PipStripComponent`                                | `lit-pip-strip`                              | Compact accessible movement progress for cards; configurable labels/count/current state                                                        | **Bridge**                   | 3     |
| `KanbanBoardComponent`, `KanbanColumnComponent`    | Liturgy Develop board                        | CDK drag/drop, horizontal responsive board, allowed/blocked drop feedback, locked/done columns, keyboard move alternative, empty columns       | **Missing**                  | 3     |
| `WorkItemCardComponent`                            | `lit-work-card`                              | Code/title/description, tags/points/status, progress pips, assignee, action menu, blocked/inactive states, drag handle and open intent         | **Bridge**                   | 3     |
| `PhaseLaneComponent`, `ProjectCardComponent`       | Liturgy dashboard 4D lanes and project tiles | Phase grouping, project state/meta/gate indicator, card/grid/board layouts                                                                     | **Missing**                  | 3     |
| `GratitudeWallComponent`, `GratitudeNoteComponent` | Liturgy Demonstrate wall                     | Responsive masonry-like collection, quotation/citation semantics, empty/loading states                                                         | **Bridge**                   | 3     |

The suite should be domain-neutral at its core (`process`, `stage`, `movement`, `gate`, `work item`).
Liturgy can supply 4D/5R labels, phase colors, routes, and enforcement results through typed adapters.

## 9. Authentication and marketing compositions

| Proposed public API                         | Required capability and variants                                                                                    | Used by                            | Status      | Phase |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------- | ----- |
| `AuthLayoutComponent`, `AuthCardComponent`  | Centered and split-panel authentication layouts, brand slot, title/lede, error area, form and alternate-action slot | Both                               | **Bridge**  | 2     |
| `HeroComponent`                             | Light/dark/brand hero, eyebrow/title/lede/actions/media, constrained content and responsive layout                  | Word Up public site; Liturgy cover | **Bridge**  | 3     |
| `ContentSectionComponent`                   | Prose/media, alternating layout, card grid, stats, scripture/callout and anchored section variants                  | Word Up public site                | **Missing** | 3     |
| `CtaSectionComponent`                       | Primary/secondary actions, light/dark/lime tones, compact/full-width variants                                       | Word Up public site                | **Missing** | 3     |
| `LogoMarkComponent`, `BrandLockupComponent` | FaithTech/product mark plus wordmark, compact/full and light/dark variants                                          | Both                               | **Bridge**  | 2     |

## Application coverage map

| Application surface                        | Cornerstone suites that must supply it                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Liturgy authentication and workspace       | Theme/layout, auth layout, forms, alerts, buttons, shell/topbar/sidenav, breadcrumbs, avatar/account menu, state/loading feedback              |
| Liturgy dashboard, projects, and members   | Page/section, stats, cards, phase lanes, lists/tables, badges, forms, dialogs, empty/loading states                                            |
| Liturgy 4D project journey                 | Process rail/journey, gate, requirement checklist, movement dial/list, progress, locked actions                                                |
| Liturgy Develop and 5R loop                | Kanban board/columns, work-item card, pip strip, menus, assignee/select fields, movement form, dialog/toast                                    |
| Liturgy Demonstrate                        | Stats, timeline/story list, gratitude wall/note, scripture quote                                                                               |
| Word Up public site                        | Marketing header/footer, hero, content/CTA sections, cards, forms, media, alerts and state pages                                               |
| Word Up authentication/onboarding/settings | Auth layouts, wizard, complete form suite, choice groups, switches, state pages, validation and feedback                                       |
| Word Up youth learning                     | Shell/navigation, journey/lesson steps, media/code tools, quiz, assignment/submission, badges, progress, schedule, messaging                   |
| Word Up mentor/volunteer                   | Dashboards/stats, people/rosters, messaging, calendar/schedule, attendance capture, assessment/rubric, assignment/review                       |
| Word Up guardian                           | Child/person summaries, progress/journey, announcements, schedule, consent panels and forms                                                    |
| Word Up administration                     | Directories/tables, dialogs, cohort/person detail, reports/charts, CSV import, audit log, announcements, curriculum/badge/progression builders |
| Word Up cross-cutting system states        | Offline banner, toast queue, skeleton/empty/state pages, confirm/unsaved dialogs, responsive data/navigation patterns                          |

## Recommended delivery order

1. **Complete the primitive contract.** Add icons, checkbox/radio, form integration, input groups,
   tooltip, page framing, table API, missing button/badge/card variants, and robust dialog/toast APIs.
2. **Make application chrome replaceable.** Deliver topbar, sidenav/nav items, bottom navigation,
   breadcrumbs, account menu, auth layout, page/section headers, state pages, offline banner, filter
   bars, and responsive table behavior.
3. **Extract common page patterns.** Deliver stats/KPIs, lists/person rows, progress ring/matrix,
   timeline, choice cards, wizard, file picker/dropzone, confirm/unsaved dialogs, and marketing
   compositions.
4. **Move rich interactions to CDK-backed components.** Deliver calendar, messaging, media/code,
   quiz/assessment, attendance, import, reports, and authoring/builder components.
5. **Move the Liturgy workflow suite.** Generalize the existing `lit-*` components, add accessible
   keyboard drag/drop to Kanban, and expose Liturgy-specific labels/state through adapters.
6. **Remove the migration bridge last.** Keep compatibility styles while routes migrate, then delete
   app-owned duplicate styles only after visual, accessibility, responsive, unit, and end-to-end
   parity is verified.

## Component contract requirements

Every component in this catalog should meet the following acceptance criteria:

- Standalone Angular API with typed signal inputs/outputs and `OnPush` change detection.
- Angular forms integration for value-bearing controls.
- Angular CDK behavior where it provides focus management, overlay positioning, menus, dialogs,
  layout observation, text autosizing, virtual scrolling, or drag/drop.
- Keyboard operation, visible focus, correct landmark/ARIA semantics, screen-reader status, and
  focus restoration appropriate to the interaction.
- Responsive behavior matching the audited desktop and narrow-screen applications.
- High contrast, reduced motion, zoom/reflow, light/dark surface, disabled, loading, empty, error,
  and offline states where applicable.
- Themeable through public FaithTech design tokens without application selectors reaching into
  private component markup.
- Unit tests for behavior and accessibility plus documentation examples for variants and composed
  application patterns.
- No HTTP calls, authorization decisions, workflow enforcement, or application route ownership
  inside presentation components. Rich composites receive view models and emit intents.

## Definition of "Cornerstone supplies all UI"

Coverage is complete when Liturgy and Word Up page templates are primarily compositions of
Cornerstone components plus semantic content, application-specific copy, and routing bindings;
neither application owns duplicate design-system CSS, focus/overlay/keyboard mechanics, or repeated
component DOM. Temporary compatibility selectors do not count as final coverage, but they remain a
supported migration tool until both applications reach that state.
