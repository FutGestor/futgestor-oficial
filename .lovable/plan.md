
# Plano: Aplicar Estilo do Calendario na Area Admin

## Objetivo

Aplicar as mesmas melhorias visuais do calendario da pagina Agenda no calendario do Admin (AdminJogos.tsx):
1. Inverter cores (dias normais em bege, dias de jogos em branco)
2. Escudos circulares e maiores

---

## Arquivo a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminJogos.tsx` | Atualizar estilos do calendario |

---

## Alteracoes Necessarias

### 1. Inverter Cores das Celulas (linhas 428-434)

**Codigo Atual:**
```tsx
className={cn(
  "aspect-square relative flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer",
  isToday && !isSelected && "bg-primary text-primary-foreground",
  isSelected && "ring-2 ring-primary ring-offset-2",
  hasGames && !isToday && !isSelected && "bg-secondary text-secondary-foreground",
  !hasGames && !isToday && "hover:bg-muted"
)}
```

**Codigo Novo:**
```tsx
className={cn(
  "aspect-square relative flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer",
  isToday && !isSelected && "bg-primary text-primary-foreground",
  isSelected && "ring-2 ring-primary ring-offset-2",
  hasGames && !isToday && !isSelected && "bg-card text-card-foreground border",
  !hasGames && !isToday && "bg-secondary/30 hover:bg-secondary/50"
)}
```

### 2. Escudo Circular Maior (linhas 447-455)

**Codigo Atual:**
```tsx
{hasGames && time?.escudo_url && (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg">
    <img 
      src={time.escudo_url} 
      alt={time.nome || firstGame.adversario}
      className="h-full w-full object-cover"
    />
  </div>
)}
```

**Codigo Novo:**
```tsx
{hasGames && time?.escudo_url && (
  <div className="absolute inset-0 flex items-center justify-center p-0.5">
    <img 
      src={time.escudo_url} 
      alt={time.nome || firstGame.adversario}
      className="h-full w-full rounded-full object-contain"
    />
  </div>
)}
```

---

## Resumo das Diferencas

| Elemento | Antes | Depois |
|----------|-------|--------|
| **Dias normais** | Sem cor (`hover:bg-muted`) | Bege claro (`bg-secondary/30`) |
| **Dias de jogos** | Dourado (`bg-secondary`) | Branco (`bg-card` + borda) |
| **Container escudo** | `overflow-hidden rounded-lg` | `p-0.5` |
| **Imagem escudo** | `object-cover` | `rounded-full object-contain` |

---

## Resultado

O calendario do admin ficara visualmente identico ao calendario da pagina Agenda:
- Escudos circulares e "limpos" (sem bordas externas pretas)
- Dias normais em bege claro
- Dias de jogos destacados com fundo branco
