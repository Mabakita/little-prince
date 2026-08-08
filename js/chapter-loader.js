function getYouTubeEmbedUrl(url) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}

function getYouTubeVideoId(url) {
  try {
    const normalizedUrl = String(url || '')
      .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
      .trim();
    const parsedUrl = new URL(normalizedUrl);
    const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace(/^\//, '');
      return videoId || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsedUrl.pathname === '/watch') {
        return parsedUrl.searchParams.get('v');
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.pathname.split('/')[2] || null;
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        return parsedUrl.pathname.split('/')[2] || null;
      }
    }
  } catch (error) {
    console.warn('קישור וידאו לא תקין', url, error);
  }

  return null;
}

const PDFJS_LIB_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const PDF_PREVIEW_LONG_SIDE = 181;
let pdfJsLoadPromise = null;

function loadPdfJs() {
  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfJsLoadPromise) {
    return pdfJsLoadPromise;
  }

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_LIB_URL;
    script.async = true;
    script.onload = () => resolve(window.pdfjsLib);
    script.onerror = () => reject(new Error('טעינת pdf.js נכשלה'));
    document.head.appendChild(script);
  });

  return pdfJsLoadPromise;
}

async function renderPdfFirstPageToCanvas(canvas, pdfUrl) {
  try {
    const pdfjsLib = await loadPdfJs();
    if (!pdfjsLib) return false;

    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

    const absoluteUrl = new URL(pdfUrl, window.location.href).href;
    const pdfDoc = await pdfjsLib.getDocument({
      url: absoluteUrl,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    }).promise;

    const page = await pdfDoc.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const longSide = Math.max(baseViewport.width, baseViewport.height);
    const scale = PDF_PREVIEW_LONG_SIDE / longSide;
    const viewport = page.getViewport({ scale });

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);

    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    return true;
  } catch (error) {
    console.warn('נכשלה הצגת עמוד ראשון ל-PDF', pdfUrl, error);
    return false;
  }
}

function createParagraphElement(block) {
  const paragraph = document.createElement('p');
  if (block.html) {
    paragraph.innerHTML = block.html;
  } else {
    paragraph.textContent = block.text || '';
  }
  return paragraph;
}

function createDidYouKnowElement(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'did-you-know';

  const icon = document.createElement('img');
  icon.className = 'did-you-know__icon';
  icon.src = '../images/did-you-know.png?v=20260717-2';
  icon.alt = 'הידעת?';
  icon.loading = 'lazy';
  wrapper.appendChild(icon);

  const textEl = document.createElement('p');
  textEl.className = 'did-you-know__text';
  const prefix = document.createElement('span');
  prefix.className = 'did-you-know__prefix';
  prefix.textContent = 'הידעת? ';
  textEl.appendChild(prefix);
  textEl.append(document.createTextNode(text || ''));
  wrapper.appendChild(textEl);

  return wrapper;
}

function createRichHtmlElement(html) {
  const wrapper = document.createElement('div');
  wrapper.className = 'activity-card__rich';
  wrapper.innerHTML = html;
  return wrapper;
}

function createActivitySeparatorElement() {
  const separator = document.createElement('div');
  separator.className = 'activity-card__separator';
  separator.setAttribute('aria-hidden', 'true');
  return separator;
}

function createFileSection(fileName) {
  const mediaBox = document.createElement('div');
  mediaBox.className = 'activity-card__file';

  const fileUrl = '../downloads/' + fileName;
  const isPdf = /\.pdf$/i.test(fileName);

  if (isPdf) {
    const viewer = document.createElement('div');
    viewer.className = 'activity-card__pdf-viewer';

    const embed = document.createElement('embed');
    embed.className = 'activity-card__pdf-frame';
    embed.src = new URL(fileUrl, window.location.href).href;
    embed.type = 'application/pdf';
    embed.title = 'תצוגת PDF: ' + fileName;
    viewer.appendChild(embed);
    mediaBox.appendChild(viewer);

    const link = document.createElement('a');
    link.className = 'activity-card__download';
    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'פתח בקובץ מלא';
    mediaBox.appendChild(link);
    return mediaBox;
  }

  const thumbBase = fileName.replace(/\.[^.]+$/, '');
  const thumb = document.createElement('img');
  thumb.className = 'activity-card__file-thumb';
  thumb.src = '../images/downloads-thumbs/' + thumbBase + '.png';
  thumb.alt = 'תצוגה מקדימה של הקובץ: ' + fileName;
  thumb.loading = 'lazy';
  thumb.onerror = () => thumb.remove();
  mediaBox.appendChild(thumb);

  const link = document.createElement('a');
  link.className = 'activity-card__download';
  link.href = fileUrl;
  link.setAttribute('download', '');
  link.textContent = 'הורדת הקובץ';
  mediaBox.appendChild(link);

  return mediaBox;
}

