"""AUNO — interactive, persistent pilot. DEMO ONLY: not production authentication or payments."""
from __future__ import annotations
import json, os, random, sqlite3, string
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
from typing import Optional
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).parent
DB = Path(os.environ.get('AUNO_DB', str(ROOT / 'auno_demo.db')))
TZ = ZoneInfo('Asia/Dubai')
app = FastAPI(title='AUNO Pilot API', version='0.1.0', description='Local demo. No production identity verification or payments.')
app.mount('/static', StaticFiles(directory=str(ROOT / 'static')), name='static')


def now(): return datetime.now(TZ)
def stamp(): return now().isoformat(timespec='seconds')
def uid(prefix='A'): return prefix + ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))
def jparse(v, fallback=None):
    try: return json.loads(v) if isinstance(v, str) else v
    except (ValueError, TypeError): return fallback


def db():
    con = sqlite3.connect(DB, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute('PRAGMA foreign_keys=ON')
    con.execute('PRAGMA busy_timeout=15000')
    return con

def rows(con,sql,args=()): return [dict(x) for x in con.execute(sql,args).fetchall()]
def row(con,sql,args=()):
    r=con.execute(sql,args).fetchone()
    return dict(r) if r else None

def notify(con,user_id,message):
    con.execute('INSERT INTO notifications(user_id,message,created_at,is_read) VALUES(?,?,?,0)',(user_id,message,stamp()))

def init():
    DB.parent.mkdir(parents=True,exist_ok=True)
    with db() as c:
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,subtitle TEXT,avatar TEXT,verified INTEGER DEFAULT 0,xp INTEGER DEFAULT 0,interests TEXT,mode TEXT DEFAULT 'resident');
        CREATE TABLE IF NOT EXISTS communities (id INTEGER PRIMARY KEY,name TEXT NOT NULL,category TEXT,area TEXT,description TEXT,host_id INTEGER,cover TEXT,visibility TEXT DEFAULT 'open',approved INTEGER DEFAULT 1,FOREIGN KEY(host_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS community_members (community_id INTEGER,user_id INTEGER,status TEXT DEFAULT 'joined',PRIMARY KEY(community_id,user_id),FOREIGN KEY(community_id) REFERENCES communities(id),FOREIGN KEY(user_id) REFERENCES users(id));
        CREATE TABLE IF NOT EXISTS community_applications (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,category TEXT,area TEXT,description TEXT,requested_by INTEGER,status TEXT DEFAULT 'pending',created_at TEXT);
        CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,category TEXT,venue TEXT,area TEXT,start_at TEXT,capacity INTEGER,price INTEGER,level TEXT,description TEXT,host_id INTEGER,community_id INTEGER,cover TEXT,featured INTEGER DEFAULT 0,approved INTEGER DEFAULT 1);
        CREATE TABLE IF NOT EXISTS event_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER,user_id INTEGER,status TEXT DEFAULT 'booked',attended INTEGER DEFAULT 0,created_at TEXT,UNIQUE(event_id,user_id));
        CREATE TABLE IF NOT EXISTS storage_partners (id INTEGER PRIMARY KEY,name TEXT,area TEXT,address TEXT,capacity INTEGER,price_per_bag INTEGER,open_time TEXT,close_time TEXT,cover TEXT,active INTEGER DEFAULT 1,host_user_id INTEGER);
        CREATE TABLE IF NOT EXISTS storage_bookings (id INTEGER PRIMARY KEY AUTOINCREMENT,partner_id INTEGER,user_id INTEGER,date TEXT,start_time TEXT,end_time TEXT,bags INTEGER,price INTEGER,status TEXT DEFAULT 'booked',code TEXT UNIQUE,created_at TEXT);
        CREATE TABLE IF NOT EXISTS journeys (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,days INTEGER,area TEXT,interests TEXT,pace TEXT,budget INTEGER,with_people INTEGER,items TEXT,created_at TEXT);
        CREATE TABLE IF NOT EXISTS plans (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,title TEXT,area TEXT,start_at TEXT,description TEXT,seats INTEGER,category TEXT,status TEXT DEFAULT 'active');
        CREATE TABLE IF NOT EXISTS plan_members (plan_id INTEGER,user_id INTEGER,PRIMARY KEY(plan_id,user_id));
        CREATE TABLE IF NOT EXISTS rewards (id INTEGER PRIMARY KEY,title TEXT,points INTEGER,partner TEXT,description TEXT,stock INTEGER,icon TEXT);
        CREATE TABLE IF NOT EXISTS redemptions (id INTEGER PRIMARY KEY AUTOINCREMENT,reward_id INTEGER,user_id INTEGER,code TEXT,created_at TEXT);
        CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,message TEXT,created_at TEXT,is_read INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,target TEXT,reason TEXT,status TEXT DEFAULT 'open',created_at TEXT);
        CREATE TABLE IF NOT EXISTS moments (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,body TEXT,place TEXT,category TEXT,created_at TEXT,status TEXT DEFAULT 'visible');
        CREATE TABLE IF NOT EXISTS moment_likes (moment_id INTEGER,user_id INTEGER,PRIMARY KEY(moment_id,user_id));
        CREATE TABLE IF NOT EXISTS connections (id INTEGER PRIMARY KEY AUTOINCREMENT,from_id INTEGER,to_id INTEGER,status TEXT DEFAULT 'pending',created_at TEXT,UNIQUE(from_id,to_id));
        ''')
        if c.execute('SELECT COUNT(*) FROM users').fetchone()[0]: return
        users=[
            (1,'Maya Chen','member','Dubai resident · Community explorer','MC',1,1450,'["Padel","Food","Photography","Culture"]','resident'),
            (2,'Omar Haddad','host','Verified community organiser','OH',1,2680,'["Padel","Badminton","Events"]','resident'),
            (3,'Leila Rahman','partner','Storage partner · Marina','LR',1,860,'["Travel","Hospitality"]','resident'),
            (4,'AUNO Operations','admin','Platform operations','AO',1,0,'[]','resident'),
            (5,'Sofia Rossi','member','Visiting Dubai · 4 days','SR',1,720,'["Food","Architecture","Photography"]','visitor'),
            (6,'Noah Williams','member','Dubai resident · Sports & coffee','NW',1,450,'["Badminton","Coffee","Running"]','resident'),
        ]
        c.executemany('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)',users)
        communities=[
            (1,'The Padel Club','Sports','Dubai Marina','Friendly rallies, good people, and a weekly court ritual.',2,'padel','open',1),
            (2,'Weekend Wanderers','Adventure','Across Dubai','Small-group explorations that make the city feel like home.',2,'desert','open',1),
            (3,'Dubai Food Circle','Social','Downtown Dubai','Discover great food and better company, one table at a time.',2,'food','open',1),
            (4,'Shutter Society','Interests','Al Fahidi','Architecture, street photography and creative exploration.',2,'city','approval',1),
            (5,'Badminton After Hours','Sports','Al Quoz','Casual doubles and welcoming sessions for every skill level.',2,'badminton','open',1),
        ]
        c.executemany('INSERT INTO communities VALUES(?,?,?,?,?,?,?,?,?)',communities)
        cm=[(1,1,'joined'),(3,1,'joined'),(5,1,'joined'),(1,2,'joined'),(2,2,'joined'),(3,2,'joined'),(4,2,'joined'),(5,2,'joined'),(3,5,'joined'),(4,5,'joined'),(1,6,'joined')]
        c.executemany('INSERT INTO community_members VALUES(?,?,?)',cm)
        base=now().replace(hour=18,minute=30,second=0,microsecond=0)
        def t(days,h=18,m=30):return (base+timedelta(days=days)).replace(hour=h,minute=m).isoformat(timespec='minutes')
        ev=[
          ('Padel & People','Padel','Smash Padel Club','Dubai Marina',t(1,19),12,75,'All levels','A great game, new faces, and post-match conversations. Doubles rotation, equipment recommendations and a welcoming host.',2,1,'padel',1,1),
          ('Badminton Open Play','Badminton','Community Sports Hall','Al Quoz',t(2,10),16,45,'Beginner friendly','Easy-going doubles with rotating partners. Come solo, leave with teammates.',2,5,'badminton',1,1),
          ('Old Dubai Photo Walk','Culture','Al Fahidi District','Al Fahidi',t(3,8,30),10,0,'All welcome','Golden light, heritage lanes and new perspectives. Optional coffee stop at the end.',2,4,'city',0,1),
          ('The Sunday Table','Food','The Courtyard Café','Alserkal',t(4,13),8,95,'All welcome','A relaxed community lunch for people who enjoy discovering new stories over good food.',2,3,'food',0,1),
          ('Sunset Desert Circle','Adventure','Desert meeting point shared after booking','Dubai',t(6,16),14,160,'All welcome','A curated sunset community experience with an approved activity partner.',2,2,'desert',0,1),
          ('Padel Ladder: Week 1','Padel','Smash Padel Club','Dubai Marina',t(8,20),12,85,'Intermediate','Friendly ladder matches, clear scoring and a community leaderboard.',2,1,'padel',0,1),
        ]
        c.executemany('INSERT INTO events(title,category,venue,area,start_at,capacity,price,level,description,host_id,community_id,cover,featured,approved) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',ev)
        c.execute('INSERT INTO event_bookings(event_id,user_id,status,created_at) VALUES(?,?,?,?)',(2,1,'booked',stamp()))
        partners=[
          (1,'Marina Luggage Studio','Dubai Marina','Marina Promenade · demonstration location',18,24,'09:00','22:00','marina',1,3),
          (2,'Old Town Bag Hub','Al Fahidi','Al Fahidi · demonstration location',10,19,'08:00','20:00','city',1,3),
          (3,'Downtown Day Store','Downtown Dubai','Downtown Dubai · demonstration location',12,29,'10:00','23:00','downtown',1,3),
          (4,'JBR Travel Locker','JBR','The Walk · demonstration location',8,27,'09:00','22:00','beach',1,3),
        ]
        c.executemany('INSERT INTO storage_partners VALUES(?,?,?,?,?,?,?,?,?,?,?)',partners)
        rw=[
            (1,'Coffee on us',300,'AUNO Partner Café','Redeem a complimentary coffee voucher in the demo rewards programme.',15,'coffee'),
            (2,'Padel session discount',700,'AUNO Play','Example discount voucher for a future community padel event.',8,'trophy'),
            (3,'City explorer perk',500,'AUNO Explore','A mock voucher for a curated city experience.',12,'compass'),
        ]
        c.executemany('INSERT INTO rewards VALUES(?,?,?,?,?,?,?)',rw)
        c.execute('INSERT INTO community_applications(name,category,area,description,requested_by,status,created_at) VALUES(?,?,?,?,?,?,?)',('Dubai Runners Collective','Sports','Jumeirah','Community running group with beginner routes and regular meetups.',5,'pending',stamp()))
        c.execute('INSERT INTO reports(user_id,target,reason,status,created_at) VALUES(?,?,?,?,?)',(5,'event:4','Please confirm the venue accessibility information.','open',stamp()))
        c.execute('INSERT INTO plans(user_id,title,area,start_at,description,seats,category) VALUES(?,?,?,?,?,?,?)',(5,'Sunday architecture wander','Downtown Dubai',t(4,9),'Easy walk, architecture stops and optional coffee.',5,'Culture'))
        c.execute('INSERT INTO plan_members(plan_id,user_id) VALUES(?,?)',(1,5))
        c.execute('INSERT INTO moments(user_id,body,place,category,created_at) VALUES(?,?,?,?,?)',(5,'A morning in Al Fahidi reminded me why slow travel is the best travel. Anyone up for a photography walk this weekend?','Al Fahidi','Culture',stamp()))
        c.execute('INSERT INTO moments(user_id,body,place,category,created_at) VALUES(?,?,?,?,?)',(2,'Our padel circle is opening a few beginner-friendly spots this week. Come solo; we rotate partners and stay for coffee.','Dubai Marina','Sports',stamp()))
        c.execute('INSERT INTO moments(user_id,body,place,category,created_at) VALUES(?,?,?,?,?)',(6,'Found a lovely little café after badminton in Al Quoz. Small discoveries are better when shared.','Al Quoz','Food',stamp()))
        notify(c,1,'You have a spot at Badminton Open Play. See you on court!')
        notify(c,1,'Welcome to AUNO. Your city looks better together.')

init()


def current_user(x_demo_user: Optional[int] = Header(None)):
    user_id=x_demo_user or 1
    with db() as c: u=row(c,'SELECT * FROM users WHERE id=?',(user_id,))
    if not u: raise HTTPException(401,'Choose a valid demo identity')
    return u

def require_role(user,roles):
    if user['role'] not in roles:raise HTTPException(403,'Not available for this demo persona')

def load_event(con,e):
    e=dict(e)
    e['booked']=con.execute("SELECT COUNT(*) FROM event_bookings WHERE event_id=? AND status='booked'",(e['id'],)).fetchone()[0]
    return e

@app.get('/')
def index(): return FileResponse(str(ROOT/'static'/'index.html'))

@app.get('/api/bootstrap')
def bootstrap(x_demo_user: Optional[int] = Header(None)):
    user=current_user(x_demo_user)
    with db() as c:
        users=rows(c,'SELECT id,name,role,subtitle,avatar,verified,xp,interests,mode FROM users ORDER BY id')
        for u in users:u['interests']=jparse(u['interests'],[])
        events=[load_event(c,e) for e in c.execute('SELECT * FROM events WHERE approved=1 ORDER BY start_at').fetchall()]
        for e in events:
            booking=row(c,"SELECT id,status,attended FROM event_bookings WHERE event_id=? AND user_id=? AND status='booked'",(e['id'],user['id']))
            e['my_booking']=booking
        communities=rows(c,"SELECT c.*,COUNT(cm.user_id) AS members FROM communities c LEFT JOIN community_members cm ON cm.community_id=c.id AND cm.status='joined' WHERE c.approved=1 GROUP BY c.id ORDER BY c.id")
        for co in communities:co['membership']=row(c,'SELECT status FROM community_members WHERE community_id=? AND user_id=?',(co['id'],user['id']))
        partners=rows(c,'SELECT * FROM storage_partners WHERE active=1')
        rewards=rows(c,'SELECT * FROM rewards WHERE stock>0')
        bookings=rows(c,"SELECT b.*,p.name AS partner_name,p.area FROM storage_bookings b JOIN storage_partners p ON p.id=b.partner_id WHERE b.user_id=? ORDER BY b.id DESC",(user['id'],))
        event_bookings=rows(c,"SELECT b.*,e.title,e.start_at,e.venue,e.area,e.cover FROM event_bookings b JOIN events e ON e.id=b.event_id WHERE b.user_id=? AND b.status='booked' ORDER BY e.start_at",(user['id'],))
        journeys=rows(c,'SELECT * FROM journeys WHERE user_id=? ORDER BY id DESC LIMIT 5',(user['id'],))
        for journey in journeys:journey['items']=jparse(journey['items'],[])
        plans=rows(c,'SELECT p.*,u.name AS host_name,(SELECT COUNT(*) FROM plan_members pm WHERE pm.plan_id=p.id) AS joined FROM plans p JOIN users u ON p.user_id=u.id WHERE p.status="active" ORDER BY p.start_at')
        for p in plans:p['my_member']=bool(row(c,'SELECT 1 AS yes FROM plan_members WHERE plan_id=? AND user_id=?',(p['id'],user['id'])))
        notifications=rows(c,'SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 15',(user['id'],))
        redemptions=rows(c,'SELECT x.*,r.title FROM redemptions x JOIN rewards r ON x.reward_id=r.id WHERE x.user_id=? ORDER BY x.id DESC',(user['id'],))
        my_apps=rows(c,'SELECT * FROM community_applications WHERE requested_by=? ORDER BY id DESC',(user['id'],))
        me=next((u for u in users if u['id']==user['id']),None)
        out={'me':me,'personas':users,'events':events,'communities':communities,'partners':partners,'rewards':rewards,'storageBookings':bookings,'eventBookings':event_bookings,'journeys':journeys,'plans':plans,'notifications':notifications,'redemptions':redemptions,'myApplications':my_apps}
        out['people']=[x for x in users if x['id']!=user['id'] and x['role'] in ('member','host')]
        out['connections']=rows(c,'''SELECT r.*,u.name AS from_name,u.avatar AS from_avatar,v.name AS to_name FROM connections r JOIN users u ON u.id=r.from_id JOIN users v ON v.id=r.to_id WHERE r.from_id=? OR r.to_id=? ORDER BY r.id DESC''',(user['id'],user['id']))
        out['moments']=rows(c,'''SELECT m.*,u.name AS author,u.avatar AS author_avatar,(SELECT COUNT(*) FROM moment_likes l WHERE l.moment_id=m.id) AS likes,(SELECT COUNT(*) FROM moment_likes l WHERE l.moment_id=m.id AND l.user_id=?) AS liked FROM moments m JOIN users u ON m.user_id=u.id WHERE m.status='visible' ORDER BY m.id DESC''',(user['id'],))
        if user['role']=='admin':
            out['admin']={
                'applications': rows(c,"SELECT a.*,u.name AS requester FROM community_applications a JOIN users u ON a.requested_by=u.id WHERE a.status='pending' ORDER BY a.id"),
                'reports':rows(c,"SELECT r.*,u.name AS reporter FROM reports r JOIN users u ON r.user_id=u.id WHERE r.status='open' ORDER BY r.id"),
                'members':rows(c,'SELECT id,name,role,verified,xp,mode FROM users ORDER BY id'),
                'moderationEvents':rows(c,'SELECT id,title,category,approved,start_at FROM events ORDER BY id DESC'),
                'momentsModeration':rows(c,'''SELECT m.id,m.body,m.status,u.name FROM moments m JOIN users u ON m.user_id=u.id ORDER BY m.id DESC'''),
                'overview':{
                    'members':c.execute("SELECT COUNT(*) FROM users WHERE role IN ('member','host')").fetchone()[0],
                    'communities':c.execute('SELECT COUNT(*) FROM communities WHERE approved=1').fetchone()[0],
                    'bookings':c.execute("SELECT COUNT(*) FROM event_bookings WHERE status='booked'").fetchone()[0],
                    'storage':c.execute('SELECT COUNT(*) FROM storage_bookings').fetchone()[0],
                    'events':c.execute('SELECT COUNT(*) FROM events WHERE approved=1').fetchone()[0],
                },
                'analytics':{
                    'events':rows(c,'''SELECT e.id,e.title,e.category,e.area,e.start_at,e.capacity,e.price,e.approved,
                        (SELECT COUNT(*) FROM event_bookings b WHERE b.event_id=e.id AND b.status='booked') AS booked,
                        (SELECT COUNT(*) FROM event_bookings b WHERE b.event_id=e.id AND b.status='booked' AND b.attended=1) AS attended
                        FROM events e ORDER BY e.start_at'''),
                    'communities':rows(c,'''SELECT c.id,c.name,c.category,COUNT(cm.user_id) AS members
                        FROM communities c LEFT JOIN community_members cm ON cm.community_id=c.id AND cm.status='joined'
                        WHERE c.approved=1 GROUP BY c.id'''),
                    'storage':rows(c,'''SELECT p.id,p.name,p.capacity,
                        (SELECT COUNT(*) FROM storage_bookings b WHERE b.partner_id=p.id AND b.status != 'collected') AS activeBookings
                        FROM storage_partners p'''),
                    'connections':c.execute("SELECT COUNT(*) FROM connections WHERE status='accepted'").fetchone()[0],
                    'moments':c.execute("SELECT COUNT(*) FROM moments WHERE status='visible'").fetchone()[0],
                    'reports':c.execute("SELECT COUNT(*) FROM reports WHERE status='open'").fetchone()[0],
                }
            }
        if user['role']=='host':
            out['host']={'events':rows(c,'SELECT e.*,(SELECT COUNT(*) FROM event_bookings b WHERE b.event_id=e.id AND b.status="booked") AS booked FROM events e WHERE host_id=? ORDER BY e.start_at',(user['id'],)),
                'attendees':rows(c,'SELECT b.id,b.event_id,b.attended,u.name,u.avatar,e.title,e.start_at FROM event_bookings b JOIN users u ON u.id=b.user_id JOIN events e ON e.id=b.event_id WHERE e.host_id=? AND b.status="booked" ORDER BY e.start_at',(user['id'],)),
                'membershipRequests':rows(c,'''SELECT cm.community_id,cm.user_id,u.name,u.avatar,c.name AS community_name FROM community_members cm JOIN users u ON cm.user_id=u.id JOIN communities c ON cm.community_id=c.id WHERE c.host_id=? AND cm.status='pending' ORDER BY cm.community_id''',(user['id'],))}
        if user['role']=='partner':
            out['partner']={'venues':rows(c,'SELECT * FROM storage_partners WHERE host_user_id=?',(user['id'],)),
                'bookings':rows(c,'SELECT b.*,p.name AS partner_name,u.name AS guest_name FROM storage_bookings b JOIN storage_partners p ON p.id=b.partner_id JOIN users u ON u.id=b.user_id WHERE p.host_user_id=? ORDER BY b.id DESC',(user['id'],))}
        return out

class EventBook(BaseModel):event_id:int
@app.post('/api/events/book')
def book_event(data:EventBook,x_demo_user:Optional[int]=Header(None)):
    user=current_user(x_demo_user)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        event=row(c,'SELECT * FROM events WHERE id=? AND approved=1',(data.event_id,))
        if not event:raise HTTPException(404,'Event not found')
        if event['start_at']<stamp():raise HTTPException(400,'This event has already started')
        if row(c,"SELECT id FROM event_bookings WHERE event_id=? AND user_id=? AND status='booked'",(data.event_id,user['id'])):raise HTTPException(409,'You already have a spot')
        count=c.execute("SELECT COUNT(*) FROM event_bookings WHERE event_id=? AND status='booked'",(data.event_id,)).fetchone()[0]
        if count>=event['capacity']:raise HTTPException(409,'This session is full')
        c.execute('INSERT INTO event_bookings(event_id,user_id,status,created_at) VALUES(?,?,?,?) ON CONFLICT(event_id,user_id) DO UPDATE SET status="booked",attended=0,created_at=excluded.created_at',(data.event_id,user['id'],'booked',stamp()))
        notify(c,user['id'],f"Your demo spot at {event['title']} is confirmed. No payment was taken.")
        return {'ok':True,'message':'Demo booking confirmed. No charge was made.'}

@app.post('/api/events/{event_id}/cancel')
def cancel_event(event_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:
        cur=c.execute("UPDATE event_bookings SET status='cancelled' WHERE event_id=? AND user_id=? AND status='booked'",(event_id,u['id']))
        if not cur.rowcount:raise HTTPException(404,'No active booking found')
        notify(c,u['id'],'Your demonstration event booking was cancelled.')
    return {'ok':True}

@app.post('/api/communities/{community_id}/join')
def join_community(community_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:
        co=row(c,'SELECT * FROM communities WHERE id=? AND approved=1',(community_id,))
        if not co:raise HTTPException(404,'Community not found')
        status='pending' if co['visibility']=='approval' else 'joined'
        c.execute('INSERT INTO community_members(community_id,user_id,status) VALUES(?,?,?) ON CONFLICT(community_id,user_id) DO UPDATE SET status=excluded.status',(community_id,u['id'],status))
        notify(c,u['id'],f"{'Request submitted to' if status=='pending' else 'You joined'} {co['name']}.")
        return {'ok':True,'status':status}

class CommunityApply(BaseModel):
    name:str=Field(min_length=4,max_length=80)
    category:str=Field(min_length=3,max_length=32)
    area:str=Field(min_length=3,max_length=80)
    description:str=Field(min_length=20,max_length=500)
@app.post('/api/communities/apply')
def community_apply(data:CommunityApply,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:
        c.execute('INSERT INTO community_applications(name,category,area,description,requested_by,created_at) VALUES(?,?,?,?,?,?)',(data.name,data.category,data.area,data.description,u['id'],stamp()))
        notify(c,u['id'],'Your community proposal is in the review queue.')
    return {'ok':True}

class Review(BaseModel):action:str
@app.post('/api/admin/applications/{app_id}/review')
def review_app(app_id:int,data:Review,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['admin'])
    if data.action not in ('approved','rejected'):raise HTTPException(400,'Invalid review action')
    with db() as c:
        a=row(c,"SELECT * FROM community_applications WHERE id=? AND status='pending'",(app_id,))
        if not a:raise HTTPException(404,'Application not in review queue')
        c.execute('UPDATE community_applications SET status=? WHERE id=?',(data.action,app_id))
        if data.action=='approved':
            cur=c.execute('INSERT INTO communities(name,category,area,description,host_id,cover,visibility,approved) VALUES(?,?,?,?,?,?,?,1)',(a['name'],a['category'],a['area'],a['description'],a['requested_by'],'city','approval'))
            c.execute('INSERT INTO community_members(community_id,user_id,status) VALUES(?,?,?)',(cur.lastrowid,a['requested_by'],'joined'))
        notify(c,a['requested_by'],f"Your community proposal '{a['name']}' was {data.action} in the demo.")
    return {'ok':True}

@app.post('/api/admin/reports/{report_id}/resolve')
def resolve_report(report_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['admin'])
    with db() as c:
        changed=c.execute("UPDATE reports SET status='resolved' WHERE id=? AND status='open'",(report_id,)).rowcount
        if not changed:raise HTTPException(404,'Report not found')
    return {'ok':True}

class NewEvent(BaseModel):
    title:str=Field(min_length=4,max_length=100)
    category:str=Field(min_length=3,max_length=35)
    venue:str=Field(min_length=3,max_length=100)
    area:str=Field(min_length=3,max_length=80)
    start_at:str
    capacity:int=Field(ge=2,le=500)
    price:int=Field(ge=0,le=9999)
    description:str=Field(min_length=12,max_length=800)
    level:str='All welcome'
@app.post('/api/host/events')
def host_create_event(data:NewEvent,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['host','admin'])
    try: dt=datetime.fromisoformat(data.start_at)
    except ValueError:raise HTTPException(400,'Invalid event date')
    if dt.date()<now().date():raise HTTPException(400,'Select a future date')
    with db() as c:
        c.execute('INSERT INTO events(title,category,venue,area,start_at,capacity,price,level,description,host_id,community_id,cover,featured,approved) VALUES(?,?,?,?,?,?,?,?,?,?,NULL,?,0,1)',(data.title,data.category,data.venue,data.area,data.start_at,data.capacity,data.price,data.level,data.description,u['id'],'padel' if data.category=='Padel' else 'city'))
    return {'ok':True}

@app.post('/api/host/bookings/{booking_id}/checkin')
def checkin(booking_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['host','admin'])
    with db() as c:
        b=row(c,'SELECT b.*,e.host_id,e.title FROM event_bookings b JOIN events e ON e.id=b.event_id WHERE b.id=?',(booking_id,))
        if not b:raise HTTPException(404,'Booking not found')
        if u['role']!='admin' and b['host_id']!=u['id']:raise HTTPException(403,'Not your event')
        if b['status']!='booked' or b['attended']:raise HTTPException(409,'Already checked in or cancelled')
        c.execute('UPDATE event_bookings SET attended=1 WHERE id=?',(booking_id,))
        c.execute('UPDATE users SET xp=xp+100 WHERE id=?',(b['user_id'],))
        notify(c,b['user_id'],f"Checked in at {b['title']}! You earned 100 demo XP.")
    return {'ok':True}

class StorageBook(BaseModel):
    partner_id:int
    date:str
    start_time:str
    end_time:str
    bags:int=Field(ge=1,le=6)
@app.post('/api/storage/book')
def book_storage(data:StorageBook,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    try: date=datetime.strptime(data.date,'%Y-%m-%d').date()
    except ValueError:raise HTTPException(400,'Invalid date')
    if date<now().date():raise HTTPException(400,'Choose today or a future date')
    if data.end_time<=data.start_time:raise HTTPException(400,'Pickup must be later than drop-off')
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        p=row(c,'SELECT * FROM storage_partners WHERE id=? AND active=1',(data.partner_id,))
        if not p:raise HTTPException(404,'Partner not found')
        if data.start_time<p['open_time'] or data.end_time>p['close_time']:raise HTTPException(400,'Outside demo partner operating hours')
        used=c.execute("SELECT COALESCE(SUM(bags),0) FROM storage_bookings WHERE partner_id=? AND date=? AND status IN ('booked','dropped_off') AND start_time<? AND end_time>?",(p['id'],data.date,data.end_time,data.start_time)).fetchone()[0]
        if used+data.bags>p['capacity']:raise HTTPException(409,'Not enough available bag capacity')
        price=data.bags*p['price_per_bag'];code=uid('ST-')
        c.execute('INSERT INTO storage_bookings(partner_id,user_id,date,start_time,end_time,bags,price,status,code,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',(p['id'],u['id'],data.date,data.start_time,data.end_time,data.bags,price,'booked',code,stamp()))
        notify(c,u['id'],f"Demo luggage reservation {code} at {p['name']} confirmed. No payment taken.")
    return {'ok':True,'code':code,'price':price}

class StatusUpdate(BaseModel):status:str
@app.post('/api/partner/bookings/{booking_id}/status')
def partner_update(booking_id:int,data:StatusUpdate,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['partner','admin'])
    transitions={'booked':'dropped_off','dropped_off':'collected'}
    with db() as c:
        b=row(c,'SELECT b.*,p.host_user_id FROM storage_bookings b JOIN storage_partners p ON p.id=b.partner_id WHERE b.id=?',(booking_id,))
        if not b:raise HTTPException(404,'Booking not found')
        if u['role']!='admin' and b['host_user_id']!=u['id']:raise HTTPException(403,'Not your partner booking')
        if transitions.get(b['status'])!=data.status:raise HTTPException(409,'Invalid custody status transition')
        c.execute('UPDATE storage_bookings SET status=? WHERE id=?',(data.status,booking_id))
        notify(c,b['user_id'],f"Storage reservation {b['code']} marked {data.status.replace('_',' ')} in the demo.")
    return {'ok':True}

PLACES=[
 {'name':'Al Fahidi Historical Neighbourhood','area':'Al Fahidi','category':'Culture','minutes':90,'cost':0,'icon':'🏛️','description':'Heritage lanes, wind towers and architecture.'},
 {'name':'Dubai Creek Abra','area':'Old Dubai','category':'Culture','minutes':45,'cost':5,'icon':'⛵','description':'A classic water crossing with city views.'},
 {'name':'Dubai Marina Walk','area':'Dubai Marina','category':'Outdoors','minutes':70,'cost':0,'icon':'🌊','description':'An easy waterfront stroll with cafés.'},
 {'name':'Alserkal Avenue','area':'Al Quoz','category':'Art','minutes':120,'cost':0,'icon':'🎨','description':'Galleries, design studios and creative spaces.'},
 {'name':'Jumeirah Beach Walk','area':'JBR','category':'Outdoors','minutes':80,'cost':0,'icon':'☀️','description':'Fresh air and a relaxing coastal walk.'},
 {'name':'Museum of the Future','area':'Trade Centre','category':'Architecture','minutes':120,'cost':159,'icon':'✨','description':'An iconic building and future-focused exhibitions.'},
 {'name':'Dubai Frame','area':'Zabeel','category':'Architecture','minutes':90,'cost':50,'icon':'🖼️','description':'City panoramas and distinctive architecture.'},
 {'name':'Local Food Trail','area':'Deira','category':'Food','minutes':90,'cost':65,'icon':'🍜','description':'Explore a variety of food stops and neighbourhood flavours.'},
 {'name':'Padel Social Session','area':'Dubai Marina','category':'Sports','minutes':90,'cost':75,'icon':'🎾','description':'Join a friendly recreational sports meetup.'},
 {'name':'Desert Sunset Experience','area':'Dubai','category':'Adventure','minutes':210,'cost':160,'icon':'🌅','description':'Experience the golden-hour desert with an approved operator.'},
]
class JourneyRequest(BaseModel):
    days:int=Field(ge=1,le=14)
    area:str=Field(min_length=2,max_length=70)
    interests:list[str]=Field(default_factory=list,max_length=8)
    pace:str='Balanced'
    budget:int=Field(ge=0,le=20000)
    with_people:bool=True
@app.post('/api/journeys/generate')
def journey(data:JourneyRequest,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    # Transparent deterministic planning baseline, not a real-time AI or availability engine.
    interests=[i.lower() for i in data.interests]
    def score(p):
        n=p['name'].lower(); cat=p['category'].lower()
        match=sum(4 for i in interests if i in cat or i in n or any(w in n for w in i.split()))
        local=3 if data.area.lower() in p['area'].lower() or p['area'].lower() in data.area.lower() else 0
        affordable=2 if p['cost']<=max(50,data.budget//max(1,data.days)) else -3
        return match+local+affordable
    ranked=sorted(PLACES,key=lambda p:(-score(p), p['cost'],p['name']))
    per_day=2 if data.pace=='Relaxed' else 4 if data.pace=='Packed' else 3
    chosen=[]; spent=0
    for day in range(1,data.days+1):
        day_items=[]
        for p in ranked:
            if p['name'] in [x['name'] for x in chosen]:continue
            if spent+p['cost']>data.budget:continue
            day_items.append(dict(p,day=day,time=['09:30','12:00','15:30','18:00'][len(day_items)],social_tip=('Look for an approved group activity near this stop.' if data.with_people else 'Enjoy at your own pace.')))
            spent+=p['cost'];chosen.append(day_items[-1])
            if len(day_items)>=per_day:break
        if not day_items:break
    with db() as c:
        c.execute('INSERT INTO journeys(user_id,days,area,interests,pace,budget,with_people,items,created_at) VALUES(?,?,?,?,?,?,?,?,?)',(u['id'],data.days,data.area,json.dumps(data.interests),data.pace,data.budget,int(data.with_people),json.dumps(chosen),stamp()))
    return {'ok':True,'items':chosen,'total_cost':spent,'note':'Sample curated itinerary. Prices, opening times, travel times, tickets and event availability are not live.'}

class NewPlan(BaseModel):
    title:str=Field(min_length=4,max_length=90)
    category:str=Field(min_length=3,max_length=35)
    area:str=Field(min_length=3,max_length=80)
    start_at:str
    seats:int=Field(ge=2,le=30)
    description:str=Field(min_length=12,max_length=400)
@app.post('/api/plans')
def create_plan(data:NewPlan,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    if datetime.fromisoformat(data.start_at).date()<now().date():raise HTTPException(400,'Use a future date')
    with db() as c:
        cur=c.execute('INSERT INTO plans(user_id,title,area,start_at,description,seats,category) VALUES(?,?,?,?,?,?,?)',(u['id'],data.title,data.area,data.start_at,data.description,data.seats,data.category))
        c.execute('INSERT INTO plan_members(plan_id,user_id) VALUES(?,?)',(cur.lastrowid,u['id']))
    return {'ok':True}

@app.post('/api/plans/{plan_id}/join')
def join_plan(plan_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        p=row(c,'SELECT * FROM plans WHERE id=? AND status="active"',(plan_id,))
        if not p:raise HTTPException(404,'Plan unavailable')
        if row(c,'SELECT 1 AS ok FROM plan_members WHERE plan_id=? AND user_id=?',(plan_id,u['id'])):raise HTTPException(409,'Already joined')
        if c.execute('SELECT COUNT(*) FROM plan_members WHERE plan_id=?',(plan_id,)).fetchone()[0]>=p['seats']:raise HTTPException(409,'This plan is full')
        c.execute('INSERT INTO plan_members(plan_id,user_id) VALUES(?,?)',(plan_id,u['id']))
        notify(c,p['user_id'],f"{u['name']} joined your plan: {p['title']}")
    return {'ok':True}

@app.post('/api/rewards/{reward_id}/redeem')
def redeem(reward_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        r=row(c,'SELECT * FROM rewards WHERE id=?',(reward_id,))
        balance=c.execute('SELECT xp FROM users WHERE id=?',(u['id'],)).fetchone()[0]
        if not r or r['stock']<=0:raise HTTPException(404,'Reward unavailable')
        if balance<r['points']:raise HTTPException(400,'Not enough XP yet')
        code=uid('RW-')
        c.execute('UPDATE users SET xp=xp-? WHERE id=?',(r['points'],u['id']))
        c.execute('UPDATE rewards SET stock=stock-1 WHERE id=?',(r['id'],))
        c.execute('INSERT INTO redemptions(reward_id,user_id,code,created_at) VALUES(?,?,?,?)',(r['id'],u['id'],code,stamp()))
        notify(c,u['id'],f"Demo voucher {code} created: {r['title']}. Not redeemable in the real world.")
    return {'ok':True,'code':code}

class Preferences(BaseModel):
    mode:str
    interests:list[str]
@app.post('/api/me/preferences')
def update_preferences(data:Preferences,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    if data.mode not in ('resident','visitor'):raise HTTPException(400,'Invalid mode')
    if len(data.interests)>12:raise HTTPException(400,'Too many interests')
    with db() as c:c.execute('UPDATE users SET mode=?,interests=? WHERE id=?',(data.mode,json.dumps(data.interests),u['id']))
    return {'ok':True}

@app.post('/api/notifications/read')
def read_notifications(x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:c.execute('UPDATE notifications SET is_read=1 WHERE user_id=?',(u['id'],))
    return {'ok':True}

@app.get('/api/health')
def health():return {'ok':True,'mode':'demo','payments':'simulated','identity_verification':'simulated','whatsapp':'share-links-only'}

class MomentCreate(BaseModel):
    body:str=Field(min_length=10,max_length=600)
    place:str=Field(min_length=3,max_length=80)
    category:str=Field(min_length=3,max_length=40)
@app.post('/api/moments')
def create_moment(data:MomentCreate,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:c.execute('INSERT INTO moments(user_id,body,place,category,created_at) VALUES(?,?,?,?,?)',(u['id'],data.body,data.place,data.category,stamp()))
    return {'ok':True}

@app.post('/api/moments/{moment_id}/like')
def like_moment(moment_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:
        if not row(c,"SELECT id FROM moments WHERE id=? AND status='visible'",(moment_id,)):raise HTTPException(404,'Moment not available')
        if row(c,'SELECT 1 AS ok FROM moment_likes WHERE moment_id=? AND user_id=?',(moment_id,u['id'])):
            c.execute('DELETE FROM moment_likes WHERE moment_id=? AND user_id=?',(moment_id,u['id']))
            return {'ok':True,'liked':False}
        c.execute('INSERT INTO moment_likes(moment_id,user_id) VALUES(?,?)',(moment_id,u['id']))
        return {'ok':True,'liked':True}

class ConnectionRequest(BaseModel):user_id:int
@app.post('/api/connections/request')
def connection_request(data:ConnectionRequest,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    if u['id']==data.user_id:raise HTTPException(400,'You cannot connect to yourself')
    with db() as c:
        other=row(c,"SELECT * FROM users WHERE id=? AND role IN ('host','member')",(data.user_id,))
        if not other:raise HTTPException(404,'Person unavailable')
        existing=row(c,'SELECT * FROM connections WHERE (from_id=? AND to_id=?) OR (to_id=? AND from_id=?)',(u['id'],other['id'],u['id'],other['id']))
        if existing:raise HTTPException(409,'A connection request or relationship already exists')
        c.execute('INSERT INTO connections(from_id,to_id,status,created_at) VALUES(?,?,?,?)',(u['id'],other['id'],'pending',stamp()))
        notify(c,other['id'],f"{u['name']} requested to connect through AUNO.")
    return {'ok':True}

@app.post('/api/connections/{connection_id}/review')
def review_connection(connection_id:int,data:Review,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    if data.action not in ('accepted','rejected'):raise HTTPException(400,'Invalid response')
    with db() as c:
        req=row(c,"SELECT * FROM connections WHERE id=? AND to_id=? AND status='pending'",(connection_id,u['id']))
        if not req:raise HTTPException(404,'No pending request')
        c.execute('UPDATE connections SET status=? WHERE id=?',(data.action,connection_id))
        notify(c,req['from_id'],f"{u['name']} {data.action} your AUNO connection request.")
    return {'ok':True}

class ReportCreate(BaseModel):target:str=Field(min_length=4,max_length=60);reason:str=Field(min_length=6,max_length=300)
@app.post('/api/reports')
def create_report(data:ReportCreate,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user)
    with db() as c:c.execute('INSERT INTO reports(user_id,target,reason,status,created_at) VALUES(?,?,?,?,?)',(u['id'],data.target,data.reason,'open',stamp()))
    return {'ok':True}

@app.post('/api/admin/moments/{moment_id}/hide')
def hide_moment(moment_id:int,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['admin'])
    with db() as c:
        changed=c.execute("UPDATE moments SET status='hidden' WHERE id=? AND status='visible'",(moment_id,)).rowcount
        if not changed:raise HTTPException(404,'Moment not visible')
    return {'ok':True}

@app.post('/api/admin/events/{event_id}/visibility')
def event_visibility(event_id:int,data:Review,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['admin'])
    if data.action not in ('hide','show'):raise HTTPException(400,'Invalid action')
    with db() as c:
        changed=c.execute('UPDATE events SET approved=? WHERE id=?',(int(data.action=='show'),event_id)).rowcount
        if not changed:raise HTTPException(404,'Event unavailable')
    return {'ok':True}

@app.post('/api/host/communities/{community_id}/members/{member_id}/review')
def host_member_review(community_id:int,member_id:int,data:Review,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['host','admin'])
    if data.action not in ('joined','rejected'):raise HTTPException(400,'Invalid action')
    with db() as c:
        co=row(c,'SELECT * FROM communities WHERE id=?',(community_id,))
        if not co or (u['role']!='admin' and co['host_id']!=u['id']):raise HTTPException(403,'Not your community')
        changed=c.execute("UPDATE community_members SET status=? WHERE community_id=? AND user_id=? AND status='pending'",(data.action,community_id,member_id)).rowcount
        if not changed:raise HTTPException(404,'Request not pending')
        notify(c,member_id,f"Your membership request for {co['name']} was {('approved' if data.action=='joined' else 'declined')}.")
    return {'ok':True}

class VenueUpdate(BaseModel):
    capacity:int=Field(ge=1,le=500)
    price_per_bag:int=Field(ge=0,le=9999)
    open_time:str
    close_time:str
@app.post('/api/partner/venues/{venue_id}')
def venue_update(venue_id:int,data:VenueUpdate,x_demo_user:Optional[int]=Header(None)):
    u=current_user(x_demo_user);require_role(u,['partner','admin'])
    if data.close_time<=data.open_time:raise HTTPException(400,'Closing time must follow opening time')
    with db() as c:
        v=row(c,'SELECT * FROM storage_partners WHERE id=?',(venue_id,))
        if not v or (u['role']!='admin' and v['host_user_id']!=u['id']):raise HTTPException(403,'Not your location')
        c.execute('UPDATE storage_partners SET capacity=?,price_per_bag=?,open_time=?,close_time=? WHERE id=?',(data.capacity,data.price_per_bag,data.open_time,data.close_time,venue_id))
    return {'ok':True}
