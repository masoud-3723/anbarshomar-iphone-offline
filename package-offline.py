"""Build a coherent offline release without external runtime dependencies."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
dist=root/'dist'
vendor=(dist/'exceljs.min.js').read_text()
worker="// ANBAR_OFFLINE_EXCEL_3_1\n(function(){const exports=undefined,module=undefined,define=undefined;\n"+vendor+"\n}).call(self);\n"+(root/'excel-worker-source.js').read_text()
(dist/'excel-worker.js').write_text(worker)
names=['index.html','style.css','app.js','offline-excel.js','inventory-index.js','excel-worker.js','file-save.js','font.ttf','offline-setup.js','manifest.webmanifest','icon-180.png','icon-512.png']
manifest={'version':'3.1','assets':[{'path':name,'sha256':hashlib.sha256((dist/name).read_bytes()).hexdigest()} for name in names]}
data=(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n').encode()
(dist/'offline-assets.json').write_bytes(data)
script=(root/'sw-template.js').read_text().replace('__MANIFEST_SHA__',hashlib.sha256(data).hexdigest()).replace('__ASSET_NAMES__',json.dumps(names))
(dist/'sw.js').write_text(script)
print('Offline release:',len(names),'verified assets')
