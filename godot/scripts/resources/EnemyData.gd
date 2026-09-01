class_name EnemyData
extends Resource

@export var enemy_id: String = ""
@export var display_name: String = ""
@export var max_hp: float = 100.0
@export var move_speed: float = 80.0
@export var armor: float = 0.0 # percentage reduction (0.0 to 0.8)
@export var magic_resist: float = 0.0 # percentage reduction
@export var gold_yield: int = 15
@export var is_boss: bool = false
@export var is_stealth: bool = false
@export var is_flyer: bool = false
