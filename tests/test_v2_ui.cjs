const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const read = name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const local = new Map();let prefersDark=false;
const html={dataset:{},style:{}};
const document={documentElement:html,querySelector:()=>({content:''}),dispatchEvent:()=>true};
const w={matchMedia:()=>({get matches(){return prefersDark},addEventListener:()=>{}})};
const storage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)};
const sandbox={window:w,document,localStorage:storage,CustomEvent:class {constructor(type,args){this.type=type;this.detail=args.detail}}};
vm.runInNewContext(read('demo-static/theme.js'),sandbox);
assert.equal(document.documentElement.dataset.theme,'light');
w.AunoTheme.set('dark');assert.equal(local.get('auno-appearance'),'dark');assert.equal(html.dataset.theme,'dark');
w.AunoTheme.set('light');assert.equal(html.dataset.theme,'light');
prefersDark=true;w.AunoTheme.set('system');assert.equal(html.dataset.theme,'dark');
const source=read('demo-static/insights.js');
const S={nowMood:'explore',nowTime:2,nowBudget:'free',insightsDays:30,insightsCategory:'All',bizBookings:1000,bizTicket:80,bizTake:12};
const appData={admin:{overview:{members:4},applications:[{id:3}],analytics:{events:[
  {id:1,title:'Padel & People',category:'Padel',area:'Dubai Marina',start_at:new Date(Date.now()+86400000).toISOString(),capacity:12,price:75,booked:2,attended:1},
  {id:2,title:'Badminton Night',category:'Badminton',area:'Al Quoz',start_at:new Date(Date.now()+172800000).toISOString(),capacity:10,price:45,booked:4,attended:2}
],storage:[{activeBookings:1}],communities:[{members:3}],reports:1,connections:2,moments:5}}};
const appContext={S,window:w,data:()=>appData,E:x=>String(x),header:(title)=>`<h1>${title}</h1>`,pill:x=>String(x),btn:x=>String(x),section:(title)=>`<h2>${title}</h2>`,Date,Math,Number,Set,JSON,Intl,console};
vm.createContext(appContext);vm.runInContext(source,appContext);
const insights=vm.runInContext('aunoInsightsPage()',appContext);
assert(insights.includes('Mission Control'));assert(insights.includes('AED 330')); // (2*75+4*45) simulated face value
assert(insights.includes('Bookings by event'));assert(insights.includes('2 open')===false);
const now=vm.runInContext('aunoNowPage()',appContext);
assert(now.includes('Dubai Marina Promenade'));assert(!now.includes('Dubai Creek')); // budget-free filter
S.nowBudget='flexible';assert(vm.runInContext('aunoNowPage()',appContext).includes('Dubai Creek'));
S.insightsCategory='Padel';assert.equal(vm.runInContext('aunoFilteredEvents().length',appContext),1);
console.log('PASS: v2 appearance, persistence, filters, charts, money-label, AUNO Now and category selection');
