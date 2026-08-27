// Corrections to the August 2026 batch. Touches only entries created or edited
// in that batch.
//
// Point 5 matters more than it looks. The interview and ask prompts build story
// context as `fullStory || [situation, obstacle, action, result]`, so whenever
// full_story exists the result field is never sent to the model at all. Every
// entry here has a full_story, which means an outcome recorded only in `result`
// is invisible. The wins are therefore written into the closing sentences of
// full_story, not just into result.
const fs = require('fs');
const path = require('path');

function loadEnvLocal(file) {
  let text; try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trimStart().startsWith('#')) continue;
    process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnvLocal(path.join(__dirname, '..', '.env.local'));

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

// ── 1. Land Transfer Tax ──────────────────────────────────
// The agency is recorded, but deliberately in notes rather than in the
// narrative fields. Adam's instruction is that the name must not be used in
// interview or written material until confirmed, and the narrative fields are
// exactly what feeds generation. "The provincial tax authority" is accurate
// either way and safe to speak aloud.
const LTT = {
  obstacle: 'The push came from inside the organization, not from the provincial tax authority. If the interpretation stood, my team would have absorbed the workload and the client anger, and then absorbed both again when the position reversed. Deloitte, as external advisor, had reviewed the ruling and concluded it had to be accepted, so the organizational instinct was to comply and move on.',
  action: 'Pushed back on Enterprise Finance directly rather than passing the instruction down to my team. Drew on my State Street experience challenging Big Four tax partners to argue the interpretation was wrong on the technical merits, and pressed for the question to be put to the provincial tax authority rather than settled internally.',
  result: 'Resolution came on a single call with Enterprise Finance, Deloitte and the provincial tax authority. The decision was reversed. Triple taxation was avoided, no retroactive charge was made to investors, and roughly one percent of annual client returns was protected.',
  full_story: 'This one is about refusing to pass an instruction down to my team when I believed the instruction was wrong. Enterprise Finance wanted Private Markets to retroactively charge investors based on a reading of a Land Transfer Tax change that would have triple taxed every capital flow event, worth about one percent of annual client returns. Deloitte had reviewed it and concluded it had to be accepted, and there is a strong gravitational pull toward accepting that and moving on. What made it worse was the shape of the work: my team would have taken the workload and the client anger, and then taken both again when the position inevitably reversed. I had challenged Big Four tax partners before at State Street, so I knew that a firm concluding something is not the same as it being correct. I pushed back on Enterprise Finance directly and argued the question belonged in front of the provincial tax authority rather than being settled internally. It resolved on one call, with Enterprise Finance, Deloitte and the tax authority on the line, and the decision was reversed. No retroactive charge was made to investors and the one percent stayed with clients.',
  notes: 'Pinnacle Award. One of the most distinctive regulatory advocacy stories.\n\n' +
    'VERIFICATION: verified, with the single exception below.\n' +
    'LOW CONFIDENCE, AGENCY NAME ONLY: Adam believes the authority was the Ontario Ministry of Finance, which is consistent with Land Transfer Tax being provincial, but he is not certain. The name is recorded here and deliberately kept out of every narrative field, because those fields feed interview answers and generated documents. Do not use the agency name in an interview or in written material until it is confirmed. Every other element of this entry is confirmed.',
};

