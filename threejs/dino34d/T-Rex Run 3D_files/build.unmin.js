"use strict";

class InputManager {
    constructor() {
        this.keys = {}, this.callbacks = [], this.callbacks_i = 0;
        const e = new Map,
            t = (e, t) => {
                const s = this.keys[e];
                if (s.justPressed = t && !s.down, s.down = t, s.justReleased = !s.down && !t && !s.justReleased, s.justPressed && this.callbacks[e].length)
                    for (let t in this.callbacks[e]) "justPressed" == this.callbacks[e][t].actionType && (this.callbacks[e][t].callback(), this.callbacks[e][t].maxCalls && (this.callbacks[e][t].totalCalls++, this.callbacks[e][t].totalCalls >= this.callbacks[e][t].maxCalls && this.callbacks[e].splice(t, 1)))
            },
            s = (t, s) => {
                this.keys[s] = {
                    down: !1,
                    justPressed: !1,
                    justReleased: !1,
                    clock: new THREE.Clock
                }, this.callbacks[s] = [], e.set(t, s)
            },
            i = (s, i) => {
                const a = e.get(s);
                a && t(a, i)
            };
        this.addKeyCallback = ((e, t, s, i = !1) => (this.callbacks_i++, this.callbacks[e][this.callbacks_i] = {
            actionType: t,
            callback: s,
            maxCalls: i,
            totalCalls: 0
        }, this.callbacks_i)), this.removeKeyCallback = ((e, t) => {
            this.callbacks[e][t] && this.callbacks[e].splice(t, 1)
        }), s(40, "down"), s(17, "down"), s(38, "space"), s(32, "space"), s(81, "debug_speedup"), window.addEventListener("keydown", e => {
            i(e.keyCode, !0)
        }), window.addEventListener("keyup", e => {
            i(e.keyCode, !1)
        })
    }

    update() {
        for (const e of Object.values(this.keys)) e.justPressed && (e.clock.start(), e.justPressed = !1), e.justReleased && (e.clock.stop(), e.clock.elapsedTime = 0, e.justReleased = !1)
    }
}

class AudioManager {
    constructor() {
        this.base_path = config.base_path + "sound/", this.sounds = {
            score: new Howl({
                src: [this.base_path + "Pickup_Coin103.wav"],
                preload: !0,
                autoplay: !1,
                loop: !1,
                volume: .3
            }),
            highest_score: new Howl({
                src: [this.base_path + "Powerup33.wav"],
                preload: !0,
                autoplay: !1,
                loop: !1,
                volume: .4
            }),
            jump: new Howl({
                src: [this.base_path + "Jump24.wav"],
                preload: !0,
                autoplay: !1,
                loop: !1,
                volume: .15
            }),
            killed: new Howl({
                src: [this.base_path + "Randomize62.wav"],
                preload: !0,
                autoplay: !1,
                loop: !1,
                volume: .15
            }),
            bg: new Howl({
                src: [this.base_path + "ingame/Reloaded Games - Music.ogg"],
                preload: !0,
                autoplay: !1,
                loop: !0,
                volume: .75
            })
        }
    }

    autoplay() {
        this.sounds.bg.playing() || this.play("bg")
    }

    play(e) {
        this.sounds[e].stop(), this.sounds[e].play()
    }

    stop(e) {
        this.sounds[e].stop()
    }

    pause(e) {
        this.sounds[e].pause()
    }

    resume(e) {
        this.sounds[e].play()
    }
}

class EnemyPool {
    constructor() {
        this.items = [], this.keys = []
    }

    addItem(e) {
        this.items.push(e), this.keys.push(this.items.length - 1)
    }

    getItem(e) {
        return this.items[e]
    }

    getRandomKey() {
        if (!this.keys.length) return !1;
        let e = Math.floor(Math.random() * this.keys.length);
        return this.keys.splice(e, 1)[0]
    }

    returnKey(e) {
        this.keys.push(e)
    }

    reset() {
        this.items = [], this.keys = []
    }
}

class EnemyManager {
    constructor() {
        this.pool = new EnemyPool, this.buffer = [], this.clock = new THREE.Clock, this.config = {
            enable_collisions: !0,
            max_amount: {
                pool: {
                    cactus: 50,
                    ptero: 15
                },
                buffer: 10
            },
            vel: 0,
            initial_z: -50,
            remove_z: 25,
            z_distance: {
                cactus: 20,
                ptero: 40
            },
            z_distance_rand: {
                cactus: [.9, 2.5],
                ptero: [.7, 1.5]
            },
            rescale_rand: {
                cactus: [.6, 1.2]
            },
            y_random_rotate: {
                cactus: [-60, 60]
            },
            x_random_range: {
                cactus: [-.5, .5]
            },
            chance_to_spawn_tail: [100, 25],
            tail_rescale_rand: [
                [.6, .9],
                [.4, .7]
            ],
            ptero_anim_speed: .1,
            ptero_y_rand: [0, 1.3, 3.5],
            ptero_z_speedup: -35
        }, this.cache = {
            cactus: {
                material: [],
                geometry: []
            },
            ptero: {
                material: [],
                geometry: []
            }
        }
    }

    hasDuplicates(e) {
        return new Set(e).size !== e.length
    }

    async init() {
        if (this.cache.cactus = {
            geometry: await load_manager.get_mesh_geometry("cactus"),
            material: await load_manager.get_mesh_material("cactus")
        }, this.cache.ptero = {
            geometry: await load_manager.get_mesh_geometry("ptero"),
            material: await load_manager.get_mesh_material("ptero")
        }, !this.pool.items.length)
            for (let e = 0; e < this.config.max_amount.pool.cactus; e++) this.pool.addItem(this.createEnemy("cactus"));
        for (let e = 0; e < this.config.max_amount.buffer; e++) this.buffer.push(this.spawn())
    }

    createEnemy(e = "cactus", t = !1, s = 0) {
        let i = Math.floor(Math.random() * load_manager.assets[e].mesh.length),
            a = new THREE.Mesh(this.cache[e].geometry[i], this.cache[e].material[i]);
        a.enemy_type = e, a.castShadow = !0, "cactus" == e ? a.rotation.y = -Math.PI / 2 : a.current_frame = i;
        let o = [a];
        if ("cactus" == e) {
            if (t) return o[0];
            Math.floor(100 * Math.random()) < this.config.chance_to_spawn_tail[0] && (o.push(this.createEnemy("cactus", !0, 0)), Math.floor(100 * Math.random()) < this.config.chance_to_spawn_tail[1] && o.push(this.createEnemy("cactus", !0, 1)))
        }
        for (let e = 0; e < o.length; e++) o[e].visible = !1, scene.add(o[e]);
        return o
    }

    spawn() {
        let e = this.pool.getRandomKey();
        if (!1 !== e) {
            let t = this.pool.getItem(e);
            for (let e = 0; e < t.length; e++) {
                if (t[e].position.y = nature.cache.ground.box.max.y + -nature.cache.ground.box.min.y - 2.5, "cactus" == t[e].enemy_type) {
                    let s = 1;
                    s = e > 0 ? this.random(this.config.tail_rescale_rand[e - 1][0], this.config.tail_rescale_rand[e - 1][1]) : this.get_rr("cactus"), t[e].scale.set(s, s, s), t[e].position.x = this.random(this.config.x_random_range.cactus[1], this.config.x_random_range.cactus[0]);
                    let i = this.random(this.config.y_random_rotate.cactus[0], this.config.y_random_rotate.cactus[1]);
                    t[e].rotateY(THREE.Math.degToRad(i));
                    let a = this.get_z("cactus");
                    if (e > 0) t[e].position.z = 1 == e ? -(-t[e - 1].position.z + 1.7 * s) : -(-t[e - 1].position.z + 1.9 * s);
                    else if (this.buffer.length)
                        if ("ptero" == this.pool.getItem(this.buffer[this.buffer.indexOf(this.buffer.leader)])[0].enemy_type) {
                            let s = this.pool.getItem(this.buffer.leader);
                            a = this.get_z("ptero"), t[e].position.z = -(-s[s.length - 1].position.z + a)
                        } else {
                            let s = this.pool.getItem(this.buffer.leader);
                            t[e].position.z = -(-s[s.length - 1].position.z + a)
                        } else t[e].position.z = this.config.initial_z
                } else {
                    t[0].position.x = 0, t[0].position.y = this.get_ptero_y();
                    let s = this.get_z("ptero");
                    if (this.buffer.length) {
                        let i = this.pool.getItem(this.buffer.leader);
                        t[e].position.z = -(-i[i.length - 1].position.z + s)
                    } else t[0].position.z = -2 * s
                }
                t[e].visible = !0
            }
            return this.buffer.leader = e, e
        }
    }

