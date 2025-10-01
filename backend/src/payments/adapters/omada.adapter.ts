export class OmadaStubAdapter {
  async authorizeByMac(mac: string, durationSec: number) {
    console.log(`[OMADA:STUB] authorize mac=${mac} for ${durationSec}s`);
    return { ok: true };
  }
}
