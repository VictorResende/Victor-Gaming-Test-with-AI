class_name Projectile
extends Area2D

signal hit_target(target: Enemy, damage: float)

@export var speed: float = 450.0
@export var damage: float = 15.0
@export var damage_type: String = "PHYSICAL"
@export var is_aoe: bool = false
@export var splash_radius: float = 60.0

var target_enemy: Enemy = null
var target_position: Vector2 = Vector2.ZERO
var is_active: bool = true

func _ready() -> void:
	area_entered.connect(_on_area_entered)

func launch(target: Enemy, proj_damage: float, proj_type: String, proj_speed: float = 450.0) -> void:
	target_enemy = target
	damage = proj_damage
	damage_type = proj_type
	speed = proj_speed
	if is_instance_valid(target):
		target_position = target.global_position
	is_active = true

func _process(delta: float) -> void:
	if not is_active:
		return
	
	if is_instance_valid(target_enemy) and target_enemy.is_alive:
		target_position = target_enemy.global_position
	
	var direction = global_position.direction_to(target_position)
	var distance = global_position.distance_to(target_position)
	
	look_at(target_position)
	
	if distance <= speed * delta:
		global_position = target_position
		on_impact()
	else:
		global_position += direction * speed * delta

func _on_area_entered(area: Area2D) -> void:
	var enemy = area.get_parent() as Enemy
	if enemy and enemy == target_enemy:
		on_impact()

func on_impact() -> void:
	if not is_active:
		return
	
	is_active = false
	if is_instance_valid(target_enemy) and target_enemy.is_alive:
		hit_target.emit(target_enemy, damage)
		target_enemy.take_damage(damage, damage_type)
	
	queue_free()