// ── 2. Raymond: this is a win, not a loss ─────────────────
const RAYMOND = {
  title: 'Forcing a Two-Year Automation Stall to Close in Thirty Days',
  situation: 'The manual reporting process should never have been Raymond\'s. He inherited it after another employee was let go. Another team had committed to taking it over and deferred repeatedly, hiding behind an automation project that was roughly two years overdue. Raymond had already agreed to carry it for one more quarter three or four times.',
  obstacle: 'Raymond wanted to stop immediately, and on that narrow point I agreed with the organization rather than with him. You do not transition a manual process when automation is close, even when the timeline has slipped repeatedly, because you pay the transition cost twice. So the specific thing he was asking for was the one thing I could not win for him.',
  action: 'Told Raymond candidly that I had his back and would escalate, that on the immediate ask we would lose, and exactly why I agreed with the organization on that point. Escalated anyway and brought my own manager in, who also backed Raymond. Then, in the conversation with the other team, we changed what was being negotiated. Rather than accept another open-ended deferral we set a hard limit: one more quarter and no longer, and if automation was not ready by then, billing would fall behind. A dated consequence instead of another promise.',
  result: 'The automation project, two years overdue, completed the following month. Raymond did not get the immediate stop he asked for, but he never carried the process another quarter, and the stall that had run for two years closed in thirty days.',
  impact: 'Two-year automation stall closed in 30 days; manual process permanently off the team',
  full_story: 'Raymond had been running a manual reporting process that was never supposed to be his. He inherited it when another employee was let go, and another team had been promising to take it over for two years, always deferring behind an automation project that kept slipping. He had already agreed to do it for one more quarter three or four times, which is the part that made him angry, and he was right to be. He wanted to stop immediately. On that narrow point I agreed with the organization rather than with him, because you do not transition a manual process when automation is close, even when the timeline has slipped as often as that one had. So I told him exactly that: I have your back, I am going to escalate this, on the immediate ask we are going to lose, and here is why I think they are right about that specific thing. Then I escalated, and I brought my own manager in, and he backed Raymond too. The part that mattered was what we did in the room. We stopped arguing about whether Raymond should keep doing it and started attaching a consequence to the next deadline. One more quarter, and not one day longer, and if the automation was not ready by then, billing falls behind. That was the pivot: a dated consequence instead of another open-ended promise. The automation project, two years overdue, was finished the following month. Raymond did not get what he asked for. He asked to stop that day and he did not get that. What he got was that it actually ended, thirty days later, after two years of it never ending.',
  themes: ['Team Defense', 'Standing Ground', 'Forced Resolution', 'Candid Leadership', 'People Leadership'],
  skills: ['people leadership', 'candour', 'escalation', 'negotiation', 'operational judgement'],
  use_for: ['Resume', 'Interview', 'Book'],
  notes: 'DELIVERY NOTE: this story must be told through to the completion of the automation project. Told without the ending it reads as accommodation, and telling it that way has previously cost Adam an interview. The win is the last two sentences of full_story: a dated consequence replaced an open-ended deferral, and a two-year stall closed in thirty days.\n\n' +
    'VERIFICATION: verified\n' +
    'CORROBORATION: Adam\'s manager at the time, Charles-Antoine Laplante, was in the escalation and backed Raymond. The name is kept here rather than in the narrative, because "I brought my manager in" is the better delivery in an interview and avoids naming a private individual to a stranger.\n' +
    'Employer not specified.',
};

// ── 3. US BI: one clean event, outcome confirmed ──────────
const USBI = {
  title: 'Forcing a Public Correction After an Analyst Was Blamed in a Group Thread',
  situation: 'When AIR launched it displaced work other teams had been doing, and the partner BI team pushed back. That included claims that my group had taken their work, and requests that our dashboards be pulled.',
  obstacle: 'In a group email thread, the leader on the other side named one of my analysts as responsible for an error. The accusation was made in front of an audience, which meant a private correction to me would have left the analyst carrying it in the eyes of everyone who had read the thread.',
  action: 'Went at it directly with her, and insisted that the correction be made in the same thread where the accusation had been made rather than privately to me.',
  result: 'She replied all and acknowledged that the error was hers. The correction reached exactly the audience that had seen the accusation.',
  impact: 'Public accusation against an analyst publicly retracted in the same thread',
  full_story: 'When AIR launched it displaced work that other teams had been doing, and the partner BI team pushed back on it: claims that we had taken their work, requests that our dashboards be pulled. In one group email thread, the leader on the other side named one of my analysts as responsible for an error. That is the part I would not let go. The accusation was public, so a private apology to me would have been worthless, because it would not have reached a single person who had read the thread. I went at it with her directly and I insisted the correction be made in the same thread, not to me. She replied all and acknowledged the error was hers. The correction landed in front of the same audience as the accusation, which is the only place it was worth anything.',
  themes: ['Team Defense', 'Standing Ground', 'Peer Conflict', 'Public Correction'],
  skills: ['people leadership', 'conflict resolution', 'stakeholder management'],
  use_for: ['Interview', 'Book'],
  notes: 'Confirmed by Adam 2026-08-27. Outcome verified: she replied all and acknowledged the error was hers.\n\n' +
    'VERIFICATION: verified\n' +
    'SCOPE, BINDING: hold this as ONE clean event. Do not record or tell the wider pattern of repeat incidents, the occasions where a correction was promised and not delivered, or the separate escalation involving her manager. Do not record any individual\'s name.\n' +
    'Employer not specified, though the AIR context indicates Manulife.',
};

