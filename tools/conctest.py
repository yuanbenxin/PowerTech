# -*- coding: utf-8 -*-
"""受控并发实验：N 线程各下载 M 个文件，定位挂起条件"""
import sys
import threading
import time

sys.path.insert(0, r"d:\DevData\SmartTeach\tools")
import mirror

FILES = [
    "subjects/biology/course-data/books/s_b1.json",
    "subjects/biology/course-data/books/s_b2.json",
    "subjects/biology/course-data/books/s_x1.json",
    "subjects/biology/course-data/books/s_x2.json",
    "subjects/biology/course-data/books/s_x3.json",
    "subjects/biology/course-data/books/j7a.json",
    "subjects/biology/course-data/books/j7b.json",
    "subjects/biology/course-data/books/j8a.json",
    "subjects/biology/course-data/books/j8b.json",
    "subjects/biology/visualizations/manifest.json",
    "subjects/math/course-data/books/m1.json",
    "subjects/geography/course-data/books/g1.json",
]

N = 8
results = []
lock = threading.Lock()


def worker(idx):
    my = FILES[idx::N]
    ok = fail = 0
    for f in my:
        t = time.time()
        st, c = mirror.try_download(f)
        dt = time.time() - t
        with lock:
            results.append((idx, f, st if st is True else str(st), round(dt, 2)))
        if st is True:
            ok += 1
        else:
            fail += 1
    print(f"worker{idx}: ok={ok} fail={fail}", flush=True)


t0 = time.time()
threads = [threading.Thread(target=worker, args=(i,)) for i in range(min(N, len(FILES)))]
for t in threads:
    t.start()
for t in threads:
    t.join(timeout=120)
print(f"total {round(time.time()-t0,1)}s")
for r in sorted(results, key=lambda x: x[3], reverse=True)[:12]:
    print(r)
alive = [t.name for t in threads if t.is_alive()]
if alive:
    print("STUCK threads:", alive)
