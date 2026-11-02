// Monthly DOE de-identification, under admins' control
// (keystone/mutations/runDeidentification.ts):
//   - "Run automatically" lets the monthly schedule act on its own; off by
//     default, the schedule then only previews and logs;
//   - Preview lists who would be warned or de-identified now;
//   - Approve and run acts on the ticked accounts only, after typing APPROVE.
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import Button from "../../../DesignSystem/Button";
import ToggleSwitch from "../../../DesignSystem/ToggleSwitch";
import {
  RETENTION_RUNS,
  RETENTION_SETTINGS,
  RUN_DEIDENTIFICATION,
  SET_AUTO_DEIDENTIFY,
} from "../../../Queries/DoeData";

const APPROVE_PHRASE = "APPROVE";
const ACTIONS = { warn: "Warning email", deidentify: "De-identify" };
const day = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export default function Deidentification() {
  const settings = useQuery(RETENTION_SETTINGS);
  const [setAuto, { loading: switching }] = useMutation(SET_AUTO_DEIDENTIFY, {
    refetchQueries: [{ query: RETENTION_SETTINGS }],
  });
  const [runJob] = useMutation(RUN_DEIDENTIFICATION, {
    refetchQueries: [{ query: RETENTION_RUNS }],
  });

  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const auto = !!settings.data?.doeRetentionSettings?.autoDeidentify;
  const accounts = useMemo(() => preview?.accounts || [], [preview]);

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

  const doPreview = () =>
    run(async () => {
      const { data } = await runJob({ variables: { dryRun: true } });
      const next = data.runDeidentification;
      setPreview(next);
      setSelected(new Set((next.accounts || []).map((a) => a.id)));
      setConfirm("");
      setResult(null);
    });

  const approve = () =>
    run(async () => {
      const { data } = await runJob({
        variables: { dryRun: false, profileIds: [...selected] },
      });
      setResult(data.runDeidentification);
      setPreview(null);
      setSelected(new Set());
      setConfirm("");
    });

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const settingsInfo = settings.data?.doeRetentionSettings;

  return (
    <section>
      <h2>Monthly de-identification</h2>
      <p>
        DOE accounts with no sign-in for 23 months get a warning email; 30 days after the
        warning, accounts with no sign-in for two years are de-identified. Nothing happens
        unless an admin approves it here, or turns on automatic runs.
      </p>

      <ToggleSwitch
        checked={auto}
        loading={switching || settings.loading}
        onChange={(enabled) =>
          run(() => setAuto({ variables: { enabled } }))
        }
        label={
          auto
            ? "Runs automatically on the 1st of each month"
            : "Automatic runs are off: the monthly run only previews"
        }
        aria-label="Run de-identification automatically each month"
      />
      {settingsInfo?.updatedAt && (
        <p>
          Last changed {day(settingsInfo.updatedAt)}
          {settingsInfo.updatedBy ? ` by ${settingsInfo.updatedBy}` : ""}.
        </p>
      )}

      <div className="row">
        <Button type="button" variant="outline" disabled={busy} onClick={doPreview}>
          Preview who is due now
        </Button>
      </div>

      {preview && (
        <>
          <p>
            {accounts.length
              ? `${accounts.length} accounts are due. Untick any you do not approve.`
              : "Nobody is due right now."}
            {preview.guestsStripped
              ? ` ${preview.guestsStripped} old guest records in DOE studies would lose their age and zip code.`
              : ""}
            {preview.dueLeftForNextRun
              ? ` ${preview.dueLeftForNextRun} more are due and will appear after this batch.`
              : ""}
          </p>
          {accounts.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Account</th>
                  <th>Action</th>
                  <th>Last sign-in</th>
                  <th>Warned</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Approve ${a.username}`}
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                      />
                    </td>
                    <td>{a.username}</td>
                    <td>{ACTIONS[a.action] || a.action}</td>
                    <td>{day(a.lastSignInAt)}</td>
                    <td>{day(a.warnedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {selected.size > 0 && (
            <div className="row">
              <span>
                Type <strong>{APPROVE_PHRASE}</strong> to act on {selected.size} accounts:
              </span>
              <input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <Button
                type="button"
                disabled={busy || confirm.trim() !== APPROVE_PHRASE}
                onClick={approve}
              >
                Approve and run
              </Button>
            </div>
          )}
        </>
      )}

      {result && (
        <p className="ok">
          Done: {result.warned} warned, {result.warnedWithoutEmail} without an email address,{" "}
          {result.warningFailed} warnings failed (retried next time), {result.deidentified}{" "}
          de-identified, {result.guestsStripped} guest records cleaned.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
