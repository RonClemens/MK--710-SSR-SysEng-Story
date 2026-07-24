import { EditableText } from "../components/EditableText";
import { SEMP_APPENDIX_NOTE, SEMP_DID_CITATION, SEMP_MAPPING_DISCLAIMER, SEMP_SECTIONS } from "../data/sempGuidance";
import { INCOSE_FRAMEWORK_INTRO, INCOSE_GROUP_META, INCOSE_PROCESS_GROUPS } from "../data/incoseGuidance";
import { buildSempMigrationMarkdown, type SempExportData } from "../utils/sempExport";
import { useSiteContent } from "../contexts/SiteContentContext";

type Props = SempExportData;

export function SempMigrationPage(data: Props) {
  const { getValue } = useSiteContent();

  const counts: { label: string; count: number }[] = [
    { label: "Logical Subsystems", count: data.logicalSubsystems.length },
    { label: "Configuration Items", count: data.cis.length },
    { label: "Delta Matrix rows", count: data.deltaMatrix.length },
    { label: "A/B Compatibility rows", count: data.abCompatibility.length },
    { label: "COTS Records", count: data.cotsRecords.length },
    { label: "Recommendations", count: data.recommendations.length },
    { label: "Interfaces", count: data.interfaces.length },
    { label: "Specifications", count: data.specifications.length },
    { label: "Safety Deliverables", count: data.safetyDeliverables.length },
    { label: "Program Planning Deliverables", count: data.planningDeliverables.length },
  ];

  const attachmentCount =
    data.cis.reduce((n, c) => n + c.attachments.length, 0) +
    data.cotsRecords.reduce((n, c) => n + c.attachments.length, 0) +
    data.specifications.reduce((n, s) => n + s.attachments.length, 0) +
    data.safetyDeliverables.reduce((n, sd) => n + sd.attachments.length, 0) +
    data.planningDeliverables.reduce((n, pd) => n + pd.attachments.length, 0);

  function handleDownload() {
    const markdown = buildSempMigrationMarkdown(data, getValue);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `semp-migration-package-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>SEMP Migration</h2>
      </div>

      <div className="safety-callout">
        <EditableText contentKey="semp.didCitation" defaultValue={SEMP_DID_CITATION} as="p" className="hint" />
        <EditableText contentKey="semp.mappingDisclaimer" defaultValue={SEMP_MAPPING_DISCLAIMER} as="p" />
      </div>

      <section>
        <h3>What this produces</h3>
        <p className="hint">
          <EditableText
            contentKey="semp.migration.howItWorks"
            defaultValue={
              "The button below assembles everything currently in this workbench — including any edits made in " +
              "Edit Mode to the guidance text — into a single Markdown (.md) file organized by SEMP section. " +
              "This is a manual, one-way export: this app has no network connection to any other machine or tool, " +
              "and does not (and should not) push data anywhere on its own. Download the file, move it to your " +
              "CUI-side environment using your own authorized transfer process (approved removable media, your " +
              "organization's file-transfer gateway, etc.), and incorporate its sections into the SEMP you're " +
              "authoring there. Treat this file as a drafting aid and cross-check, not a finished, ready-to-sign " +
              "SEMP — everything in it should be reviewed against your program's actual requirements before it " +
              "goes into a controlled document."
            }
            as="span"
          />
        </p>
      </section>

      <section>
        <h3>Data included in the export</h3>
        <div className="detail-card">
          <ul>
            {counts.map((c) => (
              <li key={c.label}>
                {c.label}: <strong>{c.count}</strong>
              </li>
            ))}
            <li>
              Linked document references (Consolidated Attachments Index): <strong>{attachmentCount}</strong>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h3>Section mapping (OSD SEP Outline v4.1 structure)</h3>
        <EditableText contentKey="semp.appendixNote" defaultValue={SEMP_APPENDIX_NOTE} as="p" className="hint" />
        <p className="hint">
          <span className="badge badge-info">Verbatim-verified</span> = this app's user-supplied SEP Outline PDF
          included the actual required-content text for that section, not just its title.{" "}
          <span className="badge">Title-verified</span> = the section number/title is confirmed against the real
          table of contents, but the specific required content beneath it was outside the uploaded PDF's page
          range and hasn't been read.
        </p>
        <div className="did-guidance-grid">
          {SEMP_SECTIONS.map((s) => (
            <div className="detail-card" key={s.id}>
              <h4>
                <EditableText contentKey={`semp.section.${s.id}.number`} defaultValue={s.defaultNumber} as="span" />
                {". "}
                <EditableText contentKey={`semp.section.${s.id}.title`} defaultValue={s.defaultTitle} as="span" />{" "}
                <span className={`badge ${s.verbatimVerified ? "badge-info" : ""}`}>
                  {s.verbatimVerified ? "Verbatim-verified" : "Title-verified"}
                </span>
              </h4>
              <EditableText
                contentKey={`semp.section.${s.id}.sourceDescription`}
                defaultValue={s.defaultSourceDescription}
                as="p"
                className="hint"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>INCOSE / ISO 15288 process mapping (feeds Section 1: Introduction)</h3>
        <EditableText contentKey="incose.frameworkIntro" defaultValue={INCOSE_FRAMEWORK_INTRO} as="p" className="hint" />
        <div className="did-guidance-grid">
          {INCOSE_PROCESS_GROUPS.map((group) => (
            <div className="detail-card" key={group}>
              <h4>{group}</h4>
              <EditableText
                contentKey={`incose.group.${group}.description`}
                defaultValue={INCOSE_GROUP_META[group].description}
                as="p"
                className="hint"
              />
              <ul>
                {INCOSE_GROUP_META[group].subProcesses.map((sp, i) => (
                  <li key={sp.name}>
                    <strong>{sp.name}</strong>
                    <br />
                    <EditableText
                      contentKey={`incose.group.${group}.subProcess.${i}.appMapping`}
                      defaultValue={sp.appMapping}
                      as="span"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <button className="button-primary" onClick={handleDownload}>
          Download SEMP Migration Package (.md)
        </button>
      </section>
    </div>
  );
}
