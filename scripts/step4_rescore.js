// ─── STEP 4: RE-SCORE + PROBABILITIES ────────────────────
function RescoreStep({active,jdAnalysis,cpsResult,gapResolutions,result,stories,experience,onComplete,onError}) {
  const [loading,setLoading]=useState(false);
  const [scores,setScores]=useState(result?.scores||null);
  const [probs,setProbs]=useState(result?.probs||null);
  const [err,setErr]=useState(null);

  const initialAvg=cpsResult?Math.round(cpsResult.scores.reduce((a,s)=>a+s.score,0)/cpsResult.scores.length):0;
  const newAvg=scores?Math.round(scores.reduce((a,s)=>a+s.score,0)/scores.length):0;
  const delta=newAvg-initialAvg;
  const newGaps=scores?scores.filter(s=>s.score<70).length:0;
  const avgColor=newAvg>=75?'#639922':newAvg>=60?'#BA7517':'#A32D2D';
  const deltaColor=delta>0?'#3B6D11':delta<0?'#A32D2D':'var(--color-text-secondary)';

  async function run(){
    setLoading(true);setErr(null);
    const nl='\n';
    try{
      const expCtx=buildExpContext(experience);
      const eduCtx=EDUCATION_DATA.map(e=>e.cred+' — '+e.org+(e.year?' ('+e.year+')':'')+': '+e.note).join('; ');
      const storyCtx=stories.map(s=>'SOAR: '+s.title+' ('+s.employer+')'+nl+'Skills: '+(s.skills||s.themes||[]).join(', ')+nl+'Action: '+s.action+nl+'Result: '+s.result).join(nl+nl);

      // Re-score CPS
      const cpsRaw=await callClaude(
        'Score the candidate against each skill 0-100. Return ONLY valid JSON—no markdown fences. Schema: {"scores":[{"skill":"string","score":0,"evidence":"string","gap":"string","improve":"string"}]}',
        ['Skills:',nl,JSON.stringify(jdAnalysis.skills),nl+nl,'Experience:',nl,expCtx,nl+nl,'SOAR stories:',nl,storyCtx,nl+nl,'Education: ',eduCtx,nl+nl,'Competencies: ',COMPETENCIES].join(''),
        3000
      );
      console.log('[rescore] raw:', cpsRaw.slice(0,200));
      const cpsData=parseJSON(cpsRaw);
      if(!cpsData?.scores) throw new Error('Re-scoring failed. Raw: '+cpsRaw.slice(0,200));
      setScores(cpsData.scores);

      const rescoreAvg=Math.round(cpsData.scores.reduce((a,s)=>a+s.score,0)/cpsData.scores.length);
      const gapCount=cpsData.scores.filter(s=>s.score<70).length;
      const addedStories=(gapResolutions||[]).filter(r=>r.status==='story_added').length;
      const compMatchStatus=jdAnalysis.comp&&(jdAnalysis.comp.base_from||jdAnalysis.comp.base_to)?'mentioned':'not mentioned';

      // Probabilities
      const probRaw=await callClaude(
        'You are a hiring probability estimator. Given the candidate data, estimate three probabilities. Use these explicit weights: CPS avg contributes 50% to interview probability; comp match contributes 15%; seniority match contributes 15%; remaining gaps contribute -5% each up to -20%. P(offer|interviewed) depends on CPS avg (40%), gap count (30%), story quality (30%). P(overall) = P(interview) * P(offer|interviewed). Return ONLY valid JSON—no markdown: {"p_interview":0.0,"p_interview_reason":"string","p_offer":0.0,"p_offer_reason":"string","p_overall":0.0,"p_overall_reason":"string"}',
        'Role: '+jdAnalysis.role+' | Seniority: '+(jdAnalysis.seniority||'not specified')+' | Company: '+jdAnalysis.company+' | CPS average: '+rescoreAvg+'/100 | Initial CPS: '+initialAvg+'/100 | Gaps remaining: '+gapCount+' | Stories added in gap resolution: '+addedStories+' | Comp in JD: '+compMatchStatus,
        800
      );
      console.log('[probs] raw:', probRaw.slice(0,200));
      const probData=parseJSON(probRaw);
      if(!probData?.p_interview) throw new Error('Could not calculate probabilities. Raw: '+probRaw.slice(0,200));
      setProbs(probData);
    }catch(e){setErr(e.message);onError(e.message);}
    setLoading(false);
  }

  return(
    <div style={S.card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
        <div>
          <div style={{fontSize:14,fontWeight:500}}>Step 4 — Re-score &amp; Probabilities</div>
          {scores&&<div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:2}}>Updated with {stories.length} stories</div>}
        </div>
        {result&&<span style={{fontSize:11,padding:'2px 8px',background:'#EAF3DE',color:'#3B6D11',borderRadius:4,fontWeight:500}}>✓ Complete</span>}
      </div>

      {!scores&&!loading&&(
        <>
          <div style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:'1rem'}}>
            Re-score your updated profile and estimate application probabilities.
          </div>
          {err&&<div style={{fontSize:12,color:'#A32D2D',padding:'8px 12px',background:'#FCEBEB',borderRadius:6,marginBottom:'0.75rem'}}>⚠ {err}</div>}
          <button onClick={run} style={S.primary}>Re-score &amp; estimate odds →</button>
        </>
      )}

      {loading&&(
        <div style={{fontSize:13,color:'var(--color-text-secondary)'}}>Re-scoring profile and calculating probabilities…</div>
      )}

      {scores&&probs&&(
        <>
          {/* CPS Summary */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:8,marginBottom:'1.25rem'}}>
            <div style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'1rem'}}>
              <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                <div style={{fontSize:36,fontWeight:600,color:avgColor,lineHeight:1}}>{newAvg}</div>
                {delta!==0&&<div style={{fontSize:14,fontWeight:500,color:deltaColor}}>{delta>0?'+':''}{delta}</div>}
              </div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:4}}>CPS / 100 {delta!==0?'('+( delta>0?'up':'down')+' from '+initialAvg+')':''}</div>
            </div>
            <div style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'1rem'}}>
              <div style={{fontSize:28,fontWeight:500,color:newGaps>0?'#A32D2D':'#639922',lineHeight:1}}>{newGaps}</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:4}}>Gaps remaining</div>
            </div>
            <div style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'1rem'}}>
              <div style={{fontSize:28,fontWeight:500,color:'#639922',lineHeight:1}}>{scores.filter(s=>s.score>=75).length}</div>
              <div style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:4}}>Strong (75+)</div>
            </div>
          </div>

          {/* Probabilities */}
          <div style={{marginBottom:'1.25rem'}}>
            <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--color-text-tertiary)',marginBottom:'0.75rem'}}>Application probabilities</div>
            {[
              {label:'P(interview)',val:probs.p_interview,reason:probs.p_interview_reason},
              {label:'P(offer | interviewed)',val:probs.p_offer,reason:probs.p_offer_reason},
              {label:'P(overall)',val:probs.p_overall,reason:probs.p_overall_reason},
            ].map(row=>{
              const pct=Math.round((row.val||0)*100);
              const pc=pct>=40?'#639922':pct>=20?'#BA7517':'#A32D2D';
              return(
                <div key={row.label} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:'0.75rem',padding:'0.75rem',background:'var(--color-background-secondary)',borderRadius:8}}>
                  <div style={{width:48,flexShrink:0}}>
                    <div style={{fontSize:22,fontWeight:600,color:pc,lineHeight:1}}>{pct}%</div>
                    <div style={{fontSize:10,color:'var(--color-text-tertiary)',marginTop:2}}>{row.label}</div>
                  </div>
                  <div style={{fontSize:12,color:'var(--color-text-secondary)',lineHeight:1.6,paddingTop:2}}>{row.reason}</div>
                </div>
              );
            })}
          </div>

          {!result&&(
            <button onClick={()=>onComplete({scores,probs})} style={S.primary}>Generate resume →</button>
          )}
        </>
      )}
    </div>
  );
}

