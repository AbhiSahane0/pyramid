"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, type ReactNode } from "react";
import {
  DEFAULT_BOARD_PATH,
  filtersFromParams,
  isBoardPath,
  paramsWithFilters,
  paramsWithoutBoardState,
  paramsWithoutFilters,
  searchFromParams,
  SEARCH_KEY,
  TaskFilterContext,
  type BoardFilters,
} from "@/components/providers/task-filter-context";

/**
 * The URL is where the board's filters live.
 *
 * Holding them in React state made a filtered board impossible to share,
 * bookmark or reload, and meant scoping them to a board by hand. The query
 * string gives all of that for free: a filtered board is a link, and another
 * board is a different URL and therefore a different filter, with no
 * bookkeeping.
 *
 * Adjusting a filter uses `replace`, so narrowing by column and then by
 * priority leaves one history entry instead of three and Back still means
 * "leave this board" rather than "undo one of the four things I just
 * clicked". Arriving at the board from elsewhere is a genuine navigation and
 * uses `push`.
 */
export function TaskFilterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const onBoard = isBoardPath(pathname);
  const filters = useMemo(
    // Query params from another page are not this board's filters.
    () => (onBoard ? filtersFromParams(searchParams) : {}),
    [onBoard, searchParams],
  );

  const write = useCallback(
    (next: URLSearchParams) => {
      const query = next.toString();
      const target = onBoard ? pathname : DEFAULT_BOARD_PATH;
      const url = query ? `${target}?${query}` : target;
      // Filtering the board you are looking at is not a place you should have
      // to press Back through; arriving at the board from Settings is.
      if (onBoard) router.replace(url, { scroll: false });
      else router.push(url);
    },
    [onBoard, pathname, router],
  );

  const patchFilters = useCallback(
    (patch: BoardFilters) => {
      const base = onBoard ? searchParams : new URLSearchParams();
      write(paramsWithFilters(new URLSearchParams(base), patch));
    },
    [onBoard, searchParams, write],
  );

  const clearFilters = useCallback(
    () => write(paramsWithoutFilters(new URLSearchParams(searchParams))),
    [searchParams, write],
  );

  const search = onBoard ? searchFromParams(searchParams) : "";

  const setSearch = useCallback(
    (term: string) => {
      const next = new URLSearchParams(onBoard ? searchParams : undefined);
      if (term.trim()) next.set(SEARCH_KEY, term);
      else next.delete(SEARCH_KEY);
      write(next);
    },
    [onBoard, searchParams, write],
  );

  const clearAll = useCallback(
    () => write(paramsWithoutBoardState(new URLSearchParams(searchParams))),
    [searchParams, write],
  );

  const value = useMemo(
    () => ({ filters, patchFilters, clearFilters, search, setSearch, clearAll }),
    [filters, patchFilters, clearFilters, search, setSearch, clearAll],
  );

  return (
    <TaskFilterContext.Provider value={value}>{children}</TaskFilterContext.Provider>
  );
}
