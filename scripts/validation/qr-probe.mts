import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { autoScanDocument, cleanDocument, grayToPixelImage } from '../../src/scanner/documentScan';
import { decodePageQr } from '../../src/omr/qrDecoder';
import { toGrayscale } from '../../src/omr/imageQuality';
import { isolatePaper } from '../../src/omr/pageIsolation';
import type { PixelImage } from '../../src/omr/omrTypes';
import { SCAN_LIMITS } from '../../src/scanner/imageIO';
const dir='docs/TestGorselleri';
const names=readdirSync(dir).filter(n=>/587.*\.jpg$/.test(n)).sort();
for(const n of names){
 const img=await loadImage(readFileSync(join(dir,n)));
 const s=Math.min(1,SCAN_LIMITS.longSide/Math.max(img.width,img.height));
 const w=Math.round(img.width*s),h=Math.round(img.height*s);
 const c=createCanvas(w,h);const x=c.getContext('2d');x.drawImage(img as any,0,0,w,h);
 const rgba:PixelImage={width:w,height:h,data:new Uint8ClampedArray(x.getImageData(0,0,w,h).data)};
 const raw = toGrayscale(rgba);
 const rawQr = decodePageQr(isolatePaper(raw).image) ? 'Y':'n';
 const plain = autoScanDocument(rgba,{enhance:false});
 const plainQr = decodePageQr(toGrayscale(plain.image))?'Y':'n';
 const enh = autoScanDocument(rgba);
 const enhQr = decodePageQr(toGrayscale(enh.image))?'Y':'n';
 const hi = autoScanDocument(rgba,{pixelsPerMm:8,enhance:false});
 const hiQr = decodePageQr(toGrayscale(hi.image))?'Y':'n';
 const hiE = autoScanDocument(rgba,{pixelsPerMm:8});
 const hiEQr = decodePageQr(toGrayscale(hiE.image))?'Y':'n';
 console.log(`${n}\traw=${rawQr} warp=${plainQr} warp+enh=${enhQr} warp8=${hiQr} warp8+enh=${hiEQr}`);
}
