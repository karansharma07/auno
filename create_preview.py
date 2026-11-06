"""Creates an illustrative product composition (not a browser screenshot)."""
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageOps
from pathlib import Path
from io import BytesIO
import cairosvg
root=Path(__file__).parent
W,H=1600,1060
c=Image.new('RGB',(W,H),'#f7f8f5');d=ImageDraw.Draw(c)
font='/usr/share/fonts/truetype/clear-sans/ClearSans-Regular.ttf'
bold='/usr/share/fonts/truetype/clear-sans/ClearSans-Bold.ttf'
if not Path(bold).exists():bold=font
f=lambda s,heavy=False:ImageFont.truetype(bold if heavy else font,s)
INK='#19332a'; MUTED='#82938a'; GREEN='#1b4839'; WHITE='#ffffff'; PAPER='#f7f8f5'
def text(x,y,s,size=18,fill=INK,heavy=False):d.text((x,y),s,font=f(size,heavy),fill=fill)
def rounded(box,radius=18,fill='#ffffff',outline=None,width=1):d.rounded_rectangle(box,radius=radius,fill=fill,outline=outline,width=width)
def svgimg(name,size):
    p=root/'static'/'assets'/f'{name}.svg'
    return ImageOps.fit(Image.open(BytesIO(cairosvg.svg2png(url=str(p),output_width=960,output_height=620))).convert('RGBA'),size,method=Image.Resampling.LANCZOS)
# rail
rounded((0,0,259,H),0,WHITE)
d.line((259,0,259,H),fill='#e6ebe5',width=2)
rounded((28,27,75,74),15,GREEN)
text(43,29,'a',34,'#e3f4a4',True)
d.ellipse((60,39,68,47),fill='#efa482')
text(87,24,'auno',36,INK,True)
text(88,63,'LIFE, TOGETHER.',11,'#99a89e',True)
text(29,132,'YOUR WORLD',12,'#a2afa7',True)
nav=[('•','Home'),('›','Discover'),('○','People'),('·','Moments'),('○','Communities'),('›','Journeys'),('□','Luggage storage'),('·','Social plans'),('*','Rewards'),('≡','Inbox'),('○','My profile')]
y=169
for i,(sym,label) in enumerate(nav):
    if i==0:rounded((17,y-6,238,y+38),12,'#e6f0e7')
    text(33,y+1,sym,19,'#3c7556' if i==0 else '#809085')
    text(65,y+2,label,17,'#1b4737' if i==0 else '#687d70',i==0)
    y+=54
rounded((22,865,237,993),16,GREEN)
text(39,885,'Life happens',18,WHITE,True)
text(39,909,'together.',18,WHITE,True)
text(39,948,'Find your people. Make a plan.',12,'#bad3c2')
# topbar
rounded((260,0,W,86),0,PAPER)
d.line((260,85,W,85),fill='#e4eae3',width=2)
text(307,31,'AUNO    /    Home',15,'#819087')
rounded((920,22,1214,65),12,WHITE,outline='#e7eee6')
text(944,32,'⌕   People, places, experiences',14,'#98a69c')
rounded((1235,21,1397,65),13,'#e5ece5')
rounded((1240,24,1315,62),10,WHITE)
text(1250,34,'Resident',13,INK,True)
text(1322,34,'Visitor',13,'#9caa9b')
rounded((1430,23,1474,64),22,'#d5e6da')
text(1441,32,'MC',14,'#315d47',True)
text(1488,25,'Maya',15,INK,True)
text(1487,45,'Member',11,MUTED)
# content
text(307,115,'WELCOME TO YOUR CITY',13,'#5d8c73',True)
text(307,137,'Hello, Maya',40,INK,True)
text(307,193,'Good people. Great plans. Your Dubai starts here.',16,MUTED)
rounded((300,238,1555,576),26,GREEN)
# scenic visual
city=svgimg('city',(590,338))
c.paste(city,(965,238),city)
d=ImageDraw.Draw(c)
# fade overlay on left of image
ov=Image.new('RGBA',(200,338),(0,0,0,0));px=ov.load()
for xx in range(200):
  a=int(255*(1-xx/200))
  for yy in range(338):px[xx,yy]=(27,72,57,a)
c.paste(ov,(965,238),ov)
d=ImageDraw.Draw(c)
text(346,267,'BELONG SOMEWHERE BRILLIANT',13,'#c9decf',True)
text(346,308,'Find your people.',47,WHITE,True)
text(346,362,'Make the city yours.',47,'#e0efaa',True)
text(346,437,'Join a game, discover a circle, make a plan.',16,'#c9dacf')
text(346,463,'Your best days start with the people you share them with.',16,'#c9dacf')
rounded((345,514,553,559),12,'#e5f4ad')
text(370,526,'Explore experiences  →',15,INK,True)
rounded((569,514,773,559),12,WHITE)
text(591,526,'Explore communities',15,INK,True)
rounded((1272,507,1514,560),13,'#fffffff0')
text(1292,516,'✦',23,'#317354')
text(1327,516,'Your next moment awaits',14,INK,True)
text(1327,538,'Made for real connections',12,MUTED)
# quick actions
quick=[('✧','Find a game','Sports & sessions'),('○','Meet new people','Shared interests'),('›','Plan a journey','Explore Dubai smarter'),('□','Drop your bags','Travel light & free')]
qx=300
for ic,title,sub in quick:
    rounded((qx,596,qx+297,679),16,WHITE,outline='#e7ebe5')
    rounded((qx+16,615,qx+65,661),12,'#edf4e9')
    text(qx+27,621,ic if ic!='🎾' else '✧',24,'#37705a')
    text(qx+82,610,title,17,INK,True)
    text(qx+82,637,sub,13,'#98a69c')
    qx+=319
text(307,715,'Chosen for you',30,INK,True)
text(307,755,'Experiences to turn an ordinary day into something memorable.',14,MUTED)
text(1391,729,'Explore all  →',14,'#317754',True)
for i,(name,art,cat,desc,area,price) in enumerate([
('Padel & People','padel','PADEL','Sat · 7:00 PM','Dubai Marina','AED 75'),
('Badminton Open Play','badminton','BADMINTON','Sun · 10:00 AM','Al Quoz','AED 45'),
('Old Dubai Photo Walk','city','CULTURE','Mon · 8:30 AM','Al Fahidi','Free')]):
    x=300+i*424;y=794
    rounded((x,y,x+403,1037),17,WHITE,outline='#e6ede7')
    im=svgimg(art,(403,141)); c.paste(im,(x,y),im)
    d=ImageDraw.Draw(c)
    rounded((x+13,y+12,x+104,y+40),13,'#214b40')
    text(x+24,y+18,cat,12,WHITE,True)
    text(x+17,y+155,name,20,INK,True)
    text(x+17,y+190,f'{desc}    ·    {area}',13,MUTED)
    d.line((x+15,y+218,x+386,y+218),fill='#edf0eb',width=1)
    text(x+17,y+225,price,17,INK,True)
    rounded((x+290,y+219,x+388,y+247),9,'#edf3eb')
    text(x+305,y+225,'View details',12,'#23553e',True)
# output
out=Path('/mnt/data/AUNO_Interface_Concept.png')
c.save(out,optimize=True)
print(out, out.stat().st_size)
