from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
out=Path('/mnt/data')
ignore={'__pycache__','.pytest_cache','.DS_Store','.git','.venv'}
patch=[
 'docs/app.js','docs/index.html','docs/suite.js','docs/suite.css','docs/sw.js',
 'static/app.js','static/index.html','static/suite.js','static/suite.css',
 'supabase/migrations/202611060002_experience_suite.sql',
 'tests/test_v3_ui.py','scripts/verify-static.mjs',
 'README.md','EXPERIENCE_SUITE.md','BRAND_SYSTEM.md','RELEASE_NOTES_V3.md'
]

def add(z,src,dest):
 if any(p in ignore for p in src.relative_to(root).parts): return
 z.write(src,dest)

with zipfile.ZipFile(out/'AUNO_3.0_Complete_Source.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file() and not any(part in ignore for part in p.relative_to(root).parts):
   add(z,p,p.relative_to(root).as_posix())
with zipfile.ZipFile(out/'AUNO_3.0_Upgrade_Patch.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as z:
 for path in patch:
  f=root/path
  assert f.is_file(),path
  add(z,f,path)
with zipfile.ZipFile(out/'AUNO_3.0_Static_Website.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=8) as z:
 for p in sorted((root/'docs').rglob('*')):
  if p.is_file(): z.write(p,p.relative_to(root/'docs').as_posix())
for name in ['AUNO_3.0_Complete_Source.zip','AUNO_3.0_Upgrade_Patch.zip','AUNO_3.0_Static_Website.zip']:
 p=out/name
 with zipfile.ZipFile(p) as z:
  bad=z.testzip()
  assert bad is None,bad
  print(name, f'{len(z.namelist())} files',f'{p.stat().st_size/1024:.0f}KB')
