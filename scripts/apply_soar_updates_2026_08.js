// SOAR library update, August 2026.
//
// Applies corrections, new entries and verification changes to the `stories`
// table. Deliberately does NOT rewrite the Ben / EDL governance story: the
// requested correction contradicts the recorded account on a load-bearing
// detail (see BEN_CONFLICT below), and resolving that by overwriting would
// destroy a verified narrative. That entry gets flags and a question instead.
//
// There is no `tags` or `verification` column on `stories`, and PostgREST
// cannot run DDL, so both are folded into `notes` using the structured
// convention already used for USAGE WARNING / NOT GENERATION READY.
// scripts/migration_005_story_tags.sql promotes them to real columns.
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
if (!URL || !KEY) { console.error('Missing Supabase env vars'); process.exit(1); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const meta = ({ tags, verification, flag }) => [
  tags ? 'TAGS: ' + tags.join(', ') : null,
  verification ? 'VERIFICATION: ' + verification : null,
  flag ? 'FLAG FOR ADAM: ' + flag : null,
].filter(Boolean).join('\n');

// ── A1. Land Transfer Tax ─────────────────────────────────
// The recorded version casts Deloitte and the ministry as the adversary and
// omits the internal conflict entirely. The real trigger was Enterprise
// Finance. Every agency name is stripped: the entry said Ontario Ministry of
// Finance, Adam recently said CRA, and LTT is provincial, so one of those is
// wrong and neither gets written until he confirms.
const LTT = {
  id: 'soar_o02_ltt_ruling_reversal',
  title: 'LTT Ruling Reversal - Standing Against Enterprise Finance to Protect 1% of Client Returns',
  situation: 'Enterprise Finance asked Private Markets to retroactively charge investors under an interpretation of a Land Transfer Tax rule change that triple taxed every capital flow event. The cost was roughly one percent of annual client returns.',
  obstacle: 'The push came from inside the organization, not from the tax authority. If the interpretation stood, my team would have absorbed the workload and the client anger, and then absorbed both again when the position reversed. Deloitte, as external advisor, had reviewed the ruling and concluded it had to be accepted, so the organizational instinct was to comply and move on.',
  action: 'Pushed back on Enterprise Finance directly rather than passing the instruction down to my team. Drew on my State Street experience challenging Big Four tax partners to argue the interpretation was wrong on the technical merits, and pressed for the question to be put to the tax authority rather than settled internally.',
  result: 'Resolution came on a single call with Enterprise Finance, Deloitte and the regulator. The decision was changed. Triple taxation was avoided and roughly one percent of annual client returns was protected.',
  impact: '~1% annual client returns protected; retroactive investor charges avoided; Pinnacle Award for Service Excellence',
  full_story: 'This one is about refusing to pass an instruction down to my team when I believed the instruction was wrong. Enterprise Finance wanted Private Markets to retroactively charge investors based on a reading of a Land Transfer Tax change that would have triple taxed every capital flow event, worth about one percent of annual client returns. Deloitte had reviewed it and concluded it had to be accepted, and there is a strong gravitational pull toward accepting that and moving on. What made it worse was the shape of the work: my team would have taken the workload and the client anger, and then taken both again when the position inevitably reversed. I had challenged Big Four tax partners before at State Street, so I knew that a firm concluding something is not the same as it being correct. I pushed back on Enterprise Finance directly and argued the question belonged in front of the tax authority rather than being settled internally. It resolved on one call, with Enterprise Finance, Deloitte and the regulator on the line. The decision was changed.',
  themes: ['Regulatory Strategy', 'Standing Ground', 'Team Defense', 'Political Navigation'],
  skills: ['tax strategy', 'regulatory engagement', 'technical analysis', 'advocacy', 'stakeholder challenge'],
  use_for: ['Resume', 'Interview', 'Book'],
  notes: 'Pinnacle Award. One of the most distinctive regulatory advocacy stories.\n\n' + meta({
    tags: ['stood_ground', 'challenged_external_advisor', 'team_defense', 'commercial_mindset'],
    verification: 'verification_needed',
    flag: 'Which authority was this? The previous version of this entry said Ontario Ministry of Finance. Adam recently recounted it as CRA. Land Transfer Tax is provincial, so those cannot both be right. All agency names have been removed and replaced with "the tax authority" / "the regulator" until Adam confirms. Do not reinstate a name without confirmation.',
  }),
};

// ── B3. Abusive client, State Street ──────────────────────
// Confirmed by Adam. Seed-unreliable note and the Book-only restriction are
// cleared. No individual or client firm name is recorded.
const ABUSIVE = {
  id: '23',
  title: 'Standing Up to an Abusive Client',
  situation: 'I inherited an account whose client-side manager had a long-standing reputation for berating staff. It had been tolerated for years because the account was significant and because that was simply how he was known to be.',
  obstacle: 'The power imbalance was real. The client was commercially important and internal leaders had been reluctant to act on the behaviour for years, which had taught everyone that tolerating it was the expected response.',
  action: 'On my first day on the account, the manager went after a junior member of my team. I stopped the call and said it would not continue until he spoke to the team respectfully. I documented the incident and escalated it rather than letting it pass.',
  result: 'Leadership backed the position. The client was formally warned, and the behaviour stopped permanently.',
  impact: 'Long-tolerated client abuse of staff ended permanently; formal warning issued with internal leadership backing',
  full_story: 'I inherited an account where the client-side manager had a reputation for berating staff that went back years. Everyone knew, and everyone had absorbed it, because the account mattered and because leadership had never moved on it. On my first day on the account he went after one of my junior people. I stopped the call and told him it would not continue until he spoke to the team respectfully. Then I documented it and escalated it, which mattered more than the moment on the call, because a moment passes and a record does not. Leadership backed me. The client was formally warned and the behaviour stopped, permanently. The part I think about is not the confrontation. It is that it had been allowed to run for years before someone new arrived and simply declined to accept it.',
  themes: ['Ethical Judgment', 'People Leadership', 'Team Defense', 'Standing Ground'],
  skills: ['ethical judgment', 'people leadership', 'crisis leadership', 'resilience', 'advocacy'],
  use_for: ['Resume', 'Interview', 'Cover Letter', 'Book'],
  notes: 'Confirmed by Adam 2026-08-26. Previously flagged as unreliable seed content and restricted to Book; both cleared.\n\n' + meta({
    tags: ['stood_ground', 'team_defense', 'ethical_judgment'],
    verification: 'verified',
    flag: 'Do not record the individual manager\'s name or the client firm\'s name in this entry, in any field.',
  }),
};

// ── C4. Access persons designation ────────────────────────
const ACCESS = {
  id: 'soar_074_access_persons_designation',
  type: 'leadership',
  title: 'Access Persons Designation - Removing the Requirement Rather Than Asking the Team to Absorb It',
  employer: '',
  situation: 'My team was newly designated as access persons, which brought personal trading restrictions and reporting obligations. They experienced it as being surveilled, and morale dropped.',
  obstacle: 'The designation was legitimate and the compliance rationale was sound. The easy path was to explain the rule and ask the team to live with it, which is what a designation like this normally means.',
  action: 'Brought Compliance in to explain the rationale directly to the team, including the post-2008 insider trading context that drove it. The team still objected, and when I listened to the objection I judged it substantively sound rather than merely uncomfortable. Rather than ask them to absorb something I agreed was wrong for them, I changed their underlying information access so the designation no longer applied to their roles.',
  result: 'The access persons requirement was lifted for the team. The compliance concern was satisfied because the underlying exposure had genuinely been removed, not argued away.',
  impact: 'Access persons designation lifted for the team by removing the underlying data exposure rather than contesting the rule',
  full_story: 'My team got designated as access persons and they hated it. It felt like surveillance to them. My first move was to bring Compliance in to explain why the rule existed, including the post-2008 insider trading history behind it, on the theory that understanding the reason would make it tolerable. It did not. They still objected, and when I actually listened to the objection I thought they were right on the merits, not just unhappy. That is the fork. I could ask them to absorb something I agreed was wrong, which costs you credibility every time, or I could change the facts. So I changed their underlying information access so that the designation no longer applied to their roles. The requirement was lifted. Compliance was satisfied because the exposure was genuinely gone rather than argued away. If you agree with your team, the job is to change the situation, not to sell them the situation.',
  themes: ['Team Defense', 'Standing Ground', 'People Leadership', 'Compliance'],
  skills: ['people leadership', 'compliance', 'stakeholder management', 'problem solving'],
  use_for: ['Interview', 'Book'],
  date_added: '2026-08-26',
  notes: meta({
    tags: ['team_defense', 'stood_ground', 'structural_solution'],
    verification: 'verified',
    flag: 'Employer left blank because it was not specified. Witness: Charles-Antoine Laplante, Adam\'s manager at the time. The witness name is recorded here for verification only and is deliberately kept out of the narrative fields so the interview AI cannot recite it.',
  }),
};

// ── C5. Raymond and the manual reporting handoff ──────────
const RAYMOND = {
  id: 'soar_075_raymond_manual_handoff',
  type: 'leadership',
  title: 'Backing a Direct Report in a Fight We Were Going to Lose',
  employer: '',
  situation: 'Another team had promised for two years to take over a manual reporting process from us and kept deferring. Raymond, one of my direct reports, wanted to formally refuse to continue running it.',
  obstacle: 'I agreed with the organization, not with Raymond. You do not transition a manual process when automation is imminent, even when the automation timeline has slipped repeatedly. So I was being asked to escalate a position I expected to lose and privately thought was the wrong call operationally.',
  action: 'Told Raymond candidly that I had his back and would escalate, that we would lose, and exactly why I agreed with the organization\'s reasoning. Then escalated anyway, and brought my own manager in, who also backed Raymond.',
  result: 'We lost. The team continued running the manual process until automation landed. What mattered to Raymond was not the outcome but that the fight happened and that he had not been left to carry the position alone.',
  impact: 'Position lost; direct report backed openly through an escalation his manager expected to lose',
  full_story: 'Raymond had been running a manual reporting process that another team had promised to take over for two years and kept deferring. He wanted to formally refuse to keep doing it, and he was right to be angry. But I agreed with the organization. You do not transition a manual process when automation is imminent, even when the timeline has slipped as many times as that one had, because you are paying transition cost twice for something that is about to disappear. So I told him exactly that. I said I had his back, that I would escalate it, that we were going to lose, and why I thought the other side was right. Then I escalated, and I brought my own manager in, and he backed Raymond too. We lost. What I took from it is that the fight itself was the point. Raymond needed to know that the position had been carried up rather than absorbed quietly by his manager, and being told candidly that we would lose did not diminish that. It probably strengthened it, because it meant I was not managing him with optimism I did not have.',
  themes: ['Team Defense', 'Candid Leadership', 'People Leadership'],
  skills: ['people leadership', 'candour', 'escalation', 'operational judgement'],
  use_for: ['Interview', 'Book'],
  date_added: '2026-08-26',
  notes: 'This is a LOYALTY UNDER A LOSING POSITION story, not a stood-ground-and-won story. Adam escalated a position he expected to lose, and lost it. Do not select this when a JD or an interview question is probing for standing ground and prevailing; select it when the probe is about backing your people, candour, or acting without the reward of winning.\n\n' + meta({
    tags: ['team_defense', 'candid_leadership', 'lost_outcome'],
    verification: 'verified',
    flag: 'Employer left blank because it was not specified.',
  }),
};

// ── C6. US BI team, competing platform, public correction ─
const USBI = {
  id: 'soar_076_us_bi_platform_conflict',
  type: 'leadership',
  title: 'Defending an Analyst Against Public Blame in a Platform Turf Conflict',
  employer: '',
  situation: 'When AIR launched it displaced work that other teams had been doing. There were recurring claims that my group had taken their work, along with requests that our dashboards be pulled.',
  obstacle: 'The leader on the other side periodically put one of my analysts in front of the bus in group forums, making the accusation in front of an audience. An accusation made publicly and corrected privately leaves the analyst carrying the damage.',
  action: 'Went at it directly with her each time rather than letting it sit, and insisted that any correction be made in the same forum where the accusation had been made, not privately to me.',
  result: 'OUTCOME UNVERIFIED. It is not confirmed whether the public corrections actually occurred, or whether Adam insisted and received only private acknowledgement. See the flag in notes.',
  impact: '',
  full_story: 'AIR displaced work that other teams had been doing, and that produced a running conflict: claims that we had taken their work, requests that our dashboards be pulled. What I could not let go was that the leader on the other side would periodically put one of my analysts in front of the bus in group forums. The accusation was public, which meant a private correction would not have undone it. So I went at it with her directly each time, and I pushed for the correction to be made in the same room where the accusation had been made.',
  themes: ['Team Defense', 'Standing Ground', 'Peer Conflict'],
  skills: ['people leadership', 'conflict resolution', 'stakeholder management'],
  use_for: ['Interview'],
  date_added: '2026-08-26',
  notes: 'NOT GENERATION READY. The outcome of this story is unverified and the result field deliberately asserts nothing.\n\n' + meta({
    tags: ['stood_ground', 'team_defense', 'peer_conflict'],
    verification: 'outcome_unverified',
    flag: 'Unconfirmed whether the public corrections actually happened, or whether Adam insisted and received only private acknowledgement. Do not assert an outcome until Adam confirms. Employer left blank because it was not specified, though the AIR context suggests Manulife. Do not name the leader on the other side.',
  }),
};

// ── D. Ben / EDL governance: flags only, no rewrite ───────
const BEN_CONFLICT =
  'NEEDS DISAMBIGUATION (flagged 2026-08-26). Two open questions, both requiring Adam.\n' +
  '\n' +
  '1. CONFLICT WITH THE REQUESTED CORRECTION. The correction supplied describes a cancelled coffee, Adam going to the director\'s office IN PERSON, introducing himself, and getting the decision stated face to face. This recorded account instead describes Ben missing two scheduled meetings, Adam sending a direct IM naming the avoidance, and the matter resolving in a 30-minute call with sign-off by email inside the hour. Those are different events, or one of them is misremembered. The narrative has NOT been overwritten, because replacing a detailed consistent account with a conflicting one on the strength of a later recollection is exactly the failure this library exists to prevent.\n' +
  '\n' +
  '2. POSSIBLE MERGE WITH THE DESK ACCOUNT. Adam has separately described standing at a US BI director\'s desk until he sent a withheld file, asking the director to run it while he watched. That account is in-person, like the correction above, and also involves a partner team withholding data as friction against AIR. It may be the same event as this one or a separate one. Per instruction these have NOT been merged and no duplicate has been created. The desk account is not currently in the library at all.\n' +
  '\n' +
  '3. DUPLICATE RECORDS. This event is recorded twice: soar_d03_data_lake_governance and soar_l02_impasse_resolution. Both need the same resolution once Adam answers.\n' +
  '\n' +
  'AGREED CORRECTIONS NOT YET APPLIED, pending the above: the emphasis should move off giving Ben cover so he would feel comfortable, and onto cornering an unowned decision into the open. The underlying governance rule was legitimate and commercial, existing to keep bad data out of client reporting; Adam was not fighting the policy, he was fighting the absence of an owner. Adam also sent a note afterward to the leaders of both teams about the cost of withholding bad news, partly so his own team was visibly cleared of responsibility for the six-month delay.';

const BEN_META = meta({
  tags: ['stood_ground', 'in_person_confrontation', 'team_defense', 'commercial_mindset'],
  verification: 'needs_disambiguation',
});

async function patch(id, body) {
  const r = await fetch(URL + '/rest/v1/stories?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(body),
  });
  const t = await r.text();
  console.log((r.ok ? 'ok   ' : 'FAIL ') + id + (r.ok ? '' : ' -> ' + r.status + ' ' + t.slice(0, 200)));
  return r.ok;
}