    despawn(e = !1) {
        let t = null;
        t = !1 !== e ? this.buffer[this.buffer.indexOf(e)] : this.buffer[0];
        let s = this.pool.getItem(t);
        for (let e = 0; e < s.length; e++) s[e].position.z = 2 * this.config.remove_z, s[e].visible = !1;
        this.pool.returnKey(t)
    }

    move(e) {
        for (let t = 0; t < this.buffer.length; t++) {
            let s = this.pool.getItem(this.buffer[t]);
            if (s[0].position.z > this.config.remove_z) {
                let e = this.spawn();
                this.despawn(this.buffer[t]), this.buffer[t] = e
            } else
                for (let t = 0; t < s.length; t++)
                    if ("ptero" == s[t].enemy_type && s[t].position.z > this.config.ptero_z_speedup ? s[t].position.z += 1.7 * this.config.vel * e : s[t].position.z += this.config.vel * e, this.config.enable_collisions) {
                        let e = this.box3 = new THREE.Box3(new THREE.Vector3, new THREE.Vector3);
                        e.setFromObject(s[t]);
                        let i = new THREE.Box3(new THREE.Vector3, new THREE.Vector3);
                        if (i.setFromObject(player.collisionBox), e.intersectsBox(i) && s[t].visible) return void game.stop()
                    }
        }
    }

    reset() {
        for (let e = 0; e < this.buffer.length; e++) this.despawn();
        for (let e = 0; e < this.pool.items.length; e++)
            for (let t = 0; t < this.pool.items[e].length; t++) scene.remove(this.pool.items[e][t]);
        this.pool.reset(), this.buffer = [], delete this.buffer.leader
    }

    spawnPteros() {
        for (let e = 0; e < this.config.max_amount.pool.ptero; e++) this.pool.addItem(this.createEnemy("ptero"))
    }

    random(e, t, s = !0) {
        return s ? (Math.random() * (t - e) + e).toFixed(4) : Math.floor(Math.random() * t) + e
    }

    get_rr(e) {
        return this.random(this.config.rescale_rand[e][0], this.config.rescale_rand[e][1])
    }

    get_z(e) {
        let t = this.random(this.config.z_distance_rand[e][0], this.config.z_distance_rand[e][1]);
        return this.config.z_distance[e] * t
    }

    get_ptero_y() {
        return nature.cache.ground.box.max.y + -nature.cache.ground.box.min.y - 2.5 + this.config.ptero_y_rand[this.random(0, this.config.ptero_y_rand.length, !1)]
    }

    increase_velocity(e = 1, t = !1) {
        this.config.vel >= 35 && !t || (t ? this.config.vel = e : this.config.vel += e, this.config.vel < 10 ? (player.setVelocity(15), player.setVelocity(1.1, !0), player.setGravity(37), player.setGravity(30, !0), logs.log("Speed level 1")) : this.config.vel >= 10 && this.config.vel < 20 && (15 == player.jump.vel || t) ? (player.setVelocity(19), player.setVelocity(1.1, !0), player.setGravity(60), player.setGravity(40, !0), dynoDustEmitter.removeAllParticles(), dynoDustEmitter.stopEmit(), dynoDustEmitter = nebulaCreateDynoDustEmitter(7), nebulaSystem.addEmitter(dynoDustEmitter), logs.log("Speed level 2")) : this.config.vel >= 20 && this.config.vel < 30 && (19 == player.jump.vel || t) ? (player.setVelocity(25), player.setVelocity(1.3, !0), player.setGravity(100), player.setGravity(70, !0), dynoDustEmitter.removeAllParticles(), dynoDustEmitter.stopEmit(), dynoDustEmitter = nebulaCreateDynoDustEmitter(10), nebulaSystem.addEmitter(dynoDustEmitter), logs.log("Speed level 3")) : this.config.vel >= 30 && (25 == player.jump.vel || t) && (player.setVelocity(30), player.setVelocity(1.5, !0), player.setGravity(150), player.setGravity(70, !0), dynoDustEmitter.removeAllParticles(), dynoDustEmitter.stopEmit(), dynoDustEmitter.dead = !0, logs.log("Speed level 4")))
    }

    pteroNextFrame() {
        for (let e = 0; e < this.buffer.length; e++) {
            let t = this.pool.getItem(this.buffer[e])[0];
            "ptero" == t.enemy_type && (t.current_frame++, t.current_frame > this.cache.ptero.geometry.length - 1 && (t.current_frame = 0), t.geometry = this.cache.ptero.geometry[t.current_frame])
        }
    }

    update(e) {
        this.move(e), this.clock.getElapsedTime() > this.config.ptero_anim_speed && (this.clock.elapsedTime = 0, this.pteroNextFrame())
    }
}

class ScoreManager {
    constructor() {
        this.score = 0, this.highest_score = 0, this.highest_alert = !1, this.zero_padding = 5, this.config = {}, this.timer = null, this.add_vel = 10, this.step = 100, this.is_flashing = !1, this.lvl = 0, this.clock = new THREE.Clock, this.last_flash_score = 0, Number.prototype.pad = function (e) {
            for (var t = String(this); t.length < (e || 2);) t = "0" + t;
            return t
        }, this.canvas = document.createElement("canvas"), this.canvas.id = "score-counter", this.canvas.width = 450, this.canvas.height = 60, document.body.appendChild(this.canvas), this.ctx = this.canvas.getContext("2d"), localStorage.getItem("highest_score___GLITCH_FIX") || (localStorage.setItem("highest_score", 0), localStorage.setItem("highest_score___GLITCH_FIX", !0))
    }

    set(e) {
        this.score = e, this.highest_score = localStorage.getItem("highest_score"), this.highest_score < 25 ? this.highest_alert = !0 : this.highest_alert = !1
    }

    add(e) {
        this.score += e, this.score > this.highest_score && (localStorage.setItem("highest_score", this.score), this.highest_score = this.score, this.highest_alert || (audio.play("highest_score"), this.highest_alert = !0)), 0 != this.score && Math.trunc(this.score) % this.step == 0 && Math.trunc(this.score) != this.last_flash_score && (this.last_flash_score = Math.trunc(this.score), this.flash())
    }

    flash() {
        this.clock.stop(), this.clock.elapsedTime = 0, this.clock.start(), this.is_flashing = !0, audio.play("score"), enemy.increase_velocity(), this.score >= 400 && 0 == this.lvl ? (this.lvl = 1, enemy.spawnPteros(), logs.log("Pterodactyls started to spawn")) : this.score >= 1e3 && 1 == this.lvl ? (this.lvl = 2, this.add_vel = 20, logs.log("Score level 2")) : this.score >= 3e3 && 2 == this.lvl && (this.lvl = 3, this.add_vel = 40, logs.log("Score level 3"))
    }

    reset() {
        this.clock = new THREE.Clock, this.lvl = 0, this.add_vel = 10
    }

    update(e) {
        this.add(this.add_vel * e);
        let t = "";
        t = this.highest_score > 9999 ? "HI " + (this.highest_score / 1e3).toFixed(1) + "K" : "HI " + Math.trunc(this.highest_score).pad(this.zero_padding), this.is_flashing ? Math.trunc(4 * this.clock.getElapsedTime()) % 2 && (t = t + " " + Math.trunc(this.score).pad(this.zero_padding), this.clock.getElapsedTime() > 1 && (this.is_flashing = !1)) : t = t + " " + Math.trunc(this.score).pad(this.zero_padding), this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), this.ctx.font = '28px "Press Start 2P"', this.ctx.fillStyle = "rgba(106,133,145,1)", this.ctx.fillText(t, 0, 60)
    }
}

const scene = new THREE.Scene;
if (config.renderer.fog) {
    const e = 15184465,
        t = 1,
        s = 175;
    scene.fog = new THREE.Fog(e, t, s)
}
const camera = new THREE.PerspectiveCamera(config.camera.fov, config.camera.aspect, config.camera.near, config.camera.far),
    clock = new THREE.Clock;
let input = new InputManager,
    audio = new AudioManager,
    enemy = new EnemyManager,
    score = new ScoreManager;
