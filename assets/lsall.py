#!/usr/bin/env python3
import sys
import os
from os import path
from collections import deque

dir = ""
if len(sys.argv) >= 2:
    dir = sys.argv[1]
level = ""
if len(sys.argv) >= 3:
    level = sys.argv[2]

reslen = ""
if len(sys.argv) >= 4:
    reslen = int(sys.argv[3])

query = ""
if len(sys.argv) >= 5:
    query = sys.argv[4]
    query = query.split(',')

if not level:
    level = 5
else:
    level = int(level)

if not dir:
    dir = "."

if not reslen:
    reslen = 20

abs_dir = path.realpath(dir)

res = []
queue = deque([(abs_dir, 0)])


while len(queue) > 0 and len(res) < reslen:
    head = queue.pop()
    p = head[0]
    try:
        dirs = os.listdir(p)
    except:
        continue
    l = head[1]
    if l >= level:
        continue
    for d in dirs:
        if d.startswith("."):
            continue
        try:
            full_path = path.join(p, d)
            if path.isfile(full_path):
                continue
        except:
            continue

        relative_path = full_path[len(abs_dir)+1:]

        if query:
            for q in query:
                if q not in relative_path:
                    break
            else:
                res.append(relative_path)
                if len(res) >= reslen:
                    break
            queue.append([full_path, l + 1])
        else:
            res.append(relative_path)
            if len(res) >= reslen:
                break
            queue.append([full_path, l + 1])

print(abs_dir)
for r in res:
    print(r)
