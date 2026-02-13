#!/bin/bash
# install-skills.sh
# Instala as skills no Antigravity (escopo global ou por projeto)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Skills disponíveis
SKILLS=(
  "futgestor"
  "titan-trainer"
  "supabase-helper"
  "react-component-scaffold"
  "deploy-lovable"
  "commit-formatter-br"
  "code-review-br"
)

echo "🚀 Instalador de Skills para Google Antigravity"
echo "================================================"
echo ""
echo "Escolha o escopo de instalação:"
echo "  1) Global (~/.gemini/antigravity/skills/) - disponível em todos os projetos"
echo "  2) Projeto (.agent/skills/) - disponível apenas no projeto atual"
echo ""
read -p "Opção [1/2]: " SCOPE

if [ "$SCOPE" = "1" ]; then
  TARGET_DIR="$HOME/.gemini/antigravity/skills"
  echo "📁 Instalando globalmente em: $TARGET_DIR"
elif [ "$SCOPE" = "2" ]; then
  TARGET_DIR=".agent/skills"
  echo "📁 Instalando no projeto atual em: $TARGET_DIR"
else
  echo "❌ Opção inválida"
  exit 1
fi

echo ""
echo "Skills disponíveis:"
for i in "${!SKILLS[@]}"; do
  echo "  $((i+1))) ${SKILLS[$i]}"
done
echo "  A) Todas"
echo ""
read -p "Quais instalar? (números separados por espaço, ou A para todas): " SELECTION

mkdir -p "$TARGET_DIR"

install_skill() {
  local skill_name="$1"
  local source="$SCRIPT_DIR/$skill_name"
  local dest="$TARGET_DIR/$skill_name"

  if [ ! -d "$source" ]; then
    echo "  ⚠️  Skill '$skill_name' não encontrada em $source"
    return
  fi

  # Remove versão anterior se existir
  rm -rf "$dest"
  cp -r "$source" "$dest"
  echo "  ✅ $skill_name instalada"
}

if [ "$SELECTION" = "A" ] || [ "$SELECTION" = "a" ]; then
  echo ""
  echo "Instalando todas as skills..."
  for skill in "${SKILLS[@]}"; do
    install_skill "$skill"
  done
else
  echo ""
  echo "Instalando skills selecionadas..."
  for num in $SELECTION; do
    idx=$((num - 1))
    if [ $idx -ge 0 ] && [ $idx -lt ${#SKILLS[@]} ]; then
      install_skill "${SKILLS[$idx]}"
    else
      echo "  ⚠️  Número $num inválido, ignorando"
    fi
  done
fi

echo ""
echo "🎉 Instalação concluída!"
echo ""
echo "Para verificar, abra o Antigravity e peça:"
echo '  "Quais skills estão disponíveis?"'
echo ""
echo "O agente detectará automaticamente suas skills quando você fizer"
echo "perguntas relacionadas aos temas de cada skill."
