import { useMemo, useState } from 'react';
import { AssistantContext } from '../assistant/context';
import { createMockAssistant } from '../assistant/mock';
import { HandshakeContext } from './context';
import { DoctorConnect } from './DoctorConnect';
import { MatchesContext } from '../matches/context';
import { createMockMatchesApi } from '../matches/mock';
import { createMockWorld } from './mock';
import { PatientShare } from './PatientShare';
import './handshake.css';

/**
 * `/preview/handshake`: the patient's screen and the doctor's screen side by side, on one in-memory server
 * (mock.ts). Nothing here reaches a network. Synthetic people only. The controls drive the world so every state
 * can be looked at: a 60 s grant to watch it end by itself, Realtime silenced so only the 2 s poll works,
 * and a server clock 90 s away from this device's.
 */
export function HandshakePreview() {
  const [run, setRun] = useState(0);
  const { world, api } = useMemo(() => createMockWorld({ grantSeconds: 60 }), [run]);
  const [grantSeconds, setGrantSeconds] = useState(60);
  const [codeLife, setCodeLife] = useState(120);
  const [skew, setSkew] = useState(0);
  const [realtime, setRealtime] = useState(true);
  world.grantSeconds = grantSeconds;
  world.codeSeconds = codeLife;
  world.skewMs = skew * 1000;
  world.realtime = realtime;

  const assistant = useMemo(() => createMockAssistant(), [run]);
  const matches = useMemo(() => createMockMatchesApi(true), [run]); // the doctor's panel in the workspace: this patient has opted in
  const patient = useMemo(() => ({ api, home: '/preview/handshake', preview: true }), [api]);
  const doctor = patient;

  return (
    <div className="hs-preview">
      <h1>Handshake preview</h1>
      <p className="muted">Synthetic people. One in-memory server for both sides. Nothing reaches a network.</p>
      <div className="hs-controls" data-testid="preview-controls">
        <label>
          Grant length
          <select value={grantSeconds} onChange={(e) => setGrantSeconds(Number(e.target.value))} data-testid="preview-grant">
            <option value={20}>20 seconds</option>
            <option value={60}>1 minute</option>
            <option value={900}>15 minutes</option>
          </select>
        </label>
        <label>
          Next code lasts
          <select value={codeLife} onChange={(e) => setCodeLife(Number(e.target.value))} data-testid="preview-code-life">
            <option value={120}>120 seconds</option>
            <option value={5}>5 seconds</option>
          </select>
        </label>
        <label>
          Server clock
          <select value={skew} onChange={(e) => setSkew(Number(e.target.value))} data-testid="preview-skew">
            <option value={0}>same as this device</option>
            <option value={90}>90 s ahead</option>
            <option value={-90}>90 s behind</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={!realtime} onChange={(e) => setRealtime(!e.target.checked)} data-testid="preview-silent" /> Realtime silent
        </label>
        <button type="button" onClick={() => world.lastCode && window.dispatchEvent(new CustomEvent('hs-preview-scan', { detail: world.lastCode.token }))} data-testid="preview-scan">
          Simulate scan
        </button>
        <button type="button" onClick={() => setRun((n) => n + 1)} data-testid="preview-reset">
          Reset
        </button>
      </div>
      <div className="hs-panes" key={run}>
        <section className="hs-pane">
          <h2>Patient: Maria Papadopoulou</h2>
          <div className="hs-pane-box" data-testid="pane-patient">
            <HandshakeContext.Provider value={patient}>
              <PatientShare />
            </HandshakeContext.Provider>
          </div>
        </section>
        <section className="hs-pane">
          <h2>Doctor: Dr. Eleni Raptis</h2>
          <div className="hs-pane-box" data-testid="pane-doctor">
            <HandshakeContext.Provider value={doctor}>
              <AssistantContext.Provider value={assistant}>
                <MatchesContext.Provider value={matches}>
                  <DoctorConnect />
                </MatchesContext.Provider>
              </AssistantContext.Provider>
            </HandshakeContext.Provider>
          </div>
        </section>
      </div>
    </div>
  );
}
