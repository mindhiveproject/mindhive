/**
 * Student-only flatten of opportunity follow-up FormDefinitions.
 * Renders ReviewField / chips / ResourceChipList — no DefinitionForm chrome.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import styled from 'styled-components';

import Chip from '../../../../DesignSystem/Chip';
import ReviewField from '../../../../Forms/DefinitionForm/ReviewField';
import { ReadOnlyTipTap } from '../../../../TipTap/ReadOnlyTipTap';
import { FORM_DEFINITION_BY_ID } from '../../../../Queries/FormDefinition';
import { isManagedIntroVideoField } from '../../../../Forms/DefinitionForm';
import { fieldLabel, optionLabel } from '../../../../Forms/DefinitionForm/i18n';
import {
  getVisibleFields,
  hasRenderableFieldValue,
  rolesIntersect,
  isCardVisible,
} from '../../../../Forms/DefinitionForm/visibility';
import { hydrate } from '../../../../Forms/DefinitionForm/storage';
import ResourceChipList from '../../../../Forms/DefinitionForm/fields/ResourceChipList';
import { DocumentIcon } from '../../../../DesignSystem/Icons';
import { getProposalAnswer } from '../../../../../lib/opportunityProposalData';
import { asLegacyMultiselectArray } from '../../../SponsorConnect/Opportunities/OpportunityProposalConfig';

/** Same broad roles as student follow-up panel so sponsor answers are readable. */
export const STUDENT_FOLLOW_UP_VIEWER_ROLES = [
  'student',
  'teacher',
  'sponsor',
  'mentor',
  'admin',
];

const CUSP_OVERVIEW_GROUPS = {
  expectedDeliverables: 'deliverableOptions',
  requiredSoftware: 'softwareOptions',
  requiredHardware: 'hardwareOptions',
  datasetProvision: 'datasetProvisionOptions',
  requiresSpecialResources: 'yesNo',
  fieldResearchRequired: 'yesNo',
  internshipInterest: 'yesNo',
};

const SECTION_TITLE_STYLE = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--MH-Theme-Neutrals-Black, #171717)',
};

const SUBHEADING_STYLE = {
  ...SECTION_TITLE_STYLE,
  fontSize: 15,
  fontWeight: 600,
};

const LIST_CHIP_STYLE = {
  width: 'auto',
  maxWidth: '100%',
  height: 'auto',
  minHeight: 32,
  alignItems: 'flex-start',
};

const MetaChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;

  > .DesignSystem-Chip {
    max-width: 100%;
  }
