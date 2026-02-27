// Combat System - handles attack resolution, projectiles, floating damage text
const Combat = {
    floatingTexts: [],
    particles: [],

    update(dt) {
        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.timer += dt;
            if (ft.timer >= ft.duration) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.timer += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.timer >= p.duration) {
                this.particles.splice(i, 1);
            }
        }
    },

    addFloatingText(x, y, text, color = '#fff') {
        // Store in pixel space: tile center
        const isCrit = text.includes('CRIT');
        this.floatingTexts.push({
            x: x * 32 + 16 + (Math.random() - 0.5) * 8,
            y: y * 32 + 4,
            text, color,
            timer: 0,
            duration: isCrit ? 1.4 : 1.0,
            size: isCrit ? 20 : 16,
        });
    },

    addHitParticles(x, y, color = '#f00') {
        const count = 3 + Math.floor(Math.random() * 3); // 3-5
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 60;
            this.particles.push({
                x: x * 32 + 16, y: y * 32 + 16,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20, // slight upward bias
                color,
                timer: 0,
                duration: 0.2 + Math.random() * 0.25,
                size: 2 + Math.random() * 2,
            });
        }
    },

    resolvePlayerAttack(player, enemies) {
        if (!player.attacking || player.attackFrame < 0.5 || player.attackFrame > 1.5) return;
        // Only resolve once per swing
        if (player._attackResolved) return;
        player._attackResolved = true;

        const attackTiles = player.getAttackTiles();
        const atk = player.getAtk();

        for (const enemy of enemies) {
            for (const tile of attackTiles) {
                if (enemy.x === tile.x && enemy.y === tile.y && enemy.hp > 0) {
                    // Critical hit: 10% chance, 2x damage
                    const isCrit = Math.random() < 0.1;
                    const finalAtk = isCrit ? atk * 2 : atk;
                    const dmg = Enemy.takeDamage(enemy, finalAtk, player);

                    if (isCrit) {
                        this.addFloatingText(enemy.x, enemy.y, `CRIT -${dmg}`, '#ff8800');
                    } else {
                        this.addFloatingText(enemy.x, enemy.y, `-${dmg}`, '#ff4');
                    }
                    Audio.play('playerAttack');
                    this.addHitParticles(enemy.x, enemy.y, isCrit ? '#ff8800' : '#fa0');

                    // Knockback enemy 0.5 tiles away from player
                    const kbDx = enemy.x - player.x;
                    const kbDy = enemy.y - player.y;
                    const kbDist = Math.sqrt(kbDx * kbDx + kbDy * kbDy) || 1;
                    enemy.knockX = (kbDx / kbDist) * 0.5;
                    enemy.knockY = (kbDy / kbDist) * 0.5;
                    enemy.knockTimer = 0.15;

                    // Screen shake + hit stop
                    const r = Game.renderer;
                    if (enemy.hp <= 0) {
                        r.shake(enemy.isBoss ? 10 : 3, enemy.isBoss ? 0.4 : 0.15);
                        Game.hitStop(enemy.isBoss ? 0.12 : 0.08);
                    } else {
                        r.shake(enemy.isBoss ? 10 : 3, enemy.isBoss ? 0.4 : 0.15);
                        Game.hitStop(enemy.isBoss ? 0.12 : 0.05);
                    }
                    break;
                }
            }
        }

        // Reset on next attack
        setTimeout(() => { player._attackResolved = false; }, 50);
    },

    render(renderer, viewX, viewY) {
        const ctx = renderer.getCtx();
        const tileW = 32;

        // Floating damage numbers — bigger, faster rise, glow
        ctx.save();
        ctx.textAlign = 'center';
        for (const ft of this.floatingTexts) {
            const t = ft.timer / ft.duration;
            const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3; // hold then fade
            if (alpha <= 0) continue;
            const sx = ft.x - viewX * tileW;
            // Ease-out rise: fast initially, slows down
            const rise = (1 - Math.pow(1 - Math.min(1, ft.timer * 2), 2)) * 30;
            const sy = ft.y - viewY * tileW - rise;
            const size = ft.size || 16;
            // Scale punch on spawn
            const scale = ft.timer < 0.1 ? 1 + (1 - ft.timer / 0.1) * 0.3 : 1;
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${Math.round(size * scale)}px "Courier New"`;
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, sx, sy);
            // Outline for readability
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 2;
            ctx.strokeText(ft.text, sx, sy);
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // Hit particles — varied sizes
        ctx.save();
        for (const p of this.particles) {
            const alpha = 1 - p.timer / p.duration;
            if (alpha <= 0) continue;
            const sx = p.x - viewX * tileW;
            const sy = p.y - viewY * tileW;
            const r = (p.size || 3) * alpha;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
};
