// ─── STEP 6: COVER LETTER GENERATION ───────────────────────────
function CoverLetterStep({active,jdAnalysis,rescore,resume,result,stories,experience,profileContext,onComplete,onError}) {
  const [loading,setLoading]=useState(false);
  const [loadingPhase,setLoadingPhase]=useState('');
  const [content,setContent]=useState(result&&result.content||null);
  const [err,setErr]=useState(null);
  const [downloaded,setDownloaded]=useState(false);
  const [qualityFlags,setQualityFlags]=useState([]);

  const BANNED_WORDS_LIST=[
    'leveraged','spearheaded','passionate','synergy','in today\'s fast-paced',
    'utilized','holistic','robust','transformative','cutting-edge',
    'best-in-class','thought leader','i am excited to apply','i am writing to express',
    'perfect fit','passionate about','results-driven','dynamic','world-class',
  ];

  const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

  const CL_SYS='You are an expert executive cover letter writer. Write a complete, tailored cover letter in plain text. The candidate\'s name and contact information are added by the application — do NOT generate a header with name or contact details.\n\nOUTPUT STRUCTURE (exact order):\n\n'+today+'\n\n[Hiring manager name and title if known, otherwise omit and go straight to company]\n[Company name]\n\nRe: [Role title] — Application\n\nDear [Hiring Manager name, or "Hiring Committee" if unknown],\n\n[Paragraph 1 — Opening: A statement of perspective or conviction about why THIS role at THIS company. NEVER open with "I am excited to apply", "I am writing to", or any cliche opener. Open with a substantive observation about the company, sector, or the problem the role exists to solve, then connect it to the candidate\'s specific experience.]\n\n[Paragraph 2 — Fit: Connect 2-3 of the candidate\'s strongest JD-matched skills or SOAR stories to the role\'s top responsibilities. Be concrete — name the story or outcome. Mirror the JD\'s distinctive vocabulary where meaning matches.]\n\n[Paragraph 3 — Company/context: Demonstrate knowledge of the company\'s situation, strategy, or challenges and show how the candidate\'s background is specifically relevant. Not generic industry commentary — specific to this company and role.]\n\n[Paragraph 4 — Closing: Confident, brief, no groveling. Express clear interest in next steps. One or two sentences max.]\n\nSincerely,\n\n[Leave name blank — application adds it]\n\nHARD RULES:\n1. NEVER generate the candidate\'s name, phone, email, or address in the body.\n2. NEVER use em-dashes (—), en-dashes (–), or \' - \' (space-hyphen-space). Use commas, semicolons, or rewrite.\n3. Banned phrases: leveraged, spearheaded, passionate, synergy, utilized, holistic, robust, transformative, cutting-edge, best-in-class, thought leader, I am excited to apply, I am writing to express, perfect fit, passionate about, results-driven, dynamic, world-class, in today\'s fast-paced.\n4. Body paragraphs: exactly 4. Total body word count: 280-420 words.\n5. Plain text only. No markdown, no asterisks, no bullet points in body.\n6. Mirror the JD\'s distinctive vocabulary and top responsibilities where source data supports it.\n7. Every claim about the candidate must be supported by the experience or stories provided — no fabrication.';

  function validateCoverLetter(text){
    var issues=[];
    if(/[—–]/.test(text))issues.push('Em-dash or en-dash found');
    if(/\w\s-\s\w/.test(text))issues.push("Space-hyphen-space ' - ' pattern found");
    var lc=text.toLowerCase();
    BANNED_WORDS_LIST.forEach(function(w){
      if(lc.includes(w.toLowerCase()))issues.push('Banned phrase: "'+w+'"');
    });
    var paras=text.split(/\n\n+/).filter(function(p){return p.trim().length>0;});
    var bodyParas=paras.filter(function(p){
      var t=p.trim();
      return !(/^\w+ \d+,?\s+\d{4}/.test(t)||/^Dear\b/i.test(t)||/^Re:/i.test(t)||/^Sincerely|^Regards|^Best regards/i.test(t)||/^\w+,?\s*$/.test(t)||t.length<10);
    });
    var wc=bodyParas.join(' ').split(/\s+/).filter(Boolean).length;
    if(wc<250)issues.push('Body word count '+wc+' is below 250');
    if(wc>550)issues.push('Body word count '+wc+' exceeds 550');
    if(bodyParas.length<4)issues.push('Only '+bodyParas.length+' body paragraphs — need 4');
    if(bodyParas.length>5)issues.push(bodyParas.length+' body paragraphs found — keep to 4');
    if(!/Dear\b/i.test(text))issues.push('Missing salutation (Dear ...)');
    if(!/Sincerely|Best regards|Regards/i.test(text))issues.push('Missing professional signoff');
    if(/\[(Name|Hiring Manager|Company|Title|Address)\b/i.test(text))issues.push('Bracketed placeholder detected');
    if(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text))issues.push('Email address detected in body');
    return issues;
  }

  function buildCoverLetterRTF(text){
    const fontTbl='{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}';
    const colorTbl='{\\colortbl ;\\red30\\green58\\blue95;\\red37\\green99\\blue235;\\red31\\green41\\blue55;\\red107\\green114\\blue128;}';
    let body='';
    body+='\\pard\\sb0\\sa50\\cf1\\f0\\fs44\\b '+escRTF(CANDIDATE.name)+'\\b0\\par\n';
    body+='\\pard\\sb0\\sa40\\cf3\\f0\\fs20 '+escRTF(profileContext&&profileContext.headerTagline||CANDIDATE.subtitle)+'\\par\n';
    body+='\\pard\\sb0\\sa200\\cf4\\f0\\fs17 '+escRTF(CANDIDATE.contact)+'\\par\n';
    body+='\\pard\\sb0\\sa0\\brdrb\\brdrs\\brdrw20\\brdrcolor1 \\par\n';
    const paras=(text||'').split(/\n\n+/).filter(p=>p.trim());
    paras.forEach((p,i)=>{
      body+='\\pard\\sb'+(i===0?'280':'160')+'\\sa0\\f0\\fs20\\cf3 '+escRTF(p.trim())+'\\par\n';
    });
    return'{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033\n'+fontTbl+'\n'+colorTbl+'\n\\paperw12240\\paperh15840\\margl1440\\margr1440\\margt1440\\margb1440\n'+body+'}';
  }

  async function generate(){
    setLoading(true);setErr(null);setDownloaded(false);setQualityFlags([]);
    setLoadingPhase('Generating cover letter...');
    const nl='\n';
    try{
      const topSkills=jdAnalysis.skills.filter(function(s){return s.weight>=7;}).map(function(s){return s.name+' (weight '+s.weight+')';}).join(', ');
      const respCtx=(jdAnalysis.responsibilities||[]).slice(0,8).map(function(r){return '• '+(r.description||r)+(r.priority?' (priority: '+r.priority+')':'');}).join(nl);
      const vocabCtx=(jdAnalysis.distinctive_vocabulary||[]).map(function(v){return v.phrase||v;}).join(', ');
      const storyCtx=stories.slice(0,8).map(function(s){
        return s.title+' ('+s.employer+'): '+s.result+(s.impact?' — '+s.impact:'');
      }).join(nl);
      const resumeSnippet=resume&&resume.content?resume.content.slice(0,600):'';

      const userPrompt=[
        'Target role: '+jdAnalysis.role+' at '+jdAnalysis.company,
        '',
        'JD top responsibilities (mirror in letter):',
        respCtx||'Not specified',
        '',
        'JD distinctive vocabulary (use where meaning matches):',
        vocabCtx||'Not specified',
        '',
        'JD top skills: '+topSkills,
        '',
        'Candidate\'s strongest SOAR stories (use 2-3 concretely):',
        storyCtx,
        '',
        'Resume summary snippet (for tone/framing reference):',
        resumeSnippet,
        '',
        'WRITE THE COVER LETTER NOW.'
      ].join(nl);

      let raw=await callClaude(CL_SYS,userPrompt,3000,0.4);

      setLoadingPhase('Validating...');
      const issues=validateCoverLetter(raw);

      if(issues.length>0){
        setLoadingPhase('Regenerating...');
        const fixInstr='Your previous cover letter had these issues:\n'+issues.map(function(x){return '• '+x;}).join('\n')+'\n\nRegenerate the cover letter fixing ONLY those issues. Do not change content unrelated to the issues. Apply all hard rules from the system prompt.';
        try{
          const raw2=await callClaude(CL_SYS,userPrompt+'\n\nFIX INSTRUCTIONS:\n'+fixInstr,3000,0.4);
          const issues2=validateCoverLetter(raw2);
          if(issues2.length<issues.length){
            raw=raw2;
            if(issues2.length>0)setQualityFlags(issues2);
          }else{setQualityFlags(issues);}
        }catch(re){setQualityFlags(issues);}
      }

      setContent(raw);
    }catch(e){setErr(e.message);onError(e.message);}
    setLoadingPhase('');
    setLoading(false);
  }

  function download(){
    const rtf=buildCoverLetterRTF(content);
    downloadBlob(rtf,'adam_waldman_coverletter_'+jdAnalysis.role.replace(/\s+/g,'_').toLowerCase()+'.rtf','application/rtf');
    setDownloaded(true);
  }

  return(
    <div style={S.card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
        <div>
          <div style={{fontSize:14,fontWeight:500}}>Step 6 — Cover Letter</div>
          {content&&<div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:2}}>Tailored for {jdAnalysis.role} at {jdAnalysis.company} · dated {today}</div>}
        </div>
        {result&&<span style={{fontSize:11,padding:'2px 8px',background:'#EAF3DE',color:'#3B6D11',borderRadius:4,fontWeight:500}}>✓ Complete</span>}
      </div>

      {!content&&!loading&&(
        <>
          <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:'0.5rem'}}>
            Generate a 4-paragraph cover letter with JD-mirrored framing, validation, and auto-fix.
          </div>
          {err&&<div style={{fontSize:12,color:'#A32D2D',padding:'8px 12px',background:'#FCEBEB',borderRadius:6,marginBottom:'0.75rem'}}>⚠ {err}</div>}
          <button onClick={generate} style={S.primary}>Generate cover letter →</button>
        </>
      )}

      {loading&&(
        <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>
          {loadingPhase||'Working...'}<span style={{color:'var(--color-text-tertiary)',fontSize:11,marginLeft:8}}>(generate → validate)</span>
        </div>
      )}

      {content&&(
        <>
          {qualityFlags.length>0&&(
            <div style={{fontSize:12,color:'#A32D2D',padding:'8px 12px',background:'#FCEBEB',borderRadius:6,border:'1px solid #E24B4A',marginBottom:'0.75rem'}}>
              <div style={{fontWeight:500,marginBottom:4}}>⚠ Quality issues remain after auto-fix. Edit manually:</div>
              {qualityFlags.map(function(f,i){return <div key={i} style={{marginTop:2}}>· {f}</div>;})}
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>Validated, em-dashes removed</div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={function(){navigator.clipboard&&navigator.clipboard.writeText([CANDIDATE.name+'\n'+(profileContext&&profileContext.headerTagline||CANDIDATE.subtitle)+'\n'+CANDIDATE.contact,content].join('\n\n'));}} style={{...S.btn,fontSize:11,padding:'4px 10px'}}>Copy ↗</button>
              <button onClick={download} style={{...S.btn,fontSize:11,padding:'4px 10px',color:downloaded?'#065f46':'var(--color-text-primary)',borderColor:downloaded?'#10b981':'var(--color-border-secondary)'}}>
                {downloaded?'✓ Downloaded':'↓ .rtf'}
              </button>
            </div>
          </div>
          <div style={{borderRadius:8,background:'var(--color-background-secondary)',padding:'1.25rem',marginBottom:'1rem',maxHeight:500,overflowY:'auto'}}>
            <div style={{fontSize:13,lineHeight:1.8,whiteSpace:'pre-wrap',color:'var(--color-text-primary)'}}>{content}</div>
          </div>
          {!result&&(
            <button onClick={function(){onComplete({content});}} style={S.primary}>Done — save application →</button>
          )}
        </>
      )}
    </div>
  );
}
