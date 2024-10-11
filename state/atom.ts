import { atom } from "jotai";
import { focusAtom } from "jotai-optics";

import { HistoryItem } from "@/types/history";

export const historyListAtom = atom<HistoryItem[]>([]);

export const pendingHistoryListAtom = focusAtom(historyListAtom, (optic) =>
  optic.filter((o) => o.status === "pending"),
);

export const addHistoryAtom = atom(null, (get, set, item: HistoryItem) => {
  const list = get(historyListAtom);
  set(historyListAtom, [...list, item]);
});
