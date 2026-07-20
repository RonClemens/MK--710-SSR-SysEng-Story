import type { Attachment } from "../types";

interface Props {
  attachments: Attachment[];
}

export function AttachmentLinks({ attachments }: Props) {
  if (attachments.length === 0) return null;
  return (
    <div className="attachment-links">
      {attachments.map((a, i) => (
        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="attachment-link">
          📎 {a.label}
        </a>
      ))}
    </div>
  );
}
