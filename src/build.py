import base64, json, os, sys
R='/home/claude/game'; T='/home/claude/bk/node_modules/three'
ex=['build/three.min.js','examples/js/shaders/CopyShader.js','examples/js/shaders/LuminosityHighPassShader.js','examples/js/postprocessing/EffectComposer.js','examples/js/postprocessing/ShaderPass.js','examples/js/postprocessing/RenderPass.js','examples/js/postprocessing/UnrealBloomPass.js','examples/js/utils/BufferGeometryUtils.js']
three='\n'.join(open(os.path.join(T,p)).read() for p in ex)
srcs=sorted(f for f in os.listdir(R+'/src') if f.endswith('.js'))
game='\n'.join(open(R+'/src/'+f).read() for f in srcs)
def b64(p,mime): return 'data:%s;base64,'%mime+base64.b64encode(open(p,'rb').read()).decode()
data='window.IMG_LOGO=%s;window.IMG_BUILDING=%s;'%(json.dumps(b64(R+'/logo.png','image/png')),json.dumps(b64(R+'/building.jpg','image/jpeg')))
vp=R+'/voices.json'
if os.path.exists(vp): data+='window.VOICE_DATA='+open(vp).read().strip()+';'
html=open(R+'/template.html').read()
for k,v in [('/*__DATA__*/',data),('/*__THREE__*/',three),('/*__GAME__*/',game)]:
    assert '</script' not in v.lower(), k
    html=html.replace(k,v,1)
open(R+'/dist/index.html','w').write(html)
print('ok', len(html)//1024,'KB', 'voices' if os.path.exists(vp) else 'no-voices')
