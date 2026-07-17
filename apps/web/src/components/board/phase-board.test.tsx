import {
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  PhaseBoard,
} from './phase-board';
import {
  AuthenticatedUser,
} from '@/types/auth';
import {
  WorkItemStatus,
  WorkItemSummary,
} from '@/types/work-item';

const manager: AuthenticatedUser = {
  id: 'manager-1',
  name: 'Test Manager',
  email: 'manager@test.local',
  role: 'MANAGER',
};

const member: AuthenticatedUser = {
  id: 'member-1',
  name: 'Test Member',
  email: 'member@test.local',
  role: 'MEMBER',
};

function createWorkItem(
  overrides: Partial<WorkItemSummary> & {
    id: string;
    title: string;
    status: WorkItemStatus;
  },
): WorkItemSummary {
  return {
    id: overrides.id,
    title: overrides.title,
    description:
      overrides.description ??
      'Test work item description.',
    priority:
      overrides.priority ?? 'MEDIUM',
    category:
      overrides.category ?? 'Software',
    dueDate:
      overrides.dueDate ??
      '2026-08-01T12:00:00.000Z',
    status: overrides.status,
    createdAt:
      overrides.createdAt ??
      '2026-07-17T10:00:00.000Z',
    updatedAt:
      overrides.updatedAt ??
      '2026-07-17T10:00:00.000Z',
    createdBy:
      overrides.createdBy ??
      manager,
    assignments:
      overrides.assignments ?? [],
    attachment:
      overrides.attachment ?? null,
    isOverdue:
      overrides.isOverdue ?? false,
  };
}

function getPhaseSection(
  phaseName: string,
): HTMLElement {
  const heading = screen.getByRole(
    'heading',
    {
      name: phaseName,
    },
  );

  const section =
    heading.closest('section');

  expect(section).not.toBeNull();

  return section as HTMLElement;
}

describe('PhaseBoard', () => {
  const items: WorkItemSummary[] = [
    createWorkItem({
      id: 'backlog-item',
      title:
        'Prepare laptop replacement plan',
      status: 'BACKLOG',
    }),

    createWorkItem({
      id: 'progress-item',
      title:
        'Resolve warehouse Wi-Fi issue',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      dueDate:
        '2026-07-10T12:00:00.000Z',
      isOverdue: true,

      assignments: [
        {
          assignedAt:
            '2026-07-08T09:00:00.000Z',
          member,
        },
      ],
    }),

    createWorkItem({
      id: 'done-item',
      title:
        'Configure reception printer',
      status: 'DONE',
      priority: 'LOW',

      assignments: [
        {
          assignedAt:
            '2026-07-12T09:00:00.000Z',
          member,
        },
      ],
    }),
  ];

  it(
    'groups work items under their current phase',
    () => {
      render(
        <PhaseBoard items={items} />,
      );

      const backlogSection =
        getPhaseSection('Backlog');

      const progressSection =
        getPhaseSection(
          'In Progress',
        );

      const doneSection =
        getPhaseSection('Done');

      expect(
        within(
          backlogSection,
        ).getByRole('heading', {
          name:
            'Prepare laptop replacement plan',
        }),
      ).toBeInTheDocument();

      expect(
        within(
          progressSection,
        ).getByRole('heading', {
          name:
            'Resolve warehouse Wi-Fi issue',
        }),
      ).toBeInTheDocument();

      expect(
        within(
          doneSection,
        ).getByRole('heading', {
          name:
            'Configure reception printer',
        }),
      ).toBeInTheDocument();

      expect(
        within(
          backlogSection,
        ).queryByText(
          'Resolve warehouse Wi-Fi issue',
        ),
      ).not.toBeInTheDocument();
    },
  );

  it(
    'marks overdue items and shows empty phases',
    () => {
      render(
        <PhaseBoard items={items} />,
      );

      const progressSection =
        getPhaseSection(
          'In Progress',
        );

      const cancelledSection =
        getPhaseSection(
          'Cancelled',
        );

      expect(
        within(
          progressSection,
        ).getByText('Overdue'),
      ).toBeInTheDocument();

      expect(
        within(
          progressSection,
        ).getByText(
          'Test Member',
        ),
      ).toBeInTheDocument();

      expect(
        within(
          cancelledSection,
        ).getByText(
          'No items in this phase.',
        ),
      ).toBeInTheDocument();
    },
  );

  it(
    'links each card to its detail page',
    () => {
      render(
        <PhaseBoard items={items} />,
      );

      const backlogSection =
        getPhaseSection('Backlog');

      const itemLink = within(
        backlogSection,
      ).getByRole('link', {
        name:
          /prepare laptop replacement plan/i,
      });

      expect(itemLink).toHaveAttribute(
        'href',
        '/work-items/backlog-item',
      );
    },
  );
});