const renderer = new THREE.WebGLRenderer({
    antialias: config.renderer.antialias,
    alpha: !1,
    powerPreference: "high-performance",
    depth: !0
});
if (scene.background = new THREE.Color(15184465), renderer.setSize(config.renderer.width * config.renderer.render_at, config.renderer.height * config.renderer.render_at), renderer.setPixelRatio(window.devicePixelRatio), config.renderer.shadows && (renderer.shadowMap.enabled = !0, renderer.shadowMap.type = config.renderer.shadows_type), config.renderer.toneMapping && (renderer.toneMapping = THREE.Uncharted2ToneMapping), renderer.domElement.id = "three-canvas", document.body.appendChild(renderer.domElement), !1 !== config.renderer.interval && !0 === config.renderer.fps_counter) {
    var fc = document.createElement("div");
    fc.id = "fps-counter", document.body.appendChild(fc)
}
if (config.renderer.postprocessing.enable) {
    var composer = new THREE.EffectComposer(renderer);
    if (composer.addPass(new THREE.RenderPass(scene, camera)), config.renderer.postprocessing.sao) {
        let e = new THREE.SAOPass(scene, camera, !1, !0);
        e.params.saoBias = 1, e.params.saoIntensity = .008, e.params.saoScale = 10, e.params.saoKernelRadius = 10, e.params.saoMinResolution = 0, e.params.saoBlur = !0, e.params.saoBlurRadius = 3, e.params.saoBlurStdDev = 42.3, e.params.saoBlurDepthCutoff = .1, composer.addPass(e)
    }
}
if (config.camera.controls) {
    var controls = new THREE.MapControls(camera, renderer.domElement);
    controls.enableDamping = !0, controls.dampingFactor = .05, controls.screenSpacePanning = !1, controls.minDistance = 5, controls.maxDistance = 100, controls.maxPolarAngle = Math.PI / 2
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight, camera.updateProjectionMatrix(), renderer.setSize(window.innerWidth, window.innerHeight)
}

camera.position.x = 7.37041093612718, camera.position.y = 3.428590611619372, camera.position.z = 22.609984741761778, camera.rotation.x = -.2521795322818087, camera.rotation.y = .5626175577081858, camera.rotation.z = .1365832725087437, config.camera.controls && (controls.target.set(-1.2946982583264495, -3.0793822864709634e-18, 9.30358864783445), controls.update()), window.addEventListener("resize", onWindowResize, !1);
let ALight = new THREE.AmbientLight(4210752, 2.4);
scene.add(ALight);
let DLight = new THREE.DirectionalLight(16777215, .5),
    DLightTargetObject = new THREE.Object3D;
DLight.position.set(50, 30, -30), DLight.target = DLightTargetObject, DLightTargetObject.position.set(-65, -25, -50), DLight.castShadow = config.renderer.shadows, DLight.shadow.radius = 1, DLight.shadow.mapSize.width = 3072, DLight.shadow.mapSize.height = 3072, DLight.shadow.camera.scale.y = 10, DLight.shadow.camera.scale.x = 20, DLight.shadow.camera.near = 0, DLight.shadow.camera.far = 200, scene.add(DLight), scene.add(DLightTargetObject), config.camera.helper && scene.add(new THREE.CameraHelper(DLight.shadow.camera));
const nebulaSystem = new Nebula.default;

function nebulaCreateDynoDustEmitter(e = 5) {
    const t = new Nebula.Emitter;
    t.rate = new Nebula.Rate(new Nebula.Span(1, 2), new Nebula.Span(.1, .25)), t.addInitializer(new Nebula.Mass(10)), t.addInitializer(new Nebula.Radius(.1)), t.addInitializer(new Nebula.Life(1, 3));
    let s = new THREE.BoxGeometry(.1, .1, .1),
        i = new THREE.MeshLambertMaterial({
            color: "#E7B251"
        });
    t.addInitializer(new Nebula.Body(new THREE.Mesh(s, i)));
    let a = new Nebula.RadialVelocity(e, new Nebula.Vector3D(0, 15, 20), 40);
    t.addInitializer(a), t.addBehaviour(new Nebula.Rotate("random", "random")), t.addBehaviour(new Nebula.Scale(2, .1));
    let o = new Nebula.BoxZone(3, 2, 25);
    var r, n, h;
    return o.max = 10, t.addBehaviour(new Nebula.CrossZone(o, "bound")), r = 0, n = -1.1, h = 15.5, t.position.x = r, t.position.y = n, t.position.z = h, o.x = r, o.y = n, o.z = h, t.emit(), t
}

let dynoDustEmitter = nebulaCreateDynoDustEmitter(4);
nebulaSystem.addEmitter(dynoDustEmitter), nebulaSystem.addRenderer(new Nebula.MeshRenderer(scene, THREE));

class LogManager {
    constructor() {
        this.is_active = !1
    }

    enable() {
        this.is_active = !0
    }

    disable() {
        this.is_active = !1
    }

    log(e, t = 0) {
        0 == t ? console.log("[INFO] " + e) : 1 == t ? console.log("[WARNING] " + e) : 2 == t && console.log(["[FATAL] " + e])
    }
}

let logs = new LogManager;
config.logs && logs.enable();

class PlayerManager {
    constructor() {
        this.frames = null, this.frames_band = null, this.frames_death = null, this.frame = null, this.collisionBox = null, this.currentFrame = 0, this.clock = new THREE.Clock, this.anim_speed = .1, this.block_fall_fast = !1, this.jump = {
            is_active: !1,
            vel: 15,
            gravity: -37,
            boost: {
                vel: 1.1,
                gravity: -30
            }
        }
    }

    init() {
        for (let e in this.frames) this.frames[e].position.y = nature.cache.ground.box.max.y + .05, this.frames[e].position.z = 15, this.frames[e].rotation.y = Math.PI / 2, this.frames[e].init_y = this.frames[e].position.y;
        for (let e in this.frames_band) this.frames_band[e].position.y = nature.cache.ground.box.max.y + .05, this.frames_band[e].position.z = 15, this.frames_band[e].rotation.y = Math.PI / 2, this.frames_band[e].init_y = this.frames_band[e].position.y;
        for (let e in this.frames_death) this.frames_death[e].position.y = nature.cache.ground.box.max.y + .05, this.frames_death[e].position.z = 15, this.frames_death[e].rotation.y = Math.PI / 2
    }

    getVelocity(e = !1) {
        return e ? this.jump.boost.vel : this.jump.vel
    }

    setVelocity(e = 15, t = !1) {
        t ? this.jump.boost.vel = e : this.jump.vel = e
    }

    getGravity(e = !1) {
        return e ? -this.jump.boost.gravity : -this.jump.gravity
    }

    setGravity(e = 37, t = !1) {
        t ? this.jump.boost.gravity = -e : this.jump.gravity = -e
    }

    setPlayerDeathFrames(e) {
        this.frames_death = e
    }

    setPlayerFrames(e, t = !1) {
        if (t) this.frames_band = e;
        else {
            this.frames = e, this.frame = this.frames[this.currentFrame], this.frame.init_y = this.frame.position.y, scene.add(this.frame);
            let t = new THREE.BoxGeometry(.5, 1.7, .7),
                s = new THREE.MeshBasicMaterial({
                    color: 65280
                });
            this.collisionBox = new THREE.Mesh(t, s), this.collisionBox.position.x = this.frame.position.x, this.collisionBox.position.y = this.frame.position.y + 1.4, this.collisionBox.position.z = this.frame.position.z, scene.add(this.collisionBox), this.collisionBox.visible = !1
        }
    }

    nextFrame(e = !1) {
        !e && this.jump.is_active || (this.currentFrame++, this.currentFrame > this.frames.length - 1 && (this.currentFrame = 0), input.keys.down.down ? (this.frame.geometry = this.frames_band[this.currentFrame].geometry, this.collisionBox.scale.y = .5, this.collisionBox.scale.z = 2.5, this.collisionBox.position.z = this.frame.position.z - .5, this.collisionBox.position.y = this.frame.position.y + .7) : (this.frame.geometry = this.frames[this.currentFrame].geometry, this.collisionBox.scale.y = 1, this.collisionBox.scale.z = 1, this.collisionBox.position.z = this.frame.position.z, this.collisionBox.position.y = this.frame.position.y + 1.4))
    }

    deathFrame() {
        input.keys.down.down ? this.frame.geometry = this.frames_death["wow-down"].geometry : this.frame.geometry = this.frames_death.wow.geometry
    }

    getY() {
        return this.frame.position.y
    }

    setY(e) {
        this.frame.position.y = e
    }

    initJump(e) {
        this.jump.is_active = !0, this.jump.falling = !1, this.frame.vel = this.jump.vel, this.frame.gravity = this.jump.gravity, this.frame.boost = !1, this.nextFrame(!0), audio.play("jump"), dynoDustEmitter.dead || dynoDustEmitter.stopEmit(), input.keys.down.down && (this.block_fall_fast = !0)
    }

