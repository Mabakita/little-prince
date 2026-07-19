function getYouTubeEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');
    const embedBase = 'https://www.youtube.com/embed/';

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace(/^\//, '');
      return videoId ? embedBase + videoId : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsedUrl.pathname === '/watch') {
        const videoId = parsedUrl.searchParams.get('v');
        return videoId ? embedBase + videoId : null;
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.href;
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

function createVideoSection(videoUrl, activityTitle) {
  const mediaBox = document.createElement('div');
  mediaBox.className = 'activity-card__file';
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  if (embedUrl) {
    const videoFrame = document.createElement('iframe');
    videoFrame.className = 'activity-card__video';
    videoFrame.src = embedUrl;
    videoFrame.title = 'סרטון לפעילות: ' + activityTitle;
    videoFrame.loading = 'lazy';
    videoFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    videoFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    videoFrame.allowFullscreen = true;
    mediaBox.appendChild(videoFrame);
  }

  return mediaBox;
}

function createImageElement(imageName, activityTitle, isSmall = false) {
  const image = document.createElement('img');
  image.className = 'activity-card__bottom-image';
  if (isSmall) {
    image.classList.add('activity-card__bottom-image--small');
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
  downloadsTitle.textContent = 'דפי פעילות להורדה';
  downloadsSection.appendChild(downloadsTitle);

  const downloadsGrid = document.createElement('div');
  downloadsGrid.className = 'activity-card__downloads-grid';

  fileNames.forEach((fileName) => {
    const fileUrl = '../downloads/worksheets/' + fileName;
    const thumbBase = fileName.replace(/\.[^.]+$/, '');
    const isPdfDownload = /\.pdf$/i.test(fileName);

    const item = document.createElement('a');
    item.className = 'activity-card__download-item';
    item.href = fileUrl;
    item.setAttribute('download', '');

    const createImagePreviewThumb = () => {
      const thumb = document.createElement('img');
      thumb.className = 'activity-card__download-item-thumb';
      thumb.src = '../downloads/worksheets/images/' + thumbBase + '.png';
      thumb.alt = 'תצוגה מקדימה של הקובץ: ' + fileName;
      thumb.loading = 'lazy';
      thumb.onerror = () => {
        if (!thumb.dataset.fallbackStep) {
          thumb.dataset.fallbackStep = 'worksheet-svg';
          thumb.src = '../downloads/worksheets/images/' + thumbBase + '.svg';
          return;
        }

        if (thumb.dataset.fallbackStep === 'worksheet-svg') {
          thumb.dataset.fallbackStep = 'legacy-png';
          thumb.src = '../images/downloads-thumbs/' + thumbBase + '.png';
          return;
        }

        if (thumb.dataset.fallbackStep === 'legacy-png') {
          thumb.dataset.fallbackStep = 'legacy-svg';
          thumb.src = '../images/downloads-thumbs/' + thumbBase + '.svg';
          return;
        }

        thumb.remove();
      };

      return thumb;
    };

    if (isPdfDownload) {
      const pdfPreviewWrap = document.createElement('div');
      pdfPreviewWrap.className = 'activity-card__download-item-thumb activity-card__download-item-pdf-preview';

      const pdfCanvas = document.createElement('canvas');
      pdfCanvas.className = 'activity-card__download-item-canvas';
      pdfCanvas.setAttribute('aria-label', 'תצוגה מקדימה לעמוד הראשון: ' + fileName);
      pdfPreviewWrap.appendChild(pdfCanvas);
      item.appendChild(pdfPreviewWrap);

      renderPdfFirstPageToCanvas(pdfCanvas, fileUrl).then((rendered) => {
        if (!rendered) {
          pdfPreviewWrap.replaceWith(createImagePreviewThumb());
        }
      });
    } else {
      item.appendChild(createImagePreviewThumb());
    }

    const fileLabel = document.createElement('span');
    fileLabel.className = 'activity-card__download-item-name';
    fileLabel.textContent = 'להורדה';
    item.appendChild(fileLabel);

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

  if (activity.description) {
    activity.description.forEach((paragraph) => {
      const didYouKnowMatch = paragraph.match(/^הידעת\?\s*(.+)$/);
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

      const videoMatch = paragraph.match(/^סרטון:\s*(.+)$/);
      if (videoMatch) {
        fallbackVideo = videoMatch[1].trim();
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

      const downloadMatch = paragraph.match(/^דפי פעילות להורדה:\s*(.*)$/);
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

      contentBlocks.forEach((block) => {
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
          const paragraphText = (block.text || '').trim();
          if (/^(🧠\s*)?הידעת(?:ם)?\??$/.test(paragraphText)) {
            pendingDidYouKnow = true;
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
          card.appendChild(createVideoSection(block.video, activity.title));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'image' && block.image) {
          card.appendChild(createImageElement(block.image, activity.title, Boolean(block.small)));
          pendingDidYouKnow = false;
          return;
        }

        if (blockType === 'downloads' && Array.isArray(block.files) && block.files.length > 0) {
          card.appendChild(createDownloadsSection(block.files));
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
