/**
 * ═══════════════════════════════════════════════════════
 *  ARCADE PORTAL — Sound Engine v2.0
 *  Web Audio API procedural sounds for all games.
 *
 *  Usage:  ArcadeSound.play('click')
 *          ArcadeSound.setVolume(0.5)   // 0–1
 *          ArcadeSound.toggleMute()
 *
 *  localStorage keys:
 *    portal_volume  (0-100, default 40)
 *    portal_muted   ('true'/'false')
 * ═══════════════════════════════════════════════════════
 */
(function (global) {
    'use strict';

    // ── Context & state ────────────────────────────────────
    let _ctx        = null;
    let _master     = null;
    let _muted      = false;
    let _volume     = 0.4;

    function _loadSettings() {
        const v = localStorage.getItem('portal_volume');
        const m = localStorage.getItem('portal_muted');
        _volume = v !== null ? parseInt(v) / 100 : 0.4;
        _muted  = m === 'true';
    }
    _loadSettings();

    function _getCtx() {
        if (!_ctx) {
            _ctx    = new (window.AudioContext || window.webkitAudioContext)();
            _master = _ctx.createGain();
            _master.gain.value = _muted ? 0 : _volume;
            _master.connect(_ctx.destination);
        }
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    }

    function _syncVol() {
        if (_master) _master.gain.value = _muted ? 0 : _volume;
    }

    // ── Primitives ─────────────────────────────────────────

    /** Single oscillator with optional frequency sweep. */
    function _osc(freq, tStart, tEnd, type, vol, freqEnd) {
        const ctx  = _getCtx();
        const t0   = ctx.currentTime;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(_master);
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0 + tStart);
        if (freqEnd !== undefined)
            osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + tEnd);
        gain.gain.setValueAtTime(vol * 0.65, t0 + tStart);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + tEnd);
        osc.start(t0 + tStart);
        osc.stop(t0 + tEnd + 0.01);
    }

    /** White-noise burst through a bandpass filter. */
    function _noise(tStart, dur, vol, centerFreq) {
        const ctx  = _getCtx();
        const buf  = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src  = ctx.createBufferSource();
        src.buffer = buf;
        const flt  = ctx.createBiquadFilter();
        flt.type           = 'bandpass';
        flt.frequency.value = centerFreq || 800;
        flt.Q.value         = 0.8;
        const gain = ctx.createGain();
        src.connect(flt); flt.connect(gain); gain.connect(_master);
        gain.gain.setValueAtTime(vol * 0.55, ctx.currentTime + tStart);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tStart + dur);
        src.start(ctx.currentTime + tStart);
        src.stop(ctx.currentTime + tStart + dur + 0.01);
    }

    // ── Sound library ──────────────────────────────────────

    const S = {
        // ── UI ─────────────────────────────────────────────
        click: () => {
            _osc(800, 0, 0.05, 'square', 0.14);
        },
        navigate: () => {
            _osc(440, 0,    0.08, 'sine', 0.12);
            _osc(660, 0.06, 0.14, 'sine', 0.08);
        },
        notification: () => {
            _osc(880,  0,    0.10, 'sine', 0.15);
            _osc(1100, 0.12, 0.22, 'sine', 0.12);
        },
        success: () => {
            [[523,0],[659,0.10],[784,0.20]].forEach(([f,t]) => _osc(f, t, t+0.18, 'sine', 0.20));
        },
        fail: () => {
            [[400,0],[320,0.12],[250,0.24]].forEach(([f,t]) => _osc(f, t, t+0.15, 'sawtooth', 0.18));
        },
        achievement: () => {
            [[523,0],[659,0.09],[784,0.18],[1047,0.27],[784,0.40],[1047,0.50]].forEach(([f,t]) => _osc(f, t, t+0.16, 'sine', 0.20));
        },
        levelup: () => {
            [[392,0],[523,0.10],[659,0.20],[784,0.30],[1047,0.40]].forEach(([f,t]) => _osc(f, t, t+0.18, 'sine', 0.22));
        },
        claim: () => {
            [[523,0],[784,0.06],[1047,0.12]].forEach(([f,t]) => _osc(f, t, t+0.12, 'sine', 0.18));
        },
        error: () => {
            _osc(200, 0, 0.15, 'sawtooth', 0.18);
            _osc(150, 0.12, 0.28, 'sawtooth', 0.14);
        },

        // ── Gameplay universal ──────────────────────────────
        coin: () => {
            _osc(1200, 0,    0.10, 'sine', 0.25, 900);
            _osc(1600, 0.04, 0.12, 'sine', 0.12);
        },
        merge: () => {
            _noise(0, 0.12, 0.18, 500);
            _osc(880, 0.08, 0.22, 'sine', 0.20);
        },
        eat: () => {
            _osc(600, 0, 0.08, 'sine', 0.20, 900);
        },
        powerup: () => {
            _osc(440, 0, 0.40, 'sine', 0.18, 1320);
            _osc(550, 0.05, 0.35, 'sine', 0.12, 1650);
        },
        evolve: () => {
            _noise(0, 0.35, 0.28, 300);
            [[523,0.20],[659,0.35],[784,0.50]].forEach(([f,t]) => _osc(f, t, t+0.25, 'sine', 0.22));
        },
        boss: () => {
            _osc(80,  0, 0.80, 'sawtooth', 0.28, 40);
            _osc(160, 0, 0.50, 'square',   0.14);
            [[1047,0.50],[880,0.70],[784,0.90],[659,1.10]].forEach(([f,t]) => _osc(f, t, t+0.20, 'sine', 0.20));
            _noise(0.20, 0.40, 0.22, 100);
        },
        gameover: () => {
            [[392,0],[330,0.25],[294,0.50],[220,0.75]].forEach(([f,t]) => _osc(f, t, t+0.22, 'sine', 0.22));
            _osc(120, 0.60, 1.20, 'sawtooth', 0.16, 80);
        },
        jackpot: () => {
            [523,659,784,1047,1319,1047,1319,1568].forEach((f,i) => _osc(f, i*0.22, i*0.22+0.28, 'sine', 0.22));
            _noise(0, 0.50, 0.22, 200);
        },
        bingo: () => {
            [[784,0],[880,0.18],[988,0.36],[1047,0.54],[1319,0.72]].forEach(([f,t]) => _osc(f, t, t+0.22, 'sine', 0.20));
        },

        // ── Tower Rush ──────────────────────────────────────
        shot_fire:   () => { _osc(220, 0, 0.06, 'sawtooth', 0.12, 110); },
        shot_ice:    () => { _osc(880, 0, 0.08, 'sine',     0.10, 1200); },
        shot_storm:  () => { _noise(0, 0.08, 0.14, 800); _osc(440, 0, 0.06, 'square', 0.08); },
        shot_shadow: () => { _osc(200, 0, 0.10, 'sawtooth', 0.12, 80); },
        shot_light:  () => { _osc(1400, 0, 0.06, 'sine', 0.10); _osc(1800, 0, 0.04, 'sine', 0.06); },
        shot_nova:   () => { _noise(0, 0.05, 0.14, 1200); _osc(660, 0.02, 0.08, 'sine', 0.10); },
        enemy_hit:   () => { _osc(300, 0, 0.06, 'square', 0.10, 200); },
        enemy_kill:  () => { _osc(350, 0, 0.10, 'sine', 0.14, 150); _osc(500, 0.05, 0.12, 'sine', 0.10); },
        boss_kill:   () => {
            _noise(0, 0.30, 0.28, 150);
            [[200,0],[300,0.10],[400,0.20],[600,0.30]].forEach(([f,t]) => _osc(f, t, t+0.15, 'sine', 0.20));
        },
        base_hit: () => {
            [0, 0.15, 0.30].forEach(t => { _osc(150, t, t+0.12, 'sawtooth', 0.24); _osc(220, t, t+0.10, 'square', 0.14); });
        },
        wave_start: () => {
            [[330,0],[440,0.12],[550,0.24]].forEach(([f,t]) => _osc(f, t, t+0.16, 'sine', 0.18));
        },
        wave_clear: () => {
            [[523,0],[659,0.10],[784,0.20],[1047,0.30],[784,0.42],[1047,0.52]].forEach(([f,t]) => _osc(f, t, t+0.16, 'sine', 0.20));
        },
        boss_warning: () => {
            [[880,0],[440,0.20],[880,0.40],[440,0.60]].forEach(([f,t]) => _osc(f, t, t+0.18, 'square', 0.20));
        },
        early_wave: () => {
            _osc(660, 0, 0.12, 'sine', 0.15);
            _osc(880, 0.10, 0.22, 'sine', 0.12);
        },
        level_complete: () => {
            [[523,0],[659,0.10],[784,0.20],[1047,0.30],[1319,0.40]].forEach(([f,t]) => _osc(f, t, t+0.20, 'sine', 0.22));
            _noise(0, 0.20, 0.18, 600);
        },
        victory: () => {
            [523,659,784,1047,1319,1047,1319,1568].forEach((f,i) => _osc(f, i*0.15, i*0.15+0.20, 'sine', 0.22));
        },
        buy:     () => { _osc(660, 0, 0.10, 'sine', 0.15); _osc(880, 0.08, 0.18, 'sine', 0.10); },
        sell:    () => { _osc(880, 0, 0.10, 'sine', 0.15, 660); },
        upgrade: () => { [[440,0],[550,0.08],[660,0.16],[880,0.24]].forEach(([f,t]) => _osc(f, t, t+0.12, 'sine', 0.18)); },
        tornado: () => { _noise(0, 0.50, 0.28, 200); _osc(200, 0, 0.50, 'sawtooth', 0.14, 50); },
        freeze:  () => { _osc(1800, 0, 0.40, 'sine', 0.14, 600); _noise(0, 0.25, 0.14, 2000); },
        airstrike: () => {
            _noise(0, 0.10, 0.18, 600);
            _osc(100, 0.10, 0.50, 'sawtooth', 0.28, 30);
            _noise(0.15, 0.30, 0.32, 150);
        },
        synergy: () => {
            [[660,0],[880,0.06],[1100,0.12],[1320,0.18]].forEach(([f,t]) => _osc(f, t, t+0.12, 'sine', 0.20));
            _noise(0, 0.15, 0.18, 1500);
        },

        // ── Gacha / shop ────────────────────────────────────
        pull: () => {
            _osc(440, 0, 0.15, 'sine', 0.18, 880);
            setTimeout(() => S.success(), 150);
        },
        pull_legendary: () => {
            _noise(0, 0.30, 0.28, 400);
            [523,659,784,1047,1319,1568].forEach((f,i) => _osc(f, i*0.12, i*0.12+0.18, 'sine', 0.22));
        },
    };

    // ── Public API ─────────────────────────────────────────

    const ArcadeSound = {
        /**
         * Play a named sound.
         * @param {string} name
         */
        play(name) {
            if (_muted) return;
            try {
                _getCtx();
                if (S[name]) S[name]();
            } catch (e) { /* silent fail */ }
        },

        /** Set master volume (0–1). */
        setVolume(v) {
            _volume = Math.max(0, Math.min(1, v));
            localStorage.setItem('portal_volume', String(Math.round(_volume * 100)));
            _syncVol();
            // Track for Sound Master achievement
            const cnt = parseInt(localStorage.getItem('portal_volume_changes') || '0') + 1;
            localStorage.setItem('portal_volume_changes', String(cnt));
        },

        /** Set mute state explicitly. */
        setMuted(m) {
            _muted = !!m;
            localStorage.setItem('portal_muted', String(_muted));
            _syncVol();
        },

        /** Toggle mute on/off. Returns new muted state. */
        toggleMute() {
            this.setMuted(!_muted);
            return _muted;
        },

        isMuted()   { return _muted;   },
        getVolume() { return _volume;  },

        /** Re-read localStorage (call after settings change). */
        reload() {
            _loadSettings();
            _syncVol();
        },
    };

    global.ArcadeSound = ArcadeSound;

    // Backward-compat shim: exposes playSound() for games that call it directly,
    // but only if the game hasn't defined its own (e.g. tower-rush has its own).
    if (typeof global.playSound === 'undefined') {
        global.playSound = (name) => ArcadeSound.play(name);
    }

})(window);
