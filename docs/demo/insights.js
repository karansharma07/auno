/* AUNO 2.0 — data-driven demo insights and AUNO Now. Never describes simulations as real transactions. */
'use strict';
function aunoThemeControls(compact=false){
  const choices=[['system','◐','Follow system'],['light','☀','Light'],['dark','☾','Dark']];
  const pref=window.AunoTheme?.get()||'system';
  return compact?`<div class="theme-switcher" role="group" aria-label="Appearance">${choices.map(([v,i,t])=>`<button type="button" data-theme-choice="${v}" class="${pref===v?'active':''}" title="${t}" aria-label="${t} theme" aria-pressed="${pref===v}">${i}</button>`).join('')}</div>`
    :`<div class="theme-settings" role="group" aria-label="Appearance">${choices.map(([v,i,t])=>`<button type="button" data-theme-choice="${v}" class="${pref===v?'active':''}" aria-pressed="${pref===v}">${i} ${t}</button>`).join('')}</div>`;
}
function aunoNowPage(){
 const moods=[['people','♧','Meet people'],['play','🎾','Get active'],['explore','◇','Explore Dubai'],['unwind','☕','Unwind']];
 const places=[
  {name:'Dubai Marina Promenade',area:'Dubai Marina',time:90,mood:'explore',icon:'🌇',note:'A relaxed waterfront walk. Check conditions before setting out.',fee:'free'},
  {name:'Al Fahidi Historical Neighbourhood',area:'Old Dubai',time:120,mood:'explore',icon:'🏛️',note:'Heritage streets and architecture. Check venue opening hours.',fee:'free'},
  {name:'Dubai Creek',area:'Deira / Bur Dubai',time:95,mood:'explore',icon:'⛵',note:'A beautiful waterfront route with a classic city atmosphere.',fee:'variable'},
  {name:'JBR Beach Walk',area:'JBR',time:90,mood:'unwind',icon:'🌊',note:'Slow down along the beachfront and nearby promenades.',fee:'free'},
  {name:'Alserkal Avenue',area:'Al Quoz',time:130,mood:'unwind',icon:'🎨',note:'Art and creative spaces. Confirm exhibition hours and costs.',fee:'variable'},
  {name:'Kite Beach',area:'Jumeirah',time:110,mood:'play',icon:'🏃',note:'Outdoor movement and a coastal atmosphere. Check weather.',fee:'free'},
  {name:'Join a welcoming circle',area:'Community discovery',time:60,mood:'people',icon:'🤝',note:'Discover approved demo communities built around shared interests.',action:'circles',fee:'free'},
  {name:'Find a social plan',area:'Shared experiences',time:60,mood:'people',icon:'🗺️',note:'Look for a group plan in the fictional AUNO activity network.',action:'plans',fee:'variable'},
  {name:'Find a sports session',area:'Sports discovery',time:90,mood:'play',icon:'🏸',note:'Browse scheduled sessions and their simulated capacity.',action:'discover',fee:'variable'},
 ];
 const eligible=places.filter(p=>S.nowBudget==='flexible'||p.fee==='free');
 const choice=eligible.filter(p=>p.mood===S.nowMood && p.time<=S.nowTime*60).slice(0,3);
 const more=eligible.filter(p=>p.mood!==S.nowMood&&p.time<=S.nowTime*60).slice(0,2);
 const list=[...choice,...more];
 return `${header('AUNO Now','You tell us the mood and the time. We help make the city feel easier.',pill('Curated demo ideas · not live availability','outline'))}
 <div class="now-callout"><div><div class="eyebrow light">FROM INTENTION TO EXPERIENCE</div><h3>Good things start with “why not?”</h3><p>One small step to finding people, places and something worth doing today.</p></div>${btn('Build a full journey ↗','data-page="journeys"','brandlime')}</div>
 <section class="section"><div class="now-controls"><h2>What are you in the mood for?</h2><p class="insight-sub">We recommend by intent—not an endless social feed.</p><div class="now-options" role="group" aria-label="Your mood">${moods.map(([v,i,t])=>`<button class="${S.nowMood===v?'selected':''}" data-now-mood="${v}" aria-pressed="${S.nowMood===v}">${i} ${t}</button>`).join('')}</div>
 <div class="now-select-grid"><label>How much free time do you have?<select data-now-hours aria-label="Available hours">${[2,4,6,8].map(h=>`<option value="${h}" ${S.nowTime===h?'selected':''}>${h} hours</option>`).join('')}</select></label><label>Your preference<select data-now-budget aria-label="Budget preference"><option value="free" ${S.nowBudget==='free'?'selected':''}>Prefer free experiences</option><option value="flexible" ${S.nowBudget==='flexible'?'selected':''}>Flexible budget</option></select></label></div></div></section>
 <section class="section">${section('Ideas that fit','Curated concepts, not confirmed availability, prices or live routing.')}<div class="now-suggestions">${list.map((p,i)=>`<article class="now-place"><div class="place-symbol" aria-hidden="true">${p.icon}</div><span class="auno-v2-chip">${i<choice.length?'Matches your mood':'Worth considering'}</span><h3>${E(p.name)}</h3><div class="place-meta">⌖ ${E(p.area)} · ~${p.time} min · ${p.fee==='free'?'No ticket typically needed for public-area walk':'Costs may apply'}</div><p>${E(p.note)}</p>${btn(p.action?'Explore on AUNO':'Build a journey',`data-page="${p.action||'journeys'}"`,'secondary small')}</article>`).join('')}</div></section>
 <section class="section"><div class="info-banner">AUNO Now is a curated proof of concept. Real-world recommendations will require accurate venue hours, real bookings, current transport data, permitted group experiences and opt-in social discovery. Suggested durations exclude travel time. Public-area suggestions may still involve optional transport or activity costs.</div></section>`;
}
function aunoInsightsData(){
 const a=data().admin||{};const an=a.analytics||{};
 return {events:Array.isArray(an.events)?an.events:[],storage:Array.isArray(an.storage)?an.storage:[],communities:Array.isArray(an.communities)?an.communities:[],reports:Number(an.reports??a.reports?.length??0),connections:Number(an.connections??0),moments:Number(an.moments??0),members:Number(a.overview?.members??0)};
}
function aunoFilteredEvents(){
 const a=aunoInsightsData();const cutoff=new Date();const end=new Date(cutoff.getTime()+S.insightsDays*86400000);
 return a.events.filter(e=>{
  const d=new Date(e.start_at);const period=S.insightsDays===0||(!isNaN(+d)&&d>=new Date(cutoff.getTime()-86400000)&&d<=end);
  return period&&(S.insightsCategory==='All'||e.category===S.insightsCategory);
 });
}
function aunoMiniChart(rows){
 const total=Math.max(1,...rows.map(x=>x.booked||0));const W=640,H=205,pad=35;
 const barW=Math.max(18,(W-pad*2)/Math.max(rows.length,1)-20);
 const inner=W-pad*2;
 const g=rows.length?rows.map((r,i)=>{const x=pad+(i+.5)*inner/rows.length;const h=Math.max((Number(r.booked)||0)/total*135,3);return `<rect x="${x-barW/2}" y="${160-h}" width="${barW}" height="${h}" rx="6" fill="#4b9970"/><text x="${x}" y="${175}" text-anchor="middle">${E((r.title||'').slice(0,9))}</text><text x="${x}" y="${155-h}" text-anchor="middle" font-weight="bold">${Number(r.booked)||0}</text>`}).join(''):`<text x="320" y="105" text-anchor="middle">No matching sessions in this period</text>`;
 return `<svg class="insight-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Confirmed demonstration bookings for ${rows.length} events"><title>Demo event bookings by experience</title><desc>Each bar represents simulated reservations. The values are not actual sales.</desc><line x1="${pad}" x2="${W-pad}" y1="160" y2="160"/>${g}</svg>`;
}
function aunoInsightsPage(){
 const an=aunoInsightsData(),rows=aunoFilteredEvents();const all=an.events;
 const bookings=rows.reduce((n,e)=>n+Number(e.booked||0),0);
 const capacity=rows.reduce((n,e)=>n+Number(e.capacity||0),0);
 const attended=rows.reduce((n,e)=>n+Number(e.attended||0),0);
 const bookingValue=rows.reduce((n,e)=>n+Number(e.booked||0)*Number(e.price||0),0);
 const occupancy=capacity?bookings/capacity*100:0;
 const cats=['All',...new Set(all.map(e=>e.category))];
 const categoryStats=cats.filter(c=>c!=='All').map(c=>({category:c,count:rows.filter(e=>e.category===c).reduce((n,e)=>n+Number(e.booked||0),0)})).sort((a,b)=>b.count-a.count);
 const venueStats=[...new Set(rows.map(e=>e.area))].map(area=>({area,count:rows.filter(e=>e.area===area).length})).sort((a,b)=>b.count-a.count);
 const maxArea=Math.max(1,...venueStats.map(v=>v.count));
 const projectedGmv=S.bizBookings*S.bizTicket;
 const projectedRevenue=projectedGmv*S.bizTake/100;
 const projectedFees=S.bizBookings*(S.bizTicket*.029+1);
 const projectedMargin=projectedRevenue-projectedFees;
 return `${header('Mission Control','Make better decisions with operational signals, safer communities and honest numbers.',pill('Browser-local demo analytics','orange'))}
 <div class="workspace-welcome"><div><div class="eyebrow light">AUNO / INSIGHTS</div><h2>See the whole city, clearly.</h2><p>All current metrics below come from fictional local demo records. Transaction values are indicative, not processed revenue.</p></div>${btn('Export summary CSV','data-export-insights','brandlime')}</div>
 <section class="section"><div class="insight-actions"><div class="insight-filters" role="group" aria-label="Event date range">${[[7,'Next 7 days'],[30,'Next 30 days'],[0,'All dates']].map(([v,t])=>`<button data-insights-days="${v}" class="${S.insightsDays===v?'active':''}" aria-pressed="${S.insightsDays===v}">${t}</button>`).join('')}</div><div class="insight-filters" role="group" aria-label="Sport or event category">${cats.map(c=>`<button data-insights-category="${E(c)}" class="${S.insightsCategory===c?'active':''}" aria-pressed="${S.insightsCategory===c}">${E(c)}</button>`).join('')}</div></div>
 <div class="insight-kpis">
 ${[['◎','Member accounts',an.members,'Demo resident/visitor and host profiles'],['◷','Event reservations',bookings,'Status: booked · matching filtered events'],['▥','Booking value',`AED ${bookingValue.toLocaleString('en-AE')}`,'Hypothetical ticket face value · no payments'],['✧','Capacity filled',`${Math.round(occupancy)}%`,`${bookings} of ${capacity} listed places reserved`]].map(([i,t,v,s])=>`<div class="insight-kpi"><span class="k-icon">${i}</span><div class="k-title">${t}</div><strong>${v}</strong><small>${s}</small></div>`).join('')}
 </div><div class="insight-grid"><div class="insight-panel"><h3>Bookings by event</h3><p>Real-time within this browser's simulated records, including new test reservations.</p>${aunoMiniChart(rows)}<div class="insight-legend"><span><i></i> Confirmed demo bookings</span><span>${rows.length} matching experiences</span></div></div><div class="insight-panel"><h3>Seat occupancy</h3><p>Available spaces and booking progress by experience.</p><div class="insight-bars">${rows.length?rows.map(e=>{const p=e.capacity?Math.min(100,e.booked/e.capacity*100):0;return `<div><div class="insight-bar-label"><b>${E(e.title)}</b><span>${e.booked}/${e.capacity}</span></div><div class="insight-track" role="progressbar" aria-label="${E(e.title)} occupancy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p)}"><div class="insight-fill" style="width:${p}%"></div></div></div>`}).join(''):'<p>No sessions for this selection.</p>'}</div></div></div></section>
 <section class="section"><div class="insight-grid"><div class="insight-panel"><h3>Category performance</h3><p>Demonstration bookings by activity category.</p><div class="insight-bars">${categoryStats.length?categoryStats.map(x=>`<div><div class="insight-bar-label"><b>${E(x.category)}</b><span>${x.count} bookings</span></div><div class="insight-track"><div class="insight-fill" style="width:${bookings?Math.max(3,100*x.count/bookings):0}%"></div></div></div>`).join(''):'<p>There are no categories in this selection.</p>'}</div></div><div class="insight-panel"><h3>City activity footprint</h3><p>Number of listed experiences by neighbourhood.</p><div class="insight-bars">${venueStats.map(x=>`<div><div class="insight-bar-label"><b>${E(x.area)}</b><span>${x.count}</span></div><div class="insight-track"><div class="insight-fill" style="width:${100*x.count/maxArea}%"></div></div></div>`).join('')}</div></div></div></section>
 <section class="section"><div class="insight-grid"><div class="insight-panel"><h3>Trust & operations</h3><p>Actionable queues, not vanity metrics.</p><div class="insight-alert"><span><b>${an.reports} open safety report${an.reports===1?'':'s'}</b><small>Human review required before resolution</small></span>${btn('Review','data-page="admin"','outline small')}</div><div class="insight-alert"><span><b>${data().admin?.applications?.length||0} pending community applications</b><small>Screen organisers and review descriptions</small></span>${btn('Review','data-page="admin"','outline small')}</div><div class="insight-alert"><span><b>${an.storage.reduce((n,x)=>n+Number(x.activeBookings||0),0)} active storage handoffs</b><small>Demo custody states only; no physical inventory</small></span>${pill('Simulated','orange')}</div><div class="insight-alert"><span><b>${attended} demo event check-ins</b><small>Attendance confirmations are manually simulated</small></span>${pill('Participation','green')}</div></div><div class="insight-panel"><h3>Network pulse</h3><p>Signals from the seeded community ecosystem.</p><div class="insight-kpis" style="grid-template-columns:repeat(2,minmax(0,1fr));margin:0"><div class="insight-kpi"><span class="k-title">Communities</span><strong>${an.communities.length}</strong><small>Approved demo circles</small></div><div class="insight-kpi"><span class="k-title">Community memberships</span><strong>${an.communities.reduce((n,c)=>n+Number(c.members||0),0)}</strong><small>Includes multiple memberships per person</small></div><div class="insight-kpi"><span class="k-title">Social connections</span><strong>${an.connections}</strong><small>Accepted demo connections</small></div><div class="insight-kpi"><span class="k-title">Moments</span><strong>${an.moments}</strong><small>Visible community posts</small></div></div></div></div></section>
 <section class="section"><div class="insight-panel"><div class="section-head"><div><h2>Commercial scenario lab</h2><p>Explore hypothetical unit economics; these sliders do not alter financial records.</p></div>${pill('Forecast only','orange')}</div><div class="biz-sandbox"><label>Paid bookings per month <strong>${S.bizBookings.toLocaleString()}</strong><input data-biz="bookings" type="range" min="50" max="5000" step="50" value="${S.bizBookings}"/></label><label>Average ticket value <strong>AED ${S.bizTicket}</strong><input data-biz="ticket" type="range" min="20" max="250" step="5" value="${S.bizTicket}"/></label><label>Platform commission <strong>${S.bizTake}%</strong><input data-biz="take" type="range" min="5" max="25" step="1" value="${S.bizTake}"/></label><div class="biz-output"><small>Platform revenue before direct costs</small><strong>AED ${Math.round(projectedRevenue).toLocaleString('en-AE')}</strong><small>Gross booking volume AED ${projectedGmv.toLocaleString('en-AE')}</small></div></div><div class="biz-output" style="margin-top:16px"><small>Revenue less illustrative processing charges of 2.9% + AED 1 per booking</small><strong>AED ${Math.round(projectedMargin).toLocaleString('en-AE')}</strong><small>Not profit. Excludes operator/venue payouts, support, refunds, fraud, VAT, insurance, marketing and hosting. Payment fees are illustrative; actual PSP rates and routing may differ.</small></div></div></section>
 <section class="section"><div class="info-banner">Accuracy note: these dashboards use fictional demonstration accounts and booking states, not active business data. A production analytics warehouse will need timestamped transaction ledgers, consent controls, correct cohort definitions, finance reconciliation and privacy-safe aggregation.</div></section>`;
}
function aunoExportInsights(){
 const an=aunoInsightsData();const rows=aunoFilteredEvents();
 const csv=[['Metric','Value','Scope'],['demo_member_accounts',an.members,'All'],['demo_confirmed_bookings',rows.reduce((n,e)=>n+Number(e.booked||0),0),'Current event filter'],['demo_listed_capacity',rows.reduce((n,e)=>n+Number(e.capacity||0),0),'Current event filter'],['demo_ticket_face_value_aed',rows.reduce((n,e)=>n+Number(e.booked||0)*Number(e.price||0),0),'No money collected'],['open_demo_reports',an.reports,'All'],...rows.map(e=>[`event:${e.title}`,e.booked,`${e.category} · ${e.start_at}`])];
 const safe=s=>{const t=String(s??'');return '"'+(/^\s*[=+@\-]/.test(t)?"'"+t:t).replace(/"/g,'""')+'"'};
 const blob=new Blob([rowsToCsv(csv)],{type:'text/csv;charset=utf-8;'});
 function rowsToCsv(list){return list.map(x=>x.map(safe).join(',')).join('\r\n')}
 const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='auno-demo-insights.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
