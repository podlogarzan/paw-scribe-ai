import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { AppHeader } from "@/components/app/AppHeader";
import { BottomTabBar } from "@/components/app/BottomTabBar";
import { EmptyState } from "@/components/app/EmptyState";
import { EntryDot, EntryBadge } from "@/components/app/EntryDot";
import { NewEntryDialog } from "@/components/app/NewEntryDialog";
import { PetChipStrip } from "@/components/app/PetChipStrip";
import { PetHeroCard } from "@/components/app/PetHeroCard";
import { AddPetDialog } from "@/components/app/AddPetDialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { listPets } from "@/lib/pets.functions";
import { listEntriesForPet, upcomingEntries, type Entry, type EntryType } from "@/lib/entries.functions";
import { useActivePet } from "@/stores/active-pet";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-breakpoint";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const fetchPets = useServerFn(listPets);
  const fetchEntries = useServerFn(listEntriesForPet);
  const fetchUpcoming = useServerFn(upcomingEntries);
  const { activePetId, setActivePetId } = useActivePet();

  const pets = useQuery({ queryKey: ["pets"], queryFn: () => fetchPets() });

  // Pick first pet if none active. Redirect to onboarding if no pets at all.
  useEffect(() => {
    if (!pets.data) return;
    if (pets.data.length === 0) {
      navigate({ to: "/onboarding", replace: true });
      return;
    }
    if (!activePetId || !pets.data.find((p) => p.id === activePetId)) {
      setActivePetId(pets.data[0].id);
    }
  }, [pets.data, activePetId, setActivePetId, navigate]);

  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const fromIso = startOfWeek(monthStart, { weekStartsOn: 0 }).toISOString();
  const toIso = addDays(endOfMonth(monthAnchor), 7).toISOString();

  const entriesQ = useQuery({
    enabled: !!activePetId,
    queryKey: ["entries", activePetId, format(monthStart, "yyyy-MM")],
    queryFn: () =>
      fetchEntries({ data: { petId: activePetId!, fromIso, toIso } }),
  });

  const upcomingQ = useQuery({
    enabled: !!activePetId,
    queryKey: ["entries", "upcoming", activePetId],
    queryFn: () => fetchUpcoming({ data: { petId: activePetId! } }),
  });

  const entriesByDay = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of entriesQ.data ?? []) {
      const key = format(new Date(e.occurred_at), "yyyy-MM-dd");
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    return m;
  }, [entriesQ.data]);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newAtDate, setNewAtDate] = useState<Date | undefined>(undefined);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  if (!activePetId) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </AppShell>
    );
  }

  const dayEntriesForSelected = selectedDay
    ? entriesByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? []
    : [];

  const rightPanel = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {selectedDay ? "Day details" : "Upcoming"}
        </h2>
        {selectedDay ? (
          <p className="mt-1 text-base font-bold">{format(selectedDay, "EEEE, MMM d")}</p>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {selectedDay ? (
          dayEntriesForSelected.length > 0 ? (
            <ul className="grid gap-2">
              {dayEntriesForSelected.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => navigate({ to: "/entry/$entryId", params: { entryId: e.id } })}
                    className="soft-card flex w-full items-start gap-3 p-3 text-left"
                  >
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <EntryBadge type={e.type as EntryType} />
                        {e.created_by === "ai" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--ai-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ai)]">
                            <Sparkles className="h-3 w-3" /> AI
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(e.occurred_at), "h:mm a")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing logged on this day" body="Tap + to add an entry." />
          )
        ) : (upcomingQ.data ?? []).length > 0 ? (
          <ul className="grid gap-2">
            {upcomingQ.data!.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => navigate({ to: "/entry/$entryId", params: { entryId: e.id } })}
                  className="soft-card flex w-full flex-col items-start gap-1 p-3 text-left"
                >
                  <EntryBadge type={e.type as EntryType} />
                  <span className="text-sm font-semibold leading-tight">{e.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(e.occurred_at), "EEE, MMM d · h:mm a")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No upcoming items.</p>
        )}
      </div>
      <div className="border-t border-border p-4">
        <Button
          className="w-full"
          onClick={() => {
            setNewAtDate(selectedDay ?? new Date());
            setNewOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add entry
        </Button>
      </div>
    </div>
  );

  return (
    <AppShell rightPanel={rightPanel}>
      <AppHeader />

      <main className="flex-1 px-4 pb-24 md:px-6 md:pb-6 lg:px-8">
        {/* Search row (decorative for now) */}
        <div className="mt-2 flex items-center gap-2 lg:hidden">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Search</span>
          </div>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            aria-label="Open calendar"
            className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]"
          >
            <CalendarDays className="h-5 w-5" />
          </button>
        </div>

        {/* Pet chips */}
        {pets.data && pets.data.length > 0 && (
          <div className="mt-4 lg:hidden">
            <PetChipStrip
              pets={pets.data}
              activePetId={activePetId}
              onSelect={setActivePetId}
              onAdd={() => setAddPetOpen(true)}
            />
          </div>
        )}

        {/* Hero pet card */}
        <section className="lg:hidden">
          {(() => {
            const activePet = pets.data?.find((p) => p.id === activePetId) ?? null;
            return (
              <PetHeroCard
                pet={activePet}
                onOpen={() =>
                  activePet &&
                  navigate({ to: "/pet/$petId", params: { petId: activePet.id } })
                }
              />
            );
          })()}
        </section>

        {/* Upcoming strip */}
        <section className="mt-5 lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Upcoming</h2>
            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="text-xs font-semibold text-[#7BAF89]"
            >
              View calendar
            </button>
          </div>
          {upcomingQ.data && upcomingQ.data.length > 0 ? (
            <ul className="grid gap-2">
              {upcomingQ.data.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => navigate({ to: "/entry/$entryId", params: { entryId: e.id } })}
                    className="soft-card flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <EntryBadge type={e.type as EntryType} />
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(e.occurred_at), "EEE, MMM d · h:mm a")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="soft-card px-4 py-3 text-xs text-muted-foreground">
              No upcoming appointments. Add one with the + button.
            </div>
          )}
        </section>

        {/* Desktop / lg+ calendar */}
        <section className="mt-6 hidden lg:mt-3 lg:block">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">{format(monthAnchor, "MMMM yyyy")}</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setMonthAnchor(subMonths(monthAnchor, 1))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMonthAnchor(new Date())} aria-label="Today">
                <span className="text-xs font-semibold">Today</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEntries = entriesByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, monthAnchor);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const dots = dayEntries.slice(0, 4);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-start rounded-xl p-1 text-xs transition-colors md:text-sm",
                    inMonth ? "text-foreground hover:bg-accent" : "text-muted-foreground/40",
                    !isToday && !isSelected && "",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 flex h-7 w-7 items-center justify-center rounded-full leading-none transition-colors",
                      isToday && "bg-primary font-semibold text-primary-foreground",
                      !isToday && isSelected && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dots.length > 0 ? (
                    <span className="absolute bottom-1 flex gap-0.5">
                      {dots.map((e) => <EntryDot key={e.id} type={e.type as EntryType} />)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        {pets.data && pets.data.length > 0 && (entriesQ.data?.length ?? 0) === 0 && (
          <EmptyState
            icon="🐾"
            title="No entries yet"
            body={`Start tracking ${pets.data.find((p) => p.id === activePetId)?.name ?? "your pet"}'s health by tapping the + to add your first entry, or chat with the AI to keep everything in one place.`}
          />
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => {
          setNewAtDate(new Date());
          setNewOpen(true);
        }}
        aria-label="Add entry"
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-floating)] transition-transform hover:scale-[1.03] active:scale-95 md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        <Plus className="h-6 w-6" />
      </button>

      <BottomTabBar />

      <AddPetDialog open={addPetOpen} onOpenChange={setAddPetOpen} />

      {/* Calendar drawer for mobile */}
      <Drawer open={calendarOpen && !isDesktop} onOpenChange={setCalendarOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center justify-between">
              <span>{format(monthAnchor, "MMMM yyyy")}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setMonthAnchor(subMonths(monthAnchor, 1))} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setMonthAnchor(new Date())} aria-label="Today">
                  <span className="text-xs font-semibold">Today</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEntries = entriesByDay.get(key) ?? [];
                const inMonth = isSameMonth(day, monthAnchor);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const dots = dayEntries.slice(0, 4);
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedDay(day); setCalendarOpen(false); }}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-start rounded-xl p-1 text-xs transition-colors",
                      inMonth ? "text-foreground hover:bg-accent" : "text-muted-foreground/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 flex h-7 w-7 items-center justify-center rounded-full leading-none transition-colors",
                        isToday && "bg-primary font-semibold text-primary-foreground",
                        !isToday && isSelected && "bg-primary text-primary-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dots.length > 0 ? (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {dots.map((e) => <EntryDot key={e.id} type={e.type as EntryType} />)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={!!selectedDay && !isDesktop} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selectedDay ? format(selectedDay, "EEEE, MMM d") : ""}</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-6">
            {selectedDay && (entriesByDay.get(format(selectedDay, "yyyy-MM-dd"))?.length ?? 0) > 0 ? (
              <ul className="grid gap-2">
                {entriesByDay.get(format(selectedDay, "yyyy-MM-dd"))!.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => {
                        setSelectedDay(null);
                        navigate({ to: "/entry/$entryId", params: { entryId: e.id } });
                      }}
                      className="soft-card flex w-full items-start gap-3 p-3 text-left"
                    >
                      <div className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <EntryBadge type={e.type as EntryType} />
                          {e.created_by === "ai" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--ai-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ai)]">
                              <Sparkles className="h-3 w-3" /> AI
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(e.occurred_at), "h:mm a")}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nothing logged on this day"
                body="Tap + to add an entry."
              />
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setNewAtDate(selectedDay ?? new Date());
                  setSelectedDay(null);
                  setNewOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> Add entry for this day
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {activePetId && (
        <NewEntryDialog
          petId={activePetId}
          open={newOpen}
          onOpenChange={setNewOpen}
          defaultDate={newAtDate}
        />
      )}
    </AppShell>
  );
}