// ─── STEP 5: RESUME GENERATION ───────────────────────────
function ResumeStep({active,jdAnalysis,rescore,result,stories,experience,onComplete,onError}) {
  const [loading,setLoading]=useState(false);
  const [content,setContent]=useState(result?.content||null);
  const [err,setErr]=useState(null);
  const [downloaded,setDownloaded]=useState(false);

  const BANNED_WORDS='leveraged,spearheaded,passionate,synergy,in today\'s fast-paced,utilized,holistic,robust,transformative,cutting-edge,best-in-class,thought leader';
  const BANNED_OPENING='excited to apply,I am writing to,perfect fit,passionate about';

  function stripEmDashes(text){
    return (text||'').replace(/[–—]/g,'-');
  }

  async function generate(){
    setLoading(true);setErr(null);setDownloaded(false);
    const nl='\n';
    try{
      const expCtx=buildExpContext(experience);
      const eduCtx=EDUCATION_DATA.map(e=>e.cred+' — '+e.org+(e.year?' ('+e.year+')':'')+': '+e.note).join('; ');
      const awardsCtx=AWARDS_DATA.slice(0,6).map(a=>a.award+' ('+a.year+')').join('; ');
      const scores=rescore?.scores||[];
      const topGaps=scores.filter(s=>s.score<70).map(s=>s.skill).join(', ');
      const storyCtx=stories.map(s=>'SOAR: '+s.title+' ('+s.employer+')'+nl+'Action: '+s.action+nl+'Result: '+s.result).join(nl+nl);

      const raw=await callClaude(
        'You are an expert resume writer. Generate resume CONTENT for the targeted role. Rules: (1) ALL CAPS section headers followed by a colon — e.g. PROFESSIONAL EXPERIENCE: (2) Bullet points start with • (3) 3 pages maximum (4) ABSOLUTELY NO em-dashes (— or –) anywhere — use commas or rewrite; this is a hard rule (5) No decorative sub-headers (6) No AI-sounding constructions — banned phrases: '+BANNED_WORDS+' (7) Current role end date is 2026 (8) Strong action verbs with quantified outcomes (9) Header appears only on page 1. Return plain text — no markdown.',
        ['Target role: ',jdAnalysis.role,' at ',jdAnalysis.company,nl,'High-weight skills: ',jdAnalysis.skills.filter(s=>s.weight>=7).map(s=>s.name).join(', '),nl,'Gaps to address through framing: ',topGaps,nl+nl,'EXPERIENCE:',nl,expCtx,nl+nl,'SOAR STORIES (draw from these):',nl,storyCtx,nl+nl,'COMPETENCIES: ',COMPETENCIES,nl,'CAPITAL MARKETS: ',CM_EXPERTISE,nl,'EDUCATION: ',eduCtx,nl,'AWARDS: ',awardsCtx].join(''),
        3000
      );
      const cleaned=stripEmDashes(raw);
      setContent(cleaned);
    }catch(e){setErr(e.message);onError(e.message);}
    setLoading(false);
  }

  function download(){
    const rtf=buildResumeRTF(content,experience);
    downloadBlob(rtf,'adam_waldman_resume_'+jdAnalysis.role.replace(/\s+/g,'_').toLowerCase()+'.rtf','application/rtf');
    setDownloaded(true);
  }

  return(
    <div style={S.card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
        <div>
          <div style={{fontSize:14,fontWeight:500}}>Step 5 — Resume</div>
          {content&&<div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:2}}>Tailored for {jdAnalysis.role} at {jdAnalysis.company}</div>}
        </div>
        {result&&<span style={{fontSize:11,padding:'2px 8px',background:'#EAF3DE',color:'#3B6D11',borderRadius:4,fontWeight:500}}>✓ Complete</span>}
      </div>

      {!content&&!loading&&(
        <>
          <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:'0.5rem'}}>
            Generate a tailored resume — ALL CAPS headers, bullet points, no em-dashes, no banned phrases.
          </div>
          {err&&<div style={{fontSize:12,color:'#A32D2D',padding:'8px 12px',background:'#FCEBEB',borderRadius:6,marginBottom:'0.75rem'}}>⚠ {err}</div>}
          <button onClick={generate} style={S.primary}>Generate resume →</button>
        </>
      )}

      {loading&&(
        <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>Generating tailored resume — this takes about 20 seconds…</div>
      )}

      {content&&(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>Em-dashes removed, banned phrases avoided</div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>navigator.clipboard?.writeText([CANDIDATE.name+'\n'+CANDIDATE.subtitle+'\n'+CANDIDATE.contact,content].join('\n\n'))} style={{...S.btn,fontSize:11,padding:'4px 10px'}}>Copy ↗</button>
              <button onClick={download} style={{...S.btn,fontSize:11,padding:'4px 10px',color:downloaded?'#065f46':'var(--color-text-primary)',borderColor:downloaded?'#10b981':'var(--color-border-secondary)'}}>
                {downloaded?'✓ Downloaded':'↓ .rtf'}
              </button>
            </div>
          </div>
          <div style={{borderRadius:8,background:'var(--color-background-secondary)',padding:'1.25rem',marginBottom:'1rem',maxHeight:500,overflowY:'auto'}}>
            <ResumeOutput content={content}/>
          </div>
          {!result&&(
            <button onClick={()=>onComplete({content})} style={S.primary}>Generate cover letter →</button>
          )}
        </>
      )}
    </div>
  );
}

