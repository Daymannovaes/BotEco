# BotEco Landing Page

Landing page para o BotEco - bot de WhatsApp que transforma mensagens de texto em áudios estilizados usando IA.

## Tecnologias

- **Astro** - Framework estático com zero JS por padrão
- **Tailwind CSS** - Estilos utilitários
- **React** - Ilhas interativas (audio player)

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## Estrutura

```
landing/
├── public/
│   ├── audio/          # 10 amostras de voz (MP3)
│   └── images/         # Logo, mockups, OG image
├── src/
│   ├── components/     # Componentes Astro e React
│   ├── data/           # Dados dos estilos de voz
│   ├── layouts/        # Layout base
│   └── pages/          # Páginas (index, conectar)
└── astro.config.mjs    # Configuração Astro
```

## Áudios de Demonstração

Os arquivos de áudio em `public/audio/` precisam ser gerados usando o bot com a frase:
> "Olá! Sou o BotEco e vou transformar suas mensagens em algo extraordinário."

Estilos necessários:
1. vilao.mp3
2. pirata.mp3
3. trailer.mp3
4. sussurro.mp3
5. animado.mp3
6. robo.mp3
7. sargento.mp3
8. esportivo.mp3
9. vovo.mp3
10. sarcastico.mp3

## Deploy

Configurado para deploy estático no Vercel. Basta conectar o repositório e configurar:

- **Build Command**: `cd landing && npm run build`
- **Output Directory**: `landing/dist`
- **Install Command**: `cd landing && npm install`

## Páginas

- `/` - Landing page principal
- `/conectar` - Página de conexão com QR code
