/**
 * Adds the "Support tickets" relation to the Notion Tickets database, once.
 *
 * The ticket mirror links each ticket to the support tickets it answers
 * (mirrorSupportTickets in lib/notionMirror.ts). That needs a relation on the
 * Tickets database pointing at the Support tickets database — the one the
 * Help Center's support form feeds — shown from the other side as "Platform
 * tickets", so whoever handles a support ticket can see the dev ticket and
 * follow its status.
 *
 * Idempotent, and a dry run unless --apply is passed. From keystone/:
 *   node scripts/setup-notion-support-relation.js
 *   node scripts/setup-notion-support-relation.js --apply
 *
 * Needs NOTION_KEY, NOTION_TICKETS_DB and NOTION_SUPPORT_TICKETS_DB in
 * keystone/.env, and the Support tickets database shared with the same
 * integration as the Tickets database (in Notion: ••• → Connections).
 *
 * Then restart Keystone so it reads NOTION_SUPPORT_TICKETS_DB, and run the
 * backfillSupportTicketsToNotion mutation to link the support tickets saved
 * on the platform before the relation existed.
 */
require("dotenv").config();
const { Client } = require("@notionhq/client");

// PROP.support in lib/notionMirror.ts — change both together.
const TICKETS_PROPERTY = "Support tickets";
const SUPPORT_PROPERTY = "Platform tickets";

async function dataSourceOf(notion, databaseId, label) {
  let database;
  try {
    database = await notion.databases.retrieve({ database_id: databaseId });
  } catch (error) {
    if (error.code === "object_not_found") {
      throw new Error(
        `the integration cannot see the ${label} database. Share it with the integration (••• → Connections).`
      );
    }
    throw error;
  }
  if (database.in_trash) throw new Error(`the ${label} database is in Notion's trash.`);
  return notion.dataSources.retrieve({ data_source_id: database.data_sources[0].id });
}

async function main() {
  const apply = process.argv.includes("--apply");
  const missing = ["NOTION_KEY", "NOTION_TICKETS_DB", "NOTION_SUPPORT_TICKETS_DB"].filter(
    (name) => !process.env[name]
  );
  if (missing.length) throw new Error(`missing in keystone/.env: ${missing.join(", ")}`);

  const notion = new Client({ auth: process.env.NOTION_KEY, notionVersion: "2025-09-03" });
  const tickets = await dataSourceOf(notion, process.env.NOTION_TICKETS_DB, "Tickets");
  const support = await dataSourceOf(notion, process.env.NOTION_SUPPORT_TICKETS_DB, "Support tickets");

  const existing = tickets.properties[TICKETS_PROPERTY];
  if (existing) {
    if (existing.type === "relation" && existing.relation?.data_source_id === support.id) {
      console.log(`Already set up: "${TICKETS_PROPERTY}" relates Tickets to Support tickets.`);
      return;
    }
    throw new Error(
      `the Tickets database already has a "${TICKETS_PROPERTY}" property that is not this relation (${existing.type}). Rename or remove it in Notion first.`
    );
  }
  if (support.properties[SUPPORT_PROPERTY]) {
    throw new Error(
      `the Support tickets database already has a "${SUPPORT_PROPERTY}" property. Rename it in Notion first, or change SUPPORT_PROPERTY here.`
    );
  }

  console.log(
    `Will add "${TICKETS_PROPERTY}" to Tickets, relating to Support tickets, shown there as "${SUPPORT_PROPERTY}".`
  );
  if (!apply) {
    console.log("Dry run. Re-run with --apply to make the change.");
    return;
  }
  await notion.dataSources.update({
    data_source_id: tickets.id,
    properties: {
      [TICKETS_PROPERTY]: {
        relation: {
          data_source_id: support.id,
          type: "dual_property",
          dual_property: { synced_property_name: SUPPORT_PROPERTY },
        },
      },
    },
  });
  console.log(
    "Done. Restart Keystone, then run the backfillSupportTicketsToNotion mutation to link " +
      "support tickets saved before now."
  );
}

main().catch((error) => {
  console.error(`Not set up: ${error.message}`);
  process.exit(1);
});
