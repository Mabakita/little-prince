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
  if (titleEl) {
    titleEl.textContent = 'פרק ' + chapter.number + ': ' + chapter.name;
  }

  // Keep the browser-tab title synced with the rendered chapter heading.
  document.title = 'פרק ' + chapter.number + ' - ' + chapter.name + ' | הנסיך הקטן';

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
      h3.textContent = activity.title;
      card.appendChild(h3);

      activity.description.forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        card.appendChild(p);
      });

      const mediaBox = document.createElement('div');
      mediaBox.className = 'activity-card__file';

      if (activity.file) {
        const fileUrl = '../downloads/' + activity.file;
        const isPdf = /\.pdf$/i.test(activity.file);

        if (isPdf) {
          const viewer = document.createElement('div');
          viewer.className = 'activity-card__pdf-viewer';

          const embed = document.createElement('embed');
          embed.className = 'activity-card__pdf-frame';
          embed.src = new URL(fileUrl, window.location.href).href;
          embed.type = 'application/pdf';
          embed.title = 'תצוגת PDF: ' + activity.file;
          viewer.appendChild(embed);
          mediaBox.appendChild(viewer);

          const link = document.createElement('a');
          link.className = 'activity-card__download';
          link.href = fileUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = 'פתח בקובץ מלא';
          mediaBox.appendChild(link);
        } else {
          const thumbBase = activity.file.replace(/\.[^.]+$/, '');
          const thumb = document.createElement('img');
          thumb.className = 'activity-card__file-thumb';
          thumb.src = '../images/downloads-thumbs/' + thumbBase + '.png';
          thumb.alt = 'תצוגה מקדימה של הקובץ: ' + activity.file;
          thumb.loading = 'lazy';
          thumb.onerror = () => thumb.remove();
          mediaBox.appendChild(thumb);

          const link = document.createElement('a');
          link.className = 'activity-card__download';
          link.href = fileUrl;
          link.setAttribute('download', '');
          link.textContent = 'הורדת הקובץ';
          mediaBox.appendChild(link);
        }
      }

      if (activity.video) {
        const embedUrl = getYouTubeEmbedUrl(activity.video);

        if (embedUrl) {
          const videoFrame = document.createElement('iframe');
          videoFrame.className = 'activity-card__video';
          videoFrame.src = embedUrl;
          videoFrame.title = 'סרטון לפעילות: ' + activity.title;
          videoFrame.loading = 'lazy';
          videoFrame.referrerPolicy = 'strict-origin-when-cross-origin';
          videoFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          videoFrame.allowFullscreen = true;
          mediaBox.appendChild(videoFrame);
        }

        const videoLink = document.createElement('a');
        videoLink.className = 'activity-card__download activity-card__video-link';
        videoLink.href = activity.video;
        videoLink.target = '_blank';
        videoLink.rel = 'noopener noreferrer';
        videoLink.textContent = embedUrl ? 'פתח ביוטיוב' : 'פתח סרטון';
        mediaBox.appendChild(videoLink);
      }

      if (activity.file || activity.video) {
        card.appendChild(mediaBox);
      }

      activitiesEl.appendChild(card);
    });
  }
});
