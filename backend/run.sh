#!/bin/bash

# .env があれば環境変数として読み込む
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

npx deno run --allow-net --allow-read --allow-write --allow-env --unsafely-ignore-certificate-errors server.ts > log.txt
