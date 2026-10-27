// Admin tool for the NYC DOE data agreement: the monthly de-identification
// (canRunRetention, see Deidentification.js), and checking, exporting and
// deleting the DOE data of one person (DOE request), one school (school stops
// using MindHive) or all of it (termination), with a printable record of each
// run for the Certificate of Records Disposal (Attachment E; canDeleteDoeData).
// The backend checks both permissions again.
//
// Exports are zipped in the browser, so no copy is left on the server.
import { useState } from "react";
import styled from "styled-components";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Papa from "papaparse";

import Button from "../../../DesignSystem/Button";
import Deidentification from "./Deidentification";
import {
  DELETE_DOE_DATA,
  DOE_EXPORT_PERSON,
  DOE_EXPORT_SCHOOL,
  RETENTION_RUNS,
} from "../../../Queries/DoeData";

const TERMINATION_PHRASE = "DELETE ALL DOE DATA";
const DBN = /^\d{2}[MXKQR]\d{3}$/;

const TRIGGERS = {
  SCHEDULE: "Monthly schedule",
  MANUAL: "Run by an admin",
  DOE_REQUEST: "DOE request",
  SCHOOL: "School stopped using MindHive",
  TERMINATION: "Termination",
};

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 4vw, 48px);
  max-width: 960px;
  color: #171717;

  h1,
  h2 {
    margin: 0;
  }
  p {
    margin: 0;
    line-height: 1.5;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    border: 1px solid #e3e6e8;
    border-radius: 12px;
    background: #fff;
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  input[type="text"] {
    padding: 8px 12px;
    border: 1px solid #c9ced3;
    border-radius: 8px;
    min-width: 280px;
  }
  .danger {
    border-color: #e4a6a0;
    background: #fff8f7;
  }
  .error {
    color: #b42318;
  }
  .ok {
    color: #1a7f4b;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th,
  td {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid #eef0f2;
    vertical-align: top;
  }
`;

const Denied = styled.div`
  padding: 64px 32px;
  text-align: center;
  color: #5f6871;
`;

function canDeleteDoeData(user) {
  return (user?.permissions || []).some((p) => p?.canDeleteDoeData);
}

function canRunRetention(user) {
  return (user?.permissions || []).some((p) => p?.canRunRetention);
}

function scopeOf(kind, value) {
  const raw = String(value || "").trim();
  if (kind === "person") {
    const email = raw.toLowerCase();
    return email.includes("@")
      ? { variables: { email }, phrase: email, label: "one person" }
      : null;
  }
  if (kind === "school") {
    const dbn = raw.toUpperCase();
    return DBN.test(dbn)
      ? { variables: { school: dbn }, phrase: dbn, label: `school ${dbn}` }
      : null;
  }
  return {
    variables: { termination: true },
    phrase: TERMINATION_PHRASE,
    label: "all DOE",
  };
}

function CountTable({ title, counts }) {
  const entries = Object.entries(counts || {}).filter(([, n]) => n);
  if (!entries.length) return null;
  return (
    <div>
      <strong>{title}</strong>
      <table>
        <tbody>
          {entries.map(([key, n]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Plan({ result }) {
  if (!result) return null;
  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <CountTable
        title={result.dryRun ? "Would delete" : "Deleted"}
        counts={{ "raw study folders": result.rawFolders, ...result.deleted }}
      />
      <CountTable
        title={result.dryRun ? "Would keep" : "Kept"}
        counts={result.kept}
      />
      {!result.dryRun && (
        <p className={result.verified ? "ok" : "error"}>
          {result.verified
            ? "Checked afterwards: nothing is left in this scope."
            : "Checked afterwards: some data is still in this scope. Run it again or investigate."}
        </p>
      )}
    </div>
  );
}

// ---------- exports ----------

const safe = (s) => String(s || "unnamed").replace(/[^A-Za-z0-9._@-]+/g, "_");

function addPerson(folder, person) {
  folder.file("account.json", JSON.stringify(person.account, null, 2));
  Object.entries(person.records || {}).forEach(([field, rows]) =>
    folder.file(`records/${field}.json`, JSON.stringify(rows, null, 2))
  );
  (person.rawFiles || []).forEach((file) =>
    folder.file(`raw-study-files/${safe(file.dataset)}/${safe(file.name)}`, file.content)
  );
}

async function downloadPerson(person, email) {
  const zip = new JSZip();
  addPerson(zip, person);
  saveAs(await zip.generateAsync({ type: "blob" }), `mindhive-${safe(email)}.zip`);
}

async function downloadSchool(data) {
  const zip = new JSZip();
  const root = zip.folder(`mindhive-${safe(data.school)}`);
  const rows = data.people.map((person) => {
    const a = person.account || {};
    const folder = `${safe(a.username)}-${String(a.id || "").slice(-6)}`;
    addPerson(root.folder(folder), person);
    return {
      folder,
      username: a.username,
      email: a.email,
      firstName: a.firstName,
      lastName: a.lastName,
      code: a.publicReadableId,
    };
  });
  root.file("people.csv", Papa.unparse(rows));
  saveAs(await zip.generateAsync({ type: "blob" }), `mindhive-${safe(data.school)}.zip`);
}

// ---------- printable record for Attachment E ----------

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function printRun(run) {
  const counts = typeof run.counts === "string" ? JSON.parse(run.counts) : run.counts || {};
  const rows = (obj) =>
    Object.entries(obj || {})
      .filter(([, n]) => typeof n === "number" && n)
      .map(([k, n]) => `<tr><td>${escapeHtml(k)}</td><td>${n}</td></tr>`)
      .join("") || "<tr><td colspan=2>none</td></tr>";
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>MindHive record of DOE data disposal</title>
<style>body{font:14px/1.5 sans-serif;margin:40px;color:#111}table{border-collapse:collapse;margin:8px 0 16px}td{border:1px solid #ccc;padding:4px 10px}h1{font-size:20px}h2{font-size:15px;margin-top:20px}</style></head><body>
<h1>MindHive: record of DOE data disposal</h1>
<p>Supporting record for the Certificate of Records Disposal (Attachment E).</p>
<table>
<tr><td>Run</td><td>${escapeHtml(run.id)}</td></tr>
<tr><td>Started</td><td>${escapeHtml(run.startedAt)}</td></tr>
<tr><td>Finished</td><td>${escapeHtml(run.finishedAt)}</td></tr>
<tr><td>Reason</td><td>${escapeHtml(TRIGGERS[run.trigger] || run.trigger)}</td></tr>
<tr><td>Scope</td><td>${escapeHtml(run.scope)}</td></tr>
<tr><td>Dry run</td><td>${run.dryRun ? "yes, nothing was deleted" : "no"}</td></tr>
<tr><td>Verified empty afterwards</td><td>${run.verified ? "yes" : "no"}</td></tr>
</table>
<h2>Deleted</h2><table><tr><td>raw study folders</td><td>${counts.rawFolders || 0}</td></tr>${rows(counts.deleted)}</table>
<h2>Kept (shared with people outside the scope, or teaching materials)</h2><table>${rows(counts.kept)}</table>
<h2>Remaining in scope after deletion</h2><table>${rows(counts.remaining)}</table>
<h2>Method</h2>
<p>Purge. Records were permanently deleted from the MindHive production database (DigitalOcean Managed PostgreSQL), and raw study files and uploaded files were deleted from the application server's disk, through the MindHive admin tool. Database backups are kept for 7 days and expire on their own; the application server's disk has no backups. After deletion the same scope was searched again, with the result above.</p>
</body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// ---------- page ----------

export default function AdminDoeDataMain({ user }) {
  const client = useApolloClient();
  const [kind, setKind] = useState("person");
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [plan, setPlan] = useState(null); // { key, result }
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const mayDelete = canDeleteDoeData(user);
  const mayRun = canRunRetention(user);
  const runs = useQuery(RETENTION_RUNS, { skip: !mayDelete && !mayRun });
  const [deleteDoeData] = useMutation(DELETE_DOE_DATA);

  if (!mayDelete && !mayRun) {
    return (
      <Denied>
        <h1>Admin only</h1>
        <p>
          You need the canRunRetention or canDeleteDoeData permission to manage DOE
          data.
        </p>
      </Denied>
    );
  }

  const scope = scopeOf(kind, value);
  const key = scope ? `${kind}:${scope.phrase}` : null;
  const planned = plan && plan.key === key;
  const confirmed =
    scope && confirm.trim().toLowerCase() === scope.phrase.toLowerCase();

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const check = () =>
    run(async () => {
      const { data } = await deleteDoeData({ variables: { ...scope.variables, dryRun: true } });
      setPlan({ key, result: data.deleteDoeData });
      setResult(null);
      runs.refetch();
    });

  const exportData = () =>
    run(async () => {
      if (kind === "person") {
        const { data } = await client.query({
          query: DOE_EXPORT_PERSON,
          variables: scope.variables,
          fetchPolicy: "no-cache",
        });
        await downloadPerson(data.doeExportPerson, scope.phrase);
      } else {
        const { data } = await client.query({
          query: DOE_EXPORT_SCHOOL,
          variables: { ...scope.variables, includeRawFiles: false },
          fetchPolicy: "no-cache",
        });
        await downloadSchool(data.doeExportSchool);
      }
    });

  const remove = () =>
    run(async () => {
      const { data } = await deleteDoeData({
        variables: { ...scope.variables, dryRun: false, confirm },
      });
      setResult(data.deleteDoeData);
      setPlan(null);
      setConfirm("");
      runs.refetch();
    });

  const choose = (next) => {
    setKind(next);
    setValue("");
    setConfirm("");
    setPlan(null);
    setResult(null);
    setError(null);
  };

  return (
    <Shell>
      <div>
        <h1>NYC DOE data</h1>
        <p>
          De-identify inactive DOE accounts, and export or delete DOE data for one person
          at DOE&apos;s direction, for one school that stops using MindHive, or all of it
          at termination. Every run is logged below with counts only. Neither
          de-identification nor deletion can be undone.
        </p>
      </div>

      {mayRun && <Deidentification />}

      {mayDelete && (
      <>
      <section>
        <h2>1. Choose what</h2>
        <div className="row">
          {[
            ["person", "One person"],
            ["school", "One school"],
            ["termination", "Termination: all DOE data"],
          ].map(([id, label]) => (
            <label key={id}>
              <input type="radio" name="doe-scope" checked={kind === id} onChange={() => choose(id)} />{" "}
              {label}
            </label>
          ))}
        </div>
        {kind !== "termination" && (
          <input
            type="text"
            placeholder={kind === "person" ? "Email address" : "School code (DBN), e.g. 02M475"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setConfirm("");
            }}
          />
        )}
        {kind === "termination" && (
          <p className="error">
            Termination deletes every DOE account, class, project and study record,
            including shared projects and content kept from de-identified accounts.
            Export each school first.
          </p>
        )}
      </section>

      <section>
        <h2>2. Check and export</h2>
        <div className="row">
          <Button type="button" variant="outline" disabled={!scope || busy} onClick={check}>
            Check what would be deleted
          </Button>
          {kind !== "termination" && (
            <Button type="button" variant="outline" disabled={!scope || busy} onClick={exportData}>
              {kind === "person" ? "Export this person's data" : "Export this school's data"}
            </Button>
          )}
        </div>
        {planned && <Plan result={plan.result} />}
      </section>

      <section className="danger">
        <h2>3. Delete</h2>
        {!planned ? (
          <p>Run the check above first.</p>
        ) : (
          <>
            <p>
              To delete, type <strong>{scope.phrase}</strong> below.
            </p>
            <div className="row">
              <input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <Button type="button" disabled={!confirmed || busy} onClick={remove}>
                Delete permanently
              </Button>
            </div>
          </>
        )}
        {result && <Plan result={result} />}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      </>
      )}

      <section>
        <h2>Run history</h2>
        <p>
          Every de-identification run, check and deletion. Print a deletion to attach to
          the Certificate of Records Disposal.
        </p>
        <table>
          <thead>
            <tr>
              <th>Started</th>
              <th>Reason</th>
              <th>Scope</th>
              <th>Dry run</th>
              <th>Verified</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(runs.data?.retentionRuns || []).map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.startedAt).toLocaleString()}</td>
                <td>{TRIGGERS[r.trigger] || r.trigger}</td>
                <td>{r.scope}</td>
                <td>{r.dryRun ? "yes" : "no"}</td>
                <td>{r.dryRun ? "" : r.verified ? "yes" : "no"}</td>
                <td>
                  <Button type="button" variant="outline" onClick={() => printRun(r)}>
                    Print record
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
