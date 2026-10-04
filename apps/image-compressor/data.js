/* Size presets for Image Compressor & Resizer. Editable: change a number here and the app follows.
   Labels and tips live in strings.js as p_<id> (name) and pn_<id> (tip), in all 12 languages.

   Fields:
     id      unique id (also used in strings.js)
     group   social | shop | web | general (heading the preset is listed under)
     w, h    exact output size in px (both set = a "box": fit / fill / stretch apply)
     w only  resize to this width, height follows the photo's shape
     long    resize so the longer side is this many px
     (none)  keep the original size, only compress
     mode    fit | fill | exact, applied when the preset is picked (box presets)
     bg      color | blur | transparent, background for "fit" (optional)
     color   background colour for "fit" (optional)
     margin  % of empty space around the photo in "fit" (optional)
     format  jpg | webp | png, suggested when the preset is picked (optional)
     maxKB   the platform's file-size limit; quality is lowered automatically to stay under it (optional)

   Sizes checked October 2026 against the platforms' own help pages:
     Instagram feed 4:5 1080x1350, profile-grid 3:4 1080x1440, square 1080x1080, Stories/Reels 1080x1920;
     YouTube thumbnail 1280x720 (16:9), under 2 MB works everywhere (computer uploads now allow more);
     Facebook Page cover 851x315 (shows 820x312 on computers, 640x360 on phones);
     LinkedIn profile background 1584x396; X (Twitter) header 1500x500; link preview image 1200x630;
     Pinterest pin 2:3 1000x1500;
     Amazon / Flipkart / Meesho main photo: square, pure white, 1000 px or more for zoom (2000 px recommended),
     product fills about 85-90% of the frame. */
window.IC_PRESETS = [
  { id: 'ig_portrait', group: 'social', w: 1080, h: 1350, mode: 'fill' },
  { id: 'ig_grid', group: 'social', w: 1080, h: 1440, mode: 'fill' },
  { id: 'ig_square', group: 'social', w: 1080, h: 1080, mode: 'fill' },
  { id: 'story', group: 'social', w: 1080, h: 1920, mode: 'fit', bg: 'blur' },
  { id: 'yt_thumb', group: 'social', w: 1280, h: 720, mode: 'fill', maxKB: 2000 },
  { id: 'fb_cover', group: 'social', w: 851, h: 315, mode: 'fill' },
  { id: 'li_banner', group: 'social', w: 1584, h: 396, mode: 'fill' },
  { id: 'x_header', group: 'social', w: 1500, h: 500, mode: 'fill' },
  { id: 'link', group: 'social', w: 1200, h: 630, mode: 'fill' },
  { id: 'pin', group: 'social', w: 1000, h: 1500, mode: 'fill' },
  { id: 'marketplace', group: 'shop', w: 2000, h: 2000, mode: 'fit', bg: 'color', color: '#ffffff', margin: 6, format: 'jpg', maxKB: 10000 },
  { id: 'catalog', group: 'shop', w: 1000, h: 1000, mode: 'fit', bg: 'color', color: '#ffffff', margin: 4 },
  { id: 'web_hero', group: 'web', w: 1920 },
  { id: 'web_blog', group: 'web', w: 1200 },
  { id: 'email', group: 'web', w: 600 },
  { id: 'wa_share', group: 'general', long: 1600 },
  { id: 'original', group: 'general' },
  { id: 'custom', group: 'general', custom: true }
];
window.IC_GROUPS = ['social', 'shop', 'web', 'general'];
