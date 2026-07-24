import { useRef, useState } from "react";
import { EditableText } from "../components/EditableText";
import { N2Grid } from "../components/N2Grid";
import { DbxMbxCard } from "../components/DbxMbxCard";
import { INTERFACE_HAZARD_NOTE } from "../data/safetyGuidance";
import { DBX_MBX_DIMENSIONS, DBX_MBX_INTRO } from "../data/dbxMbxGuidance";
import { SPEC_BASELINES, type ConfigurationItem, type InterfaceRecord, type LogicalSubsystem, type SpecBaseline } from "../types";
import type { useEntity } from "../hooks/useEntity";

const interfaceManagementDimension = DBX_MBX_DIMENSIONS.find((d) => d.id === "interfaceManagement")!;

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

export function NSquaredPage({ subsystems: allSubsystems, cis: allCis, interfacesEntity, onSelectSubsystem, onSelectCi }: Props) {
  const { rows: interfaces, error, create, update, remove } = interfacesEntity;
  const [ciFocus, setCiFocus] = useState<CiFocus | null>(null);
  const [baseline, setBaseline] = useState<SpecBaseline>("Baseline A");
  const [showGuidance, setShowGuidance] = useState(false);
  const ciSectionRef = useRef<HTMLElement>(null);

  const subsystems = allSubsystems.filter((s) => s.baseline === baseline);
  const cis = allCis.filter((c) => c.baseline === baseline);

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
        <label className="form-field" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", width: "auto" }}>
          <span>Baseline</span>
          <select
            value={baseline}
            onChange={(e) => {
              setBaseline(e.target.value as SpecBaseline);
              setCiFocus(null);
            }}
          >
            {SPEC_BASELINES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="safety-callout">
        <EditableText contentKey="safety.n2.interfaceHazardNote" defaultValue={INTERFACE_HAZARD_NOTE} as="span" />
      </div>

      <button className="link-button" onClick={() => setShowGuidance((v) => !v)}>
        {showGuidance ? "Hide" : "Show"} Document-Based (DBx) vs Model-Based (MBx) guidance
      </button>
      {showGuidance && (
        <div className="did-guidance">
          <EditableText contentKey="dbxMbx.intro" defaultValue={DBX_MBX_INTRO} as="p" className="hint" />
          <div className="did-guidance-grid">
            <DbxMbxCard dimension={interfaceManagementDimension} />
          </div>
        </div>
      )}

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
