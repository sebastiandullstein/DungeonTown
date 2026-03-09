// Audio System — procedural SFX + ambient music via Web Audio API
const Audio = {
    ctx: null,
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.4,
    muted: false,
    _currentMusic: null,
    _musicGain: null,
    _noiseBuffer: null,

    _ensureContext() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return true;
        }
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._musicGain = this.ctx.createGain();
            this._musicGain.gain.value = this.musicVolume * this.masterVolume;
            this._musicGain.connect(this.ctx.destination);
            // Pre-generate white noise buffer
            const sr = this.ctx.sampleRate;
            this._noiseBuffer = this.ctx.createBuffer(1, sr * 2, sr);
            const data = this._noiseBuffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            return true;
        } catch (e) {
            return false;
        }
    },

    _vol() {
        return this.muted ? 0 : this.sfxVolume * this.masterVolume;
    },

    _osc(type, freq, duration, gainVal, freqEnd) {
        if (!this._ensureContext()) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (freqEnd !== undefined) osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
        gain.gain.setValueAtTime(gainVal * this._vol(), t);
        gain.gain.linearRampToValueAtTime(0, t + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
    },

    play(sfx) {
        if (this.muted) return;
        if (!this._ensureContext()) return;
        const t = this.ctx.currentTime;
        switch (sfx) {
            case 'playerAttack': this._playAttack(t); break;
            case 'playerHurt':   this._playHurt(t); break;
            case 'enemyDeath':   this._playEnemyDeath(t); break;
            case 'chestOpen':    this._playChestOpen(t); break;
            case 'levelUp':      this._playLevelUp(t); break;
            case 'buildComplete': this._playBuildComplete(t); break;
            case 'playerDeath':  this._playPlayerDeath(t); break;
            case 'deathJingle':  this._playDeathJingle(t); break;
            case 'villageReturn': this._playVillageReturn(t); break;
            case 'bossEncounter': this._playBossEncounter(t); break;
        }
    },

    _playAttack(t) {
        const v = this._vol() * 0.3;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.08);
        gain.gain.setValueAtTime(v, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.08);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.09);
    },

    _playHurt(t) {
        const v = this._vol() * 0.35;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.12);
        gain.gain.setValueAtTime(v, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.12);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.13);
    },

    _playEnemyDeath(t) {
        const v = this._vol() * 0.25;
        // Noise burst
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._noiseBuffer;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(v, t);
        nGain.gain.linearRampToValueAtTime(0, t + 0.1);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        noise.connect(filter); filter.connect(nGain); nGain.connect(this.ctx.destination);
        noise.start(t); noise.stop(t + 0.11);
        // Low crunch
        const osc = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.1);
        g2.gain.setValueAtTime(v * 0.6, t);
        g2.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.connect(g2); g2.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.11);
    },

    _playChestOpen(t) {
        const v = this._vol() * 0.25;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
        gain.gain.setValueAtTime(v, t);
        gain.gain.setValueAtTime(v * 0.8, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.21);
    },

    _playLevelUp(t) {
        const v = this._vol() * 0.2;
        const notes = [262, 330, 392]; // C-E-G
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.15;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(v, start + 0.05);
            gain.gain.setValueAtTime(v, start + 0.2);
            gain.gain.linearRampToValueAtTime(0, start + 0.4);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(start); osc.stop(start + 0.41);
        });
    },

    _playBuildComplete(t) {
        const v = this._vol() * 0.2;
        [262, 392].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(v, t);
            gain.gain.setValueAtTime(v * 0.7, t + 0.2);
            gain.gain.linearRampToValueAtTime(0, t + 0.4);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t); osc.stop(t + 0.41);
        });
    },

    _playPlayerDeath(t) {
        const v = this._vol() * 0.35;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);
        gain.gain.setValueAtTime(v, t);
        gain.gain.linearRampToValueAtTime(v * 0.5, t + 0.4);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.81);
    },

    _playDeathJingle(t) {
        // Dramatic descending minor chord death jingle
        const v = this._vol() * 0.25;
        const notes = [
            { freq: 392, delay: 0,    dur: 0.6 },   // G4
            { freq: 349, delay: 0.15, dur: 0.5 },   // F4
            { freq: 311, delay: 0.3,  dur: 0.6 },   // Eb4
            { freq: 233, delay: 0.5,  dur: 1.2 },   // Bb3 (low, held)
        ];
        for (const n of notes) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.freq, t + n.delay);
            osc.frequency.linearRampToValueAtTime(n.freq * 0.97, t + n.delay + n.dur);
            gain.gain.setValueAtTime(v, t + n.delay);
            gain.gain.setValueAtTime(v * 0.8, t + n.delay + n.dur * 0.3);
            gain.gain.linearRampToValueAtTime(0, t + n.delay + n.dur);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t + n.delay); osc.stop(t + n.delay + n.dur + 0.01);
        }
        // Low rumble underneath
        const rumble = this.ctx.createOscillator();
        const rGain = this.ctx.createGain();
        rumble.type = 'sawtooth';
        rumble.frequency.setValueAtTime(55, t);
        rumble.frequency.exponentialRampToValueAtTime(30, t + 1.8);
        rGain.gain.setValueAtTime(v * 0.4, t);
        rGain.gain.linearRampToValueAtTime(0, t + 1.8);
        rumble.connect(rGain); rGain.connect(this.ctx.destination);
        rumble.start(t); rumble.stop(t + 1.81);
    },

    _playVillageReturn(t) {
        // Warm ascending chime — relief after death
        const v = this._vol() * 0.2;
        const notes = [
            { freq: 262, delay: 0,    dur: 0.4 },   // C4
            { freq: 330, delay: 0.15, dur: 0.4 },   // E4
            { freq: 392, delay: 0.3,  dur: 0.6 },   // G4
            { freq: 523, delay: 0.5,  dur: 0.8 },   // C5 (resolve)
        ];
        for (const n of notes) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = n.freq;
            gain.gain.setValueAtTime(v, t + n.delay);
            gain.gain.setValueAtTime(v * 0.7, t + n.delay + n.dur * 0.5);
            gain.gain.linearRampToValueAtTime(0, t + n.delay + n.dur);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t + n.delay); osc.stop(t + n.delay + n.dur + 0.01);
        }
    },

    _playBossEncounter(t) {
        const v = this._vol() * 0.2;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 55;
        // Pulsing gain envelope
        gain.gain.setValueAtTime(0, t);
        for (let i = 0; i < 4; i++) {
            gain.gain.linearRampToValueAtTime(v, t + i * 0.5 + 0.2);
            gain.gain.linearRampToValueAtTime(v * 0.15, t + i * 0.5 + 0.45);
        }
        gain.gain.linearRampToValueAtTime(0, t + 2.0);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 2.01);
    },

    // ── Ambient Music ────────────────────────────────────────────────────────

    startMusic(track) {
        if (!this._ensureContext()) return;
        this.stopMusic();
        const vol = this.muted ? 0 : this.musicVolume * this.masterVolume;
        this._musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this._musicGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.5);

        if (track === 'dungeon') {
            this._startDungeonMusic();
        } else if (track === 'village') {
            this._startVillageMusic();
        }
    },

    _startDungeonMusic() {
        const nodes = [];
        // Low drone
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 55;
        osc1.connect(this._musicGain);
        osc1.start();
        nodes.push(osc1);
        // Subtle overtone
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 82.5;
        const g2 = this.ctx.createGain();
        g2.gain.value = 0.3;
        osc2.connect(g2); g2.connect(this._musicGain);
        osc2.start();
        nodes.push(osc2);
        // Filtered noise for texture
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._noiseBuffer;
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        const nGain = this.ctx.createGain();
        nGain.gain.value = 0.08;
        noise.connect(filter); filter.connect(nGain); nGain.connect(this._musicGain);
        noise.start();
        nodes.push(noise);
        // LFO for amplitude modulation
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.15;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.15;
        lfo.connect(lfoGain); lfoGain.connect(this._musicGain.gain);
        lfo.start();
        nodes.push(lfo);
        this._currentMusic = nodes;
    },

    _startVillageMusic() {
        const nodes = [];
        // Warm pad
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 110;
        const g1 = this.ctx.createGain();
        g1.gain.value = 0.5;
        osc1.connect(g1); g1.connect(this._musicGain);
        osc1.start();
        nodes.push(osc1);
        // Detuned chorus
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 110.8;
        const g2 = this.ctx.createGain();
        g2.gain.value = 0.3;
        osc2.connect(g2); g2.connect(this._musicGain);
        osc2.start();
        nodes.push(osc2);
        // Fifth
        const osc3 = this.ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = 165;
        const g3 = this.ctx.createGain();
        g3.gain.value = 0.15;
        osc3.connect(g3); g3.connect(this._musicGain);
        osc3.start();
        nodes.push(osc3);
        this._currentMusic = nodes;
    },

    stopMusic() {
        if (this._currentMusic) {
            this._currentMusic.forEach(n => { try { n.stop(); } catch(e) {} });
            this._currentMusic = null;
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        if (this.ctx && this._musicGain) {
            this._musicGain.gain.setValueAtTime(
                this.muted ? 0 : this.musicVolume * this.masterVolume,
                this.ctx.currentTime
            );
        }
    },

    setVolume(master, sfx, music) {
        this.masterVolume = master;
        this.sfxVolume = sfx;
        this.musicVolume = music;
        if (this.ctx && this._musicGain && !this.muted) {
            this._musicGain.gain.setValueAtTime(
                this.musicVolume * this.masterVolume,
                this.ctx.currentTime
            );
        }
    },
};
