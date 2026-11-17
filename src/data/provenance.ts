import records from "./provenance.json" with { type: "json" };

export interface SourceRecord {
  url: string;
  retrieved_at: string | null;
  sha256: string;
  changed: boolean;
  record: string;
}

/** The current accepted download, derived from its canonical sourceledger log. */
export const sourceRecord = (id: string): SourceRecord | undefined => (records as Record<string, SourceRecord>)[id];
