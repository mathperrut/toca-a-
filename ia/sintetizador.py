"""
sintetizador.py — um "violão de mentira" para gerar dados de treino.

Para treinar uma IA você precisa de MUITOS exemplos com a resposta certa
(acorde + áudio). Gravar milhares de batidas à mão é inviável, então
sintetizamos com o algoritmo Karplus-Strong e colocamos variações
"realistas": afinação imperfeita, cordas abafadas, batida para cima ou
para baixo, ruído de fundo, acorde anterior ainda soando...

Isso se chama AUMENTO DE DADOS (data augmentation). Quanto mais variado
o treino, melhor a IA lida com o mundo real.
"""
import re
from pathlib import Path

import numpy as np
from scipy.signal import lfilter

MIDI_CORDAS = [40, 45, 50, 55, 59, 64]  # E2 A2 D3 G3 B3 E4


def carregar_acordes(caminho_data_js: Path) -> dict:
    """Lê os acordes direto do data.js do app: uma única fonte da verdade."""
    texto = Path(caminho_data_js).read_text(encoding="utf-8")
    acordes = {}
    for m in re.finditer(r"\{\s*id:\s*'([^']+)',\s*frets:\s*\[([^\]]+)\]", texto):
        acordes[m.group(1)] = [int(x) for x in m.group(2).split(",")]
    return acordes


def midi_para_hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def corda(freq: float, dur: float, sr: int, rng: np.random.Generator) -> np.ndarray:
    """Uma corda tocada (Karplus-Strong vetorizado com lfilter)."""
    total = int(dur * sr)
    N = max(2, int(round(sr / freq - 0.5)))      # o filtro de média soma meio período
    exc = rng.uniform(-1, 1, N)
    brilho = rng.uniform(0.15, 0.8)               # 0 = som escuro (dedo), 1 = brilhante (palheta)
    exc = lfilter([brilho], [1, -(1 - brilho)], exc)
    beta = rng.uniform(0.08, 0.3)                 # posição da mão direita na corda
    P = max(1, int(N * beta))
    exc = exc - np.concatenate([np.zeros(P), exc[:-P]])
    x = np.zeros(total)
    x[:N] = exc
    perda = rng.uniform(0.990, 0.998)
    a = np.zeros(N + 2)
    a[0] = 1
    a[N] = -perda / 2
    a[N + 1] = -perda / 2
    return lfilter([1.0], a, x)


def batida(frets, sr, dur, rng, desafinacao_global=0.0):
    """Um golpe de mão direita num acorde. Retorna áudio."""
    tocadas = [i for i, f in enumerate(frets) if f >= 0]
    # às vezes uma corda fica abafada sem querer
    if len(tocadas) > 3:
        tocadas = [i for i in tocadas if rng.random() > 0.06] or tocadas
    para_cima = rng.random() < 0.3
    if para_cima:
        tocadas = tocadas[::-1]
        if rng.random() < 0.5 and len(tocadas) > 4:
            tocadas = tocadas[: rng.integers(3, len(tocadas))]  # batida pra cima pega só as finas
    espaco = rng.uniform(0.003, 0.035)
    out = np.zeros(int(dur * sr))
    for k, i in enumerate(tocadas):
        cents = desafinacao_global + rng.normal(0, 6)
        f = midi_para_hz(MIDI_CORDAS[i] + frets[i] + cents / 100)
        s = corda(f, dur, sr, rng) * rng.uniform(0.5, 1.0)
        off = int(k * espaco * sr)
        out[off:] += s[: len(out) - off]
    return out


def ruido_rosa(n, rng):
    """Ruído 'de ambiente' (mais grave que o ruído branco)."""
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return lfilter(b, a, rng.normal(0, 1, n))


def corpo(sinal, sr, rng):
    """Ressonância do corpo do violão: realça uma região grave aleatória."""
    from scipy.signal import iirpeak
    f0 = rng.uniform(85, 260)
    b, a = iirpeak(f0, Q=rng.uniform(1.5, 5), fs=sr)
    return sinal + rng.uniform(0.2, 0.8) * lfilter(b, a, sinal)


def exemplo(frets, todos, sr, rng, n_janela=8192):
    """Gera um quadro de n_janela amostras de um acorde, com variações."""
    inicio = rng.uniform(0.03, 0.45)              # quanto tempo depois da batida o app "olha"
    dur = inicio + n_janela / sr + 0.02
    x = batida(frets, sr, dur, rng, desafinacao_global=rng.normal(0, 8))
    if rng.random() < 0.3:                        # acorde anterior ainda soando
        outro = todos[rng.integers(len(todos))]
        cauda = batida(outro, sr, dur + 0.8, rng)[int(0.8 * sr):]
        x += cauda[: len(x)] * rng.uniform(0.05, 0.3)
    x = corpo(x, sr, rng)
    i0 = int(inicio * sr)
    q = x[i0 : i0 + n_janela]
    q = q / (np.std(q) + 1e-9)
    snr_db = rng.uniform(4, 35)
    ruido = ruido_rosa(n_janela, rng)
    q = q + ruido / (np.std(ruido) + 1e-9) * 10 ** (-snr_db / 20)
    return q


def exemplo_nenhum(todos, sr, rng, n_janela=8192):
    """Classe 'nenhum': ruído, nota solta, duas notas, fala/zumbido."""
    tipo = rng.integers(4)
    dur = 0.3 + n_janela / sr
    if tipo == 0:
        q = ruido_rosa(int(dur * sr), rng) if rng.random() < 0.5 else rng.normal(0, 1, int(dur * sr))
    elif tipo in (1, 2):
        q = np.zeros(int(dur * sr))
        for _ in range(tipo):
            m = rng.integers(40, 76)
            q += corda(midi_para_hz(m), dur, sr, rng)
    else:  # zumbido / voz grosseira: tom com vibrato + ruído
        t = np.arange(int(dur * sr)) / sr
        f = rng.uniform(90, 300) * (1 + 0.02 * np.sin(2 * np.pi * 5 * t))
        q = np.sin(2 * np.pi * np.cumsum(f) / sr) + 0.3 * rng.normal(0, 1, len(t))
    i0 = rng.integers(0, len(q) - n_janela)
    q = q[i0 : i0 + n_janela]
    q = q / (np.std(q) + 1e-9)
    return q + rng.normal(0, 1, n_janela) * 10 ** (-rng.uniform(10, 40) / 20)
