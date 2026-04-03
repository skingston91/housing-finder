import { createSystem, defaultConfig } from '@chakra-ui/react';

/**
 * Chakra `defaultConfig` already defines semantic colours such as `fg`, `fg.muted`, `fg.warning`,
 * and `fg.success`. Use those in components (e.g. Area Search URL / copy feedback) before adding
 * ad-hoc hex. Extend with `createSystem(defaultConfig, defineConfig({ theme: { semanticTokens } }))`
 * when we need app-specific tokens.
 */
export const system = createSystem(defaultConfig);
