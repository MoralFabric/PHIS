// Follow-up to apply_soar_updates_2026_08.js.
//
// 1. Reframe the Ben story. The recorded account keeps its details, since it
//    was written closer to the event. What changes is the frame: it read as a
//    pure influence-and-obstacle-clearing story, and it needs to also work as
//    a story about backing your team. Only the parts of the later recollection
//    that do NOT contradict the record are folded in. The in-person office
//    visit is still excluded: the record says IM plus a call.
// 2. soar_l02_impasse_resolution is the same event, retired as a duplicate so
//    the un-reframed version cannot be selected instead.
// 3. Strip the snake_case TAGS lines. They were an artifact of a Claude Chat
//    hand-off format, not something this schema uses. Where a tag carried a
//    real requirement it moves into `themes`, which the interview prompt
//    actually reads.
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

async function patch(id, body) {
  const r = await fetch(URL + '/rest/v1/stories?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(body),
  });
  console.log((r.ok ? 'ok   ' : 'FAIL ') + id + (r.ok ? '' : ' -> ' + r.status + ' ' + (await r.text()).slice(0, 180)));
}

// ── 1. Ben, canonical record, reframed ────────────────────
const BEN = {
  title: 'Data Lake Governance - Forcing an Unowned Decision Into the Open and Clearing My Team',
  situation: 'A client-facing report used by distribution RMs for plan design reviews had stopped working after the CDO organization introduced rules separating Production from non-production EDL environments. The report had been built years earlier on Advanced Analytics data sources. My director Tom had been trying to get it fixed for six months, and his escalations were going unanswered. In the meantime the delay was being read as my group failing to deliver.',
  obstacle: 'The underlying governance rule was legitimate and commercial: it existed to keep unvetted data out of client reporting, and I was not trying to overturn it. The problem was that nobody owned the decision about the exception. Ben, the head of Advanced Analytics, understood the risk to his team of being seen to circumvent the CDO rules, so he had gone quiet, offering workarounds that never materialised. Six months of that had calcified into a standoff where the cost was landing on my team and the decision was landing on nobody.',
  action: 'Identified the likely root cause through a casual conversation with the VP of the CDO team: the new PROD versus non-PROD rules and their unintended effect on the Advanced Analytics report. Set up a meeting with Ben. He did not attend. Set up another. He did not attend again. Sent him a direct IM naming plainly that he appeared to be avoiding the meeting, and that I thought I understood why. He responded immediately and offered time, and I confirmed the meeting the day before so it could not slip again. In the meeting I made him state what he was actually doing and why, rather than leave it as silence: a data governance rule barred use of EDL data from that hive in end production reporting, and he considered the decision final. That was the point of the exercise, because an unstated decision cannot be challenged. Then I asked whether a CDO sign-off on an exception, pending migration of the data to the correct hive, would satisfy him.',
  result: 'Email sign-off came from the COO and the CDO VP within the hour, with Ben and his manager copied, and the process was restored the next day. A six-month impasse closed in 48 hours without the costly rebuild. Afterward I sent a note to the leaders of both teams about the cost of withholding bad news, partly on principle and partly so that my own team was visibly and explicitly cleared of responsibility for the six-month delay.',
  impact: '6-month impasse resolved in 48 hours; client-facing report restored without a rebuild; team publicly cleared of blame for the delay',
  full_story: 'The thing I want to be clear about is that I was not fighting the policy. The rule that blocked us was a good rule, and it existed for a commercial reason: keep data that has not been vetted out of anything a client sees. What I was fighting was that the decision had no owner. Tom had been sending the right requests to the right people for six months and getting partial answers, and in the absence of a decision the delay was quietly being attributed to my group. That is the part that made it my problem rather than a process problem. Ben was not being obstructive for its own sake. He was carrying a compliance risk that nobody had offered to take off him, so silence was his safest option. Two missed meetings told me that. The IM I sent named the avoidance directly, without accusation, because a thing that is not said cannot be resolved. When we finally spoke, the work was making him state the position out loud: the rule barred that hive from production reporting and as far as he was concerned it was settled. Once it was stated, it could be challenged, and the challenge was simple: would a CDO sign-off on an exception, pending migration to the right hive, cover him? It would. The sign-offs came back inside the hour. The last step was the one that mattered most to me. I wrote to the leaders of both teams about what it costs an organisation when people sit on bad news, and I did it in a way that put on the record that the six months had not been my team absorbing a failure of their own. They had been carrying someone else\'s unmade decision, and I was not willing to let that stand as their reputation.',
  themes: ['Team Defense', 'Standing Ground', 'Political Navigation', 'Influence', 'Data Governance'],
  skills: ['stakeholder management', 'political navigation', 'conflict resolution', 'influence', 'data governance', 'protecting the team'],
  use_for: ['Resume', 'Interview', 'Cover Letter', 'Book'],
  notes: 'One of the best influence and political navigation stories, and it doubles as a backing-your-team story.\n\n' +
    'VERIFICATION: verified\n' +
    'FRAMING: works two ways. As obstacle clearing, the beat is forcing an unowned decision into the open so it could be changed. As team defense, the beat is that his team was silently carrying the blame for a six-month delay caused by someone else\'s unmade decision, and Adam put their exoneration in writing to both teams\' leaders. Do not tell this as accommodation or as giving Ben cover so he would feel comfortable; that framing is wrong and understates it.\n' +
    'NOT INCLUDED: a later recollection described a cancelled coffee and Adam going to the director\'s office in person. That contradicts this record (two missed meetings, a direct IM, then a call) and has been left out, as this account was written closer to the event. Adam has separately described standing at a US BI director\'s desk until a withheld file was sent; that may be a genuinely separate event and is NOT yet in the library.',
};

