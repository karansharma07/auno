/* AUNO GitHub Pages edition. Fictional, browser-local simulation ONLY.
 * This is NOT a real API, auth system, transaction processor, or shared platform.
 */
(() => {
  'use strict';
  const originalFetch = window.fetch.bind(window);
  const KEY = 'auno-pages-browser-demo-v1';
  let statePromise;
  const stamp = () => new Date().toISOString();
  const copy = x => JSON.parse(JSON.stringify(x));
  const next = list => list.reduce((n, r) => Math.max(n, Number(r.id) || 0), 0) + 1;
  const find = (arr,id) => arr.find(x => Number(x.id) === Number(id));
  const get = (arr, props) => arr.find(x=>Object.entries(props).every(([k,v])=>x[k]===v));
  const note = (s, uid, message) => s.notifications.push({id:next(s.notifications),user_id:uid,message,created_at:stamp(),is_read:0});
  const fail = (message,status=400) => {let e=new Error(message);e.status=status;throw e};
  const requireRole = (user,allowed) => {if(!allowed.includes(user.role))fail('This demo workspace does not allow that action.',403)};
  const dateShift = (dt,days) => {if (!dt) return dt; const d=new Date(dt);if(Number.isNaN(+d))return dt;d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,16)};
  const code = prefix => prefix + Math.random().toString(36).slice(2,9).toUpperCase();
  async function load() {
    if (statePromise) return statePromise;
    statePromise = (async()=>{
      try {const s=JSON.parse(localStorage.getItem(KEY));if(s && s.users && s.events && s.schema===1) return s;} catch{}
      const resp=await originalFetch('seed.json',{cache:'no-store'});
      if(!resp.ok)throw new Error('Unable to load demo seed');
      const s=await resp.json(); s.schema=1;
      // Keep fictional seed activities in the near future even months after site deployment.
      const base=new Date(s.generatedAt);const today=new Date();
      const diff=Math.floor((Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate())-Date.UTC(base.getUTCFullYear(),base.getUTCMonth(),base.getUTCDate()))/86400000);
      s.events.forEach(e=>e.start_at=dateShift(e.start_at,diff));
      s.plans.forEach(p=>p.start_at=dateShift(p.start_at,diff));
      localStorage.setItem(KEY,JSON.stringify(s));return s;
    })();return statePromise;
  }
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){console.warn('AUNO demo storage not available',e)}}
  function bootstrap(s,user){
    const uid=user.id;
    const users=s.users.map(u=>({...u}));
    const events=s.events.filter(e=>e.approved).sort((a,b)=>a.start_at.localeCompare(b.start_at)).map(e=>{
      const bookings=s.event_bookings.filter(b=>b.event_id===e.id && b.status==='booked');
      const mine=bookings.find(b=>b.user_id===uid);
      return {...e,booked:bookings.length,my_booking:mine?{id:mine.id,status:mine.status,attended:mine.attended}:null};
    });
    const communities=s.communities.filter(c=>c.approved).map(c=>({...c,members:s.community_members.filter(m=>m.community_id===c.id && m.status==='joined').length,membership:(s.community_members.find(m=>m.community_id===c.id && m.user_id===uid) || null)}));
    const partners=s.storage_partners.filter(p=>p.active);
    const bookings=s.storage_bookings.filter(b=>b.user_id===uid).sort((a,b)=>b.id-a.id).map(b=>({...b,partner_name:find(s.storage_partners,b.partner_id)?.name||'',area:find(s.storage_partners,b.partner_id)?.area||''}));
    const eventBookings=s.event_bookings.filter(b=>b.user_id===uid && b.status==='booked').map(b=>({...b,...((()=>{const e=find(s.events,b.event_id)||{};return {title:e.title,start_at:e.start_at,venue:e.venue,area:e.area,cover:e.cover}})())})).sort((a,b)=>String(a.start_at).localeCompare(String(b.start_at)));
    const plans=s.plans.filter(p=>p.status==='active').sort((a,b)=>a.start_at.localeCompare(b.start_at)).map(p=>({...p,host_name:find(s.users,p.user_id)?.name||'',joined:s.plan_members.filter(m=>m.plan_id===p.id).length,my_member:!!s.plan_members.find(m=>m.plan_id===p.id && m.user_id===uid)}));
    const connections=s.connections.filter(c=>c.from_id===uid||c.to_id===uid).map(c=>({...c,from_name:find(s.users,c.from_id)?.name||'',from_avatar:find(s.users,c.from_id)?.avatar||'',to_name:find(s.users,c.to_id)?.name||''})).sort((a,b)=>b.id-a.id);
    const moments=s.moments.filter(m=>m.status==='visible').map(m=>({...m,author:find(s.users,m.user_id)?.name||'',author_avatar:find(s.users,m.user_id)?.avatar||'',likes:s.moment_likes.filter(l=>l.moment_id===m.id).length,liked:Number(!!s.moment_likes.find(l=>l.moment_id===m.id&&l.user_id===uid))})).sort((a,b)=>b.id-a.id);
    const out={me:{...user},personas:users,events,communities,partners,rewards:s.rewards.filter(r=>r.stock>0),storageBookings:bookings,eventBookings,journeys:s.journeys.filter(j=>j.user_id===uid).sort((a,b)=>b.id-a.id).slice(0,5),plans,notifications:s.notifications.filter(n=>n.user_id===uid).sort((a,b)=>b.id-a.id).slice(0,15),redemptions:s.redemptions.filter(r=>r.user_id===uid).sort((a,b)=>b.id-a.id).map(r=>({...r,title:find(s.rewards,r.reward_id)?.title||''})),myApplications:s.community_applications.filter(a=>a.requested_by===uid).sort((a,b)=>b.id-a.id),people:users.filter(u=>u.id!==uid&&['member','host'].includes(u.role)),connections,moments};
    if(user.role==='host')out.host={events:s.events.filter(e=>e.host_id===uid).map(e=>({...e,booked:s.event_bookings.filter(b=>b.event_id===e.id&&b.status==='booked').length})),attendees:s.event_bookings.filter(b=>b.status==='booked'&&find(s.events,b.event_id)?.host_id===uid).map(b=>({...b,name:find(s.users,b.user_id)?.name||'',avatar:find(s.users,b.user_id)?.avatar||'',title:find(s.events,b.event_id)?.title||'',start_at:find(s.events,b.event_id)?.start_at||''})),membershipRequests:s.community_members.filter(m=>m.status==='pending'&&find(s.communities,m.community_id)?.host_id===uid).map(m=>({...m,name:find(s.users,m.user_id)?.name||'',avatar:find(s.users,m.user_id)?.avatar||'',community_name:find(s.communities,m.community_id)?.name||''}))};
    if(user.role==='partner')out.partner={venues:s.storage_partners.filter(v=>v.host_user_id===uid),bookings:s.storage_bookings.filter(b=>find(s.storage_partners,b.partner_id)?.host_user_id===uid).sort((a,b)=>b.id-a.id).map(b=>({...b,partner_name:find(s.storage_partners,b.partner_id)?.name||'',guest_name:find(s.users,b.user_id)?.name||''}))};
    if(user.role==='admin')out.admin={applications:s.community_applications.filter(a=>a.status==='pending').map(a=>({...a,requester:find(s.users,a.requested_by)?.name||''})),reports:s.reports.filter(r=>r.status==='open').map(r=>({...r,reporter:find(s.users,r.user_id)?.name||''})),members:users.map(({id,name,role,verified,xp,mode})=>({id,name,role,verified,xp,mode})),moderationEvents:s.events.slice().reverse().map(e=>({id:e.id,title:e.title,category:e.category,approved:e.approved,start_at:e.start_at})),momentsModeration:s.moments.slice().reverse().map(m=>({id:m.id,body:m.body,status:m.status,name:find(s.users,m.user_id)?.name||''})),overview:{members:users.filter(u=>['member','host'].includes(u.role)).length,communities:s.communities.filter(c=>c.approved).length,bookings:s.event_bookings.filter(b=>b.status==='booked').length,storage:s.storage_bookings.length,events:s.events.filter(e=>e.approved).length}};
    return copy(out);
  }
  function handle(s,user,path,body){
    const uid=user.id;let m,x,y,z;
    if(path==='/events/book'){
      const e=find(s.events,body.event_id);if(!e||!e.approved)fail('Event not found',404);
      if(new Date(e.start_at).getTime()<Date.now()-120000)fail('This event has already started');
      if(s.event_bookings.some(b=>b.event_id===e.id&&b.user_id===uid&&b.status==='booked'))fail('You already have a spot',409);
      if(s.event_bookings.filter(b=>b.event_id===e.id&&b.status==='booked').length>=e.capacity)fail('This session is full',409);
      const old=s.event_bookings.find(b=>b.event_id===e.id&&b.user_id===uid);
      if(old){Object.assign(old,{status:'booked',attended:0,created_at:stamp()})}
      else s.event_bookings.push({id:next(s.event_bookings),event_id:e.id,user_id:uid,status:'booked',attended:0,created_at:stamp()});
      note(s,uid,`Your demo spot at ${e.title} is confirmed. No payment was taken.`);return {ok:true,message:'Demo booking confirmed. No charge was made.'};
    }
    if((m=path.match(/^\/events\/(\d+)\/cancel$/))){x=s.event_bookings.find(b=>b.event_id===Number(m[1])&&b.user_id===uid&&b.status==='booked');if(!x)fail('No active booking found',404);x.status='cancelled';note(s,uid,'Your demonstration event booking was cancelled.');return {ok:true}}
    if((m=path.match(/^\/communities\/(\d+)\/join$/))){x=find(s.communities,m[1]);if(!x||!x.approved)fail('Community not found',404);const status=x.visibility==='approval'?'pending':'joined';y=s.community_members.find(b=>b.community_id===x.id&&b.user_id===uid);if(y)y.status=status;else s.community_members.push({community_id:x.id,user_id:uid,status});note(s,uid,`${status==='pending'?'Request submitted to':'You joined'} ${x.name}.`);return {ok:true,status}}
    if(path==='/communities/apply'){if(String(body.name||'').length<4||String(body.description||'').length<20)fail('Please provide a community name and a description of at least 20 characters.');s.community_applications.push({...body,id:next(s.community_applications),requested_by:uid,status:'pending',created_at:stamp()});note(s,uid,'Your community proposal is in the review queue.');return {ok:true}}
    if((m=path.match(/^\/admin\/applications\/(\d+)\/review$/))){requireRole(user,['admin']);x=s.community_applications.find(a=>a.id===Number(m[1])&&a.status==='pending');if(!x)fail('Application not in review queue',404);if(!['approved','rejected'].includes(body.action))fail('Invalid action');x.status=body.action;if(body.action==='approved'){y={id:next(s.communities),name:x.name,category:x.category,area:x.area,description:x.description,host_id:x.requested_by,cover:'city',visibility:'approval',approved:1};s.communities.push(y);s.community_members.push({community_id:y.id,user_id:x.requested_by,status:'joined'})}note(s,x.requested_by,`Your community proposal '${x.name}' was ${body.action} in the demo.`);return {ok:true}}
    if((m=path.match(/^\/admin\/reports\/(\d+)\/resolve$/))){requireRole(user,['admin']);x=s.reports.find(r=>r.id===Number(m[1])&&r.status==='open');if(!x)fail('Report not found',404);x.status='resolved';return {ok:true}}
    if(path==='/host/events'){requireRole(user,['host','admin']);if(!body.title||body.title.length<4||body.capacity<2||body.capacity>500||body.description.length<12)fail('Please complete the event details.');if(new Date(body.start_at)<Date.now()-86400000)fail('Select a future date');s.events.push({...body,id:next(s.events),level:'All welcome',host_id:uid,community_id:null,cover:body.category==='Padel'?'padel':'city',featured:0,approved:1});return {ok:true}}
    if((m=path.match(/^\/host\/bookings\/(\d+)\/checkin$/))){requireRole(user,['host','admin']);x=find(s.event_bookings,m[1]);if(!x)fail('Booking not found',404);y=find(s.events,x.event_id);if(user.role!=='admin'&&y.host_id!==uid)fail('Not your event',403);if(x.status!=='booked'||x.attended)fail('Already checked in or cancelled',409);x.attended=1;find(s.users,x.user_id).xp+=100;note(s,x.user_id,`Checked in at ${y.title}! You earned 100 demo XP.`);return {ok:true}}
    if(path==='/storage/book'){if(!body.date||body.date<new Date().toISOString().slice(0,10))fail('Choose today or a future date');if(body.end_time<=body.start_time)fail('Pickup must be later than drop-off');if(body.bags<1||body.bags>6)fail('Choose between 1 and 6 bags');x=find(s.storage_partners,body.partner_id);if(!x||!x.active)fail('Partner not found',404);if(body.start_time<x.open_time||body.end_time>x.close_time)fail('Outside demo partner operating hours');const used=s.storage_bookings.filter(b=>b.partner_id===x.id&&b.date===body.date&&['booked','dropped_off'].includes(b.status)&&b.start_time<body.end_time&&b.end_time>body.start_time).reduce((n,b)=>n+b.bags,0);if(used+body.bags>x.capacity)fail('Not enough available bag capacity',409);const price=body.bags*x.price_per_bag,ref=code('ST-');s.storage_bookings.push({...body,id:next(s.storage_bookings),user_id:uid,price,status:'booked',code:ref,created_at:stamp()});note(s,uid,`Demo luggage reservation ${ref} at ${x.name} confirmed. No payment taken.`);return {ok:true,code:ref,price}}
    if((m=path.match(/^\/partner\/bookings\/(\d+)\/status$/))){requireRole(user,['partner','admin']);x=find(s.storage_bookings,m[1]);if(!x)fail('Booking not found',404);y=find(s.storage_partners,x.partner_id);if(user.role!=='admin'&&y.host_user_id!==uid)fail('Not your booking',403);if(({booked:'dropped_off',dropped_off:'collected'})[x.status]!==body.status)fail('Invalid custody status transition',409);x.status=body.status;note(s,x.user_id,`Storage reservation ${x.code} marked ${x.status.replace('_',' ')} in the demo.`);return {ok:true}}
    if(path==='/journeys/generate'){
      if(body.days<1||body.days>14||body.budget<0)fail('Check your itinerary parameters');
      const interests=(body.interests||[]).map(x=>x.toLowerCase());const perDay=body.pace==='Relaxed'?2:body.pace==='Packed'?4:3;
      const score=p=>interests.reduce((n,i)=>n+(p.category.toLowerCase().includes(i)||p.name.toLowerCase().includes(i)?4:0),0)+(p.area.toLowerCase().includes(body.area.toLowerCase())?3:0)+(p.cost<=Math.max(50,body.budget/body.days)?2:-3);
      const ranked=s.places.slice().sort((a,b)=>score(b)-score(a)||a.cost-b.cost||a.name.localeCompare(b.name));
      const items=[];let spent=0;
      for(let day=1;day<=body.days;day++){let added=0;for(const place of ranked){if(added>=perDay)break;if(items.some(v=>v.name===place.name)||spent+place.cost>body.budget)continue;items.push({...place,day,time:['09:30','12:00','15:30','18:00'][added],social_tip:body.with_people?'Look for an approved group activity near this stop.':'Enjoy at your own pace.'});spent+=place.cost;added++}if(!added)break;}
      s.journeys.push({id:next(s.journeys),user_id:uid,...body,items,created_at:stamp()});return {ok:true,items,total_cost:spent,note:'Curated example only. No real-time routes, opening hours or availability.'};
    }
    if(path==='/plans'){if(!body.title||body.title.length<4||body.description.length<12||body.seats<2||body.seats>30)fail('Complete all plan details.');if(new Date(body.start_at)<Date.now()-86400000)fail('Choose a future date');x={id:next(s.plans),user_id:uid,...body,status:'active'};s.plans.push(x);s.plan_members.push({plan_id:x.id,user_id:uid});return {ok:true}}
    if((m=path.match(/^\/plans\/(\d+)\/join$/))){x=find(s.plans,m[1]);if(!x||x.status!=='active')fail('Plan unavailable',404);if(s.plan_members.some(b=>b.plan_id===x.id&&b.user_id===uid))fail('Already joined',409);if(s.plan_members.filter(b=>b.plan_id===x.id).length>=x.seats)fail('This plan is full',409);s.plan_members.push({plan_id:x.id,user_id:uid});note(s,x.user_id,`${user.name} joined your plan: ${x.title}`);return {ok:true}}
    if((m=path.match(/^\/rewards\/(\d+)\/redeem$/))){x=find(s.rewards,m[1]);if(!x||x.stock<1)fail('Reward unavailable',404);if(user.xp<x.points)fail('Not enough XP yet');user.xp-=x.points;x.stock-=1;const ref=code('RW-');s.redemptions.push({id:next(s.redemptions),reward_id:x.id,user_id:uid,code:ref,created_at:stamp()});note(s,uid,`Demo voucher ${ref} created: ${x.title}. Not redeemable in the real world.`);return {ok:true,code:ref}}
    if(path==='/me/preferences'){if(!['resident','visitor'].includes(body.mode))fail('Invalid mode');if((body.interests||[]).length>12)fail('Too many interests');user.mode=body.mode;user.interests=body.interests;return {ok:true}}
    if(path==='/notifications/read'){s.notifications.filter(n=>n.user_id===uid).forEach(n=>n.is_read=1);return {ok:true}}
    if(path==='/moments'){if(!body.body||body.body.length<10||!body.place||body.place.length<3)fail('Enter a descriptive moment and place');s.moments.push({...body,id:next(s.moments),user_id:uid,created_at:stamp(),status:'visible'});return {ok:true}}
    if((m=path.match(/^\/moments\/(\d+)\/like$/))){x=find(s.moments,m[1]);if(!x||x.status!=='visible')fail('Moment unavailable',404);const idx=s.moment_likes.findIndex(l=>l.moment_id===x.id&&l.user_id===uid);if(idx>=0){s.moment_likes.splice(idx,1);return {ok:true,liked:false}}s.moment_likes.push({moment_id:x.id,user_id:uid});return {ok:true,liked:true}}
    if(path==='/connections/request'){if(body.user_id===uid)fail('Cannot connect to yourself');x=find(s.users,body.user_id);if(!x||!['member','host'].includes(x.role))fail('Person unavailable',404);if(s.connections.some(c=>(c.from_id===uid&&c.to_id===x.id)||(c.from_id===x.id&&c.to_id===uid)))fail('Request or connection already exists',409);s.connections.push({id:next(s.connections),from_id:uid,to_id:x.id,status:'pending',created_at:stamp()});note(s,x.id,`${user.name} requested to connect through AUNO.`);return {ok:true}}
    if((m=path.match(/^\/connections\/(\d+)\/review$/))){x=s.connections.find(c=>c.id===Number(m[1])&&c.to_id===uid&&c.status==='pending');if(!x)fail('No pending request',404);if(!['accepted','rejected'].includes(body.action))fail('Invalid action');x.status=body.action;note(s,x.from_id,`${user.name} ${body.action} your AUNO connection request.`);return {ok:true}}
    if(path==='/reports'){if(!body.target||!body.reason||body.reason.length<6)fail('Please include a reason');s.reports.push({id:next(s.reports),user_id:uid,...body,status:'open',created_at:stamp()});return {ok:true}}
    if((m=path.match(/^\/admin\/moments\/(\d+)\/hide$/))){requireRole(user,['admin']);x=find(s.moments,m[1]);if(!x||x.status!=='visible')fail('Moment not visible',404);x.status='hidden';return {ok:true}}
    if((m=path.match(/^\/admin\/events\/(\d+)\/visibility$/))){requireRole(user,['admin']);x=find(s.events,m[1]);if(!x)fail('Event not found',404);if(!['hide','show'].includes(body.action))fail('Invalid action');x.approved=body.action==='show'?1:0;return {ok:true}}
    if((m=path.match(/^\/host\/communities\/(\d+)\/members\/(\d+)\/review$/))){requireRole(user,['host','admin']);x=find(s.communities,m[1]);if(!x||(user.role!=='admin'&&x.host_id!==uid))fail('Not your community',403);y=s.community_members.find(r=>r.community_id===x.id&&r.user_id===Number(m[2])&&r.status==='pending');if(!y)fail('Request not pending',404);if(!['joined','rejected'].includes(body.action))fail('Invalid action');y.status=body.action;note(s,y.user_id,`Your membership request for ${x.name} was ${body.action==='joined'?'approved':'declined'}.`);return {ok:true}}
    if((m=path.match(/^\/partner\/venues\/(\d+)$/))){requireRole(user,['partner','admin']);x=find(s.storage_partners,m[1]);if(!x||(user.role!=='admin'&&x.host_user_id!==uid))fail('Not your location',403);if(body.close_time<=body.open_time)fail('Closing time must follow opening time');if(body.capacity<1||body.capacity>500||body.price_per_bag<0)fail('Invalid capacity or rate');Object.assign(x,body);return {ok:true}}
    fail('Unknown demonstration endpoint',404);
  }
  window.fetch = async function(input,opts={}){
    const raw=typeof input==='string'?input:input.url;
    if(!raw.startsWith('/api/'))return originalFetch(input,opts);
    try{
      const s=await load();const user=find(s.users,Number(opts.headers?.['X-Demo-User']||1));if(!user)fail('Choose a valid demo identity',401);
      const path=raw.substring(4);
      const body=opts.body?JSON.parse(opts.body):{};
      const result=path==='/bootstrap'?bootstrap(s,user):path==='/health'?{ok:true,mode:'browser-only-simulation'}:handle(s,user,path,body);
      if(path!=='/bootstrap'&&path!=='/health')save(s);
      return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
    }catch(e){return new Response(JSON.stringify({detail:e.message||'Demo operation failed'}),{status:e.status||500,headers:{'Content-Type':'application/json'}})}
  };
})();
