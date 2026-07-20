import type { Attachment } from "../types";

// Edited as free text, one "label | url" per line — same convention as
// CotsRecord.qualifiedAlternates, so it's editable in a plain textarea
// without a bespoke repeating-row form.
export function attachmentsToText(attachments: Attachment[]): string {
  return attachments.map((a) => `${a.label} | ${a.url}`).join("\n");
}

export function textToAttachments(text: string): Attachment[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url = ""] = line.split("|").map((s) => s.trim());
      return { label, url };
    });
}
