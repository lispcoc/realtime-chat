#!/bin/bash
npx deno run --allow-net --allow-read --allow-write --unsafely-ignore-certificate-errors server.ts > log.txt
