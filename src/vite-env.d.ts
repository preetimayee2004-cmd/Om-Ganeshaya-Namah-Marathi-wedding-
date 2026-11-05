/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Apps Script web app URL that stores RSVPs and blessings (see backend/SETUP.md) */
  readonly VITE_API_URL?: string;
}