    doJump(e) {
        !input.keys.space.justPressed || this.jump.is_active || input.keys.down.down || this.initJump(e), this.jump.is_active && (input.keys.space.clock.getElapsedTime(), !this.frame.boost && input.keys.space.down && input.keys.space.clock.getElapsedTime() > .2 && (this.frame.vel = this.frame.vel * this.jump.boost.vel, this.frame.gravity = this.jump.boost.gravity, this.frame.boost = !0), input.keys.down.justReleased && (this.block_fall_fast = !1), input.keys.down.down && !this.block_fall_fast && (this.frame.gravity = 1.1 * this.frame.gravity, this.frame.geometry = this.frames_band[this.currentFrame].geometry, this.collisionBox.scale.y = .5, this.collisionBox.scale.z = 2.5, this.collisionBox.position.z = this.frame.position.z - .5, this.collisionBox.position.y = this.frame.position.y - 2), this.frame.position.y = this.frame.position.y + this.frame.vel * e, input.keys.down.down && !this.block_fall_fast ? this.collisionBox.position.y = this.frame.position.y + .8 : this.collisionBox.position.y = this.frame.position.y + 1.4, this.frame.vel = this.frame.vel + this.frame.gravity * e, this.frame.position.y <= this.frame.init_y && (input.keys.space.down ? input.keys.down.down ? (this.jump.is_active = !1, dynoDustEmitter.dead || dynoDustEmitter.emit()) : this.initJump(e) : (this.jump.is_active = !1, dynoDustEmitter.dead || dynoDustEmitter.emit()), this.frame.position.y = this.frame.init_y, this.collisionBox.position.y = this.frame.position.y + 1.4, input.keys.space.clock.elapsedTime = 0))
    }

    reset() {
        this.currentFrame = 0, this.nextFrame()
    }

    update(e) {
        this.frames && (this.anim_speed = .18 / (enemy.config.vel / 2), this.doJump(e), this.clock.getElapsedTime() > this.anim_speed && (this.clock.elapsedTime = 0, this.nextFrame()))
    }
}

let player = new PlayerManager;

class NatureManager {
    constructor() {
        this.config = {
            remove_z: {
                ground: 50,
                earth: 250
            },
            levels: {
                playground: {
                    max_amount: 20,
                    z_distance: 5,
                    z_distance_rand: [1, 3],
                    x_random_range: [-2.5, 2.5],
                    remove_z: 20,
                    spawn: null
                },
                first: {
                    max_amount: 20,
                    z_distance: 5,
                    z_distance_rand: [1, 4],
                    remove_z: 20,
                    spawn: null
                },
                second: {
                    max_amount: 20,
                    z_distance: 10,
                    z_distance_rand: [1, 4],
                    remove_z: 20,
                    spawn: null
                },
                third: {
                    max_amount: 10,
                    z_distance: 30,
                    z_distance_rand: [1, 7],
                    remove_z: 20,
                    spawn: null
                },
                water: {
                    max_amount: 10,
                    z_distance: 20,
                    z_distance_rand: [1, 4],
                    remove_z: 20,
                    spawn: null
                },
                water2: {
                    max_amount: 20,
                    z_distance: 10,
                    z_distance_rand: [1, 2],
                    remove_z: 20,
                    spawn: null
                },
                empty: {
                    max_amount: 20,
                    z_distance: 10,
                    z_distance_rand: [1, 4],
                    remove_z: 20,
                    spawn: null
                }
            },
            misc_items: {
                PalmTree: {
                    rescale_rand: [2, 3],
                    x_random_range: [-3, 3]
                },
                tumbleweed: {
                    rescale_rand: [.6, .8],
                    x_random_range: [-3, 3],
                    random_rotate_vel: [.01, .1],
                    y_rotate: -Math.PI / 2,
                    rotate_direction: "z",
                    behavior: "roll"
                },
                cactus: {
                    rescale_rand: [.6, 1.2],
                    x_random_range: [-3, 3],
                    y_random_rotate: [-80, 80]
                },
                desert_skull: {
                    rescale_rand: [.15, .3],
                    x_random_range: [-3, 3],
                    z_random_rotate: [-60, 60],
                    y_random_rotate: [-30, 30]
                },
                scorpion: {
                    rescale_rand: [.3, .7],
                    x_random_range: [-3, 3],
                    y_random_rotate: [-40, 40]
                },
                rocks: {
                    rescale_rand: [.5, 3],
                    x_random_range: [-3, 3]
                },
                flowers: {
                    rescale_rand: [.7, 1.3],
                    x_random_range: [-3, 3]
                },
                trees: {
                    rescale_rand: [.8, 3],
                    x_random_range: [-3, 3],
                    y_random_rotate: [-80, 80]
                },
                fish: {
                    rescale_rand: [.1, .4],
                    x_random_range: [-2.5, 2.5],
                    y_random_rotate: [-60, 60]
                },
                seaweed: {
                    rescale_rand: [.3, 1],
                    x_random_range: [-2.5, 2.5],
                    y_random_rotate: [-60, 60]
                }
            }
        }, this.earth_chunks = [], this.ground_chunks = [], this.ground_chunks_decoration = [], this.ground_chunks_decoration_levels = [], this.water = null, this.rocks = [], this.flowers = [], this.misc = {}, this.cache = {
            earth: {
                box: null,
                geometry: null,
                material: null,
                texture: null
            },
            ground: {
                box: null,
                geometry: null,
                material: null
            },
            ground_decoration: {
                box: null,
                geometry: null,
                material: null
            },
            water: {
                geometry: null,
                material: null
            },
            rocks: {
                geometry: null,
                material: null
            },
            flowers: {
                geometry: null,
                material: null
            },
            misc: {
                geometry: null,
                material: null
            }
        }
    }

    initEarth(e = 3) {
        this.cache.earth.geometry || (this.cache.earth.texture = load_manager.get_texture("t_ground").top, this.cache.earth.texture.wrapS = this.cache.earth.texture.wrapT = THREE.RepeatWrapping, this.cache.earth.texture.offset.set(0, 0), this.cache.earth.texture.repeat.set(12.5, 15.625), this.cache.earth.geometry = new THREE.BoxGeometry(100, 0, 250), this.cache.earth.material = new THREE.MeshLambertMaterial({
            map: this.cache.earth.texture
        }));
        for (let t = 0; t < e; t++) {
            let e = new THREE.Mesh(this.cache.earth.geometry, this.cache.earth.material);
            if (e.receiveShadow = !0, e.position.x = 0, e.position.y = nature.cache.ground.box.min.y - .5, t > 0) {
                let t = this.earth_chunks[this.earth_chunks.length - 1];
                e.position.z = this.earth_chunks[this.earth_chunks.length - 1].position.z - 250 * t.scale.z
            } else e.position.z = -20;
            this.cache.earth.box || (this.cache.earth.box = (new THREE.Box3).setFromObject(e)), this.earth_chunks.push(e), scene.add(e)
        }
        this.earth_chunks.leader = this.earth_chunks.length - 1
    }

    moveEarth(e) {
        for (let t = 0; t < this.earth_chunks.length; t++) {
            if (this.earth_chunks[t].position.z > this.config.remove_z.earth) {
                let e = this.earth_chunks[this.earth_chunks.leader];
                this.earth_chunks[t].position.z = e.position.z - 250 * e.scale.z, this.earth_chunks.leader = t
            }
            this.earth_chunks[t].position.z += enemy.config.vel * e
        }
    }

    initWater() {
        null === this.cache.water.geometry && (this.cache.water.geometry = new THREE.BoxGeometry(8, 1, 250), this.cache.water.material = new THREE.MeshLambertMaterial({
            color: 7266303,
            transparent: !0,
            opacity: .85
        })), this.water = new THREE.Mesh(this.cache.water.geometry, this.cache.water.material), scene.add(this.water), this.water.position.z = -75, this.water.position.x = -7, this.water.position.y = nature.cache.earth.box.max.y + .5
    }

    initGround(e = 15) {
        let t = load_manager.get_vox("ground");
        this.cache.ground = {
            geometry: t.geometry,
            material: t.material
        };
        for (let t = 0; t < e; t++) {
            let e = new THREE.Mesh(this.cache.ground.geometry, this.cache.ground.material);
            if (e.receiveShadow = !0, e.position.y = -2.5, e.scale.set(1.5, 1.5, 1.5), t > 0) {
                let t = this.ground_chunks[this.ground_chunks.length - 1];
                e.position.z = this.ground_chunks[this.ground_chunks.length - 1].position.z - 10 * t.scale.z
            } else e.position.z = 15, this.cache.ground.box || (this.cache.ground.box = (new THREE.Box3).setFromObject(e));
            this.ground_chunks.push(e), scene.add(e)
        }
        this.ground_chunks.leader = this.ground_chunks.length - 1
    }

