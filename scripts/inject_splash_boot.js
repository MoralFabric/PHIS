// Boot experience fix:
//  1. BrandSplash becomes the loading screen (no more bare "Loading PHIS..." text)
//  2. Splash holds until data is ready, with a marigold progress sweep on slow loads
//  3. Independent Supabase reads run in parallel instead of six sequential round trips
const fs = require('fs');
const pageFile = 'app/page.js';
let src = fs.readFileSync(pageFile, 'utf8').replace(/\r/g, '');

function must(find, replace, label) {
  if (!src.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  src = src.replace(find, replace);
  console.log('ok: ' + label);
}

// ── 1. BrandSplash ────────────────────────────────────────
const OLD_SPLASH = `function BrandSplash({ onDone }) {
  const GP = "'Poppins', system-ui, sans-serif";
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLeaving(true), 1600); return () => clearTimeout(t); }, []);
  useEffect(() => { if (!leaving) return; const t = setTimeout(onDone, 500); return () => clearTimeout(t); }, [leaving]);
  return (
    <div onClick={() => setLeaving(true)}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--phis-navy)", fontFamily: GP, cursor: "pointer", opacity: leaving ? 0 : 1, transition: "opacity .5s ease" }}>
      <PhisWordmark reversed height={44} />
      <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.18em", color: "#7E93A8", textAlign: "center", marginTop: 18 }}>Professional History Intelligence Studio</div>
    </div>
  );
}`;

const NEW_SPLASH = `function BrandSplash({ onDone, waiting }) {
  const GP = "'Poppins', system-ui, sans-serif";
  const [minElapsed, setMinElapsed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Hold the brand beat for at least 1.6s so a fast load still feels composed,
  // then leave as soon as the data is in. A tap skips the beat but not the data.
  useEffect(() => { const t = setTimeout(() => setMinElapsed(true), 1600); return () => clearTimeout(t); }, []);
  useEffect(() => { if ((minElapsed || skipped) && !waiting) setLeaving(true); }, [minElapsed, skipped, waiting]);
  useEffect(() => { if (!leaving) return; const t = setTimeout(onDone, 500); return () => clearTimeout(t); }, [leaving]);
  // Only a genuinely slow connection ever sees the progress sweep.
  const stalled = (minElapsed || skipped) && waiting;
  return (
    <div onClick={() => setSkipped(true)}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--phis-navy)", fontFamily: GP, cursor: "pointer", opacity: leaving ? 0 : 1, transition: "opacity .5s ease" }}>
      <PhisWordmark reversed height={44} />
      <div style={{ fontSize: 11, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.18em", color: "#7E93A8", textAlign: "center", marginTop: 18 }}>Professional History Intelligence Studio</div>
      <div className={"phis-splash-track" + (stalled ? " is-visible" : "")} aria-hidden="true"><span /></div>
    </div>
  );
}`;
must(OLD_SPLASH, NEW_SPLASH, 'BrandSplash rewrite');

// ── 2. Splash replaces the bare loading text ──────────────
must(
  `  if(loading)return <div style={{padding:"2rem",color:"var(--phis-slate)",fontSize:14}}>Loading PHIS…</div>;
  if (!splashDone) return <BrandSplash onDone={() => setSplashDone(true)} />;`,
  `  if (loading || !splashDone) return <BrandSplash waiting={loading} onDone={() => setSplashDone(true)} />;`,
  'boot render order'
);

// ── 3. Parallel data load ─────────────────────────────────
const OLD_EFFECT = `      try{
        const exp=await getExperience();
        if(exp.length>0)setExperience(exp);
      }catch(e){}
      try{
        const prof=await getProfile();
        if(prof)setProfile(p=>({...p,
          baseSalaryFrom: prof.base_salary_from ?? p.baseSalaryFrom,
          baseSalaryTo:   prof.base_salary_to   ?? p.baseSalaryTo,
          totalCompFrom:  prof.total_comp_from   ?? p.totalCompFrom,
          totalCompTo:    prof.total_comp_to     ?? p.totalCompTo,
        }));
      }catch(e){}
      try{const aw=await getAwards();if(aw.length>0)setAwards(aw);}catch(e){}
      try{const edu=await getEducation();if(edu.length>0)setEducation(edu);}catch(e){}
      try{const ctx=await getProfileContext();if(ctx)setProfileContext(ctx);}catch(e){}
      setLoading(false);`;

const NEW_EFFECT = `      // These five reads are independent of each other and of the story load.
      // Running them together turns five sequential round trips into one.
      const settle=r=>r.status==="fulfilled"?r.value:null;
      const [exp,prof,aw,edu,ctx]=(await Promise.allSettled([
        getExperience(),getProfile(),getAwards(),getEducation(),getProfileContext(),
      ])).map(settle);
      if(exp&&exp.length>0)setExperience(exp);
      if(prof)setProfile(p=>({...p,
        baseSalaryFrom: prof.base_salary_from ?? p.baseSalaryFrom,
        baseSalaryTo:   prof.base_salary_to   ?? p.baseSalaryTo,
        totalCompFrom:  prof.total_comp_from   ?? p.totalCompFrom,
        totalCompTo:    prof.total_comp_to     ?? p.totalCompTo,
      }));
      if(aw&&aw.length>0)setAwards(aw);
      if(edu&&edu.length>0)setEducation(edu);
      if(ctx)setProfileContext(ctx);
      setLoading(false);`;
must(OLD_EFFECT, NEW_EFFECT, 'parallel data load');

fs.writeFileSync(pageFile, src.replace(/\n/g, '\r\n'), 'utf8');
console.log('page.js written');
