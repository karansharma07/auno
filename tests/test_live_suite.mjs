/** Tests the real frontend with an empty database response, not fake public records. */
import assert from 'node:assert/strict';
import {loadSuite,suiteRoutes,isSuiteRoute,pageSuite,operatorSuite,privacyPanel} from '../live/suite.js';
const uid='00000000-0000-4000-8000-000000000001';
const calls=[];
const db={
 from(table){calls.push(table);return {select(){return this},limit(){return this},eq(){return this},then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}}},
 rpc(name){calls.push('rpc:'+name);return Promise.resolve({data:name==='operator_dashboard_overview'?{active_reservations:0,recorded_checkins:0,pending_places:0,pending_business:0}:[],error:null})}
};
const core={user:{id:uid,email:'user@example.invalid'},profile:{display_name:'New member',interests:[]},events:[],communities:[],bookings:[],memberships:[],operatorEvents:[],operator:true};
await loadSuite(db,core.user,true);
for(const [route] of suiteRoutes){
 assert(isSuiteRoute(route));
 const html=pageSuite(route,core);
 assert(typeof html==='string'&&html.length>25,route+' did not render');
 assert(!html.includes('Maya Chen')&&!html.includes('fictional demo spot'));
}
assert(operatorSuite(core).includes('Live participation intelligence'));
assert(privacyPanel(core).includes('Submit request'));
assert(calls.includes('member_connections')&&calls.includes('privacy_requests'));
assert(calls.includes('rpc:operator_dashboard_overview')&&calls.includes('rpc:operator_monthly_bookings'));
console.log('PASS: live-suite routes, empty states, server aggregates and privacy controls');
