import { useMemo, useState } from "react";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  filterOptions?: string[];
  filterOptionLabels?: Record<string, string>;
  filterValue?: (row: T) => string;
}

interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  rows: T[];
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onEdit,
  onDelete,
  emptyMessage = "No rows yet.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filterableColumns = columns.filter((c) => c.filterOptions && c.filterValue);

  const visibleRows = useMemo(() => {
    let result = rows;
    for (const col of filterableColumns) {
      const active = filters[col.key];
      if (active) {
        result = result.filter((row) => col.filterValue!(row) === active);
      }
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        result = [...result].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av < bv) return -1 * sortDir;
          if (av > bv) return 1 * sortDir;
          return 0;
        });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir, filters]);

  function toggleSort(col: ColumnDef<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(col.key);
      setSortDir(1);
    }
  }

  return (
    <div className="data-table-wrap">
      {filterableColumns.length > 0 && (
        <div className="filter-bar">
          {filterableColumns.map((col) => (
            <label key={col.key} className="filter-control">
              <span>{col.label}</span>
              <select
                value={filters[col.key] ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, [col.key]: e.target.value }))}
              >
                <option value="">All</option>
                {col.filterOptions!.map((opt) => (
                  <option key={opt} value={opt}>
                    {col.filterOptionLabels?.[opt] ?? opt}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col)}
                  className={col.sortValue ? "sortable" : ""}
                >
                  {col.label}
                  {sortKey === col.key ? (sortDir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="empty-row">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}</td>
                  ))}
                  <td className="actions-col">
                    <button className="link-button" onClick={() => onEdit(row)}>
                      Edit
                    </button>
                    <button className="link-button danger" onClick={() => onDelete(row)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
