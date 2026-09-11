# Countdown, review dialog, team board, and raffle stage

Import these standalone components from `@quinntyne/cornerstone` in an Angular 21
application. Load `@quinntyne/cornerstone/styles/theme.scss` once. Their colors,
spacing, typography, and motion use the same light/dark tokens as the rest of
Cornerstone. Each has a live example in the component documentation catalog.

## Countdown

```html
<cs-countdown
  [target]="eventStartsAt"
  [now]="clock()"
  ariaLabel="Time until the workshop"
  pendingCaption="The workshop begins soon."
  expiredCaption="Ready to begin."
/>
```

`target` and `now` are Unix timestamps in **milliseconds**. The consumer owns the
clock; the component creates no timer. It rounds remaining time up to the next
second, hides days when zero, and clamps expired or invalid timestamps to zero.
The timer does not announce each tick to screen readers. The unit labels default
to English; the accessible label and both captions are configurable.

## Review dialog

```html
<button csButton type="button" (click)="reviewOpen.set(true)">Review</button>
<cs-review-dialog title="Review changes" [open]="reviewOpen()" (closed)="reviewOpen.set(false)">
  <p>Check the changes before continuing.</p>
  <button csButton type="button" (click)="save(); reviewOpen.set(false)">Save</button>
</cs-review-dialog>
```

The native modal uses one CDK focus trap for keyboard wrapping and restores focus
to the previously focused element. Escape
and the close button emit one `closed` request per opening. Set `open` to false in
response. A parent-driven closure, such as Save above, does not emit `closed`.
Clicking the backdrop does not dismiss the dialog. `closeLabel` customizes the
close button's accessible name. Projected content is rendered on the server, but
the modal is opened only after browser rendering.

## Team board

```html
<cs-team-board
  [groups]="groups()"
  [members]="members()"
  [projects]="projects()"
  [editable]="canEdit()"
  [disabled]="saving()"
  [currentMember]="signedInMemberId"
  (moved)="requestMove($event)"
  (assigned)="requestProjectAssignment($event)"
  (newTeamRequested)="requestNewTeam($event)"
/>
```

The exported models are:

| Model               | Fields                           |
| ------------------- | -------------------------------- |
| `BoardMember`       | `id`, `name`, `label`, `groupId` |
| `BoardGroup`        | `id`, `name`, `projectId`        |
| `BoardProject`      | `id`, `title`                    |
| `MemberMove`        | `memberId`, `groupId`            |
| `ProjectAssignment` | `groupId`, `projectId`           |
| `NewTeamRequest`    | `memberId`                       |

All fields above are strings. IDs must be unique within their collection. An
empty group ID represents the unassigned group; an empty project ID represents
no project. Supply the unassigned group explicitly when needed. Member order is
the order supplied by the consumer; dragging changes membership, not ordering.

The board never modifies its inputs. Dragging and the native Move to select emit
the same intent. Selects return to the supplied value until the consumer accepts
the action and supplies updated data. Only editable, enabled boards emit action
requests; invalid IDs and unchanged destinations are ignored. The New team button
emits a separate request, so a real group can safely use the ID `new`.

Use the optional `text` input, typed as `Partial<TeamBoardText>`, to override
labels, empty states, project fallback text, and participant wording. Authorization
and persistence must still be enforced by the consuming application.

## Raffle stage

```html
<cs-raffle-stage [result]="draw()" [text]="raffleText" />
```

`result` is null while waiting, or a `RaffleResult` containing `id`, `label`,
`candidates: string[]`, and millisecond timestamps `start` and `reveal`. The stage
displays the **supplied** winner; cycling candidate names is purely decorative.
Use optional `winnerName` and `winnerDetail` for separate winner fields. Otherwise
`label` is split at `·` for compatibility with the source mock.

The stage maintains its own browser clock while a draw is active. Supply `now`
to use a controlled clock instead. A result first received after its reveal shows
the winner immediately without replaying celebration. A new result ID resets
Stop Effects. Empty candidates show neutral drawing text.

WebGPU confetti falls back to CSS when GPU setup or rendering fails. Set
`forceFallback` to exercise CSS explicitly. Effects end five seconds after reveal,
respect reduced-motion preferences, and can be stopped without delaying the winner.
Timers and GPU resources are released when the component is destroyed.
The optional `text: Partial<RaffleStageText>` input customizes all presentation copy.

## Styling and native controls

Useful component overrides include `--cs-countdown-size`, `--cs-review-dialog-width`,
`--cs-team-board-column-width`, `--cs-raffle-stage-height`, and
`--cs-raffle-winner-size`. The independent design-system package exports these
tokens too; it is not required separately by UI consumers.

Use the existing `CsButtonDirective` and `CsSelectDirective`. The mock's extra
native-control-state directive is unnecessary: buttons now enforce native disabled
state, disabled links suppress activation, and selects synchronize native values
and explicit/forms-driven disabled state. `csSelect` supports `[value]`,
`[(value)]`, and Angular forms; use one value owner at a time. A template reference
can access it with `#control="csSelect"`.

These additions remain presentation components. Event state, participant storage,
team creation, permissions, and random winner selection belong to the application.
