/* AUNO live suite. Every displayed record comes from Supabase; no seeded personas or demo APIs. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const datetime=x=>{try{return new Intl.DateTimeFormat('en-AE',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dubai'}).format(new Date(x))}catch{return 'Date unavailable'}};
const asDate=x=>x?String(x).slice(0,10):'';
const item=(head,copy,body='')=>`<article class="card"><h3>${esc(head)}</h3><p class="sub">${esc(copy)}</p>${body}</article>`;
const empty=(head,copy)=>`<div class="empty"><h3>${esc(head)}</h3><p>${esc(copy)}</p></div>`;
const button=(text,attr='',secondary=false)=>`<button class="btn${secondary?' secondary':''}" type="button" ${attr}>${esc(text)}</button>`;
const heading=(title,subtitle)=>`<div class="section-head"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></div>`;
const formBtn=text=>`<button class="btn" type="submit">${esc(text)}</button>`;
const field=(label,name,extra='')=>`<label>${esc(label)}<input name="${name}" ${extra}/></label>`;
const choose=(label,name,vals)=>`<label>${esc(label)}<select name="${name}">${vals.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label>`;
const errorNotice=msg=>`<div class="notice warning">${esc(msg)}</div>`;
const asArray=v=>Array.isArray(v)?v:[];
const formatCount=n=>new Intl.NumberFormat('en-AE').format(Number(n)||0);

const sources={
 circles:['circle_series','id,community_id,owner_id,title,description,area,cadence,capacity,status,created_at'],
 circleMembers:['circle_series_members','series_id,user_id,status'],
 stamps:['passport_stamps','id,user_id,stamp_key,source_type,source_id,awarded_at'],
 journeys:['member_journeys','id,title,destination,begins_on,duration_days,plan,created_at'],
 lens:['place_recommendations','id,author_id,title,area,category,tip,status,submitted_at'],
 savedLens:['saved_recommendations','user_id,recommendation_id'],
 tasks:['homebase_tasks','id,user_id,title,completed,created_at,completed_at'],
 templates:['host_event_templates','id,owner_id,community_id,name,category,venue,area,description,capacity'],
 business:['business_pilot_requests','id,requested_by,organisation_name,organisation_type,size_band,goal,proposal,status,created_at'],
 connections:['member_connections','id,requester_id,receiver_id,status,created_at'],
 blocks:['member_blocks','blocker_id,blocked_id,created_at'],
 people:['profiles','id,display_name,bio,interests,mode,discoverable'],
 privacy:['privacy_requests','id,user_id,request_type,status,created_at']
};
const adminSources={
 pendingLens:['place_recommendations','id,title,area,category,tip,status'],
 pendingBusiness:['business_pilot_requests','id,organisation_name,organisation_type,size_band,goal,proposal,status,contact_email'],
 pendingCircles:['circle_series','id,title,community_id,capacity,cadence,status'],
 allBookings:['event_bookings','id,event_id,user_id,status,created_at'],
 allCheckins:['event_checkins','booking_id,checked_in_at'],
 allPrivacy:['privacy_requests','id,request_type,status,created_at']
};
const state={loaded:false,errors:{},nowCategory:'All',nowHorizon:14,items:{},admin:{},dashboard:null,monthly:[]};

async function fetchBatch(db,defs,operator=false){
 const entries=Object.entries(defs);
 await Promise.all(entries.map(async([name,[table,columns]])=>{
  try{
   let q=db.from(table).select(columns).limit(operator?1000:250);
   if(name==='people')q=q.eq('discoverable',true);
   if(name==='pendingLens'||name==='pendingBusiness')q=q.eq('status','pending');
   if(name==='pendingCircles')q=q.eq('status','draft');
   const {data,error}=await q;
   if(error)throw error;
   (operator?state.admin:state.items)[name]=asArray(data);
   delete state.errors[name];
  }catch(e){state.errors[name]=`${table}: ${e.message||'Not available'}`;
   (operator?state.admin:state.items)[name]=[];}
 }));
}
export async function loadSuite(db,user,operator){
 if(!db||!user){state.loaded=false;return}
 state.errors={};
 await fetchBatch(db,sources);
 // RLS prevents other members' private records; operator queries return their authorised view.
 if(operator){
  await fetchBatch(db,adminSources,true);
  const [overview,monthly]=await Promise.all([db.rpc('operator_dashboard_overview'),db.rpc('operator_monthly_bookings',{p_months:12})]);
  state.dashboard=overview.error?null:overview.data;state.monthly=monthly.error?[]:asArray(monthly.data);
  if(overview.error)state.errors.operator_dashboard=overview.error.message;
  if(monthly.error)state.errors.operator_monthly=monthly.error.message;
 }else{state.admin={};state.dashboard=null;state.monthly=[];}
 state.loaded=true;
}
const list=key=>asArray(state.items[key]);
const adminList=key=>asArray(state.admin[key]);
const missing=(...keys)=>keys.some(key=>state.errors[key]);
function dependency(...keys){return errorNotice('This feature requires the live database migrations. Apply migrations 001, 002 and 003, then reload. No demonstration data is used here. '+keys.filter(k=>state.errors[k]).map(k=>state.errors[k]).join(' · '))}
const routeData=[
 ['life','AUNO Life','sparkles','Your connected world'],
 ['now','AUNO Now','clock','Find something that fits your time'],
 ['together','Together','users','Join recurring small groups'],
 ['passport','Passport','award','Real participation history'],
 ['concierge','Concierge','map','Plan and save your journeys'],
 ['lens','Local Lens','map-pin','Community-reviewed recommendations'],
 ['homebase','Homebase','home','Settle in with confidence'],
 ['people','People','heart','Opt-in introductions'],
 ['hostos','HostOS','calendar','Organise with confidence'],
 ['business','For Business','briefcase','Request a partnership']
];
export const suiteRoutes=routeData.map(x=>x.slice(0,2));
export function isSuiteRoute(route){return routeData.some(x=>x[0]===route)}
export function pageSuite(route,core){
 if(!state.loaded)return empty('Preparing your account','Loading secured data from the server.');
 const f={life,now,together,passport,concierge,lens,homebase,people,hostos,business}[route];
 return f?f(core):'';
}
function life(core){
 const destinations=[['AUNO Now','What can I do right now?','now'],['Together','Find a consistent circle','together'],['Passport','Your attended experiences','passport'],['Concierge','Plan your next city journey','concierge'],['Local Lens','Useful local discoveries','lens'],['Homebase','Get settled in your city','homebase'],['People','Meet members by mutual consent','people'],['HostOS','Build your community','hostos'],['For Business','Hotels, teams and residences','business']];
 return `<div class="banner life-banner"><div><span class="chip inverse">YOUR WORLD, CONNECTED</span><h1>A city is better when you're part of it.</h1><p>One account, real communities, real people and experiences you can actually join. Nothing here is fictional.</p></div></div>
 <section class="section">${heading('The AUNO experiences','Explore a connected set of useful services. Everything shown is backed by your account and approved records.')}
 <div class="experience-grid">${destinations.map(([name,description,route])=>`<button class="experience-tile" data-route="${route}"><span class="eyebrow">AUNO</span><strong>${esc(name)}</strong><small>${esc(description)}</small><span aria-hidden="true">↗</span></button>`).join('')}</div></section>`;
}
function now(core){
 const events=asArray(core.events).filter(e=>new Date(e.start_at)>new Date()&&e.status==='published');
 const cats=['All',...new Set(events.map(e=>e.category))];const horizon=state.nowHorizon;
 const filtered=events.filter(e=>state.nowCategory==='All'||e.category===state.nowCategory).filter(e=>new Date(e.start_at)<=new Date(Date.now()+horizon*86400000));
 return `${heading('AUNO Now','Discover published experiences that fit your real availability. No invented availability or venue data.')}
 <div class="filter-tray"><label>Interest<select id="now-category">${cats.map(c=>`<option ${state.nowCategory===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
 <label>When<select id="now-horizon"><option value="1" ${horizon===1?'selected':''}>Today and tomorrow</option><option value="7" ${horizon===7?'selected':''}>Next 7 days</option><option value="14" ${horizon===14?'selected':''}>Next 14 days</option><option value="30" ${horizon===30?'selected':''}>Next 30 days</option></select></label></div>
 <section class="section"><div class="grid">${filtered.map(e=>item(e.title,`${datetime(e.start_at)} · ${e.area} · ${e.venue}`,`<div class="card-footer"><span class="chip">${e.price_aed_cents===0?'Free event':'Paid booking unavailable'}</span>${button('View event','data-route="discover"',true)}</div>`)).join('')}</div>${filtered.length?'':empty('No matching experiences yet','Try a wider date range, or check back after organisers publish activities.')}</section>`;
}
function together(core){if(missing('circles','circleMembers'))return dependency('circles','circleMembers');
 const memberships=new Map(list('circleMembers').filter(m=>m.user_id===core.user.id).map(m=>[m.series_id,m.status]));
 const active=list('circles').filter(x=>x.status==='published');
 const owned=asArray(core.communities).filter(c=>c.owner_id===core.user.id&&c.status==='approved');
 return `${heading('AUNO Together','Recurring groups with real membership records and organiser approval.')}
 <div class="grid">${active.map(c=>item(c.title,`${c.description} · ${c.area} · ${c.cadence}`,`<div class="card-footer"><span class="chip">Up to ${c.capacity} members</span>${memberships.get(c.id)==='joined'?button('Leave circle',`data-x-leave-circle="${c.id}"`,true):button('Join circle',`data-x-join-circle="${c.id}"`)}</div>`)).join('')}</div>
 ${active.length?'':empty('The first circles are being formed','Approved organisers can create a recurring group; operators review it before publication.')}
 ${owned.length?`<section class="section"><form class="form" data-extra-form="circle"><h2>Create a recurring circle</h2>${choose('Community','community_id',owned.map(x=>[x.id,x.name]))}${field('Circle name','title','required minlength="4" maxlength="100"')}<label>Description<textarea required minlength="20" name="description" maxlength="1200"></textarea></label>${field('Neighbourhood','area','required minlength="2" maxlength="100"')}${choose('Cadence','cadence',[['weekly','Weekly'],['fortnightly','Fortnightly'],['monthly','Monthly']])}${field('Maximum members','capacity','required type="number" min="3" max="30" value="12"')}${formBtn('Submit circle for review')}</form></section>`:''}`;
}
function passport(core){if(missing('stamps'))return dependency('stamps');
 const stamps=list('stamps');return `${heading('AUNO Passport','Your real attendance history. Stamps are awarded by authorised event check-ins, never by self-reporting.')}
 <div class="kpi-grid"><div class="kpi"><small>Earned stamps</small><strong>${formatCount(stamps.length)}</strong></div><div class="kpi"><small>Different experiences</small><strong>${formatCount(new Set(stamps.map(s=>s.source_id)).size)}</strong></div></div>
 <section class="section">${stamps.length?`<div class="grid">${stamps.map(s=>item('Experience attended',`${datetime(s.awarded_at)} · Recorded through an authorised event check-in`,`<span class="chip">${esc(s.source_type.replaceAll('_',' '))}</span>`)).join('')}</div>`:empty('Your story starts with showing up','Reserve an approved event and attend it. The operator can record your check-in afterwards.')}</section>`;
}
function concierge(core){if(missing('journeys','lens'))return dependency('journeys','lens');
 const places=list('lens').filter(p=>p.status==='approved');const journeys=list('journeys').filter(j=>j.user_id===core.user.id);
 return `${heading('AUNO Concierge','Build a real, saved travel plan from approved local recommendations. Time-aware routing and live attraction inventory are not yet connected.')}
 <div class="split section"><form class="form" data-extra-form="journey"><h2>Create your journey</h2>${field('Journey name','title','required minlength="3" maxlength="100"')}${field('Destination','destination','required minlength="2" maxlength="100" value="Dubai"')}${field('Start date','begins_on','required type="date"')}${field('Number of days','duration_days','required type="number" min="1" max="30" value="3"')}
 <label>Approved places to include<select name="place_ids" multiple size="${Math.min(7,Math.max(3,places.length))}" aria-label="Select multiple recommended places">${places.map(p=>`<option value="${p.id}">${esc(p.title)} · ${esc(p.area)}</option>`).join('')}</select></label><p class="small muted">Use Ctrl/Command to select several places. AUNO does not guarantee opening hours, directions or availability. Verify each stop directly.</p>${formBtn('Save itinerary')}</form>
 <div class="card"><h2>Your saved journeys</h2>${journeys.length?journeys.map(j=>`<div class="row-item"><div><b>${esc(j.title)}</b><p>${esc(j.destination)} · ${esc(asDate(j.begins_on))} · ${j.duration_days} day(s)</p><p>${asArray(j.plan).map(p=>esc(p.title)).join(' • ')||'No stops chosen'}</p></div>${button('Delete',`data-x-delete-journey="${j.id}"`,true)}</div>`).join(''):empty('No journeys yet','Save your first itinerary. It will be private to your account.')}</div></div>`;
}
function lens(core){if(missing('lens','savedLens'))return dependency('lens','savedLens');
 const saved=new Set(list('savedLens').filter(s=>s.user_id===core.user.id).map(s=>s.recommendation_id));
 const approved=list('lens').filter(x=>x.status==='approved');const own=list('lens').filter(x=>x.author_id===core.user.id&&x.status!=='approved');
 return `${heading('AUNO Local Lens','Useful local recommendations from real members, published only after moderator approval.')}
 <div class="grid">${approved.map(p=>item(p.title,`${p.area} · ${p.category} · ${p.tip}`,`<div class="card-footer"><span class="chip">Community recommendation</span>${button(saved.has(p.id)?'Unsave':'Save',`data-x-save-place="${p.id}"`,true)}</div>`)).join('')}</div>${approved.length?'':empty('Be among the first local contributors','Only reviewed submissions appear here; there are no fabricated place reviews.')}
 <div class="split section"><form class="form" data-extra-form="place"><h2>Share a real local tip</h2>${field('Place name','title','required minlength="3" maxlength="100"')}${field('Neighbourhood','area','required minlength="2" maxlength="100"')}${choose('Category','category',['Culture','Art','Food','Outdoors','Sports'].map(c=>[c,c]))}<label>Why is it worth visiting?<textarea name="tip" minlength="20" maxlength="600" required></textarea></label><p class="small muted">Your recommendation will be reviewed. Never claim verification that hasn't occurred.</p>${formBtn('Submit for review')}</form><div class="card"><h2>My submissions</h2>${own.length?own.map(x=>`<div class="kv"><b>${esc(x.title)}</b><span>${esc(x.status)}</span></div>`).join(''):empty('Nothing submitted yet','Your pending and rejected submissions will appear here.')}</div></div>`;
}
function homebase(core){if(missing('tasks'))return dependency('tasks');
 const tasks=list('tasks').filter(x=>x.user_id===core.user.id);const complete=tasks.filter(x=>x.completed).length;
 return `${heading('AUNO Homebase','Your private relocation and settling-in checklist. You create the tasks; AUNO stores your progress securely.')}
 <div class="split section"><div class="card"><h2>${complete} of ${tasks.length} tasks complete</h2><div class="bar-track"><i style="width:${tasks.length?complete/tasks.length*100:0}%"></i></div>${tasks.length?tasks.map(t=>`<div class="row-item"><label class="task-check"><input type="checkbox" data-x-task-toggle="${t.id}" ${t.completed?'checked':''}/> <span>${esc(t.title)}</span></label>${button('Remove',`data-x-task-remove="${t.id}"`,true)}</div>`).join(''):empty('Your checklist is empty','Add real tasks such as joining a neighbourhood group or booking a sports session.')}</div>
 <form class="form" data-extra-form="task"><h2>Add your own task</h2>${field('What do you want to do?','title','required minlength="3" maxlength="120"')}${formBtn('Add to Homebase')}<p class="small muted">Do not store passport numbers, residence IDs or other sensitive personal data here.</p></form></div>`;
}
function people(core){if(missing('people','connections','blocks'))return dependency('people','connections','blocks');
 const connections=list('connections');const own=connections.filter(c=>c.requester_id===core.user.id||c.receiver_id===core.user.id);
 const names=new Map(list('people').map(p=>[p.id,p.display_name]));
 const blocked=new Set(list('blocks').map(b=>b.blocked_id));const visible=list('people').filter(p=>p.id!==core.user.id&&p.discoverable&&!blocked.has(p.id));
 return `${heading('Meet people, with consent','Only members who opted into discovery appear. Connections require an invitation and acceptance.')}
 <div class="grid">${visible.map(p=>{const c=own.find(x=>(x.requester_id===p.id||x.receiver_id===p.id));const label=c?c.status==='pending'?(c.receiver_id===core.user.id?'Invitation received':'Pending reply'):c.status:'No connection';const action=!c?button('Request connection',`data-x-connect="${p.id}"`):c.status==='pending'&&c.receiver_id===core.user.id?button('Accept',`data-x-accept="${c.id}"`):c.status==='accepted'?button('Disconnect',`data-x-withdraw="${c.id}"`,true):`<span class="chip">${esc(label)}</span>`;
 return item(p.display_name,`${p.mode} · ${(p.interests||[]).join(', ')||'Interests not provided'}`,`<div class="card-footer"><span class="chip">${esc(label)}</span>${action}${button('Block',`data-x-block="${p.id}"`,true)}${button('Report',`data-x-report="member:${p.id}"`,true)}</div>`)}).join('')}</div>${visible.length?'':empty('No members are discoverable yet','People appear only after they choose to be visible in their privacy settings.')}
 <section class="section"><h2>My introductions</h2>${own.length?own.map(c=>`<div class="row-item"><div><b>${esc(names.get(c.requester_id===core.user.id?c.receiver_id:c.requester_id)||'Member')}</b><p>${esc(c.status)} · ${datetime(c.created_at)}</p></div>${c.status==='pending'&&c.receiver_id===core.user.id?button('Accept invitation',`data-x-accept="${c.id}"`):c.status==='pending'&&c.requester_id===core.user.id?button('Withdraw',`data-x-withdraw="${c.id}"`,true):c.status==='accepted'?button('Disconnect',`data-x-withdraw="${c.id}"`,true):''}</div>`).join(''):empty('No invitations','Explore the directory to request a mutual introduction.')}</section><section class="section"><h2>Blocked members</h2><p class="small muted">Blocking prevents mutual discovery and new introductions.</p>${list('blocks').filter(b=>b.blocker_id===core.user.id).length?list('blocks').filter(b=>b.blocker_id===core.user.id).map(b=>`<div class="row-item"><span>Blocked member ${esc(b.blocked_id.slice(0,8))}</span>${button('Unblock',`data-x-unblock="${b.blocked_id}"`,true)}</div>`).join(''):empty('No blocked members','You can block any discoverable member from their profile card.')}</section>`;
}
function hostos(core){if(missing('templates'))return dependency('templates');
 const owned=asArray(core.communities).filter(c=>c.owner_id===core.user.id&&c.status==='approved');
 const templates=list('templates').filter(x=>x.owner_id===core.user.id);
 return `${heading('AUNO HostOS','Reusable templates for approved community organisers. All events still go through operator review.')}
 ${templates.length?`<div class="grid">${templates.map(t=>item(t.name,`${t.category} · ${t.area} · ${t.venue} · ${t.capacity} seats`,`${button('Draft event from template',`data-x-use-template="${t.id}"`)} ${button('Delete template',`data-x-delete-template="${t.id}"`,true)}`)).join('')}</div>`:empty('No event templates yet','Approved community owners can save a template to create consistent recurring sessions.')}
 ${owned.length?`<section class="section"><form data-extra-form="template" class="form"><h2>Create event template</h2>${choose('Your approved community','community_id',owned.map(c=>[c.id,c.name]))}${field('Template name','name','required minlength="4" maxlength="100"')}${field('Category','category','required minlength="2" maxlength="60"')}${field('Venue','venue','required minlength="2" maxlength="200"')}${field('Area','area','required minlength="2" maxlength="100"')}<label>Description<textarea name="description" required minlength="20" maxlength="2000"></textarea></label>${field('Capacity','capacity','type="number" required min="2" max="500" value="12"')}${formBtn('Save template')}</form></section>`:errorNotice('Create a community and receive operator approval before using HostOS templates.')}`;
}
function business(core){if(missing('business'))return dependency('business');
 const mine=list('business').filter(x=>x.requested_by===core.user.id);
 return `${heading('AUNO for Business','Partner enquiries from real organisations. No fictional customers, contracts or automatic approval.')}
 <div class="split section"><form class="form" data-extra-form="business"><h2>Request a partnership</h2>${field('Organisation name','organisation_name','required minlength="3" maxlength="120"')}${field('Contact email','contact_email','required type="email" maxlength="254" autocomplete="email"')}${choose('Organisation type','organisation_type',[['hotel','Hotel'],['residence','Residence'],['company','Company'],['university','University']])}${choose('People served','size_band',[['1-50','1–50'],['51-200','51–200'],['201-1000','201–1,000'],['1000+','1,000+']])}${field('Primary objective','goal','required minlength="3" maxlength="120"')}<label>What would you like to build?<textarea name="proposal" required minlength="15" maxlength="1500"></textarea></label>${formBtn('Send enquiry')}<p class="small muted">This creates a real enquiry in AUNO's database. It does not create a paid account or contract.</p></form>
 <div class="card"><h2>Your requests</h2>${mine.length?mine.map(r=>`<div class="row-item"><div><b>${esc(r.organisation_name)}</b><p>${esc(r.organisation_type)} · ${esc(r.goal)}</p></div><span class="chip">${esc(r.status)}</span></div>`).join(''):empty('No requests','AUNO operations will review submitted proposals.')}</div></div>`;
}
export function operatorSuite(core){
 const sections=[];const pendingLens=adminList('pendingLens');const pendingBusiness=adminList('pendingBusiness');const pendingCircles=adminList('pendingCircles');const bookings=adminList('allBookings');const checkins=adminList('allCheckins');const privacy=adminList('allPrivacy');
 const active=bookings.filter(b=>b.status==='confirmed');
 const attended=new Set(checkins.map(c=>c.booking_id));
 const byMonth={};for(const b of bookings){const mon=String(b.created_at).slice(0,7);if(mon)byMonth[mon]=(byMonth[mon]||0)+1}
 const points=state.monthly.map(row=>[row.month_date,Number(row.booking_count)||0,Number(row.attendance_count)||0]);const high=Math.max(1,...points.map(([,v])=>v));const overview=state.dashboard;
 sections.push(`<section class="section"><h2>Live participation intelligence</h2><p class="small muted">Exact server-side aggregates. No invented revenue or customer figures.</p>${!overview?errorNotice('Operator analytics RPC is unavailable. Apply migration 003 before relying on these metrics.'):''}<div class="kpi-grid">${[['Active free reservations',overview?.active_reservations??'—'],['Recorded check-ins',overview?.recorded_checkins??'—'],['Pending place reviews',overview?.pending_places??'—'],['Business enquiries pending',overview?.pending_business??'—']].map(([name,val])=>`<div class="kpi"><small>${esc(name)}</small><strong>${formatCount(val)}</strong></div>`).join('')}</div><div class="card"><h3>Booking trend by month</h3>${points.length?`<div class="chart-bars" role="img" aria-label="Monthly reservation counts">${points.map(([m,n])=>`<div class="chart-column"><div class="chart-count">${n}</div><div class="chart-fill" style="height:${Math.max(6,n/high*145)}px"></div><small>${esc(m)}</small></div>`).join('')}</div>`:empty('No transactions yet','The chart will populate after genuine bookings are created.')}</div></section>`);
 sections.push(`<section class="section"><h2>Signature experience reviews</h2><div class="split">${[
 ['Local Lens submissions',pendingLens.map(x=>`<div class="row-item"><div><b>${esc(x.title)}</b><p>${esc(x.tip)}</p></div><div class="toolbar">${button('Approve',`data-x-review-place="${x.id}:true"`)}${button('Reject',`data-x-review-place="${x.id}:false"`,true)}</div></div>`).join('')],
 ['Recurring circles',pendingCircles.map(x=>`<div class="row-item"><div><b>${esc(x.title)}</b><p>${esc(x.cadence)} · ${x.capacity} members</p></div>${button('Publish',`data-x-publish-circle="${x.id}"`)}</div>`).join('')],
 ['Business pilot enquiries',pendingBusiness.map(x=>`<div class="row-item"><div><b>${esc(x.organisation_name)}</b><p>${esc(x.goal)} — ${esc(x.proposal)}</p><p>${esc(x.contact_email||'No email provided')}</p></div><div class="toolbar">${button('Approve',`data-x-review-business="${x.id}:true"`)}${button('Reject',`data-x-review-business="${x.id}:false"`,true)}</div></div>`).join('')]
 ].map(([name,rows])=>`<div class="card"><h3>${esc(name)}</h3>${rows||'<p class="muted small">Queue is empty.</p>'}</div>`).join('')}</div></section>`);
 const upcoming=active.filter(b=>asArray(core.operatorEvents).some(e=>e.id===b.event_id)).slice(0,40);
 sections.push(`<section class="section"><h2>Attendance check-in</h2><p class="small muted">Record a check-in only after physically confirming an attendee. Check-in is available within the controlled event time window.</p><div class="list">${upcoming.length?upcoming.map(b=>`<div class="row-item"><div><b>${esc(core.operatorEvents.find(e=>e.id===b.event_id)?.title||'Approved event')}</b><p>Booking ${esc(b.id.slice(0,8))} · ${datetime(b.created_at)}</p></div>${attended.has(b.id)?'<span class="chip">Checked in</span>':button('Record attendance',`data-x-checkin="${b.id}"`)}</div>`).join(''):empty('No active bookings','Check-ins will appear as real members book approved events.')}</div></section>`);
 sections.push(`<section class="section"><h2>Privacy requests</h2><p class="small muted">These require manual identity checks and trained operator handling. Submitting a request does not automatically delete a user.</p>${privacy.length?privacy.map(p=>`<div class="kv"><b>${esc(p.request_type.replaceAll('_',' '))}</b><span>${esc(p.status)} · ${datetime(p.created_at)}</span></div>`).join(''):empty('No requests','There are no privacy requests in the review queue.')}</section>`);
 return sections.join('');
}
export function privacyPanel(core){if(missing('privacy'))return dependency('privacy');
 const my=list('privacy').filter(x=>x.user_id===core.user.id);
 return `<section class="section"><div class="card"><h2>Privacy and data requests</h2><p class="small muted">Submit a formal request; AUNO must handle it with a documented verification and response process.</p><form data-extra-form="privacy"><label>Request type<select name="request_type"><option value="data_export">Export my data</option><option value="account_deletion">Request account deletion</option><option value="privacy_question">Privacy question</option></select></label><label>Optional details<textarea name="details" maxlength="1000"></textarea></label>${formBtn('Submit request')}</form>${my.map(r=>`<div class="kv"><b>${esc(r.request_type.replaceAll('_',' '))}</b><span>${esc(r.status)}</span></div>`).join('')}</div></section>`;
}
export function setNowFilters(target){
 if(target.id==='now-category'){state.nowCategory=target.value;return true}
 if(target.id==='now-horizon'){state.nowHorizon=Number(target.value);return true}
 return false;
}
async function query(p){const{data,error}=await p;if(error)throw error;return data}
export async function suiteClick(target,ctx){
 const {db,user,operator,core}=ctx;
 const attr=target.dataset;
 if(attr.xJoinCircle){await query(db.rpc('join_circle_series',{p_series_id:attr.xJoinCircle}));return 'You joined this circle.'}
 if(attr.xLeaveCircle){await query(db.rpc('leave_circle_series',{p_series_id:attr.xLeaveCircle}));return 'You left the circle.'}
 if(attr.xDeleteJourney){if(!confirm('Delete this saved journey?'))return null;await query(db.from('member_journeys').delete().eq('id',attr.xDeleteJourney));return 'Journey deleted.'}
 if(attr.xSavePlace){const old=list('savedLens').find(s=>s.recommendation_id===attr.xSavePlace&&s.user_id===user.id);if(old){await query(db.from('saved_recommendations').delete().eq('user_id',user.id).eq('recommendation_id',attr.xSavePlace));return 'Place removed from saved list.'}
  await query(db.from('saved_recommendations').insert({user_id:user.id,recommendation_id:attr.xSavePlace}));return 'Place saved.'}
 if(attr.xBlock){if(!confirm('Block this member? They will no longer appear in your discovery or contact you through AUNO introductions.'))return null;await query(db.rpc('block_member',{p_target:attr.xBlock}));return 'Member blocked.'}
 if(attr.xUnblock){await query(db.rpc('unblock_member',{p_target:attr.xUnblock}));return 'Member unblocked.'}
 if(attr.xConnect){await query(db.rpc('request_member_connection',{p_receiver:attr.xConnect}));return 'Introduction requested.'}
 if(attr.xAccept){await query(db.rpc('respond_member_connection',{p_connection:attr.xAccept,p_accept:true}));return 'Connection accepted.'}
 if(attr.xWithdraw){await query(db.rpc('withdraw_member_connection',{p_connection:attr.xWithdraw}));return 'Connection removed.'}
 if(attr.xTaskRemove){await query(db.from('homebase_tasks').delete().eq('id',attr.xTaskRemove));return 'Task removed.'}
 if(attr.xTaskToggle){const checked=target.checked;await query(db.from('homebase_tasks').update({completed:checked,completed_at:checked?new Date().toISOString():null}).eq('id',attr.xTaskToggle));return 'Task updated.'}
 if(attr.xReviewPlace){if(!operator)throw Error('Not authorised');const[id,a]=attr.xReviewPlace.split(':');await query(db.rpc('operator_review_lens',{p_id:id,p_approve:a==='true'}));return 'Recommendation reviewed.'}
 if(attr.xReviewBusiness){if(!operator)throw Error('Not authorised');const[id,a]=attr.xReviewBusiness.split(':');await query(db.rpc('operator_review_business_pilot',{p_id:id,p_approve:a==='true'}));return 'Business enquiry reviewed.'}
 if(attr.xPublishCircle){if(!operator)throw Error('Not authorised');await query(db.rpc('operator_publish_circle',{p_id:attr.xPublishCircle}));return 'Circle published.'}
 if(attr.xCheckin){if(!operator)throw Error('Not authorised');if(!confirm('Have you physically checked this person in? This creates a permanent attendance record.'))return null;await query(db.rpc('operator_record_checkin',{p_booking_id:attr.xCheckin}));return 'Attendance recorded and Passport updated.'}
 if(attr.xDeleteTemplate){await query(db.from('host_event_templates').delete().eq('id',attr.xDeleteTemplate));return 'Template deleted.'}
 if(attr.xReport){const [kind,id]=attr.xReport.split(':');const reason=prompt('Describe the concern (minimum 10 characters; do not include sensitive personal data):');if(reason==null)return null;if(reason.trim().length<10)throw Error('Please provide at least 10 characters');await query(db.from('moderation_reports').insert({reporter_id:user.id,target_kind:kind,target_id:id,reason:reason.trim()}));return 'Report sent to operations.'}
 if(attr.xResolveReport){if(!operator)throw Error('Not authorised');const resolution=prompt('Enter an internal resolution note (at least 10 characters):');if(resolution==null)return null;await query(db.rpc('operator_resolve_report',{p_report_id:attr.xResolveReport,p_resolution:resolution.trim()}));return 'Report resolved.'}
 if(attr.xUseTemplate){const t=list('templates').find(x=>x.id===attr.xUseTemplate);if(!t)throw Error('Template unavailable');core.route='host';ctx.render();const form=document.querySelector('form[data-form="event"]');if(form){for(const k of ['title','category','description','area','venue','capacity']){const field=form.querySelector(`[name="${k}"]`);if(field)field.value=k==='title'?t.name:t[k]||'';}form.scrollIntoView({behavior:'smooth'});}return null;}
 return undefined;
}
export async function suiteSubmit(form,ctx){const {db,user}=ctx;const fd=new FormData(form),get=name=>String(fd.get(name)||'').trim(),uid=user.id;
 switch(form.dataset.extraForm){
 case 'circle':await query(db.from('circle_series').insert({community_id:get('community_id'),owner_id:uid,title:get('title'),description:get('description'),area:get('area'),cadence:get('cadence'),capacity:Number(get('capacity'))}));return 'Circle submitted to the review queue.';
 case 'place':await query(db.from('place_recommendations').insert({author_id:uid,title:get('title'),area:get('area'),category:get('category'),tip:get('tip')}));return 'Local recommendation submitted for moderation.';
 case 'journey':{
  const chosen=[...form.querySelector('[name="place_ids"]').selectedOptions].map(o=>o.value);
  const map=new Map(list('lens').filter(p=>p.status==='approved').map(p=>[p.id,p]));
  const plan=chosen.map(id=>map.get(id)).filter(Boolean).map(p=>({source_id:p.id,title:p.title,area:p.area,category:p.category}));
  await query(db.from('member_journeys').insert({user_id:uid,title:get('title'),destination:get('destination'),begins_on:get('begins_on'),duration_days:Number(get('duration_days')),plan}));return 'Your private itinerary was saved.';}
 case 'task':await query(db.from('homebase_tasks').insert({user_id:uid,title:get('title')}));return 'Task added.';
 case 'template':await query(db.from('host_event_templates').insert({owner_id:uid,community_id:get('community_id'),name:get('name'),category:get('category'),venue:get('venue'),area:get('area'),description:get('description'),capacity:Number(get('capacity'))}));return 'Event template saved.';
 case 'business':await query(db.from('business_pilot_requests').insert({requested_by:uid,organisation_name:get('organisation_name'),contact_email:get('contact_email'),organisation_type:get('organisation_type'),size_band:get('size_band'),goal:get('goal'),proposal:get('proposal')}));return 'Business enquiry recorded.';
 case 'privacy':await query(db.from('privacy_requests').insert({user_id:uid,request_type:get('request_type'),details:get('details')}));return 'Privacy request submitted.';
 default:return undefined;
 }
}
