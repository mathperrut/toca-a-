"""
treinar.py — treina a IA que reconhece acordes e exporta para o app.

Uso:
    python treinar.py                          # treino com dados sintéticos
    python treinar.py --amostras minhas.json   # + amostras gravadas no app com o SEU violão
    python treinar.py --por-acorde 600         # mais dados (mais lento, geralmente melhor)

Saída: ../modelo-acordes.json (o app carrega esse arquivo sozinho).

Conceitos de IA que aparecem aqui:
- Conjunto de TREINO e de TESTE: o modelo aprende com um e é avaliado no
  outro, que ele nunca viu. Senão seria como fazer a prova com o gabarito.
- PADRONIZAÇÃO (StandardScaler): deixa cada característica com média 0 e
  desvio 1, para nenhuma "gritar" mais que as outras.
- REDE NEURAL (MLP): camadas de "neurônios" = multiplicação de matriz +
  função ReLU. A última camada dá uma probabilidade para cada acorde.
- LINHA DE BASE: comparamos com o método antigo (moldes de acorde) para
  saber se a IA realmente melhorou alguma coisa.
"""
import argparse
import json
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

from caracteristicas import N_JANELA, extrair
from sintetizador import MIDI_CORDAS, carregar_acordes, exemplo, exemplo_nenhum

RAIZ = Path(__file__).resolve().parent.parent
TAXAS = [44100, 48000]  # celulares usam uma das duas


def _gerar_classe(tarefa):
    """Gera os exemplos de UMA classe. Roda em paralelo (um processo por núcleo)."""
    nome, frets, todos, qtd, semente = tarefa
    rng = np.random.default_rng(semente)
    X = []
    for _ in range(qtd):
        sr = TAXAS[rng.integers(2)]
        q = exemplo_nenhum(todos, sr, rng, N_JANELA) if nome == "nenhum" else exemplo(frets, todos, sr, rng, N_JANELA)
        X.append(extrair(q, sr))
    return nome, X


def gerar(acordes: dict, por_acorde: int, semente: int):
    todos = list(acordes.values())
    tarefas = [(nome, frets, todos, por_acorde, semente * 1000 + i) for i, (nome, frets) in enumerate(acordes.items())]
    tarefas.append(("nenhum", None, todos, por_acorde * 2, semente * 1000 + 999))
    # usa todos os núcleos do processador (bem mais rápido)
    with Pool() as pool:
        resultados = pool.map(_gerar_classe, tarefas)
    X = [x for _, xs in resultados for x in xs]
    y = [nome for nome, xs in resultados for _ in xs]
    return np.array(X, dtype=np.float32), np.array(y)


def metodo_antigo(X, acordes):
    """Linha de base: o reconhecimento por moldes que o app usava antes."""
    harm = [(0, 1), (12, 0.5), (19, 0.33), (24, 0.25), (28, 0.2), (31, 0.16)]
    nomes = list(acordes)
    moldes = []
    for nome in nomes:
        v = np.zeros(12)
        for i, f in enumerate(acordes[nome]):
            if f >= 0:
                for st, p in harm:
                    v[(MIDI_CORDAS[i] + f + st) % 12] += p
        v -= v.mean()
        moldes.append(v / np.linalg.norm(v))
    moldes = np.array(moldes)
    c = X[:, :12] - X[:, :12].mean(axis=1, keepdims=True)
    c /= np.linalg.norm(c, axis=1, keepdims=True) + 1e-9
    return np.array(nomes)[np.argmax(c @ moldes.T, axis=1)]


def acerto_entre_dois(modelo, scaler, X, y, classes, rng):
    """Como no jogo de Trocas: o app só precisa escolher entre 2 acordes."""
    P = modelo.predict_proba(scaler.transform(X))
    idx = {c: i for i, c in enumerate(classes)}
    acordes = [c for c in classes if c != "nenhum"]
    certos = n = 0
    for p, real in zip(P, y):
        if real == "nenhum":
            continue
        outro = real
        while outro == real:
            outro = acordes[rng.integers(len(acordes))]
        certos += p[idx[real]] > p[idx[outro]]
        n += 1
    return certos / n


