"""
caracteristicas.py — transforma um pedaço de áudio em 24 números.

Esses 24 números são as "características" (features) que a IA usa
para decidir qual acorde está soando. O MESMO cálculo existe em
JavaScript (função extrairCaracteristicas em ia.js). Se os dois não
forem idênticos, o modelo treinado aqui erra no celular.

Passo a passo:
1. Janela de Hann: suaviza as bordas do pedaço de áudio (evita "estalos" na FFT).
2. FFT: separa o som em frequências (quanto de cada Hz existe).
3. Croma (12 números): soma a força de cada nota (Dó, Dó#, ... Si), qualquer oitava.
4. Croma do baixo (12 números): o mesmo, só nas frequências graves (75–260 Hz).
   Ajuda a separar acordes com as mesmas notas mas baixo diferente.
5. Normaliza cada grupo para tamanho 1 (o volume não importa, só a proporção).
"""
import numpy as np

N_JANELA = 8192          # amostras analisadas (~0,18 s)
FAIXA_CROMA = (75.0, 1100.0)
FAIXA_BAIXO = (75.0, 260.0)


def _croma(mag: np.ndarray, freqs: np.ndarray, faixa) -> np.ndarray:
    sel = (freqs >= faixa[0]) & (freqs < faixa[1])
    midi = 69 + 12 * np.log2(freqs[sel] / 440.0)
    pc = np.mod(np.round(midi).astype(int), 12)
    c = np.bincount(pc, weights=mag[sel], minlength=12)
    return c / (np.sqrt(np.sum(c * c)) + 1e-9)


def extrair(quadro: np.ndarray, sr: int) -> np.ndarray:
    """quadro: N_JANELA amostras (float). Retorna vetor de 24 números."""
    assert len(quadro) == N_JANELA
    n = np.arange(N_JANELA)
    hann = 0.5 - 0.5 * np.cos(2 * np.pi * n / (N_JANELA - 1))
    mag = np.abs(np.fft.rfft(quadro * hann))
    freqs = np.arange(len(mag)) * sr / N_JANELA
    return np.concatenate([_croma(mag, freqs, FAIXA_CROMA), _croma(mag, freqs, FAIXA_BAIXO)])
