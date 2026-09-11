# Cornerstone migration guide

The compatibility stylesheet preserves the audited Liturgy and Word Up class vocabularies while a
consumer moves one screen at a time to `@quinntyne/cornerstone`. It reproduces presentation only; use the
Angular APIs to gain keyboard behavior, ARIA relationships, typed intent outputs, and forms support.

## Setup

Run `ng add @quinntyne/cornerstone` or add the theme manually. Existing applications can opt into the
bridge after the theme:

```json
{
  "styles": [
    "@quinntyne/cornerstone/styles/theme.scss",
    "@quinntyne/cornerstone/styles/compat.scss",
    "src/styles.scss"
  ]
}
```

The bridge is isolated from the default theme and therefore adds no CSS to consumers that do not
name its export.

## Audited mapping

The [component catalog](../component-catalog.md) is the row-by-row mapping for every audited UI
pattern. These are the high-volume legacy families and their first-class replacements:

| Application | Legacy family | Cornerstone replacement | Status |
| --- | --- | --- | --- |
| Word Up | `wu-btn*` | `CsButtonDirective`, `CsIconButtonDirective`, `ButtonGroupComponent` | Available |
| Word Up | `wu-card*` | `CardComponent` and card slot directives | Available |
| Word Up | `wu-field*`, `wu-input*`, `wu-select*` | `FieldComponent` and Cornerstone form controls | Available |
| Word Up | `wu-table*` | `TableDirective`, `TableContainerComponent`, responsive table APIs | Available |
| Word Up | `wu-modal*`, `wu-drawer*` | `DialogService`, `DialogShellComponent`, `DrawerService` | Available |
| Word Up | `wu-toast*`, `wu-alert*` | `ToastService`, `ToastOutletComponent`, `AlertComponent` | Available |
| Word Up | `wu-sidenav*`, `wu-tabs*` | shell/navigation components and `TabGroupComponent` | Available |
| Liturgy | `btn*`, `button*` | Cornerstone button directives | Available |
| Liturgy | `card*`, `surface*` | `CardComponent`, `PageComponent`, `SectionComponent` | Available |
| Liturgy | `rail*`, `station*`, `movement*` | process rail, journey, stage, movement dial, and pip components | Available |
| Liturgy | `gate*`, `requirement*` | `GateComponent`, `RequirementChecklistComponent` | Available |
| Liturgy | `kanban*`, `phase*`, `project*` | kanban, phase lane, project card, and portfolio components | Available |
| Both | page-specific compositions | typed workflow components or application-owned composition | Explicit catalog mapping |

## Removal criteria

The compatibility bridge can be removed only after both consuming applications have:

1. no legacy selector use in application templates;
2. no open gap in the component catalog;
3. visual, accessibility, responsive, unit, and end-to-end parity for migrated screens;
4. no references to Liturgy's unprefixed legacy token block; and
5. completed the announced deprecation window in the support matrix.

Changes that cannot be automated by an `ng update` migration must report the affected file and the
manual replacement. The initial `0.x` package has no breaking migration; its migration collection is
intentionally empty until the first breaking release.
