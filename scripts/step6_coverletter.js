// ─── STEP 6: COVER LETTER GENERATION ─────────────────────
function CoverLetterStep({active,jdAnalysis,rescore,resume,result,stories,experience,onComplete,onError}) {
  const [loading,setLoading]=useState(false);
  const [content,setContent]=useState(result?.content||null);
  const [err,setErr]=useState(null);
  const [downloaded,setDownloaded]=useState(false);

  const BANNED_WORDS='leveraged,spearheaded,passionate,synergy,in today\'s fast-paced,utilized,holistic,robust,transformative,cutting-edge,best-in-class,thought leader,I am excited to apply,I am writing to express,perfect fit,passionate about';

  function stripEmDashes(text){
    return (text||'').replace(/[–—]/g,'-');
  }

  function buildCoverLetterRTF(text){
    const fontTbl='{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}';
    const colorTbl='{\\colortbl ;\\red30\\green58\\blue95;\\red37\\green99\\blue235;\\red31\\green41\\blue55;\\red107\\green114\\blue128;}';
    let body='';
    body+='\\pard\\sb0\\sa50\\cf1\\f0\\fs44\\b '+escRTF(CANDIDATE.name)+'\\b0\\par\n';
    body+='\\pard\\sb0\\sa40\\cf3\\f0\\fs20 '+escRTF(CANDIDATE.subtitle)+'\\par\n';
    body+='\\pard\\sb0\\sa200\\cf4\\f0\\fs17 '+escRTF(CANDIDATE.contact)+'\\par\n';
    body+='\\pard\\sb0\\sa0\\brdrb\\brdrs\\brdrw20\\brdrcolor1 \\par\n';
    const paras=(text||'').split(/\n\n+/).filter(p=>p.trim());
    paras.forEach((p,i)=>{
      body+='\\pard\\sb'+(i===0?'280':'160')+'\\sa0\\f0\\fs20\\cf3 '+escRTF(p.trim())+'\\par\n';
    });
    return'{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033\n'+fontTbl+'\n'+colorTbl+'\n\\paperw12240\\paperh15840\\margl1440\\margr1440\\margt1440\\margb1440\n'+body+'}';
  }

  async function generate(){
    setLoading(true);setErr(null);setDownloaded(false);
    const nl='\n';
    try{
      const scores=rescore?.scores||[];
      const topSkills=scores.filter(s=>s.score>=75).map(s=>s.skill).slice(0,5).join(', ');
      const storyCtx=stories.slice(0,6).map(s=>s.title+' ('+s.employer+'): '+s.result).join(nl);

      const raw=await callClaude(
        'You are an expert cover letter writer. Write a 4-paragraph cover letter. Tone: warm, confident, human — not stiff or corporate. Rules: (1) Opening paragraph: specific hook about why THIS role at THIS company — no "I am excited to apply" or "I am writing to" — open with a statement of perspective or conviction (2) Paragraph 2: connect 2-3 strongest skills/stories to what the role needs — be concrete (3) Paragraph 3: demonstrate knowledge of the company or industry context and how it connects to the candidate\'s experience (4) Closing: confident call to action, brief, no groveling. Hard rules: ABSOLUTELY NO em-dashes (use commas or rewrite), no banned phrases: '+BANNED_WORDS+'. Return plain text only — no markdown, no subject line, no date, no address block.',
        ['Role: ',jdAnalysis.role,' at ',jdAnalysis.company,nl,'High-weight skills: ',jdAnalysis.skills.filter(s=>s.weight>=7).map(s=>s.name).join(', '),nl,'Candidate strengths: ',topSkills,nl+nl,'Top stories:',nl,storyCtx,nl+nl,'Candidate narrative: ',ADAM.narrative,nl,'Competencies: ',COMPETENCIES].join(''),
        1200
      );
      const cleaned=stripEmDashes(raw);
      setContent(cleaned);
    }catch(e){setErr(e.message);onError(e.message);}
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
          {content&&<div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:2}}>Tailored for {jdAnalysis.role} at {jdAnalysis.company}</div>}
        </div>
        {result&&<span style={{fontSize:11,padding:'2px 8px',background:'#EAF3DE',color:'#3B6D11',borderRadius:4,fontWeight:500}}>✓ Complete</span>}
      </div>

      {!content&&!loading&&(
        <>
          <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:'0.5rem'}}>
            Generate a 4-paragraph cover letter — warm, specific, no banned phrases, no em-dashes.
          </div>
          {err&&<div style={{fontSize:12,color:'#A32D2D',padding:'8px 12px',background:'#FCEBEB',borderRadius:6,marginBottom:'0.75rem'}}>⚠ {err}</div>}
          <button onClick={generate} style={S.primary}>Generate cover letter →</button>
        </>
      )}

      {loading&&(
        <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>Generating cover letter…</div>
      )}

      {content&&(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
            <div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>Em-dashes removed, banned phrases avoided</div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>navigator.clipboard?.writeText([CANDIDATE.name+'\n'+CANDIDATE.contact,content].join('\n\n'))} style={{...S.btn,fontSize:11,padding:'4px 10px'}}>Copy ↗</button>
              <button onClick={download} style={{...S.btn,fontSize:11,padding:'4px 10px',color:downloaded?'#065f46':'var(--color-text-primary)',borderColor:downloaded?'#10b981':'var(--color-border-secondary)'}}>
                {downloaded?'✓ Downloaded':'↓ .rtf'}
              </button>
            </div>
          </div>
          <div style={{borderRadius:8,background:'var(--color-background-secondary)',padding:'1.25rem',marginBottom:'1rem',maxHeight:500,overflowY:'auto'}}>
            <div style={{fontSize:13,lineHeight:1.8,whiteSpace:'pre-wrap',color:'var(--color-text-primary)'}}>{content}</div>
          </div>
          {!result&&(
            <button onClick={()=>onComplete({content})} style={S.primary}>Done — save application →</button>
          )}
        </>
      )}
    </div>
  );
}


