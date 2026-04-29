// ─── STEP 5: RESUME GENERATION ───────────────────────────
function ResumeStep({active,jdAnalysis,rescore,result,stories,experience,awards,education,profileContext,onComplete,onError}) {
  const [loading,setLoading]=useState(false);
  const [loadingPhase,setLoadingPhase]=useState('');
  const [content,setContent]=useState(result&&result.content||null);
  const [err,setErr]=useState(null);
  const [downloaded,setDownloaded]=useState(false);
  const [qualityFlags,setQualityFlags]=useState([]);
  const [sourceFlags,setSourceFlags]=useState([]);

  const BANNED_WORDS_LIST=[
    'leveraged','spearheaded','passionate','synergy','in today\'s fast-paced',
    'utilized','holistic','robust','transformative','cutting-edge',
    'best-in-class','thought leader','results-driven','excited','world-class','dynamic',
  ];

  function scoreStoryAgainstJD(story){
    var jdText=[
      ...jdAnalysis.skills.map(function(s){return s.name;}),
      ...(jdAnalysis.distinctive_vocabulary||[]).map(function(v){return v.phrase||v;})
    ].join(' ').toLowerCase();
    var jdTokens=new Set(jdText.split(/\W+/).filter(function(t){return t.length>2;}));
    var storyText=[...(story.themes||[]),...(story.skills||[]),story.title||'',story.employer||''].join(' ').toLowerCase();
    var storyTokens=storyText.split(/\W+/).filter(function(t){return t.length>2;});
    return storyTokens.filter(function(t){return jdTokens.has(t);}).length;
  }

  function buildExpContextDetailed(exp){
    return (exp||EXPERIENCE_DEFAULT).map(function(e){
      var facetStr='';
      if(e.facets&&e.facets.length>0){
        facetStr='\nFacets:\n'+e.facets.map(function(f){
          return '  ['+f.name+'] '+(f.narrative||'')+(f.themes&&f.themes.length>0?' (themes: '+f.themes.join(', ')+')':'');
        }).join('\n');
      }
      return e.org.toUpperCase()+', Toronto | '+e.dates+'\n'+e.role+
        '\n\nMandate: '+(e.mandate||'')+
        '\nSource bullets:\n'+e.bullets.map(function(b){return '• '+b;}).join('\n')+
        facetStr;
    }).join('\n\n---\n\n');
  }

  function validateResume(text){
    var issues=[];
    var flags=[];
    if(/—/.test(text))issues.push('Em-dash (—) found');
    if(/–/.test(text))issues.push('En-dash (–) found');
    if(/\w\s-\s\w/.test(text))issues.push("Space-hyphen-space ' - ' pattern found");
    var lc=text.toLowerCase();
    BANNED_WORDS_LIST.forEach(function(w){
      if(lc.includes(w.toLowerCase()))issues.push('Banned phrase: "'+w+'"');
    });
    var wc=text.split(/\s+/).filter(Boolean).length;
    if(wc>1200)issues.push('Word count '+wc+' exceeds 1200');
    var tuc=text.toUpperCase();
    ['PROFESSIONAL SUMMARY:','PROFESSIONAL EXPERIENCE:','EDUCATION:','CORE COMPETENCIES:'].forEach(function(s){
      if(!tuc.includes(s))issues.push('Missing section: '+s);
    });
    if(!tuc.includes('AWARDS')&&!tuc.includes('RECOGNITION'))issues.push('Missing AWARDS or RECOGNITION section');
    if(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/.test(text))issues.push('Phone number detected — model generated contact info');
    if(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text))issues.push('Email address detected — model generated contact info');
    if(/\[(Name|City|Phone|Email|Address)\b/i.test(text))issues.push('Bracketed placeholder detected');
    text.split('\n').filter(function(l){return l.trim().startsWith('•');}).forEach(function(line){
      var lw=line.toLowerCase();
      var relCount=['led','advised','partnered','head of','directed'].filter(function(v){return lw.includes(v);}).length;
      if(relCount>=2)flags.push('Multiple relational claims in one bullet: "'+line.trim().slice(0,90)+'"');
    });
    return{issues:issues,flags:flags};
  }

  const RESUME_SYS=`You are an expert executive resume writer. Generate a complete, tailored, JD-responsive resume in plain text. The output is the resume BODY only. The candidate's name and contact information are added by the application — do NOT generate a contact section, name, phone, email, or address.

OUTPUT STRUCTURE (exact order, ALL CAPS section headers ending with colon):

PROFESSIONAL SUMMARY:
[3-4 sentences. Frontload the JD's primary verbs and skills. Lead with the candidate's most differentiating credential. No cliches.]

PROFESSIONAL EXPERIENCE:
[For each role:]
EMPLOYER NAME, City | Date Range
Role Title | Department | Date Range

• Bullet 1: mirrors a JD responsibility using the JD's exact verb and framing where source data supports it
• Bullet 2-N: descending JD relevance

EDUCATION:
[Credential, Institution, Year and relevant note]

AWARDS & RECOGNITION:
[Award, context, year — most JD-relevant first]

CORE COMPETENCIES:
[12-18 competencies, generated dynamically for THIS JD. At least 8 must explicitly map to JD top skills.]

HARD RULES (non-negotiable):
1. NEVER generate contact information — no name, no phone, no email, no address, no city.
2. NEVER use em-dashes, en-dashes, or ' - ' (space-hyphen-space). Use commas, semicolons, or rewrite.
3. Body length: approximately 1100 words maximum.
4. Bullet length: 15-25 words for senior roles, 10-20 for older. NEVER exceed 30 words.
5. Bullets per role: 5-7 for most recent two roles, 4-5 for next two, 3-4 for older.
6. LEAD-BULLET RULE: each role's first bullet must (a) mirror a JD responsibility using the JD's verbs where source supports it, (b) establish scope at or above the level the role requires, (c) provide evidence of excellence: recognition, measurable outcome, judgment displayed, or complexity overcome.
7. ADVISORY FRAMING: when both advisory and operational framings are honestly available from source, use advisory verbs (advised, recommended, shaped, guided, partnered) over operational verbs (provided, produced, delivered, built tools for).
8. Quantify outcomes using specific numbers from source. Do not round up. Do not add '+' unless source has '+'. Do not substitute aspirational figures.
9. MIRROR JD vocabulary where meaning matches. Use the JD's distinctive vocabulary where source supports it.
10. Banned words: leveraged, spearheaded, passionate, synergy, utilized, holistic, robust, transformative, cutting-edge, best-in-class, thought leader, results-driven, excited, world-class, dynamic, drove (as filler), delivered (as filler), in today's fast-paced.
11. Plain text only. No markdown, no asterisks. Section headers ALL CAPS with colon. Bullets start with bullet character.
12. Generate CORE COMPETENCIES dynamically for this specific JD.
13. SOURCE TRACE: every relational claim (led, advised, partner, head of, direct report) and every numeric claim ($, %, headcount, AUM, time period) must be supported by the source data for that specific role. Do not import context from one role into another. Do not promote titles beyond what source supports.
14. Current role end date is 2026.`;

  const FRAMING_SYS='Review the bullets in this resume. For each bullet, identify the verb and frame. Bullets framed operationally (provided X with reporting, built dashboards for, produced reports on, delivered data to) should be rewritten in advisory framing where source supports it (advised X on, recommended, shaped, guided decisions on, partnered on). Do NOT change the substance of any bullet — only the framing verb and structure. Do NOT introduce claims not already in the bullet. Return the full revised resume in the same plain-text format with the same section structure.';

  async function generate(){
    setLoading(true);setErr(null);setDownloaded(false);setQualityFlags([]);setSourceFlags([]);
    setLoadingPhase('Generating resume...');
    const nl='\n';
    try{
      // SOAR pre-filter: top 15 by JD relevance
      const scored=stories.map(function(s){return Object.assign({},s,{_sc:scoreStoryAgainstJD(s)});})
        .sort(function(a,b){return b._sc-a._sc;}).slice(0,15);

      const expCtx=buildExpContextDetailed(experience);
      const eduCtx=(education||[]).map(function(e){return e.cred+' — '+e.org+(e.year?' ('+e.year+')':'')+': '+e.note;}).join('; ');
      const awardsCtx=(awards||[]).slice(0,8).map(function(a){return '• '+a.award+' ('+a.year+', '+a.org+'): '+a.narrative;}).join(nl);
      const scores=rescore&&rescore.scores||[];
      const topGaps=scores.filter(function(s){return s.score<70;}).map(function(s){return s.skill+(s.evidence?': '+s.evidence:'');}).join(nl)||'None';
      const respCtx=(jdAnalysis.responsibilities||[]).slice().sort(function(a,b){return(a.jd_order||0)-(b.jd_order||0);})
        .map(function(r){return '• '+(r.description||r)+(r.priority?' (priority: '+r.priority+')':'');}).join(nl);
      const vocabCtx=(jdAnalysis.distinctive_vocabulary||[]).map(function(v){return v.phrase||v;}).join(', ');
      const topSkillsCtx=jdAnalysis.skills.filter(function(s){return s.weight>=7;}).map(function(s){return s.name+' (weight '+s.weight+')';}).join(', ');
      const storyCtx=scored.map(function(s){
        return 'STORY: '+s.title+' | '+s.employer+nl+
          'Themes: '+(s.themes||[]).join(', ')+nl+
          'Situation: '+(s.situation||'')+nl+
          'Obstacle: '+(s.obstacle||'')+nl+
          'Action: '+(s.action||'')+nl+
          'Result: '+(s.result||'')+nl+
          'Impact: '+(s.impact||'');
      }).join(nl+nl);

      const userPrompt=[
        'Target role: '+jdAnalysis.role+' at '+jdAnalysis.company,
        '',
        'JD responsibilities (mirror these in lead bullets using the JD\'s language):',
        respCtx||'Not specified',
        '',
        'JD distinctive vocabulary (use where meaning matches):',
        vocabCtx||'Not specified',
        '',
        'JD top skills: '+topSkillsCtx,
        '',
        'Gaps to address through reframing only — do NOT fabricate:',
        topGaps,
        '',
        'CANDIDATE EXPERIENCE:',
        expCtx,
        '',
        'CANDIDATE STORIES (top 15 by JD relevance):',
        storyCtx,
        '',
        'EDUCATION: '+eduCtx,
        '',
        'AWARDS:',
        awardsCtx,
        '',
        'GENERATE THE RESUME NOW.'
      ].join(nl);

      // First generation
      let raw=await callClaude(RESUME_SYS,userPrompt,5000,0);

      // Framing review pass
      setLoadingPhase('Reviewing framing...');
      try{
        const framed=await callClaude(FRAMING_SYS,raw,5000,0);
        if(framed&&framed.trim().length>raw.length*0.6)raw=framed;
      }catch(fe){}

      // Validate
      setLoadingPhase('Validating...');
      const vr=validateResume(raw);
      setSourceFlags(vr.flags);

      if(vr.issues.length>0){
        setLoadingPhase('Regenerating...');
        const fixInstr='Your previous resume output had these issues:\n'+vr.issues.map(function(x){return '• '+x;}).join('\n')+'\n\nRegenerate the resume fixing ONLY those issues. Do not change content unrelated to the issues. Apply all hard rules from the system prompt.';
        try{
          const raw2=await callClaude(RESUME_SYS,userPrompt+'\n\nFIX INSTRUCTIONS:\n'+fixInstr,5000,0);
          const vr2=validateResume(raw2);
          if(vr2.issues.length<vr.issues.length){
            raw=raw2;setSourceFlags(vr2.flags);
            if(vr2.issues.length>0)setQualityFlags(vr2.issues);
          }else{setQualityFlags(vr.issues);}
        }catch(re){setQualityFlags(vr.issues);}
      }

      setContent(raw);
    }catch(e){setErr(e.message);onError(e.message);}
    setLoadingPhase('');
    setLoading(false);
  }

  function download(){
    const rtf=buildResumeRTF(content,profileContext&&profileContext.headerTagline||CANDIDATE.subtitle);
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
            Generate a tailored resume with advisory framing review and post-generation validation.
          </div>
          {err&&<div style={{fontSize:12,color:'#A32D2D',padding:'8px 12px',background:'#FCEBEB',borderRadius:6,marginBottom:'0.75rem'}}>⚠ {err}</div>}
          <button onClick={generate} style={S.primary}>Generate resume →</button>
        </>
      )}

      {loading&&(
        <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>
          {loadingPhase||'Working...'}<span style={{color:'var(--color-text-tertiary)',fontSize:11,marginLeft:8}}>(generate → framing review → validate)</span>
        </div>
      )}

      {content&&(
        <>
          {sourceFlags.length>0&&(
            <div style={{fontSize:12,color:'#854F0B',padding:'8px 12px',background:'#FAEEDA',borderRadius:6,border:'1px solid #EF9F27',marginBottom:'0.75rem'}}>
              <div style={{fontWeight:500,marginBottom:4}}>⚠ Review these claims for source accuracy:</div>
              {sourceFlags.map(function(f,i){return <div key={i} style={{marginTop:2}}>· {f}</div>;})}
            </div>
          )}
          {qualityFlags.length>0&&(
            <div style={{fontSize:12,color:'#A32D2D',padding:'8px 12px',background:'#FCEBEB',borderRadius:6,border:'1px solid #E24B4A',marginBottom:'0.75rem'}}>
              <div style={{fontWeight:500,marginBottom:4}}>⚠ Quality issues remain after auto-fix. Edit manually:</div>
              {qualityFlags.map(function(f,i){return <div key={i} style={{marginTop:2}}>· {f}</div>;})}
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>Framing reviewed, validated</div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={function(){navigator.clipboard&&navigator.clipboard.writeText([CANDIDATE.name+'\n'+(profileContext&&profileContext.headerTagline||CANDIDATE.subtitle)+'\n'+CANDIDATE.contact,content].join('\n\n'));}} style={{...S.btn,fontSize:11,padding:'4px 10px'}}>Copy ↗</button>
              <button onClick={download} style={{...S.btn,fontSize:11,padding:'4px 10px',color:downloaded?'#065f46':'var(--color-text-primary)',borderColor:downloaded?'#10b981':'var(--color-border-secondary)'}}>
                {downloaded?'✓ Downloaded':'↓ .rtf'}
              </button>
            </div>
          </div>
          <div style={{borderRadius:8,background:'var(--color-background-secondary)',padding:'1.25rem',marginBottom:'1rem',maxHeight:500,overflowY:'auto'}}>
            <ResumeOutput content={content}/>
          </div>
          {!result&&(
            <button onClick={function(){onComplete({content});}} style={S.primary}>Generate cover letter →</button>
          )}
        </>
      )}
    </div>
  );
}