async function upsert(row) {
  const r = await fetch(URL + '/rest/v1/stories', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify([row]),
  });
  const t = await r.text();
  console.log((r.ok ? 'ok   ' : 'FAIL ') + row.id + (r.ok ? '' : ' -> ' + r.status + ' ' + t.slice(0, 200)));
  return r.ok;
}

(async () => {
  console.log('--- A. corrections ---');
  const { id: lttId, ...lttBody } = LTT;
  await patch(lttId, lttBody);

  console.log('\n--- B. verification status ---');
  const { id: abId, ...abBody } = ABUSIVE;
  await patch(abId, abBody);

  console.log('\n--- C. new entries ---');
  for (const row of [ACCESS, RAYMOND, USBI]) await upsert(row);

  console.log('\n--- D. Ben entries: flags only, narrative untouched ---');
  const existing = await (await fetch(URL + '/rest/v1/stories?select=id,notes&or=(id.eq.soar_d03_data_lake_governance,id.eq.soar_l02_impasse_resolution)', { headers: H })).json();
  for (const row of existing) {
    const base = String(row.notes || '').split('\nNEEDS DISAMBIGUATION')[0].trim();
    await patch(row.id, { notes: base + '\n\n' + BEN_META + '\n\n' + BEN_CONFLICT });
  }

  console.log('\nDone. Section E: nothing on restricted topics was created.');
})();
