# Design System - Tracker de Água & Academia

## Paleta de Cores (Dark Mode & Premium)
- **Background Principal**: `#0f1115` (Preto super profundo)
- **Background Secundário (Cards)**: `#1a1d24` (Cinza escuro para contraste)
- **Cor Primária (Água)**: `#00d2ff` com gradiente para `#3a7bd5` (Azul vibrante)
- **Cor Primária (Academia)**: `#ff416c` com gradiente para `#ff4b2b` (Laranja/Rosa vibrante)
- **Sucesso (Verde)**: `#00b09b` para `#96c93d`
- **Texto Principal**: `#ffffff`
- **Texto Secundário**: `#8e95a5`
- **Bordas e Divisores**: `#2a2e37`

## Tipografia
- Fonte Principal: `Inter`, sans-serif (Limpa, legível e moderna)

## Efeitos e Animações
- **Glassmorphism**: Suave blur em backgrounds semi-transparentes (ex: Toasts e modais).
- **Micro-interações**: Efeito de `transform: scale(1.05)` ao passar o mouse em botões e `scale(0.95)` no clique.
- **Transições**: Transições suaves de `0.3s ease` para mudanças de cor e opacidade.
- **Sombras (Glows)**: Botões de ação têm sombras coloridas sutis (`box-shadow`) que correspondem às suas cores primárias para um efeito "neon" muito elegante.

## Estrutura UI
- **Mobile First**: O layout padrão deve ser otimizado para celular, ocupando a largura total com margens de `16px`. Em telas maiores, centralizar o conteúdo com um `max-width: 600px`.
- **Cartões (Cards)**: Cantos arredondados (`border-radius: 20px`), fundo levemente mais claro, sombra sutíl.
- **Grades**: Uso de `display: grid` para alinhar as garrafas de água e os dias da semana.

## Componentes Chave
1. **Header**: Saudação e progresso geral.
2. **Water Tracker Card**: 
   - Meta e contador em destaque.
   - Ícones de garrafas d'água (`Droplet` ou similar).
   - Botões flutuantes ou embutidos para + e -.
3. **Gym Tracker Card**: 
   - Grade de 7 dias com círculos clicáveis.
   - Dia atual em destaque.
4. **Histórico (History)**: 
   - Lista das últimas semanas com ícones pequenos mostrando os resultados.
   - Badges para semanas perfeitas.
5. **Toast Notifications**: Para celebrar metas atingidas (ex: "Meta de água batida!").
