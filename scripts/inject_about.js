// Adds the guest About tab and wires in the PHIS film player.
const fs = require('fs');
const path = require('path');
const pageFile = 'app/page.js';
let src = fs.readFileSync(pageFile, 'utf8').replace(/\r/g, '');
const aboutSrc = fs.readFileSync(process.argv[2], 'utf8').replace(/\r/g, '');

function must(find, replace, label) {
  if (!src.includes(find)) { console.error('MISS: ' + label); process.exit(1); }
  src = src.replace(find, replace);
  console.log('ok: ' + label);
}

// 1. import the film player
must(
  "import { useState, useEffect, useMemo, useRef } from \"react\";",
  "import { useState, useEffect, useMemo, useRef } from \"react\";\nimport PhisFilm from './components/PhisFilm';",
  'PhisFilm import'
);

// 2. About tab in the guest nav
must(
  `    { id: "interview", label: "Interview Adam" },
  ];`,
  `    { id: "interview", label: "Interview Adam" },
    { id: "about", label: "About" },
  ];`,
  'nav entry'
);

// 3. insert GuestAboutView ahead of GuestFooter
const FOOTER_ANCHOR = '// Discreet Adam login. Sits quietly';
must(FOOTER_ANCHOR, aboutSrc + FOOTER_ANCHOR, 'GuestAboutView component');

// 4. render it in GuestShell (ungated: it is a pitch, not a tool)
must(
  `        {gpage === "fit" && captured && <GuestFitView stories={stories} experience={experience} guestSessionId={guestSessionId} onFitComplete={role => setFitRole(role)} />}`,
  `        {gpage === "fit" && captured && <GuestFitView stories={stories} experience={experience} guestSessionId={guestSessionId} onFitComplete={role => setFitRole(role)} />}
        {gpage === "about" && <GuestAboutView stories={stories} experience={experience} />}`,
  'GuestShell render'
);

fs.writeFileSync(pageFile, src.replace(/\n/g, '\r\n'), 'utf8');
console.log('page.js written');
