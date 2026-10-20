"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function useAuthReturnTo() {
  return useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get("next"), () => null);
}
