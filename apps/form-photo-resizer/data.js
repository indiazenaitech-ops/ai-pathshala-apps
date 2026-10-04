/* Upload rules of Indian exam, job and government portals.
   Each preset: id, group (g), type (photo | sign | thumb | decl), exam name (proper noun, shown as is)
   or label (string key), target pixels w × h, dpi (written into the JPEG), file size min / max in KB
   (0 = no minimum), optional cm [width, height] as printed in the notification, optional flex
   [minW, minH, maxW, maxH] = the form accepts any pixel size in this range, strip = name + date
   band under the photo, note = string key with an extra hint, checked = date we last compared
   the values with the official notice (YYYY-MM-DD).
   Rules change every year: the app always tells people to confirm in their own notification. */
window.FPR_DATA = {
  types: ['photo', 'sign', 'thumb', 'decl'],
  groups: ['bank', 'central', 'rail', 'nta', 'id', 'common'],
  presets: [
    /* IBPS CRP (PO / Clerk / SO / RRB) and SBI PO / Clerk use the same scan rules */
    { id: 'ibps_photo', g: 'bank', type: 'photo', exam: 'IBPS / SBI (PO, Clerk, SO, RRB)', w: 200, h: 230, dpi: 200, min: 20, max: 50, checked: '2026-10-04' },
    { id: 'ibps_sign', g: 'bank', type: 'sign', exam: 'IBPS / SBI (PO, Clerk, SO, RRB)', w: 140, h: 60, dpi: 200, min: 10, max: 20, checked: '2026-10-04' },
    { id: 'ibps_thumb', g: 'bank', type: 'thumb', exam: 'IBPS / SBI (PO, Clerk, SO, RRB)', w: 240, h: 240, cm: [3, 3], dpi: 200, min: 20, max: 50, checked: '2026-10-04' },
    { id: 'ibps_decl', g: 'bank', type: 'decl', exam: 'IBPS / SBI (PO, Clerk, SO, RRB)', w: 800, h: 400, cm: [10, 5], dpi: 200, min: 50, max: 100, note: 'note_decl', checked: '2026-10-04' },

    /* UPSC: photo 20-300 KB (some guides say 200), 350-1000 px; signature three times, one below the other */
    { id: 'upsc_photo', g: 'central', type: 'photo', exam: 'UPSC (CSE, ESE, CDS, NDA…)', w: 413, h: 531, dpi: 300, min: 20, max: 200, flex: [350, 350, 1000, 1000], note: 'note_upsc', checked: '2026-10-04' },
    { id: 'upsc_sign', g: 'central', type: 'sign', exam: 'UPSC (CSE, ESE, CDS, NDA…)', w: 400, h: 500, dpi: 200, min: 20, max: 100, flex: [350, 350, 500, 500], note: 'note_upsc_sign', checked: '2026-10-04' },
    /* SSC (ssc.gov.in): the photo is captured live; signature "about 6.0 cm × 2.0 cm", 10-20 KB */
    { id: 'ssc_sign', g: 'central', type: 'sign', exam: 'SSC (CGL, CHSL, MTS, GD…)', w: 472, h: 157, cm: [6, 2], dpi: 200, min: 10, max: 20, flex: [140, 60, 600, 200], note: 'note_live', checked: '2026-10-04' },

    /* RRB (CEN 2025): photo captured live; signature at least 140 × 60 px, 30-49 KB */
    { id: 'rrb_sign', g: 'rail', type: 'sign', exam: 'RRB (NTPC, Group D, ALP, JE)', w: 140, h: 60, dpi: 200, min: 30, max: 49, note: 'note_live', checked: '2026-10-04' },

    /* NTA NEET (UG): passport photo 10-200 KB, postcard photo 4" × 6" 10-200 KB, signature 4-30 KB */
    { id: 'neet_photo', g: 'nta', type: 'photo', exam: 'NEET UG (NTA)', w: 276, h: 354, cm: [3.5, 4.5], dpi: 200, min: 10, max: 200, flex: [150, 190, 1000, 1300], note: 'note_neet', checked: '2026-10-04' },
    { id: 'neet_postcard', g: 'nta', type: 'photo', exam: 'NEET UG (NTA)', label: 'lbl_postcard', w: 600, h: 900, cm: [10.16, 15.24], dpi: 150, min: 10, max: 200, flex: [300, 450, 1200, 1800], note: 'note_neet', checked: '2026-10-04' },
    { id: 'neet_sign', g: 'nta', type: 'sign', exam: 'NEET UG (NTA)', w: 276, h: 118, cm: [3.5, 1.5], dpi: 200, min: 4, max: 30, flex: [140, 60, 600, 260], checked: '2026-10-04' },

    /* Protean (NSDL) PAN, e-sign / DSC mode: photo 3.5 × 2.5 cm 200 DPI max 20 KB, signature 2 × 4.5 cm max 10 KB */
    { id: 'pan_photo', g: 'id', type: 'photo', exam: 'PAN (Protean / NSDL)', w: 197, h: 276, cm: [2.5, 3.5], dpi: 200, min: 0, max: 20, note: 'note_pan', checked: '2026-10-04' },
    { id: 'pan_sign', g: 'id', type: 'sign', exam: 'PAN (Protean / NSDL)', w: 354, h: 157, cm: [4.5, 2], dpi: 200, min: 0, max: 10, note: 'note_pan', checked: '2026-10-04' },
    /* Sarathi Parivahan (learner / driving licence) */
    { id: 'dl_photo', g: 'id', type: 'photo', exam: 'Driving licence (Sarathi)', w: 420, h: 525, dpi: 300, min: 10, max: 20, flex: [276, 354, 420, 525], checked: '2026-10-04' },
    { id: 'dl_sign', g: 'id', type: 'sign', exam: 'Driving licence (Sarathi)', w: 256, h: 64, dpi: 200, min: 10, max: 20, flex: [200, 50, 300, 120], checked: '2026-10-04' },

    /* common sizes used by many state PSC, university and scholarship forms */
    { id: 'gen_passport', g: 'common', type: 'photo', label: 'lbl_passport', w: 413, h: 531, cm: [3.5, 4.5], dpi: 300, min: 20, max: 50, flex: [200, 230, 413, 531], checked: '2026-10-04' },
    { id: 'gen_stamp', g: 'common', type: 'photo', label: 'lbl_stamp', w: 236, h: 295, cm: [2, 2.5], dpi: 300, min: 10, max: 50, flex: [160, 200, 236, 295], checked: '2026-10-04' },
    { id: 'gen_sign', g: 'common', type: 'sign', label: 'lbl_sign_common', w: 276, h: 118, cm: [3.5, 1.5], dpi: 200, min: 10, max: 20, flex: [140, 60, 276, 118], checked: '2026-10-04' },
    { id: 'gen_thumb', g: 'common', type: 'thumb', label: 'lbl_thumb_common', w: 236, h: 236, cm: [3, 3], dpi: 200, min: 10, max: 50, checked: '2026-10-04' },
    { id: 'gen_decl_a4', g: 'common', type: 'decl', label: 'lbl_a4', w: 827, h: 1169, cm: [21, 29.7], dpi: 100, min: 50, max: 200, flex: [600, 848, 1240, 1754], checked: '2026-10-04' }
  ],
  /* starting values of "Custom size" for each type (the person can change everything) */
  custom: {
    photo: { w: 200, h: 230, dpi: 200, min: 20, max: 50 },
    sign: { w: 140, h: 60, dpi: 200, min: 10, max: 20 },
    thumb: { w: 240, h: 240, dpi: 200, min: 20, max: 50 },
    decl: { w: 800, h: 400, dpi: 200, min: 50, max: 100 }
  }
};
