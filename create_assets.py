from pathlib import Path
out=Path(__file__).parent/'static'/'assets'
out.mkdir(exist_ok=True)
base='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 620" role="img" aria-label="{title}"><defs>
<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{top}"/><stop offset="1" stop-color="{bottom}"/></linearGradient>
<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop stop-color="{ground1}"/><stop offset="1" stop-color="{ground2}"/></linearGradient>
<filter id="blur"><feGaussianBlur stdDeviation="24"/></filter>
<pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="white" opacity=".11"/></pattern></defs>
<rect width="960" height="620" fill="url(#sky)"/><rect width="960" height="620" fill="url(#dots)"/>
<circle cx="790" cy="100" r="154" fill="{glow}" opacity=".28" filter="url(#blur)"/>
{content}
</svg>'''

skyline='''<circle cx="737" cy="145" r="70" fill="#f8d9a6" opacity=".87"/><path d="M0 475 Q200 460 420 483 T960 464 V620H0Z" fill="{water}"/><path d="M0 505 Q240 493 520 519 T960 495" stroke="white" stroke-width="4" opacity=".25" fill="none"/>
<g fill="#233e48" opacity=".9"><rect x="70" y="290" width="98" height="198" rx="3"/><rect x="185" y="258" width="104" height="235" rx="3"/><rect x="301" y="330" width="76" height="169" rx="3"/><rect x="568" y="300" width="94" height="195" rx="3"/><rect x="683" y="267" width="88" height="220" rx="3"/><rect x="790" y="333" width="102" height="169" rx="3"/></g>
<path d="M433 485V210L448 193V142L466 121L482 58L497 121L516 143V196L529 210V486Z" fill="#153b43"/><path d="M479 60 V485" stroke="#c1d2c4" stroke-width="4" opacity=".35"/>
<g stroke="#b6cbd1" stroke-width="3" opacity=".32"><path d="M85 320h68M85 354h68M85 388h68M201 284h70M201 316h70M201 348h70M584 325h62M584 358h62M697 295h62M697 338h62M811 357h65M811 386h65"/></g><path d="M0 526 Q260 504 490 534 T960 509" stroke="{light}" stroke-width="3" fill="none" opacity=".7"/>'''
padel='''<rect x="0" y="348" width="960" height="272" fill="url(#ground)"/><path d="M0 452 L960 375 M0 556 L960 432 M0 620 L960 500" stroke="#e7f5e7" stroke-width="4" opacity=".68"/><path d="M175 348L0 620M444 348L252 620M705 348L645 620" stroke="#e7f5e7" stroke-width="3" opacity=".7"/><path d="M0 350H960" stroke="#ffffff" stroke-width="9" opacity=".6"/><g opacity=".9" stroke="#183a36" stroke-width="8"><path d="M65 240V490M300 235V420M650 235V420M905 240V495"/></g><path d="M70 310 Q480 300 900 310" stroke="#244a42" stroke-width="8"/><path d="M70 317 Q480 304 900 317" stroke="white" stroke-width="2" opacity=".5" stroke-dasharray="10 15"/><circle cx="779" cy="175" r="52" fill="#e8ef9a"/><ellipse cx="270" cy="418" rx="37" ry="70" fill="#1f4740"/><circle cx="270" cy="326" r="28" fill="#d5a17a"/><path d="M257 372L340 410" stroke="#1f4740" stroke-width="26" stroke-linecap="round"/><ellipse cx="358" cy="417" rx="22" ry="32" stroke="#e7f2e2" fill="none" stroke-width="9" transform="rotate(-30 358 417)"/><ellipse cx="600" cy="410" rx="32" ry="68" fill="#f8e5cf"/><circle cx="600" cy="320" r="27" fill="#9c684e"/><path d="M589 365L541 405" stroke="#f8e5cf" stroke-width="23" stroke-linecap="round"/>'''
badminton='''<rect x="0" y="330" width="960" height="290" fill="url(#ground)"/><path d="M0 470L960 470 M0 590L960 590 M220 330L135 620 M750 330L820 620 M475 330V620" stroke="#f6eee2" stroke-width="6" opacity=".9"/><path d="M0 390H960" stroke="#f6eee2" stroke-width="5"/><path d="M0 385H960" stroke="#214a47" stroke-width="14" opacity=".6"/><g stroke="#d7e4d0" stroke-width="2" opacity=".6"><path d="M0 365H960M0 375H960M0 385H960M0 395H960M0 405H960"/></g><circle cx="270" cy="300" r="30" fill="#d3a67c"/><path d="M250 337L227 454L309 454L284 337Z" fill="#245654"/><path d="M260 361L344 313" stroke="#d3a67c" stroke-width="20" stroke-linecap="round"/><ellipse cx="371" cy="292" rx="20" ry="35" fill="none" stroke="#f7f0de" stroke-width="8" transform="rotate(25 371 292)"/><circle cx="695" cy="290" r="27" fill="#af795d"/><path d="M674 329L657 448L728 448L717 329Z" fill="#e0d8bd"/><path d="M687 354L621 305" stroke="#af795d" stroke-width="17" stroke-linecap="round"/><g fill="#ffefdc"><path d="M491 193l16 55h-32Z"/><circle cx="491" cy="190" r="12"/></g>'''
food='''<rect x="0" y="365" width="960" height="255" fill="url(#ground)"/><rect x="0" y="170" width="960" height="23" fill="#ffffff" opacity=".25"/><rect x="100" y="125" width="220" height="235" rx="80" fill="#f4d9b8" opacity=".25"/><rect x="600" y="125" width="240" height="235" rx="80" fill="#f4d9b8" opacity=".26"/><ellipse cx="480" cy="483" rx="375" ry="125" fill="#5d4233"/><ellipse cx="480" cy="465" rx="345" ry="104" fill="#d7ac83"/><ellipse cx="480" cy="463" rx="305" ry="78" fill="#efe3cf"/><g><circle cx="310" cy="463" r="70" fill="#fbf2df"/><circle cx="310" cy="463" r="53" fill="#ec8d60"/><path d="M283 449q30-41 56 0t-56 0" fill="#668c52"/><circle cx="525" cy="456" r="75" fill="#f6e9d8"/><circle cx="525" cy="456" r="55" fill="#7d9867"/><path d="M495 444q25-50 70 0" stroke="#efb54e" stroke-width="12" fill="none"/><circle cx="713" cy="457" r="55" fill="#f7eee0"/><circle cx="713" cy="457" r="39" fill="#ad6b4d"/></g><g fill="#e6f0ce"><rect x="418" y="310" width="18" height="105" rx="8"/><rect x="730" y="315" width="18" height="100" rx="8"/></g><g fill="#f9dcb0"><path d="M398 308q20-60 55 0Z"/><path d="M708 315q30-60 63 0Z"/></g>'''
desert='''<circle cx="780" cy="190" r="103" fill="#ffedca" opacity=".82"/><path d="M0 415 Q210 290 465 395 T960 360V620H0Z" fill="#e6a47c"/><path d="M0 490 Q250 340 490 468 T960 390V620H0Z" fill="#c77e61"/><path d="M0 550 Q180 439 385 510 T960 467V620H0Z" fill="url(#ground)"/><path d="M700 440 l-45-100 17 4 25 65 20-73 17 7-20 102" stroke="#624535" stroke-width="9" fill="none"/><path d="M110 515q58-28 115 0" stroke="#f3c9a0" stroke-width="5" fill="none"/>'''
city=skyline.replace('{water}','#40777a').replace('{light}','#f4d5a2')
marina=skyline.replace('{water}','#276d80').replace('{light}','#def7fb')
downtown=skyline.replace('{water}','#d0ae85').replace('{light}','#ffffff')
beach='''<circle cx="775" cy="155" r="100" fill="#fff0c7"/><path d="M0 346Q330 325 960 366V620H0Z" fill="#93bdbe"/><path d="M0 438Q310 401 960 427V620H0Z" fill="#418c9a"/><path d="M0 525Q250 510 470 533T960 516V620H0Z" fill="url(#ground)"/><path d="M0 526Q270 503 550 536T960 520" fill="none" stroke="#fef8df" stroke-width="13" opacity=".9"/><path d="M197 490V320" stroke="#553f37" stroke-width="12"/><path d="M197 323L70 355Q124 260 198 265Q272 260 321 358Z" fill="#f4a981"/>'''
styles={
'city':('Dubai skyline','#9cd0d4','#efccb6','#174d4c','#143f48','#ffd08d',city),
'marina':('Dubai marina','#83c3d9','#cce8cd','#2e7a7f','#184b62','#ffca81',marina),
'downtown':('Dubai skyline warm','#e3c5a2','#e9d9bc','#d4b69b','#99765f','#ffe5ba',downtown),
'padel':('Padel social','#99d4b6','#cfe6ba','#3e9081','#1b6257','#f5f6b5',padel),
'badminton':('Badminton court','#8da8b0','#d9c8bb','#357369','#24544d','#e3f6cd',badminton),
'food':('Social dinner','#b0b9a3','#f0beaa','#b38d72','#73513f','#ffdeb0',food),
'desert':('Dubai desert','#e7ad94','#f2d4a9','#edc19d','#b66751','#ffdfb4',desert),
'beach':('Dubai beach','#85bdd4','#f8d9bc','#e1bf9a','#bf936e','#fff0c3',beach),
}
for key,(title,top,bottom,g1,g2,glow,content) in styles.items():
    (out/f'{key}.svg').write_text(base.format(title=title,top=top,bottom=bottom,ground1=g1,ground2=g2,glow=glow,content=content),encoding='utf-8')
print('Generated',len(styles),'offline SVG assets')