def carregar_amostras(caminho):
    dados = json.loads(Path(caminho).read_text(encoding="utf-8"))
    X = np.array([a["x"] for a in dados["amostras"]], dtype=np.float32)
    y = np.array([a["acorde"] for a in dados["amostras"]])
    return X, y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--por-acorde", type=int, default=350)
    ap.add_argument("--amostras", help="JSON exportado pelo app (Ferramentas > Ensinar a IA)")
    ap.add_argument("--semente", type=int, default=7)
    ap.add_argument("--saida", default=str(RAIZ / "modelo-acordes.json"))
    args = ap.parse_args()

    acordes = carregar_acordes(RAIZ / "data.js")
    print(f"{len(acordes)} acordes lidos do data.js")

    t = time.time()
    X, y = gerar(acordes, args.por_acorde, args.semente)
    Xt, yt = gerar(acordes, max(60, args.por_acorde // 4), args.semente + 1000)  # teste: outra semente
    print(f"Dados: {len(X)} de treino, {len(Xt)} de teste ({time.time() - t:.0f} s)")

    reais_teste = None
    if args.amostras:
        Xa, ya = carregar_amostras(args.amostras)
        rng = np.random.default_rng(0)
        ordem = rng.permutation(len(Xa))
        corte = int(len(Xa) * 0.8)
        tr, te = ordem[:corte], ordem[corte:]
        # amostras reais valem mais: repetimos 10x no treino
        X = np.vstack([X] + [Xa[tr]] * 10)
        y = np.concatenate([y] + [ya[tr]] * 10)
        reais_teste = (Xa[te], ya[te])
        print(f"+ {len(Xa)} amostras do seu violão ({len(tr)} treino, {len(te)} teste)")

    scaler = StandardScaler().fit(X)
    modelo = MLPClassifier(hidden_layer_sizes=(96,), activation="relu", alpha=1e-3,
                           max_iter=400, early_stopping=True, random_state=args.semente)
    t = time.time()
    modelo.fit(scaler.transform(X), y)
    print(f"Treino: {modelo.n_iter_} épocas ({time.time() - t:.0f} s)")

    # ---------- Avaliação ----------
    pred = modelo.predict(scaler.transform(Xt))
    so_acordes = yt != "nenhum"
    acc_ia = accuracy_score(yt[so_acordes], pred[so_acordes])
    acc_antigo = accuracy_score(yt[so_acordes], metodo_antigo(Xt[so_acordes], acordes))
    acc_dois = acerto_entre_dois(modelo, scaler, Xt, yt, list(modelo.classes_), np.random.default_rng(1))
    acc_nenhum = float(np.mean(pred[~so_acordes] == "nenhum"))
    print("\n=== Resultado no conjunto de TESTE (sintético, nunca visto) ===")
    print(f"Método antigo (moldes), entre {len(acordes)} acordes: {acc_antigo:.1%}")
    print(f"IA (rede neural),       entre {len(acordes)} acordes: {acc_ia:.1%}")
    print(f"IA escolhendo entre 2 acordes (jogo de Trocas):     {acc_dois:.1%}")
    print(f"IA reconhecendo 'nenhum acorde' (ruído/nota solta): {acc_nenhum:.1%}")

    cm = confusion_matrix(yt, pred, labels=modelo.classes_)
    np.fill_diagonal(cm, 0)
    pares = sorted(((cm[i, j], modelo.classes_[i], modelo.classes_[j]) for i in range(len(cm)) for j in range(len(cm)) if cm[i, j]), reverse=True)[:6]
    if pares:
        print("Confusões mais comuns (real -> previsto):", ", ".join(f"{a}->{b} ({n})" for n, a, b in pares))

    metricas = {"acerto_ia": round(acc_ia, 4), "acerto_metodo_antigo": round(acc_antigo, 4),
                "acerto_entre_dois": round(acc_dois, 4), "acerto_nenhum": round(acc_nenhum, 4)}
    if reais_teste is not None and len(reais_teste[0]):
        acc_real = accuracy_score(reais_teste[1], modelo.predict(scaler.transform(reais_teste[0])))
        metricas["acerto_amostras_reais"] = round(acc_real, 4)
        print(f"IA nas SUAS amostras de teste:                       {acc_real:.1%}")

    # ---------- Exportar para o app (JSON) ----------
    r = lambda a: np.round(np.asarray(a, dtype=float), 5).tolist()
    saida = {
        "versao": 1,
        "gerado_em": time.strftime("%Y-%m-%d %H:%M"),
        "caracteristicas": {"n_janela": N_JANELA, "faixa_croma": [75, 1100], "faixa_baixo": [75, 260]},
        "classes": list(modelo.classes_),
        "media": r(scaler.mean_),
        "desvio": r(scaler.scale_),
        # coefs_[i] tem formato (entradas, saídas): o app faz x · W + b
        "camadas": [{"W": r(W), "b": r(b)} for W, b in zip(modelo.coefs_, modelo.intercepts_)],
        "metricas": metricas,
    }
    texto = json.dumps(saida, separators=(",", ":"))
    Path(args.saida).write_text(texto, encoding="utf-8")
    # cópia em .js: funciona até abrindo o index.html direto (file://), onde fetch() é bloqueado
    Path(args.saida).with_suffix(".js").write_text("window.MODELO_ACORDES = " + texto + ";\n", encoding="utf-8")
    print(f"\nModelo salvo em {args.saida} ({Path(args.saida).stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
