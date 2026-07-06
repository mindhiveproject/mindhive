// Bridge between FormDefinition fields and entity records.
//
// hydrate(entity, fields, related) — read existing values into a flat
//   state shape keyed by field.name. `related` is { organization: <org> }
//   used for fields with storageEntity="organization".
//
// buildUpdate(values, fields, entity, related) — split the flat state
//   back into update inputs grouped by entity:
//     { self: {...}, organization: {...} }
//   Json-bucket fields are merged with the existing bucket. Image / file
//   File objects are wrapped as { upload }. tag_multiselect values are
//   serialized as { set: [{id}, ...] } for Keystone relationship inputs.

function isEmpty(v) {
  return v === undefined || v === null;
}

function isFile(v) {
  return typeof File !== "undefined" && v instanceof File;
}

function isUnchangedMediaPayload(v) {
  return (
    v != null &&
    typeof v === "object" &&
    !isFile(v) &&
    !Array.isArray(v) &&
    typeof v.url === "string"
  );
}

function entityForField(field, entity, related) {
  if (field?.storageEntity === "organization") {
    return related?.organization || null;
  }
  return entity;
}

function readFromEntity(entity, field) {
  if (!entity) return undefined;
  if (field.storage === "column") {
    return entity[field.storageColumn || field.name];
  }
  // json_bucket
  const bucket = entity[field.storageBucket];
  return bucket && typeof bucket === "object" ? bucket[field.name] : undefined;
}

// For tag_multiselect: query returns array of {id, title, ...}.
// Form state holds array of IDs.
function normalizeRelationshipValue(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => (typeof r === "string" ? r : r?.id))
    .filter(Boolean);
}

function defaultForType(t) {
  switch (t) {
    case "checkbox":
      return false;
    case "number":
      return null;
    case "multiselect":
    case "tag_multiselect":
    case "json_array":
      return [];
    case "image":
    case "file":
      return null;
    default:
      return "";
  }
}

export function hydrate(entity, fields, related) {
  const values = {};
  for (const f of fields) {
    if (!f?.name) continue;
    const source = entityForField(f, entity, related);
    let raw = readFromEntity(source, f);

    if (f.fieldType === "tag_multiselect") {
      // Normalize whether or not raw is present.
      values[f.name] = normalizeRelationshipValue(raw);
      continue;
    }

    if (isEmpty(raw)) {
      raw = f.defaultValue ?? defaultForType(f.fieldType);
    }
    values[f.name] = raw;
  }
  return values;
}

// Bucket name used for organization-side fields in the returned shape.
const ORG_KEY = "organization";

function emptyContainer() {
  return { columns: {}, buckets: {} };
}

function flush(group) {
  return { ...group.columns, ...group.buckets };
}

export function buildUpdate(values, fields, entity, related) {
  const self = emptyContainer();
  const org = emptyContainer();

  for (const f of fields) {
    if (!f?.name) continue;
    const target = f.storageEntity === "organization" ? org : self;
    const sourceEntity =
      f.storageEntity === "organization" ? related?.organization : entity;
    const v = values[f.name];

    if (f.storage === "column") {
      const col = f.storageColumn || f.name;

      // Image / file fields.
      if (f.fieldType === "image" || f.fieldType === "file") {
        if (isFile(v)) {
          target.columns[col] = { upload: v };
        } else if (isUnchangedMediaPayload(v)) {
          // omit — leave the existing media alone
        } else if (v === null) {
          target.columns[col] = null;
        }
        continue;
      }

      // Tag multiselect → Keystone relationship `set` input.
      if (f.fieldType === "tag_multiselect") {
        const ids = Array.isArray(v) ? v.filter(Boolean) : [];
        // Keystone's Create relationship input doesn't accept `set`
        // (only Update does). Detect first-save-of-this-entity via the
        // sourceEntity's id — if there's no id yet, we're a create and
        // need `connect`. Otherwise `set` is right because it replaces
        // the whole list.
        const isCreate = !sourceEntity?.id;
        target.columns[col] = isCreate
          ? { connect: ids.map((id) => ({ id })) }
          : { set: ids.map((id) => ({ id })) };
        continue;
      }

      if (v !== undefined) target.columns[col] = v;
    } else {
      const bucket = f.storageBucket;
      if (!bucket) continue;
      if (!target.buckets[bucket]) {
        const existing =
          sourceEntity &&
          sourceEntity[bucket] &&
          typeof sourceEntity[bucket] === "object"
            ? { ...sourceEntity[bucket] }
            : {};
        target.buckets[bucket] = existing;
      }
      target.buckets[bucket][f.name] = v;
    }
  }

  // Result groups by entity. Parents that target a single entity (most
  // forms) only see the `self` key; sponsor forms also see organization.
  const result = { self: flush(self) };
  const orgFlat = flush(org);
  if (Object.keys(orgFlat).length > 0) result[ORG_KEY] = orgFlat;
  return result;
}
