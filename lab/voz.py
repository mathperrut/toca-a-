# Narração dos mini vídeos com a voz pt_BR "faber" do Piper (TTS neural que roda offline).
import json, os, wave, urllib.request, sys, time
base = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/'
for f in ['pt_BR-faber-medium.onnx', 'pt_BR-faber-medium.onnx.json']:
    if not os.path.exists(f):
        urllib.request.urlretrieve(base + f, f)
print('voz baixada', os.path.getsize('pt_BR-faber-medium.onnx'))
from piper import PiperVoice
voz = PiperVoice.load('pt_BR-faber-medium.onnx')
try:
    from piper import SynthesisConfig
    cfg = SynthesisConfig(length_scale=1.08, noise_scale=0.6, noise_w_scale=0.7)
except Exception:
    cfg = None
rot = json.load(open('roteiros.json'))
os.makedirs('saida/voz', exist_ok=True)
n = 0
for vid, cenas in rot.items():
    for i, c in enumerate(cenas):
        out = f'saida/voz/{vid}-{i}.wav'
        with wave.open(out, 'wb') as wf:
            if hasattr(voz, 'synthesize_wav'):
                voz.synthesize_wav(c['fala'], wf, syn_config=cfg) if cfg else voz.synthesize_wav(c['fala'], wf)
            else:
                voz.synthesize(c['fala'], wf, length_scale=1.08)
        with wave.open(out) as wf:
            print(out, round(wf.getnframes() / wf.getframerate(), 2), 's')
        n += 1
print('FIM', n, 'falas')
