# Script de Deploy das Edge Functions - FutGestorPro
# Este script faz o deploy das Edge Functions atualizadas

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY DAS EDGE FUNCTIONS - FUTGESTORPRO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Deploy da função delete-user (atualizada)
Write-Host "1. Deploy da função delete-user (atualizada com verificação de time)..." -ForegroundColor Yellow
npx supabase functions deploy delete-user

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ delete-user deployada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erro ao deployar delete-user" -ForegroundColor Red
}

Write-Host ""

# 2. Remover função create-player-access obsoleta
Write-Host "2. Removendo função create-player-access obsoleta..." -ForegroundColor Yellow
npx supabase functions delete create-player-access --no-confirm

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ create-player-access removida com sucesso!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  create-player-access pode já ter sido removida ou não existe" -ForegroundColor Yellow
}

Write-Host ""

# 3. Listar funções ativas
Write-Host "3. Funções ativas no Supabase:" -ForegroundColor Cyan
npx supabase functions list

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
