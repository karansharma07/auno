"""Behavioural smoke tests for AUNO's persisted demo API."""
from __future__ import annotations
import os,sys,tempfile
from pathlib import Path
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
DBFILE=Path(tempfile.gettempdir())/'auno_api_test.sqlite'
if DBFILE.exists():DBFILE.unlink()
os.environ['AUNO_DB']=str(DBFILE)
from fastapi.testclient import TestClient
from app import app
client=TestClient(app)

def user(id): return {'X-Demo-User':str(id)}
def get(id=1):
    r=client.get('/api/bootstrap',headers=user(id))
    assert r.status_code==200,r.text
    return r.json()
def post(path,body=None,id=1):return client.post('/api'+path,json=body if body is not None else {},headers=user(id))

def test_personas_are_populated():
    for id,role in [(1,'member'),(2,'host'),(3,'partner'),(4,'admin')]:
        d=get(id)
        assert d['me']['role']==role
        assert len(d['events'])>=5 and len(d['communities'])>=5
    assert get(1)['moments']

def test_event_booking_and_cancel():
    r=post('/events/book',{'event_id':1});assert r.status_code==200,r.text
    assert get(1)['events'][0]['my_booking']
    duplicate=post('/events/book',{'event_id':1});assert duplicate.status_code==409
    assert post('/events/1/cancel').status_code==200
    assert not get(1)['events'][0]['my_booking']

def test_community_requests_and_host_approval():
    r=post('/communities/4/join');assert r.status_code==200 and r.json()['status']=='pending'
    h=get(2)['host'];assert any(r['user_id']==1 and r['community_id']==4 for r in h['membershipRequests'])
    assert post('/host/communities/4/members/1/review',{'action':'joined'},id=2).status_code==200
    assert next(c for c in get(1)['communities'] if c['id']==4)['membership']['status']=='joined'
    r=post('/communities/apply',{'name':'Design Saturdays','category':'Interests','area':'Dubai Marina','description':'Weekly design meetups with a focus on creating friendships.'})
    assert r.status_code==200
    applications=get(4)['admin']['applications']
    appid=next(x['id'] for x in applications if x['name']=='Design Saturdays')
    assert post(f'/admin/applications/{appid}/review',{'action':'approved'},id=4).status_code==200
    assert any(c['name']=='Design Saturdays' for c in get(1)['communities'])

def test_luggage_custody_and_partner_controls():
    date=datetime.now(ZoneInfo('Asia/Dubai')).date().isoformat()
    r=post('/storage/book',{'partner_id':1,'date':date,'start_time':'12:00','end_time':'17:00','bags':2})
    assert r.status_code==200,r.text
    booking=get(3)['partner']['bookings'][0]
    assert booking['bags']==2 and booking['status']=='booked'
    assert post(f"/partner/bookings/{booking['id']}/status",{'status':'dropped_off'},id=1).status_code==403
    assert post(f"/partner/bookings/{booking['id']}/status",{'status':'dropped_off'},id=3).status_code==200
    assert post(f"/partner/bookings/{booking['id']}/status",{'status':'collected'},id=3).status_code==200
    assert get(1)['storageBookings'][0]['status']=='collected'
    update=post('/partner/venues/1',{'capacity':12,'price_per_bag':30,'open_time':'08:00','close_time':'20:00'},id=3)
    assert update.status_code==200
    assert next(x for x in get(1)['partners'] if x['id']==1)['price_per_bag']==30

def test_journey_rewards_and_social():
    r=post('/journeys/generate',{'days':3,'area':'Dubai Marina','interests':['Food','Culture'],'pace':'Balanced','budget':500,'with_people':True})
    assert r.status_code==200,r.text
    assert r.json()['items'] and len(r.json()['items'])<=10
    assert get(1)['journeys']
    before=get(1)['me']['xp']
    redemption=post('/rewards/1/redeem')
    assert redemption.status_code==200
    assert get(1)['me']['xp']==before-300
    assert get(1)['redemptions'][0]['code'].startswith('RW-')
    r=post('/moments',{'body':'An excellent place for our next photo walk together.','place':'Downtown Dubai','category':'Culture'})
    assert r.status_code==200
    m=get(1)['moments'][0]
    assert post(f"/moments/{m['id']}/like").status_code==200
    assert get(1)['moments'][0]['liked']==1
    assert post('/reports',{'target':f"moment:{m['id']}",'reason':'Test report for moderator review'}).status_code==200
    assert post(f"/admin/moments/{m['id']}/hide",id=1).status_code==403
    assert post(f"/admin/moments/{m['id']}/hide",id=4).status_code==200
    assert all(x['id']!=m['id'] for x in get(1)['moments'])

def test_connection_consent():
    r=post('/connections/request',{'user_id':5})
    assert r.status_code==200,r.text
    incoming=next(x for x in get(5)['connections'] if x['from_id']==1)
    assert incoming['status']=='pending'
    assert post(f"/connections/{incoming['id']}/review",{'action':'accepted'},id=1).status_code==404
    assert post(f"/connections/{incoming['id']}/review",{'action':'accepted'},id=5).status_code==200
    assert get(1)['connections'][0]['status']=='accepted'

def test_admin_permissions_and_visibility():
    assert post('/admin/reports/1/resolve',id=1).status_code==403
    assert post('/admin/reports/1/resolve',id=4).status_code==200
    assert post('/admin/events/1/visibility',{'action':'hide'},id=4).status_code==200
    assert not any(e['id']==1 for e in get(1)['events'])
    assert post('/admin/events/1/visibility',{'action':'show'},id=4).status_code==200
    assert any(e['id']==1 for e in get(1)['events'])


def test_v2_static_assets_available_to_local_server():
    root=client.get('/')
    assert root.status_code==200
    assert '/static/theme.js' in root.text and '/static/insights.js' in root.text
    for asset in ['theme.js','insights.js','styles.css','manifest.webmanifest']:
        assert client.get('/static/'+asset).status_code==200


def test_v2_analytics_role_and_consistency():
    admin=get(4)['admin']
    data=admin['analytics']
    assert isinstance(data['events'], list) and len(data['events'])>=5
    assert isinstance(data['communities'], list) and len(data['communities'])>=5
    assert sum(e['booked'] for e in data['events'])==admin['overview']['bookings']
    assert all(0<=e['attended']<=e['booked']<=e['capacity'] for e in data['events'])
    assert isinstance(data['connections'],int) and isinstance(data['reports'],int)
    assert 'admin' not in get(1)

if __name__=='__main__':
    import pytest
    raise SystemExit(pytest.main([__file__,'-q']))
