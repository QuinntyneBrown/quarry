export const fixtureValues: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  countdown: { target: 90061000, now: 0 },
  'review-dialog': { title: 'Review changes', open: false },
  'team-board': {
    groups: [
      { id: '', name: 'Unassigned', projectId: '' },
      { id: 'a', name: 'Team A', projectId: 'project-1' },
      { id: 'b', name: 'Team B', projectId: '' },
    ],
    members: [
      { id: 'ada', name: 'Ada', label: 'Developer', groupId: 'a' },
      { id: 'grace', name: 'Grace', label: 'Designer', groupId: '' },
    ],
    projects: [{ id: 'project-1', title: 'Community directory' }],
    editable: true,
    currentMember: 'ada',
  },
  'raffle-stage': {
    result: {
      id: 'example',
      label: 'Ada · Ticket 01',
      candidates: ['Ada', 'Grace'],
      start: 0,
      reveal: 2000,
    },
    now: 1000,
    forceFallback: true,
  },
  'account-menu': {
    account: { displayName: 'Ada Mensah', email: 'ada@example.org', role: 'Programme lead' },
    actions: [
      { id: 'profile', label: 'View profile' },
      { id: 'sign-out', label: 'Sign out', danger: true },
    ],
  },
  'announcement-composer': {
    audiences: [
      { id: 'cohort-1', label: 'Toronto cohort', kind: 'cohort', count: 24 },
      { id: 'mentors', label: 'Mentors', kind: 'role', count: 8 },
    ],
    value: {
      audienceIds: ['cohort-1'],
      delivery: 'now',
      subject: 'Programme update',
      body: 'Our next gathering begins at 7:00 PM.',
    },
  },
  'assessment-editor': {
    assessment: { rubric: { id: 'rubric-1', criteria: [] }, comment: 'Clear and thoughtful work.' },
  },
  'bottom-nav': {
    items: [
      { id: 'home', label: 'Home', active: true },
      { id: 'people', label: 'People', badge: '3' },
      { id: 'settings', label: 'Settings' },
    ],
  },
  calendar: {
    label: 'July 2026',
    dates: Array.from({ length: 14 }, (_, index) => ({
      iso: `2026-07-${String(index + 1).padStart(2, '0')}`,
      day: index + 1,
      inMonth: true,
    })),
    events: [{ id: 'event-1', title: 'Team gathering', start: '2026-07-04T19:00:00' }],
  },
  'competency-grid': {
    columns: ['Discover', 'Develop', 'Demonstrate'],
    rows: [{ label: 'Facilitation', cells: ['complete', 'in-progress', 'empty'] }],
  },
  gate: {
    id: 'gate-1',
    title: 'Ready to advance',
    requirements: [
      { id: 'brief', label: 'Brief reviewed', complete: true },
      { id: 'team', label: 'Team confirmed', complete: false, required: true },
    ],
  },
  'learning-journey': {
    view: {
      title: 'Learning journey',
      modules: [{ id: 'module-1', title: 'Foundations', expanded: true, steps: [] }],
      progress: { complete: 2, total: 6 },
    },
  },
  'people-directory': {
    people: [
      {
        id: 'ada',
        name: 'Ada Mensah',
        secondary: 'ada@example.org',
        status: 'active',
        role: 'Lead',
      },
      {
        id: 'jonah',
        name: 'Jonah Bell',
        secondary: 'jonah@example.org',
        status: 'invited',
        role: 'Mentor',
      },
    ],
    query: { search: '', facets: {}, page: 1 },
    state: { status: 'ready', data: undefined },
  },
  person: {
    person: { id: 'ada', name: 'Ada Mensah', secondary: 'Programme lead', status: 'Active' },
  },
  'person-row': {
    person: {
      id: 'ada',
      name: 'Ada Mensah',
      secondary: 'ada@example.org',
      status: 'active',
      role: 'Lead',
    },
  },
  'person-summary': {
    view: {
      person: { id: 'ada', name: 'Ada Mensah', secondary: 'Programme lead', status: 'Active' },
      contacts: [{ type: 'email', label: 'Email', value: 'ada@example.org' }],
      metadata: [],
    },
  },
  'phase-lane': {
    phase: { id: 'develop', label: 'Develop', tone: 'info' },
    projects: [
      {
        id: 'project-1',
        title: 'Neighbourhood programme',
        phaseId: 'develop',
        summary: 'Active work',
        progress: 64,
      },
    ],
  },
  'pip-strip': {
    items: [
      { id: 'discover', label: 'Discover', state: 'complete', progress: 100 },
      { id: 'develop', label: 'Develop', state: 'current', progress: 55 },
      { id: 'demonstrate', label: 'Demonstrate', state: 'locked', progress: 0 },
    ],
  },
  'progress-matrix': {
    columns: ['Discover', 'Develop', 'Demonstrate'],
    rows: [{ label: 'Ada Mensah', cells: ['complete', 'in-progress', 'empty'] }],
  },
  quiz: {
    view: {
      title: 'Knowledge check',
      questions: [
        {
          id: 'q1',
          prompt: 'Which option is correct?',
          type: 'single',
          options: [
            { id: 'a', label: 'Option A' },
            { id: 'b', label: 'Option B' },
          ],
          required: true,
        },
      ],
      answers: {},
      activeIndex: 0,
      submitting: false,
    },
  },
  'quiz-question': {
    question: {
      id: 'q1',
      prompt: 'Which option is correct?',
      type: 'single',
      options: [
        { id: 'a', label: 'Option A' },
        { id: 'b', label: 'Option B' },
      ],
      required: true,
    },
  },
  radio: { value: 'option-a', name: 'example-radio' },
  'stat-card': {
    label: 'Active programmes',
    value: 24,
    delta: { value: 12, label: 'since last month', direction: 'up' },
  },
  'state-page': { title: 'Something went wrong', message: 'Try the action again.' },
};
