# -*- coding: utf-8 -*-
"""按模块可用性重排 数学/地理/语文 三科 course-data 卡片顺序。

目标：app 内"有资源(可演示)"的卡优先靠前排列，占位卡靠后，让用户先看到能真正演示的内容。

判定"可演示"（各科口径不同）：
- 数学：有真实的独立 scene.js 实现才算可演示。源站脚手架 status 不可信（大量 source-html-adapter
  卡被标为 ready，但本地无 source.html，实际必然报错）。判定：scene.config.json 的 entry 指向
  本卡 scene.js（非共享引擎），且 scene.js 存在、不含 GENERATED_PLACEHOLDER_CARD 占位标记、
  不含"占位卡片载入失败"代理文案。
- 地理：卡片目录内存在 source.html 视为可演示（地理仅 source-html-adapter 引擎，无 source.html 即 404）
- 语文：course-data 卡片 status == 'ready' 且含 courseware.entry（指向 index.html 课件）视为可演示

幂等：仅对 currentCardMapping 稳定排序后回写，可重复运行。
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, 'mirror', 'subjects')


def card_dir(subject, book_id, card_id):
    return os.path.join(BASE, subject, 'visualizations', 'books', book_id, str(card_id))


def is_ready(subject, book_id, card):
    cid = card.get('cardId', '')
    base = card_dir(subject, book_id, cid)
    if subject == 'geography':
        # 地理仅 source-html-adapter 引擎：目录内必须真有 source.html 才能演示
        return os.path.isfile(os.path.join(base, 'source.html'))
    if subject == 'chinese':
        # 语文：status ready 且 courseware.entry 指向 index.html 才算可演示
        if card.get('status') != 'ready':
            return False
        cw = card.get('courseware') or {}
        entry = cw.get('entry') or ''
        return bool(entry)
    # math：真实独立 scene.js 才算可演示（status 字段不可信）
    cfg_path = os.path.join(base, 'scene.config.json')
    if not os.path.isfile(cfg_path):
        return False
    try:
        with open(cfg_path, encoding='utf-8') as f:
            cfg = json.load(f)
    except Exception:
        return False
    entry = cfg.get('entry') or ''
    if 'source-html-adapter' in entry:
        # 共享引擎需要 source.html，本地全缺 → 必然报错，视为占位
        return False
    scene_path = os.path.join(base, 'scene.js')
    if not os.path.isfile(scene_path):
        return False
    with open(scene_path, 'rb') as f:
        raw = f.read()
    if b'GENERATED_PLACEHOLDER_CARD' in raw:
        return False
    if b'\xe5\x8d\xa0\xe4\xbd\x8d\xe5\x8d\xa1\xe7\x89\x87\xe8\xbd\xbd\xe5\x85\xa5\xe5\xa4\xb1\xe8\xb4\xa5' in raw:
        # "占位卡片载入失败" 代理文案
        return False
    return True


def detect_newline(path):
    with open(path, 'rb') as f:
        raw = f.read(8192)
    return '\r\n' if b'\r\n' in raw else '\n'


def process_subject(subject):
    books_dir = os.path.join(BASE, subject, 'course-data', 'books')
    if not os.path.isdir(books_dir):
        return []
    stats = []
    for fn in sorted(os.listdir(books_dir)):
        if not fn.endswith('.json'):
            continue
        path = os.path.join(books_dir, fn)
        with open(path, encoding='utf-8') as f:
            data = json.load(f)
        mapping = data.get('currentCardMapping')
        if not isinstance(mapping, list) or not mapping:
            continue
        book_id = os.path.splitext(fn)[0]
        ready = [c for c in mapping if is_ready(subject, book_id, c)]
        pending = [c for c in mapping if not is_ready(subject, book_id, c)]
        data['currentCardMapping'] = ready + pending
        newline = detect_newline(path)
        with open(path, 'w', encoding='utf-8', newline=newline) as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
        stats.append((book_id, len(ready), len(pending), len(mapping)))
    return stats


def main():
    for subject in ('math', 'geography', 'chinese'):
        stats = process_subject(subject)
        if not stats:
            print('[%s] 无 course-data/books，跳过' % subject)
            continue
        print('[%s]' % subject)
        for book_id, r, p, total in stats:
            print('  %-10s 可演示 %2d / 占位 %2d / 合计 %2d' % (book_id, r, p, total))
        print('  --- 合计: 可演示 %d / 占位 %d' % (
            sum(x[1] for x in stats), sum(x[2] for x in stats)))
    print('完成。')


if __name__ == '__main__':
    main()
