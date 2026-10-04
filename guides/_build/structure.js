/* Structure of the guide pages (guides/). Text lives in guides/strings.js (window.GUIDES_STRINGS, 12 languages);
   this file says which keys each page uses, which apps it links and which screenshots it shows.
   Used by guides/_build/build.js (static pages), shots.js (screenshots) and verify.js (checks).

   Keys of a guide with id X: X_short (header + cards), X_doc (<title>), X_desc (meta description), X_h1, X_lead,
   X_quick (short answer), X_steps_h, X_s{n}_t / X_s{n} (steps), X_x_h / X_x{n} (extra list), X_q{n} / X_a{n} (FAQ),
   X_card (one line for cards), X_shot{n} (screenshot alt + caption).
   Inside any text: {app_<slug with _>} = the app's own title, and {<label>} (see LABELS) = a button name taken from
   the app's own strings in the same language, so the steps always match what people see in the app. */
'use strict';

const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];

/* date of the content (visible "Updated …" line and dateModified in the structured data) */
const UPDATED = '2026-10-04';
const PUBLISHED = '2026-10-04';

const GUIDES = [
  { id: 'tch', slug: 'ai-tools-for-teachers', icon: '🧑‍🏫', steps: 6, extras: 4, faq: 5, mins: 6,
    cta: { home: 'schools' }, shots: { 1: 1, 2: 2 },
    apps: ['prompt-builder', 'worksheet-generator', 'quiz-maker', 'marks-report-card', 'certificate-maker', 'attendance-register'],
    related: ['quiz', 'ai10', 'pdfc'] },
  { id: 'quiz', slug: 'quiz-maker-for-teachers', icon: '❓', steps: 6, extras: 4, faq: 5, mins: 5,
    cta: { app: 'quiz-maker' }, shots: { 2: 1, 3: 2 },
    apps: ['quiz-maker', 'live-quiz', 'quiz-join', 'worksheet-generator'],
    related: ['tch', 'ai10', 'pdfm'] },
  { id: 'ai10', slug: 'cbse-class-10-ai-project', icon: '🤖', steps: 6, extras: 5, faq: 5, mins: 7,
    cta: { app: 'ai-project-cycle' }, shots: { 2: 1, 5: 2 },
    apps: ['ai-project-cycle', 'teachable-machine', 'sentiment-trainer', 'python-playground', 'confusion-matrix-lab', 'statistics-calculator'],
    related: ['tch', 'quiz', 'pdfc'] },
  { id: 'pdfm', slug: 'merge-pdf-without-upload', icon: '📑', steps: 5, extras: 4, faq: 5, mins: 4,
    cta: { app: 'pdf-merge-split' }, shots: { 3: 1, 5: 2 },
    apps: ['pdf-merge-split', 'pdf-compress-convert'],
    related: ['pdfc', 'kd', 'gst'] },
  { id: 'pdfc', slug: 'compress-pdf-to-100kb', icon: '🗜️', steps: 5, extras: 4, faq: 5, mins: 4,
    cta: { app: 'pdf-compress-convert' }, shots: { 2: 1, 4: 2 },
    apps: ['pdf-compress-convert', 'form-photo-resizer', 'image-compressor', 'pdf-merge-split'],
    related: ['pdfm', 'bio', 'kd'] },
  { id: 'kd', slug: 'kruti-dev-to-unicode', icon: '🔤', steps: 5, extras: 4, faq: 5, mins: 4,
    cta: { app: 'krutidev-unicode' }, shots: { 3: 1, 4: 2 },
    apps: ['krutidev-unicode', 'typing-tutor', 'image-to-text'],
    related: ['pdfm', 'bio', 'tch'] },
  { id: 'bio', slug: 'marriage-biodata-format', icon: '💍', steps: 5, extras: 4, faq: 5, mins: 4,
    cta: { app: 'biodata-maker' }, shots: { 2: 1, 4: 2 },
    apps: ['biodata-maker', 'pdf-compress-convert'],
    related: ['pdfc', 'kd', 'sal'] },
  { id: 'gst', slug: 'gst-invoice-format', icon: '🧾', steps: 6, extras: 5, faq: 5, mins: 6, note: 'g_note_tax',
    cta: { app: 'gst-invoice-maker' }, shots: { 4: 1, 6: 2 },
    apps: ['gst-invoice-maker', 'gst-calculator', 'upi-qr-standee'],
    related: ['upi', 'sal', 'pdfm'] },
  { id: 'upi', slug: 'upi-qr-code-for-shop', icon: '💳', steps: 6, extras: 4, faq: 5, mins: 4,
    cta: { app: 'upi-qr-standee' }, shots: { 2: 1, 4: 2 },
    apps: ['upi-qr-standee', 'whatsapp-business-kit', 'gst-invoice-maker'],
    related: ['gst', 'sal', 'bio'] },
  { id: 'sal', slug: 'in-hand-salary-calculator', icon: '💰', steps: 5, extras: 4, faq: 5, mins: 5, note: 'g_note_tax',
    cta: { app: 'salary-tax-calculator' }, shots: { 1: 1, 3: 2 },
    apps: ['salary-tax-calculator', 'emi-savings-calculator'],
    related: ['gst', 'upi', 'pdfc'] }
];

/* index page groups */
const GROUPS = [
  { key: 'g_grp_teach', ids: ['tch', 'quiz', 'ai10'] },
  { key: 'g_grp_docs', ids: ['pdfm', 'pdfc', 'kd', 'bio'] },
  { key: 'g_grp_work', ids: ['gst', 'upi', 'sal'] }
];

