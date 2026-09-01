class_name Enemy
extends PathFollow2D

signal died(enemy: Enemy)
signal reached_exit(damage_lives: int)

@export var config: EnemyData

var current_hp: float = 100.0
var current_speed: float = 80.0
var is_alive: bool = true
var is_frozen: bool = false
var slow_factor: float = 1.0

func _ready() -> void:
	loop = false
	rotates = false
	if config:
		current_hp = config.max_hp
		current_speed = config.move_speed

func _process(delta: float) -> void:
	if not is_alive:
		return
	
	var effective_speed = current_speed * slow_factor
	progress += effective_speed * delta
	
	if progress_ratio >= 1.0:
		is_alive = false
		reached_exit.emit(1 if not config.is_boss else 5)
		queue_free()

func take_damage(amount: float, type: String = "PHYSICAL") -> void:
	if not is_alive:
		return
	
	var final_damage = amount
	if type == "PHYSICAL" and config:
		final_damage *= (1.0 - config.armor)
	elif type == "MAGIC" and config:
		final_damage *= (1.0 - config.magic_resist)
	
	current_hp -= final_damage
	
	if current_hp <= 0:
		is_alive = false
		died.emit(self)
		queue_free()

func apply_slow(factor: float, duration: float) -> void:
	slow_factor = factor
	var timer = get_tree().create_timer(duration)
	await timer.timeout
	slow_factor = 1.0
