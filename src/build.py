import re
order=['assets.js','lpc_assets.js','audio.js','data.js','story.js','engine.js','themes.js','tiles.js','lpcsprites.js','battle.js','ui.js','input.js','fbnet.js','net.js','main.js']
js='\n'.join(open(f).read() for f in order)
html=open('shell.html').read().replace('/*SCRIPTS*/',js)
open('index.html','w').write(html)
print(len(html))