`;

const RESOURCE_CHIP_LEADING = (
  <DocumentIcon width={18} height={18} style={{ display: 'block' }} />
);

function toOptionKey(value) {
  return String(value || '').replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function ChipList({ label, items, ariaLabel }) {
  const chips = (Array.isArray(items) ? items : [])
    .map((item) => (item == null ? '' : String(item).trim()))
    .filter(Boolean);
  if (!chips.length) return null;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {label ? <h4 style={SECTION_TITLE_STYLE}>{label}</h4> : null}
      <MetaChipRow role="list" aria-label={ariaLabel || label || undefined}>
        {chips.map((item, index) => (
          <Chip
            key={`${index}-${item}`}
            shape="pill"
            label={item}
            title={item}
            labelLines={4}
            style={LIST_CHIP_STYLE}
          />
        ))}
      </MetaChipRow>
    </div>
  );
}

function isCompanionOtherFieldName(name, fieldByName) {
  if (!name || !name.endsWith('Other')) return false;
  const parentName = name.slice(0, -'Other'.length);
  if (!parentName) return false;
  const parent = fieldByName.get(parentName);
  if (!parent) return false;
  return (
    parent.fieldType === 'multiselect' ||
    parent.fieldType === 'select' ||
    parent.fieldType === 'tag_multiselect'
  );
}

function linkChipItems(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row?.url?.trim() || row?.title?.trim())
    .map((row, index) => {
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      const url = typeof row.url === 'string' ? row.url.trim() : '';
      const comment =
        typeof row.comment === 'string' ? row.comment.trim() : '';
      let label = title;
      if (!label && url) {
        try {
          label = new URL(url).hostname || url;
        } catch {
          label = url.length > 40 ? `${url.slice(0, 37)}…` : url;
        }
      }
      return {
        key: `link-${index}-${url || label}`,
        label: label || url,
        url: url || null,
        comment: comment || null,
      };
    });
}

function mediaChipItems(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((item) => item?.id || item?.title?.trim() || item?.url)
    .map((item, index) => {
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const url = typeof item.url === 'string' ? item.url.trim() : '';
      let label = title;
      if (!label && url) {
        try {
          const path = new URL(url, 'http://localhost').pathname || '';
          const file = path.split('/').filter(Boolean).pop();
          label = file ? decodeURIComponent(file) : url;
        } catch {
          label = url.length > 40 ? `${url.slice(0, 37)}…` : url;
        }
      }
      return {
        key: item.id || `media-${index}`,
        label: label || item.id || url,
        url: url || null,
        comment:
          typeof item.comment === 'string' ? item.comment.trim() : null,
      };
    });
}

function buildEntityForHydrate(opportunity, definition, formId) {
  if (!opportunity || !definition) return opportunity;
  const flatAnswer = getProposalAnswer(opportunity.proposalData, formId);
  const allFields = [];
  for (const card of definition.cards || []) {
    if (card.cardType !== 'fields') continue;
    for (const f of card.fields || []) allFields.push(f);
  }
  const flatForEntity = { ...flatAnswer };
  for (const field of allFields) {
    if (isManagedIntroVideoField(field) && field?.name) {
      delete flatForEntity[field.name];
    }
  }
  const bucketMirrors = {};
  for (const field of allFields) {
    if (field?.storage !== 'json_bucket') continue;
    const bucket = field.storageBucket;
    if (!bucket || bucketMirrors[bucket]) continue;
    const existing =
      opportunity[bucket] &&
      typeof opportunity[bucket] === 'object' &&
      !Array.isArray(opportunity[bucket])
        ? opportunity[bucket]
        : {};
    bucketMirrors[bucket] = { ...existing, ...flatForEntity };
  }
  return {
    ...opportunity,
    ...flatForEntity,
    ...bucketMirrors,
    proposalData: flatAnswer,
  };
}

function resourceSignature(links, media) {
  return JSON.stringify({
    links: (links || []).map((i) => [i.key, i.label, i.url]),
    media: (media || []).map((i) => [i.key, i.label, i.url]),
  });
}

function FollowUpFormAnswers({
  opportunity,
  formMeta,
  onReport,
  showSectionTitle = false,
  sectionTitle = '',
}) {
  const router = useRouter();
  const locale = router.locale;
  const { t: tConnect } = useTranslation('connect');

  const { data, loading } = useQuery(FORM_DEFINITION_BY_ID, {
    variables: { id: formMeta.id },
    skip: !formMeta?.id,
    fetchPolicy: 'cache-first',
  });

  const definition = data?.formDefinition;

  const values = useMemo(() => {
    if (!definition || !opportunity) return {};
    const entityForStorage = buildEntityForHydrate(
      opportunity,
      definition,
      formMeta.id,
    );
    const fields = getVisibleFields(definition, {
      viewerRoles: STUDENT_FOLLOW_UP_VIEWER_ROLES,
      entityStatus: opportunity?.status,
    });
    return hydrate(entityForStorage, fields, {
      organization: opportunity?.author?.organizations?.[0] || null,
    });
  }, [opportunity, definition, formMeta.id]);

  const fieldByName = useMemo(() => {
    const map = new Map();
    for (const card of definition?.cards || []) {
      for (const f of card.fields || []) {
        if (f?.name) map.set(f.name, f);
      }
    }
    return map;
  }, [definition]);

  const overviewOptionLabel = useCallback(
    (group, value) => {
      if (!value) return null;
      return tConnect(
        `opportunityEditor.overview.${group}.${toOptionKey(value)}`,
        {},
        { default: value },
      );
    },
    [tConnect],
  );

  const labelForOptionValue = useCallback(
    (field, value) => {
      if (value == null || value === '') return null;
      const options = Array.isArray(field?.options) ? field.options : [];
      const match = options.find((o) => o?.value === value);
      if (match) {
        const fromOpt = optionLabel(match, locale);
        if (fromOpt) return fromOpt;
      }
      const group = CUSP_OVERVIEW_GROUPS[field?.name];
      if (group) return overviewOptionLabel(group, value);
      return String(value);
    },
    [locale, overviewOptionLabel],
  );

  const presentation = useMemo(() => {
    const linkItems = [];
    const mediaItems = [];
    const blocks = [];

    if (!definition) {
      return { linkItems, mediaItems, blocks, ready: !loading };
    }

    const ctx = {
      viewerRoles: STUDENT_FOLLOW_UP_VIEWER_ROLES,
      entityStatus: opportunity?.status,
    };

    for (const card of definition.cards || []) {
      if (card.cardType !== 'fields') continue;
      if (!isCardVisible(card, ctx)) continue;

      const fields = (card.fields || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .filter((f) =>
          rolesIntersect(f.visibilityRoles, STUDENT_FOLLOW_UP_VIEWER_ROLES),
        )
        .filter((f) => {
          if (f.fieldType === 'read_only_html') return false;
          if (isManagedIntroVideoField(f)) return false;
          if (isCompanionOtherFieldName(f.name, fieldByName)) return false;
          return hasRenderableFieldValue(values?.[f.name], f.fieldType);
        });

      for (const field of fields) {
        const value = values?.[field.name];
        const label = fieldLabel(field, locale) || field.name;

        if (field.fieldType === 'link_list') {
          linkItems.push(...linkChipItems(value));
          continue;
        }
        if (field.fieldType === 'media_asset_list') {
          mediaItems.push(...mediaChipItems(value));
          continue;
        }
        if (field.fieldType === 'media_asset') {
          if (value && typeof value === 'object') {
            mediaItems.push(...mediaChipItems([value]));
          }
          continue;
        }

        if (
          field.fieldType === 'multiselect' ||
          field.fieldType === 'tag_multiselect'
        ) {
          const list = asLegacyMultiselectArray(value);
          const chips = list
            .map((v) => labelForOptionValue(field, v))
            .filter(Boolean);
          const otherRaw = values?.[`${field.name}Other`];
          const otherLabel =
            otherRaw != null ? String(otherRaw).trim() : '';
          if (otherLabel) chips.push(otherLabel);
          if (chips.length) {
            blocks.push({
              kind: 'chips',
              key: field.id || field.name,
              label,
              chips,
            });
          }
          continue;
        }

        if (
          field.fieldType === 'select' ||
          field.fieldType === 'select_one_icon'
        ) {
          const otherRaw = values?.[`${field.name}Other`];
          const otherLabel =
            otherRaw != null ? String(otherRaw).trim() : '';
          const selected = labelForOptionValue(field, value);
          const display = otherLabel
            ? selected && String(value) !== 'other'
              ? `${selected}: ${otherLabel}`
              : otherLabel
            : selected;
          if (display) {
            blocks.push({
              kind: 'text',
              key: field.id || field.name,
              label,
              value: display,
            });
          }
          continue;
        }

        if (field.fieldType === 'checkbox') {
          blocks.push({
            kind: 'text',
            key: field.id || field.name,
            label,
            value: value === true ? 'Yes' : 'No',
          });
          continue;
        }

        if (field.fieldType === 'rich_text') {
          const html = typeof value === 'string' ? value.trim() : '';
          if (html) {
            blocks.push({
              kind: 'rich',
              key: field.id || field.name,
              label,
              html,
            });
          }
          continue;
        }

        if (field.fieldType === 'dual_textarea') {
          const a =
            value && typeof value === 'object'
              ? String(value.a || value.left || '').trim()
              : '';
          const b =
            value && typeof value === 'object'
              ? String(value.b || value.right || '').trim()
              : typeof value === 'string'
                ? value.trim()
                : '';
          const text = [a, b].filter(Boolean).join('\n\n');
          if (text) {
            blocks.push({
              kind: 'text',
              key: field.id || field.name,
              label,
              value: text,
            });
          }
          continue;
        }

        if (field.fieldType === 'file' || field.fieldType === 'image') {
          const url =
            value && typeof value === 'object' && value.url
              ? String(value.url).trim()
              : '';
          if (url) {
            mediaItems.push({
              key: `${field.name}-${url}`,
              label: label || url,
              url,
              comment: null,
            });
          }
          continue;
        }

        if (field.fieldType === 'video_url') {
          const url =
            typeof value === 'string'
              ? value.trim()
              : value?.url
                ? String(value.url).trim()
                : '';
          if (url) {
            blocks.push({
              kind: 'text',
              key: field.id || field.name,
              label,
              value: url,
            });
          }
          continue;
        }

        let text = '';
        if (typeof value === 'string' || typeof value === 'number') {
          text = String(value).trim();
        } else if (Array.isArray(value)) {
          text = value
            .map((v) => String(v ?? '').trim())
            .filter(Boolean)
            .join(', ');
        } else if (value && typeof value === 'object' && value.url) {
          text = String(value.url).trim();
        }
        if (text) {
          blocks.push({
            kind: 'text',
            key: field.id || field.name,
            label,
            value: text,
          });
        }
      }
    }

    return { linkItems, mediaItems, blocks, ready: true };
  }, [
    definition,
    fieldByName,
    labelForOptionValue,
    loading,
    locale,
    opportunity?.status,
    values,
  ]);

  const resSig = resourceSignature(
    presentation.linkItems,
    presentation.mediaItems,
  );

  useEffect(() => {
    if (!presentation.ready || !onReport) return;
    onReport(formMeta.id, {
      hasFields: presentation.blocks.length > 0,
      links: presentation.linkItems,
      media: presentation.mediaItems,
      signature: resSig,
    });
  }, [
    formMeta.id,
    onReport,
    presentation.blocks.length,
    presentation.linkItems,
    presentation.mediaItems,
    presentation.ready,
    resSig,
  ]);

  if (loading && !definition) return null;
  if (!presentation.blocks.length) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {showSectionTitle ? (
        <h4 style={SECTION_TITLE_STYLE}>
          {sectionTitle}
        </h4>
      ) : null}
      {formMeta.title ? (
        <h4 style={SUBHEADING_STYLE}>{formMeta.title}</h4>
      ) : null}
      <div style={{ display: 'grid', gap: 16 }}>
        {presentation.blocks.map((block) => {
          if (block.kind === 'chips') {
            return (
              <ChipList
                key={block.key}
                label={block.label}
                items={block.chips}
              />
            );
          }
          if (block.kind === 'rich') {
            return (
              <ReviewField key={block.key} label={block.label}>
                <ReadOnlyTipTap
                  dangerouslySetInnerHTML={{ __html: block.html }}
                />
              </ReviewField>
            );
          }
          return (
            <ReviewField
              key={block.key}
              label={block.label}
              value={block.value}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Flattened follow-up answers + aggregated Resources for the student About tab.
 */
export default function StudentFollowUpAnswers({ opportunity, forms }) {
  const { t } = useTranslation('classes');
  const list = useMemo(
    () => (Array.isArray(forms) ? forms.filter((f) => f?.id) : []),
    [forms],
  );

  const [reports, setReports] = useState({});

  const onReport = useCallback((id, report) => {
    setReports((prev) => {
      const prevReport = prev[id];
      if (
        prevReport &&
        prevReport.hasFields === report.hasFields &&
        prevReport.signature === report.signature
      ) {
        return prev;
      }
      return { ...prev, [id]: report };
    });
  }, []);

  const orderedReports = useMemo(
    () => list.map((form) => reports[form.id]).filter(Boolean),
    [list, reports],
  );

  const firstFormWithFieldsId = useMemo(() => {
    for (const form of list) {
      if (reports[form.id]?.hasFields) return form.id;
    }
    return null;
  }, [list, reports]);

  const allLinks = useMemo(() => {
    const out = [];
    for (const r of orderedReports) {
      if (r.links?.length) out.push(...r.links);
    }
    return out;
  }, [orderedReports]);

  const allMedia = useMemo(() => {
    const out = [];
    for (const r of orderedReports) {
      if (r.media?.length) out.push(...r.media);
    }
    return out;
  }, [orderedReports]);

  const hasResources = allLinks.length > 0 || allMedia.length > 0;
  const sectionTitle = t(
    'opportunities.studentView.preview.followUpTitle',
    {},
    { default: 'More project details' },
  );

  if (!opportunity || list.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {list.map((form) => (
        <FollowUpFormAnswers
          key={form.id}
          opportunity={opportunity}
          formMeta={form}
          onReport={onReport}
          showSectionTitle={form.id === firstFormWithFieldsId}
          sectionTitle={sectionTitle}
        />
      ))}

      {hasResources ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <h4 style={SECTION_TITLE_STYLE}>
            {t(
              'opportunities.studentView.preview.resourcesTitle',
              {},
              { default: 'Resources' },
            )}
          </h4>
          {allLinks.length > 0 ? (
            <ResourceChipList
              items={allLinks}
              leading={RESOURCE_CHIP_LEADING}
              kind="link"
            />
          ) : null}
          {allMedia.length > 0 ? (
            <ResourceChipList
              items={allMedia}
              leading={RESOURCE_CHIP_LEADING}
              kind="media"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
