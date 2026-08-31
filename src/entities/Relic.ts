/**
 * Relic.ts — Sistema de Relíquias Ancestrais
 * Usa o RelicConfig do relicsConfig.ts atualizado.
 */
import { RelicType, RELICS_CONFIG, RelicConfig } from '../config/relicsConfig';

export class Relic {
  public id: RelicType;
  public data: RelicConfig;

  constructor(id: RelicType) {
    this.id = id;
    this.data = RELICS_CONFIG[id];
  }

  public getName(): string {
    return this.data.nameDefault;
  }

  public getDescription(): string {
    return this.data.descDefault;
  }
}
