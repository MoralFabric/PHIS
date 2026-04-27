// ─── STEP 3: GAP RESOLUTION ──────────────────────────────
function GapCard({gap, expanded, onMarkReal, onStartCapture, onSubmit, onAccept, onReject}) {
  const cap = expanded || null;
  const isDone = gap.status === 'confirmed_gap' || gap.status === 'story_added';
  const t = tierStyle(gap.score);

  if (isDone) return (
    <div style={{padding:'0.75rem 1rem',background:'var(--color-background-secondary)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:13,fontWeight:500,color:'var(--color-text-secondary)'}}>{gap.skill}</span>
        <span style={{fontSize:11,padding:'1px 7px',borderRadius:4,background:t.bg,color:t.color}}>{gap.score}</span>
      </div>
      <span style={{fontSize:12,color:gap.status==='story_added'?'#3B6D11':'var(--color-text-tertiary)'}}>
        {gap.status==='story_added'?'✓ Story added':'Confirmed gap'}
      </span>
    </div>
  );

  return (
    <div style={{...S.card,padding:'1rem'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.5rem'}}>
        <div>
          <span style={{fontWeight:500,fontSize:14}}>{gap.skill}</span>
          <span style={{fontSize:11,padding:'2px 7px',borderRadius:4,background:t.bg,color:t.color,fontWeight:500,marginLeft:8}}>{gap.score}/100</span>
        </div>
      </div>
      <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:'0.75rem',lineHeight:1.6}}>{gap.improve}</div>

      {!cap && (
        <div style={{display:'flex',gap:8}}>
          <button onClick={onMarkReal} style={{...S.btn,fontSize:12}}>This is a real gap</button>
          <button onClick={onStartCapture} style={{...S.primary,fontSize:12,padding:'6px 14px'}}>I have experience for this →</button>
        </div>
      )}

      {cap && !cap.preview && (
        <div>
          <label style={S.label}>Describe the experience or achievement</label>
          <textarea
            value={cap.text}
            onChange={e=>onSubmit('change',e.target.value)}
            style={{...S.textarea,minHeight:90,marginBottom:'0.75rem'}}
            placeholder={'Be specific — name the project, metrics, outcome, and your role. Claude will validate whether this genuinely demonstrates "'+gap.skill+'".'}
            disabled={cap.loading}
          />
          {cap.error && <div style={{fontSize:12,color:'#A32D2D',marginBottom:8,padding:'6px 10px',background:'#FCEBEB',borderRadius:5}}>⚠ {cap.error}</div>}
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>onSubmit('submit')} disabled={!cap.text.trim()||cap.loading}
              style={{...S.primary,fontSize:12,padding:'6px 14px',opacity:!cap.text.trim()||cap.loading?0.5:1}}>
              {cap.loading?'Evaluating…':'Submit for evaluation →'}
            </button>
            <button onClick={()=>onSubmit('cancel')} style={{...S.btn,fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}

      {cap?.preview && (
        <div>
          <div style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:8}}>AI-structured — review before saving:</div>
          <div style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'1rem',marginBottom:'0.75rem',fontSize:12}}>
            <div style={{fontWeight:500,marginBottom:6,fontSize:13}}>{cap.preview.title}</div>
            <div style={{marginBottom:4}}><strong>Situation:</strong> {cap.preview.situation}</div>
            <div style={{marginBottom:4}}><strong>Action:</strong> {cap.preview.action}</div>
            <div style={{marginBottom:8}}><strong>Result:</strong> {cap.preview.result}</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {cap.preview.skills?.map(s=><span key={s} style={S.tag}>{s}</span>)}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onAccept} style={S.primary}>Accept & save to library</button>
            <button onClick={onReject} style={S.btn}>Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GapResolutionStep({active,jdAnalysis,cpsResult,result,stories,setStories,onComplete,onError}) {
  const gaps = cpsResult.scores.filter(s=>s.score<70);
  const [resolutions,setResolutions] = useState(
    result || gaps.map(g=>({skill:g.skill,score:g.score,improve:g.improve,status:'pending'}))
  );
  const [expanded,setExpanded] = useState({});

  function markReal(skill){
    setResolutions(rs=>rs.map(r=>r.skill===skill?{...r,status:'confirmed_gap'}:r));
  }

  function startCapture(skill){
    setExpanded(e=>({...e,[skill]:{text:'',loading:false,preview:null,error:null}}));
  }

  function handleCapture(skill,action,val){
    if(action==='change'){
      setExpanded(e=>({...e,[skill]:{...e[skill],text:val}}));
      return;
    }
    if(action==='cancel'){
      setExpanded(e=>{const n={...e};delete n[skill];return n;});
      return;
    }
    if(action==='submit'){
      const cap=expanded[skill];
      if(!cap?.text?.trim())return;
      setExpanded(e=>({...e,[skill]:{...e[skill],loading:true,error:null}}));
      const gap=resolutions.find(r=>r.skill===skill);
      const schemaExample=JSON.stringify({accepted:true,story:{title:"",type:"career",employer:"",situation:"",obstacle:"",action:"",result:"",impact:"",fullStory:"",themes:[],skills:[],useFor:["Resume","Interview"],notes:""}});
      callClaude(
        'You are a career story evaluator. The candidate claims to have experience for a skill gap. Evaluate strictly. If the description genuinely demonstrates the skill, return a complete SOAR JSON. If not, explain why. Return ONLY valid JSON—no markdown fences. If accepted: '+schemaExample+'. If rejected: {"accepted":false,"reason":"one sentence"}',
        'Skill to demonstrate: '+skill+' | Gap context: '+gap.improve+' | Candidate description: '+cap.text,
        1500
      ).then(raw=>{
        const parsed=parseJSON(raw);
        if(!parsed) throw new Error('Could not parse Claude response—please try again.');
        if(parsed.accepted===false){
          setExpanded(e=>({...e,[skill]:{...e[skill],loading:false,error:parsed.reason||'Not accepted. Try describing more specifically.'}}));
        } else if(parsed.story){
          setExpanded(e=>({...e,[skill]:{...e[skill],loading:false,preview:parsed.story}}));
        } else {
          throw new Error('Unexpected response format.');
        }
      }).catch(err=>{
        setExpanded(e=>({...e,[skill]:{...e[skill],loading:false,error:err.message}}));
      });
    }
  }

  async function acceptStory(skill){
    const story=expanded[skill]?.preview;
    if(!story)return;
    const newStory=normalizeStory({...story,id:Date.now(),dateAdded:new Date().toISOString().split('T')[0]});
    const updated=[...stories,newStory];
    setStories(updated);
    try{await upsertStory(newStory);}catch(e){}
    setResolutions(rs=>rs.map(r=>r.skill===skill?{...r,status:'story_added',story:newStory}:r));
    setExpanded(e=>{const n={...e};delete n[skill];return n;});
  }

  function rejectStory(skill){
    setExpanded(e=>({...e,[skill]:{...e[skill],preview:null}}));
  }

  const allResolved=resolutions.every(r=>r.status!=='pending');
  const addedCount=resolutions.filter(r=>r.status==='story_added').length;

  return(
    <div style={S.card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}}>
        <div>
          <div style={{fontSize:14,fontWeight:500}}>Step 3 — Gap Resolution</div>
          <div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:2}}>
            {gaps.length} skill{gaps.length!==1?'s':''} below 70 — confirm gaps or add evidence
          </div>
        </div>
        {result&&<span style={{fontSize:11,padding:'2px 8px',background:'#EAF3DE',color:'#3B6D11',borderRadius:4,fontWeight:500}}>✓ Complete</span>}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:'1rem'}}>
        {resolutions.map(gap=>(
          <GapCard
            key={gap.skill}
            gap={gap}
            expanded={expanded[gap.skill]||null}
            onMarkReal={()=>markReal(gap.skill)}
            onStartCapture={()=>startCapture(gap.skill)}
            onSubmit={(action,val)=>handleCapture(gap.skill,action,val)}
            onAccept={()=>acceptStory(gap.skill)}
            onReject={()=>rejectStory(gap.skill)}
          />
        ))}
      </div>

      {allResolved&&!result&&(
        <div>
          {addedCount>0&&(
            <div style={{fontSize:12,color:'#3B6D11',marginBottom:'0.75rem',padding:'8px 12px',background:'#EAF3DE',borderRadius:6}}>
              ✓ {addedCount} new stor{addedCount!==1?'ies':'y'} added to your library
            </div>
          )}
          <button onClick={()=>onComplete(resolutions)} style={S.primary}>Re-score with updates →</button>
        </div>
      )}

      {gaps.length===0&&!result&&(
        <div style={{fontSize:13,color:'#3B6D11'}}>No gaps to resolve — all skills scored 70 or above.</div>
      )}
    </div>
  );
}

