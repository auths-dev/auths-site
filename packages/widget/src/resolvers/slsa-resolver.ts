/**
 * Browser & WASM SLSA Level 3 Provenance Statement Resolver.
 */

export interface SlsaStatementBrowser {
  _type: string;
  predicateType: string;
  subject: Array<{ name: string; digest: { sha256: string } }>;
  builder: { id: string };
}

export function parseSlsaStatement(jsonStr: string): SlsaStatementBrowser | null {
  try {
    const parsed = JSON.parse(jsonStr) as SlsaStatementBrowser;
    if (parsed._type && parsed.predicateType && Array.isArray(parsed.subject)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
