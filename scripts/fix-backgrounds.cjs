const fs = require('fs');
const path = require('path');

// Páginas que precisam de injeção forçada de style no container raiz
const CRITICAL_PAGES = [
    'Leagues.tsx',
    'Ligas.tsx',
    'Ranking.tsx',
    'FinancialDashboard.tsx',
    'Financeiro.tsx',
    'Lineup.tsx',
    'Escalacao.tsx',
    'Players.tsx',
    'Jogadores.tsx'
];

/**
 * Varre o diretório recursivamente
 */
function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath, callback);
        } else if (file.endsWith('.tsx')) {
            callback(filepath, file);
        }
    });
}

const pagesDir = path.join(__dirname, '../src/pages');

console.log('🚀 Iniciando higienização Triple A de Backgrounds...');

walk(pagesDir, (filepath, filename) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let originalContent = content;

    // 1. Substituir classes opacas globais (Regex Power)
    // Buscamos por classes bg- que costumam bloquear o fundo
    const opaqueClasses = ['bg-background', 'bg-slate-950', 'bg-\\[#040810\\]', 'bg-card'];
    opaqueClasses.forEach(cls => {
        const regex = new RegExp(`\\b${cls}\\b`, 'g');
        content = content.replace(regex, 'bg-transparent');
    });

    // 2. Injeção de style={{ backgroundColor: 'transparent' }} para as páginas críticas
    if (CRITICAL_PAGES.includes(filename)) {
        // Encontrar o primeiro <div ou <Card após o 'return ('
        // Regex busca a abertura da primeira tag comum de div ou Card no retorno do JSX
        const rootTagRegex = /(return\s*\(\s*(?:<[^>]+>\s*)*)<(div|Card)([^>]*)/;
        
        if (rootTagRegex.test(content)) {
            content = content.replace(rootTagRegex, (match, before, tag, attrs) => {
                // Se já tiver style, garantir que backgroundColor esteja lá ou não duplicar
                if (attrs.includes('style=')) {
                    if (!attrs.includes('backgroundColor')) {
                        // Injeta dentro do objeto style existente
                        return `${before}<${tag}${attrs.replace(/style=\{\{(.*?)\}\}/, 'style={{ $1, backgroundColor: \'transparent\' }}')}`;
                    }
                    return match;
                }
                // Senão, injeta o atributo style completo
                return `${before}<${tag} style={{ backgroundColor: 'transparent' }}${attrs}`;
            });
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✅ Higienizado: ${filename}`);
    }
});

console.log('✨ Automação concluída com sucesso!');
