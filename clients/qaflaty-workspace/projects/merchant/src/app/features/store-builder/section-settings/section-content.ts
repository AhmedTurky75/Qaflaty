import { SectionConfigurationDto } from 'shared';

/**
 * Reading and writing a section's `contentJson` / `settingsJson`.
 *
 * Every writer returns a **new** section object and leaves every key it was not
 * asked to change exactly as it found it — including properties no part of the
 * builder exposes any more. That is what keeps an older page round-tripping
 * unchanged through the editor.
 */
export type ContentObject = Record<string, unknown>;

function parse(json: string | undefined): ContentObject {
  if (!json) return {};
  try {
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed as ContentObject : {};
  } catch {
    return {};
  }
}

export function readContent(section: SectionConfigurationDto): ContentObject {
  return parse(section.contentJson);
}

export function readSettings(section: SectionConfigurationDto): ContentObject {
  return parse(section.settingsJson);
}

export function withContent(section: SectionConfigurationDto, content: ContentObject): SectionConfigurationDto {
  return { ...section, contentJson: JSON.stringify(content) };
}

/** An empty settings object is stored as `undefined`, as it always has been. */
export function withSettings(section: SectionConfigurationDto, settings: ContentObject): SectionConfigurationDto {
  return {
    ...section,
    settingsJson: Object.keys(settings).length ? JSON.stringify(settings) : undefined
  };
}

export function setContentValue(
  section: SectionConfigurationDto,
  key: string,
  value: unknown
): SectionConfigurationDto {
  return withContent(section, { ...readContent(section), [key]: value });
}

export function setBilingualValue(
  section: SectionConfigurationDto,
  key: string,
  lang: 'en' | 'ar',
  value: string
): SectionConfigurationDto {
  const content = readContent(section);
  const current = (content[key] && typeof content[key] === 'object' ? content[key] : {}) as ContentObject;
  return withContent(section, { ...content, [key]: { ...current, [lang]: value } });
}

/** An empty value removes the key rather than storing a blank. */
export function setSettingsValue(
  section: SectionConfigurationDto,
  key: string,
  value: unknown
): SectionConfigurationDto {
  const settings = { ...readSettings(section) };
  if (value === '' || value === null || value === undefined) {
    delete settings[key];
  } else {
    settings[key] = value;
  }
  return withSettings(section, settings);
}

export function readArray(section: SectionConfigurationDto, key: string): ContentObject[] {
  const value = readContent(section)[key];
  return Array.isArray(value) ? value as ContentObject[] : [];
}

export function setArray(
  section: SectionConfigurationDto,
  key: string,
  items: ContentObject[]
): SectionConfigurationDto {
  return setContentValue(section, key, items);
}
