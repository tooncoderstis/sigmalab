#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo "==> Menjalankan prisma migrate deploy"
  node ./node_modules/prisma/build/index.js migrate deploy
fi

exec "$@"
