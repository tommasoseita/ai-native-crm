"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Plus } from "lucide-react";
import { Avatar, CompanyLogo } from "./Avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  STAGES,
  teamMemberById,
  type Company,
  type Deal,
  type DealStage,
  type Person,
} from "@/lib/types";
import { moveDeal } from "@/lib/actions";

type Lookup = {
  companies: Record<string, Company>;
  people: Record<string, Person>;
};

export function PipelineBoard({
  initialDeals,
  companies,
  people,
}: {
  initialDeals: Deal[];
  companies: Company[];
  people: Person[];
}) {
  const lookup: Lookup = useMemo(
    () => ({
      companies: Object.fromEntries(companies.map((c) => [c.id, c])),
      people: Object.fromEntries(people.map((p) => [p.id, p])),
    }),
    [companies, people],
  );

  const [stageDeals, setStageDeals] = useState<Record<DealStage, Deal[]>>(() =>
    groupByStage(initialDeals),
  );
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const findStage = (id: string): DealStage | null => {
    for (const s of STAGES) {
      if (stageDeals[s.id].some((d) => d.id === id)) return s.id;
    }
    return null;
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const stage = findStage(id);
    if (!stage) return;
    const deal = stageDeals[stage].find((d) => d.id === id) ?? null;
    setActiveDeal(deal);
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const activeStage = findStage(activeId);
    if (!activeStage) return;

    // Dropping on a column directly (id matches a stage id) or on a card in another column.
    let overStage: DealStage | null = null;
    if (STAGES.some((s) => s.id === overId)) {
      overStage = overId as DealStage;
    } else {
      overStage = findStage(overId);
    }
    if (!overStage || activeStage === overStage) return;

    setStageDeals((prev) => {
      const activeItems = prev[activeStage];
      const overItems = prev[overStage!];
      const idx = activeItems.findIndex((d) => d.id === activeId);
      if (idx < 0) return prev;
      const [moved] = activeItems.slice(idx, idx + 1);
      return {
        ...prev,
        [activeStage]: activeItems.filter((d) => d.id !== activeId),
        [overStage!]: [...overItems, { ...moved, stage: overStage! }],
      };
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveDeal(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const activeStage = findStage(activeId);
    if (!activeStage) return;

    let destStage: DealStage = activeStage;
    if (STAGES.some((s) => s.id === overId)) {
      destStage = overId as DealStage;
    } else {
      const s = findStage(overId);
      if (s) destStage = s;
    }

    const destItems = stageDeals[destStage];
    let nextItems = destItems;
    if (activeStage === destStage) {
      const oldIndex = destItems.findIndex((d) => d.id === activeId);
      const newIndex = destItems.findIndex((d) => d.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        nextItems = arrayMove(destItems, oldIndex, newIndex);
        setStageDeals((prev) => ({ ...prev, [destStage]: nextItems }));
      }
    }

    const orderedIds = nextItems.map((d) => d.id);
    startTransition(() => {
      moveDeal(activeId, destStage, orderedIds);
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex-1 overflow-x-auto scrollbar-thin bg-[var(--sidebar)]">
        <div className="flex h-full gap-3 px-4 py-4 min-w-max">
          {STAGES.map((stage) => (
            <Column
              key={stage.id}
              stage={stage.id}
              label={stage.label}
              color={stage.color}
              deals={stageDeals[stage.id]}
              lookup={lookup}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} lookup={lookup} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  stage,
  label,
  color,
  deals,
  lookup,
}: {
  stage: DealStage;
  label: string;
  color: string;
  deals: Deal[];
  lookup: Lookup;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((sum, d) => sum + d.value, 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[280px] shrink-0 flex-col rounded-xl bg-white border ${
        isOver ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/15" : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="text-[12.5px] font-medium">{label}</span>
        <span className="text-[11px] text-[var(--muted)]">{deals.length}</span>
        <span className="ml-auto text-[11px] tabular-nums text-[var(--muted-foreground)]">
          {formatCurrency(total)}
        </span>
        <button className="rounded p-0.5 hover:bg-[var(--sidebar-hover)]">
          <Plus size={12} className="text-[var(--muted)]" />
        </button>
      </div>
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 overflow-y-auto scrollbar-thin min-h-[80px]">
          {deals.map((d) => (
            <SortableDealCard key={d.id} deal={d} lookup={lookup} />
          ))}
          {deals.length === 0 && (
            <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-6 text-center text-[11px] text-[var(--muted)]">
              Drop deals here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableDealCard({ deal, lookup }: { deal: Deal; lookup: Lookup }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} lookup={lookup} />
    </div>
  );
}

function DealCard({
  deal,
  lookup,
  dragging,
}: {
  deal: Deal;
  lookup: Lookup;
  dragging?: boolean;
}) {
  const company = deal.companyId ? lookup.companies[deal.companyId] : undefined;
  const contact = deal.primaryContactId ? lookup.people[deal.primaryContactId] : undefined;
  const owner = teamMemberById(deal.ownerId);

  return (
    <div
      className={`group select-none rounded-md border bg-white p-2.5 ${
        dragging
          ? "border-[var(--accent)] shadow-lg cursor-grabbing"
          : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all cursor-grab"
      }`}
    >
      <div className="flex items-start gap-2">
        {company && <CompanyLogo name={company.name} domain={company.domain ?? undefined} />}
        <div className="min-w-0 flex-1">
          <Link
            href={`/deals/${deal.id}`}
            className="text-[12.5px] font-medium leading-tight truncate hover:underline block select-none"
          >
            {deal.name}
          </Link>
          {company && (
            <div className="mt-0.5 text-[11px] text-[var(--muted)] truncate">
              {company.name}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold tabular-nums">
          {formatCurrency(deal.value, deal.currency)}
        </span>
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1 text-[10.5px] text-[var(--muted)]">
            <Calendar size={10} />
            {formatDate(deal.expectedCloseDate)}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {contact && (
            <>
              <Avatar name={`${contact.firstName} ${contact.lastName}`} size="xs" />
              <span className="text-[11px] text-[var(--muted-foreground)] truncate">
                {contact.firstName} {contact.lastName}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-[var(--muted)]">{deal.probability}%</span>
          {owner && <Avatar name={owner.name} color={owner.color} size="xs" />}
        </div>
      </div>
    </div>
  );
}

function groupByStage(deals: Deal[]): Record<DealStage, Deal[]> {
  const init = Object.fromEntries(STAGES.map((s) => [s.id, [] as Deal[]])) as Record<
    DealStage,
    Deal[]
  >;
  for (const d of deals) {
    init[d.stage].push(d);
  }
  for (const s of STAGES) {
    init[s.id].sort((a, b) => a.sortIndex - b.sortIndex);
  }
  return init;
}
