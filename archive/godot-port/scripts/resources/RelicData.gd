class_name RelicData
extends Resource

@export var relic_id: String = ""
@export var display_name: String = ""
@export var description: String = ""
@export var star_cost: int = 3
@export var icon_symbol: String = "👑"
@export var is_unlocked: bool = false
@export var is_equipped: bool = false

# Effect parameters
@export var initial_gold_bonus: int = 0
@export var initial_lives_bonus: int = 0
@export var damage_multiplier: float = 1.0
@export var attack_speed_multiplier: float = 1.0
@export var cooldown_reduction: float = 0.0
