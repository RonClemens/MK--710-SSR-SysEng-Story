import { EditableText } from "./EditableText";
import {
  DBX_MBX_TRANSITION_DIMENSIONS,
  DBX_MBX_TRANSITION_INTRO,
  DBX_MBX_TRANSITION_MITIGATIONS,
} from "../data/dbxMbxGuidance";

// Shared renderer for the "caught between DBx and MBx" transition-challenges
// guidance — used on the Program Planning tab (team/planning-heavy content)
// and the SEMP Migration page's Modeling Strategy section (the real SEP
// Outline 2.4 anchor), rather than duplicated inline in both places.
export function DbxMbxTransitionGuidance() {
  return (
    <>
      <h4>Caught between DBx and MBx: the transition period</h4>
      <EditableText contentKey="dbxMbx.transitionIntro" defaultValue={DBX_MBX_TRANSITION_INTRO} as="p" className="hint" />
      <div className="did-guidance-grid">
        {DBX_MBX_TRANSITION_DIMENSIONS.map((d) => (
          <div className="detail-card" key={d.id}>
            <h4>{d.name}</h4>
            <EditableText contentKey={`dbxMbx.transition.${d.id}.challenge`} defaultValue={d.challenge} as="p" />
            <p className="did-guidance-label">Extra work required while straddling</p>
            <EditableText
              contentKey={`dbxMbx.transition.${d.id}.duplicationTax`}
              defaultValue={d.duplicationTax}
              as="p"
              className="hint"
            />
          </div>
        ))}
      </div>
      <p className="did-guidance-label">Managing the transition without it becoming permanent</p>
      <ul>
        {DBX_MBX_TRANSITION_MITIGATIONS.map((m, i) => (
          <EditableText key={m.id} contentKey={`dbxMbx.transition.mitigation.${i}`} defaultValue={m.text} as="li" />
        ))}
      </ul>
    </>
  );
}
