// Bunny.net Storage API Utility
// Uses credentials from .env file

const BUNNY_STORAGE_ZONE = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_ENDPOINT = import.meta.env.VITE_BUNNY_STORAGE_ENDPOINT;
const BUNNY_STORAGE_URL = import.meta.env.VITE_BUNNY_STORAGE_URL;
const BUNNY_ACCESS_KEY = import.meta.env.VITE_BUNNY_ACCESS_KEY;
const BUNNY_CDN_URL = import.meta.env.VITE_BUNNY_CDN_URL;
const BUNNY_VIDEO_LIBRARY_ID = import.meta.env.VITE_BUNNY_VIDEO_LIBRARY_ID;

const getStorageBase = () => {
  const endpoint = BUNNY_STORAGE_ENDPOINT?.replace(/\/+$/, '');
  const storageUrl = BUNNY_STORAGE_URL?.replace(/\/+$/, '');

  if (endpoint && BUNNY_STORAGE_ZONE) {
    return `${endpoint}/${BUNNY_STORAGE_ZONE}`;
  }
  if (storageUrl) {
    return storageUrl;
  }
  throw new Error('Bunny storage configuration is missing. Set VITE_BUNNY_STORAGE_ENDPOINT and VITE_BUNNY_STORAGE_ZONE, or VITE_BUNNY_STORAGE_URL.');
};

const getCdnBase = () => {
  if (BUNNY_CDN_URL) return BUNNY_CDN_URL.replace(/\/+$/, '');
  const storageBase = getStorageBase();
  return storageBase;
};

const resolveBunnyUrl = (rawUrl) => {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const cleanPath = trimmed.replace(/^\/+/, '');
  return `${getCdnBase()}/${cleanPath}`;
};

/**
 * Upload a file to Bunny.net Storage Zone
 * @param {File} file - The file object to upload
 * @param {string} folder - Optional folder path (e.g. 'videos', 'pdfs')
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<{cdnUrl: string, fileName: string}>}
 */
export const uploadToBunny = (file, folder = 'videos', onProgress = null) => {
  // Use server-side proxy to keep AccessKey secret and avoid CORS/auth issues
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file, file.name);
    if (folder) form.append('folder', folder);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.open('POST', '/api/storage-upload');
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          const cdnUrl = json.cdnUrl || (json.filePath ? `${getCdnBase()}/${json.filePath.replace(/^\/+/, '')}` : null);
          resolve({ cdnUrl, fileName: json.fileName || file.name });
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload to proxy'));
    xhr.send(form);
  });
};

/**
 * Delete a file from Bunny.net Storage Zone
 * Routes through the server proxy to avoid CORS/auth issues from the browser.
 * @param {string} filePath - Path of the file in storage (e.g. 'videos/12345_myvideo.mp4')
 */
export const deleteFromBunny = async (filePath) => {
  const res = await fetch('/api/storage-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Delete failed with status ${res.status}: ${text}`);
  }
  return true;
};

/**
 * Get public CDN URL for a stored file
 * @param {string} filePath - Path of the file in storage
 * @returns {string} Full CDN URL
 */
export const getBunnyCdnUrl = (filePath) => {
  const cdnBase = getCdnBase();
  const cleanPath = filePath?.replace(/^\/+/, '');
  return `${cdnBase}/${cleanPath}`;
};

export const normalizeBunnyUrl = (rawUrl) => {
  return resolveBunnyUrl(rawUrl);
};

export const uploadToBunnyStream = async (file, title = '', libraryId = BUNNY_VIDEO_LIBRARY_ID, onProgress = null) => {
  if (!libraryId) throw new Error('Bunny video library ID is not configured');

  // Route uploads through our server proxy at /api/upload to keep API keys secret.
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('title', title || file.name);
    if (libraryId) form.append('libraryId', libraryId);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}');
          const guid = json.guid;
          const embed = json.embed || `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`;
          resolve({ ...json, videoId: guid, embedUrl: embed, playbackUrl: `https://iframe.mediadelivery.net/play/${libraryId}/${guid}`, url: embed });
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Server upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during server upload'));
    xhr.send(form);
  });
};

/**
 * Verify whether a file is reachable on the CDN/storage by sending a HEAD request.
 * @param {string} filePathOrUrl - Full CDN url or storage path
 * @returns {Promise<boolean>} true if resource exists (status 200-299)
 */
export const checkCdnFile = async (filePathOrUrl) => {
  try {
    const url = /^https?:\/\//i.test(filePathOrUrl) ? filePathOrUrl : getBunnyCdnUrl(filePathOrUrl);
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    // If HEAD is blocked by CORS, fallback to GET without reading body
    try {
      const url = /^https?:\/\//i.test(filePathOrUrl) ? filePathOrUrl : getBunnyCdnUrl(filePathOrUrl);
      const res = await fetch(url, { method: 'GET' });
      return res.ok;
    } catch (e) {
      console.warn('Could not verify CDN file:', e);
      return false;
    }
  }
};

/**
 * Resolve a Bunny Stream video GUID or raw input into a playable embed/playback URL.
 * If input is already an http(s) URL, returns it unchanged. If input looks like a GUID,
 * builds an embed URL using the provided libraryId (or the configured one).
 * If input is a storage path, returns the CDN URL.
 * @param {string} raw - GUID, URL or storage path
 * @param {string} [libraryId] - optional library id to override env
 * @returns {string} resolved URL
 */
export const resolveBunnyVideoUrl = (raw, libraryId = BUNNY_VIDEO_LIBRARY_ID) => {
  if (!raw) return '';
  const trimmed = raw.trim();
  // If already a full URL, return as-is
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // GUID-like pattern (UUID v4 style)
  const guidLike = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (guidLike.test(trimmed)) {
    const lib = libraryId || BUNNY_VIDEO_LIBRARY_ID;
    return `https://iframe.mediadelivery.net/embed/${lib}/${trimmed}`;
  }

  // If it's a simple filename or storage path, return CDN URL
  return getBunnyCdnUrl(trimmed);
};