// ── 4. The director's desk: separate event, its own entry ─
const DESK = {
  id: 'soar_077_directors_desk_withheld_file',
  type: 'leadership',
  title: 'Standing at a Director\'s Desk Until the File Was Sent',
  employer: '',
  situation: 'A US partner team was withholding data my group needed. The withholding was friction against the AIR platform we had built and they did not like, rather than anything technical.',
  obstacle: 'Email had not moved it. Requests were unanswered or deferred, and there was no technical reason the file could not be produced, which meant there was nothing to solve and nothing to escalate on the merits.',
  action: 'Went to the director\'s desk in person. Told him I wanted to understand the challenge, and asked whether he could run the process while I watched. Then stood there while he did it.',
  result: 'The file was sent while I was standing at his desk. What email had not achieved in weeks took one visit, because in person the absence of a real obstacle became obvious to both of us.',
  impact: 'Withheld data released in person after email had failed for weeks',
  full_story: 'A US partner team was sitting on data we needed. It was not a technical problem. They did not like the AIR platform we had built, it had displaced work they had been doing, and withholding the file was the friction available to them. Email was never going to fix that, because every email got an answer that was technically responsive and produced nothing. So I flew at it the other way: I went to the director\'s desk and stood there. I told him I wanted to understand the challenge, and I asked if he would run the process while I watched. That question is the whole story, because it is impossible to answer badly. If there is a real problem, I see it and I help. If there is not, we both find that out together while I am standing there. He ran it. The file was sent while I stood at his desk.',
  themes: ['Team Defense', 'Standing Ground', 'In-Person Confrontation', 'Peer Conflict'],
  skills: ['stakeholder management', 'conflict resolution', 'persistence', 'political navigation'],
  use_for: ['Interview', 'Book'],
  date_added: '2026-08-27',
  notes: 'Confirmed by Adam 2026-08-27 as a SEPARATE event from soar_d03_data_lake_governance, not the same story told twice.\n\n' +
    'VERIFICATION: verified\n' +
    'RELATED BUT SEPARATE: soar_d03_data_lake_governance (Ben / EDL governance / CDO exception). Both involve a partner team withholding data as friction against AIR, which is why they look alike. They are different events with different people and different resolutions: that one was resolved by an IM and a call, this one in person at a desk. Do not merge them in any future cleanup pass.\n' +
    'Employer not specified, though the AIR context indicates Manulife.',
};

async function patch(id, body) {
  const r = await fetch(URL + '/rest/v1/stories?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(body),
  });
  console.log((r.ok ? 'ok   ' : 'FAIL ') + id + (r.ok ? '' : ' -> ' + r.status + ' ' + (await r.text()).slice(0, 180)));
}

(async () => {
  console.log('--- 1. Land Transfer Tax ---');
  await patch('soar_o02_ltt_ruling_reversal', LTT);

  console.log('\n--- 2. Raymond, reframed as a win ---');
  await patch('soar_075_raymond_manual_handoff', RAYMOND);

  console.log('\n--- 3. US BI, one confirmed event ---');
  await patch('soar_076_us_bi_platform_conflict', USBI);

  console.log('\n--- 4. Director\'s desk, new separate entry ---');
  const r = await fetch(URL + '/rest/v1/stories', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([DESK]),
  });
  console.log((r.ok ? 'ok   ' : 'FAIL ') + DESK.id + (r.ok ? '' : ' -> ' + r.status + ' ' + (await r.text()).slice(0, 180)));

  console.log('\n--- 5. Ben entry: disambiguation resolved, cross-reference added ---');
  const ben = (await (await fetch(URL + '/rest/v1/stories?select=id,notes&id=eq.soar_d03_data_lake_governance', { headers: H })).json())[0];
  const kept = String(ben.notes || '').split('\nVERIFICATION:')[0].trim();
  await patch('soar_d03_data_lake_governance', {
    notes: kept + '\n\nVERIFICATION: verified\n' +
      'FRAMING: works two ways. As obstacle clearing, the beat is forcing an unowned decision into the open so it could be changed. As team defense, the beat is that his team was silently carrying the blame for a six-month delay caused by someone else\'s unmade decision, and Adam put their exoneration in writing to both teams\' leaders. Do not tell this as accommodation or as giving Ben cover so he would feel comfortable.\n' +
      'RELATED BUT SEPARATE: soar_077_directors_desk_withheld_file. Adam confirmed 2026-08-27 that the director\'s desk incident is a different event, not this one retold. Both involve a partner team withholding data as friction against AIR, which is why they look alike, but this one resolved by IM and a call and that one in person at a desk. Do not merge them in any future cleanup pass.',
  });

  console.log('\ndone');
})();
