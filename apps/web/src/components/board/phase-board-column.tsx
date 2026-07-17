import {
  WorkflowPhase,
} from '@/lib/workflow-phases';
import {
  WorkItemSummary,
} from '@/types/work-item';
import {
  PhaseBoardCard,
} from './phase-board-card';

interface PhaseBoardColumnProps {
  phase: WorkflowPhase;
  items: WorkItemSummary[];
}

export function PhaseBoardColumn({
  phase,
  items,
}: PhaseBoardColumnProps) {
  return (
    <section
      aria-labelledby={`phase-${phase.status}`}
      className={[
        'flex min-h-[460px] w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200',
        phase.backgroundClass,
      ].join(' ')}
    >
      <div
        className={[
          'h-1.5 w-full',
          phase.accentClass,
        ].join(' ')}
      />

      <header className="border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h2
            id={`phase-${phase.status}`}
            className="font-semibold text-slate-950"
          >
            {phase.label}
          </h2>

          <span
            aria-label={`${items.length} items`}
            className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs font-semibold text-white"
          >
            {items.length}
          </span>
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {phase.description}
        </p>
      </header>

      <div className="flex-1 space-y-3 p-3">
        {items.length === 0 ? (
          <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 text-center">
            <p className="text-sm text-slate-500">
              No items in this phase.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <PhaseBoardCard
              key={item.id}
              item={item}
            />
          ))
        )}
      </div>
    </section>
  );
}