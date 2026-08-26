// If the story library could not be loaded we already know the database is
// unreachable, so waiting on the other five calls only adds dead time before
// the offline card appears. Bail out as soon as the library fails, and tighten
// the story timeouts. Worst case offline detection drops from ~15s to ~8s,
// while a legitimately slow connection still gets 4s plus a 3.5s retry.
const fs = require('fs');
const file = 'app/page.js';
let s = fs.readFileSync(file, 'utf8').replace(/\r/g, '');

function must(find, repl, label) {
  if (!s.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  s = s.replace(find, repl);
  console.log('ok: ' + label);
}

must(
  `        try{ loaded=await withTimeout(seedAndGetStories(allBase), attempt===0?5000:4000); }
        catch(e){ if(attempt===0) await new Promise(r=>setTimeout(r,1000)); }
      }
      if(loaded){ setStories(loaded.map(normalizeStory)); }
      else { setStories(allBase.map(normalizeStory)); setDataOk(false); }`,
  `        try{ loaded=await withTimeout(seedAndGetStories(allBase), attempt===0?4000:3500); }
        catch(e){ if(attempt===0) await new Promise(r=>setTimeout(r,800)); }
      }
      if(!loaded){
        // The database is unreachable. The remaining reads would only add dead
        // time in front of the offline card, so stop here.
        setStories(allBase.map(normalizeStory));
        setDataOk(false);
        setLoading(false);
        return;
      }
      setStories(loaded.map(normalizeStory));`,
  'bail out when the library fails'
);

fs.writeFileSync(file, s.replace(/\n/g, '\r\n'), 'utf8');
console.log('page.js written');
