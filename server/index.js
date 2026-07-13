import dotenv from 'dotenv';
// Load server-local .env first, then fall back to parent project's .env if present
dotenv.config();
dotenv.config({ path: '../.env' });
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import fs from 'fs';
import os from 'os';

const app = express();
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
  }
});
app.use(cors());

const PORT = process.env.PORT || 4000;

const cleanupUploadedFile = (file) => {
  if (!file?.path) return;
  fs.unlink(file.path, (err) => {
    if (err) console.warn('Failed to cleanup upload temp file', err.message);
  });
};

app.get('/', (req, res) => res.send('Bunny upload proxy running'));

app.get('/api/check-storage-key', async (req, res) => {
  try {
    const storageZone = process.env.BUNNY_STORAGE_ZONE || process.env.VITE_BUNNY_STORAGE_ZONE;
    const storageEndpoint = ((process.env.BUNNY_STORAGE_ENDPOINT || process.env.VITE_BUNNY_STORAGE_ENDPOINT) || '').replace(/\/+$/, '');
    const storageUrl = ((process.env.BUNNY_STORAGE_URL || process.env.VITE_BUNNY_STORAGE_URL) || '').replace(/\/+$/, '');
    const accessKey = process.env.BUNNY_ACCESS_KEY || process.env.VITE_BUNNY_ACCESS_KEY;

    if (!accessKey) return res.status(500).json({ error: 'Storage AccessKey not configured on server' });

    let baseUrl = null;
    if (storageEndpoint && storageZone) {
      baseUrl = `${storageEndpoint}/${storageZone}`;
    } else if (storageUrl) {
      baseUrl = storageUrl;
    } else {
      return res.status(500).json({ error: 'Bunny storage configuration missing on server' });
    }

    const checkRes = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: { AccessKey: accessKey }
    });
    const text = await checkRes.text();
    return res.status(checkRes.status).json({
      ok: checkRes.ok,
      status: checkRes.status,
      storageZone,
      message: text.slice(0, 300)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Storage key check failed', message: err.message });
  }
});

// Health endpoint to validate Bunny Stream API key and library access
app.post('/api/check-key', async (req, res) => {
  try {
    const libraryId = process.env.BUNNY_VIDEO_LIBRARY_ID || process.env.VITE_BUNNY_VIDEO_LIBRARY_ID;
    const apiKey = (process.env.BUNNY_STREAM_API_KEY || process.env.VITE_BUNNY_STREAM_API_KEY || '').trim();
    console.log('Checking Bunny Stream API key for library', libraryId, 'keyPresent=', !!apiKey);
    if (!libraryId) return res.status(500).json({ error: 'Library ID not configured on server' });
    if (!apiKey) return res.status(500).json({ error: 'Bunny Stream API key not configured on server' });

    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ title: 'health-check' })
    });

    const text = await createRes.text();
    console.log('[Bunny create] status=', createRes.status, 'body=', text);
    if (!createRes.ok) return res.status(createRes.status).send(text);
    const json = JSON.parse(text || '{}');
    return res.json({ ok: true, result: json });
  } catch (err) {
    console.error('check-key error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  try {
    const title = req.body.title || (file && file.originalname) || 'upload';
    const libraryId = req.body.libraryId || process.env.BUNNY_VIDEO_LIBRARY_ID || process.env.VITE_BUNNY_VIDEO_LIBRARY_ID;
    const apiKey = process.env.BUNNY_STREAM_API_KEY || process.env.VITE_BUNNY_STREAM_API_KEY;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!libraryId) return res.status(500).json({ error: 'Library ID not configured on server' });
    if (!apiKey) return res.status(500).json({ error: 'Bunny Stream API key not configured on server' });

    // 1) create video record
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ title })
    });

    const createText = await createRes.text();
    console.log('[Bunny create] status=', createRes.status, 'body=', createText);
    if (!createRes.ok) return res.status(createRes.status).send(createText);
    const createJson = JSON.parse(createText || '{}');
    const guid = createJson.guid;
    console.log('[Bunny create] guid=', guid);
    if (!guid) return res.status(500).json({ error: 'Bunny did not return a guid', detail: createJson });

    // 2) upload binary
    const uploadRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/octet-stream'
      },
      duplex: 'half',
      body: fs.createReadStream(file.path)
    });

    const uploadText = await uploadRes.text();
    console.log('[Bunny upload] status=', uploadRes.status, 'body=', uploadText);
    if (!uploadRes.ok) return res.status(uploadRes.status).send(uploadText);

    const embed = createJson.embed || `https://iframe.mediadelivery.net/embed/${libraryId}/${guid}`;
    console.log('[Upload complete] embed=', embed);
    return res.json({ guid, embed, raw: uploadText, create: createJson });
  } catch (err) {
    console.error('Upload proxy error', err);
    return res.status(500).json({ error: 'Upload failed', message: err.message });
  } finally {
    cleanupUploadedFile(file);
  }
});