function createVideoSection(videoUrl, activityTitle, introText = '') {
  const mediaBox = document.createElement('div');
  mediaBox.className = 'activity-card__file';
  const normalizedVideoUrl = String(videoUrl || '')
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .trim();
  const videoId = getYouTubeVideoId(normalizedVideoUrl);
  const embedUrl = getYouTubeEmbedUrl(normalizedVideoUrl);
  const hasHttpUrl = /^https?:\/\//i.test(normalizedVideoUrl);

  const watchLink = document.createElement('a');
  watchLink.className = 'activity-card__download activity-card__video-link';
  watchLink.href = hasHttpUrl
    ? normalizedVideoUrl
    : 'https://www.youtube.com/results?search_query=' + encodeURIComponent(normalizedVideoUrl || activityTitle);
  watchLink.target = '_blank';
  watchLink.rel = 'noopener noreferrer';
  watchLink.textContent = 'צפייה בסרטון ביוטיוב';

  if (introText && introText.trim()) {
    const intro = document.createElement('p');
    intro.className = 'activity-card__video-intro';
    intro.textContent = introText.trim();
    mediaBox.appendChild(intro);
  }

  // In local file preview (file://), YouTube often blocks iframe playback (Error 153).
  // Show a clickable thumbnail so preview remains useful.
  if (videoId && window.location.protocol === 'file:') {
    const thumbLink = document.createElement('a');
    thumbLink.href = watchLink.href;
    thumbLink.target = '_blank';
    thumbLink.rel = 'noopener noreferrer';
    thumbLink.className = 'activity-card__video-preview-link';

    const thumb = document.createElement('img');
    thumb.className = 'activity-card__video-preview-image';
    thumb.loading = 'lazy';
    thumb.alt = 'תצוגה מקדימה של הסרטון: ' + activityTitle;
    thumb.src = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';

    thumbLink.appendChild(thumb);
    mediaBox.appendChild(thumbLink);
    mediaBox.appendChild(watchLink);
    return mediaBox;
  }

  if (embedUrl) {
    const videoFrame = document.createElement('iframe');
    videoFrame.className = 'activity-card__video';
    videoFrame.src = embedUrl;
    videoFrame.title = 'סרטון לפעילות: ' + activityTitle;
    videoFrame.loading = 'lazy';
    videoFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    videoFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    videoFrame.allowFullscreen = true;
    videoFrame.loading = 'lazy';
    mediaBox.appendChild(videoFrame);
    mediaBox.appendChild(watchLink);
    return mediaBox;
  }

  if (normalizedVideoUrl) {
    mediaBox.appendChild(watchLink);
  }

  return mediaBox;
}

function createImageElement(imageName, activityTitle, isSmall = false, widthPercent = null) {
  const image = document.createElement('img');
  image.className = 'activity-card__bottom-image';
  if (isSmall) {
    image.classList.add('activity-card__bottom-image--small');
  }

  if (typeof widthPercent === 'number' && widthPercent > 0 && widthPercent <= 100) {
    image.style.width = widthPercent + '%';
  }

  image.loading = 'lazy';
  image.alt = 'תמונה לפעילות: ' + activityTitle;

  if (/^https?:\/\//i.test(imageName)) {
    image.src = imageName;
  } else if (imageName.startsWith('images/')) {
    image.src = '../' + imageName;
  } else {
    image.src = '../images/' + imageName;
  }

  image.classList.add('activity-card__bottom-image--clickable');
  image.setAttribute('title', 'לחצו לפתיחת התמונה בגודל מקורי');
  image.addEventListener('click', () => {
    window.open(image.src, '_blank', 'noopener,noreferrer');
  });

  return image;
}

