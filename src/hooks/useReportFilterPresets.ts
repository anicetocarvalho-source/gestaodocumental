import { useCallback, useEffect, useState } from "react";

export interface ReportFilterPreset<T = Record<string, unknown>> {
  id: string;
  name: string;
  values: T;
  createdAt: number;
}

const STORAGE_KEY = "nodidoc_report_presets";
const DEFAULTS_KEY = "nodidoc_report_presets_default";
const EVENT = "report-presets-updated";

type PresetMap = Record<string, ReportFilterPreset[]>;

function readAll(): PresetMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PresetMap) : {};
  } catch {
    return {};
  }
}

function readDefaults(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * Persists named filter presets (favourites) per report, in localStorage.
 */
export function useReportFilterPresets<T extends Record<string, unknown>>(reportKey: string) {
  const [presets, setPresets] = useState<ReportFilterPreset<T>[]>(
    () => (readAll()[reportKey] as ReportFilterPreset<T>[]) ?? []
  );
  const [defaultId, setDefaultId] = useState<string | null>(() => readDefaults()[reportKey] ?? null);

  useEffect(() => {
    const sync = () => {
      setPresets((readAll()[reportKey] as ReportFilterPreset<T>[]) ?? []);
      setDefaultId(readDefaults()[reportKey] ?? null);
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [reportKey]);

  const persist = useCallback(
    (next: ReportFilterPreset<T>[]) => {
      const all = readAll();
      all[reportKey] = next as ReportFilterPreset[];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setPresets(next);
      window.dispatchEvent(new CustomEvent(EVENT));
    },
    [reportKey]
  );

  const savePreset = useCallback(
    (name: string, values: T) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const current = (readAll()[reportKey] as ReportFilterPreset<T>[]) ?? [];
      const existing = current.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
      const preset: ReportFilterPreset<T> = existing
        ? { ...existing, values }
        : { id: crypto.randomUUID(), name: trimmed, values, createdAt: Date.now() };
      const next = existing
        ? current.map((p) => (p.id === existing.id ? preset : p))
        : [...current, preset];
      persist(next);
      return preset;
    },
    [persist, reportKey]
  );

  const removePreset = useCallback(
    (id: string) => {
      const current = (readAll()[reportKey] as ReportFilterPreset<T>[]) ?? [];
      persist(current.filter((p) => p.id !== id));
      const defaults = readDefaults();
      if (defaults[reportKey] === id) {
        delete defaults[reportKey];
        localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
        setDefaultId(null);
        window.dispatchEvent(new CustomEvent(EVENT));
      }
    },
    [persist, reportKey]
  );

  const toggleDefault = useCallback(
    (id: string) => {
      const defaults = readDefaults();
      const isDefault = defaults[reportKey] === id;
      if (isDefault) delete defaults[reportKey];
      else defaults[reportKey] = id;
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
      setDefaultId(isDefault ? null : id);
      window.dispatchEvent(new CustomEvent(EVENT));
    },
    [reportKey]
  );

  return { presets, defaultId, savePreset, removePreset, toggleDefault };
}