    moveGround(e) {
        for (let t = 0; t < this.ground_chunks.length; t++) {
            if (this.ground_chunks[t].position.z > this.config.remove_z.ground) {
                let e = this.ground_chunks[this.ground_chunks.leader];
                this.ground_chunks[t].position.z = e.position.z - 10 * e.scale.z, this.ground_chunks.leader = t
            }
            this.ground_chunks[t].position.z += enemy.config.vel * e
        }
    }

    initGroundDecoration(e, t, s, i = !0, a = "all", o = 11) {
        let r = load_manager.get_vox("ground_bg");
        this.cache.ground_decoration = {
            geometry: r.geometry,
            material: r.material
        };
        let n = [];
        for (let r = 0; r < o; r++) {
            let o = new THREE.Mesh(this.cache.ground_decoration.geometry, this.cache.ground_decoration.material);
            if (o.scale.set(3, 2, 3), o.position.x = t, o.position.y = s, o.receiveShadow = i, r > 0) {
                let e = n[n.length - 1];
                o.position.z = e.position.z - 10 * e.scale.z
            } else o.position.z = 15, this.cache.ground_decoration.box = (new THREE.Box3).setFromObject(o);
            this.ground_chunks_decoration_levels[e] = {
                x: t,
                y: s,
                spawn: a,
                box: (new THREE.Box3).setFromObject(o)
            }, n.push(o), scene.add(o)
        }
        n.leader = n.length - 1, this.ground_chunks_decoration.push(n)
    }

    moveGroundDecoration(e) {
        for (let t = 0; t < this.ground_chunks_decoration.length; t++)
            for (let s = 0; s < this.ground_chunks_decoration[t].length; s++) {
                if (this.ground_chunks_decoration[t][s].position.z > this.config.remove_z.ground) {
                    let e = this.ground_chunks_decoration[t][this.ground_chunks_decoration[t].leader];
                    this.ground_chunks_decoration[t][s].position.z = e.position.z - 10 * e.scale.z, this.ground_chunks_decoration[t].leader = s
                }
                this.ground_chunks_decoration[t][s].position.z += enemy.config.vel * e
            }
    }

    async initMisc() {
        let e = load_manager.get_vox("misc");
        this.cache.misc = {
            geometry: await load_manager.get_mesh_geometry("misc"),
            material: await load_manager.get_mesh_material("misc")
        };
        for (let t in this.config.levels) {
            let s = this.config.levels[t],
                i = this.ground_chunks_decoration_levels[t];
            if (s.spawn) {
                for (let a = 0; a < s.max_amount; a++) {
                    let a, o = null;
                    "*" == s.spawn ? (a = Math.floor(Math.random() * load_manager.assets.misc.mesh.length), o = new THREE.Mesh(this.cache.misc.geometry[a], this.cache.misc.material[a])) : (a = s.spawn[Math.floor(Math.random() * s.spawn.length)], o = new THREE.Mesh(this.cache.misc.geometry[a], this.cache.misc.material[a])), o.misc_type = e[a].misc_type;
                    let r = o.misc_type.split("/")[0];
                    if (o.castShadow = !0, o.receiveShadow = !0, o.randLevel = i, "x_random_range" in s ? Array.isArray(s.x_random_range) ? o.position.x = this.random(i.x + s.x_random_range[1], i.x + s.x_random_range[0]) : o.position.x = this.random(i.x + s.x_random_range[r][1], i.x + s.x_random_range[r][0]) : o.position.x = this.random(i.x + this.config.misc_items[r].x_random_range[1], i.x + this.config.misc_items[r].x_random_range[0]), o.init_x = o.position.x, "behavior" in this.config.misc_items[r]) {
                        if ("roll" == this.config.misc_items[r].behavior) o.geometry.center(), o.position.y = i.box.max.y + .6, o.position.z = i.box.max.y, o.rotation.y = this.config.misc_items[r].y_rotate, o.rotate_vel = this.random(this.config.misc_items[r].random_rotate_vel[0], this.config.misc_items[r].random_rotate_vel[1]);
                        else if ("move" == this.config.misc_items[r].behavior) {
                            if (o.position.y = i.box.max.y, void 0 !== this.config.misc_items[r].z_random_rotate) {
                                let e = this.random(this.config.misc_items[r].z_random_rotate[0], this.config.misc_items[r].z_random_rotate[1]);
                                o.rotateZ(THREE.Math.degToRad(e))
                            }
                            if (void 0 !== this.config.misc_items[r].y_random_rotate) {
                                let e = this.random(this.config.misc_items[r].y_random_rotate[0], this.config.misc_items[r].y_random_rotate[1]);
                                o.rotateY(THREE.Math.degToRad(e))
                            }
                        }
                    } else {
                        if (o.position.y = i.box.max.y, void 0 !== this.config.misc_items[r].z_random_rotate) {
                            let e = this.random(this.config.misc_items[r].z_random_rotate[0], this.config.misc_items[r].z_random_rotate[1]);
                            o.rotateZ(THREE.Math.degToRad(e))
                        }
                        if (void 0 !== this.config.misc_items[r].y_random_rotate) {
                            let e = this.random(this.config.misc_items[r].y_random_rotate[0], this.config.misc_items[r].y_random_rotate[1]);
                            o.rotateY(THREE.Math.degToRad(e))
                        }
                        void 0 !== this.config.misc_items[r].y_add && (o.position.y += this.config.misc_items[r].y_add)
                    }
                    let n = this.random(this.config.misc_items[r].rescale_rand[0], this.config.misc_items[r].rescale_rand[1]);
                    o.scale.set(n, n, n);
                    let h = this.get_z("misc", t);
                    t in this.misc && this.misc[t].length ? o.position.z = -(-this.misc[t][this.misc[t].length - 1].position.z + h) : o.position.z = h, t in this.misc || (this.misc[t] = []), this.misc[t].push(o), scene.add(o)
                }
                this.misc[t].leader = s.max_amount - 1
            } else delete this.config.levels[t]
        }
    }

    moveMisc(e) {
        for (let t in this.config.levels) {
            let s = this.config.levels[t];
            this.ground_chunks_decoration_levels[t];
            if (t in this.misc)
                for (let i = 0; i < this.misc[t].length; i++) {
                    let a = this.misc[t][i].misc_type.split("/")[0];
                    if (this.misc[t][i].position.z > s.remove_z) {
                        let e = this.random(this.config.misc_items[a].rescale_rand[0], this.config.misc_items[a].rescale_rand[1]);
                        this.misc[t][i].scale.set(e, e, e);
                        let s = this.get_z("misc", t);
                        if (this.misc[t][i].position.z = -(-this.misc[t][this.misc[t].leader].position.z + s), this.misc[t].leader = i, "behavior" in this.config.misc_items[a]) "roll" == this.config.misc_items[a].behavior ? this.misc[t][i].rotation.y = this.config.misc_items[a].y_rotate : "move" == this.config.misc_items[a].behavior && (this.misc[t][i].position.x = misc.init_x);
                        else {
                            if (void 0 !== this.config.misc_items[a].z_random_rotate) {
                                let e = this.random(this.config.misc_items[a].z_random_rotate[0], this.config.misc_items[a].z_random_rotate[1]);
                                this.misc[t][i].rotateZ(THREE.Math.degToRad(e))
                            }
                            if (void 0 !== this.config.misc_items[a].y_random_rotate) {
                                let e = this.random(this.config.misc_items[a].y_random_rotate[0], this.config.misc_items[a].y_random_rotate[1]);
                                this.misc[t][i].rotateY(THREE.Math.degToRad(e))
                            }
                        }
                    } else "behavior" in this.config.misc_items[a] ? "roll" == this.config.misc_items[a].behavior ? (this.misc[t][i].rotation[this.config.misc_items[a].rotate_direction] -= this.misc[t][i].rotate_vel, this.misc[t][i].position.z += (1 * enemy.config.vel + 20 * this.misc[t][i].rotate_vel) * e) : "move" == this.config.misc_items[a].behavior && (this.misc[t][i].position.x -= this.config.misc_items[a].move_speed / 2 * -this.misc[t][i].rotation.y, this.misc[t][i].position.z += enemy.config.vel * e) : this.misc[t][i].position.z += enemy.config.vel * e
                }
        }
    }

    random(e, t, s = !0) {
        return s ? (Math.random() * (t - e) + e).toFixed(4) : Math.floor(Math.random() * t) + e
    }