function createDownloadsSection(fileNames) {
  const downloadsSection = document.createElement('div');
  downloadsSection.className = 'activity-card__downloads';

  const downloadsTitle = document.createElement('h4');
  downloadsTitle.className = 'activity-card__downloads-title';
  downloadsTitle.textContent = 'דפי פעילות';
  downloadsSection.appendChild(downloadsTitle);

  const downloadsGrid = document.createElement('div');
  downloadsGrid.className = 'activity-card__downloads-grid';

  fileNames.forEach((fileName) => {
    const fileUrl = '../downloads/worksheets/' + fileName;
    const thumbBase = fileName.replace(/\.[^.]+$/, '');
    const isPdfDownload = /\.pdf$/i.test(fileName);

    const item = document.createElement('div');
    item.className = 'activity-card__download-item';

    const createImagePreviewThumb = () => {
      const thumb = document.createElement('img');
      thumb.className = 'activity-card__download-item-thumb';
      thumb.src = '../downloads/worksheets/images/' + thumbBase + '.png?v=20260806-1';
      thumb.alt = 'תצוגה מקדימה של הקובץ: ' + fileName;
      thumb.loading = 'lazy';
      thumb.onerror = () => {
        if (!thumb.dataset.fallbackStep) {
          thumb.dataset.fallbackStep = 'worksheet-svg';
          thumb.src = '../downloads/worksheets/images/' + thumbBase + '.svg?v=20260806-1';
          return;
        }

        if (thumb.dataset.fallbackStep === 'worksheet-svg') {
          thumb.dataset.fallbackStep = 'legacy-png';
          thumb.src = '../images/downloads-thumbs/' + thumbBase + '.png?v=20260806-1';
          return;
        }

        if (thumb.dataset.fallbackStep === 'legacy-png') {
          thumb.dataset.fallbackStep = 'legacy-svg';
          thumb.src = '../images/downloads-thumbs/' + thumbBase + '.svg?v=20260806-1';
          return;
        }

        thumb.onerror = null;

        if (isPdfDownload) {
          const canvas = document.createElement('canvas');
          canvas.className = 'activity-card__download-item-thumb';
          canvas.setAttribute('aria-label', 'תצוגה מקדימה של הקובץ: ' + fileName);

          renderPdfFirstPageToCanvas(canvas, fileUrl).then((rendered) => {
            if (rendered) {
              thumb.replaceWith(canvas);
              return;
            }

            // If runtime PDF rendering fails, keep a visible placeholder.
            const safeFileName = String(fileName).replace(/[&<>"']/g, (ch) => ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;'
            }[ch]));
            const placeholderSvg = `
              <svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360">
                <rect width="360" height="360" rx="16" fill="#f7efe2"/>
                <rect x="18" y="18" width="324" height="324" rx="12" fill="#fffaf1" stroke="#d9c6a7"/>
                <path d="M134 96h68l52 52v116a12 12 0 0 1-12 12H134a12 12 0 0 1-12-12V108a12 12 0 0 1 12-12z" fill="#ffffff" stroke="#cdb48d"/>
                <path d="M202 96v40a12 12 0 0 0 12 12h40" fill="none" stroke="#cdb48d"/>
                <text x="180" y="208" text-anchor="middle" font-size="38" font-family="Arial" fill="#8f6f45" font-weight="700">PDF</text>
                <text x="180" y="248" text-anchor="middle" font-size="16" font-family="Arial" fill="#6e5434">תצוגה מקדימה</text>
                <text x="180" y="272" text-anchor="middle" font-size="14" font-family="Arial" fill="#6e5434">${safeFileName}</text>
              </svg>
            `;
            thumb.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(placeholderSvg);
          });

          return;
        }

        // Final fallback for non-PDF files.
        thumb.remove();
      };

      return thumb;
    };

    const previewLink = document.createElement('a');
    previewLink.className = 'activity-card__download-item-preview-link';
    previewLink.href = fileUrl;
    previewLink.target = '_blank';
    previewLink.rel = 'noopener noreferrer';
    previewLink.setAttribute('aria-label', 'הורדת הקובץ: ' + fileName);
    previewLink.appendChild(createImagePreviewThumb());
    item.appendChild(previewLink);

    const downloadButton = document.createElement('a');
    downloadButton.className = 'activity-card__download-item-button';
    downloadButton.href = fileUrl;
    downloadButton.target = '_blank';
    downloadButton.rel = 'noopener noreferrer';
    downloadButton.setAttribute('aria-label', 'הורדת הקובץ: ' + fileName);
    downloadButton.textContent = 'הורדה';
    item.appendChild(downloadButton);

    downloadsGrid.appendChild(item);
  });

  downloadsSection.appendChild(downloadsGrid);
  return downloadsSection;
}

