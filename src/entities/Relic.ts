import { RelicType, RELICS_CONFIG, RelicConfig, relicDesc, relicName } from '../config/relicsConfig';

export class Relic {
  public id: RelicType;
  public data: RelicConfig;

  constructor(id: RelicType) {
    this.id = id;
    this.data = RELICS_CONFIG[id];
  }

  public getName(): string {
    return relicName(this.data);
  }

  public getDescription(): string {
    return relicDesc(this.data);
  }
}