    get_z(e, t) {
        let s = this.random(this.config.levels[t].z_distance_rand[0], this.config.levels[t].z_distance_rand[1]);
        return this.config.levels[t].z_distance * s
    }

    reset() {
        for (let e in this.config.levels)
            for (let t = 0; t < this.misc[e].length; t++) scene.remove(this.misc[e][t]);
        for (let e = 0; e < this.earth_chunks.length; e++) scene.remove(this.earth_chunks[e]);
        for (let e = 0; e < this.ground_chunks.length; e++) scene.remove(this.ground_chunks[e]);
        for (let e = 0; e < this.ground_chunks_decoration.length; e++)
            for (let t = 0; t < this.ground_chunks_decoration[e].length; t++) scene.remove(this.ground_chunks_decoration[e][t]);
        scene.remove(this.water), this.misc = [], this.earth_chunks = [], this.ground_chunks = [], this.ground_chunks_decoration = [], this.ground_chunks_decoration_levels = [], this.water = null
    }

    update(e) {
        this.moveEarth(e), this.moveGround(e), this.moveGroundDecoration(e), this.moveMisc(e)
    }
}

let nature = new NatureManager;

class LoadManager {
    constructor() {
        this.assets = {}, this.vox = {}, this.onload = function () {
        }, this.onassetload = function () {
        }
    }

    set_status(e, t = !0) {
        this.assets[e].status = t, t && (logs.log("ASSET LOADED: " + e), this.onassetload && this.onassetload()), this.check(), this.load_deps(e)
    }

    get_status(e) {
        return !!this.assets[e].status
    }

    set_mesh(e, t) {
        this.assets[e].mesh = t
    }

    get_mesh(e) {
        return this.assets[e].mesh
    }

    set_vox(e, t) {
        this.assets[e].is_vox = !0, this.assets[e].mesh = t
    }

    get_vox(e) {
        return this.assets[e].mesh
    }

    set_texture(e, t) {
        this.assets[e].is_texture = !0, this.assets[e].texture = t
    }

    get_texture(e) {
        return this.assets[e].texture
    }

    get_random_mesh(e) {
        return this.assets[e].mesh[Math.floor(Math.random() * this.assets[e].mesh.length)]
    }

    async wait_for_mesh_material(e, t) {
        let s = !1;
        for (; !s;) try {
            this.assets[e].mesh[t].material, s = !0
        } catch (e) {
            await new Promise((e, t) => setTimeout(e, 10)), s = !1
        }
        return this.assets[e].mesh[t].material
    }

    async get_mesh_material(e) {
        if (Array.isArray(this.assets[e].mesh)) {
            let t = [];
            for (let s = 0; s < this.assets[e].mesh.length; s++) t.push(await this.wait_for_mesh_material(e, s));
            return t
        }
        return this.assets[e].mesh.material
    }

    async wait_for_mesh_geometry(e, t) {
        let s = !1;
        for (; !s;) try {
            this.assets[e].mesh[t].geometry, s = !0
        } catch (e) {
            await new Promise((e, t) => setTimeout(e, 10)), s = !1
        }
        return new Promise((s, i) => {
            s(this.assets[e].mesh[t].geometry)
        })
    }

    async get_mesh_geometry(e) {
        if (Array.isArray(this.assets[e].mesh)) {
            let t = [];
            for (let s = 0; s < this.assets[e].mesh.length; s++) t.push(await this.wait_for_mesh_geometry(e, s));
            return new Promise((e, s) => {
                e(t)
            })
        }
        return new Promise((t, s) => {
            t(this.assets[e].mesh.geometry)
        })
    }

    get_certain_mesh(e, t, s, i = !1) {
        if (Array.isArray(t)) {
            let a = [];
            for (let o = 0; o < this.assets[e].mesh.length; o++) (t.includes(this.assets[e].mesh[o][s]) || t.includes(this.assets[e].mesh[o][s].split("/")[0])) && (i ? a.push(o) : a.push(this.assets[e].mesh[o]));
            return a
        }
        for (let a = 0; a < this.assets[e].mesh.length; a++)
            if (this.assets[e].mesh[a][s] == t) return i ? a : this.assets[e].mesh[a]
    }

    get_mesh_box(e) {
        if (Array.isArray(this.assets[e].mesh)) {
            let t = [];
            for (let s = 0; s < this.assets[e].mesh.length; s++) this.assets[e].is_vox ? t.push((new THREE.Box3).setFromObject(this.assets[e].mesh[s].createMesh())) : t.push((new THREE.Box3).setFromObject(this.assets[e].mesh[s]));
            return t
        }
        return this.assets[e].is_vox ? (new THREE.Box3).setFromObject(this.assets[e].mesh.createMesh()) : (new THREE.Box3).setFromObject(this.assets[e].mesh)
    }

    set_loader(e, t, s) {
        this.assets[e] = {
            status: !1,
            callback: s,
            mesh: null,
            is_vox: !1,
            deps: t
        }
    }

    load_all(e, t) {
        logs.log("LOADING ALL ASSETS"), this.onload = e, this.onassetload = t;
        for (const e in this.assets) this.load_asset(e)
    }

    load_asset(e) {
        if (this.get_status(e)) logs.log("ASSET ALREADY LOADED: " + e, 1);
        else {
            if (logs.log("LOADING ASSET: " + e), this.assets[e].deps)
                for (let t in this.assets[e].deps)
                    if (!this.get_status(this.assets[e].deps[t])) return logs.log("LOADING ASSET " + e + " CANCELED, DEPS YET NOT LOADED: " + this.assets[e].deps, 1), !1;
            this.assets[e].callback()
        }
    }

    load_deps(e) {
        for (let t in this.assets) this.assets[t].deps.includes(e) && this.load_asset(t)
    }

    check() {
        for (const e in this.assets)
            if (!this.assets[e].status) return !1;
        return logs.log("All assets loaded, starting the game."), this.onload(), !0
    }

    getLoadPercentage() {
        let e = Object.keys(this.assets).length,
            t = 0;
        for (let e in this.assets) this.assets[e].status && t++;
        return Math.floor(100 * t / e)
    }
}