function parseLegacyActivityBlocks(activity) {
  const blocks = [];
  let fallbackFile = activity.file || null;
  let fallbackVideo = activity.video || null;
  let fallbackImage = activity.image || null;
  let pendingVideoMarker = false;

  const normalizeDocxLine = (value) => String(value || '')
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim();

  const looksLikeVideoUrl = (value) => /^(https?:\/\/|www\.)\S+/i.test(value);

  if (activity.description) {
    activity.description.forEach((rawParagraph) => {
      const paragraph = normalizeDocxLine(rawParagraph);

      if (pendingVideoMarker && paragraph) {
        if (looksLikeVideoUrl(paragraph)) {
          const videoValue = paragraph.startsWith('www.') ? `https://${paragraph}` : paragraph;
          fallbackVideo = videoValue;
          blocks.push({ type: 'video', video: videoValue });
          pendingVideoMarker = false;
          return;
        }

        pendingVideoMarker = false;
      }

      const didYouKnowMatch = paragraph.match(/^הידעת[\?:]\s*(.+)$/);
      if (didYouKnowMatch) {
        blocks.push({ type: 'didyouknow', text: didYouKnowMatch[1].trim() });
        return;
      }

      const fileMatch = paragraph.match(/^קובץ:\s*(.+)$/);
      if (fileMatch) {
        fallbackFile = fileMatch[1].trim();
        blocks.push({ type: 'file', file: fallbackFile });
        return;
      }

      const videoMarkerOnlyMatch = paragraph.match(/^סרטון:\s*$/);
      if (videoMarkerOnlyMatch) {
        pendingVideoMarker = true;
        return;
      }

      const videoMatch = paragraph.match(/^סרטון:\s*(.+)$/);
      if (videoMatch) {
        const rawVideoValue = normalizeDocxLine(videoMatch[1]);
        const videoValue = rawVideoValue.startsWith('www.') ? `https://${rawVideoValue}` : rawVideoValue;
        fallbackVideo = videoValue;
        blocks.push({ type: 'video', video: fallbackVideo });
        return;
      }

      const imageMatch = paragraph.match(/^תמונה:\s*(.+)$/);
      if (imageMatch) {
        const imageValue = imageMatch[1].trim();
        const isSmall = /\(קטן\)\s*$/.test(imageValue);
        fallbackImage = imageValue.replace(/\s*\(קטן\)\s*$/, '').trim();
        blocks.push({ type: 'image', image: fallbackImage, small: isSmall });
        return;
      }

      const downloadMatch = paragraph.match(/^ד[פף](?:י)? פעילות להורדה:\s*(.*)$/);
      if (downloadMatch) {
        const files = downloadMatch[1]
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        if (files.length > 0) {
          blocks.push({ type: 'downloads', files });
        }
        return;
      }

      if (/^\s*_{3,}\s*$/.test(paragraph)) {
        blocks.push({ type: 'separator' });
        return;
      }

      blocks.push({ type: 'paragraph', text: paragraph });
    });
  }

  const hasType = (type) => blocks.some((block) => block.type === type);

  if (fallbackFile && !hasType('file')) {
    blocks.push({ type: 'file', file: fallbackFile });
  }

  if (fallbackVideo && !hasType('video')) {
    blocks.push({ type: 'video', video: fallbackVideo });
  }

  if (fallbackImage && !hasType('image')) {
    blocks.push({ type: 'image', image: fallbackImage });
  }

  return blocks;
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-chapter]');
  if (!root) return;

  const chapterKey = root.getAttribute('data-chapter');
  const chapter = typeof CHAPTERS_DATA !== 'undefined' ? CHAPTERS_DATA[chapterKey] : null;

  if (!chapter) {
    console.error('לא נמצאו נתונים עבור פרק', chapterKey);
    return;
  }

  const titleEl = document.getElementById('chapter-title');
  const chapterNumber = String(chapter.number);
  const chapterLabel = chapterNumber.includes('-') ? 'פרקים' : 'פרק';

  if (titleEl) {
    titleEl.textContent = chapterLabel + ' ' + chapterNumber + ': ' + chapter.name;
  }

  // Keep the browser-tab title synced with the rendered chapter heading.
  document.title = chapterLabel + ' ' + chapterNumber + ' - ' + chapter.name + ' | הנסיך הקטן';

  let summaryEl = document.getElementById('chapter-summary');
  if (!summaryEl) {
    const summaryWrap = document.querySelector('.chapter-banner__summary-text');
    if (summaryWrap) {
      summaryEl = document.createElement('p');
      summaryEl.id = 'chapter-summary';
      summaryWrap.appendChild(summaryEl);
    }
  }

  if (summaryEl) {
    summaryEl.textContent = chapter.summary;
  }

  const activitiesEl = document.getElementById('chapter-activities');
  if (activitiesEl) {
    activitiesEl.innerHTML = '';

    if (!chapter.activities || chapter.activities.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.className = 'activity-card__empty';
      emptyState.textContent = 'לא קיימות פעילויות רשומות לפרק זה בקובץ activities.docx.';
      activitiesEl.appendChild(emptyState);
      return;
    }

    chapter.activities.forEach((activity, index) => {
      const colorClass = ['activity-card--brown', 'activity-card--blue', 'activity-card--pink'][index % 3];
      const card = document.createElement('div');
      card.className = `activity-card ${colorClass}`;

      const h3 = document.createElement('h3');
      h3.textContent = 'פעילות ' + (index + 1) + ': ' + activity.title;
      card.appendChild(h3);

      const contentBlocks = Array.isArray(activity.content) && activity.content.length > 0
        ? activity.content
        : parseLegacyActivityBlocks(activity);

      let pendingDidYouKnow = false;
      const normalizeMarkerText = (value) => String(value || '')
        .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
        .replace(/\u00A0/g, ' ')
        .trim();

      contentBlocks.forEach((block, blockIndex) => {
        const blockType = typeof block.type === 'string' ? block.type.trim().toLowerCase() : '';

        if (blockType === 'didyouknow' && block.text) {
          card.appendChild(createDidYouKnowElement(block.text));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'html' && block.html) {
          card.appendChild(createRichHtmlElement(block.html));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'paragraph') {
          const paragraphText = normalizeMarkerText(block.text || '');
          if (/^(🧠\s*)?הידעת(?:ם)?\??$/.test(paragraphText)) {
            pendingDidYouKnow = true;
            return;
          }

          const nextBlock = contentBlocks[blockIndex + 1] || null;
          const nextBlockType = nextBlock && typeof nextBlock.type === 'string'
            ? nextBlock.type.trim().toLowerCase()
            : '';

          if (nextBlockType === 'video' && paragraphText) {
            if (nextBlock.introText && nextBlock.introText.trim()) {
              nextBlock.introText = nextBlock.introText.trim() + ' ' + paragraphText;
            } else {
              nextBlock.introText = paragraphText;
            }
            return;
          }

          if (pendingDidYouKnow && paragraphText) {
            card.appendChild(createDidYouKnowElement(paragraphText));
            pendingDidYouKnow = false;
            return;
          }

          card.appendChild(createParagraphElement(block));
          return;
        }

        if (blockType === 'file' && block.file) {
          card.appendChild(createFileSection(block.file));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'video' && block.video) {
          card.appendChild(createVideoSection(block.video, activity.title, block.introText || ''));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'image' && block.image) {
          const widthPercent = typeof block.widthPercent === 'number' ? block.widthPercent : null;
          card.appendChild(createImageElement(block.image, activity.title, Boolean(block.small), widthPercent));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'downloads' && Array.isArray(block.files) && block.files.length > 0) {
          card.appendChild(createDownloadsSection(block.files));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'separator') {
          card.appendChild(createActivitySeparatorElement());
          pendingDidYouKnow = false;
          return;
        }

        // Fallback: if a block carries HTML but the type is unexpected, render it anyway.
        if (block && block.html) {
          card.appendChild(createRichHtmlElement(block.html));
          pendingDidYouKnow = false;
        }
      });

      activitiesEl.appendChild(card);
    });
  }
});
