function buildResumeRTF(resumeText) {
  const fontTbl='{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}';
  const colorTbl='{\\colortbl ;\\red30\\green58\\blue95;\\red37\\green99\\blue235;\\red31\\green41\\blue55;\\red107\\green114\\blue128;}';
  function secHead(t){return'\\pard\\sb240\\sa40\\cf1\\f0\\fs17\\b\\caps '+escRTF(t)+'\\b0\\caps0\\par\n'+'\\pard\\sb0\\sa80\\brdrb\\brdrs\\brdrw10\\brdrcolor2 \\par\n';}
  let body='';
  body+='\\pard\\sb0\\sa50\\cf1\\f0\\fs44\\b '+escRTF(CANDIDATE.name)+'\\b0\\par\n';
  body+='\\pard\\sb0\\sa40\\cf3\\f0\\fs20 '+escRTF(CANDIDATE.subtitle)+'\\par\n';
  body+='\\pard\\sb0\\sa160\\cf4\\f0\\fs17 '+escRTF(CANDIDATE.contact)+'\\par\n';
  body+='\\pard\\sb0\\sa0\\brdrb\\brdrs\\brdrw20\\brdrcolor1 \\par\n';
  if(resumeText){
    resumeText.split('\n').filter(l=>l.trim()).forEach(line=>{
      const t=line.trim();
      const isBullet=/^[•·\-]\s/.test(t);
      const isHeader=/[A-Z]{2}/.test(t)&&t===t.toUpperCase()&&!isBullet;
      if(isHeader)body+=secHead(t.replace(/:$/,''));
      else if(isBullet)body+='\\pard\\fi-200\\li360\\sb0\\sa40\\cf3\\f0\\fs18 \\u8226?  '+escRTF(t.replace(/^[•·\-\s]+/,''))+'\\par\n';
      else body+='\\pard\\sb0\\sa50\\cf3\\f0\\fs18 '+escRTF(t)+'\\par\n';
    });
  }
  return'{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033\n'+fontTbl+'\n'+colorTbl+'\n\\paperw12240\\paperh15840\\margl1008\\margr1008\\margt1008\\margb1008\n'+body+'}';
}

function buildFullCVRTF(exp) {
  const expData = exp || EXPERIENCE_DEFAULT;
  const p='#1e3a5f',a='#2563eb';
  function h2c(hex){const h=(hex||'#000').replace('#','');return[parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0];}
  const [pr,pg,pb]=h2c(p);const [ar,ag,ab]=h2c(a);
  const fontTbl='{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}';
  const colorTbl='{\\colortbl ;\\red'+pr+'\\green'+pg+'\\blue'+pb+';\\red'+ar+'\\green'+ag+'\\blue'+ab+';\\red31\\green41\\blue55;\\red107\\green114\\blue128;}';
  function secHead(t){return'\\pard\\sb200\\sa40\\cf1\\f0\\fs17\\b\\caps '+escRTF(t)+'\\b0\\caps0\\par\n'+'\\pard\\sb0\\sa80\\brdrb\\brdrs\\brdrw10\\brdrcolor2 \\par\n';}
  let body='';
  body+='\\pard\\sb0\\sa50\\cf1\\f0\\fs44\\b '+escRTF(CANDIDATE.name)+'\\b0\\par\n';
  body+='\\pard\\sb0\\sa40\\cf3\\f0\\fs20 '+escRTF(CANDIDATE.subtitle)+'\\par\n';
  body+='\\pard\\sb0\\sa160\\cf4\\f0\\fs17 '+escRTF(CANDIDATE.contact)+'\\par\n';
  body+='\\pard\\sb0\\sa0\\brdrb\\brdrs\\brdrw20\\brdrcolor1 \\par\n';
  body+=secHead('Professional Experience');
  expData.forEach(exp=>{
    body+='\\pard\\sb140\\sa0\\tqr\\tx9360\\cf3\\f0\\fs20\\b '+escRTF(exp.role)+'\\b0\\tab\\cf4\\fs17 '+escRTF(exp.dates)+'\\par\n';
    body+='\\pard\\sb0\\sa50\\cf2\\f0\\fs17\\i '+escRTF(exp.org)+'\\i0\\par\n';
    exp.bullets.forEach(b=>{body+='\\pard\\fi-200\\li360\\sb0\\sa40\\cf3\\f0\\fs18 \\u8226?  '+escRTF(b)+'\\par\n';});
    body+='\\pard\\sa80\\par\n';
  });
  body+=secHead('Education & Credentials');
  EDUCATION_DATA.forEach(e=>{
    body+='\\pard\\sb100\\sa0\\tqr\\tx9360\\cf3\\f0\\fs20\\b '+escRTF(e.cred)+'\\b0\\tab\\cf4\\fs17 '+escRTF(e.year||'')+'\\par\n';
    body+='\\pard\\sb0\\sa24\\cf2\\f0\\fs17\\i '+escRTF(e.org)+'\\i0\\par\n';
    body+='\\pard\\fi360\\sb0\\sa60\\cf3\\f0\\fs17 '+escRTF(e.note)+'\\par\n';
  });
  body+=secHead('Awards & Recognition');
  AWARDS_DATA.forEach(a=>{
    body+='\\pard\\sb80\\sa0\\tqr\\tx9360\\cf1\\f0\\fs18\\b \\u9733? '+escRTF(a.award)+'\\b0\\tab\\cf4\\fs17 '+escRTF(String(a.year))+'\\par\n';
    body+='\\pard\\fi360\\sb0\\sa60\\cf3\\f0\\fs17 '+escRTF(a.narrative)+'\\par\n';
  });
  return'{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1033\n'+fontTbl+'\n'+colorTbl+'\n\\paperw12240\\paperh15840\\margl1008\\margr1008\\margt1008\\margb1008\n'+body+'}';
}

