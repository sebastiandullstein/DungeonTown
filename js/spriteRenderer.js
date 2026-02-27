// SpriteRenderer — draws player, enemies, and items using canvas 2D API
// All functions take (ctx, x, y, w, h) = pixel coords of the tile cell

// Animation utility — frame helpers for procedural sprite animation
const AnimManager = {
    // Cyclic frame index: 8 FPS normal, 12 FPS combat
    frame(time, fps, count) {
        return Math.floor(time * fps) % count;
    },
    // Sine-wave phase (-1 to 1)
    phase(time, freq) {
        return Math.sin(time * freq);
    },
    // Attack bell curve: 0→1→0 over attack duration
    attackPulse(timer, delay) {
        if (delay <= 0) return 0;
        const t = 1 - Math.max(0, Math.min(1, timer / delay));
        return Math.sin(t * Math.PI);
    },
};

const SpriteRenderer = {

    // ─── PLAYER ─────────────────────────────────────────────────────────────

    drawPlayer(ctx, x, y, w, h, player, time) {
        time = time || 0;
        const isMoving = player.moveTimer > 0;
        const isAttacking = player.attacking && player.attackFrame < 3;

        // Idle/walk bob
        const bobY = isMoving ? Math.sin(time * 8) * 1.5 : Math.sin(time * 4) * 1;

        // Attack lunge offset
        let lungeX = 0, lungeY = 0;
        if (isAttacking) {
            const dir = player.attackDir || player.facing || { x: 1, y: 0 };
            const progress = Math.min(1, player.attackFrame / 2.5);
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - 2 * (1 - progress) * (1 - progress);
            lungeX = dir.x * ease * 4;
            lungeY = dir.y * ease * 4;
        }

        // Knockback visual offset
        let knockOffX = 0, knockOffY = 0;
        if (player.knockTimer > 0 && player.knockX !== undefined) {
            const kt = player.knockTimer / 0.15;
            knockOffX = player.knockX * kt * 32;
            knockOffY = player.knockY * kt * 32;
        }

        const groundY = y;
        y += bobY + lungeY + knockOffY;
        x += lungeX + knockOffX;

        const cx = x + w / 2;
        const cy = y + h / 2;
        const invuln = player.invulnTimer > 0;
        const fx = player.facing ? player.facing.x : 1;

        // Drop shadow (stays at ground level)
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, groundY + h - 4, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (alternate during walk)
        const legOff = isMoving ? Math.sin(time * 10) * 2 : 0;
        ctx.fillStyle = invuln ? '#aa5555' : '#3a2a50';
        ctx.fillRect(cx - 5, cy + 5 + legOff, 4, 9);
        ctx.fillRect(cx + 1, cy + 5 - legOff, 4, 9);

        // Boots
        ctx.fillStyle = invuln ? '#cc6666' : '#5a3818';
        ctx.fillRect(cx - 6, cy + 11 + legOff, 5, 5);
        ctx.fillRect(cx + 1, cy + 11 - legOff, 5, 5);

        // Torso (armour)
        const armourGrad = ctx.createLinearGradient(cx - 6, cy - 4, cx + 6, cy + 6);
        armourGrad.addColorStop(0, invuln ? '#dd8888' : '#c8a040');
        armourGrad.addColorStop(0.5, invuln ? '#bb6666' : '#a87828');
        armourGrad.addColorStop(1, invuln ? '#994444' : '#786018');
        ctx.fillStyle = armourGrad;
        ctx.fillRect(cx - 6, cy - 4, 12, 10);

        // Shoulder pads
        ctx.fillStyle = invuln ? '#cc6666' : '#888060';
        ctx.fillRect(cx - 8, cy - 4, 4, 4);
        ctx.fillRect(cx + 4, cy - 4, 4, 4);

        // Head
        const skinColor = invuln ? '#ffaaaa' : '#e8c880';
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 7, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        const helmGrad = ctx.createLinearGradient(cx, cy - 18, cx, cy - 10);
        helmGrad.addColorStop(0, invuln ? '#cc6666' : '#aaaaaa');
        helmGrad.addColorStop(1, invuln ? '#994444' : '#666666');
        ctx.fillStyle = helmGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - 11, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(cx - 7, cy - 13, 14, 4);

        // Helm visor
        ctx.fillStyle = invuln ? '#ff8888' : '#ffcc30';
        ctx.fillRect(cx - 5, cy - 12, 10, 2);

        // Eye
        ctx.fillStyle = invuln ? '#ff4040' : '#ffe080';
        ctx.fillRect(cx - 3 + fx * 2, cy - 9, 4, 2);

        // Sword (on dominant hand side)
        const sxOff = fx >= 0 ? 7 : -10;
        const swordGrad = ctx.createLinearGradient(cx + sxOff, cy - 8, cx + sxOff + 3, cy + 8);
        swordGrad.addColorStop(0, '#e8e8f0');
        swordGrad.addColorStop(0.5, '#c0c0d0');
        swordGrad.addColorStop(1, '#909090');
        ctx.fillStyle = swordGrad;
        ctx.fillRect(cx + sxOff, cy - 8, 3, 16); // blade

        // Crossguard
        ctx.fillStyle = '#c8a030';
        ctx.fillRect(cx + sxOff - 3, cy + 2, 9, 3);

        // Handle
        ctx.fillStyle = '#7a4820';
        ctx.fillRect(cx + sxOff, cy + 5, 3, 6);

        // Attack swing arc
        if (player.attacking && player.attackFrame < 3) {
            this._drawSwingArc(ctx, cx, cy, player);
        }
    },

    _drawSwingArc(ctx, cx, cy, player) {
        const progress = Math.min(1, player.attackFrame / 2.5);
        const dir = player.attackDir || player.facing || { x: 1, y: 0 };
        const baseAngle = Math.atan2(dir.y, dir.x) - Math.PI * 0.5;
        const swingSpan = Math.PI * 1.0;
        const endAngle = baseAngle + swingSpan * progress;

        const swingGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 26);
        swingGrad.addColorStop(0,   'rgba(255,240,100,0.7)');
        swingGrad.addColorStop(0.4, 'rgba(255,160,20,0.5)');
        swingGrad.addColorStop(1,   'rgba(255,80,0,0)');

        ctx.save();
        ctx.strokeStyle = swingGrad;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.7 * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(cx, cy, 20, baseAngle, endAngle);
        ctx.stroke();
        ctx.restore();
    },

    // ─── ENEMIES ────────────────────────────────────────────────────────────

    drawEnemy(ctx, x, y, w, h, enemy, time) {
        time = time || 0;
        const origY = y;
        const origX = x;

        // Knockback visual offset
        if (enemy.knockTimer > 0 && enemy.knockX !== undefined) {
            const kt = enemy.knockTimer / 0.15;
            x += enemy.knockX * kt * 32;
            y += enemy.knockY * kt * 32;
        }

        // Death animation: white flash + fade out
        if (enemy.hp <= 0 && enemy.deathTimer !== undefined) {
            const dt = enemy.deathTimer / 0.3; // 1→0 over 0.3s
            ctx.save();
            ctx.globalAlpha = dt;
            // White flash on first frames
            if (dt > 0.7) ctx.filter = `brightness(${1 + (dt - 0.7) * 10})`;
        }

        // Walk bob for chasing enemies
        if (enemy.state === 'chase' && enemy.hp > 0) {
            y += AnimManager.phase(time, 6) * 1;
        }

        // Attack lunge (brief upward lurch during strike)
        if (enemy.state === 'attack' && enemy.attackTimer > 0 && enemy.hp > 0) {
            y -= AnimManager.attackPulse(enemy.attackTimer, enemy.attackDelay) * 3;
        }

        const cx = x + w / 2;
        const cy = y + h / 2;

        // Drop shadow (stays at ground level)
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(origX + w / 2, origY + h - 4, 7, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Boss: draw glow aura behind sprite
        if (enemy.isBoss) {
            const auraColor = enemy.isFinalBoss ? 'rgba(255,0,68,0.25)' :
                              enemy.isMajorBoss ? 'rgba(255,80,0,0.2)'  :
                                                  'rgba(255,180,0,0.15)';
            ctx.fillStyle = auraColor;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        switch (enemy.type) {
            case 'rat':      this._drawRat(ctx, x, y, w, h, cx, cy, time); break;
            case 'bat':      this._drawBat(ctx, x, y, w, h, cx, cy, time); break;
            case 'skeleton': this._drawSkeleton(ctx, x, y, w, h, cx, cy, time); break;
            case 'orc':      this._drawOrc(ctx, x, y, w, h, cx, cy); break;
            case 'cursed':   this._drawCursedKnight(ctx, x, y, w, h, cx, cy); break;
            case 'stone':    this._drawGolem(ctx, x, y, w, h, cx, cy); break;
            case 'lich':     this._drawLich(ctx, x, y, w, h, cx, cy); break;
            case 'inferno':  this._drawDragon(ctx, x, y, w, h, cx, cy, time); break;
            case 'warlord':  this._drawOrc(ctx, x, y, w, h, cx, cy); break;
            case 'vampire':  this._drawVampire(ctx, x, y, w, h, cx, cy); break;
            case 'shadow':   this._drawDragon(ctx, x, y, w, h, cx, cy, time); break;
            case 'chaos':    this._drawChaos(ctx, x, y, w, h, cx, cy); break;
            case 'demon':    this._drawDemon(ctx, x, y, w, h, cx, cy, time); break;
            case 'malphas':  this._drawDemonLord(ctx, x, y, w, h, cx, cy, time, enemy); break;
            case 'dragon':   this._drawDragon(ctx, x, y, w, h, cx, cy, time); break;
            default:         this._drawGeneric(ctx, cx, cy, enemy.fg || '#888'); break;
        }

        // End death animation context
        if (enemy.hp <= 0 && enemy.deathTimer !== undefined) {
            ctx.restore();
        }

        // HP bar at original position (not affected by animation bob)
        if (enemy.hp > 0 && (enemy.isBoss || enemy.hp < enemy.maxHp)) {
            this._drawHPBar(ctx, origX, origY, w, enemy.hp / enemy.maxHp, enemy.isBoss);
        }

        // Boss name label at original position
        if (enemy.isBoss && enemy.hp > 0) {
            ctx.fillStyle = enemy.isFinalBoss ? '#ff0044' : '#ffaa00';
            ctx.font = 'bold 7px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.name, origX + w / 2, origY - 2);
            ctx.textAlign = 'left';
        }
    },

    _drawHPBar(ctx, x, y, w, pct, isBoss = false) {
        const bh = isBoss ? 5 : 3;
        const bw = isBoss ? w + 4 : w - 4;
        const bx = isBoss ? x - 2 : x + 2;
        const by = isBoss ? y - 1 : y + 1;
        ctx.fillStyle = '#400a0a';
        ctx.fillRect(bx, by, bw, bh);
        const fill = pct > 0.5 ? '#20c020' : pct > 0.25 ? '#c0c020' : '#c02020';
        ctx.fillStyle = fill;
        ctx.fillRect(bx, by, Math.max(1, Math.floor(bw * pct)), bh);
        if (isBoss) {
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, bw, bh);
        }
    },

    _drawRat(ctx, x, y, w, h, cx, cy, time) {
        // Body oval
        ctx.fillStyle = '#9a7050';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 9, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fur shading
        ctx.fillStyle = '#7a5030';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 6, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#9a7050';
        ctx.beginPath();
        ctx.ellipse(cx + 9, cy + 2, 5, 4, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pointy ears
        ctx.fillStyle = '#c09080';
        ctx.beginPath();
        ctx.moveTo(cx + 9, cy - 2);
        ctx.lineTo(cx + 12, cy - 8);
        ctx.lineTo(cx + 14, cy - 1);
        ctx.closePath();
        ctx.fill();

        // Red inner ear
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy - 2);
        ctx.lineTo(cx + 12, cy - 6);
        ctx.lineTo(cx + 13, cy - 2);
        ctx.closePath();
        ctx.fill();

        // Tail (curved line, animated wag)
        const tailWag = Math.sin((time || 0) * 6) * 3;
        ctx.strokeStyle = '#7a5030';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy + 4);
        ctx.quadraticCurveTo(cx - 16, cy + 2 + tailWag, cx - 14, cy + 10);
        ctx.stroke();

        // Glowing red eye
        ctx.fillStyle = '#ff3030';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(cx + 11, cy + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Whiskers
        ctx.strokeStyle = 'rgba(255,230,200,0.6)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + 13, cy + 2); ctx.lineTo(cx + 18, cy + 0);
        ctx.moveTo(cx + 13, cy + 3); ctx.lineTo(cx + 18, cy + 4);
        ctx.stroke();
    },

    _drawBat(ctx, x, y, w, h, cx, cy, time) {
        // Wings (bezier curves, animated flap)
        const wingFlap = Math.sin((time || 0) * 8) * 5;
        ctx.fillStyle = '#4a2860';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.bezierCurveTo(cx - 8, cy - 10 + wingFlap, cx - 16, cy - 6 + wingFlap, cx - 14, cy + 2);
        ctx.bezierCurveTo(cx - 10, cy + 6, cx - 6, cy + 2, cx, cy + 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.bezierCurveTo(cx + 8, cy - 10 + wingFlap, cx + 16, cy - 6 + wingFlap, cx + 14, cy + 2);
        ctx.bezierCurveTo(cx + 10, cy + 6, cx + 6, cy + 2, cx, cy + 2);
        ctx.closePath();
        ctx.fill();

        // Wing membrane detail
        ctx.strokeStyle = '#6a3880';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(cx - 12, cy - 4);
        ctx.moveTo(cx, cy); ctx.lineTo(cx + 12, cy - 4);
        ctx.stroke();

        // Body
        ctx.fillStyle = '#3a1a50';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#4a2860';
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#5a3870';
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy - 9);
        ctx.lineTo(cx - 6, cy - 14);
        ctx.lineTo(cx - 1, cy - 11);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy - 9);
        ctx.lineTo(cx + 6, cy - 14);
        ctx.lineTo(cx + 1, cy - 11);
        ctx.closePath();
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(cx - 2, cy - 7, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 2, cy - 7, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Fangs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 2, cy - 3, 1, 3);
        ctx.fillRect(cx + 1, cy - 3, 1, 3);
    },

    _drawSkeleton(ctx, x, y, w, h, cx, cy, time) {
        const jitter = Math.sin((time || 0) * 20) * 0.5;
        cx += jitter;
        const bone = '#ddd8c0';
        const dark = '#1a1208';

        // Legs
        ctx.strokeStyle = bone;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 8);
        ctx.lineTo(cx - 5, cy + h / 2 + 4);
        ctx.moveTo(cx, cy + 8);
        ctx.lineTo(cx + 5, cy + h / 2 + 4);
        ctx.stroke();

        // Feet
        ctx.fillStyle = bone;
        ctx.fillRect(cx - 8, cy + h / 2 + 3, 5, 3);
        ctx.fillRect(cx + 3, cy + h / 2 + 3, 5, 3);

        // Spine
        ctx.strokeStyle = bone;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 3);
        ctx.lineTo(cx, cy + 8);
        ctx.stroke();

        // Ribs (4 pairs)
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const ry = cy - 1 + i * 4;
            ctx.beginPath();
            ctx.moveTo(cx, ry);
            ctx.quadraticCurveTo(cx - 8, ry + 1, cx - 7, ry + 3);
            ctx.moveTo(cx, ry);
            ctx.quadraticCurveTo(cx + 8, ry + 1, cx + 7, ry + 3);
            ctx.stroke();
        }

        // Arms
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 1, cy - 3);
        ctx.lineTo(cx - 10, cy + 2);
        ctx.lineTo(cx - 12, cy + 8);
        ctx.moveTo(cx + 1, cy - 3);
        ctx.lineTo(cx + 10, cy + 2);
        ctx.lineTo(cx + 12, cy + 8);
        ctx.stroke();

        // Skull
        ctx.fillStyle = bone;
        ctx.beginPath();
        ctx.arc(cx, cy - 10, 7, 0, Math.PI * 2);
        ctx.fill();

        // Jaw
        ctx.fillStyle = bone;
        ctx.fillRect(cx - 4, cy - 4, 8, 3);

        // Eye sockets (dark)
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.arc(cx - 3, cy - 11, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 11, 2.5, 0, Math.PI * 2); ctx.fill();

        // Glowing eye dots
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(cx - 3, cy - 11, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 11, 1, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Teeth
        ctx.fillStyle = '#fffff0';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(cx - 4 + i * 2, cy - 4, 1, 3);
        }
    },

    _drawOrc(ctx, x, y, w, h, cx, cy) {
        // Legs (thick)
        ctx.fillStyle = '#2a4020';
        ctx.fillRect(cx - 7, cy + 4, 6, 10);
        ctx.fillRect(cx + 1, cy + 4, 6, 10);

        // Boots
        ctx.fillStyle = '#3a2810';
        ctx.fillRect(cx - 8, cy + 11, 7, 5);
        ctx.fillRect(cx + 1, cy + 11, 7, 5);

        // Body (big and stocky)
        const bodyGrad = ctx.createLinearGradient(cx - 9, cy - 6, cx + 9, cy + 6);
        bodyGrad.addColorStop(0, '#4a7030');
        bodyGrad.addColorStop(1, '#2a5018');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(cx - 9, cy - 6, 18, 12);

        // Armour plate
        ctx.fillStyle = '#5a5040';
        ctx.fillRect(cx - 7, cy - 5, 14, 6);
        ctx.fillStyle = '#888060';
        ctx.fillRect(cx - 7, cy - 5, 14, 2);

        // Arms
        ctx.fillStyle = '#3a6028';
        ctx.fillRect(cx - 14, cy - 5, 6, 12);
        ctx.fillRect(cx + 8, cy - 5, 6, 12);

        // Fists
        ctx.fillStyle = '#4a7030';
        ctx.beginPath(); ctx.arc(cx - 11, cy + 8, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 11, cy + 8, 4, 0, Math.PI * 2); ctx.fill();

        // Head
        const headGrad = ctx.createRadialGradient(cx, cy - 11, 2, cx, cy - 11, 9);
        headGrad.addColorStop(0, '#5a8040');
        headGrad.addColorStop(1, '#3a5a28');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 10, 9, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jaw (wide)
        ctx.fillStyle = '#4a7030';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 5, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tusks
        ctx.fillStyle = '#fffff0';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 4);
        ctx.lineTo(cx - 7, cy + 1);
        ctx.lineTo(cx - 3, cy - 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 5, cy - 4);
        ctx.lineTo(cx + 7, cy + 1);
        ctx.lineTo(cx + 3, cy - 3);
        ctx.closePath();
        ctx.fill();

        // Eyes (red beady)
        ctx.fillStyle = '#ff2020';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 3;
        ctx.beginPath(); ctx.arc(cx - 4, cy - 12, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 4, cy - 12, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Weapon (club)
        ctx.fillStyle = '#6a3810';
        ctx.fillRect(cx + 10, cy - 10, 5, 18);
        ctx.fillStyle = '#8a5820';
        ctx.beginPath();
        ctx.ellipse(cx + 12, cy - 12, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Spikes on club
        ctx.fillStyle = '#888060';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(cx + 10 + i * 3, cy - 14, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    _drawDemon(ctx, x, y, w, h, cx, cy, time) {
        // Wings (large, membrane, animated flutter)
        const wf = AnimManager.phase(time || 0, 3) * 3;
        ctx.fillStyle = '#5a0a0a';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.bezierCurveTo(cx - 10, cy - 18 + wf, cx - 20, cy - 10 + wf, cx - 18, cy + 4);
        ctx.bezierCurveTo(cx - 12, cy + 10, cx - 6, cy + 4, cx, cy + 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.bezierCurveTo(cx + 10, cy - 18 + wf, cx + 20, cy - 10 + wf, cx + 18, cy + 4);
        ctx.bezierCurveTo(cx + 12, cy + 10, cx + 6, cy + 4, cx, cy + 2);
        ctx.closePath();
        ctx.fill();

        // Wing ribs
        ctx.strokeStyle = '#8a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(cx - 16, cy - 6);
        ctx.moveTo(cx, cy); ctx.lineTo(cx + 16, cy - 6);
        ctx.stroke();

        // Legs
        const demonGrad = ctx.createLinearGradient(cx, cy - 8, cx, cy + 14);
        demonGrad.addColorStop(0, '#8a1a10');
        demonGrad.addColorStop(1, '#5a0a08');
        ctx.fillStyle = demonGrad;
        ctx.fillRect(cx - 6, cy + 6, 5, 10);
        ctx.fillRect(cx + 1, cy + 6, 5, 10);

        // Cloven hooves
        ctx.fillStyle = '#1a0a08';
        ctx.beginPath(); ctx.ellipse(cx - 4, cy + 16, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 4, cy + 16, 4, 2, 0, 0, Math.PI * 2); ctx.fill();

        // Body
        ctx.fillStyle = demonGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chest sigil (glowing rune)
        ctx.strokeStyle = '#ff6020';
        ctx.shadowColor = '#ff4000';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5); ctx.lineTo(cx - 4, cy + 2); ctx.lineTo(cx + 4, cy + 2); ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Head
        const headGrad = ctx.createRadialGradient(cx, cy - 12, 2, cx, cy - 12, 9);
        headGrad.addColorStop(0, '#b02020');
        headGrad.addColorStop(1, '#700808');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = '#1a0808';
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 18); ctx.lineTo(cx - 9, cy - 26); ctx.lineTo(cx - 3, cy - 18);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 6, cy - 18); ctx.lineTo(cx + 9, cy - 26); ctx.lineTo(cx + 3, cy - 18);
        ctx.closePath(); ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#ff8020';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cx - 3, cy - 13, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 13, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(cx - 3, cy - 13, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 13, 1.5, 0, Math.PI * 2); ctx.fill();

        // Jaw / fangs
        ctx.fillStyle = '#900808';
        ctx.beginPath(); ctx.arc(cx, cy - 6, 5, 0, Math.PI); ctx.fill();
        ctx.fillStyle = '#f0f0e0';
        ctx.fillRect(cx - 4, cy - 6, 2, 4);
        ctx.fillRect(cx - 1, cy - 6, 2, 3);
        ctx.fillRect(cx + 2, cy - 6, 2, 4);
    },

    _drawDragon(ctx, x, y, w, h, cx, cy, time) {
        // Large wings (animated flutter)
        const wf = AnimManager.phase(time || 0, 2.5) * 4;
        ctx.fillStyle = '#1a3a08';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4);
        ctx.bezierCurveTo(cx - 12, cy - 22 + wf, cx - 26, cy - 14 + wf, cx - 22, cy + 6);
        ctx.bezierCurveTo(cx - 16, cy + 14, cx - 8, cy + 6, cx, cy + 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cx, cy - 4);
        ctx.bezierCurveTo(cx + 12, cy - 22 + wf, cx + 26, cy - 14 + wf, cx + 22, cy + 6);
        ctx.bezierCurveTo(cx + 16, cy + 14, cx + 8, cy + 6, cx, cy + 4);
        ctx.closePath();
        ctx.fill();

        // Wing membrane detail
        ctx.strokeStyle = '#2a5810';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(cx - 20, cy - 8);
        ctx.moveTo(cx, cy); ctx.lineTo(cx - 16, cy + 4);
        ctx.moveTo(cx, cy); ctx.lineTo(cx + 20, cy - 8);
        ctx.moveTo(cx, cy); ctx.lineTo(cx + 16, cy + 4);
        ctx.stroke();

        // Body (large oval)
        const dragonGrad = ctx.createLinearGradient(cx, cy - 8, cx, cy + 12);
        dragonGrad.addColorStop(0, '#4a7828');
        dragonGrad.addColorStop(0.5, '#305818');
        dragonGrad.addColorStop(1, '#1a3808');
        ctx.fillStyle = dragonGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly scales (lighter)
        ctx.fillStyle = '#6a9840';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.strokeStyle = '#305818';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 6);
        ctx.quadraticCurveTo(cx - 20, cy + 10, cx - 22, cy + 4);
        ctx.quadraticCurveTo(cx - 24, cy - 2, cx - 18, cy - 4);
        ctx.stroke();

        // Legs (stubby)
        ctx.fillStyle = '#305818';
        ctx.fillRect(cx - 10, cy + 8, 7, 7);
        ctx.fillRect(cx + 3, cy + 8, 7, 7);

        // Claws
        ctx.fillStyle = '#1a1008';
        ctx.beginPath(); ctx.ellipse(cx - 7, cy + 16, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 6, cy + 16, 5, 2, 0, 0, Math.PI * 2); ctx.fill();

        // Neck
        ctx.fillStyle = '#4a7828';
        ctx.fillRect(cx - 4, cy - 10, 8, 8);

        // Head
        const headGrad = ctx.createRadialGradient(cx + 4, cy - 16, 2, cx, cy - 14, 10);
        headGrad.addColorStop(0, '#6a9840');
        headGrad.addColorStop(1, '#305818');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy - 16, 10, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Horns (back of head)
        ctx.fillStyle = '#1a3008';
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 21); ctx.lineTo(cx - 4, cy - 28); ctx.lineTo(cx + 2, cy - 20);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy - 22); ctx.lineTo(cx + 6, cy - 29); ctx.lineTo(cx + 8, cy - 21);
        ctx.closePath(); ctx.fill();

        // Eyes (fiery orange)
        ctx.fillStyle = '#ff8020';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cx + 2, cy - 17, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, cy - 16, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff2000';
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(cx + 2, cy - 17, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 8, cy - 16, 1.5, 0, Math.PI * 2); ctx.fill();

        // Nostril fire
        ctx.fillStyle = '#ff6010';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx + 13, cy - 14, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    // ─── BOSS SPRITES ────────────────────────────────────────────────────────

    _drawCursedKnight(ctx, x, y, w, h, cx, cy) {
        // Plate armour, purple-tinted, with cursed glow
        ctx.fillStyle = '#3a2a60';
        ctx.fillRect(cx - 7, cy + 2, 6, 12);
        ctx.fillRect(cx + 1, cy + 2, 6, 12);
        const bodyGrad = ctx.createLinearGradient(cx - 8, cy - 6, cx + 8, cy + 8);
        bodyGrad.addColorStop(0, '#6a4a90');
        bodyGrad.addColorStop(1, '#3a2060');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(cx - 8, cy - 6, 16, 10);
        ctx.fillStyle = '#9060c0';
        ctx.fillRect(cx - 8, cy - 6, 16, 3);
        ctx.fillRect(cx - 10, cy - 6, 4, 6);
        ctx.fillRect(cx + 6,  cy - 6, 4, 6);
        ctx.fillStyle = '#5a3880';
        ctx.beginPath(); ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9060c0';
        ctx.beginPath(); ctx.arc(cx, cy - 13, 8, Math.PI, 0); ctx.fill();
        ctx.fillRect(cx - 8, cy - 15, 16, 4);
        ctx.fillStyle = '#cc88ff';
        ctx.shadowColor = '#8844ff'; ctx.shadowBlur = 6;
        ctx.fillRect(cx - 6, cy - 13, 12, 2);
        ctx.beginPath(); ctx.arc(cx - 3, cy - 10, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 10, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Sword
        ctx.fillStyle = '#9955cc';
        ctx.fillRect(cx + 9, cy - 12, 4, 22);
        ctx.fillStyle = '#cc88ff';
        ctx.fillRect(cx + 6, cy + 2, 10, 3);
    },

    _drawGolem(ctx, x, y, w, h, cx, cy) {
        // Rocky stone body, large and hulking
        ctx.fillStyle = '#555550';
        ctx.fillRect(cx - 10, cy + 4, 8, 12);
        ctx.fillRect(cx + 2, cy + 4, 8, 12);
        ctx.fillStyle = '#888';
        ctx.fillRect(cx - 10, cy + 12, 9, 5);
        ctx.fillRect(cx + 1, cy + 12, 9, 5);
        const bodyGrad = ctx.createLinearGradient(cx - 11, cy - 6, cx + 11, cy + 6);
        bodyGrad.addColorStop(0, '#888880');
        bodyGrad.addColorStop(1, '#444440');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(cx - 11, cy - 8, 22, 14);
        ctx.fillStyle = '#999990';
        ctx.fillRect(cx - 11, cy - 8, 22, 3);
        // Rock texture cracks
        ctx.strokeStyle = '#333330'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx, cy + 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 3, cy - 3); ctx.lineTo(cx + 7, cy + 4); ctx.stroke();
        // Head (boulder)
        ctx.fillStyle = '#888880';
        ctx.beginPath(); ctx.arc(cx, cy - 14, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#555550';
        ctx.beginPath(); ctx.arc(cx + 3, cy - 12, 4, 0, Math.PI * 2); ctx.fill();
        // Glowing eyes
        ctx.fillStyle = '#88ff44'; ctx.shadowColor = '#44ff00'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cx - 4, cy - 15, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 4, cy - 15, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    _drawLich(ctx, x, y, w, h, cx, cy) {
        // Skeletal robed figure with purple magic aura
        ctx.fillStyle = '#2a0a3a';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 14);
        ctx.lineTo(cx - 6, cy - 4);
        ctx.lineTo(cx + 6, cy - 4);
        ctx.lineTo(cx + 10, cy + 14);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#400a60';
        ctx.fillRect(cx - 8, cy - 8, 16, 6);
        ctx.strokeStyle = '#7722aa'; ctx.lineWidth = 1;
        ctx.strokeRect(cx - 8, cy - 8, 16, 6);
        // Skull head
        ctx.fillStyle = '#ddd8c0';
        ctx.beginPath(); ctx.arc(cx, cy - 14, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1208';
        ctx.beginPath(); ctx.arc(cx - 3, cy - 15, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 15, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cc00ff'; ctx.shadowColor = '#aa00ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(cx - 3, cy - 15, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 15, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Crown
        ctx.fillStyle = '#8800cc';
        ctx.fillRect(cx - 7, cy - 21, 14, 4);
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(cx - 5 + i * 5, cy - 25, 3, 5);
        }
        // Staff
        ctx.strokeStyle = '#7722aa'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx + 9, cy - 20); ctx.lineTo(cx + 9, cy + 14); ctx.stroke();
        ctx.fillStyle = '#cc00ff'; ctx.shadowColor = '#aa00ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(cx + 9, cy - 22, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    _drawVampire(ctx, x, y, w, h, cx, cy) {
        // Elegant, red-eyed vampire lord in dark cape
        ctx.fillStyle = '#1a0a10';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4);
        ctx.bezierCurveTo(cx - 12, cy - 8, cx - 18, cy + 4, cx - 14, cy + 14);
        ctx.lineTo(cx, cy + 10);
        ctx.lineTo(cx + 14, cy + 14);
        ctx.bezierCurveTo(cx + 18, cy + 4, cx + 12, cy - 8, cx, cy - 4);
        ctx.fill();
        ctx.fillStyle = '#3a0a18';
        ctx.fillRect(cx - 6, cy - 6, 12, 12);
        ctx.fillStyle = '#880022';
        ctx.fillRect(cx - 5, cy - 6, 10, 5);
        ctx.fillStyle = '#e8c8d8';
        ctx.beginPath(); ctx.arc(cx, cy - 12, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a0808';
        ctx.fillRect(cx - 6, cy - 16, 12, 6);
        // Fangs
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - 3, cy - 7, 1.5, 4); ctx.fillRect(cx + 1, cy - 7, 1.5, 4);
        // Glowing red eyes
        ctx.fillStyle = '#ff0000'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(cx - 3, cy - 13, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 3, cy - 13, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    _drawChaos(ctx, x, y, w, h, cx, cy) {
        // Titanic chaos warrior — massive, multi-armed, crackling with energy
        ctx.fillStyle = '#3a0808';
        ctx.fillRect(cx - 8, cy + 4, 7, 13);
        ctx.fillRect(cx + 1, cy + 4, 7, 13);
        const bodyGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 14);
        bodyGrad.addColorStop(0, '#cc2020');
        bodyGrad.addColorStop(1, '#5a0808');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(cx - 12, cy - 8, 24, 14);
        // Extra arms
        ctx.strokeStyle = '#aa1010'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx - 12, cy - 4); ctx.lineTo(cx - 22, cy - 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 12, cy - 4); ctx.lineTo(cx + 22, cy - 14); ctx.stroke();
        ctx.fillStyle = '#cc2020';
        ctx.beginPath(); ctx.arc(cx - 22, cy - 15, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 22, cy - 15, 5, 0, Math.PI * 2); ctx.fill();
        // Head with crown of fire
        const headGrad = ctx.createRadialGradient(cx, cy - 14, 2, cx, cy - 14, 10);
        headGrad.addColorStop(0, '#ee3030');
        headGrad.addColorStop(1, '#880000');
        ctx.fillStyle = headGrad;
        ctx.beginPath(); ctx.arc(cx, cy - 14, 10, 0, Math.PI * 2); ctx.fill();
        // Horns (3)
        ctx.fillStyle = '#330000';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * 7, cy - 21);
            ctx.lineTo(cx + i * 9, cy - 30);
            ctx.lineTo(cx + i * 4, cy - 21);
            ctx.closePath(); ctx.fill();
        }
        // Eyes (4, glowing)
        ctx.fillStyle = '#ff8800'; ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
        [[-5,-15],[0,-17],[5,-15],[0,-13]].forEach(([ox, oy]) => {
            ctx.beginPath(); ctx.arc(cx + ox, cy + oy, 2.5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.shadowBlur = 0;
    },

    _drawDemonLord(ctx, x, y, w, h, cx, cy, time, enemy) {
        // Malphas — massive final boss, crimson and black, towering horns, dark halo
        const t = time || 0;
        const isAtk = enemy && enemy.state === 'attack';
        const atkPulse = isAtk && enemy.attackTimer > 0
            ? AnimManager.attackPulse(enemy.attackTimer, enemy.attackDelay) : 0;
        const wf = AnimManager.phase(t, 2) * 4 + atkPulse * 4;

        // Dark halo / aura (pulses during attack)
        const haloAlpha = 0.5 + (isAtk ? AnimManager.phase(t, 8) * 0.3 : 0);
        ctx.strokeStyle = `rgba(255,0,68,${haloAlpha})`; ctx.lineWidth = 4;
        ctx.shadowColor = '#ff0044'; ctx.shadowBlur = 14 + atkPulse * 8;
        ctx.beginPath(); ctx.arc(cx, cy - 10, 18 + atkPulse * 4, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;

        // Grand wings (animated flutter + attack spread)
        const ws = atkPulse * 6;
        ctx.fillStyle = '#3a0010';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4);
        ctx.bezierCurveTo(cx - 14 - ws, cy - 28 + wf, cx - 28 - ws, cy - 16 + wf, cx - 26 - ws, cy + 6);
        ctx.bezierCurveTo(cx - 18, cy + 14, cx - 8, cy + 6, cx, cy + 4);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4);
        ctx.bezierCurveTo(cx + 14 + ws, cy - 28 + wf, cx + 28 + ws, cy - 16 + wf, cx + 26 + ws, cy + 6);
        ctx.bezierCurveTo(cx + 18, cy + 14, cx + 8, cy + 6, cx, cy + 4);
        ctx.closePath(); ctx.fill();
        // Wing ribs
        ctx.strokeStyle = '#880022'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx - 22, cy - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 22, cy - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx - 18, cy + 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 18, cy + 6); ctx.stroke();

        // Legs
        const legGrad = ctx.createLinearGradient(cx, cy - 4, cx, cy + 16);
        legGrad.addColorStop(0, '#aa1028');
        legGrad.addColorStop(1, '#5a0010');
        ctx.fillStyle = legGrad;
        ctx.fillRect(cx - 7, cy + 6, 5, 11);
        ctx.fillRect(cx + 2, cy + 6, 5, 11);
        ctx.fillStyle = '#1a0008';
        ctx.beginPath(); ctx.ellipse(cx - 4, cy + 17, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 4, cy + 17, 4, 2, 0, 0, Math.PI * 2); ctx.fill();

        // Body
        const bodyGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 12);
        bodyGrad.addColorStop(0, '#cc1030');
        bodyGrad.addColorStop(1, '#6a0010');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.ellipse(cx, cy, 10, 12, 0, 0, Math.PI * 2); ctx.fill();

        // Glowing chest rune
        ctx.strokeStyle = '#ff0044'; ctx.shadowColor = '#ff0044'; ctx.shadowBlur = 8;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8); ctx.lineTo(cx - 6, cy + 2); ctx.lineTo(cx + 6, cy + 2);
        ctx.closePath(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 3); ctx.lineTo(cx + 6, cy - 3); ctx.stroke();
        ctx.shadowBlur = 0;

        // Head
        const headGrad = ctx.createRadialGradient(cx, cy - 14, 3, cx, cy - 14, 11);
        headGrad.addColorStop(0, '#cc1030');
        headGrad.addColorStop(1, '#660010');
        ctx.fillStyle = headGrad;
        ctx.beginPath(); ctx.arc(cx, cy - 14, 10, 0, Math.PI * 2); ctx.fill();

        // Tall curved horns
        ctx.fillStyle = '#0a0005';
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 21);
        ctx.quadraticCurveTo(cx - 16, cy - 36, cx - 10, cy - 40);
        ctx.quadraticCurveTo(cx - 6,  cy - 36, cx - 4, cy - 22);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy - 21);
        ctx.quadraticCurveTo(cx + 16, cy - 36, cx + 10, cy - 40);
        ctx.quadraticCurveTo(cx + 6,  cy - 36, cx + 4, cy - 22);
        ctx.closePath(); ctx.fill();

        // Blazing eyes
        ctx.fillStyle = '#ff0044'; ctx.shadowColor = '#ff4488'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(cx - 4, cy - 15, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 4, cy - 15, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(cx - 4, cy - 15, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 4, cy - 15, 2, 0, Math.PI * 2); ctx.fill();

        // Fangs
        ctx.fillStyle = '#ffcccc';
        ctx.fillRect(cx - 5, cy - 7, 2, 5);
        ctx.fillRect(cx - 1, cy - 7, 2, 4);
        ctx.fillRect(cx + 3, cy - 7, 2, 5);
    },

    _drawGeneric(ctx, cx, cy, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(cx - 3, cy - 3, 2, 2);
        ctx.fillRect(cx + 1, cy - 3, 2, 2);
    },

    // ─── ITEMS ──────────────────────────────────────────────────────────────

    drawItem(ctx, x, y, w, h, item) {
        const cx = x + w / 2, cy = y + h / 2;

        // Subtle glow background
        ctx.fillStyle = 'rgba(255,220,80,0.12)';
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();

        switch (item.slot) {
            case 'weapon':  this._drawWeaponIcon(ctx, cx, cy, item); break;
            case 'armor':   this._drawArmorIcon(ctx, cx, cy, item); break;
            case 'helmet':  this._drawHelmetIcon(ctx, cx, cy, item); break;
            case 'boots':   this._drawBootsIcon(ctx, cx, cy, item); break;
            case 'ring':    this._drawRingIcon(ctx, cx, cy, item); break;
            case 'amulet':  this._drawAmuletIcon(ctx, cx, cy, item); break;
            default:
                if (item.type === 'potion') this._drawPotionIcon(ctx, cx, cy, item);
                else this._drawGenericItemIcon(ctx, cx, cy, item);
        }
    },

    _drawWeaponIcon(ctx, cx, cy, item) {
        const tierColor = this._tierColor(item.tier);
        ctx.strokeStyle = tierColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        // Blade
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 8);
        ctx.lineTo(cx + 6, cy - 8);
        ctx.stroke();
        // Crossguard
        ctx.strokeStyle = '#c8a030';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy + 2);
        ctx.lineTo(cx + 4, cy - 2);
        ctx.stroke();
        // Handle
        ctx.strokeStyle = '#7a4820';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy + 8);
        ctx.lineTo(cx - 3, cy + 4);
        ctx.stroke();
        // Tier glow
        if (item.tier >= 4) {
            ctx.shadowColor = tierColor;
            ctx.shadowBlur = 6;
            ctx.strokeStyle = tierColor;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - 6, cy + 8); ctx.lineTo(cx + 6, cy - 8); ctx.stroke();
            ctx.shadowBlur = 0;
        }
    },

    _drawArmorIcon(ctx, cx, cy, item) {
        const col = this._tierColor(item.tier);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 9);
        ctx.lineTo(cx - 8, cy - 5);
        ctx.lineTo(cx - 8, cy + 5);
        ctx.lineTo(cx, cy + 9);
        ctx.lineTo(cx + 8, cy + 5);
        ctx.lineTo(cx + 8, cy - 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = this._lighten(col, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
        // Emblem
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawHelmetIcon(ctx, cx, cy, item) {
        const col = this._tierColor(item.tier);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 9, Math.PI, 0);
        ctx.lineTo(cx + 9, cy + 4);
        ctx.lineTo(cx - 9, cy + 4);
        ctx.closePath();
        ctx.fill();
        // Visor
        ctx.fillStyle = 'rgba(100,200,255,0.4)';
        ctx.fillRect(cx - 6, cy, 12, 3);
        ctx.strokeStyle = this._lighten(col, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 6, cy, 12, 3);
    },

    _drawBootsIcon(ctx, cx, cy, item) {
        const col = this._tierColor(item.tier);
        ctx.fillStyle = col;
        // Boot shaft
        ctx.fillRect(cx - 5, cy - 7, 7, 10);
        // Boot sole (wider)
        ctx.fillRect(cx - 5, cy + 3, 9, 4);
        // Toe cap
        ctx.fillStyle = this._darken(col, 0.2);
        ctx.fillRect(cx, cy + 3, 4, 4);
        ctx.strokeStyle = this._lighten(col, 0.3);
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 5, cy - 7, 7, 10);
    },

    _drawRingIcon(ctx, cx, cy, item) {
        const col = this._tierColor(item.tier);
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.stroke();
        // Gem
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(cx, cy - 7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    _drawAmuletIcon(ctx, cx, cy, item) {
        const col = this._tierColor(item.tier);
        // Chain
        ctx.strokeStyle = '#c8a030';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy - 6, 6, Math.PI + 0.3, 2 * Math.PI - 0.3);
        ctx.stroke();
        // Pendant
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy + 8);
        ctx.lineTo(cx - 5, cy);
        ctx.lineTo(cx, cy - 3);
        ctx.lineTo(cx + 5, cy);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    _drawPotionIcon(ctx, cx, cy, item) {
        const isHealth = item.subtype === 'health';
        const potionColor = isHealth ? '#cc2020' : '#2020cc';
        const glowColor = isHealth ? '#ff4040' : '#4040ff';

        // Bottle
        ctx.fillStyle = 'rgba(180,220,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Liquid fill
        ctx.fillStyle = potionColor;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, 6, 8, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillRect(cx - 6, cy + (isHealth ? -2 : 0), 12, 12);
        ctx.restore();

        // Bottle outline
        ctx.strokeStyle = 'rgba(200,240,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 2, 6, 8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Neck
        ctx.fillStyle = '#c8d0d8';
        ctx.fillRect(cx - 2, cy - 9, 4, 5);

        // Cork
        ctx.fillStyle = '#a87840';
        ctx.fillRect(cx - 2, cy - 11, 4, 3);

        // Bubbles
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(cx - 2, cy, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 2, cy + 3, 1, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    _drawGenericItemIcon(ctx, cx, cy, item) {
        ctx.fillStyle = item.fg || '#aaaaaa';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
    },

    // ─── CHEST OPEN ANIMATION ────────────────────────────────────────────────

    drawChestOpening(ctx, x, y, w, h, progress) {
        const cx = x + w / 2, cy = y + h / 2 + 2;
        const cw = 20, ch = 14;
        const alpha = 1 - progress;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Chest body (fading out)
        ctx.fillStyle = '#7a4820';
        ctx.fillRect(cx - cw / 2, cy, cw, ch / 2);
        // Metal band
        ctx.fillStyle = '#c8a030';
        ctx.fillRect(cx - cw / 2, cy + ch / 2 - 3, cw, 2);

        // Lid flying up and tilting back
        const lidY = cy - ch / 2 - progress * 14;
        ctx.save();
        ctx.translate(cx, lidY + ch / 4);
        ctx.rotate(-progress * 0.9);
        const lidGrad = ctx.createLinearGradient(0, -ch / 4, 0, ch / 4);
        lidGrad.addColorStop(0, '#9a5828');
        lidGrad.addColorStop(1, '#7a4020');
        ctx.fillStyle = lidGrad;
        ctx.fillRect(-cw / 2 - 1, -ch / 4, cw + 2, ch / 2 + 2);
        ctx.fillStyle = '#c8a030';
        ctx.fillRect(-cw / 2, ch / 4 - 2, cw, 2);
        ctx.fillRect(-1, -ch / 4, 2, ch / 2 + 2);
        ctx.restore();

        ctx.restore();

        // Gold sparkle burst (always visible, not affected by alpha)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + progress * 4;
            const dist = progress * 18;
            const sx = cx + Math.cos(angle) * dist;
            const sy = cy - 4 + Math.sin(angle) * dist * 0.6 - progress * 12;
            const sparkAlpha = Math.max(0, (1 - progress * 1.2)) * 0.9;
            ctx.fillStyle = `rgba(255,215,0,${sparkAlpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 2.5 - progress * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // ─── GOLD ───────────────────────────────────────────────────────────────

    drawGold(ctx, x, y, w, h) {
        const cx = x + w / 2, cy = y + h / 2 + 2;

        // Coin shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx + 2, cy + 2, 7, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Coin body gradient
        const coinGrad = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 8);
        coinGrad.addColorStop(0,   '#ffe880');
        coinGrad.addColorStop(0.4, '#ffc020');
        coinGrad.addColorStop(0.8, '#c88010');
        coinGrad.addColorStop(1,   '#a06008');
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 7, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Coin edge (perspective)
        ctx.fillStyle = '#a06008';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 3, 7, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = coinGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 7, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Shine highlight
        ctx.fillStyle = 'rgba(255,255,220,0.5)';
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy - 2, 3, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // G mark
        ctx.fillStyle = '#a06010';
        ctx.font = 'bold 8px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('G', cx, cy + 3);
        ctx.textAlign = 'left';
    },

    // ─── Color helpers ───────────────────────────────────────────────────────

    _tierColor(tier) {
        const colors = ['#aaaaaa', '#88cc88', '#4488ff', '#aa44ff', '#ff8800', '#ff4444', '#ff88ff', '#ffffff'];
        return colors[Math.min(tier, colors.length - 1)];
    },

    _darken(hex, factor) {
        try {
            let h = hex.replace('#', '');
            if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
            const r = Math.floor(parseInt(h.slice(0,2),16) * (1-factor));
            const g = Math.floor(parseInt(h.slice(2,4),16) * (1-factor));
            const b = Math.floor(parseInt(h.slice(4,6),16) * (1-factor));
            return `rgb(${r},${g},${b})`;
        } catch(e) { return hex; }
    },

    _lighten(hex, factor) {
        try {
            let h = hex.replace('#', '');
            if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
            const r = Math.min(255, Math.floor(parseInt(h.slice(0,2),16) + (255-parseInt(h.slice(0,2),16))*factor));
            const g = Math.min(255, Math.floor(parseInt(h.slice(2,4),16) + (255-parseInt(h.slice(2,4),16))*factor));
            const b = Math.min(255, Math.floor(parseInt(h.slice(4,6),16) + (255-parseInt(h.slice(4,6),16))*factor));
            return `rgb(${r},${g},${b})`;
        } catch(e) { return hex; }
    },
};