/* {label} placeholders → [app slug, key in that app's strings.js (or EDU.COMMON)] */
const LABELS = {
  pb_copy: ['prompt-builder', 'copy_prompt'],
  ws_print: ['worksheet-generator', 'print'],
  qm_new: ['quiz-maker', 'new_quiz'],
  qm_mcq: ['quiz-maker', 'type_mcq'],
  qm_tf: ['quiz-maker', 'type_tf'],
  qm_save: ['quiz-maker', 'save_question'],
  qm_class: ['quiz-maker', 'tab_class'],
  qm_share: ['quiz-maker', 'tab_share'],
  lq_host: ['live-quiz', 'host'],
  pm_add: ['pdf-merge-split', 'add_files'],
  pm_sample: ['pdf-merge-split', 'try_sample'],
  pm_extras: ['pdf-merge-split', 'extras'],
  pm_one: ['pdf-merge-split', 'tab_merge'],
  pm_go: ['pdf-merge-split', 'go_merge'],
  pm_split: ['pdf-merge-split', 'tab_split'],
  pc_tab_compress: ['pdf-compress-convert', 'tab_compress'],
  pc_tab_img: ['pdf-compress-convert', 'tab_img'],
  pc_tab_unlock: ['pdf-compress-convert', 'tab_unlock'],
  pc_choose: ['pdf-compress-convert', 'choose_pdf'],
  pc_other: ['pdf-compress-convert', 'c_other'],
  pc_strong: ['pdf-compress-convert', 'c_strong'],
  pc_light: ['pdf-compress-convert', 'c_light'],
  pc_go: ['pdf-compress-convert', 'c_go'],
  pc_compare: ['pdf-compress-convert', 'compare'],
  pc_download: ['pdf-compress-convert', 'download_pdf'],
  pc_make: ['pdf-compress-convert', 'i_go'],
  kd_k2u: ['krutidev-unicode', 'dir_k2u'],
  kd_u2k: ['krutidev-unicode', 'dir_u2k'],
  kd_sample: ['krutidev-unicode', 'sample'],
  kd_keep: ['krutidev-unicode', 'opt_keep'],
  kd_copy: ['krutidev-unicode', 'copy_result'],
  kd_dl: ['krutidev-unicode', 'dl_txt'],
  bd_blank: ['biodata-maker', 'start_blank'],
  bd_print: ['biodata-maker', 'print_pdf'],
  bd_png: ['biodata-maker', 'png'],
  gi_profile: ['gst-invoice-maker', 'tab_profile'],
  gi_inv: ['gst-invoice-maker', 'dt_inv'],
  gi_bos: ['gst-invoice-maker', 'dt_bos'],
  gi_qtn: ['gst-invoice-maker', 'dt_qtn'],
  gi_print: ['gst-invoice-maker', 'print_pdf'],
  uq_print: ['upi-qr-standee', 'print'],
  uq_png: ['upi-qr-standee', 'btn_png'],
  uq_counter: ['upi-qr-standee', 'btn_counter'],
  sc_compare: ['salary-tax-calculator', 'mode_compare'],
  sc_hike: ['salary-tax-calculator', 'mode_hike'],
  sc_reverse: ['salary-tax-calculator', 'mode_reverse']
};

const SITE = 'https://apnipathshala.ai/';
const slugOf = id => GUIDES.find(g => g.id === id).slug;
/* public URL of a page: index (id null) or a guide, in a language */
function pageUrl(id, lang) { return SITE + 'guides/' + (lang === 'en' ? '' : lang + '/') + (id ? slugOf(id) + '/' : ''); }
/* repo-relative file of a page */
function pageFile(id, lang) { return 'guides/' + (lang === 'en' ? '' : lang + '/') + (id ? slugOf(id) + '/' : '') + 'index.html'; }

/* every key the strings table must have */
function guideKeys(g) {
  const k = ['short', 'doc', 'desc', 'h1', 'lead', 'quick', 'steps_h', 'x_h', 'card'];
  for (let i = 1; i <= g.steps; i++) k.push('s' + i + '_t', 's' + i);
  for (let i = 1; i <= g.extras; i++) k.push('x' + i);
  for (let i = 1; i <= g.faq; i++) k.push('q' + i, 'a' + i);
  for (const n of Object.values(g.shots)) k.push('shot' + n);
  return k.map(x => g.id + '_' + x);
}
const COMMON_KEYS = ['g_kicker', 'g_crumb_home', 'g_crumb_guides', 'g_meta', 'g_open', 'g_open_lib', 'g_see_steps',
  'g_quick_h', 'g_why_h', 'g_why_1', 'g_why_2', 'g_why_3', 'g_why_4', 'g_su_h', 'g_su_text', 'g_su_btn', 'g_su_note',
  'g_yt_text', 'g_yt_btn', 'g_faq_h', 'g_more_h', 'g_apps_h', 'g_all', 'g_share_h', 'g_share_text', 'g_wa', 'g_note_tax',
  'g_read', 'g_shot_label', 'g_langs', 'g_months', 'g_ix_short', 'g_ix_doc', 'g_ix_desc', 'g_ix_kicker', 'g_ix_h1', 'g_ix_lead', 'g_grp_teach', 'g_grp_docs', 'g_grp_work'];

module.exports = { LANGS, UPDATED, PUBLISHED, GUIDES, GROUPS, LABELS, SITE, pageUrl, pageFile, slugOf, guideKeys, COMMON_KEYS };