// Proxy endpoint to upload files to Bunny Storage (keeps AccessKey on server)
app.post('/api/storage-upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  try {
    const folder = (req.body.folder || '').replace(/^\/+|\/+$/g, '');
    // Support projects that store Bunny credentials with VITE_ prefix in .env
    const storageZone = process.env.BUNNY_STORAGE_ZONE || process.env.VITE_BUNNY_STORAGE_ZONE;
    const storageEndpoint = ((process.env.BUNNY_STORAGE_ENDPOINT || process.env.VITE_BUNNY_STORAGE_ENDPOINT) || '').replace(/\/+$/, '');
    const storageUrl = ((process.env.BUNNY_STORAGE_URL || process.env.VITE_BUNNY_STORAGE_URL) || '').replace(/\/+$/, '');
    const accessKey = process.env.BUNNY_ACCESS_KEY || process.env.VITE_BUNNY_ACCESS_KEY;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!accessKey) return res.status(500).json({ error: 'Storage AccessKey not configured on server' });

    // Create unique filename similar to client logic
    const timestamp = Date.now();
    const safeName = (file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Determine upload URL
    let uploadUrl = null;
    if (storageEndpoint && storageZone) {
      uploadUrl = `${storageEndpoint}/${storageZone}/${filePath}`;
    } else if (storageUrl) {
      uploadUrl = `${storageUrl}/${filePath}`;
    } else {
      return res.status(500).json({ error: 'Bunny storage configuration missing on server' });
    }

    // Log resolved storage configuration (mask AccessKey)
    const maskedKey = accessKey ? ('***' + accessKey.slice(-4)) : null;
    console.log('[Storage upload] uploadUrl=', uploadUrl);
    console.log('[Storage upload] storageEndpoint=', storageEndpoint, 'storageZone=', storageZone, 'storageUrl=', storageUrl, 'AccessKey=', maskedKey);

    // Perform PUT to Bunny Storage
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        AccessKey: accessKey,
        'Content-Type': file.mimetype || 'application/octet-stream'
      },
      duplex: 'half',
      body: fs.createReadStream(file.path)
    });

    const text = await uploadRes.text();
    if (!uploadRes.ok) {
      console.error('[Storage upload] status=', uploadRes.status, 'body=', text);
      return res.status(uploadRes.status).send(text);
    }

    // Build CDN URL if available
    let cdnBase = process.env.BUNNY_CDN_URL || process.env.VITE_BUNNY_CDN_URL || null;
    if (!cdnBase) {
      if (storageUrl) cdnBase = storageUrl;
      else if (storageEndpoint && storageZone) cdnBase = `${storageEndpoint}/${storageZone}`;
    }

    const cdnUrl = cdnBase ? `${cdnBase.replace(/\/+$/, '')}/${filePath}` : null;

    return res.json({ ok: true, fileName, filePath, cdnUrl, raw: text });
  } catch (err) {
    console.error('Storage upload proxy error', err);
    return res.status(500).json({ error: 'Storage upload failed', message: err.message });
  } finally {
    cleanupUploadedFile(file);
  }
});
// Proxy endpoint to delete files from Bunny Storage (keeps AccessKey on server)
app.post('/api/storage-delete', express.json(), async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });

    const storageZone = process.env.BUNNY_STORAGE_ZONE || process.env.VITE_BUNNY_STORAGE_ZONE;
    const storageEndpoint = ((process.env.BUNNY_STORAGE_ENDPOINT || process.env.VITE_BUNNY_STORAGE_ENDPOINT) || '').replace(/\/+$/, '');
    const storageUrl = ((process.env.BUNNY_STORAGE_URL || process.env.VITE_BUNNY_STORAGE_URL) || '').replace(/\/+$/, '');
    const accessKey = process.env.BUNNY_ACCESS_KEY || process.env.VITE_BUNNY_ACCESS_KEY;

    if (!accessKey) return res.status(500).json({ error: 'Storage AccessKey not configured on server' });

    let deleteUrl = null;
    if (storageEndpoint && storageZone) {
      deleteUrl = `${storageEndpoint}/${storageZone}/${filePath.replace(/^\/+/, '')}`;
    } else if (storageUrl) {
      deleteUrl = `${storageUrl}/${filePath.replace(/^\/+/, '')}`;
    } else {
      return res.status(500).json({ error: 'Bunny storage configuration missing on server' });
    }

    console.log('[Storage delete] deleteUrl=', deleteUrl);
    const deleteRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { AccessKey: accessKey },
    });

    const text = await deleteRes.text();
    if (!deleteRes.ok) {
      console.error('[Storage delete] status=', deleteRes.status, 'body=', text);
      return res.status(deleteRes.status).send(text);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Storage delete proxy error', err);
    return res.status(500).json({ error: 'Storage delete failed', message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