let load_manager = new LoadManager;
load_manager.set_loader("ground", [], function () {
    (new vox.Parser).parse(config.base_path + "objects/ground sand.vox").then(function (e) {
        let t = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            s = new THREE.MeshLambertMaterial;
        s.map = vox.MeshBuilder.textureFactory.getTexture(e), t.material = s, load_manager.set_vox("ground", t), load_manager.set_status("ground", !0)
    })
}), load_manager.set_loader("ground_bg", [], function () {
    (new vox.Parser).parse(config.base_path + "objects/ground sand solid.vox").then(function (e) {
        let t = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            s = new THREE.MeshLambertMaterial;
        s.map = vox.MeshBuilder.textureFactory.getTexture(e), t.material = s, load_manager.set_vox("ground_bg", t), load_manager.set_status("ground_bg", !0)
    })
}), load_manager.set_loader("dyno", ["ground"], function () {
    let e = new vox.Parser,
        t = [];
    for (let s = 0; s <= 7; s++) e.parse(config.base_path + "objects/t-rex/" + s + ".vox").then(function (e) {
        let i = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            a = new THREE.MeshLambertMaterial;
        a.map = vox.MeshBuilder.textureFactory.getTexture(e), i.material = a;
        let o = i.createMesh();
        o.castShadow = !0, t[s] = o, t.length - 1 == 7 && (load_manager.set_mesh("dyno", t), load_manager.set_status("dyno", !0), player.setPlayerFrames(load_manager.get_vox("dyno")))
    })
}), load_manager.set_loader("dyno_band", ["dyno"], function () {
    let e = new vox.Parser,
        t = [];
    for (let s = 0; s <= 7; s++) e.parse(config.base_path + "objects/t-rex/band/" + s + ".vox").then(function (e) {
        let i = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            a = new THREE.MeshLambertMaterial;
        a.map = vox.MeshBuilder.textureFactory.getTexture(e), i.material = a;
        let o = i.createMesh();
        o.castShadow = !0, t[s] = o, t.length - 1 == 7 && (load_manager.set_mesh("dyno_band", t), load_manager.set_status("dyno_band", !0), player.setPlayerFrames(t, !0))
    })
}), load_manager.set_loader("dyno_death", ["ground"], function () {
    let e = new vox.Parser,
        t = {
            wow: null,
            "wow-down": null
        },
        s = Object.keys(t),
        i = 0;
    for (let a = 0; a < s.length; a++) e.parse(config.base_path + "objects/t-rex/other/" + s[a] + ".vox").then(function (e) {
        let o = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            r = new THREE.MeshLambertMaterial;
        r.map = vox.MeshBuilder.textureFactory.getTexture(e), o.material = r;
        let n = o.createMesh();
        n.castShadow = !0, t[s[a]] = n, ++i == s.length && (load_manager.set_mesh("dyno_death", t), load_manager.set_status("dyno_death", !0), player.setPlayerDeathFrames(t))
    })
}), load_manager.set_loader("cactus", ["ground"], function () {
    let e = new vox.Parser,
        t = (scene.getObjectByName("ground"), []),
        s = ["cactus", "cactus_tall", "cactus_thin", "fcactus", "fcactus_tall", "fcactus_thin"];
    for (let i = 0; i <= s.length - 1; i++) e.parse(config.base_path + "objects/cactus/" + s[i] + ".vox").then(function (e) {
        let a = new vox.MeshBuilder(e, {
                voxelSize: .09
            }),
            o = new THREE.MeshLambertMaterial;
        o.map = vox.MeshBuilder.textureFactory.getTexture(e), a.material = o, t[i] = a, t.length == s.length && (load_manager.set_vox("cactus", t), load_manager.set_status("cactus", !0))
    })
}), load_manager.set_loader("ptero", ["ground", "cactus"], function () {
    let e = new vox.Parser,
        t = [];
    for (let s = 0; s <= 5; s++) e.parse(config.base_path + "objects/ptero/" + s + ".vox").then(function (e) {
        let i = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            a = new THREE.MeshLambertMaterial;
        a.map = vox.MeshBuilder.textureFactory.getTexture(e), i.material = a, t[s] = i, t.length - 1 == 5 && (load_manager.set_vox("ptero", t), load_manager.set_status("ptero", !0))
    })
}), load_manager.set_loader("rocks", ["ground"], function () {
    let e = new vox.Parser,
        t = [];
    for (let s = 0; s <= 4; s++) e.parse(config.base_path + "objects/rocks/" + s + ".vox").then(function (e) {
        let i = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            a = new THREE.MeshLambertMaterial;
        a.map = vox.MeshBuilder.textureFactory.getTexture(e), i.material = a, t[s] = i, t.length - 1 == 4 && (load_manager.set_vox("rocks", t), load_manager.set_status("rocks", !0))
    })
}), load_manager.set_loader("flowers", ["ground"], function () {
    let e = new vox.Parser,
        t = [];
    for (let s = 0; s <= 2; s++) e.parse(config.base_path + "objects/flowers/" + s + ".vox").then(function (e) {
        let i = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            a = new THREE.MeshLambertMaterial;
        a.map = vox.MeshBuilder.textureFactory.getTexture(e), i.material = a, t[s] = i, t.length - 1 == 2 && (load_manager.set_vox("flowers", t), load_manager.set_status("flowers", !0))
    })
}), load_manager.set_loader("misc", ["ground"], function () {
    let e = new vox.Parser,
        t = [],
        s = ["tumbleweed", "cactus/0", "cactus/1", "cactus/2", "cactus/3", "cactus/4", "cactus/5", "desert_skull", "scorpion", "rocks/0", "rocks/1", "rocks/2", "rocks/3", "rocks/4", "flowers/0", "flowers/1", "flowers/2", "trees/dead", "trees/green", "fish/0", "fish/1", "fish/2", "seaweed"];
    for (let i = 0; i < s.length; i++) e.parse(config.base_path + "objects/misc/" + s[i] + ".vox").then(function (e) {
        let a = new vox.MeshBuilder(e, {
                voxelSize: .1
            }),
            o = new THREE.MeshLambertMaterial;
        o.map = vox.MeshBuilder.textureFactory.getTexture(e), a.material = o, a.misc_type = s[i], t[i] = a, t.length == s.length && (load_manager.set_vox("misc", t), load_manager.set_status("misc", !0))
    })
}), load_manager.set_loader("t_ground", [], function () {
    let e = new THREE.TextureLoader,
        t = {
            top: null
        };
    e.load(config.base_path + "textures/ground_top.png", function (e) {
        e.magFilter = THREE.NearestFilter, e.wrapS = e.wrapT = THREE.RepeatWrapping, e.offset.set(0, 0), e.repeat.set(2, 1), t.top = e, load_manager.set_texture("t_ground", t), load_manager.set_status("t_ground", !0)
    })
});

class EffectsManager {
    constructor() {
        this.daytime = {
            is_day: !0,
            duration: {
                day: 60,
                night: 20
            },
            transition: {
                active: !1,
                duration: 5,
                step: 1 / 30,
                clock: new THREE.Clock
            },
            intensity: {
                day: {
                    ambient: ALight.intensity,
                    direct: DLight.intensity,
                    shadow_radius: 1
                },
                night: {
                    ambient: 0,
                    direct: .1,
                    shadow_radius: 10
                }
            },
            fog: {
                day: {
                    color: [.91, .7, .32]
                },
                night: {
                    color: [.24, .4, .55]
                },
                diff_cache: null
            },
            background: {
                day: {
                    color: [.91, .7, .32]
                },
                night: {
                    color: [.24, .4, .55]
                },
                diff_cache: null
            },
            clock: new THREE.Clock
        }, config.renderer.effects || (this.update = function () {
        })
    }

    changeDaytime(e = "day") {
        this.daytime.is_day = "day" == e, this.daytime.clock.stop(), this.daytime.clock.elapsedTime = 0, this.daytime.clock.start(), this.stepTransition(!this.daytime.is_day, 1, 1)
    }

    stepTransition(e = !0, t, s) {
        let i = t / s;
        e ? 1 === i ? (ALight.intensity = this.daytime.intensity.night.ambient, DLight.intensity = this.daytime.intensity.night.direct, scene.fog.color.setRGB(this.daytime.fog.night.color[0], this.daytime.fog.night.color[1], this.daytime.fog.night.color[2]), scene.background.setRGB(this.daytime.background.night.color[0], this.daytime.background.night.color[1], this.daytime.background.night.color[2]), DLight.shadow.radius = this.daytime.intensity.night.shadow_radius) : (ALight.intensity = parseFloat((ALight.intensity - (this.daytime.intensity.day.ambient - this.daytime.intensity.night.ambient) * i).toFixed(5)), DLight.intensity = parseFloat((DLight.intensity - (this.daytime.intensity.day.direct - this.daytime.intensity.night.direct) * i).toFixed(5)), scene.fog.color.sub(this.daytime.fog.diff_cache), scene.background.sub(this.daytime.background.diff_cache), DLight.shadow.radius = parseFloat((DLight.shadow.radius - (this.daytime.intensity.night.shadow_radius - this.daytime.intensity.day.shadow_radius) * i).toFixed(5))) : 1 === i ? (ALight.intensity = this.daytime.intensity.day.ambient, DLight.intensity = this.daytime.intensity.day.direct, scene.fog.color.setRGB(this.daytime.fog.day.color[0], this.daytime.fog.day.color[1], this.daytime.fog.day.color[2]), scene.background.setRGB(this.daytime.background.day.color[0], this.daytime.background.day.color[1], this.daytime.background.day.color[2]), DLight.shadow.radius = this.daytime.intensity.day.shadow_radius) : (ALight.intensity = parseFloat((ALight.intensity + (this.daytime.intensity.day.ambient - this.daytime.intensity.night.ambient) * i).toFixed(5)), DLight.intensity = parseFloat((DLight.intensity + (this.daytime.intensity.day.direct - this.daytime.intensity.night.direct) * i).toFixed(5)), scene.fog.color.add(this.daytime.fog.diff_cache), scene.background.add(this.daytime.background.diff_cache), DLight.shadow.radius = parseFloat((DLight.shadow.radius + (this.daytime.intensity.night.shadow_radius - this.daytime.intensity.day.shadow_radius) * i).toFixed(5))), this.daytime.transition.steps_done = parseFloat((this.daytime.transition.steps_done + t).toFixed(5))
    }

    startTransition(e, t) {
        let s = e / t;
        this.daytime.transition.active = !0, this.daytime.transition.clock.elapsedTime = 0, this.daytime.transition.clock.start(), this.daytime.transition.steps_done = 0, this.daytime.fog.diff_cache = new THREE.Color, this.daytime.fog.diff_cache.setRGB(parseFloat((this.daytime.fog.day.color[0] - this.daytime.fog.night.color[0]) * s), parseFloat((this.daytime.fog.day.color[1] - this.daytime.fog.night.color[1]) * s), parseFloat((this.daytime.fog.day.color[2] - this.daytime.fog.night.color[2]) * s)), this.daytime.background.diff_cache = new THREE.Color, this.daytime.background.diff_cache.setRGB(parseFloat((this.daytime.background.day.color[0] - this.daytime.background.night.color[0]) * s), parseFloat((this.daytime.background.day.color[1] - this.daytime.background.night.color[1]) * s), parseFloat((this.daytime.background.day.color[2] - this.daytime.background.night.color[2]) * s))
    }

