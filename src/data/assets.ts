// Rich SVG asset definitions & visual emblems for Vintage Vault

export const ASSET_ICONS = {
  // Wax Seal S-Tier
  waxSeal: `
    <svg viewBox="0 0 64 64" width="32" height="32" style="filter: drop-shadow(0 2px 6px rgba(185, 28, 28, 0.5));">
      <circle cx="32" cy="32" r="28" fill="#991b1b" stroke="#f5cf6d" stroke-width="2"/>
      <circle cx="32" cy="32" r="23" fill="none" stroke="#f5cf6d" stroke-dasharray="3,2" stroke-width="1.5"/>
      <path d="M26 40l6-16 6 16-10-8-8 8z" fill="#f5cf6d"/>
      <circle cx="32" cy="32" r="3" fill="#ffffff"/>
    </svg>
  `,

  // Certified Authentic Stamp
  certifiedStamp: `
    <div style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;background:rgba(85,239,196,0.12);border:1px dashed #55efc4;color:#55efc4;font-size:9px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
      <span>✓</span> <span>ORİJİNAL EKSPERTİZ</span>
    </div>
  `,

  // Customer detailed avatars with luxury gradient rings
  avatars: {
    harrington: `
      <div style="position:relative;width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#1e3a2f,#0d1a14);border:2px solid #f5cf6d;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 16px rgba(245,207,109,0.3);">
        🧐
        <div style="position:absolute;bottom:-4px;right:-4px;background:#991b1b;color:#fef08a;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;border:1px solid #f5cf6d;">VIP</div>
      </div>
    `,
    selim: `
      <div style="position:relative;width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#37271c,#1f140e);border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 16px rgba(245,158,11,0.3);">
        🕵️
        <div style="position:absolute;bottom:-4px;right:-4px;background:#b45309;color:#fef3c7;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;border:1px solid #f59e0b;">ESKİCİ</div>
      </div>
    `,
    claire: `
      <div style="position:relative;width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#1c2f37,#0f1a1f);border:2px solid #38bdf8;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 16px rgba(56,189,248,0.3);">
        👒
        <div style="position:absolute;bottom:-4px;right:-4px;background:#0369a1;color:#e0f2fe;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;border:1px solid #38bdf8;">TURİST</div>
      </div>
    `,
    salvatore: `
      <div style="position:relative;width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#2b151e,#150a0f);border:2px solid #f43f5e;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 16px rgba(244,63,94,0.3);">
        🕶️
        <div style="position:absolute;bottom:-4px;right:-4px;background:#9f1239;color:#ffe4e6;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;border:1px solid #f43f5e;">MAFIA</div>
      </div>
    `,
    muazzez: `
      <div style="position:relative;width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,#2a1e38,#160e1f);border:2px solid #a855f7;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 4px 16px rgba(168,85,247,0.3);">
        👵
        <div style="position:absolute;bottom:-4px;right:-4px;background:#6b21a8;color:#f3e8ff;font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;border:1px solid #a855f7;">KOLEKSİYON</div>
      </div>
    `
  }
};
