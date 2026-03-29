/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional MapLibre style JSON URL (vector/raster sources your licence allows).
   * Defaults to Carto Positron when unset.
   */
  readonly VITE_MAPLIBRE_STYLE_URL?: string;
}
