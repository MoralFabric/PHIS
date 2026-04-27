import supabase from './supabase'
import SOAR_LIBRARY from '../SOAR_Library.json'

// ── Story row mapping (JS camelCase ↔ Postgres snake_case) ──

function storyToRow(s) {
  return {
    id:         String(s.id),
    type:       s.type       || 'career',
    title:      s.title      || '',
    employer:   s.employer   || '',
    situation:  s.situation  || '',
    obstacle:   s.obstacle   || '',
    action:     s.action     || '',
    result:     s.result     || '',
    impact:     s.impact     || '',
    full_story: s.fullStory  || '',
    themes:     s.themes     || [],
    skills:     s.skills     || [],
    use_for:    s.useFor     || [],
    notes:      s.notes      || '',
    date_added: s.dateAdded  || '',
  }
}

function rowToStory(r) {
  return {
    id:        r.id,
    type:      r.type,
    title:     r.title,
    employer:  r.employer,
    situation: r.situation,
    obstacle:  r.obstacle,
    action:    r.action,
    result:    r.result,
    impact:    r.impact,
    fullStory: r.full_story  || '',
    themes:    r.themes      || [],
    skills:    r.skills      || [],
    useFor:    r.use_for     || [],
    notes:     r.notes       || '',
    dateAdded: r.date_added  || '',
  }
}

// ── Experience row mapping ──

function expToRow(e) {
  return {
    id:               e.id,
    role:             e.role             || '',
    org:              e.org              || '',
    dates:            e.dates            || '',
    scope:            e.scope            || '',
    mandate:          e.mandate          || '',
    responsibilities: e.responsibilities || [],
    bullets:          e.bullets          || [],
    themes:           e.themes           || [],
    full_narrative:   e.fullNarrative    || '',
  }
}

function rowToExp(r) {
  return {
    id:               r.id,
    role:             r.role,
    org:              r.org,
    dates:            r.dates,
    scope:            r.scope,
    mandate:          r.mandate,
    responsibilities: r.responsibilities || [],
    bullets:          r.bullets          || [],
    themes:           r.themes           || [],
    fullNarrative:    r.full_narrative   || '',
  }
}

// ── Stories ──

export async function seedAndGetStories(inlineSeeds) {
  const { data: existing, error } = await supabase.from('stories').select('*')
  if (error) throw error

  if (existing.length === 0) {
    // First run: seed from all sources, deduplicate by id
    const seen = new Set()
    const allSeeds = []
    for (const s of [...inlineSeeds, ...SOAR_LIBRARY]) {
      const id = String(s.id)
      if (!seen.has(id)) { seen.add(id); allSeeds.push({ ...s, id }) }
    }
    const { error: insertError } = await supabase.from('stories').upsert(allSeeds.map(storyToRow))
    if (insertError) throw insertError
    return allSeeds.map(rowToStory)
  }

  // Subsequent runs: add any inline seeds not yet in DB
  const savedIds = new Set(existing.map(r => r.id))
  const newOnes  = inlineSeeds
    .filter(s => !savedIds.has(String(s.id)))
    .map(s => ({ ...s, id: String(s.id) }))

  if (newOnes.length > 0) {
    const { error: insertError } = await supabase.from('stories').upsert(newOnes.map(storyToRow))
    if (insertError) throw insertError
  }

  return [...existing, ...newOnes.map(storyToRow)].map(rowToStory)
}

export async function getStories() {
  const { data, error } = await supabase.from('stories').select('*')
  if (error) throw error
  return (data || []).map(rowToStory)
}

export async function upsertStory(story) {
  const { error } = await supabase.from('stories').upsert(storyToRow(story))
  if (error) throw error
}

export async function upsertStories(stories) {
  if (!stories.length) return
  const { error } = await supabase.from('stories').upsert(stories.map(s => storyToRow({ ...s, id: String(s.id) })))
  if (error) throw error
}

export async function deleteStory(id) {
  const { error } = await supabase.from('stories').delete().eq('id', String(id))
  if (error) throw error
}

// ── Experience ──

export async function getExperience() {
  const { data, error } = await supabase.from('experience').select('*')
  if (error) throw error
  return (data || []).map(rowToExp)
}

export async function saveExperience(expArray) {
  const { error } = await supabase.from('experience').upsert(expArray.map(expToRow))
  if (error) throw error
}
