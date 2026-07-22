/**
 * Browser Witness Quorum & Merkle Inclusion Proof Resolver.
 */

export interface WitnessCosignatureBrowser {
  witness_did: string;
  signature_hex: string;
  timestamp: string;
}

export function parseWitnessCosignature(jsonStr: string): WitnessCosignatureBrowser | null {
  try {
    const data = JSON.parse(jsonStr);
    if (data.witness_did && data.signature_hex) {
      return {
        witness_did: data.witness_did,
        signature_hex: data.signature_hex,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}
