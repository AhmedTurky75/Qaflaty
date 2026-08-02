import { SectionConfigurationDto } from 'shared';

/**
 * Small helpers for the sections that read their own `contentJson`.
 *
 * Every section stores merchant text as `{ en, ar }` and repeatable content as
 * plain arrays, so the same two readers serve all of them.
 */
export type SectionContent = Record<string, unknown>;

export function contentOf(config: SectionConfigurationDto): SectionContent {
  try {
    const parsed: unknown = config.contentJson ? JSON.parse(config.contentJson) : {};
    return parsed && typeof parsed === 'object' ? parsed as SectionContent : {};
  } catch {
    return {};
  }
}

export function listOf(config: SectionConfigurationDto, key: string): SectionContent[] {
  const value = contentOf(config)[key];
  return Array.isArray(value) ? value as SectionContent[] : [];
}
