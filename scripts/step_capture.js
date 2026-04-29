function FreeAddView({stories,experience,awards,education,profileContext,onSave,onUpdateExperience,onUpdateAwards,onUpdateEducation,onUpdateProfileContext,onCancel}) {
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [saving,setSaving]=useState(false);
  const [proposals,setProposals]=useState(null);
  const [itemStates,setItemStates]=useState({});
  const [saved,setSaved]=useState(false);
  const [err,setErr]=useState("");
  const [saveErr,setSaveErr]=useState("");

  const expData=experience||EXPERIENCE_DEFAULT;

  const examples=[
    "I led a migration of our data warehouse to Snowflake — took six months, involved four teams, and cut query times by 80%",
    "I built a behavioral segmentation model that identified three member cohorts and informed a product redesign",
    "I won an Ovation Award for designing the Participant Outcomes Index — the whole business was measuring activity not outcomes, and I changed that",
    "I coached a junior analyst over six months and they were promoted — first time anyone on the team had been promoted in three years",
    "I want to update my headline to reflect I'm now targeting Chief Analytics Officer and VP Strategy roles at global asset managers",
  ];

  // ── Similarity helpers ─────────────────────────────────────
  function tokenOverlap(a,b){
    const toks=s=>new Set((s||'').toLowerCase().split(/\W+/).filter(t=>t.length>2));
    const ta=toks(a),tb=toks(b);
    const inter=[...ta].filter(t=>tb.has(t)).length;
    const union=new Set([...ta,...tb]).size;
    return union>0?inter/union:0;
  }

  function checkSim(item){
    if(item.type==='soar'){
      let best={score:0,match:null};
      stories.forEach(s=>{
        const title=tokenOverlap(item.data&&item.data.title||'',s.title||'');
        const combined=tokenOverlap(
          (item.data&&item.data.title||'')+' '+(item.data&&item.data.action||'').slice(0,200),
          (s.title||'')+' '+(s.action||'').slice(0,200)
        );
        const score=Math.max(title,combined*0.9);
        if(score>best.score)best={score,match:s};
      });
      if(best.score>=0.7)return{status:'similar',match:best.match,score:best.score};
      return{status:'new',match:null,score:best.score};
    }
    if(item.type==='experience_bullet'){
      const role=expData.find(e=>e.id===item.exp_id);
      if(!role)return{status:'new',match:null,score:0};
      let best={score:0,match:null};
      (role.bullets||[]).forEach(b=>{
        (item.data&&item.data.bullets||[]).forEach(nb=>{
          const sc=tokenOverlap(nb,b);
          if(sc>best.score)best={score:sc,match:b};
        });
      });
      if(best.score>=0.6)return{status:'similar',match:{text:best.match},score:best.score};
      return{status:'new',match:null,score:0};
    }
    if(item.type==='facet'){
      const role=expData.find(e=>e.id===(item.exp_id||''));
      if(!role)return{status:'new',match:null,score:0};
      const name=(item.data&&item.data.name||'').toLowerCase();
      const match=(role.facets||[]).find(f=>{
        const fn=(f.name||'').toLowerCase();
        return fn.includes(name)||name.includes(fn)||tokenOverlap(fn,name)>0.5;
      });
      if(match)return{status:'enrichment',match,score:1};
      return{status:'new',match:null,score:0};
    }
    if(item.type==='award'){
      const name=(item.data&&item.data.award||'').toLowerCase();
      const org=(item.data&&item.data.org||'').toLowerCase();
      const year=String(item.data&&item.data.year||'');
      const match=(awards||[]).find(a=>{
        const nm=tokenOverlap(name,(a.award||'').toLowerCase())>0.7;
        const om=(a.org||'').toLowerCase()===org;
        const ym=String(a.year||'')===year;
        return(nm&&om)||(nm&&ym)||(om&&ym);
      });
      if(match)return{status:'similar',match,score:1};
      return{status:'new',match:null,score:0};
    }
    if(item.type==='education'){
      const cred=(item.data&&item.data.cred||'').toLowerCase();
      const org=(item.data&&item.data.org||'').toLowerCase();
      const match=(education||[]).find(e=>(e.cred||'').toLowerCase()===cred&&(e.org||'').toLowerCase()===org);
      if(match)return{status:'similar',match,score:1};
      return{status:'new',match:null,score:0};
    }
    if(item.type==='profile_context'){
      return{status:'modification',match:profileContext,score:1};
    }
    return{status:'new',match:null,score:0};
  }

  // ── Analyze ────────────────────────────────────────────────
  async function analyze(){
    if(!input.trim()||busy)return;
    setBusy(true);setErr("");setProposals(null);setSaved(false);setSaveErr("");setItemStates({});
    try{
      const expSummary=expData.map(e=>e.id+': '+e.role+' at '+e.org+' ('+e.dates+')').join('\n');
      const text=await callClaude(
        'You are a career data assistant for Adam Waldman, a senior finance and analytics executive. Given free-form text about something he did, experienced, or wants to update, create structured career data. A single input can produce multiple items — classify everything relevant.\n\nReturn ONLY valid JSON:\n{\n  "analysis": "one sentence describing what was captured",\n  "items": [\n    {\n      "type": "soar",\n      "label": "short label",\n      "exp_id": "exp_001 or null",\n      "data": {"title":"","type":"career","employer":"","situation":"","obstacle":"","action":"","result":"","impact":"","fullStory":"3-4 sentences first person","themes":[],"skills":[],"useFor":["Resume","Interview"]}\n    },\n    {\n      "type": "experience_bullet",\n      "label": "short label",\n      "exp_id": "exp_001 or null if unclear",\n      "data": {"bullets":["bullet starting with strong action verb"]}\n    },\n    {\n      "type": "facet",\n      "label": "short label",\n      "exp_id": "exp_001 or null if unclear",\n      "data": {"name":"facet name","themes":[],"narrative":"facet paragraph describing this dimension of the role"}\n    },\n    {\n      "type": "award",\n      "label": "short label",\n      "data": {"award":"","org":"","year":2024,"narrative":""}\n    },\n    {\n      "type": "education",\n      "label": "short label",\n      "data": {"cred":"","org":"","year":"","note":""}\n    },\n    {\n      "type": "profile_context",\n      "label": "short label",\n      "data": {"headerTagline":null,"positioningSummary":null,"targetSeniority":null,"compFloorBase":null,"compFloorTotal":null,"geographicPreferences":null,"industriesExcluded":null}\n    }\n  ]\n}\n\nClassification rules:\n- Include ONLY item types relevant to the input — omit unused types from the array\n- soar: create when there is a clear situation→obstacle→action→result arc\n- experience_bullet: create when it clearly belongs to a specific role — exp_id null if role is ambiguous\n- facet: create when the input describes a dimension of a role (advisory function, leadership pattern, domain expertise) not captured as a SOAR story\n- award: ONLY if an award, prize, or named recognition is explicitly mentioned\n- education: ONLY if a credential, certification, or course is explicitly mentioned\n- profile_context: ONLY if user wants to update their headline, positioning, salary target, or location preferences. Include only non-null fields that should change.\n- A single input CAN produce multiple items (story + award, story + bullet, etc.)\n- Use Adams voice: confident, direct, outcome-focused. No em-dashes.',
        'Adams description:\n"'+input+'"\n\nHis roles (for exp_id matching):\n'+expSummary,
        4000, 0
      );
      const parsed=parseJSON(text);
      if(!parsed||!parsed.items||!parsed.items.length)throw new Error('No items returned — please try rephrasing.');
      const initStates={};
      parsed.items.forEach(function(item,i){
        const sim=checkSim(item);
        const defaultAction=sim.status==='enrichment'?'enrich':sim.status==='modification'?'apply':'save_new';
        initStates[i]={action:defaultAction,sim:sim,editing:false,editText:'',editData:null,roleOverride:null};
      });
      setProposals(parsed);
      setItemStates(initStates);
    }catch(e){
      setErr(e.message||'Something went wrong — please try again.');
    }
    setBusy(false);
  }

  function setIS(i,patch){setItemStates(function(s){return Object.assign({},s,{[i]:Object.assign({},s[i],patch)});});}

  // ── Save all ───────────────────────────────────────────────
  async function saveAll(){
    if(!proposals)return;
    setSaving(true);setSaveErr('');
    const expCopy=expData.map(function(e){
      return Object.assign({},e,{bullets:[].concat(e.bullets),facets:(e.facets||[]).map(function(f){return Object.assign({},f,{themes:[].concat(f.themes||[])});})});
    });
    let experienceChanged=false;
    const newAwards=[];
    const newEducation=[];
    let profileCtxPatch=null;

    try{
      for(let i=0;i<proposals.items.length;i++){
        const raw=proposals.items[i];
        const state=itemStates[i]||{};
        if(state.action==='discard')continue;
        const itemData=state.editData||raw.data;
        const eid=state.roleOverride||raw.exp_id;

        if(raw.type==='soar'){
          onSave(normalizeStory(Object.assign({},itemData,{id:Date.now()+i,dateAdded:new Date().toISOString().slice(0,10)})));
        } else if(raw.type==='experience_bullet'){
          const role=expCopy.find(function(e){return e.id===eid;});
          if(role&&itemData&&itemData.bullets&&itemData.bullets.length){
            role.bullets=role.bullets.concat(itemData.bullets);
            experienceChanged=true;
          }
        } else if(raw.type==='facet'){
          const role=expCopy.find(function(e){return e.id===eid;});
          if(role){
            const newFacet={name:itemData&&itemData.name||'',themes:itemData&&itemData.themes||[],narrative:itemData&&itemData.narrative||''};
            if(state.action==='enrich'&&state.sim&&state.sim.match){
              const fi=role.facets.findIndex(function(f){return f.name===(state.sim.match&&state.sim.match.name);});
              if(fi>=0){
                role.facets[fi]=Object.assign({},role.facets[fi],{
                  narrative:role.facets[fi].narrative+'\n\n'+newFacet.narrative,
                  themes:[].concat(new Set([].concat(role.facets[fi].themes||[]).concat(newFacet.themes))),
                });
              } else {role.facets=role.facets.concat([newFacet]);}
            } else if(state.action==='replace'&&state.sim&&state.sim.match){
              const fi=role.facets.findIndex(function(f){return f.name===(state.sim.match&&state.sim.match.name);});
              if(fi>=0)role.facets[fi]=newFacet; else role.facets=role.facets.concat([newFacet]);
            } else {
              role.facets=role.facets.concat([newFacet]);
            }
            experienceChanged=true;
          }
        } else if(raw.type==='award'){
          newAwards.push(itemData);
        } else if(raw.type==='education'){
          newEducation.push(itemData);
        } else if(raw.type==='profile_context'){
          profileCtxPatch=Object.assign({},profileCtxPatch||{},itemData);
        }
      }

      for(let j=0;j<newAwards.length;j++){await insertAward(newAwards[j]);}
      for(let j=0;j<newEducation.length;j++){await insertEducation(newEducation[j]);}

      if(profileCtxPatch&&profileContext){
        const filtered={};
        Object.entries(profileCtxPatch).forEach(function(pair){if(pair[1]!==null)filtered[pair[0]]=pair[1];});
        const merged=Object.assign({},profileContext,filtered);
        await saveProfileContext(merged);
        if(onUpdateProfileContext)onUpdateProfileContext(merged);
      }

      if(experienceChanged)onUpdateExperience(expCopy);

      if(newAwards.length>0){
        try{const aw=await getAwards();if(onUpdateAwards)onUpdateAwards(aw);}catch(e){}
      }
      if(newEducation.length>0){
        try{const edu=await getEducation();if(onUpdateEducation)onUpdateEducation(edu);}catch(e){}
      }

      setSaved(true);
    }catch(e){
      setSaveErr('Save failed: '+e.message);
    }
    setSaving(false);
  }

  // ── Type / status config ───────────────────────────────────
  const TC={
    soar:              {bg:'#d1fae5',color:'#065f46',label:'SOAR Story'},
    experience_bullet: {bg:'#dbeafe',color:'#1e40af',label:'Experience Bullet'},
    facet:             {bg:'#e0e7ff',color:'#3730a3',label:'Facet Enrichment'},
    award:             {bg:'#fef3c7',color:'#92400e',label:'Award'},
    education:         {bg:'#ede9fe',color:'#4c1d95',label:'Education'},
    profile_context:   {bg:'#fce7f3',color:'#831843',label:'Profile Context'},
  };
  const STAT={
    new:          {label:'NEW',bg:'#f0fdf4',color:'#15803d'},
    similar:      {label:'SIMILAR TO EXISTING',bg:'#fff7ed',color:'#c2410c'},
    enrichment:   {label:'ENRICHMENT',bg:'#eff6ff',color:'#1d4ed8'},
    modification: {label:'MODIFICATION',bg:'#faf5ff',color:'#7e22ce'},
  };

  // ── Saved screen ───────────────────────────────────────────
  if(saved)return(
    <div style={{paddingTop:'1.5rem',maxWidth:640}}>
      <div style={{background:'#d1fae5',borderRadius:10,padding:'1.5rem',marginBottom:'1.5rem',borderLeft:'3px solid #10b981'}}>
        <div style={{fontSize:16,fontWeight:500,color:'#065f46',marginBottom:4}}>Saved to your library</div>
        <div style={{fontSize:13,color:'#065f46',lineHeight:1.6}}>
          {proposals.items.filter(function(_,i){return itemStates[i]&&itemStates[i].action!=='discard';}).map(function(item,i){
            const tc=TC[item.type]||TC.soar;
            return <div key={i} style={{marginBottom:3}}>· <strong>{item.label}</strong> {String.fromCharCode(8594)} <span style={{background:tc.bg,color:tc.color,fontSize:11,padding:'1px 6px',borderRadius:4,fontWeight:500}}>{tc.label}</span></div>;
          })}
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={function(){setInput('');setProposals(null);setItemStates({});setSaved(false);}} style={{...css.ghost}}>Capture another</button>
        <button onClick={onCancel} style={{...css.ghost}}>Back to library</button>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────
  return(
    <div style={{paddingTop:'1.5rem',maxWidth:680}}>
      <div style={{marginBottom:'1.5rem'}}>
        <div style={{fontSize:20,fontWeight:500,marginBottom:4}}>Capture something</div>
        <div style={{fontSize:13,color:'var(--color-text-secondary)',lineHeight:1.6}}>
          Describe anything in plain language — a story, an award, a new credential, a role update, or a headline change. PHIS will classify and structure it.
        </div>
      </div>

      <div style={{marginBottom:14}}>
        <textarea
          value={input}
          onChange={function(e){setInput(e.target.value);}}
          onKeyDown={function(e){if(e.key==='Enter'&&e.metaKey)analyze();}}
          placeholder="e.g. I led a data lake migration at Manulife that took eight months and consolidated 14 source systems. It was politically complex — each team owned their data. I built a governance model, standardized definitions, and by the end query times dropped 80%..."
          style={{...css.inp,minHeight:140,resize:'vertical',lineHeight:1.7,display:'block'}}
        />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div style={{fontSize:11,color:'var(--color-text-tertiary)'}}>The more detail you give, the richer the output. Cmd+Enter to submit.</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={onCancel} style={{...css.ghost}}>Cancel</button>
            <button onClick={analyze} disabled={!input.trim()||busy}
              style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:input.trim()&&!busy?'pointer':'default',background:input.trim()&&!busy?'var(--color-text-primary)':'var(--color-background-secondary)',color:input.trim()&&!busy?'var(--color-background-primary)':'var(--color-text-tertiary)',fontSize:13,fontWeight:500}}>
              {busy?'Analyzing...':'Analyze'}
            </button>
          </div>
        </div>
      </div>

      {!proposals&&!busy&&(
        <div>
          <div style={{fontSize:12,color:'var(--color-text-tertiary)',marginBottom:8}}>Examples of what you can capture:</div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {examples.map(function(ex,i){
              return(
                <button key={i} onClick={function(){setInput(ex);}}
                  style={{fontSize:12,padding:'8px 12px',border:'0.5px solid var(--color-border-secondary)',borderRadius:8,background:'none',color:'var(--color-text-secondary)',cursor:'pointer',textAlign:'left',lineHeight:1.5}}>
                  {ex}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {busy&&(
        <div style={{textAlign:'center',padding:'3rem',color:'var(--color-text-secondary)',fontSize:13}}>
          <div style={{fontSize:22,marginBottom:12}}>&#x1F9E0;</div>
          Analyzing and classifying your input...
        </div>
      )}

      {err&&<div style={{fontSize:13,color:'#b91c1c',padding:'10px 14px',background:'#fee2e2',borderRadius:8,marginBottom:'1rem'}}>{err}</div>}
      {saveErr&&<div style={{fontSize:13,color:'#b91c1c',padding:'10px 14px',background:'#fee2e2',borderRadius:8,marginBottom:'1rem'}}>{saveErr}</div>}

      {proposals&&(
        <div>
          <div style={{background:'var(--color-background-secondary)',borderRadius:8,padding:'10px 14px',marginBottom:'1.25rem',fontSize:13,color:'var(--color-text-primary)',lineHeight:1.6,borderLeft:'3px solid #3b82f6'}}>
            PHIS extracted {proposals.items.length} item{proposals.items.length!==1?'s':''} — {proposals.analysis}
          </div>

          <div style={{fontSize:11,fontWeight:600,color:'var(--color-text-tertiary)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'0.75rem'}}>
            Review and confirm each item before saving
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:'1.5rem'}}>
            {proposals.items.map(function(item,i){
              const tc=TC[item.type]||TC.soar;
              const state=itemStates[i]||{action:'save_new',sim:{status:'new',match:null}};
              const sim=state.sim||{status:'new',match:null};
              const statusCfg=STAT[sim.status]||STAT.new;
              const discarded=state.action==='discard';
              const editing=state.editing;
              const eid=state.roleOverride||item.exp_id;
              const expMatch=expData.find(function(e){return e.id===eid;});
              const needsRole=(item.type==='experience_bullet'||item.type==='facet')&&!eid;
              const itemData=state.editData||item.data;

              return(
                <div key={i} style={{border:'1.5px solid '+(discarded?'var(--color-border-tertiary)':tc.color+'55'),borderRadius:10,padding:'1rem 1.25rem',background:discarded?'var(--color-background-secondary)':'var(--color-background-primary)',opacity:discarded?0.5:1,transition:'all 0.15s'}}>

                  {/* Header row */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,gap:8}}>
                    <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:6}}>
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,background:tc.bg,color:tc.color,fontWeight:600,whiteSpace:'nowrap'}}>{tc.label}</span>
                      <span style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)'}}>{item.label}</span>
                    </div>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:4,background:statusCfg.bg,color:statusCfg.color,fontWeight:600,whiteSpace:'nowrap',flexShrink:0}}>{statusCfg.label}</span>
                  </div>

                  {/* Similarity context */}
                  {sim.status==='similar'&&sim.match&&(
                    <div style={{fontSize:11,color:'#c2410c',background:'#fff7ed',padding:'6px 10px',borderRadius:6,marginBottom:8}}>
                      Similar to existing: <strong>{sim.match.title||sim.match.award||(sim.match.text&&sim.match.text.slice(0,60))|(sim.match.cred&&sim.match.cred+' - '+sim.match.org)||'existing record'}</strong>{sim.score<1?' ('+Math.round(sim.score*100)+'% overlap)':''}
                    </div>
                  )}
                  {sim.status==='enrichment'&&sim.match&&(
                    <div style={{fontSize:11,color:'#1d4ed8',background:'#eff6ff',padding:'6px 10px',borderRadius:6,marginBottom:8}}>
                      Matching facet: <strong>{sim.match.name}</strong> — narrative will be appended and themes merged
                    </div>
                  )}
                  {sim.status==='modification'&&(
                    <div style={{fontSize:11,color:'#7e22ce',background:'#faf5ff',padding:'6px 10px',borderRadius:6,marginBottom:8}}>
                      Modifies your profile context row — review the fields below before saving
                    </div>
                  )}

                  {/* Role selector */}
                  {(item.type==='experience_bullet'||item.type==='facet')&&(
                    <div style={{marginBottom:8}}>
                      <select
                        value={eid||''}
                        onChange={function(e){setIS(i,{roleOverride:e.target.value||null});}}
                        style={{fontSize:12,padding:'4px 8px',borderRadius:6,border:'0.5px solid var(--color-border-secondary)',background:'var(--color-background-primary)',color:needsRole?'#c2410c':'var(--color-text-primary)',width:'100%'}}>
                        <option value="">{needsRole?'-- Select role (required) --':'-- Override inferred role --'}</option>
                        {expData.map(function(e){return <option key={e.id} value={e.id}>{e.role} - {e.org}</option>;})}
                      </select>
                      {expMatch&&<div style={{fontSize:11,color:'var(--color-text-tertiary)',marginTop:3}}>Inferred: {expMatch.role} - {expMatch.org}</div>}
                    </div>
                  )}

                  {/* Content preview */}
                  {!editing&&(
                    <div style={{fontSize:12,color:'var(--color-text-secondary)',lineHeight:1.65,marginBottom:10}}>
                      {item.type==='soar'&&itemData&&(
                        <>
                          {itemData.situation&&<div style={{marginBottom:3}}><strong>Situation:</strong> {itemData.situation}</div>}
                          {itemData.action&&<div style={{marginBottom:3}}><strong>Action:</strong> {itemData.action}</div>}
                          {itemData.result&&<div style={{marginBottom:3}}><strong>Result:</strong> {itemData.result}</div>}
                          {itemData.impact&&<div style={{marginBottom:3}}><strong>Impact:</strong> {itemData.impact}</div>}
                          {itemData.skills&&itemData.skills.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>{itemData.skills.map(function(s){return <Tag key={s} label={s} variant="skill"/>;})}</div>}
                        </>
                      )}
                      {item.type==='experience_bullet'&&itemData&&(
                        <>{(itemData.bullets||[]).map(function(b,bi){return(
                          <div key={bi} style={{display:'flex',gap:8,marginBottom:4,alignItems:'flex-start'}}>
                            <span style={{color:'#10b981',fontWeight:700,flexShrink:0}}>+</span><span>{b}</span>
                          </div>
                        );})}</>
                      )}
                      {item.type==='facet'&&itemData&&(
                        <>
                          <div style={{marginBottom:3}}><strong>Name:</strong> {itemData.name}</div>
                          {itemData.narrative&&<div style={{marginBottom:3}}><strong>Narrative:</strong> {itemData.narrative}</div>}
                          {itemData.themes&&itemData.themes.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>{itemData.themes.map(function(t){return <Tag key={t} label={t} variant="theme"/>;})}</div>}
                          {sim.status==='enrichment'&&sim.match&&(
                            <div style={{marginTop:8,padding:'6px 10px',background:'var(--color-background-secondary)',borderRadius:6}}>
                              <div style={{fontSize:10,fontWeight:600,color:'var(--color-text-tertiary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Existing narrative (will be preserved):</div>
                              <div style={{fontSize:11,color:'var(--color-text-secondary)'}}>{(sim.match.narrative||'').slice(0,240)}{(sim.match.narrative||'').length>240?'...':''}</div>
                            </div>
                          )}
                        </>
                      )}
                      {item.type==='award'&&itemData&&(
                        <>
                          <div style={{marginBottom:3}}><strong>{itemData.award}</strong> - {itemData.org} - {itemData.year}</div>
                          {itemData.narrative&&<div>{itemData.narrative}</div>}
                        </>
                      )}
                      {item.type==='education'&&itemData&&(
                        <>
                          <div style={{marginBottom:3}}><strong>{itemData.cred}</strong> - {itemData.org} {itemData.year?'('+itemData.year+')':''}</div>
                          {itemData.note&&<div>{itemData.note}</div>}
                        </>
                      )}
                      {item.type==='profile_context'&&itemData&&(
                        <div>
                          {Object.entries(itemData).filter(function(pair){return pair[1]!==null;}).map(function(pair){
                            return(
                              <div key={pair[0]} style={{marginBottom:3}}>
                                <strong>{pair[0]}:</strong> {Array.isArray(pair[1])?pair[1].join(', '):String(pair[1])}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline JSON editor */}
                  {editing&&(
                    <div style={{marginBottom:10}}>
                      <textarea
                        value={state.editText||''}
                        onChange={function(e){setIS(i,{editText:e.target.value});}}
                        style={{...css.inp,fontSize:11,minHeight:130,fontFamily:'monospace',resize:'vertical',display:'block'}}
                      />
                      <div style={{display:'flex',gap:6,marginTop:6}}>
                        <button onClick={function(){
                          try{
                            const parsed=JSON.parse(state.editText||'{}');
                            setIS(i,{editing:false,editData:parsed});
                          }catch(ex){alert('Invalid JSON — check your edits.');}
                        }} style={{...css.ghost,fontSize:11,padding:'3px 10px',color:'#065f46',borderColor:'#6ee7b7'}}>Apply edits</button>
                        <button onClick={function(){setIS(i,{editing:false});}} style={{...css.ghost,fontSize:11,padding:'3px 10px'}}>Cancel edit</button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!discarded&&(
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
                      {sim.status==='enrichment'&&(
                        <>
                          <button onClick={function(){setIS(i,{action:'enrich'});}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid',cursor:'pointer',background:state.action==='enrich'?'#1d4ed8':'none',color:state.action==='enrich'?'#fff':'#1d4ed8',borderColor:'#93c5fd'}}>Enrich existing</button>
                          <button onClick={function(){setIS(i,{action:'replace'});}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid var(--color-border-secondary)',cursor:'pointer',background:state.action==='replace'?'#374151':'none',color:state.action==='replace'?'#fff':'var(--color-text-secondary)'}}>Replace</button>
                          <button onClick={function(){setIS(i,{action:'save_new'});}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid var(--color-border-secondary)',cursor:'pointer',background:state.action==='save_new'?'#374151':'none',color:state.action==='save_new'?'#fff':'var(--color-text-secondary)'}}>Save as new</button>
                        </>
                      )}
                      {sim.status==='similar'&&(
                        <button onClick={function(){setIS(i,{action:'save_new'});}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid',cursor:'pointer',background:state.action==='save_new'?'#065f46':'none',color:state.action==='save_new'?'#fff':'#065f46',borderColor:'#6ee7b7'}}>Save as new anyway</button>
                      )}
                      {sim.status==='modification'&&(
                        <button onClick={function(){setIS(i,{action:'apply'});}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid',cursor:'pointer',background:state.action==='apply'?'#7e22ce':'none',color:state.action==='apply'?'#fff':'#7e22ce',borderColor:'#d8b4fe'}}>Apply changes</button>
                      )}
                      {sim.status==='new'&&(
                        <button onClick={function(){setIS(i,{action:'save_new'});}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid',cursor:'pointer',background:state.action==='save_new'?'#065f46':'none',color:state.action==='save_new'?'#fff':'#065f46',borderColor:'#6ee7b7'}}>Save</button>
                      )}
                      <button onClick={function(){setIS(i,{editing:!editing,editText:JSON.stringify(state.editData||item.data,null,2)});}} style={{...css.ghost,fontSize:11,padding:'3px 10px'}}>Edit</button>
                      <button onClick={function(){setIS(i,{action:'discard'});}} style={{...css.ghost,fontSize:11,padding:'3px 10px',color:'#b91c1c',borderColor:'#fca5a5'}}>Discard</button>
                    </div>
                  )}
                  {discarded&&(
                    <button onClick={function(){
                      const sim=itemStates[i]&&itemStates[i].sim||{status:'new'};
                      setIS(i,{action:sim.status==='enrichment'?'enrich':sim.status==='modification'?'apply':'save_new'});
                    }} style={{...css.ghost,fontSize:11,padding:'3px 10px',color:'#065f46',borderColor:'#6ee7b7'}}>Restore</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={saveAll}
              disabled={saving||proposals.items.every(function(_,i){return itemStates[i]&&itemStates[i].action==='discard';})}
              style={{padding:'10px 22px',borderRadius:8,border:'none',cursor:'pointer',background:'var(--color-text-primary)',color:'var(--color-background-primary)',fontSize:14,fontWeight:500,opacity:saving||proposals.items.every(function(_,i){return itemStates[i]&&itemStates[i].action==='discard';})?0.5:1}}>
              {saving?'Saving...':'Save all'}
            </button>
            <button onClick={function(){proposals.items.forEach(function(_,i){setIS(i,{action:'discard'});});}} style={{...css.ghost}}>Discard all</button>
            <button onClick={function(){setProposals(null);setItemStates({});}} style={{...css.ghost}}>Try again</button>
          </div>
        </div>
      )}
    </div>
  );
}
