@echo off
echo Corrigindo estrutura do VSFood...

if exist "supabase\migrations\app" rmdir /s /q "supabase\migrations\app"
if exist "supabase\migrations\components" rmdir /s /q "supabase\migrations\components"
if exist "supabase\migrations\lib" rmdir /s /q "supabase\migrations\lib"
if exist "supabase\migrations\sql" rmdir /s /q "supabase\migrations\sql"
if exist "supabase\migrations\next.config.ts" del /q "supabase\migrations\next.config.ts"
if exist "supabase\migrations\README.txt" del /q "supabase\migrations\README.txt"

echo.
echo Pronto. Os arquivos errados de supabase\migrations foram removidos.
echo Agora rode:
echo   npm run build
echo.
pause
