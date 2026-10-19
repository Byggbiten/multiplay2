# Genererar js/geografi-data.js ur referens/ (källan). Kör från repots rot: python3 -I referens/sverige-landskap/gen-geografi-data.py "$PWD"
import json, sys, os
repo = sys.argv[1]
lax = json.load(open(os.path.join(repo, 'referens/landskap-laxbok.json'), encoding='utf-8'))
fak = json.load(open(os.path.join(repo, 'referens/sverige-landskap/landskap-fakta.json'), encoding='utf-8'))['landskap']
bil = json.load(open(os.path.join(repo, 'referens/sverige-landskap/bilder.json'), encoding='utf-8'))['filer']
L = []
for l in lax:
    f = fak[str(l['nr'])]
    assert f['namn'] == l['namn'] and f['landsdel'] == l['landsdel']
    stad = [f['storsta_stad']['namn']] + ([f['ocksa_stor_stad']['namn']] if f['ocksa_stor_stad'] else [])
    L.append({ 'nr':l['nr'], 'namn':l['namn'], 'landsdel':l['landsdel'], 'path':l['path'], 'stad':stad,
               'blomma':f['blomma'], 'djur':f['djur'], 'yta_rang':f['yta_rang'], 'invanare_rang':f['invanare_rang'],
               'visste':[v['text'] for v in f['visste_du']], 'bilder':f['bilder'] })
B = [{ 'fil':b['fil'], 'nr':b['nr'], 'landskap':b['landskap'], 'typ':b['typ'], 'upphov':b['upphov'], 'licens':b['licens'], 'kallsida':b['kallsida'] } for b in bil]
for b in B: assert os.path.exists(os.path.join(repo, 'assets/geografi/sverige', b['fil'])), b['fil']
for l in L:
    for k, v in l['bilder'].items(): assert os.path.exists(os.path.join(repo, 'assets/geografi/sverige', v)), v
out = '''/* ============================================================
   MULTIPLAY – Geografi: data för Sveriges landskap (window.GEO_DATA)
   GENERERAD – redigera inte för hand. Källan är:
     referens/landskap-laxbok.json            (ordningen norr till söder, landsdel, path-index i kartan)
     referens/sverige-landskap/landskap-fakta.json  (städer, blomma, djur, rang, "Visste du?", källor per fält)
     referens/sverige-landskap/bilder.json    (upphovsperson och licens per bild)
   Bilderna och kartan ligger i assets/geografi/sverige/. tests/geografi.test.mjs kontrollerar att
   den här filen stämmer med källan. Numren (nr) används bara internt (D33).
   ============================================================ */
'use strict';
(function () {
  const GEO_DATA = ''' + json.dumps({ 'landskap':L, 'bilder':B }, ensure_ascii=False, indent=1) + ''';
  if (typeof window !== 'undefined') window.GEO_DATA = GEO_DATA;
  if (typeof module !== 'undefined' && module.exports) module.exports = GEO_DATA;
})();
'''
open(os.path.join(repo, 'js/geografi-data.js'), 'w', encoding='utf-8').write(out)
print('ok', len(L), len(B))
