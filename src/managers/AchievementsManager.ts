import { SaveManager } from './SaveManager';
import { HapticsManager } from './HapticsManager';
import { AudioManager } from './AudioManager';
import { EventBus, GameEvents } from '../core/EventBus';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS_LIST: AchievementDef[] = [
  { id: 'first_kill', name: 'Primeiro Sangue', description: 'Elimine o seu primeiro monstro invasor.', icon: '🎯' },
  { id: 'kills_50', name: 'Defensor Nobre', description: 'Elimine 50 monstros ao longo das batalhas.', icon: '⚔️' },
  { id: 'kills_200', name: 'Ceifador da Horda', description: 'Elimine 200 monstros ao longo das batalhas.', icon: '💀' },
  { id: 'boss_slayer', name: 'Matador de Dragões', description: 'Derrote um Dragão Ancião ou Chefe titânico.', icon: '👑' },
  { id: 'max_tower', name: 'Arquitetura Ancestral', description: 'Evolua uma torre até o Nível 3.', icon: '⭐' },
  { id: 'full_towers', name: 'Cidadela Inexpugnável', description: 'Construa 8 ou mais defesas em uma mesma batalha.', icon: '🏰' },
  { id: 'perfect_defense', name: 'Defesa Impecável', description: 'Vença uma batalha sem perder nenhuma vida (3 Estrelas).', icon: '🛡️' },
  { id: 'spell_caster', name: 'Arquimago Supremo', description: 'Conjure 5 magias ativas durante o combate.', icon: '✨' },
  { id: 'early_caller', name: 'Sem Medo da Morte', description: 'Chame 3 investidas antecipadas para lucrar ouro.', icon: '⏩' },
  { id: 'gold_hoarder', name: 'Tesouro Imperial', description: 'Acumule mais de 1.500 de Ouro em uma batalha.', icon: '💰' },
  { id: 'level_1_clear', name: 'Pioneiro do Desfiladeiro', description: 'Defenda o Desfiladeiro Solar com sucesso.', icon: '🏜️' },
  { id: 'level_2_clear', name: 'Guardião do Glaciar', description: 'Defenda a Tundra Glacial com sucesso.', icon: '❄️' },
  { id: 'level_3_clear', name: 'Mestre do Reino Arcano', description: 'Defenda o Reino Perdido com sucesso.', icon: '🌐' },
  { id: 'level_4_clear', name: 'Senhor do Magma', description: 'Conquiste a vitória na Forja Vulcânica.', icon: '🌋' },
  { id: 'level_5_clear', name: 'Guardião das Ruínas', description: 'Defenda as Ruínas Esquecidas dos Deuses.', icon: '🏛️' },
  { id: 'level_6_clear', name: 'Campeão Celestial', description: 'Conquiste o Santuário Celestial Flutuante.', icon: '✨' }
];

export class AchievementsManager {
  private static instance: AchievementsManager;

  public static getInstance(): AchievementsManager {
    if (!AchievementsManager.instance) {
      AchievementsManager.instance = new AchievementsManager();
    }
    return AchievementsManager.instance;
  }

  public checkAndUnlock(id: string): boolean {
    const save = SaveManager.getInstance();
    const unlocked = save.unlockAchievement(id);
    if (unlocked) {
      HapticsManager.getInstance().victory();
      AudioManager.getInstance().playUpgrade();
      const def = ACHIEVEMENTS_LIST.find(a => a.id === id);
      if (def) {
        EventBus.emit(GameEvents.ACHIEVEMENT_UNLOCKED, def);
      }
    }
    return unlocked;
  }
}
