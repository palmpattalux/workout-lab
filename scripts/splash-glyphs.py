"""Builds the letter outlines used by the opening screen (index.html) and the desktop loading ring.

The whirlpool letters change shape from Anton (the swirl font) into Montserrat Bold (the ring font)
as they come in. To morph one outline into the other, every contour of both fonts is resampled to the
same number of points and lined up, so any mix between them is a clean letter.

Run (needs `pip install fonttools`):
  curl -o /tmp/anton.ttf https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm0K0.ttf
  curl -o /tmp/mont.ttf  https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf
  python3 scripts/splash-glyphs.py /tmp/anton.ttf /tmp/mont.ttf
It writes src/splash/glyphs.json and pastes the same data into index.html between the GLYPHS markers.
"""
import json, math, re, sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen

LETTERS = 'DOTSE'

def outlines(path):
    f = TTFont(path)
    gs = f.getGlyphSet(location={'wght': 700}) if 'fvar' in f else f.getGlyphSet()
    cmap = f.getBestCmap()
    def quad(p0, p1, p2, n=6):
        return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in [i/n for i in range(1, n+1)]]
    def cubic(p0, p1, p2, p3, n=8):
        return [tuple((1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d for a, b, c, d in zip(p0, p1, p2, p3)) for t in [i/n for i in range(1, n+1)]]
    out = {'upm': f['head'].unitsPerEm, 'capH': f['OS/2'].sCapHeight, 'space': gs[cmap[32]].width, 'g': {}}
    for ch in LETTERS:
        g = gs[cmap[ord(ch)]]; pen = RecordingPen(); g.draw(pen); contours = []; cur = []
        for op, args in pen.value:
            if op == 'moveTo': cur = [args[0]]
            elif op == 'lineTo': cur.append(args[0])
            elif op == 'qCurveTo':
                pts = list(args); p0 = cur[-1]; offs = pts[:-1]; end = pts[-1]
                for i, o in enumerate(offs):
                    nxt = end if i == len(offs) - 1 else ((o[0]+offs[i+1][0])/2, (o[1]+offs[i+1][1])/2)
                    cur += quad(p0, o, nxt); p0 = nxt
            elif op == 'curveTo': cur += cubic(cur[-1], *args)
            elif op in ('closePath', 'endPath'): contours.append(cur); cur = []
        out['g'][ch] = {'adv': g.width, 'c': contours}
    return out

def area(p): return sum(p[i][0]*p[(i+1) % len(p)][1]-p[(i+1) % len(p)][0]*p[i][1] for i in range(len(p)))/2
def resample(p, n):
    seg = [math.dist(p[i], p[(i+1) % len(p)]) for i in range(len(p))]; tot = sum(seg); out = []; i = 0; acc = 0
    for k in range(n):
        d = k*tot/n
        while acc + seg[i] < d: acc += seg[i]; i += 1
        t = (d-acc)/seg[i] if seg[i] else 0; a = p[i]; b = p[(i+1) % len(p)]
        out.append((a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t))
    return out
def bbox(cs):
    xs = [x for c in cs for x, _ in c]; ys = [y for c in cs for _, y in c]
    return min(xs), min(ys), max(xs)-min(xs), max(ys)-min(ys)

def main(anton_path, mont_path):
    A = outlines(anton_path); M = outlines(mont_path)
    # Montserrat's E is drawn as two overlapping shapes; use the merged outline so it pairs with Anton's one
    M['g']['E']['c'] = [[(83, 0), (83, 700), (612, 700), (612, 570), (244, 570), (244, 418), (569, 418), (569, 292), (244, 292), (244, 130), (625, 130), (625, 0)]]
    out = {'upmA': A['upm'], 'upmM': M['upm'], 'spaceA': A['space'], 'spaceM': M['space'], 'capA': A['capH'], 'g': {}}
    for ch in LETTERS:
        ca = sorted(A['g'][ch]['c'], key=lambda p: -abs(area(p))); cm = sorted(M['g'][ch]['c'], key=lambda p: -abs(area(p)))
        assert len(ca) == len(cm), ch
        ba, bm = bbox(ca), bbox(cm); pairs = []
        for k, (pa, pm) in enumerate(zip(ca, cm)):
            n = 200 if k == 0 else 120
            ra, rm = resample(pa, n), resample(pm, n)
            na = [((x-ba[0])/ba[2], (y-ba[1])/ba[3]) for x, y in ra]; nm = [((x-bm[0])/bm[2], (y-bm[1])/bm[3]) for x, y in rm]
            best = min(range(n), key=lambda s: sum((na[i][0]-nm[(i+s) % n][0])**2+(na[i][1]-nm[(i+s) % n][1])**2 for i in range(n)))
            rm = rm[best:] + rm[:best]
            pairs.append({'a': [round(v, 1) for p in ra for v in p], 'm': [round(v, 1) for p in rm for v in p]})
        out['g'][ch] = {'advA': A['g'][ch]['adv'], 'advM': M['g'][ch]['adv'], 'c': pairs}
    data = json.dumps(out, separators=(',', ':'))
    open('src/splash/glyphs.json', 'w').write(data + '\n')
    html = open('index.html').read()
    html, n = re.subn(r'/\*GLYPHS\*/.*?/\*END GLYPHS\*/', lambda _: '/*GLYPHS*/' + data + '/*END GLYPHS*/', html, flags=re.S)
    assert n == 1, 'GLYPHS markers not found in index.html'
    open('index.html', 'w').write(html)
    print('glyphs:', len(data), 'bytes')

if __name__ == '__main__':
    main(*sys.argv[1:3])
