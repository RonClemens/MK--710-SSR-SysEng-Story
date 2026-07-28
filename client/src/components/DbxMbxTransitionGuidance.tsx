import { EditableText } from "./EditableText";
import {
  DBX_MBX_BASELINE_ASYMMETRY_IMPLICATIONS,
  DBX_MBX_BASELINE_MATURITY_ASYMMETRY,
  DBX_MBX_SOW_TOOLING_MISMATCH,
  DBX_MBX_TRANSITION_DIMENSIONS,
  DBX_MBX_TRANSITION_INTRO,
  DBX_MBX_TRANSITION_MITIGATIONS,
} from "../../../methodology/guidance/dbxMbxGuidance";

// Shared renderer for the "caught between DBx and MBx" transition-challenges
// guidance — used on the Program Planning tab (team/planning-heavy content)
// and the SEMP Migration page's Modeling Strategy section (the real SEP
// Outline 2.4 anchor), rather than duplicated inline in both places.
export function DbxMbxTransitionGuidance() {
  return (
    <>
      <EditableText contentKey="dbxMbx.transitionHeading" defaultValue="Caught between DBx and MBx: the transition period" as="h4" />
      <EditableText contentKey="dbxMbx.transitionIntro" defaultValue={DBX_MBX_TRANSITION_INTRO} as="p" className="hint" />
      <div className="did-guidance-grid">
        {DBX_MBX_TRANSITION_DIMENSIONS.map((d) => (
          <div className="detail-card" key={d.id}>
            <EditableText contentKey={`dbxMbx.transition.${d.id}.name`} defaultValue={d.name} as="h4" />
            <EditableText contentKey={`dbxMbx.transition.${d.id}.challenge`} defaultValue={d.challenge} as="p" />
            <EditableText
              contentKey="dbxMbx.duplicationTaxLabel"
              defaultValue="Extra work required while straddling"
              as="p"
              className="did-guidance-label"
            />
            <EditableText
              contentKey={`dbxMbx.transition.${d.id}.duplicationTax`}
              defaultValue={d.duplicationTax}
              as="p"
              className="hint"
            />
          </div>
        ))}
      </div>

      <EditableText contentKey="dbxMbx.complicatingFactorHeading" defaultValue="This program's complicating factor" as="h4" />
      <EditableText
        contentKey="dbxMbx.baselineMaturityAsymmetry"
        defaultValue={DBX_MBX_BASELINE_MATURITY_ASYMMETRY}
        as="p"
      />
      <ul>
        {DBX_MBX_BASELINE_ASYMMETRY_IMPLICATIONS.map((imp, i) => (
          <EditableText
            key={imp.id}
            contentKey={`dbxMbx.baselineMaturityAsymmetry.implication.${i}`}
            defaultValue={imp.text}
            as="li"
          />
        ))}
      </ul>
      <EditableText contentKey="dbxMbx.sowToolingMismatch" defaultValue={DBX_MBX_SOW_TOOLING_MISMATCH} as="p" />

      <EditableText
        contentKey="dbxMbx.managingTransitionLabel"
        defaultValue="Managing the transition without it becoming permanent"
        as="p"
        className="did-guidance-label"
      />
      <ul>
        {DBX_MBX_TRANSITION_MITIGATIONS.map((m, i) => (
          <EditableText key={m.id} contentKey={`dbxMbx.transition.mitigation.${i}`} defaultValue={m.text} as="li" />
        ))}
      </ul>
    </>
  );
}
