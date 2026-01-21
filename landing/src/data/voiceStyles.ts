export interface VoiceStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  audioFile: string;
  color: string;
}

export const voiceStyles: VoiceStyle[] = [
  {
    id: 'vilao',
    name: 'Vilão',
    description: 'Ameaçador, lento, pausas dramáticas',
    icon: '🦹',
    audioFile: '/audio/vilao.mp3',
    color: 'from-purple-600 to-purple-900',
  },
  {
    id: 'pirata',
    name: 'Pirata',
    description: 'Arrr marujo! Aventureiro dos mares',
    icon: '🏴‍☠️',
    audioFile: '/audio/pirata.mp3',
    color: 'from-amber-600 to-amber-900',
  },
  {
    id: 'trailer',
    name: 'Trailer de Filme',
    description: 'Épico, narrador de cinema',
    icon: '🎬',
    audioFile: '/audio/trailer.mp3',
    color: 'from-red-600 to-red-900',
  },
  {
    id: 'sussurro',
    name: 'Sussurro/ASMR',
    description: 'Suave, relaxante, intimista',
    icon: '🤫',
    audioFile: '/audio/sussurro.mp3',
    color: 'from-blue-400 to-blue-700',
  },
  {
    id: 'animado',
    name: 'Animado',
    description: 'Cheio de energia e entusiasmo',
    icon: '🎉',
    audioFile: '/audio/animado.mp3',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    id: 'robo',
    name: 'Robô',
    description: 'Monótono, mecânico, futurista',
    icon: '🤖',
    audioFile: '/audio/robo.mp3',
    color: 'from-gray-500 to-gray-800',
  },
  {
    id: 'sargento',
    name: 'Sargento',
    description: 'Comandante militar gritando ordens',
    icon: '🎖️',
    audioFile: '/audio/sargento.mp3',
    color: 'from-green-700 to-green-900',
  },
  {
    id: 'esportivo',
    name: 'Narrador Esportivo',
    description: 'Gooool! Emoção do esporte',
    icon: '⚽',
    audioFile: '/audio/esportivo.mp3',
    color: 'from-emerald-500 to-emerald-800',
  },
  {
    id: 'vovo',
    name: 'Vovó',
    description: 'Doce, carinhosa, acolhedora',
    icon: '👵',
    audioFile: '/audio/vovo.mp3',
    color: 'from-pink-400 to-pink-700',
  },
  {
    id: 'sarcastico',
    name: 'Sarcástico',
    description: 'Irônico, debochado, provocador',
    icon: '😏',
    audioFile: '/audio/sarcastico.mp3',
    color: 'from-indigo-500 to-indigo-800',
  },
];
