import { N2Grid } from "../components/N2Grid";
import type { ConfigurationItem, InterfaceRecord, LogicalSubsystem } from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  interfacesEntity: ReturnType<typeof useEntity<InterfaceRecord>>;
  onSelectSubsystem: (id: string) => void;
  onSelectCi: (id: string) => void;
}

export function NSquaredPage({ subsystems, cis, interfacesEntity, onSelectSubsystem, onSelectCi }: Props) {
  const { rows: interfaces, error, create, update, remove } = interfacesEntity;

  function makeSaveHandler(scope: "subsystem" | "ci") {
    return async ({ id, aId, bId, description }: { id?: string; aId: string; bId: string; description: string }) => {
      if (id) await update(id, { description });
      else await create({ scope, aId, bId, description });
    };
  }

  function subsystemDerivedHint(aId: string, bId: string): string[] {
    return cis.filter((c) => c.subsystemIds.includes(aId) && c.subsystemIds.includes(bId)).map((c) => c.name);
  }

  function ciDerivedHint(aId: string, bId: string): string[] {
    const a = cis.find((c) => c.id === aId);
    const b = cis.find((c) => c.id === bId);
    if (!a || !b) return [];
    const shared = a.subsystemIds.filter((id) => b.subsystemIds.includes(id));
    return shared.map((id) => subsystems.find((s) => s.id === id)?.name ?? "(unknown)");
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>N² Diagrams</h2>
        <span className="hint">
          Click any off-diagonal cell to document a real interface. Derived-only cells (shared CI or shared
          subsystem) are a starting hint, not a substitute for a documented interface.
        </span>
      </div>
      {error && <p className="form-error">{error}</p>}

      <section>
        <h3>Subsystem × Subsystem</h3>
        {subsystems.length < 2 ? (
          <p className="hint">Add at least two logical subsystems to generate this diagram.</p>
        ) : (
          <N2Grid
            scope="subsystem"
            elements={subsystems}
            interfaces={interfaces}
            getDerivedHint={subsystemDerivedHint}
            onSave={makeSaveHandler("subsystem")}
            onDelete={remove}
            onSelectElement={onSelectSubsystem}
          />
        )}
      </section>

      <section>
        <h3>CI × CI</h3>
        {cis.length < 2 ? (
          <p className="hint">Add at least two CIs to generate this diagram.</p>
        ) : (
          <N2Grid
            scope="ci"
            elements={cis}
            interfaces={interfaces}
            getDerivedHint={ciDerivedHint}
            onSave={makeSaveHandler("ci")}
            onDelete={remove}
            onSelectElement={onSelectCi}
          />
        )}
      </section>
    </div>
  );
}
