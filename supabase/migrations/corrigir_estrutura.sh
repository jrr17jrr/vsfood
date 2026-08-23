#!/usr/bin/env bash
set -e
rm -rf supabase/migrations/app        supabase/migrations/components        supabase/migrations/lib        supabase/migrations/sql
rm -f supabase/migrations/next.config.ts       supabase/migrations/README.txt
echo "Estrutura corrigida. Rode: npm run build"