    stopTransition() {
        this.daytime.transition.active = !1, this.daytime.transition.clock.stop(), this.daytime.transition.clock.elapsedTime = 0, this.daytime.transition.steps_done = 0
    }

    reset() {
        this.stopTransition(), this.changeDaytime("day")
    }

    pause() {
        this.pause_time = this.daytime.clock.getElapsedTime(), this.daytime.clock.stop(), this.daytime.transition.active && (this.pause_transition_time = this.daytime.transition.clock.getElapsedTime(), this.daytime.transition.clock.stop())
    }

    resume() {
        this.daytime.clock.start(), this.daytime.clock.elapsedTime = this.pause_time, this.daytime.transition.active && (this.daytime.transition.clock.start(), this.daytime.transition.clock.elapsedTime = this.pause_transition_time)
    }

    update(e) {
        this.daytime.is_day ? this.daytime.transition.active ? this.daytime.transition.steps_done < this.daytime.transition.duration ? this.daytime.transition.clock.getElapsedTime() > this.daytime.transition.step + this.daytime.transition.steps_done && this.stepTransition(!0, this.daytime.transition.step, this.daytime.transition.duration) : (this.stopTransition(), this.changeDaytime("night")) : this.daytime.clock.getElapsedTime() > this.daytime.duration.day && this.startTransition(this.daytime.transition.step, this.daytime.transition.duration) : this.daytime.transition.active ? this.daytime.transition.steps_done < this.daytime.transition.duration ? this.daytime.transition.clock.getElapsedTime() > this.daytime.transition.step + this.daytime.transition.steps_done && this.stepTransition(!1, this.daytime.transition.step, this.daytime.transition.duration) : (this.stopTransition(), this.changeDaytime("day")) : this.daytime.clock.getElapsedTime() > this.daytime.duration.night && this.startTransition(this.daytime.transition.step, this.daytime.transition.duration)
    }
}

let effects = new EffectsManager;

class GameManager {
    constructor(e) {
        this.isPlaying = !1, this.isPaused = !1, this.isFirstStart = !0, this.lastTimeDelta = !1, this.interface = e, this.starter = null, this.stats = null
    }

    init() {
        this.interface.init(), visibly.visibilitychange(this.tabVisibilityChanged), window.onload = function () {
            load_manager.load_all(function () {
                game.interface.other.preloader.classList.add("hidden"), config.debug ? game.interface.btnStartClick() : (game.interface.buttons.start.classList.remove("hidden"), game.setStarter())
            }, function () {
                let e = load_manager.getLoadPercentage();
                game.interface.indicators.load.classList.add("bar-" + e)
            })
        }, config.debug && (enemy.config.enable_collisions = !1, input.addKeyCallback("debug_speedup", "justPressed", function () {
            enemy.increase_velocity(1)
        }), enemy.increase_velocity(10))
    }

    setStarter(e = 600) {
        this.starter || (this.starter = input.addKeyCallback("space", "justPressed", function () {
            game.starter = null, audio.play("jump"), e > 0 ? (game.interface.other.overlay.classList.add("before-start"), setTimeout(function () {
                game.interface.btnStartClick()
            }, e)) : game.interface.btnRestartClick()
        }, 1))
    }

    cancelStarter() {
        this.starter && (input.removeKeyCallback("space", this.starter), this.starter = null)
    }

    async start() {
        if (this.isPlaying) return !1;
        this.isPlaying = !0, enemy.increase_velocity(15, !0), score.set(0), nature.initGround(), nature.initEarth(), nature.initGroundDecoration("first", -17.3, nature.cache.earth.box.max.y), nature.initGroundDecoration("second", -29.5, nature.cache.earth.box.max.y + 1.6), nature.initGroundDecoration("third", -42, nature.cache.earth.box.max.y + 3.2, !1), nature.ground_chunks_decoration_levels.playground = {
            x: 0,
            y: nature.cache.ground.box.max.y,
            box: nature.cache.ground.box
        }, nature.ground_chunks_decoration_levels.water = {
            x: -9,
            y: nature.cache.earth.box.max.y,
            box: nature.cache.earth.box
        }, nature.ground_chunks_decoration_levels.water2 = {
            x: -9,
            y: nature.cache.earth.box.max.y,
            box: nature.cache.earth.box
        }, nature.ground_chunks_decoration_levels.empty = {
            x: 7,
            y: nature.cache.earth.box.max.y,
            box: nature.cache.earth.box
        }, nature.config.levels.first.spawn = load_manager.get_certain_mesh("misc", ["tumbleweed", "cactus", "desert_skull", "scorpion", "rocks", "flowers"], "misc_type", !0), nature.config.levels.second.spawn = load_manager.get_certain_mesh("misc", ["tumbleweed", "desert_skull", "scorpion", "rocks", "flowers", "trees"], "misc_type", !0), nature.config.levels.third.spawn = load_manager.get_certain_mesh("misc", ["tumbleweed", "trees"], "misc_type", !0), nature.config.levels.playground.spawn = load_manager.get_certain_mesh("misc", ["desert_skull", "rocks", "flowers"], "misc_type", !0), nature.config.levels.water.spawn = load_manager.get_certain_mesh("misc", ["fish"], "misc_type", !0), nature.config.levels.water2.spawn = load_manager.get_certain_mesh("misc", ["seaweed", "rocks"], "misc_type", !0), nature.config.levels.empty.spawn = load_manager.get_certain_mesh("misc", ["desert_skull", "flowers", "rocks", "tumbleweed"], "misc_type", !0), nature.initWater(), await nature.initMisc(), player.init(), enemy.init(), audio.play("bg"), this.cancelStarter(), clock.getDelta(), this.render(), this.loop(), visibly.hidden() && this.pause()
    }

    stop() {
        if (!this.isPlaying) return !1;
        this.isPlaying = !1, dynoDustEmitter.removeAllParticles(), dynoDustEmitter.stopEmit(), dynoDustEmitter.dead = !0, audio.stop("bg"), this.interface.buttons.restart.classList.remove("hidden"), player.deathFrame(), audio.play("killed"), this.setStarter(0)
    }

    pause() {
        if (!this.isPlaying) return !1;
        this.isPaused = !0, this.isPlaying = !1, audio.pause("bg")
    }

    resume() {
        if (!this.isPaused) return !1;
        this.isPlaying = !0, this.isPaused = !1, audio.resume("bg"), clock.getDelta(), this.render(), this.loop()
    }

    reset() {
        enemy.increase_velocity(13, !0), enemy.reset(), nature.reset(), score.reset(), player.reset(), effects.reset(), this.render()
    }

    restart() {
        this.isPlaying && this.stop(), this.reset(), this.start()
    }

    render() {
        let e = clock.getDelta();
        e > .15 && (e = .15), config.camera.controls && controls.update(), player.update(e), enemy.update(e), nature.update(e), input.update(), effects.update(e), nebulaSystem.update(), config.renderer.postprocessing.enable ? composer.render(e) : renderer.render(scene, camera), score.update(e)
    }

    tabVisibilityChanged(e) {
        "visible" == e ? (logs.log("GAME RESUME"), game.isPaused && (game.resume(), effects.resume())) : (logs.log("GAME PAUSE"), game.isPlaying && (game.pause(), effects.pause()))
    }

    loop() {
        if (!this.isPlaying) return !1;
        requestAnimationFrame(function () {
            game.loop()
        }), this.render()
    }
}

class InterfaceManager {
    constructor() {
        this.buttons = {
            start: document.getElementById("game-start"),
            restart: document.getElementById("game-restart")
        }, this.indicators = {
            load: document.getElementById("game-load-progress")
        }, this.other = {
            preloader: document.getElementById("preloader"),
            overlay: document.getElementById("chrome-no-internet")
        }
    }

    init() {
        this.buttons.start.addEventListener("click", this.btnStartClick), this.buttons.restart.addEventListener("click", this.btnRestartClick)
    }

    btnStartClick(e) {
        game.interface.buttons.start.display = "none", document.body.classList.add("game-started"), game.start()
    }

    btnRestartClick(e) {
        game.interface.buttons.restart.classList.add("hidden"), game.restart()
    }
}

let game = new GameManager(new InterfaceManager);
game.init();