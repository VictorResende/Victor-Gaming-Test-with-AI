class_name Tower
extends Node2D

signal projectile_fired(tower: Tower, target: Enemy)

@export var config: TowerData
@export var target_priority: String = "FIRST"

@onready var range_area: Area2D = $RangeArea
@onready var range_shape: CollisionShape2D = $RangeArea/CollisionShape2D

var enemies_in_range: Array[Enemy] = []
var attack_cooldown: float = 0.0

func _ready() -> void:
	if config and range_shape and range_shape.shape is CircleShape2D:
		(range_shape.shape as CircleShape2D).radius = config.attack_range

func _process(delta: float) -> void:
	if attack_cooldown > 0:
		attack_cooldown -= delta
		return
	
	var target = get_target()
	if target:
		fire(target)
		if config:
			attack_cooldown = 1.0 / config.attack_speed

func _on_range_area_area_entered(area: Area2D) -> void:
	var enemy = area.get_parent() as Enemy
	if enemy and enemy.is_alive and not enemies_in_range.has(enemy):
		enemies_in_range.append(enemy)

func _on_range_area_area_exited(area: Area2D) -> void:
	var enemy = area.get_parent() as Enemy
	if enemy and enemies_in_range.has(enemy):
		enemies_in_range.erase(enemy)

func get_target() -> Enemy:
	var valid_enemies = enemies_in_range.filter(func(e): return is_instance_valid(e) and e.is_alive)
	if valid_enemies.is_empty():
		return null
	
	if target_priority == "STRONG":
		valid_enemies.sort_custom(func(a, b): return a.current_hp > b.current_hp)
	elif target_priority == "LAST":
		valid_enemies.sort_custom(func(a, b): return a.progress < b.progress)
	else: # FIRST
		valid_enemies.sort_custom(func(a, b): return a.progress > b.progress)
	
	return valid_enemies[0]

func fire(target: Enemy) -> void:
	projectile_fired.emit(self, target)
	target.take_damage(config.damage if config else 10.0, config.damage_type if config else "PHYSICAL")
