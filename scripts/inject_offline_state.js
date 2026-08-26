// The pause exposed a worse problem than the pause itself: when Supabase is
// unreachable the app silently substitutes the 64 hardcoded seed stories and
// renders blank awards, education, metrics and values, with no indication that
// anything is wrong. A recruiter opening the link during an outage would see a
// thin, wrong version of Adam's record and believe it, and the fit and
// interview tools would answer confidently from the wrong library. That is the
// exact failure this product exists to prevent.
//
// Fail visibly instead: retry once, and if the library genuinely cannot load,
// show guests a dignified offline card rather than wrong data, and show Adam a
// banner so he knows immediately.
//
// Written with the Write tool, not a heredoc. See the CRLF gotcha in CLAUDE.md.
const fs = require('fs');
const file = 'app/page.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

// 1. track whether the library actually loaded
must(
  '  const [splashDone, setSplashDone] = useState(false);',
  '  const [splashDone, setSplashDone] = useState(false);\n  const [dataOk, setDataOk] = useState(true);',
  'dataOk state'
);

// 2. retry once, then fall back loudly rather than quietly
must(
  `      try{
        const allBase=[...SEEDS,...EXTENDED_SOAR];
        const loaded=await seedAndGetStories(allBase);
        setStories(loaded.map(normalizeStory));
      }catch(e){setStories([...SEEDS,...EXTENDED_SOAR].map(normalizeStory));}`,
  `      // One retry before declaring the library unreachable, so a transient
      // blip does not show a visitor the offline card.
      const allBase=[...SEEDS,...EXTENDED_SOAR];
      let loaded=null;
      for(let attempt=0;attempt<2&&!loaded;attempt++){
        try{ loaded=await seedAndGetStories(allBase); }
        catch(e){ if(attempt===0) await new Promise(r=>setTimeout(r,1500)); }
      }
      if(loaded){ setStories(loaded.map(normalizeStory)); }
      else { setStories(allBase.map(normalizeStory)); setDataOk(false); }`,
  'retry and dataOk signal'
);

// 3. guests get an offline card instead of a wrong profile
must(
  '  if (mode === "guest") return <GuestShell',
  '  if (mode === "guest" && !dataOk) return <ServiceUnavailable />;\n  if (mode === "guest") return <GuestShell',
  'guest offline route'
);

// 4. Adam gets a banner, because he is the one who can fix it
must(
  '    <div style={{display:"flex",fontFamily:"inherit",minHeight:600,borderTop:"3px solid var(--phis-marigold)"}}>',
  `    <div style={{display:"flex",fontFamily:"inherit",minHeight:600,borderTop:"3px solid var(--phis-marigold)"}}>
      {!dataOk && (
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:300,background:"#A32D2D",color:"#fff",fontSize:12,padding:"7px 14px",textAlign:"center",fontFamily:"'Poppins', system-ui, sans-serif"}}>
          Database unreachable. Showing {SEEDS.length + EXTENDED_SOAR.length} local seed stories, not your library. Nothing on screen is trustworthy and visitors are seeing an offline card. Run <code style={{background:"rgba(255,255,255,0.18)",padding:"1px 5px",borderRadius:3}}>node scripts/check-supabase.js</code> to diagnose.
        </div>
      )}`,
  'adam offline banner'
);

// 5. the offline card itself, next to the splash
must(
  '// Lightweight info capture shown the first time a guest opens an AI tool',
  `// Shown to visitors when the story library cannot be loaded. Deliberately a
// holding card rather than a degraded profile: showing a recruiter 64 seed
// stories with blank awards and education is worse than showing them nothing,
// because they have no way to know it is wrong.
function ServiceUnavailable() {
  const GP = "'Poppins', system-ui, sans-serif";
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--phis-navy)", fontFamily: GP, padding: "0 1.5rem", textAlign: "center" }}>
      <PhisWordmark reversed height={38} />
      <div style={{ fontSize: 17, fontWeight: 300, color: "#fff", marginTop: 26, maxWidth: 430, lineHeight: 1.55 }}>
        PHIS is briefly offline while its library reconnects.
      </div>
      <div style={{ fontSize: 13, fontWeight: 300, color: "#9FB3C8", marginTop: 12, maxWidth: 430, lineHeight: 1.6 }}>
        Rather than show you a partial version of Adam's record, it is showing you nothing. Please check back in a few minutes.
      </div>
      <a href="mailto:adam.c.waldman@gmail.com" style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--phis-marigold)", marginTop: 30, textDecoration: "none", borderBottom: "1px solid rgba(234,106,26,0.45)", paddingBottom: 3 }}>
        Reach Adam directly
      </a>
    </div>
  );
}

// Lightweight info capture shown the first time a guest opens an AI tool`,
  'ServiceUnavailable component'
);

fs.writeFileSync(file, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('page.js written');
