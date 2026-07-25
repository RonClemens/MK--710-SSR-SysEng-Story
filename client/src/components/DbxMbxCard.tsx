import { EditableText } from "./EditableText";
import type { DbxMbxDimension } from "../../../methodology/guidance/dbxMbxGuidance";

interface Props {
  dimension: DbxMbxDimension;
}

// Shared renderer for one Document-Based (DBx) vs Model-Based (MBx) SE
// dimension — used on every tab that carries this guidance (Subsystems, CI
// Inventory, N² Diagram, Specifications, Safety Deliverables, Program
// Planning) so the same content key convention and layout apply everywhere.
export function DbxMbxCard({ dimension }: Props) {
  return (
    <div className="detail-card">
      <h4>{dimension.name}</h4>
      <p className="did-guidance-label">Document-Based (DBx)</p>
      <EditableText
        contentKey={`dbxMbx.${dimension.id}.dbxDescription`}
        defaultValue={dimension.dbxDescription}
        as="p"
      />
      <p className="did-guidance-label">Model-Based (MBx)</p>
      <EditableText
        contentKey={`dbxMbx.${dimension.id}.mbxDescription`}
        defaultValue={dimension.mbxDescription}
        as="p"
      />
      <p className="did-guidance-label">Tradeoff</p>
      <EditableText
        contentKey={`dbxMbx.${dimension.id}.tradeoff`}
        defaultValue={dimension.tradeoff}
        as="p"
        className="hint"
      />
      <p className="did-guidance-label">In this app</p>
      <EditableText
        contentKey={`dbxMbx.${dimension.id}.thisAppNote`}
        defaultValue={dimension.thisAppNote}
        as="p"
        className="hint"
      />
    </div>
  );
}
