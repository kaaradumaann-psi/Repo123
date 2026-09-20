import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { analyzePage } from '../../src/omr/analyzePage';
import { formDefinition } from '../../src/omr/formDefinition';
import type { PixelImage } from '../../src/omr/omrTypes';
import { SCAN_LIMITS } from '../../src/scanner/imageIO';
const dir='docs/TestGorselleri';
const names=readdirSync(dir).filter(n=>/\.jpe?g$/i.test(n)).sort();
for(const n of names){
 const img=await loadImage(readFileSync(join(dir,n)));
 const s=Math.min(1,SCAN_LIMITS.longSide/Math.max(img.width,img.height));
 const w=Math.round(img.width*s),h=Math.round(img.height*s);
 const c=createCanvas(w,h);const x=c.getContext('2d');x.drawImage(img as any,0,0,w,h);
 const rgba:PixelImage={width:w,height:h,data:new Uint8ClampedArray(x.getImageData(0,0,w,h).data)};
 const r=await analyzePage(rgba,formDefinition);
 if(r.ok){const m=r.items.filter(i=>i.status!=='blank').length;console.log(`${n}\t${w}x${h}\tOK p${r.pageNumber}\tmarked=${m}`);}
 else console.log(`${n}\t${w}x${h}\tFAIL ${r.code}`);
}
