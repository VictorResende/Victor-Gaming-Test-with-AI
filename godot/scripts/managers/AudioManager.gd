class_name AudioManager
extends Node

var music_player: AudioStreamPlayer
var sfx_players: Array[AudioStreamPlayer] = []
var max_sfx_voices: int = 8

func _ready() -> void:
	music_player = AudioStreamPlayer.new()
	music_player.bus = "Music"
	add_child(music_player)
	
	for i in range(max_sfx_voices):
		var player = AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		sfx_players.append(player)

func play_sfx(stream: AudioStream, pitch_variance: float = 0.0) -> void:
	if not stream:
		return
	
	for player in sfx_players:
		if not player.playing:
			player.stream = stream
			player.pitch_scale = 1.0 + randf_range(-pitch_variance, pitch_variance) if pitch_variance > 0 else 1.0
			player.play()
			return

func play_music(stream: AudioStream, crossfade_duration: float = 1.0) -> void:
	if not stream:
		return
	
	if music_player.playing:
		var tween = create_tween()
		tween.tween_property(music_player, "volume_db", -80.0, crossfade_duration)
		await tween.finished
	
	music_player.stream = stream
	music_player.volume_db = 0.0
	music_player.play()

func update_volumes(sfx_volume: float, music_volume: float, sfx_enabled: bool, music_enabled: bool) -> void:
	var sfx_bus = AudioServer.get_bus_index("SFX")
	var music_bus = AudioServer.get_bus_index("Music")
	
	if sfx_bus >= 0:
		AudioServer.set_bus_mute(sfx_bus, not sfx_enabled)
		AudioServer.set_bus_volume_db(sfx_bus, linear_to_db(sfx_volume))
		
	if music_bus >= 0:
		AudioServer.set_bus_mute(music_bus, not music_enabled)
		AudioServer.set_bus_volume_db(music_bus, linear_to_db(music_volume))