// ── 2. duplicate ──────────────────────────────────────────
const DUP_NOTE =
  'RETIRED as a duplicate 2026-08-26. This is the same event as soar_d03_data_lake_governance ' +
  '(Tom, Ben, PROD versus non-PROD, six months closed in 48 hours). The canonical record is ' +
  'soar_d03_data_lake_governance, which carries the corrected framing. use_for cleared so this ' +
  'copy is not selected. Kept rather than deleted, per the library convention of retiring instead of deleting.';

// ── 3. strip the snake_case TAGS lines ────────────────────
const TAGGED = ['soar_o02_ltt_ruling_reversal', '23', 'soar_074_access_persons_designation',
  'soar_075_raymond_manual_handoff', 'soar_076_us_bi_platform_conflict'];

(async () => {
  console.log('--- Ben canonical record reframed ---');
  await patch('soar_d03_data_lake_governance', BEN);

  console.log('\n--- duplicate retired ---');
  await patch('soar_l02_impasse_resolution', { use_for: [], notes: DUP_NOTE });

  console.log('\n--- stripping TAGS lines ---');
  const rows = await (await fetch(URL + '/rest/v1/stories?select=id,notes&id=in.(' +
    TAGGED.map(t => '"' + t + '"').join(',') + ')', { headers: H })).json();
  for (const r of rows) {
    const cleaned = String(r.notes || '')
      .split('\n').filter(l => !/^TAGS:/.test(l.trim())).join('\n')
      .replace(/\n{3,}/g, '\n\n').trim();
    await patch(r.id, { notes: cleaned });
  }

  // Raymond's tag carried a real selection requirement, so move it into themes,
  // which is surfaced to the interview prompt. notes is not.
  console.log('\n--- Raymond: losing-position signal into themes ---');
  await patch('soar_075_raymond_manual_handoff', {
    themes: ['Team Defense', 'Candid Leadership', 'People Leadership', 'Loyalty Without Winning'],
  });

  console.log('\ndone');
})();
