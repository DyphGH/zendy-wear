/**

 * responsive-images.js — upgrades product <img> to <picture> when

 * assets/img/products/manifest.json exists (written by optimize-images.mjs).

 *

 * data-quality="max" → só JPEG (evita AVIF/WebP soft) + src na variante maior.

 */



const MANIFEST_URL = '/assets/img/products/manifest.json';

const PRODUCT_IMG_RE = /^\/assets\/img\/products\/([^/]+)\.(jpe?g|png)$/i;



let manifest = null;



function buildSrcset(base, widths, ext) {

  return widths.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ');

}



function wrapWithPicture(img, widths) {

  const match = PRODUCT_IMG_RE.exec(img.getAttribute('src') || '');

  if (!match) return;



  const name = match[1];

  const base = `/assets/img/products/${name}`;

  const maxW = Math.max(...widths);

  const hq = img.hasAttribute('data-quality');

  const sizes =

    img.getAttribute('sizes') ||

    (img.closest('.detail-media')

      ? '(max-width: 900px) 100vw, 33vw'

      : '(max-width: 580px) 100vw, (max-width: 1000px) 50vw, 33vw');



  const picture = document.createElement('picture');

  const inLabel = img.closest('.detail-media--label');

  const inFill = img.closest('.detail-media:not(.detail-media--label), .brand-frame, .view-pane');



  if (inFill) {

    picture.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';

  } else if (inLabel) {

    picture.style.cssText = 'display:block;width:100%;line-height:0';

  }



  const clone = img.cloneNode(true);

  clone.removeAttribute('data-responsive');

  clone.removeAttribute('data-quality');

  clone.src = `${base}-${maxW}.jpeg`;

  clone.setAttribute('sizes', sizes);



  if (inLabel) {

    clone.style.width = '100%';

    clone.style.height = 'auto';

    clone.style.maxHeight = 'min(72vh, 720px)';

    clone.style.objectFit = 'unset';

  }



  if (hq) {

    const jpeg = document.createElement('source');

    jpeg.type = 'image/jpeg';

    jpeg.srcset = buildSrcset(base, widths, 'jpeg');

    jpeg.sizes = sizes;

    picture.append(jpeg, clone);

  } else {

    const avif = document.createElement('source');

    avif.type = 'image/avif';

    avif.srcset = buildSrcset(base, widths, 'avif');

    avif.sizes = sizes;



    const webp = document.createElement('source');

    webp.type = 'image/webp';

    webp.srcset = buildSrcset(base, widths, 'webp');

    webp.sizes = sizes;



    picture.append(avif, webp, clone);

  }



  img.replaceWith(picture);

}



export async function initResponsiveImages() {

  try {

    const res = await fetch(MANIFEST_URL, { cache: 'force-cache' });

    if (!res.ok) return;

    manifest = await res.json();

  } catch {

    return;

  }



  document.querySelectorAll('img[data-responsive]').forEach((img) => {

    const match = PRODUCT_IMG_RE.exec(img.getAttribute('src') || '');

    if (!match) return;

    const widths = manifest[match[1]];

    if (Array.isArray(widths) && widths.length > 0) wrapWithPicture(img, widths);

  });

}


