/**
 * API client for LexiExtract Document Intelligence API
 */

import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function getCurrentToken() {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (e) {
      console.warn("Could not get Firebase token:", e);
    }
  }
  return localStorage.getItem('lexi_jwt_token') || '';
}

async function getAuthHeaders() {
  const headers = {};
  const token = await getCurrentToken();
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function uploadAndExtractPdf(file) {
  const formData = new FormData();
  formData.append('file', file);
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Extraction failed.' }));
    throw new Error(err.detail || 'Extraction failed.');
  }

  return response.json();
}

export async function listUserDocuments() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    headers: headers
  });
  if (!response.ok) return { documents: [] };
  return response.json();
}

export function getDocumentPdfUrl(docId) {
  const token = localStorage.getItem('lexi_jwt_token') || '';
  return `${API_BASE_URL}/api/documents/${docId}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

export function getPageImageUrl(docId, pageNum, scale = 2.0) {
  const token = localStorage.getItem('lexi_jwt_token') || '';
  return `${API_BASE_URL}/api/documents/${docId}/page/${pageNum}/image?scale=${scale}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
}

export function getExportUrl(docId, format) {
  const token = localStorage.getItem('lexi_jwt_token') || '';
  return `${API_BASE_URL}/api/documents/${docId}/export/${format}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

export async function getDocumentData(docId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/export/json`, {
    headers: headers
  });
  if (!response.ok) {
    throw new Error('Failed to load document structure.');
  }
  return response.json();
}

export async function compareDocuments(docId1, docId2) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({
      doc_id_1: docId1,
      doc_id_2: docId2
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Comparison failed.' }));
    throw new Error(err.detail || 'Comparison failed.');
  }

  return response.json();
}
