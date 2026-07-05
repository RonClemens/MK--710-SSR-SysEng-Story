import { useCallback, useEffect, useState } from "react";
import type { Crud } from "../api/client";

export function useEntity<T extends { id: string }>(crud: Crud<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await crud.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [crud]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(
    async (row: Partial<T>) => {
      const created = await crud.create(row);
      setRows((prev) => [...prev, created]);
      return created;
    },
    [crud]
  );

  const update = useCallback(
    async (id: string, row: Partial<T>) => {
      const updated = await crud.update(id, row);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [crud]
  );

  const remove = useCallback(
    async (id: string) => {
      await crud.remove(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    },
    [crud]
  );

  return { rows, loading, error, refresh, create, update, remove };
}
