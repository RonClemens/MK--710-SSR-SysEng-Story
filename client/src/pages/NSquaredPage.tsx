import { useRef, useState } from "react";
import { EditableText } from "../components/EditableText";
import { N2Grid } from "../components/N2Grid";
import { INTERFACE_HAZARD_NOTE } from "../data/safetyGuidance";
import type { ConfigurationItem, InterfaceRecord, LogicalSubsystem } from "../types";
import type { useEntity } from "../hooks/useEntity";

interface Props {
  subsystems: LogicalSubsystem[];
  cis: ConfigurationItem[];
  interfacesEntity: ReturnType<typeof useEntity<InterfaceRecord>>;
  onSelectSubsystem: (id: string) => void;
  onSelectCi: (id: string) => void;
}

interface CiFocus {
  ciIds: string[];
  label: string;
}

export function NSquaredPage({ subsystems, cis, interfacesEntity, onSelectSubsystem, onSelectCi }: Props) {
  const { rows: interfaces, error, create, update, remove } = interfacesEntity;
  const [ciFocus, setCiFocus] = useState<CiFocus | null>(null);
  const ciSectionRef = useRef<HTMLElement>(null);

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

  function drillIntoCis(subsystemAId: string, subsystemBId: string) {
    const a = subsystems.find((s) => s.id === subsystemAId);
    const b = subsystems.find((s) => s.id === subsystemBId);
    const ciIds = cis
      .filter((c) => c.subsystemIds.includes(subsystemAId) || c.subsystemIds.includes(subsystemBId))
      .map((c) => c.id);
    setCiFocus({ ciIds, label: `${a?.name ?? "?"} × ${b?.name ?? "?"}` });
    ciSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const ciElements = ciFocus ? cis.filter((c) => ciFocus.ciIds.includes(c.id)) : cis;
  const ciInterfaceCount = ciFocus
    ? interfaces.filter(
        (r) => r.scope === "ci" && ciFocus.ciIds.includes(r.aId) && ciFocus.ciIds.includes(r.bId)
      ).length
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h2>N² Diagrams</h2>
        <EditableText
          contentKey="page.n2.hint"
          defaultValue="Click any off-diagonal cell to document a real interface. Derived-only cells (shared CI or shared subsystem) are a starting hint, not a substitute for a documented interface."
          as="span"
          className="hint"
        />
      </div>
      <div className="safety-callout">
        <EditableText contentKey="safety.n2.interfaceHazardNote" defaultValue={INTERFACE_HAZARD_NOTE} as="span" />
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
            onDrillDown={drillIntoCis}
          />
        )}
      </section>

      <section ref={ciSectionRef}>
        <h3>CI × CI</h3>
        {ciFocus && (
          <p className="hint">
            Showing the {ciFocus.ciIds.length} CIs behind <strong>{ciFocus.label}</strong> — {ciInterfaceCount}{" "}
            documented CI-level interface{ciInterfaceCount === 1 ? "" : "s"} implement what looked like a single
            subsystem-level interface above.{" "}
            <button className="link-button" onClick={() => setCiFocus(null)}>
              Show all CIs
            </button>
          </p>
        )}
        {cis.length < 2 ? (
          <p className="hint">Add at least two CIs to generate this diagram.</p>
        ) : ciElements.length < 2 ? (
          <p className="hint">Fewer than two CIs serve this subsystem pair.</p>
        ) : (
          <N2Grid
            scope="ci"
            elements={ciElements}
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
