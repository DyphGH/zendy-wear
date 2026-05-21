/**
 * i18n.js — PT / EN for the whole site.
 * Markup uses data-i18n, data-i18n-aria, data-i18n-placeholder, data-i18n-html.
 */

const STORAGE_KEY = 'zendy_lang_v1';

const STRINGS = {
  pt: {
    'meta.title': 'Zendy Wear® — Streetwear psicadélico · Drop 001 · Feito em Portugal',
    'meta.description':
      'Streetwear psicadélico de Lisboa. Drop 001 — 3 estampas, 150 unidades cada, serigrafia manual em algodão preto 260gsm. Sem reedições.',
    'skip': 'Saltar para a coleção',
    'nav.logoAria': 'Zendy Wear — início',
    'nav.collection': 'Coleção',
    'nav.brand': 'Marca',
    'nav.cartLabel': 'Carrinho',
    'nav.cartAria': 'Abrir carrinho',
    'nav.langAria': 'Idioma',
    'lang.pt': 'PT',
    'lang.en': 'EN',
    'hero.eye': 'Outono 2026 · Drop 001 · 3 estampas · 150 unidades cada',
    'hero.sub': 'Streetwear psicadélico · Feito em Portugal · Sem reedições',
    'hero.ctaShop': 'Ver Drop 001',
    'hero.ctaStory': 'A nossa história',
    'hero.scroll': 'Deslizar',
    'mq.1': 'Outono 2026', 'mq.2': 'Drop 001', 'mq.3': '3 estampas',
    'mq.4': 'Feito em Portugal', 'mq.5': '150 unidades', 'mq.6': 'Sem reedições',
    'mq.7': 'Submerge-te',
    'mq.8': 'Serigrafia manual', 'mq.9': '260gsm', 'mq.10': 'Feita para o caos',
    'mq.12': 'Edição limitada', 'mq.13': 'Algodão pesado',
    'shop.label': '001 — Drop 001 · Primeira coleção',
    'shop.title': 'A Coleção',
    'shop.badge': '150 un.',
    'shop.print': 'Serigrafia psicadélica · Drop 001',
    'view.front': 'Frente',
    'view.back': 'Costas',
    'view.collar': 'Gola',
    'size.legend': 'Escolher tamanho',
    'size.label': 'Tamanho',
    'size.guide': 'Guia',
    'size.pick': 'Escolhe o teu tamanho',
    'size.selected': 'Selecionado: {size}',
    'product.add': 'Adicionar',
    'product.selectSize': 'Escolher tamanho',
    'price.aria': 'Preço {price}',
    'price.ariaPromo': 'Preço promocional {price}, antes {compare}',
    'product.promoBadge': 'Lançamento — restam {remaining} un. a este preço',
    'brand.label': '002 — A Marca',
    'brand.h1a': 'Feita', 'brand.h1b': 'para o', 'brand.h1c': 'underground',
    'brand.body':
      'A Zendy Wear vive no espaço entre <em>pressão e libertação</em> — onde a cidade pesa e tu respondes com mais força.<br><br>Cada camisola é serigrafada à mão em algodão preto pesado, feita em Portugal. <em>Séries limitadas. Sem reedições.</em> Quando acaba, acaba.',
    'brand.s1': 'Estampas no Drop 001', 'brand.s2': 'Unidades por estampa',
    'brand.s3': 'Feito em Portugal', 'brand.s4': 'Reedições — nunca',
    'collar.l1': 'Etiqueta — Feita para o caos', 'collar.l2': 'Tinta à base de água', 'collar.l3': 'Algodão 260gsm',
    'mani.label': '003 — Manifesto', 'mani.sub': 'Feita para o caos',
    'mani.body':
      'Não fazemos roupa para quem quer ser visto.<br><br>Fazemos roupa para quem <strong>não pode ser ignorado.</strong><br><br>A Zendy existe onde a pressão encontra a libertação — onde a cidade testa-te e tu testas-a de volta. Cada gráfico é uma janela para um mundo que não segue as regras deste.<br><br><strong>Sem limites. Só pressão.</strong>',
    'cart.title': 'O teu saco', 'cart.closeAria': 'Fechar carrinho',
    'cart.empty': 'O saco está vazio. O drop espera por ti.',
    'cart.total': 'Total', 'cart.checkout': 'Finalizar',
    'cart.note': 'Pagamento seguro via Stripe',
    'cart.sizeGuide': 'Guia de tamanhos',
    'cart.shippingLink': 'Envios e devoluções',
    'cart.stripeSetup': 'Stripe ainda não configurado no servidor — a abrir email.',
    'cart.checkoutError': 'Checkout indisponível — tenta por email.',
    'cart.checkoutSuccess': 'Pagamento recebido. Obrigado — vais receber confirmação por email.',
    'cart.size': 'Tamanho', 'cart.remove': 'Remover',
    'cart.removeAria': 'Remover {name}, tamanho {size}, do carrinho (todas as unidades)',
    'cart.qtyMinusAria': 'Diminuir quantidade de {name}, tamanho {size}',
    'cart.qtyPlusAria': 'Aumentar quantidade de {name}, tamanho {size}',
    'cart.qtyGroupAria': 'Quantidade de {name}, tamanho {size}',
    'cart.thumbAlt': 'Miniatura de {name}',
    'cart.toastPickSize': 'Escolhe um tamanho primeiro',
    'cart.toastAdded': 'Adicionado',
    'cart.mail.subject': 'Encomenda Zendy — Drop 001',
    'cart.mail.greeting': 'Olá Zendy,',
    'cart.mail.intro': 'Gostaria de reservar:',
    'cart.mail.total': 'Total',
    'cart.mail.shipping': 'Dados de envio:',
    'cart.mail.name': 'Nome:',
    'cart.mail.address': 'Morada:',
    'cart.mail.city': 'Cidade / Código postal / País:',
    'cart.mail.phone': 'Telefone:',
    'cart.mail.thanks': 'Obrigado/a.',
    'cart.item': 'artigo', 'cart.items': 'artigos',
    'footer.newsletterHint': 'Recebe um aviso por email quando lançarmos uma nova coleção.',
    'footer.emailLabel': 'Endereço de email',
    'footer.emailPlaceholder': 'o.teu.email@algo.pt',
    'footer.join': 'Entrar',
    'footer.instagram': 'Instagram',
    'footer.sizeGuide': 'Guia de tamanhos',
    'footer.shipping': 'Envios e devoluções',
    'footer.contact': 'Contacto',
    'footer.copy': '© 2026 Zendy Wear®. Feita para o underground.',
    'footer.made': 'Feita em Portugal · Serigrafia manual',
    'newsletter.invalid': 'Introduz um email válido.',
    'newsletter.ok': 'Quase — confirma no teu cliente de email.',
    'newsletter.mailSubject': 'Zendy — aviso nova coleção',
    'newsletter.mailIntro': 'Quero receber aviso de nova coleção:',
    'newsletter.mailNote': '(Formulário newsletter em zendywear.com)',
    'modal.closeAria': 'Fechar',
    'modal.size.eyebrow': 'Drop 001',
    'modal.size.title': 'Guia de tamanhos',
    'modal.size.lead': 'Corte oversized unisex. Medidas do corpo da peça, em cm. Entre dois tamanhos? Sobe um.',
    'modal.size.tabEu': 'Europa (EU)',
    'modal.size.tabUk': 'Reino Unido (UK)',
    'modal.size.thSize': 'Tamanho',
    'modal.size.thUk': 'UK',
    'modal.size.thChest': 'Peito',
    'modal.size.thLength': 'Comprimento',
    'modal.size.thShoulder': 'Ombro',
    'modal.size.note': 'Tolerância ±2 cm (serigrafia manual). 260gsm algodão pesado.',
    'modal.ship.eyebrow': 'Política',
    'modal.ship.title': 'Envios e devoluções',
    'modal.ship.lead': 'Envio incluído no preço final — para qualquer parte do mundo. Sem custos escondidos no checkout.',
    'modal.ship.l1': 'Processamento em 2–5 dias úteis após pagamento confirmado.',
    'modal.ship.l2': 'Rastreio enviado por email quando a encomenda sair.',
    'modal.ship.l3': 'Devoluções apenas em estado de venda — etiquetas intactas, sem uso, sem odor, sem lavagens.',
    'modal.ship.l4': 'Defeito de fabrico ou impressão: contacta-nos nas primeiras 48 horas com fotos.',
    'modal.ship.l5': 'Trocas de tamanho só se houver stock no drop — caso contrário, reembolso conforme política Stripe.',
    'modal.ship.l6': 'Alteração de opinião ou tamanho errado fora do prazo de defeito não dá direito a devolução.',
    'modal.ship.note': 'Dúvidas? Abre Contacto no rodapé.',
    'modal.contact.eyebrow': 'Zendy Wear',
    'modal.contact.title': 'Contacto',
    'modal.contact.lead': 'Email direto, Instagram, ou deixa o teu contacto — respondemos o mais rápido possível.',
    'modal.contact.emailBtn': 'zendywear@gmail.com',
    'modal.contact.instagram': 'Instagram',
    'modal.contact.labelEmail': 'Email',
    'modal.contact.labelPhone': 'Telefone',
    'modal.contact.labelDial': 'Indicativo internacional',
    'modal.contact.dialHint': 'País sugerido pelo teu IP — podes mudar. Predefinição: Portugal.',
    'modal.contact.phEmail': 'o.teu.email@algo.pt',
    'modal.contact.phPhone': '912 345 678',
    'modal.contact.submit': 'Pedir contacto',
    'modal.contact.note': 'Ao enviar, abrimos o teu cliente de email com os dados preenchidos.',
    'modal.contact.empty': 'Indica email ou telefone.',
    'modal.contact.ok': 'A abrir o teu email…',
    'modal.contact.mailSubject': 'Zendy Wear — contacto',
    'modal.contact.mailIntro': 'Pedido de contacto desde zendywear.com',
    'modal.checkout.eyebrow': 'Pagamento',
    'modal.checkout.title': 'Finalizar compra',
    'modal.checkout.loading': 'A preparar pagamento seguro…',
    'modal.thanks.eyebrow': 'Drop 001',
    'modal.thanks.title': 'Obrigado pela compra',
    'modal.thanks.lead': 'Pagamento recebido. Vais receber confirmação e rastreio por email assim que a encomenda sair.',
    'modal.thanks.close': 'Continuar a explorar',
    'loader.aria': 'A carregar Zendy Wear',
    'loader.sub': 'Streetwear submersivo',
    'loader.meta': 'Drop 001<span class="dot">●</span>Outono 2026<span class="dot">●</span>Feito em Portugal',
    'loader.status': 'A carregar.',
  },
  en: {
    'meta.title': 'Zendy Wear® — Submersive Streetwear · Drop 001 · Made in Portugal',
    'meta.description':
      'Psychedelic streetwear from Lisbon. Drop 001 — 3 designs, 150 units each, hand screen-printed on heavyweight black cotton. No restocks.',
    'skip': 'Skip to collection',
    'nav.logoAria': 'Zendy Wear home',
    'nav.collection': 'Collection',
    'nav.brand': 'About',
    'nav.cartLabel': 'Cart',
    'nav.cartAria': 'Open cart',
    'nav.langAria': 'Language',
    'lang.pt': 'PT',
    'lang.en': 'EN',
    'hero.eye': 'Fall 2026 · Drop 001 · 3 designs · 150 units each',
    'hero.sub': 'Psychedelic streetwear · Made in Portugal · No restocks',
    'hero.ctaShop': 'Shop Drop 001',
    'hero.ctaStory': 'Our Story',
    'hero.scroll': 'Scroll',
    'mq.1': 'Fall 2026', 'mq.2': 'Drop 001', 'mq.3': '3 Designs',
    'mq.4': 'Made in Portugal', 'mq.5': '150 Units Each', 'mq.6': 'No Restocks',
    'mq.7': 'Submerge Yourself',
    'mq.8': 'Hand screen print', 'mq.9': '260gsm', 'mq.10': 'Made for chaos',
    'mq.12': 'Limited edition', 'mq.13': 'Heavyweight cotton',
    'shop.label': '001 — Drop 001 · First Collection',
    'shop.title': 'The Collection',
    'shop.badge': '150 units',
    'shop.print': 'Psychedelic screen print · Drop 001',
    'view.front': 'Front',
    'view.back': 'Back',
    'view.collar': 'Collar',
    'size.legend': 'Select size',
    'size.label': 'Size',
    'size.guide': 'Guide',
    'size.pick': 'Choose your size',
    'size.selected': 'Selected: {size}',
    'product.add': 'Add to Cart',
    'product.selectSize': 'Select size',
    'price.aria': 'Price {price}',
    'price.ariaPromo': 'Sale price {price}, was {compare}',
    'product.promoBadge': 'Launch offer — {remaining} left at this price',
    'brand.label': '002 — The Brand',
    'brand.h1a': 'Built', 'brand.h1b': 'for the', 'brand.h1c': 'underground',
    'brand.body':
      'Zendy Wear exists in the space between <em>pressure and release</em> — where the city weighs on you and you push back harder.<br><br>Every shirt is screen-printed by hand on heavyweight black cotton, made in Portugal. <em>Limited runs. No restocks.</em> Once it\'s gone, it\'s gone.',
    'brand.s1': 'Designs in Drop 001', 'brand.s2': 'Units per design',
    'brand.s3': 'Made in Portugal', 'brand.s4': 'Restocks — ever',
    'collar.l1': 'Label — Made for chaos', 'collar.l2': 'Water-based ink', 'collar.l3': '260gsm cotton',
    'mani.label': '003 — Manifesto', 'mani.sub': 'Made for chaos',
    'mani.body':
      'We don\'t make clothes for people who want to be seen.<br><br>We make clothes for people who <strong>can\'t be ignored.</strong><br><br>Zendy exists where pressure meets release — where the city tests you and you test it back. Every graphic is a window into a world that doesn\'t follow the rules of this one.<br><br><strong>No boundaries. Only pressure.</strong>',
    'cart.title': 'Your bag', 'cart.closeAria': 'Close cart',
    'cart.empty': 'Bag is empty. The drop awaits.',
    'cart.total': 'Total', 'cart.checkout': 'Checkout',
    'cart.note': 'Secure payment via Stripe',
    'cart.sizeGuide': 'Size guide',
    'cart.shippingLink': 'Shipping & returns',
    'cart.stripeSetup': 'Stripe not configured on server — opening email.',
    'cart.checkoutError': 'Checkout unavailable — try by email.',
    'cart.checkoutSuccess': 'Payment received. Thanks — confirmation email on the way.',
    'cart.size': 'Size', 'cart.remove': 'Remove',
    'cart.removeAria': 'Remove {name}, size {size}, from bag (all units)',
    'cart.qtyMinusAria': 'Decrease quantity of {name}, size {size}',
    'cart.qtyPlusAria': 'Increase quantity of {name}, size {size}',
    'cart.qtyGroupAria': 'Quantity of {name}, size {size}',
    'cart.thumbAlt': '{name} thumbnail',
    'cart.toastPickSize': 'Pick a size first',
    'cart.toastAdded': 'Added',
    'cart.mail.subject': 'Zendy order — Drop 001',
    'cart.mail.greeting': 'Hi Zendy,',
    'cart.mail.intro': 'I\'d like to reserve:',
    'cart.mail.total': 'Total',
    'cart.mail.shipping': 'Shipping details:',
    'cart.mail.name': 'Name:',
    'cart.mail.address': 'Address:',
    'cart.mail.city': 'City / Postcode / Country:',
    'cart.mail.phone': 'Phone:',
    'cart.mail.thanks': 'Thanks.',
    'cart.item': 'item', 'cart.items': 'items',
    'footer.newsletterHint': 'Email alert when the next collection drops.',
    'footer.emailLabel': 'Email address',
    'footer.emailPlaceholder': 'your.email@something.com',
    'footer.join': 'Join',
    'footer.instagram': 'Instagram',
    'footer.sizeGuide': 'Size Guide',
    'footer.shipping': 'Shipping & Returns',
    'footer.contact': 'Contact',
    'footer.copy': '© 2026 Zendy Wear®. Built for the underground.',
    'footer.made': 'Made in Portugal · Printed by hand',
    'newsletter.invalid': 'Enter a valid email address.',
    'newsletter.ok': 'Almost — finish in your mail client.',
    'newsletter.mailSubject': 'Zendy — new collection alert',
    'newsletter.mailIntro': 'Notify me about the next collection:',
    'newsletter.mailNote': '(Newsletter form on zendywear.com)',
    'modal.closeAria': 'Close',
    'modal.size.eyebrow': 'Drop 001',
    'modal.size.title': 'Size guide',
    'modal.size.lead': 'Oversized unisex fit. Garment measurements in cm. Between sizes? Size up.',
    'modal.size.tabEu': 'Europe (EU)',
    'modal.size.tabUk': 'United Kingdom (UK)',
    'modal.size.thSize': 'Size',
    'modal.size.thUk': 'UK',
    'modal.size.thChest': 'Chest',
    'modal.size.thLength': 'Length',
    'modal.size.thShoulder': 'Shoulder',
    'modal.size.note': '±2 cm tolerance (hand screen print). 260gsm heavyweight cotton.',
    'modal.ship.eyebrow': 'Policy',
    'modal.ship.title': 'Shipping & returns',
    'modal.ship.lead': 'Shipping is included in the final price — worldwide. No hidden fees at checkout.',
    'modal.ship.l1': 'Processing within 2–5 business days after payment clears.',
    'modal.ship.l2': 'Tracking sent by email once your order ships.',
    'modal.ship.l3': 'Returns only in resale condition — tags on, unworn, unwashed, no odour.',
    'modal.ship.l4': 'Manufacturing or print defect: contact us within 48 hours with photos.',
    'modal.ship.l5': 'Size swaps only if stock remains on the drop — otherwise refund per Stripe policy.',
    'modal.ship.l6': 'Change of mind or wrong size outside the defect window is not eligible for return.',
    'modal.ship.note': 'Questions? Open Contact in the footer.',
    'modal.contact.eyebrow': 'Zendy Wear',
    'modal.contact.title': 'Contact',
    'modal.contact.lead': 'Email us, find us on Instagram, or leave your details — we reply as soon as we can.',
    'modal.contact.emailBtn': 'zendywear@gmail.com',
    'modal.contact.instagram': 'Instagram',
    'modal.contact.labelEmail': 'Email',
    'modal.contact.labelPhone': 'Phone',
    'modal.contact.labelDial': 'Country code',
    'modal.contact.dialHint': 'Country suggested from your IP — you can change it. Default: Portugal.',
    'modal.contact.phEmail': 'your.email@something.com',
    'modal.contact.phPhone': '712 345 6789',
    'modal.contact.submit': 'Request contact',
    'modal.contact.note': 'Submit opens your mail app with the details filled in.',
    'modal.contact.empty': 'Add an email or phone number.',
    'modal.contact.ok': 'Opening your mail app…',
    'modal.contact.mailSubject': 'Zendy Wear — contact',
    'modal.contact.mailIntro': 'Contact request from zendywear.com',
    'modal.checkout.eyebrow': 'Payment',
    'modal.checkout.title': 'Complete purchase',
    'modal.checkout.loading': 'Preparing secure checkout…',
    'modal.thanks.eyebrow': 'Drop 001',
    'modal.thanks.title': 'Thank you for your order',
    'modal.thanks.lead': 'Payment received. You will get confirmation and tracking by email once your order ships.',
    'modal.thanks.close': 'Keep exploring',
    'loader.aria': 'Loading Zendy Wear',
    'loader.sub': 'Submersive Streetwear',
    'loader.meta': 'Drop 001<span class="dot">●</span>Fall 2026<span class="dot">●</span>Made in Portugal',
    'loader.status': 'Loading.',
  },
};

let currentLang = 'pt';
const listeners = new Set();

export function getLang() { return currentLang; }

export function t(key) {
  return STRINGS[currentLang]?.[key] ?? STRINGS.en[key] ?? key;
}

function detectLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'pt' || saved === 'en') return saved;
  const nav = (navigator.language || '').toLowerCase();
  return nav.startsWith('pt') ? 'pt' : 'en';
}

function applyMeta() {
  document.title = t('meta.title');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('meta.description'));
  document.documentElement.lang = currentLang;
}

function applyDom() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });
}

function updateLangButtons() {
  document.querySelectorAll('[data-lang-set]').forEach((btn) => {
    const on = btn.getAttribute('data-lang-set') === currentLang;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

export function setLang(lang) {
  if (lang !== 'pt' && lang !== 'en') return;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode */ }
  applyMeta();
  applyDom();
  updateLangButtons();
  listeners.forEach((fn) => { try { fn(currentLang); } catch (e) { console.warn('[i18n]', e); } });
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initI18n() {
  currentLang = detectLang();
  applyMeta();
  applyDom();
  updateLangButtons();

  document.querySelectorAll('[data-lang-set]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-set')));
  });
}
