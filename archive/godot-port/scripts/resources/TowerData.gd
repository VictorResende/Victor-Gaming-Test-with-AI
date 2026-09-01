class_name TowerData
extends Resource

@export var tower_id: String = ""
@export var display_name: String = ""
@export var description: String = ""
@export var damage: float = 10.0
@export var attack_range: float = 150.0
@export var attack_speed: float = 1.0 # attacks per second
@export var cost: int = 100
@export var level: int = 1
@export var damage_type: String = "PHYSICAL" # PHYSICAL, MAGIC, CRYO, LIGHTNING
@export var projectile_speed: float = 400.0
@export var is_aoe: bool = false
@export var splash_radius: float = 0.0

@export var upgrade_cost: int = 75
@export var sell_value: int = 70
