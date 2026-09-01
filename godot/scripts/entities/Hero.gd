class_name Hero
extends CharacterBody2D

signal level_up(new_level: int)
signal skill_used(skill_name: String)

@export var move_speed: float = 120.0
@export var attack_damage: float = 35.0
@export var attack_range: float = 140.0
@export var attack_speed: float = 1.2
@export var max_hp: float = 400.0

var current_hp: float = 400.0
var level: int = 1
var current_xp: int = 0
var xp_to_next_level: int = 100
var target_position: Vector2
var is_moving: bool = false
var is_selected: bool = false
var skill_cooldown: float = 0.0

func _ready() -> void:
	current_hp = max_hp
	target_position = global_position

func _physics_process(delta: float) -> void:
	if skill_cooldown > 0:
		skill_cooldown -= delta
	
	if is_moving:
		var direction = global_position.direction_to(target_position)
		var distance = global_position.distance_to(target_position)
		if distance < 5.0:
			is_moving = false
			velocity = Vector2.ZERO
		else:
			velocity = direction * move_speed
			move_and_slide()

func move_to(destination: Vector2) -> void:
	target_position = destination
	is_moving = true

func add_xp(amount: int) -> void:
	current_xp += amount
	if current_xp >= xp_to_next_level:
		current_xp -= xp_to_next_level
		level += 1
		xp_to_next_level = int(xp_to_next_level * 1.5)
		max_hp += 50.0
		current_hp = max_hp
		attack_damage += 8.0
		level_up.emit(level)

func use_primary_skill() -> bool:
	if skill_cooldown > 0:
		return false
	
	skill_cooldown = 12.0
	skill_used.emit("Arcane Burst")
	return true
