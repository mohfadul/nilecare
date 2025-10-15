/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content
 * Removes potentially dangerous HTML/JavaScript
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false
  });
};

/**
 * Sanitize plain text
 * Removes all HTML tags
 */
export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize URL
 * Ensures URL is safe to use
 */
export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

/**
 * Escape special characters for safe display
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Safe component for displaying user-generated content
 */
export const SafeText: React.FC<{ children: string }> = ({ children }) => {
  return <span dangerouslySetInnerHTML={{ __html: sanitizeText(children) }} />;
};

/**
 * Safe component for displaying HTML content
 */
export const SafeHtml: React.FC<{ children: string }> = ({ children }) => {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(children) }} />;
};

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  escapeHtml,
  SafeText,
  SafeHtml
};

