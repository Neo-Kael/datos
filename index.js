        (() => {
            "use strict";
            const STARTING_COINS = 1000;
            const MINIMUM_WAGER = 100;
            const QUESTION_TIME_MS = 30000;
            const REACTION_DURATION_MS = 1600;
            const ANSWER_EXPLANATION_DURATION_MS = 12000;
            const RESULTS_KEY = "mercado-datos-resultados-v1";
            const PLAYER_RESULTS_KEY = "mercado-datos-partidas-v2";
            const splashStartedAt = performance.now();
            const powers = [
                { id: "supersonic", name: "Supersónico", icon: "»", description: "+50 % de puntos durante 20 s.", kind: "timed" },
                { id: "streak-booster", name: "Potenciador de racha", icon: "↗", description: "+50 puntos por acierto consecutivo.", kind: "toggle" },
                { id: "double-jeopardy", name: "Doble riesgo", icon: "⚖", description: "Esta pregunta: +100 extra si aciertas; −50 si fallas.", kind: "question" },
                { id: "double-points", name: "Puntos dobles", icon: "2×", description: "Duplica la siguiente respuesta correcta.", kind: "armed" },
                { id: "fifty-fifty", name: "Mitad y mitad", icon: "½", description: "Retira dos opciones incorrectas.", kind: "eliminate-two" },
                { id: "eraser", name: "Borrador", icon: "⌫", description: "Retira una opción incorrecta.", kind: "eliminate-one" },
                { id: "immunity", name: "Inmunidad", icon: "◇", description: "Te da un segundo intento en esta pregunta.", kind: "question" },
                { id: "time-freeze", name: "Congelar tiempo", icon: "Ⅱ", description: "Detiene tu reloj durante 5 segundos.", kind: "freeze" },
                { id: "streak-saver", name: "Protector de racha", icon: "♡", description: "Conserva tu racha tras el siguiente error.", kind: "toggle" }
            ];
            const networkPowers = ["gift", "power-play", "glitch"];
            const POWER_DETAILS = {
                gift: ["Regalo", "Transfiere 100 puntos de tu saldo a otro estudiante."],
                "power-play": ["Ventaja colectiva", "+25 % para todos durante 15 s."],
                glitch: ["Interferencia", "Efecto visual en un rival durante 5 s."]
            };
            const questions = [
                { topic: "Porcentajes", prompt: "En una encuesta a 240 estudiantes, el 35 % eligió fútbol y el 25 % baloncesto. El resto eligió voleibol. ¿Cuántos eligieron voleibol?", choices: ["84", "96", "120", "144"], answer: "96", explanation: "Fútbol y baloncesto suman el 60 %, así que voleibol representa el 40 %. El 40 % de 240 es 0,40 × 240 = 96.", incorrectExplanation: "Suma los porcentajes de las dos categorías conocidas y réstalos del total porcentual. Luego aplica el porcentaje restante al número total de estudiantes." },
                { topic: "Media ponderada", prompt: "Un curso de 18 estudiantes obtuvo una media de 72 puntos y otro de 12 estudiantes una media de 84. ¿Cuál es la media conjunta de los 30 estudiantes?", choices: ["76,8", "78", "79,2", "80"], answer: "76,8", explanation: "La suma de puntos es 18 × 72 + 12 × 84 = 2.304. Al dividirla entre los 30 estudiantes: 2.304 ÷ 30 = 76,8.", incorrectExplanation: "No promedies directamente las dos medias: los cursos tienen tamaños distintos. Multiplica cada media por el número de estudiantes de su curso, suma esos productos y divide entre el total de estudiantes." },
                { topic: "Mediana", prompt: "Ocho puntuaciones suman 84: 4, 7, 7, 9, 10, 12, 15 y 20. Se agrega una novena puntuación y la media de los nueve datos queda en 10. ¿Cuál es la mediana de los nueve datos?", choices: ["7", "8", "9", "10"], answer: "9", explanation: "La suma final debe ser 9 × 10 = 90, así que el dato agregado es 90 − 84 = 6. Ordenados quedan 4, 6, 7, 7, 9, 10, 12, 15 y 20; el quinto dato, la mediana, es 9.", incorrectExplanation: "Primero deduce el dato agregado usando la media y la suma original. Después ordena los nueve datos: con una cantidad impar de valores, la mediana es el dato que queda justo en el centro." },
                { topic: "Probabilidad sin reemplazo", prompt: "Una bolsa tiene 5 fichas rojas y 7 azules. Se extraen dos fichas seguidas sin devolver la primera. Si la primera fue roja, ¿cuál es la probabilidad de que la segunda también sea roja?", choices: ["5/12 (41,7 %)", "4/11 (36,4 %)", "5/11 (45,5 %)", "4/12 (33,3 %)"], answer: "4/11 (36,4 %)", explanation: "Tras sacar una roja quedan 4 rojas de un total de 11 fichas. La probabilidad es 4/11 ≈ 36,4 %.", incorrectExplanation: "Como la primera ficha no se devuelve y ya sabes que fue roja, actualiza el contenido de la bolsa antes de calcular: queda una ficha menos en total y una roja menos." },
                { topic: "Frecuencia relativa", prompt: "En 250 pruebas, un evento ocurrió 68 veces. Si la frecuencia relativa se mantiene, ¿cuántas veces se esperaría que ocurriera aproximadamente en 1.500 pruebas?", choices: ["360", "408", "425", "510"], answer: "408", explanation: "La frecuencia relativa observada es 68/250 = 0,272. La estimación para 1.500 pruebas es 0,272 × 1.500 = 408.", incorrectExplanation: "Calcula primero la frecuencia relativa dividiendo las ocurrencias entre el número de pruebas. Para estimar en una cantidad nueva de pruebas, multiplica esa proporción por el nuevo total." },
                { topic: "Media con tabla de frecuencias", prompt: "En una encuesta, 3 personas dieron una puntuación de 2, 5 dieron 3, 4 dieron 4 y 2 dieron 5. ¿Cuál es la puntuación media, redondeada a dos decimales?", choices: ["3,25", "3,36", "3,50", "3,75"], answer: "3,36", explanation: "La suma ponderada es 3×2 + 5×3 + 4×4 + 2×5 = 47 y hay 14 personas. La media es 47 ÷ 14 ≈ 3,36.", incorrectExplanation: "En una tabla de frecuencias, cada puntuación debe contarse tantas veces como indica su frecuencia. Multiplica cada puntuación por su frecuencia, suma los productos y divide entre el total de personas." },
                { topic: "Porcentajes sucesivos", prompt: "Una chaqueta cuesta 800 monedas. Su precio aumenta un 15 % y luego recibe un descuento del 10 % sobre el nuevo precio. ¿Cuál es el precio final?", choices: ["800", "820", "828", "840"], answer: "828", explanation: "Después del aumento: 800 × 1,15 = 920. El descuento se aplica sobre 920: 920 × 0,90 = 828 monedas.", incorrectExplanation: "Aplica los cambios en orden. El descuento se calcula sobre el precio que ya aumentó, no sobre el precio inicial; por eso los dos porcentajes no se cancelan directamente." },
                { topic: "Rango intercuartílico", prompt: "Para los datos ordenados 2, 4, 5, 7, 8, 10, 12 y 15, ¿cuál es el rango intercuartílico (Q3 − Q1)?", choices: ["5,5", "6", "6,5", "7"], answer: "6,5", explanation: "La mitad inferior es 2, 4, 5, 7, así que Q1 = (4 + 5) ÷ 2 = 4,5. La mitad superior es 8, 10, 12, 15, así que Q3 = (10 + 12) ÷ 2 = 11. El rango intercuartílico es 11 − 4,5 = 6,5.", incorrectExplanation: "Divide los datos ordenados en una mitad inferior y otra superior. Calcula la mediana de cada mitad y resta el cuartil inferior del cuartil superior." },
                { topic: "Probabilidad sin reemplazo", prompt: "Una caja contiene 6 bolas rojas y 4 azules. Se extraen dos bolas sin reemplazo. ¿Cuál es la probabilidad de obtener una roja y una azul, en cualquier orden?", choices: ["2/5 (40 %)", "8/15 (53,3 %)", "3/5 (60 %)", "2/3 (66,7 %)"], answer: "8/15 (53,3 %)", explanation: "Puede salir roja y luego azul: (6/10)(4/9); o azul y luego roja: (4/10)(6/9). Sumando: 48/90 = 8/15 ≈ 53,3 %.", incorrectExplanation: "Como se acepta cualquier orden, considera los dos casos posibles: roja y luego azul, o azul y luego roja. Calcula la probabilidad de cada secuencia sin reemplazo y suma ambas." },
                { topic: "Interpretación de datos", prompt: "De 48 estudiantes que estudian más de 5 horas por semana, 36 aprobaron. De los otros 32 estudiantes, aprobaron 20. ¿Cuántos puntos porcentuales mayor fue la tasa de aprobación del primer grupo?", choices: ["10 puntos", "12,5 puntos", "15 puntos", "25 puntos"], answer: "12,5 puntos", explanation: "El primer grupo aprobó en un 36/48 = 75 %; el segundo, en un 20/32 = 62,5 %. La diferencia es 75 % − 62,5 % = 12,5 puntos porcentuales.", incorrectExplanation: "Compara tasas, no cantidades totales de aprobados: calcula por separado la proporción de aprobados de cada grupo y luego resta los porcentajes para obtener los puntos porcentuales de diferencia." }
            ];

            const $ = (id) => document.getElementById(id);
            let game = null;
            let selectedAnswer = "";
            let lastResult = null;
            let feedbackVisible = false;
            let revealObserver = null;
            let timerInterval = 0;
            let nextRoundTimeout = 0;
            let supersonicTimeout = 0;
            let timerLastTick = 0;
            let audioContext = null;
            let ambientMusicInterval = 0;
            let ambientMusicStep = 0;
            let musicNoiseBuffer = null;
            let reactionTimeout = 0;
            let economyEffectTimeout = 0;
            let powerEffectTimeout = 0;
            let splashHideScheduled = false;
            let soundEnabled = true;
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            function animate(element, className) {
                element.classList.remove(className);
                void element.offsetWidth;
                element.classList.add(className);
            }

            function observeReveals(root = document) {
                if (!revealObserver) return;
                root.querySelectorAll(".reveal-target:not(.is-visible)").forEach((element) => {
                    revealObserver.observe(element);
                });
            }

            function hideSplashScreen() {
                if (splashHideScheduled) return;
                splashHideScheduled = true;
                const splash = $("splash-screen");
                if (!splash) return;
                const minimumDuration = 4000;
                const remainingDuration = Math.max(0, minimumDuration - (performance.now() - splashStartedAt));
                window.setTimeout(() => {
                    splash.classList.add("splash-screen--leaving");
                    window.setTimeout(() => splash.remove(), 500);
                }, remainingDuration);
            }

            function setupMotion() {
                const revealTargets = document.querySelectorAll(".hero, #start-panel, #teacher-view > .panel");
                revealTargets.forEach((element) => element.classList.add("reveal-target"));
                if (!reducedMotion) {
                    document.body.classList.add("motion-ready");
                    if ("IntersectionObserver" in window) {
                        revealObserver = new IntersectionObserver((entries, observer) => {
                            entries.forEach((entry) => {
                                if (entry.isIntersecting) {
                                    entry.target.classList.add("is-visible");
                                    observer.unobserve(entry.target);
                                }
                            });
                        }, { threshold: 0.12, rootMargin: "0px 0px -28px 0px" });
                        observeReveals();
                    } else {
                        revealTargets.forEach((element) => element.classList.add("is-visible"));
                    }
                } else {
                    revealTargets.forEach((element) => element.classList.add("is-visible"));
                }

                let scrollFrame = 0;
                const updateScrollEffects = () => {
                    scrollFrame = 0;
                    $("topbar").classList.toggle("is-scrolled", window.scrollY > 8);
                    if (!reducedMotion && window.matchMedia("(min-width: 701px)").matches) {
                        const activeHero = document.querySelector("#teacher-view:not(.hidden) .hero") ||
                            document.querySelector("#play-view .hero");
                        if (activeHero) {
                            activeHero.style.setProperty("--hero-parallax", `${Math.min(window.scrollY / 32, 10)}px`);
                        }
                    }
                };
                window.addEventListener("scroll", () => {
                    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
                }, { passive: true });
                updateScrollEffects();
            }

            function animateCounts(root) {
                root.querySelectorAll("[data-count]").forEach((element) => {
                    const target = Number(element.dataset.count);
                    if (!Number.isFinite(target)) return;
                    const decimals = Number(element.dataset.countDecimals) || 0;
                    const suffix = element.dataset.countSuffix || "";
                    const format = (value) => `${new Intl.NumberFormat("es-ES", {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    }).format(value)}${suffix}`;
                    if (reducedMotion) {
                        element.textContent = format(target);
                        return;
                    }
                    const duration = 650;
                    let startedAt = 0;
                    element.textContent = format(0);
                    const tick = (now) => {
                        if (!element.isConnected) return;
                        if (!startedAt) startedAt = now;
                        const progress = Math.min((now - startedAt) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        element.textContent = format(target * eased);
                        if (progress < 1) window.requestAnimationFrame(tick);
                    };
                    window.requestAnimationFrame(tick);
                });
            }

            function showToast(message) {
                const toast = $("toast");
                toast.textContent = message;
                toast.classList.remove("hidden");
                window.setTimeout(() => toast.classList.add("hidden"), 2800);
            }

            function showGameReaction(outcome) {
                const reactions = {
                    correct: ["😎", "¡Correcto!"],
                    incorrect: ["😡", "¡Sigue intentando!"],
                    timeout: ["🤔", "¡Piensa rápido!"]
                };
                const [emoji, caption] = reactions[outcome];
                const reaction = $("game-reaction");
                const icon = $("reaction-emoji");
                if (reactionTimeout) window.clearTimeout(reactionTimeout);
                reaction.className = `game-reaction game-reaction--${outcome}`;
                icon.textContent = emoji;
                icon.setAttribute("aria-label", caption);
                $("reaction-caption").textContent = caption;
                reactionTimeout = window.setTimeout(() => {
                    reaction.classList.add("hidden");
                    reactionTimeout = 0;
                }, REACTION_DURATION_MS);
            }

            function hideGameReaction() {
                if (reactionTimeout) window.clearTimeout(reactionTimeout);
                reactionTimeout = 0;
                $("game-reaction").className = "game-reaction hidden";
            }

            function showEconomyEffect({ points = 0, coinsGained = 0, coinsLost = 0 }) {
                if (!points && !coinsGained && !coinsLost) return;
                if (economyEffectTimeout) window.clearTimeout(economyEffectTimeout);
                document.querySelector(".economy-effect")?.remove();

                const effect = document.createElement("div");
                effect.className = `economy-effect economy-effect--${coinsLost ? "loss" : "gain"}`;
                effect.setAttribute("role", "status");
                effect.setAttribute("aria-live", "polite");
                effect.setAttribute("aria-atomic", "true");
                const message = document.createElement("strong");
                message.className = "economy-effect-message";
                message.textContent = coinsLost
                    ? `−${coinsLost} monedas`
                    : [points ? `+${points} puntos` : "", coinsGained ? `+${coinsGained} monedas` : ""]
                        .filter(Boolean)
                        .join(" · ");
                effect.appendChild(message);

                for (let index = 0; index < 18; index += 1) {
                    const particle = document.createElement("span");
                    particle.className = "economy-effect-particle";
                    particle.setAttribute("aria-hidden", "true");
                    particle.textContent = coinsLost || index % 4 ? "🪙" : "✦";
                    if (coinsLost) {
                        particle.style.setProperty("--particle-left", `${Math.random() * 100}%`);
                        particle.style.setProperty("--particle-delay", `${Math.random() * 500}ms`);
                    } else {
                        const angle = (Math.PI * 2 * index) / 18;
                        const distance = Math.max(window.innerWidth, window.innerHeight) * (0.35 + Math.random() * 0.3);
                        particle.style.setProperty("--particle-x", `${Math.cos(angle) * distance}px`);
                        particle.style.setProperty("--particle-y", `${Math.sin(angle) * distance}px`);
                        particle.style.setProperty("--particle-delay", `${Math.random() * 180}ms`);
                    }
                    effect.appendChild(particle);
                }

                document.body.appendChild(effect);
                economyEffectTimeout = window.setTimeout(() => {
                    effect.remove();
                    economyEffectTimeout = 0;
                }, 2400);
            }

            function showPowerActivation(power) {
                if (powerEffectTimeout) window.clearTimeout(powerEffectTimeout);
                document.querySelector(".power-activation-effect")?.remove();

                const effect = document.createElement("div");
                effect.className = "power-activation-effect";
                effect.setAttribute("role", "status");
                effect.setAttribute("aria-live", "polite");
                effect.setAttribute("aria-atomic", "true");

                const icon = document.createElement("span");
                icon.className = "power-activation-icon";
                icon.setAttribute("aria-hidden", "true");
                icon.textContent = power.icon;
                const title = document.createElement("strong");
                title.className = "power-activation-title";
                title.textContent = power.name;
                const caption = document.createElement("span");
                caption.className = "power-activation-caption";
                caption.textContent = "¡Poder activado!";
                effect.append(icon, caption, title);

                for (let index = 0; index < 12; index += 1) {
                    const spark = document.createElement("span");
                    spark.className = "power-activation-spark";
                    spark.setAttribute("aria-hidden", "true");
                    spark.textContent = index % 3 === 0 ? "✦" : "✧";
                    spark.style.setProperty("--spark-angle", `${index * 30}deg`);
                    spark.style.setProperty("--spark-delay", `${index % 4 * 35}ms`);
                    effect.appendChild(spark);
                }

                document.body.appendChild(effect);
                powerEffectTimeout = window.setTimeout(() => {
                    effect.remove();
                    powerEffectTimeout = 0;
                }, 1100);
            }

            function unlockAudio() {
                if (!soundEnabled) return;
                const AudioContextType = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextType) {
                    soundEnabled = false;
                    showToast("Este navegador no admite los sonidos del juego.");
                    return;
                }
                if (!audioContext) audioContext = new AudioContextType();
                if (audioContext.state === "suspended") {
                    audioContext.resume().catch((error) => {
                        console.warn("El navegador no permitió activar el sonido.", error);
                        soundEnabled = false;
                        showToast("No se pudieron activar los sonidos. Puedes continuar jugando.");
                    });
                }
            }

            function playSound(kind) {
                if (!soundEnabled) return;
                unlockAudio();
                if (!audioContext) return;
                const patterns = {
                    select: [{ frequency: 560, duration: 0.055, delay: 0 }],
                    power: [{ frequency: 620, duration: 0.07, delay: 0 }, { frequency: 820, duration: 0.09, delay: 0.065 }],
                    tick: [{ frequency: 620, duration: 0.045, delay: 0 }],
                    urgent: [{ frequency: 880, duration: 0.075, delay: 0 }],
                    correct: [{ frequency: 660, duration: 0.11, delay: 0 }, { frequency: 880, duration: 0.15, delay: 0.11 }],
                    incorrect: [{ frequency: 300, duration: 0.12, delay: 0 }, { frequency: 220, duration: 0.17, delay: 0.12 }],
                    timeout: [{ frequency: 210, duration: 0.18, delay: 0 }]
                };
                try {
                    const now = audioContext.currentTime;
                    patterns[kind].forEach(({ frequency, duration, delay }) => {
                        const oscillator = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        const start = now + delay;
                        oscillator.type = "sine";
                        oscillator.frequency.setValueAtTime(frequency, start);
                        gain.gain.setValueAtTime(0.0001, start);
                        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.012);
                        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                        oscillator.connect(gain);
                        gain.connect(audioContext.destination);
                        oscillator.start(start);
                        oscillator.stop(start + duration);
                    });
                } catch (error) {
                    console.error("No se pudo reproducir el sonido del juego.", error);
                    soundEnabled = false;
                }
            }

            function stopAmbientMusic() {
                if (ambientMusicInterval) window.clearInterval(ambientMusicInterval);
                ambientMusicInterval = 0;
            }

            function playAmbientNote() {
                if (!soundEnabled || !audioContext || audioContext.state !== "running") return;
                const melody = [
                    74, 77, 81, null, 84, 81, 79, 77,
                    74, null, 77, 79, 81, 77, 74, null,
                    76, 79, 83, null, 86, 83, 81, 79,
                    76, null, 79, 81, 83, 79, 76, null
                ];
                const bassline = [38, 38, 45, 45, 41, 41, 36, 36];
                const chords = [[50, 57, 62], [47, 54, 59], [45, 52, 57], [43, 50, 55]];
                const step = ambientMusicStep % melody.length;
                const now = audioContext.currentTime;
                const noteFrequency = (midiNote) => 440 * Math.pow(2, (midiNote - 69) / 12);
                if (!musicNoiseBuffer) {
                    musicNoiseBuffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.14), audioContext.sampleRate);
                    const noise = musicNoiseBuffer.getChannelData(0);
                    for (let index = 0; index < noise.length; index += 1) noise[index] = Math.random() * 2 - 1;
                }
                const playNote = (midiNote, type, peakVolume, duration, attack = 0.025, filterFrequency = 2400) => {
                    const oscillator = audioContext.createOscillator();
                    const volume = audioContext.createGain();
                    const filter = audioContext.createBiquadFilter();
                    oscillator.type = type;
                    oscillator.frequency.setValueAtTime(noteFrequency(midiNote), now);
                    filter.type = "lowpass";
                    filter.frequency.setValueAtTime(filterFrequency, now);
                    volume.gain.setValueAtTime(0.0001, now);
                    volume.gain.linearRampToValueAtTime(peakVolume, now + attack);
                    volume.gain.setValueAtTime(peakVolume, now + duration * 0.45);
                    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
                    oscillator.connect(filter);
                    filter.connect(volume);
                    volume.connect(audioContext.destination);
                    oscillator.start(now);
                    oscillator.stop(now + duration + 0.01);
                };

                if (melody[step] !== null) {
                    playNote(melody[step], "triangle", 0.026, 0.22, 0.018, 3200);
                    if (step % 4 === 0) playNote(melody[step] - 12, "sawtooth", 0.007, 0.25, 0.035, 1500);
                }

                if (step % 2 === 0) {
                    playNote(bassline[Math.floor(step / 2) % bassline.length], "triangle", 0.025, 0.28, 0.012, 700);
                }

                if (step % 8 === 0) {
                    const chord = chords[Math.floor(step / 8) % chords.length];
                    chord.forEach((note, index) => playNote(note, "sawtooth", index === 0 ? 0.006 : 0.004, 1.8, 0.22, 1100));
                }

                if (step % 4 === 0) {
                    const kick = audioContext.createOscillator();
                    const kickVolume = audioContext.createGain();
                    kick.type = "sine";
                    kick.frequency.setValueAtTime(138, now);
                    kick.frequency.exponentialRampToValueAtTime(42, now + 0.16);
                    kickVolume.gain.setValueAtTime(0.0001, now);
                    kickVolume.gain.linearRampToValueAtTime(0.09, now + 0.009);
                    kickVolume.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
                    kick.connect(kickVolume);
                    kickVolume.connect(audioContext.destination);
                    kick.start(now);
                    kick.stop(now + 0.21);
                }

                if (step % 4 === 2) {
                    const snare = audioContext.createBufferSource();
                    const snareFilter = audioContext.createBiquadFilter();
                    const snareVolume = audioContext.createGain();
                    snare.buffer = musicNoiseBuffer;
                    snareFilter.type = "bandpass";
                    snareFilter.frequency.setValueAtTime(1500, now);
                    snareVolume.gain.setValueAtTime(0.0001, now);
                    snareVolume.gain.linearRampToValueAtTime(0.035, now + 0.008);
                    snareVolume.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
                    snare.connect(snareFilter);
                    snareFilter.connect(snareVolume);
                    snareVolume.connect(audioContext.destination);
                    snare.start(now);
                }

                if (step % 2 === 1) {
                    const cymbal = audioContext.createBufferSource();
                    const cymbalFilter = audioContext.createBiquadFilter();
                    const cymbalVolume = audioContext.createGain();
                    cymbal.buffer = musicNoiseBuffer;
                    cymbalFilter.type = "highpass";
                    cymbalFilter.frequency.setValueAtTime(6500, now);
                    cymbalVolume.gain.setValueAtTime(0.0001, now);
                    cymbalVolume.gain.linearRampToValueAtTime(0.009, now + 0.004);
                    cymbalVolume.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
                    cymbal.connect(cymbalFilter);
                    cymbalFilter.connect(cymbalVolume);
                    cymbalVolume.connect(audioContext.destination);
                    cymbal.start(now);
                }

                ambientMusicStep += 1;
            }

            function startAmbientMusic() {
                stopAmbientMusic();
                if (!soundEnabled || !audioContext || !game || game.questionResolved) return;
                ambientMusicStep = 0;
                playAmbientNote();
                ambientMusicInterval = window.setInterval(playAmbientNote, 250);
            }

            function formatResponseTime(elapsedMs) {
                if (!Number.isFinite(elapsedMs)) return "tiempo no disponible";
                return `${(elapsedMs / 1000).toLocaleString("es-ES", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                })} s`;
            }

            function formatAnswerLog(answers) {
                const attemptsByQuestion = new Map();
                return (answers || []).map((answer) => {
                    const attempt = (attemptsByQuestion.get(answer.question) || 0) + 1;
                    attemptsByQuestion.set(answer.question, attempt);
                    const status = answer.timeout
                        ? "SIN RESPONDER (tiempo agotado)"
                        : answer.protected
                            ? "INCORRECTA (intento protegido)"
                            : answer.correct ? "CORRECTA" : "INCORRECTA";
                    const elapsed = answer.timeout
                        ? "30,0 s (tiempo agotado)"
                        : Number.isFinite(answer.elapsedMs)
                            ? formatResponseTime(answer.elapsedMs)
                            : "tiempo no registrado";
                    const points = answer.points > 0 ? `+${answer.points}` : String(answer.points);
                    const coins = answer.correct
                        ? (answer.wager ? `+${answer.wager} monedas` : "sin cambio")
                        : answer.protected
                            ? "sin pérdida (intento protegido)"
                            : answer.wager ? `−${answer.wager} monedas` : "sin cambio";
                    return [
                        `Pregunta ${answer.question}${attempt > 1 ? ` · Intento ${attempt}` : ""} — ${status}`,
                        `Tiempo: ${elapsed}`,
                        `Puntos: ${points} puntos`,
                        `Monedas: ${coins}`
                    ].join("\n");
                }).join("\n\n") || "No hay respuestas registradas.";
            }

            function createAnswerDetails(answers) {
                const disclosure = document.createElement("details");
                disclosure.className = "answer-log-details";
                const summary = document.createElement("summary");
                summary.textContent = `Ver detalle de preguntas (${(answers || []).length})`;
                disclosure.appendChild(summary);
                const list = document.createElement("div");
                list.className = "answer-log";
                const attemptsByQuestion = new Map();
                (answers || []).forEach((answer) => {
                    const attempt = (attemptsByQuestion.get(answer.question) || 0) + 1;
                    attemptsByQuestion.set(answer.question, attempt);
                    const entry = document.createElement("div");
                    entry.className = `answer-log-entry${answer.correct ? " is-correct" : answer.timeout ? " is-timeout" : " is-incorrect"}`;
                    const heading = document.createElement("strong");
                    const status = answer.timeout
                        ? "Sin responder · tiempo agotado"
                        : answer.protected
                            ? "Incorrecta · intento protegido"
                            : answer.correct ? "Correcta" : "Incorrecta";
                    heading.textContent = `Pregunta ${answer.question}${attempt > 1 ? ` · Intento ${attempt}` : ""} — ${status}`;
                    const elapsed = answer.timeout
                        ? "30,0 s · tiempo agotado"
                        : Number.isFinite(answer.elapsedMs)
                            ? formatResponseTime(answer.elapsedMs)
                            : "Tiempo no registrado";
                    const points = answer.points > 0 ? `+${answer.points}` : String(answer.points);
                    const coins = answer.correct
                        ? (answer.wager ? `+${answer.wager} monedas` : "Sin cambio")
                        : answer.protected
                            ? "Sin pérdida · intento protegido"
                            : answer.wager ? `−${answer.wager} monedas` : "Sin cambio";
                    const details = document.createElement("span");
                    details.textContent = `Tiempo: ${elapsed} · Puntos: ${points} puntos · Monedas: ${coins}`;
                    entry.append(heading, details);
                    list.appendChild(entry);
                });
                if (!list.childElementCount) list.textContent = "No hay respuestas registradas.";
                disclosure.appendChild(list);
                return disclosure;
            }

            function showView(view) {
                const play = view === "play";
                $("play-view").classList.toggle("hidden", !play);
                $("teacher-view").classList.toggle("hidden", play);
                $("play-tab").classList.toggle("active", play);
                $("teacher-tab").classList.toggle("active", !play);
                $("play-tab").setAttribute("aria-selected", String(play));
                $("teacher-tab").setAttribute("aria-selected", String(!play));
                if (!play) renderLeaderboard();
                animate(play ? $("play-view") : $("teacher-view"), "view-enter");
                observeReveals(play ? $("play-view") : $("teacher-view"));
            }

            function safeReadResults() {
                try {
                    const stored = JSON.parse(localStorage.getItem(RESULTS_KEY) || "[]");
                    if (!Array.isArray(stored)) return [];
                    const uniqueResults = new Map();
                    stored.filter(isValidResult).forEach((result) => {
                        if (!uniqueResults.has(result.id)) uniqueResults.set(result.id, result);
                    });
                    return [...uniqueResults.values()];
                } catch (error) {
                    console.error("No se pudieron leer los resultados guardados.", error);
                    return [];
                }
            }

            function safeReadPlayerResults() {
                try {
                    const stored = JSON.parse(localStorage.getItem(PLAYER_RESULTS_KEY) || "[]");
                    if (!Array.isArray(stored)) return [];
                    const uniqueResults = new Map();
                    stored.filter(isValidResult).forEach((result) => {
                        if (!uniqueResults.has(result.id)) uniqueResults.set(result.id, result);
                    });
                    return [...uniqueResults.values()];
                } catch (error) {
                    console.error("No se pudo leer el historial local del jugador.", error);
                    return null;
                }
            }

            function isValidResult(value) {
                return value && value.version === 1 && typeof value.id === "string" &&
                    typeof value.name === "string" && Number.isInteger(value.correct) &&
                    Number.isInteger(value.total) && Number.isFinite(value.coins) &&
                    Number.isFinite(value.score) && typeof value.date === "string" &&
                    (value.incorrect === undefined || Number.isInteger(value.incorrect)) &&
                    (value.timeouts === undefined || Number.isInteger(value.timeouts)) &&
                    (value.pointsEarned === undefined || Number.isFinite(value.pointsEarned)) &&
                    (value.accuracy === undefined || Number.isFinite(value.accuracy)) &&
                    (value.powersUsed === undefined || (Array.isArray(value.powersUsed) &&
                        value.powersUsed.every((powerId) => typeof powerId === "string"))) &&
                    (value.answers === undefined || (Array.isArray(value.answers) &&
                        value.answers.every((answer) => answer &&
                            Number.isInteger(answer.question) &&
                            typeof answer.correct === "boolean" &&
                            typeof answer.timeout === "boolean" &&
                            Number.isInteger(answer.points) &&
                            Number.isInteger(answer.wager) && answer.wager >= 0 &&
                            (answer.protected === undefined || typeof answer.protected === "boolean") &&
                            (answer.elapsedMs === undefined ||
                                (Number.isInteger(answer.elapsedMs) && answer.elapsedMs >= 0)))));
            }

            function toBase64Url(text) {
                const bytes = new TextEncoder().encode(text);
                let binary = "";
                bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
                return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
            }

            function fromBase64Url(text) {
                const normalized = text.replace(/-/g, "+").replace(/_/g, "/");
                const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
                const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
                return new TextDecoder().decode(bytes);
            }

            function resultChecksum(payload) {
                let hash = 2166136261;
                for (let index = 0; index < payload.length; index += 1) {
                    hash ^= payload.charCodeAt(index);
                    hash = Math.imul(hash, 16777619);
                }
                return (hash >>> 0) % 46656;
            }

            function encodeResult(result) {
                const idParts = /^(\d+)-([a-z0-9]+)$/i.exec(result.id);
                const timestamp = idParts ? Number(idParts[1]) : Date.parse(result.date);
                if (!Number.isSafeInteger(timestamp) || !Number.isSafeInteger(result.coins) ||
                    !Number.isSafeInteger(result.score) || !Number.isInteger(result.correct) ||
                    !Number.isInteger(result.total) || result.name.length > 32) {
                    throw new Error("No se pudo crear un código corto para este resultado.");
                }
                const nonce = idParts ? idParts[2].toLowerCase() : Math.random().toString(36).slice(2, 9);
                const powerMask = (result.powersUsed || []).reduce((mask, powerId) => {
                    const index = powers.findIndex((power) => power.id === powerId);
                    return index < 0 ? mask : mask | (1 << index);
                }, 0);
                const answers = toBase64Url((result.answers || []).map((answer) =>
                    [
                        answer.question.toString(36),
                        answer.timeout ? "t" : answer.protected ? "i" : answer.correct ? "c" : "w",
                        answer.points.toString(36),
                        answer.wager.toString(36),
                        Number.isFinite(answer.elapsedMs)
                            ? Math.round(answer.elapsedMs / 100).toString(36)
                            : ""
                    ].join("~")
                ).join(","));
                const payload = [
                    timestamp.toString(36),
                    nonce,
                    toBase64Url(result.name),
                    result.correct.toString(36),
                    result.total.toString(36),
                    result.coins.toString(36),
                    result.score.toString(36),
                    (result.incorrect || 0).toString(36),
                    (result.timeouts || 0).toString(36),
                    (result.pointsEarned === undefined ? result.score : result.pointsEarned).toString(36),
                    powerMask.toString(36),
                    answers
                ].join(".");
                const checksum = resultChecksum(payload).toString(36).padStart(3, "0");
                return `MD4.${payload}.${checksum}`;
            }

            function createResultLink(code) {
                const resultUrl = new URL(window.location.href);
                resultUrl.hash = new URLSearchParams({ resultado: code }).toString();
                return resultUrl.toString();
            }

            function decodeResult(code) {
                if (code.startsWith("MD4.")) {
                    const parts = code.split(".");
                    if (parts.length !== 14 || !/^[a-z0-9]+$/i.test(parts[1]) ||
                        !/^[a-z0-9]+$/i.test(parts[2]) || !/^[a-z0-9_-]+$/i.test(parts[3]) ||
                        parts.slice(4, 12).some((part, index) =>
                            !(index === 2 ? /^-?[a-z0-9]+$/i : /^[a-z0-9]+$/i).test(part)) ||
                        !/^[a-z0-9_-]*$/i.test(parts[12]) || !/^[a-z0-9]{3}$/i.test(parts[13])) {
                        throw new Error("Enlace de resultado con formato incorrecto.");
                    }
                    const payload = parts.slice(1, 13).join(".");
                    if (resultChecksum(payload).toString(36).padStart(3, "0") !== parts[13].toLowerCase()) {
                        throw new Error("El enlace está incompleto o tiene errores.");
                    }
                    const timestamp = Number.parseInt(parts[1], 36);
                    const powerMask = Number.parseInt(parts[11], 36);
                    if (!Number.isSafeInteger(timestamp) || !Number.isSafeInteger(powerMask) ||
                        powerMask > (1 << powers.length) - 1) {
                        throw new Error("El enlace contiene datos fuera de rango.");
                    }
                    const powersUsed = powers.filter((power, index) => powerMask & (1 << index))
                        .map((power) => power.id);
                    const answerEntries = fromBase64Url(parts[12]).split(",").filter(Boolean)
                        .map((entry) => entry.split("~"));
                    if (answerEntries.some((entry) =>
                        entry.length !== 5 || !/^[a-z0-9]+$/i.test(entry[0]) ||
                        !["c", "w", "t", "i"].includes(entry[1]) ||
                        !/^-?[a-z0-9]+$/i.test(entry[2]) || !/^[a-z0-9]+$/i.test(entry[3]) ||
                        (entry[4] !== "" && !/^[a-z0-9]+$/i.test(entry[4]))
                    )) {
                        throw new Error("El detalle de respuestas del enlace no es válido.");
                    }
                    const answers = answerEntries.map((entry) => ({
                        question: Number.parseInt(entry[0], 36),
                        correct: entry[1] === "c",
                        timeout: entry[1] === "t",
                        ...(entry[1] === "i" ? { protected: true } : {}),
                        points: Number.parseInt(entry[2], 36),
                        wager: Number.parseInt(entry[3], 36),
                        ...(entry[4] !== "" ? { elapsedMs: Number.parseInt(entry[4], 36) * 100 } : {})
                    })).sort((a, b) => a.question - b.question);
                    const result = {
                        version: 1,
                        id: `${timestamp}-${parts[2]}`,
                        name: fromBase64Url(parts[3]),
                        correct: Number.parseInt(parts[4], 36),
                        total: Number.parseInt(parts[5], 36),
                        coins: Number.parseInt(parts[6], 36),
                        score: Number.parseInt(parts[7], 36),
                        incorrect: Number.parseInt(parts[8], 36),
                        timeouts: Number.parseInt(parts[9], 36),
                        pointsEarned: Number.parseInt(parts[10], 36),
                        powersUsed,
                        answers,
                        accuracy: 0,
                        date: new Date(timestamp).toISOString()
                    };
                    if (!isValidResult(result) || ![8, questions.length].includes(result.total) ||
                        result.correct < 0 || result.correct > result.total ||
                        result.incorrect < 0 || result.timeouts < 0 ||
                        result.name.trim().length === 0 || result.name.length > 32 ||
                        result.score < 0 || result.pointsEarned < 0 ||
                        answers.length > questions.length + 2 ||
                        answers.some((answer) => !Number.isInteger(answer.question) ||
                            answer.question < 1 || answer.question > result.total ||
                            !Number.isInteger(answer.points) || !Number.isInteger(answer.wager) || answer.wager < 0 ||
                            (answer.elapsedMs !== undefined &&
                                (!Number.isInteger(answer.elapsedMs) || answer.elapsedMs < 0 || answer.elapsedMs > QUESTION_TIME_MS)))) {
                        throw new Error("El enlace no contiene un resultado válido.");
                    }
                    result.accuracy = result.correct + result.incorrect === 0
                        ? 0
                        : Math.round(result.correct / (result.correct + result.incorrect) * 100);
                    return result;
                }
                if (code.startsWith("MD3.")) {
                    const parts = code.split(".");
                    if (parts.length !== 13 || !/^[a-z0-9]+$/i.test(parts[1]) ||
                        !/^[a-z0-9]+$/i.test(parts[2]) || !/^[a-z0-9_-]+$/i.test(parts[3]) ||
                        parts.slice(4, 12).some((part) => !/^[a-z0-9]+$/i.test(part)) ||
                        !/^[a-z0-9]{3}$/i.test(parts[12])) {
                        throw new Error("Enlace de resultado con formato incorrecto.");
                    }
                    const payload = parts.slice(1, 12).join(".");
                    if (resultChecksum(payload).toString(36).padStart(3, "0") !== parts[12].toLowerCase()) {
                        throw new Error("El enlace está incompleto o tiene errores.");
                    }
                    const timestamp = Number.parseInt(parts[1], 36);
                    const powerMask = Number.parseInt(parts[11], 36);
                    if (!Number.isSafeInteger(timestamp) || !Number.isSafeInteger(powerMask) ||
                        powerMask > (1 << powers.length) - 1) {
                        throw new Error("El enlace contiene datos fuera de rango.");
                    }
                    const powersUsed = powers.filter((power, index) => powerMask & (1 << index))
                        .map((power) => power.id);
                    const result = {
                        version: 1,
                        id: `${timestamp}-${parts[2]}`,
                        name: fromBase64Url(parts[3]),
                        correct: Number.parseInt(parts[4], 36),
                        total: Number.parseInt(parts[5], 36),
                        coins: Number.parseInt(parts[6], 36),
                        score: Number.parseInt(parts[7], 36),
                        incorrect: Number.parseInt(parts[8], 36),
                        timeouts: Number.parseInt(parts[9], 36),
                        pointsEarned: Number.parseInt(parts[10], 36),
                        powersUsed,
                        answers: [],
                        summaryOnly: true,
                        accuracy: 0,
                        date: new Date(timestamp).toISOString()
                    };
                    if (!isValidResult(result) || ![8, questions.length].includes(result.total) ||
                        result.correct < 0 || result.correct > result.total ||
                        result.incorrect < 0 || result.timeouts < 0 ||
                        result.name.trim().length === 0 || result.name.length > 32 ||
                        result.coins < 0 || result.score < 0 || result.pointsEarned < 0) {
                        throw new Error("El enlace no contiene un resultado válido.");
                    }
                    result.accuracy = result.correct + result.incorrect === 0
                        ? 0
                        : Math.round(result.correct / (result.correct + result.incorrect) * 100);
                    return result;
                }
                if (code.startsWith("MD2.")) {
                    const parts = code.split(".");
                    if (parts.length !== 14 || !/^[a-z0-9]+$/i.test(parts[1]) ||
                        !/^[a-z0-9]+$/i.test(parts[2]) || !/^[a-z0-9_-]+$/i.test(parts[3]) ||
                        !/^[a-z0-9]+$/i.test(parts[4]) || !/^[a-z0-9]+$/i.test(parts[5]) ||
                        !/^[a-z0-9]+$/i.test(parts[6]) || !/^[a-z0-9]+$/i.test(parts[7]) ||
                        !/^[a-z0-9]+$/i.test(parts[8]) || !/^[a-z0-9]+$/i.test(parts[9]) ||
                        !/^[a-z0-9]+$/i.test(parts[10]) || !/^[a-z0-9_-]*$/i.test(parts[11]) ||
                        !/^[a-z0-9_-]*$/i.test(parts[12]) || !/^[a-z0-9]{3}$/i.test(parts[13])) {
                        throw new Error("Código con estadísticas con formato incorrecto.");
                    }
                    const payload = parts.slice(1, 13).join(".");
                    if (resultChecksum(payload).toString(36).padStart(3, "0") !== parts[13].toLowerCase()) {
                        throw new Error("El código está incompleto o tiene errores.");
                    }
                    const timestamp = Number.parseInt(parts[1], 36);
                    const powersUsed = fromBase64Url(parts[11]).split(",").filter(Boolean);
                    const answerEntries = fromBase64Url(parts[12]).split(",").filter(Boolean).map((entry) => entry.split("~"));
                    if (answerEntries.some((entry) =>
                        ![4, 5].includes(entry.length) || !["c", "w", "t", "i"].includes(entry[1]) ||
                        (entry.length === 5 && entry[4] !== "" && !/^[a-z0-9]+$/i.test(entry[4]))
                    )) {
                        throw new Error("El registro de respuestas del código no es válido.");
                    }
                    const answers = answerEntries.map((entry) => {
                        const [question, outcome, points, wager] = entry;
                        return {
                            question: Number.parseInt(question, 36),
                            correct: outcome === "c",
                            timeout: outcome === "t",
                            ...(outcome === "i" ? { protected: true } : {}),
                            points: Number.parseInt(points, 36),
                            wager: Number.parseInt(wager, 36),
                            ...(entry.length === 5 && entry[4] !== ""
                                ? { elapsedMs: Number.parseInt(entry[4], 36) * 100 }
                                : {})
                        };
                    });
                    const result = {
                        version: 1,
                        id: `${timestamp}-${parts[2]}`,
                        name: fromBase64Url(parts[3]),
                        correct: Number.parseInt(parts[4], 36),
                        total: Number.parseInt(parts[5], 36),
                        coins: Number.parseInt(parts[6], 36),
                        score: Number.parseInt(parts[7], 36),
                        incorrect: Number.parseInt(parts[8], 36),
                        timeouts: Number.parseInt(parts[9], 36),
                        pointsEarned: Number.parseInt(parts[10], 36),
                        powersUsed,
                        answers,
                        accuracy: 0,
                        date: new Date(timestamp).toISOString()
                    };
                    if (!isValidResult(result) || ![8, questions.length].includes(result.total) ||
                        result.correct < 0 || result.correct > result.total ||
                        result.incorrect < 0 || result.timeouts < 0 ||
                        result.name.trim().length === 0 || result.name.length > 32 ||
                        result.coins < 0 || result.score < 0 || result.pointsEarned < 0 ||
                        powersUsed.some((powerId) => !powers.some((power) => power.id === powerId)) ||
                        answers.length > questions.length + 2 ||
                        answers.some((answer) => !Number.isInteger(answer.question) ||
                            answer.question < 1 || answer.question > result.total ||
                            !Number.isInteger(answer.points) || !Number.isInteger(answer.wager) || answer.wager < 0 ||
                            (answer.elapsedMs !== undefined &&
                                (!Number.isInteger(answer.elapsedMs) || answer.elapsedMs < 0 || answer.elapsedMs > QUESTION_TIME_MS)))) {
                        throw new Error("El código no contiene un resultado válido.");
                    }
                    result.accuracy = result.correct + result.incorrect === 0
                        ? 0
                        : Math.round(result.correct / (result.correct + result.incorrect) * 100);
                    return result;
                }
                if (code.startsWith("MD1.")) {
                    const parts = code.split(".");
                    if (parts.length !== 9 || !/^[a-z0-9]+$/i.test(parts[1]) ||
                        !/^[a-z0-9]+$/i.test(parts[2]) || !/^[a-z0-9_-]*$/i.test(parts[3]) ||
                        !/^[a-z0-9]+$/i.test(parts[4]) || !/^[a-z0-9]+$/i.test(parts[5]) ||
                        !/^[a-z0-9]+$/i.test(parts[6]) || !/^[a-z0-9]+$/i.test(parts[7]) ||
                        !/^[a-z0-9]{3}$/i.test(parts[8])) {
                        throw new Error("Código corto con formato incorrecto.");
                    }
                    const payload = parts.slice(1, 8).join(".");
                    if (resultChecksum(payload).toString(36).padStart(3, "0") !== parts[8].toLowerCase()) {
                        throw new Error("El código corto está incompleto o tiene errores.");
                    }
                    const timestamp = Number.parseInt(parts[1], 36);
                    const result = {
                        version: 1,
                        id: `${timestamp}-${parts[2]}`,
                        name: fromBase64Url(parts[3]),
                        correct: Number.parseInt(parts[4], 36),
                        total: Number.parseInt(parts[5], 36),
                        coins: Number.parseInt(parts[6], 36),
                        score: Number.parseInt(parts[7], 36),
                        date: new Date(timestamp).toISOString()
                    };
                    if (!isValidResult(result) || ![8, questions.length].includes(result.total) ||
                        result.correct < 0 || result.correct > result.total ||
                        result.name.trim().length === 0 || result.name.length > 32 ||
                        result.coins < 0 || result.score < 0) {
                        throw new Error("El código no contiene un resultado válido.");
                    }
                    return result;
                }

                const normalized = code.trim().replace(/-/g, "+").replace(/_/g, "/");
                if (!normalized || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) throw new Error("Código con formato incorrecto.");
                const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
                const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
                const result = JSON.parse(new TextDecoder().decode(bytes));
                if (!isValidResult(result) || ![8, questions.length].includes(result.total) ||
                    result.correct < 0 || result.correct > result.total ||
                    result.name.trim().length === 0 || result.name.length > 32 ||
                    result.coins < 0 || result.score < 0) {
                    throw new Error("El código no contiene un resultado válido.");
                }
                return result;
            }

            let selectedPowers = new Set();

            function renderPowerPicker() {
                const picker = $("power-picker");
                picker.replaceChildren();
                powers.forEach((power) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = `power-option${selectedPowers.has(power.id) ? " selected" : ""}`;
                    if (selectedPowers.has(power.id)) button.classList.add("power-selected");
                    button.setAttribute("aria-pressed", String(selectedPowers.has(power.id)));
                    const icon = document.createElement("span");
                    icon.className = "power-icon";
                    icon.textContent = power.icon;
                    const copy = document.createElement("span");
                    copy.className = "power-option-copy";
                    const name = document.createElement("strong");
                    name.textContent = power.name;
                    const description = document.createElement("small");
                    description.textContent = power.description;
                    copy.append(name, description);
                    button.append(icon, copy);
                    button.addEventListener("click", () => {
                        if (selectedPowers.has(power.id)) selectedPowers.delete(power.id);
                        else if (selectedPowers.size < 3) selectedPowers.add(power.id);
                        else {
                            showToast("Puedes elegir hasta tres poderes.");
                            return;
                        }
                        $("power-count").textContent = `${selectedPowers.size} / 3`;
                        $("start-button").disabled = selectedPowers.size !== 3;
                        renderPowerPicker();
                    });
                    picker.appendChild(button);
                });
                networkPowers.forEach((powerId) => {
                    const [name, description] = POWER_DETAILS[powerId];
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "power-option";
                    button.disabled = true;
                    button.title = "Disponible en modo multijugador conectado.";
                    const icon = document.createElement("span");
                    icon.className = "power-icon";
                    icon.textContent = "⊘";
                    const copy = document.createElement("span");
                    copy.className = "power-option-copy";
                    copy.innerHTML = `<strong></strong><small></small>`;
                    copy.querySelector("strong").textContent = name;
                    copy.querySelector("small").textContent = description;
                    button.append(icon, copy);
                    picker.appendChild(button);
                });
            }

            function startGame() {
                const name = $("player-name").value.trim();
                if (!name) {
                    $("player-name").focus();
                    showToast("Escribe tu nombre para comenzar.");
                    return;
                }
                if (selectedPowers.size !== 3) {
                    showToast("Elige tres poderes para comenzar.");
                    return;
                }
                unlockAudio();
                game = {
                    name,
                    coins: STARTING_COINS,
                    score: 0,
                    pointsEarned: 0,
                    correct: 0,
                    incorrect: 0,
                    timeouts: 0,
                    streak: 0,
                    round: 0,
                    answers: [],
                    powers: [...selectedPowers],
                    powersUsed: [],
                    hiddenChoices: new Set(),
                    questionResolved: false,
                    answerLocked: false,
                    immunityRetryAvailable: false,
                    remainingMs: QUESTION_TIME_MS,
                    lastWager: 0,
                    effects: {
                        supersonicUntil: 0,
                        streakBooster: false,
                        doubleJeopardy: false,
                        doublePoints: false,
                        immunity: false,
                        streakSaver: false,
                        freezeUntil: 0
                    }
                };
                selectedAnswer = "";
                feedbackVisible = false;
                $("start-panel").classList.add("hidden");
                $("result-panel").classList.add("hidden");
                $("game-panel").classList.remove("hidden");
                startAmbientMusic();
                renderRound();
            }

            function renderPlayerProfile() {
                const message = $("player-profile-message");
                const stats = $("player-profile-stats");
                const name = $("player-name").value.trim();
                stats.replaceChildren();
                stats.classList.add("hidden");

                if (!name) {
                    message.textContent = "Escribe tu nombre para consultar tus partidas guardadas.";
                    return;
                }

                const storedResults = safeReadPlayerResults();
                if (!storedResults) {
                    message.textContent = "No se pudo consultar el historial local en este navegador.";
                    return;
                }

                const normalizedName = name.toLocaleLowerCase("es");
                const playerResults = storedResults.filter((result) =>
                    result.name.trim().toLocaleLowerCase("es") === normalizedName
                );
                if (!playerResults.length) {
                    message.textContent = "Todavía no hay partidas guardadas con este nombre en este dispositivo.";
                    return;
                }

                const bestScore = Math.max(...playerResults.map((result) => result.score));
                const averageAccuracy = Math.round(playerResults.reduce((sum, result) =>
                    sum + (result.accuracy ?? (result.total
                        ? Math.round(result.correct / result.total * 100)
                        : 0)), 0
                ) / playerResults.length);
                const metrics = [
                    ["Partidas", playerResults.length.toLocaleString("es-ES")],
                    ["Récord de puntos", bestScore.toLocaleString("es-ES")],
                    ["Precisión promedio", `${averageAccuracy} %`]
                ];
                metrics.forEach(([label, value]) => {
                    const metric = document.createElement("div");
                    metric.className = "player-profile-stat";
                    const caption = document.createElement("span");
                    caption.textContent = label;
                    const amount = document.createElement("strong");
                    amount.textContent = value;
                    metric.append(caption, amount);
                    stats.appendChild(metric);
                });
                message.textContent = `Historial local de ${name}; solo se consulta en este dispositivo.`;
                stats.classList.remove("hidden");
            }

            function powerStatus(powerId) {
                if (game.powersUsed.includes(powerId)) return "Usado";
                if (powerId === "fifty-fifty" && game.hiddenChoices.size > 0) return "Ya hay opciones eliminadas";
                if (powerId === "eraser" && game.hiddenChoices.size >= 2) return "Ya hay dos opciones eliminadas";
                if (powerId === "supersonic" && game.effects.supersonicUntil > performance.now()) return "Activo";
                if (powerId === "streak-booster" && game.effects.streakBooster) return "Activo";
                if (powerId === "double-jeopardy" && game.effects.doubleJeopardy) return "Activo";
                if (powerId === "double-points" && game.effects.doublePoints) return "Activo";
                if (powerId === "immunity" && (game.effects.immunity || game.immunityRetryAvailable)) return "Activo";
                if (powerId === "streak-saver" && game.effects.streakSaver) return "Activo";
                if (powerId === "time-freeze" && game.effects.freezeUntil > performance.now()) return "Activo";
                return "Usar";
            }

            function updateActivePowers() {
                const list = $("active-powers");
                if (!list) return;
                const now = performance.now();
                const badges = [];
                if (game.effects.supersonicUntil > now) badges.push("Supersónico activo");
                if (game.effects.streakBooster) badges.push("Potenciador de racha activo");
                if (game.effects.doublePoints) badges.push("Puntos dobles: siguiente acierto");
                if (game.effects.doubleJeopardy) badges.push("Doble riesgo en esta pregunta");
                if (game.effects.immunity || game.immunityRetryAvailable) badges.push("Inmunidad preparada");
                if (game.effects.streakSaver) badges.push("Protector de racha preparado");
                if (game.effects.freezeUntil > now) badges.push("Tiempo congelado");
                list.replaceChildren();
                badges.forEach((label) => {
                    const badge = document.createElement("span");
                    badge.className = "power-active-badge";
                    badge.textContent = label;
                    list.appendChild(badge);
                });
            }

            function renderPowerButtons() {
                const container = $("power-buttons");
                if (!container || !game) return;
                container.replaceChildren();
                game.powers.forEach((powerId) => {
                    const power = powers.find((item) => item.id === powerId);
                    if (!power) return;
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "power-use";
                    if (game.lastActivatedPower === powerId) button.classList.add("power-activated");
                    button.textContent = `${power.icon} ${power.name}`;
                    const small = document.createElement("small");
                    small.textContent = powerStatus(powerId);
                    button.appendChild(small);
                    button.disabled = game.questionResolved || game.powersUsed.includes(powerId) ||
                        (powerId === "fifty-fifty" && game.hiddenChoices.size > 0) ||
                        (powerId === "eraser" && game.hiddenChoices.size >= 2);
                    button.setAttribute("aria-pressed", String(powerStatus(powerId) === "Activo"));
                    button.title = power.description;
                    button.addEventListener("click", () => activatePower(powerId));
                    container.appendChild(button);
                });
                updateActivePowers();
            }

            function updateTimerDisplay() {
                const timer = $("timer");
                if (!timer || !game) return;
                const seconds = Math.ceil(game.remainingMs / 1000);
                const frozen = game.effects.freezeUntil > performance.now();
                timer.querySelector("#timer-seconds").textContent = `${seconds}s`;
                timer.classList.toggle("urgent", seconds <= 8);
                timer.classList.toggle("frozen", frozen);
                $("game-panel").classList.toggle("timer-freeze", frozen);
                const bar = timer.querySelector(".timer-bar span");
                bar.style.width = `${Math.max(0, game.remainingMs / QUESTION_TIME_MS * 100)}%`;
                timer.setAttribute("aria-valuenow", String(seconds));
                timer.setAttribute("aria-label", frozen ? `Tiempo congelado, ${seconds} segundos restantes` : `${seconds} segundos restantes`);
                if (frozen !== game.lastTimerFrozen) {
                    game.lastTimerFrozen = frozen;
                    updateActivePowers();
                }
            }

            function stopQuestionTimer() {
                if (timerInterval) window.clearInterval(timerInterval);
                timerInterval = 0;
            }

            function startQuestionTimer() {
                stopQuestionTimer();
                game.remainingMs = QUESTION_TIME_MS;
                timerLastTick = performance.now();
                game.lastSoundSecond = 30;
                updateTimerDisplay();
                timerInterval = window.setInterval(() => {
                    if (!game || game.questionResolved) return;
                    const now = performance.now();
                    const from = timerLastTick;
                    timerLastTick = now;
                    const activeFrom = Math.max(from, game.effects.freezeUntil);
                    if (now > activeFrom) game.remainingMs = Math.max(0, game.remainingMs - (now - activeFrom));
                    updateTimerDisplay();
                    const seconds = Math.ceil(game.remainingMs / 1000);
                    if (seconds < game.lastSoundSecond && game.remainingMs > 0) {
                        game.lastSoundSecond = seconds;
                        playSound(seconds <= 5 ? "urgent" : "tick");
                    }
                    if (game.remainingMs <= 0) resolveTimeout();
                }, 100);
            }

            function getCurrentWager() {
                const input = $("wager-number");
                const value = Math.floor(Number(input && input.value));
                return Number.isFinite(value)
                    ? Math.max(MINIMUM_WAGER, Math.min(value, Math.max(MINIMUM_WAGER, game.coins)))
                    : MINIMUM_WAGER;
            }

            function updateGameCoinsDisplay() {
                const display = $("game-coins");
                if (!display || !game) return;
                display.textContent = game.coins.toLocaleString("es-ES");
                display.classList.toggle("is-negative", game.coins < 0);
                display.setAttribute("aria-label", `${display.textContent} monedas${game.coins < 0 ? ", saldo negativo" : ""}`);
            }

            function getQuestionElapsedMs() {
                return Math.max(0, Math.min(QUESTION_TIME_MS, QUESTION_TIME_MS - game.remainingMs));
            }

            function renderRound() {
                if (!game || game.round >= questions.length) return;
                hideGameReaction();
                if (nextRoundTimeout) window.clearTimeout(nextRoundTimeout);
                nextRoundTimeout = 0;
                stopQuestionTimer();
                const question = questions[game.round];
                selectedAnswer = "";
                feedbackVisible = false;
                game.questionResolved = false;
                game.answerLocked = false;
                game.immunityRetryAvailable = false;
                game.hiddenChoices = new Set();
                game.lastActivatedPower = "";
                const panel = $("game-panel");
                panel.innerHTML = "";
                const toolbar = document.createElement("div");
                toolbar.className = "round-toolbar";
                const stats = document.createElement("div");
                stats.className = "stats";
                stats.innerHTML = `<div class="stat"><span><span class="stat-icon" aria-hidden="true">🧑‍🎮</span>Jugador</span><strong></strong></div><div class="stat"><span><span class="stat-icon" aria-hidden="true">🪙</span>Monedas</span><strong id="game-coins"></strong></div><div class="stat"><span><span class="stat-icon" aria-hidden="true">🏆</span>Puntaje</span><strong>${game.score.toLocaleString("es-ES")}</strong></div>`;
                stats.querySelector("strong").textContent = game.name;
                const timer = document.createElement("div");
                timer.className = "timer";
                timer.id = "timer";
                timer.setAttribute("role", "timer");
                timer.setAttribute("aria-valuemin", "0");
                timer.setAttribute("aria-valuemax", "30");
                timer.innerHTML = `<strong id="timer-seconds">30s</strong><span>Tiempo</span><div class="timer-bar"><span></span></div>`;
                const timerControls = document.createElement("div");
                timerControls.className = "timer-controls";
                timerControls.append(timer);
                toolbar.append(stats, timerControls);
                panel.appendChild(toolbar);
                updateGameCoinsDisplay();

                const track = document.createElement("div");
                track.className = "progress-track";
                track.setAttribute("aria-label", `Ronda ${game.round + 1} de ${questions.length}`);
                track.innerHTML = `<div class="progress" style="width:${((game.round + 1) / questions.length) * 100}%"></div>`;
                panel.appendChild(track);

                const powerStatusList = document.createElement("div");
                powerStatusList.className = "power-active-list";
                powerStatusList.id = "active-powers";
                panel.appendChild(powerStatusList);

                const questionCard = document.createElement("div");
                questionCard.className = "question-card";
                questionCard.innerHTML = `<div class="eyebrow"></div><h2></h2><div class="choices"></div>`;
                questionCard.querySelector(".eyebrow").textContent = `Ronda ${game.round + 1} de ${questions.length} · ${question.topic}`;
                questionCard.querySelector("h2").textContent = question.prompt;
                const choices = questionCard.querySelector(".choices");
                question.choices.forEach((choice) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "choice";
                    button.dataset.answer = choice;
                    button.textContent = choice;
                    button.addEventListener("click", () => {
                        if (game.questionResolved || game.answerLocked || game.hiddenChoices.has(choice)) return;
                        selectedAnswer = choice;
                        choices.querySelectorAll(".choice").forEach((item) => {
                            item.classList.toggle("selected", item === button);
                        });
                        animate(button, "choice-selected");
                        playSound("select");
                    });
                    choices.appendChild(button);
                });
                panel.appendChild(questionCard);

                const inventory = document.createElement("section");
                inventory.className = "power-inventory";
                inventory.innerHTML = `<div class="power-inventory-heading"><h3>Tus poderes</h3><span>Un uso por poder</span></div><div class="power-buttons" id="power-buttons"></div>`;
                panel.appendChild(inventory);
                renderPowerButtons();

                const wagerRow = document.createElement("div");
                wagerRow.className = "wager-row";
                const maxWager = Math.max(MINIMUM_WAGER, game.coins);
                const sliderGroup = document.createElement("div");
                sliderGroup.innerHTML = `<label for="wager-range">Monedas a apostar</label><input id="wager-range" type="range" min="${MINIMUM_WAGER}" max="${maxWager}" value="${Math.min(MINIMUM_WAGER, maxWager)}" step="10">`;
                const wagerGroup = document.createElement("div");
                wagerGroup.innerHTML = `<label for="wager-number">Apuesta</label><input id="wager-number" type="number" min="${MINIMUM_WAGER}" max="${maxWager}" value="${MINIMUM_WAGER}" step="10" inputmode="numeric">`;
                wagerRow.append(sliderGroup, wagerGroup);
                panel.appendChild(wagerRow);
                $("wager-range").addEventListener("input", (event) => { $("wager-number").value = event.target.value; });
                $("wager-number").addEventListener("input", (event) => {
                    const wager = Math.max(MINIMUM_WAGER, Math.min(maxWager, Number(event.target.value) || MINIMUM_WAGER));
                    $("wager-range").value = wager;
                });
                $("wager-number").addEventListener("change", (event) => {
                    const value = Math.floor(Number(event.target.value));
                    const wager = Number.isFinite(value)
                        ? Math.max(MINIMUM_WAGER, Math.min(maxWager, value))
                        : MINIMUM_WAGER;
                    event.target.value = wager;
                    $("wager-range").value = wager;
                });
                const submit = document.createElement("button");
                submit.type = "button";
                submit.className = "primary full";
                submit.id = "submit-answer";
                submit.textContent = "Confirmar respuesta y apuesta";
                submit.addEventListener("click", submitAnswer);
                panel.appendChild(submit);
                const notice = document.createElement("p");
                notice.className = "notice";
                notice.textContent = "La apuesta mínima es de 100 monedas. Si tu saldo es menor, puedes apostar 100 y quedará negativo si pierdes. Cada acierto suma 100 puntos base. Los multiplicadores de una respuesta se suman y se aplican una sola vez. Una respuesta incorrecta o el tiempo agotado pierde la apuesta; al responder verás una explicación antes de continuar.";
                panel.appendChild(notice);
                animate(panel, "panel-enter");
                startQuestionTimer();
            }

            function activatePower(powerId) {
                if (!game || game.questionResolved || game.answerLocked || !game.powers.includes(powerId) ||
                    game.powersUsed.includes(powerId)) return;
                if (powerId === "fifty-fifty" && game.hiddenChoices.size > 0) return;
                if (powerId === "eraser" && game.hiddenChoices.size >= 2) return;
                const power = powers.find((item) => item.id === powerId);
                if (!power) throw new Error(`Poder desconocido: ${powerId}`);
                game.powersUsed.push(powerId);
                game.lastActivatedPower = powerId;
                playSound("power");
                showPowerActivation(power);
                if (powerId === "supersonic") {
                    game.effects.supersonicUntil = performance.now() + 20000;
                    if (supersonicTimeout) window.clearTimeout(supersonicTimeout);
                    supersonicTimeout = window.setTimeout(() => {
                        supersonicTimeout = 0;
                        if (game && !game.questionResolved) renderPowerButtons();
                    }, 20000);
                    showToast("Supersónico activado: +50 % a tus aciertos durante 20 segundos.");
                } else if (powerId === "streak-booster") {
                    game.effects.streakBooster = true;
                    showToast("Potenciador de racha activado: +50 puntos por cada acierto consecutivo.");
                } else if (powerId === "double-jeopardy") {
                    game.effects.doubleJeopardy = true;
                    showToast("Doble riesgo activado: +100 puntos si aciertas; pierdes 50 si fallas.");
                } else if (powerId === "double-points") {
                    game.effects.doublePoints = true;
                    showToast("Puntos dobles activado: duplicará tu siguiente respuesta correcta.");
                } else if (powerId === "fifty-fifty" || powerId === "eraser") {
                    const count = powerId === "fifty-fifty" ? 2 : 1;
                    const incorrectChoices = [...$("game-panel").querySelectorAll(".choice")]
                        .filter((button) => button.dataset.answer !== questions[game.round].answer && !game.hiddenChoices.has(button.dataset.answer));
                    for (let index = 0; index < count && incorrectChoices.length; index += 1) {
                        const randomIndex = Math.floor(Math.random() * incorrectChoices.length);
                        const [removed] = incorrectChoices.splice(randomIndex, 1);
                        game.hiddenChoices.add(removed.dataset.answer);
                        removed.disabled = true;
                        removed.classList.add("choice-removed");
                        removed.setAttribute("aria-label", "Opción eliminada por un poder");
                        removed.textContent = "Opción eliminada";
                    }
                    showToast(`${power.name} activado: se eliminaron ${count} opción(es) incorrecta(s).`);
                } else if (powerId === "immunity") {
                    game.effects.immunity = true;
                    showToast("Inmunidad activada: un error te dará un segundo intento sin perder puntos.");
                } else if (powerId === "time-freeze") {
                    const now = performance.now();
                    game.effects.freezeUntil = now + 5000;
                    timerLastTick = now;
                    $("game-panel").classList.add("timer-freeze");
                    showToast("Tiempo congelado: el cronómetro se detendrá durante 5 segundos.");
                } else if (powerId === "streak-saver") {
                    game.effects.streakSaver = true;
                    showToast("Protector de racha activado: conservarás tu racha tras el próximo error.");
                }
                animate($("game-panel").querySelector(".power-inventory"), "power-activated");
                renderPowerButtons();
            }

            function setChoicesDisabled(disabled) {
                $("game-panel").querySelectorAll(".choice").forEach((button) => {
                    button.disabled = disabled || game.hiddenChoices.has(button.dataset.answer);
                });
                $("wager-range").disabled = disabled;
                $("wager-number").disabled = disabled;
                $("game-panel").querySelectorAll(".power-use").forEach((button) => { button.disabled = disabled || button.disabled; });
            }

            function showQuestionFeedback(message, className, autoAdvance = false, explanation = "", duration = REACTION_DURATION_MS) {
                const panel = $("game-panel");
                panel.querySelector(".feedback")?.remove();
                document.querySelector(".answer-explanation-overlay")?.remove();
                if (nextRoundTimeout) window.clearTimeout(nextRoundTimeout);
                nextRoundTimeout = 0;

                if (explanation) {
                    nextRoundTimeout = window.setTimeout(() => {
                        nextRoundTimeout = 0;
                        const overlay = document.createElement("section");
                        overlay.className = `answer-explanation-overlay answer-explanation-overlay--${className}`;
                        overlay.setAttribute("role", "dialog");
                        overlay.setAttribute("aria-modal", "true");
                        overlay.setAttribute("aria-labelledby", "answer-explanation-title");
                        overlay.setAttribute("aria-describedby", "answer-explanation-text");

                        const card = document.createElement("div");
                        card.className = "answer-explanation-card";
                        const close = document.createElement("button");
                        close.className = "answer-explanation-close";
                        close.type = "button";
                        close.textContent = "×";
                        close.setAttribute("aria-label", "Cerrar explicación y continuar");

                        const title = document.createElement("h2");
                        title.id = "answer-explanation-title";
                        title.textContent = className === "good" ? "¡Respuesta correcta!" : "Respuesta incorrecta";
                        const result = document.createElement("p");
                        result.className = "answer-explanation-result";
                        result.textContent = message;
                        const explanationTitle = document.createElement("h3");
                        explanationTitle.textContent = "¿Por qué?";
                        const explanationText = document.createElement("p");
                        explanationText.id = "answer-explanation-text";
                        explanationText.textContent = explanation;
                        const instruction = document.createElement("p");
                        instruction.className = "answer-explanation-instruction";
                        instruction.textContent = "Esta explicación se cerrará automáticamente en 12 segundos.";

                        card.append(close, title, result, explanationTitle, explanationText, instruction);
                        overlay.appendChild(card);
                        document.body.appendChild(overlay);

                        close.addEventListener("click", () => {
                            if (nextRoundTimeout) window.clearTimeout(nextRoundTimeout);
                            nextRoundTimeout = 0;
                            overlay.remove();
                            advanceRound();
                        });
                        close.focus();
                        if (autoAdvance) {
                            nextRoundTimeout = window.setTimeout(() => {
                                overlay.remove();
                                advanceRound();
                            }, duration);
                        }
                    }, REACTION_DURATION_MS);
                    return;
                }

                const feedback = document.createElement("div");
                feedback.className = `feedback ${className}`;
                feedback.setAttribute("role", "status");
                const messageElement = document.createElement("p");
                messageElement.textContent = message;
                feedback.appendChild(messageElement);
                panel.appendChild(feedback);
                if (autoAdvance) nextRoundTimeout = window.setTimeout(advanceRound, duration);
                animate(feedback, "panel-enter");
            }

            function advanceRound() {
                if (!game || !game.questionResolved) return;
                if (nextRoundTimeout) window.clearTimeout(nextRoundTimeout);
                nextRoundTimeout = 0;
                game.round += 1;
                if (game.round === questions.length) finishGame();
                else renderRound();
            }

            function applyFailedStreak() {
                game.effects.streakBooster = false;
                if (game.effects.streakSaver) {
                    game.effects.streakSaver = false;
                    showToast("El Protector de racha evitó que perdieras tu racha.");
                } else {
                    game.streak = 0;
                }
            }

            function resolveTimeout() {
                if (!game || game.questionResolved || game.answerLocked) return;
                game.answerLocked = true;
                game.questionResolved = true;
                game.timeouts += 1;
                stopQuestionTimer();
                const wager = getCurrentWager();
                game.lastWager = wager;
                game.coins -= wager;
                updateGameCoinsDisplay();
                let penalty = 0;
                if (game.effects.doubleJeopardy) {
                    penalty = Math.min(50, game.score);
                    game.score -= penalty;
                    game.effects.doubleJeopardy = false;
                }
                game.effects.immunity = false;
                game.immunityRetryAvailable = false;
                applyFailedStreak();
                game.answers.push({ question: game.round + 1, correct: false, timeout: true, wager, points: -penalty, elapsedMs: QUESTION_TIME_MS });
                setChoicesDisabled(true);
                renderPowerButtons();
                playSound("timeout");
                showGameReaction("timeout");
                showEconomyEffect({ coinsLost: wager });
                showQuestionFeedback(`Se agotó el tiempo. No sumas puntos${wager ? ` y pierdes ${wager} monedas` : ""}${penalty ? `; pierdes ${penalty} puntos por Doble riesgo` : ""}. La respuesta no se mostrará. Pasando al siguiente reto…`, "question-timeout", true);
            }

            function submitAnswer() {
                if (!game || game.questionResolved || game.answerLocked) return;
                if (!selectedAnswer) {
                    showToast("Elige una respuesta antes de confirmar.");
                    return;
                }
                const wager = Math.floor(Number($("wager-number").value));
                const maxWager = Math.max(MINIMUM_WAGER, game.coins);
                if (!Number.isFinite(wager) || wager < MINIMUM_WAGER || wager > maxWager) {
                    showToast(`La apuesta debe estar entre ${MINIMUM_WAGER} y ${maxWager} monedas.`);
                    return;
                }
                game.answerLocked = true;
                const question = questions[game.round];
                const isCorrect = selectedAnswer === question.answer;
                const submitted = selectedAnswer;
                const elapsedMs = Math.round(getQuestionElapsedMs() / 100) * 100;
                game.answers.push({ question: game.round + 1, correct: isCorrect, timeout: false, wager, points: 0, elapsedMs });
                playSound(isCorrect ? "correct" : "incorrect");
                const submittedButton = [...$("game-panel").querySelectorAll(".choice")]
                    .find((button) => button.dataset.answer === submitted);
                if (!isCorrect) {
                    game.incorrect += 1;
                    if (submittedButton) animate(submittedButton, "choice-incorrect");
                    if (game.effects.immunity && !game.immunityRetryAvailable) {
                        game.effects.immunity = false;
                        game.immunityRetryAvailable = true;
                        game.answers[game.answers.length - 1].protected = true;
                        if (submittedButton) {
                            submittedButton.disabled = true;
                            submittedButton.classList.remove("selected");
                            submittedButton.textContent = "Intento utilizado";
                        }
                        selectedAnswer = "";
                        game.answerLocked = false;
                        $("submit-answer").textContent = "Intentar de nuevo";
                        showToast("Respuesta incorrecta. Inmunidad: tienes otro intento; el reloj sigue corriendo.");
                        renderPowerButtons();
                        return;
                    }
                } else if (submittedButton) animate(submittedButton, "choice-correct");
                showGameReaction(isCorrect ? "correct" : "incorrect");
                game.questionResolved = true;
                stopQuestionTimer();
                const feedback = $("game-panel").querySelector(".feedback");
                if (feedback) feedback.remove();
                const feedbackMessage = resolveSubmittedAnswer(isCorrect, wager);
                setChoicesDisabled(true);
                renderPowerButtons();
                showEconomyEffect(isCorrect
                    ? { points: feedbackMessage.points, coinsGained: wager }
                    : { coinsLost: wager });
                const explanation = isCorrect ? question.explanation : question.incorrectExplanation;
                showQuestionFeedback(feedbackMessage.text, isCorrect ? "good" : "bad", true, explanation, ANSWER_EXPLANATION_DURATION_MS);
            }

            function resolveSubmittedAnswer(isCorrect, wager) {
                let awarded = 0;
                if (isCorrect) {
                    game.correct += 1;
                    game.streak += 1;
                    let basePoints = 100 + (game.streak >= 3 ? 25 : 0) + (game.effects.streakBooster ? 50 : 0);
                    const multiplierAddition =
                        (game.effects.supersonicUntil > performance.now() ? 0.5 : 0) +
                        (game.effects.doublePoints ? 1 : 0) +
                        (game.effects.doubleJeopardy ? 1 : 0);
                    awarded = Math.round(basePoints * (1 + multiplierAddition));
                    game.score += awarded;
                    game.pointsEarned += awarded;
                    game.coins += wager;
                    updateGameCoinsDisplay();
                    game.effects.doublePoints = false;
                    game.effects.doubleJeopardy = false;
                    game.effects.immunity = false;
                    game.immunityRetryAvailable = false;
                    game.answers[game.answers.length - 1].points = awarded;
                    game.answers[game.answers.length - 1].correct = true;
                    return { text: `¡Respuesta correcta! +${awarded} puntos${wager ? ` y +${wager} monedas` : ""}.`, points: awarded };
                }
                game.coins -= wager;
                updateGameCoinsDisplay();
                let penalty = 0;
                if (game.effects.doubleJeopardy) {
                    penalty = Math.min(50, game.score);
                    game.score -= penalty;
                }
                game.effects.doubleJeopardy = false;
                game.effects.immunity = false;
                game.immunityRetryAvailable = false;
                applyFailedStreak();
                game.answers[game.answers.length - 1].points = -penalty;
                return { text: `Respuesta incorrecta. No sumas puntos${penalty ? ` y pierdes ${penalty} puntos por Doble riesgo` : ""}${wager ? `; pierdes ${wager} monedas` : ""}.`, points: -penalty };
            }

            function finishGame() {
                stopQuestionTimer();
                stopAmbientMusic();
                if (supersonicTimeout) window.clearTimeout(supersonicTimeout);
                supersonicTimeout = 0;
                if (nextRoundTimeout) window.clearTimeout(nextRoundTimeout);
                nextRoundTimeout = 0;
                const result = {
                    version: 1,
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    name: game.name,
                    correct: game.correct,
                    total: questions.length,
                    incorrect: game.incorrect,
                    timeouts: game.timeouts,
                    accuracy: game.correct + game.incorrect === 0
                        ? 0
                        : Math.round(game.correct / (game.correct + game.incorrect) * 100),
                    coins: game.coins,
                    score: game.score,
                    pointsEarned: game.pointsEarned,
                    powersUsed: [...new Set(game.powersUsed)],
                    answers: game.answers.map((answer) => ({ ...answer })),
                    date: new Date().toISOString()
                };
                lastResult = result;
                const saved = savePlayerResult(result);
                const code = encodeResult(result);
                const resultLink = createResultLink(code);
                $("game-panel").classList.add("hidden");
                const panel = $("result-panel");
                panel.classList.remove("hidden");
                panel.innerHTML = `<div class="eyebrow" style="color:var(--green)">Partida terminada</div>
                    <h2>¡Buen trabajo, <span id="result-name"></span>!</h2>
                    <p class="subtle" id="save-message"></p>
                    <div class="stats">
                        <div class="stat"><span>Aciertos</span><strong><span aria-hidden="true" data-count="${result.correct}" data-count-suffix=" / ${result.total}">${result.correct} / ${result.total}</span><span class="sr-only">${result.correct} de ${result.total}</span></strong></div>
                        <div class="stat"><span>Precisión</span><strong><span aria-hidden="true" data-count="${result.accuracy}" data-count-suffix="%">${result.accuracy}%</span><span class="sr-only">${result.accuracy} por ciento</span></strong></div>
                        <div class="stat"><span>Monedas finales</span><strong class="${result.coins < 0 ? "is-negative" : ""}"><span aria-hidden="true" data-count="${result.coins}">${result.coins.toLocaleString("es-ES")}</span><span class="sr-only">${result.coins.toLocaleString("es-ES")}</span></strong></div>
                        <div class="stat"><span>Puntos netos</span><strong><span aria-hidden="true" data-count="${result.score}">${result.score}</span><span class="sr-only">${result.score}</span></strong></div>
                        <div class="stat"><span>Errores / sin responder</span><strong>${result.incorrect} / ${result.timeouts}</strong></div>
                        <div class="stat"><span>Poderes usados</span><strong>${result.powersUsed.length} / 3</strong></div>
                    </div>
                    <p class="notice">Los multiplicadores se suman antes de aplicarse: Supersónico +50 % y cada poder 2× +100 %. Los bonos de racha se añaden primero.</p>
                    <div class="notice"><strong>Enlace corto para el profesor</strong><div class="codebox" id="share-link"></div><span id="link-length"></span></div>
                    <div class="actions"><button class="primary" id="share-button" type="button">Compartir enlace</button><button class="secondary" id="copy-button" type="button">Copiar enlace corto</button><button class="secondary" id="restart-button" type="button">Jugar otra vez</button></div>
                    <p class="notice">El profesor pega este enlace en “Reunir resultados → Códigos compartidos por los estudiantes”.</p>`;
                panel.querySelectorAll(".stats .stat > span").forEach((label, index) => {
                    const icon = document.createElement("span");
                    icon.className = "stat-icon";
                    icon.setAttribute("aria-hidden", "true");
                    icon.textContent = ["🎯", "✨", "🪙", "🏆", "⚡", "🎮"][index];
                    label.prepend(icon);
                });
                animate(panel, "panel-enter");
                animateCounts(panel);
                $("result-name").textContent = result.name;
                $("save-message").textContent = saved
                    ? "Tu partida se guardó en este dispositivo. Comparte el enlace con el profesor para agregarla a la clasificación."
                    : "No se pudo guardar la partida localmente. Comparte el enlace ahora para que el profesor pueda agregarla.";
                const usedPowersNotice = document.createElement("p");
                usedPowersNotice.className = "notice";
                usedPowersNotice.textContent = `Poderes utilizados: ${result.powersUsed.length
                    ? result.powersUsed.map((powerId) => powers.find((power) => power.id === powerId).name).join(", ")
                    : "ninguno"}. La precisión se calcula sobre intentos respondidos; los tiempos agotados se cuentan aparte.`;
                panel.querySelector(".stats").after(usedPowersNotice);
                $("share-link").textContent = resultLink;
                $("link-length").textContent = `${resultLink.length} caracteres. Incluye el resumen, poderes y detalle de respuestas.${window.location.protocol === "file:" ? " Para compartir entre dispositivos, abre el juego desde una dirección web publicada; las rutas de archivo solo funcionan en este equipo." : ""}`;
                $("share-button").addEventListener("click", () => shareResult(result, resultLink));
                $("copy-button").addEventListener("click", () => copyText(resultLink));
                $("restart-button").addEventListener("click", resetGame);
            }

            function savePlayerResult(result) {
                try {
                    const stored = JSON.parse(localStorage.getItem(PLAYER_RESULTS_KEY) || "[]");
                    const playerResults = Array.isArray(stored) ? stored.filter(isValidResult) : [];
                    playerResults.push(result);
                    localStorage.setItem(PLAYER_RESULTS_KEY, JSON.stringify(playerResults));
                    return true;
                } catch (error) {
                    console.error("No se pudo guardar la partida en este dispositivo.", error);
                    return false;
                }
            }

            async function shareResult(result, resultLink) {
                const usedPowers = result.powersUsed.map((powerId) => powers.find((power) => power.id === powerId)?.name || powerId).join(", ") || "ninguno";
                const summary = `El Mercado de los Datos | ${result.name}: ${result.correct}/${result.total} aciertos, ${result.incorrect} errores, ${result.timeouts} tiempos agotados, ${result.accuracy}% de precisión, ${result.score} puntos netos y ${result.coins} monedas.\nPoderes utilizados: ${usedPowers}.`;
                const text = `${summary}\nEnlace corto para el profesor:\n${resultLink}`;
                const shareButton = $("share-button");
                const originalLabel = shareButton.textContent;
                shareButton.disabled = true;
                shareButton.setAttribute("aria-busy", "true");
                shareButton.textContent = "Abriendo opciones…";
                try {
                    if (navigator.share) {
                        await navigator.share({
                            title: "Mi resultado — El Mercado de los Datos",
                            text: summary,
                            url: resultLink
                        });
                    } else {
                        await copyText(text);
                    }
                } catch (error) {
                    if (error.name !== "AbortError") {
                        console.error("No se pudo abrir el menú para compartir.", error);
                        showToast("No se pudo compartir. Usa «Copiar código».");
                    }
                } finally {
                    shareButton.disabled = false;
                    shareButton.removeAttribute("aria-busy");
                    shareButton.textContent = originalLabel;
                }
            }

            async function copyText(text) {
                try {
                    await navigator.clipboard.writeText(text);
                    showToast("Copiado. Envíalo a tu profesor.");
                } catch (error) {
                    const temporaryInput = document.createElement("textarea");
                    temporaryInput.value = text;
                    temporaryInput.setAttribute("readonly", "");
                    temporaryInput.style.position = "fixed";
                    temporaryInput.style.opacity = "0";
                    document.body.appendChild(temporaryInput);
                    temporaryInput.select();
                    try {
                        const copied = document.execCommand("copy");
                        if (copied) {
                            showToast("Copiado. Envíalo a tu profesor.");
                            return;
                        }
                    } catch (fallbackError) {
                        console.error("Tampoco se pudo usar la copia alternativa.", fallbackError);
                    } finally {
                        temporaryInput.remove();
                    }
                    console.error("No se pudo copiar al portapapeles.", error);
                    showToast("No se pudo copiar automáticamente. Mantén pulsado el código para copiarlo.");
                }
            }

            function resetGame() {
                stopQuestionTimer();
                stopAmbientMusic();
                if (supersonicTimeout) window.clearTimeout(supersonicTimeout);
                supersonicTimeout = 0;
                game = null;
                lastResult = null;
                $("result-panel").classList.add("hidden");
                $("game-panel").classList.add("hidden");
                $("start-panel").classList.remove("hidden");
                animate($("start-panel"), "panel-enter");
                $("player-name").value = "";
                renderPlayerProfile();
                $("player-name").focus();
            }

            function renderLeaderboard() {
                const results = safeReadResults().sort((a, b) =>
                    b.score - a.score ||
                    (b.accuracy ?? Math.round(b.correct / b.total * 100)) - (a.accuracy ?? Math.round(a.correct / a.total * 100)) ||
                    b.coins - a.coins ||
                    b.correct - a.correct ||
                    a.name.localeCompare(b.name, "es")
                );
                const target = $("leaderboard");
                if (!results.length) {
                    target.innerHTML = `<div class="empty">Todavía no hay resultados reunidos. Pida a cada estudiante que comparta su código y péguelo arriba.</div>`;
                    return;
                }
                const table = document.createElement("div");
                table.className = "table-wrap";
                const columnLabels = [
                    "Posición", "Jugador", "Aciertos", "Errores", "Sin responder",
                    "Precisión", "Monedas", "Puntaje", "Poderes usados", "Detalle de respuestas"
                ];
                const rows = results.map((result, index) => {
                    const accuracy = result.accuracy ?? Math.round(result.correct / result.total * 100);
                    const incorrect = result.incorrect ?? Math.max(0, result.total - result.correct);
                    return `<tr><td>${index + 1}</td><td></td><td>${result.correct}/${result.total}</td><td>${incorrect}</td><td>${result.timeouts ?? 0}</td><td>${accuracy} %</td><td>${result.coins.toLocaleString("es-ES")}</td><td>${result.score.toLocaleString("es-ES")}</td><td></td><td></td></tr>`;
                }).join("");
                table.innerHTML = `<table><thead><tr><th>Pos.</th><th>Jugador</th><th>Aciertos</th><th>Errores</th><th>Sin responder</th><th>Precisión</th><th>Monedas</th><th>Puntaje</th><th>Poderes usados</th><th>Detalle de respuestas (tiempo y estado)</th></tr></thead><tbody>${rows}</tbody></table>`;
                results.forEach((result, index) => {
                    const row = table.querySelectorAll("tbody tr")[index];
                    [...row.children].forEach((cell, cellIndex) => {
                        cell.dataset.label = columnLabels[cellIndex];
                    });
                    row.children[1].textContent = result.name;
                    row.children[6].classList.toggle("is-negative", result.coins < 0);
                    row.children[8].textContent = (result.powersUsed || [])
                        .map((powerId) => powers.find((power) => power.id === powerId)?.name || powerId)
                        .join(", ") || "—";
                    if (result.summaryOnly) {
                        row.children[9].textContent = "Detalle no incluido en el enlace corto";
                    } else {
                        row.children[9].replaceChildren(createAnswerDetails(result.answers));
                    }
                    row.style.setProperty("--row-index", Math.min(index, 8));
                });
                const summary = document.createElement("section");
                summary.className = "teacher-summary";
                summary.setAttribute("aria-label", "Resumen de resultados reunidos");
                const summaryTitle = document.createElement("h3");
                summaryTitle.textContent = "Resumen de la clase";
                const summaryGrid = document.createElement("div");
                summaryGrid.className = "teacher-summary-grid";
                const detailedAnswers = results.flatMap((result) => result.answers || []);
                const averageScore = Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length);
                const averageAccuracy = Math.round(results.reduce((sum, result) =>
                    sum + (result.accuracy ?? (result.total
                        ? Math.round(result.correct / result.total * 100)
                        : 0)), 0
                ) / results.length);
                const summaryMetrics = [
                    ["Partidas reunidas", results.length.toLocaleString("es-ES")],
                    ["Puntaje promedio", averageScore.toLocaleString("es-ES")],
                    ["Precisión promedio por partida", `${averageAccuracy} %`]
                ];
                if (detailedAnswers.length && detailedAnswers.every((answer) =>
                    Number.isInteger(answer.elapsedMs) && answer.elapsedMs >= 0
                )) {
                    const averageResponseTime = detailedAnswers.reduce((sum, answer) => sum + answer.elapsedMs, 0) /
                        detailedAnswers.length;
                    summaryMetrics.push(["Tiempo medio por respuesta", formatResponseTime(averageResponseTime)]);
                }
                summaryMetrics.forEach(([label, value]) => {
                    const metric = document.createElement("div");
                    metric.className = "teacher-summary-stat";
                    const caption = document.createElement("span");
                    caption.textContent = label;
                    const amount = document.createElement("strong");
                    amount.textContent = value;
                    metric.append(caption, amount);
                    summaryGrid.appendChild(metric);
                });
                summary.append(summaryTitle, summaryGrid);

                const podium = document.createElement("section");
                podium.className = "leaderboard-podium";
                podium.setAttribute("aria-label", "Tres mejores resultados");
                if (results.length >= 3) {
                    const podiumTitle = document.createElement("h3");
                    podiumTitle.textContent = "Podio · mejores resultados";
                    const podiumGrid = document.createElement("div");
                    podiumGrid.className = "podium-grid";
                    const medals = ["🥇", "🥈", "🥉"];
                    results.slice(0, 3).forEach((result, index) => {
                        const card = document.createElement("article");
                        card.className = `podium-card podium-card--${index + 1}`;
                        const medal = document.createElement("span");
                        medal.className = "podium-medal";
                        medal.setAttribute("aria-hidden", "true");
                        medal.textContent = medals[index];
                        const rank = document.createElement("span");
                        rank.className = "podium-rank";
                        rank.textContent = `${index + 1}.º lugar`;
                        const player = document.createElement("strong");
                        player.className = "podium-player";
                        player.textContent = result.name;
                        const score = document.createElement("span");
                        score.className = "podium-score";
                        score.textContent = `${result.score.toLocaleString("es-ES")} puntos`;
                        card.append(medal, rank, player, score);
                        podiumGrid.appendChild(card);
                    });
                    podium.append(podiumTitle, podiumGrid);
                }

                let errorChart = null;
                if (detailedAnswers.length) {
                    errorChart = document.createElement("section");
                    errorChart.className = "question-error-summary";
                    errorChart.setAttribute("aria-label", "Preguntas con más errores");
                    const chartTitle = document.createElement("h3");
                    chartTitle.textContent = "Preguntas con más errores";
                    const chartNote = document.createElement("p");
                    chartNote.className = "notice";
                    chartNote.textContent = "Intentos incorrectos en las partidas que incluyen detalle de respuestas.";
                    errorChart.append(chartTitle, chartNote);
                    const errorsByQuestion = new Map();
                    detailedAnswers.forEach((answer) => {
                        if (!answer.correct && !answer.timeout && Number.isInteger(answer.question) &&
                            answer.question >= 1 && answer.question <= questions.length) {
                            errorsByQuestion.set(answer.question, (errorsByQuestion.get(answer.question) || 0) + 1);
                        }
                    });
                    const rankedErrors = [...errorsByQuestion.entries()]
                        .sort((a, b) => b[1] - a[1] || a[0] - b[0])
                        .slice(0, 5);
                    if (!rankedErrors.length) {
                        const emptyChart = document.createElement("p");
                        emptyChart.className = "empty";
                        emptyChart.textContent = "No hay errores registrados en las respuestas detalladas.";
                        errorChart.appendChild(emptyChart);
                    } else {
                        const maximumErrors = rankedErrors[0][1];
                        const chart = document.createElement("ol");
                        chart.className = "question-error-chart";
                        rankedErrors.forEach(([questionNumber, count]) => {
                            const item = document.createElement("li");
                            item.className = "question-error-row";
                            const label = document.createElement("span");
                            label.className = "question-error-label";
                            label.textContent = `Pregunta ${questionNumber} · ${questions[questionNumber - 1].topic}`;
                            const track = document.createElement("span");
                            track.className = "question-error-track";
                            track.setAttribute("aria-hidden", "true");
                            const bar = document.createElement("span");
                            bar.className = "question-error-bar";
                            bar.style.width = `${count / maximumErrors * 100}%`;
                            track.appendChild(bar);
                            const total = document.createElement("strong");
                            total.className = "question-error-count";
                            total.textContent = count.toLocaleString("es-ES");
                            item.append(label, track, total);
                            chart.appendChild(item);
                        });
                        errorChart.appendChild(chart);
                    }
                }

                target.replaceChildren(summary);
                if (results.length >= 3) target.appendChild(podium);
                if (errorChart) target.appendChild(errorChart);
                target.appendChild(table);
            }

            function importResults() {
                const pastedText = $("result-codes").value;
                const codePartCounts = { 1: 9, 2: 14, 3: 13, 4: 14 };
                const rawCodes = [];
                const codeMarkers = /MD([1-4])\./gi;
                let marker;
                while ((marker = codeMarkers.exec(pastedText)) !== null) {
                    const candidate = /^[a-z0-9._-]+/i.exec(pastedText.slice(marker.index));
                    if (!candidate) continue;
                    const parts = candidate[0].split(".");
                    if (parts.length >= codePartCounts[marker[1]]) {
                        rawCodes.push(parts.slice(0, codePartCounts[marker[1]]).join("."));
                    }
                }
                if (!rawCodes.length) {
                    rawCodes.push(...pastedText.split(/\s+/)
                        .map((code) => code.replace(/^[`"'(<\[{*]+|[`"')>\]},;*]+$/g, ""))
                        .filter(Boolean));
                }
                if (!rawCodes.length) {
                    $("import-message").textContent = "Pega al menos un código para agregar resultados.";
                    return;
                }
                const existing = safeReadResults();
                const ids = new Set(existing.map((result) => result.id));
                let added = 0;
                let duplicates = 0;
                let invalid = 0;
                let firstError = "";
                rawCodes.forEach((code) => {
                    try {
                        const result = decodeResult(code);
                        if (ids.has(result.id)) duplicates += 1;
                        else {
                            existing.push(result);
                            ids.add(result.id);
                            added += 1;
                        }
                    } catch (error) {
                        invalid += 1;
                        if (!firstError) firstError = error instanceof Error ? error.message : String(error);
                    }
                });
                try {
                    localStorage.setItem(RESULTS_KEY, JSON.stringify(existing));
                } catch (error) {
                    console.error("No se pudieron guardar los resultados.", error);
                    $("import-message").textContent = "No se pudieron guardar los resultados en este dispositivo. Compruebe el espacio disponible y la configuración del navegador.";
                    return;
                }
                const parts = [`Se agregaron ${added} resultado(s).`];
                if (duplicates) parts.push(`${duplicates} duplicado(s) omitido(s).`);
                if (invalid) {
                    parts.push(`${invalid} código(s) inválido(s).`);
                    if (firstError) parts.push(`Detalle: ${firstError}`);
                }
                $("import-message").textContent = parts.join(" ");
                if (!invalid) $("result-codes").value = "";
                renderLeaderboard();
            }

            function downloadCsv() {
                const results = safeReadResults().sort((a, b) =>
                    b.score - a.score ||
                    (b.accuracy ?? Math.round(b.correct / b.total * 100)) - (a.accuracy ?? Math.round(a.correct / a.total * 100)) ||
                    b.coins - a.coins ||
                    b.correct - a.correct ||
                    a.name.localeCompare(b.name, "es")
                );
                if (!results.length) {
                    showToast("Aún no hay resultados para descargar.");
                    return;
                }
                const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;
                const lines = [["Posición", "Nombre", "Aciertos", "Errores", "Sin responder", "Precisión", "Monedas finales", "Puntaje neto", "Puntos obtenidos", "Poderes usados", "Detalle de respuestas (tiempo y estado)"], ...results.map((result, index) => [index + 1, result.name, result.correct, result.incorrect ?? Math.max(0, result.total - result.correct), result.timeouts ?? 0, `${result.accuracy ?? Math.round(result.correct / result.total * 100)}%`, result.coins, result.score, result.pointsEarned ?? result.score, (result.powersUsed || []).map((powerId) => powers.find((power) => power.id === powerId)?.name || powerId).join(", "), result.summaryOnly ? "Detalle no incluido en el enlace corto" : formatAnswerLog(result.answers)])];
                const csv = "\uFEFF" + lines.map((line) => line.map(escapeCsv).join(",")).join("\r\n");
                const link = document.createElement("a");
                link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
                link.download = "resultados-mercado-de-los-datos.csv";
                link.click();
                URL.revokeObjectURL(link.href);
            }

            $("play-tab").addEventListener("click", () => showView("play"));
            $("teacher-tab").addEventListener("click", () => showView("teacher"));
            $("start-button").addEventListener("click", startGame);
            $("player-name").addEventListener("keydown", (event) => { if (event.key === "Enter") startGame(); });
            $("player-name").addEventListener("input", renderPlayerProfile);
            $("add-results").addEventListener("click", importResults);
            $("result-codes").addEventListener("paste", () => {
                window.setTimeout(importResults, 0);
            });
            $("export-results").addEventListener("click", downloadCsv);
            $("clear-results").addEventListener("click", () => {
                if (!safeReadResults().length) {
                    showToast("La tabla ya está vacía.");
                    return;
                }
                if (window.confirm("¿Borrar todos los resultados guardados en este dispositivo? Esta acción no se puede deshacer.")) {
                    localStorage.removeItem(RESULTS_KEY);
                    $("import-message").textContent = "Se borraron los resultados guardados.";
                    renderLeaderboard();
                }
            });
            renderPowerPicker();
            renderPlayerProfile();
            $("start-button").disabled = true;
            setupMotion();
            if (document.readyState === "complete") hideSplashScreen();
            else window.addEventListener("load", hideSplashScreen, { once: true });
            window.setTimeout(hideSplashScreen, 8000);
        })();
