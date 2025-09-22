import { onMount, createEffect, createSignal, createMemo } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { MathUtils, Color, Matrix4, Vector3, Quaternion, PositionalAudio, Euler } from 'three';
import Reticle from '@js/reticle';
import { LoadAudioBuffer, LoadAudio } from '@tools/three/audioTools';
import { RecreateMaterials, findMaterialByName } from "@tools/three/materialTools";
import Toolbar from '@views/ar-overlay/Toolbar';
import SceneManager from "@js/sceneManager"
import { Container } from '@components/smallElements';
import SvgIcon from '@components/SvgIcon';
import * as THREE from 'three';
import { config } from '@js/config';
import { GlbLoader, LoadGLB, GLBFile } from '@tools/three/modelTools';
import { LoadTexture } from '@tools/three/textureTools';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';



const balloonColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffa500, 0x800080, 0x000000];


// GAME parameters
const ARROW_HEIGHT = 0.07;
const ARROW_SPEED = 0.04;
const ARROW_OFFSET = new THREE.Vector3(0, -0.1, -0.3);
const GRAVITY = 0.008;
const GROUND_Y = -1.5;
const ARROW_BONUS = 2;

const PLAYER_STATE = {
    NONE: 'none',
    RUNNING: 'running',
    WINNER: 'winner',
    LOOSER: 'looser'
}

// let playerState;
let balloons = [];
let arrow = null;
let isArrowFlying = false;
let maxGameTime = 30000;
const arrowsBonus = 5;
let interval;
let arrowModel = null;
// let balloonModel = null;
// let balloonLoader = new GlbLoader();
// let arrowsLeft = 10;
// let isPlaying = true;

let arrowGlb;
let balloonGlb;


export default function Baloons(props) {
    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);

    // let maxGameTime = 30000;
    // const dartBonus = 5;
    // let timeout;




    // GAME variables
    const [arrowsLeft, setArrowsLeft] = createSignal(10);
    const [explodedBalloons, setExplodedBalloons] = createSignal(0);
    const [remainingTime, setRemainingTime] = createSignal(maxGameTime);
    const [currentTime, setCurrentTime] = createSignal(maxGameTime);
    const [playerState, setPlayerState] = createSignal(PLAYER_STATE.NONE);

    // decrease timeout
    createEffect(() => {
        if (props.enabled && game.appMode === "load") {
            interval = setInterval(() => {
                setCurrentTime((prev) => {
                    if (prev > 0) {
                        setRemainingTime(prev - 1000);
                        return prev - 1000;
                    }
                    clearInterval(interval);
                    return 0;
                });
            }, 1000);
            return () => clearInterval(interval);

        }
    });

    // stop timeout if is winner or looser
    createEffect(() => {
        if (playerState() == PLAYER_STATE.WINNER || playerState() == PLAYER_STATE.LOOSER) {
            clearInterval(interval);
        }
    })


    /*
    * Default DATA
    */
    const defaultGameData = [];


    let popAudioBuffer;
    let balloonExplosionAudioBuffer;
    let whooshAudio;


    /*
    * Put here derived functions from Game
    */
    const { game } = useGame("baloons", props.id, {

        onTap: () => {

            if (props.enabled) {

                console.log("TAPPPP....")

                switch (game.appMode) {
                    case "save":
                        spawnModelOnTap();
                        break;

                    case "load":
                        launchArrow();
                        break;
                }
            }

        },

        renderLoop: () => loop()

    });



    /*
    * On mount
    */
    onMount(async () => {

        // load balloon model
        const balloonAoTexture = await new LoadTexture("models/demo/Balloons/balloon_AO.webp", {
            flipY: false
        });
        // await balloonLoader.load("models/demo/Balloons/balloon.glb", {
        //     aoMap: balloonAoTexture,
        //     aoMapChannel: 1
        // });



        balloonGlb = await new GLBFile("models/demo/Balloons/balloon.glb", {
            aoMap: balloonAoTexture,
            aoMapChannel: 1
        });
        console.log(">>>>>>", balloonGlb)



        // //TODO- questa non la vogliamo più usare! -- NON E' VERO!!...
        // await game.loader.load("models/demo/Balloons/balloon.glb");




        // load dart model
        const arrowAoTexture = await new LoadTexture("models/demo/Balloons/dart_AO.webp", {
            flipY: false
        });
        
        // arrowModel = await new LoadGLB("models/demo/Balloons/dart.glb", {
        //     aoMap: arrowAoTexture
        // });

        arrowGlb = await new GLBFile("models/demo/Balloons/dart.glb", {
            aoMap: arrowAoTexture
        });
        arrowModel = arrowGlb.model;



        // load audio
        popAudioBuffer = await new LoadAudioBuffer("sounds/pop.ogg");
        balloonExplosionAudioBuffer = await new LoadAudioBuffer("sounds/balloon-explosion.ogg");
        whooshAudio = await new LoadAudio('sounds/whoosh.ogg', SceneManager.listener, {
            volume: 0.1
        });

        // Setup data
        await game.loadGameData();
        if (!game.gameData()) {
            console.log("siccome non abbiamo caricato niente settiamo i dati di default")
            // load default data
            game.setGameData(defaultGameData);
        }

        // // setup game
        // setRemainingArrow(game.gameData().length + arrowsBonus);
        // console.log("++++ NE RIMANGONO: ", remainingArrow());

        // loadEnv();



        // reset
        setLastSavedGameData([...game.gameData()]);

        /*
        * Don't forget to call "game.setInitialized(true)" at finish 
        */
        game.setInitialized(true)
    });




    /*
    * On localizationCompleted
    */
    createEffect(() => {
        if (props.enabled) {
            console.log("BALOONS ENABLED!")
            setupScene();
        }
    })

    createEffect(() => {
        console.log("Current reference matrix:", props.referenceMatrix)
    })






    const hasUnsavedChanges = createMemo(() =>
        JSON.stringify(game.gameData()) !== JSON.stringify(lastSavedGameData())
    );



    const handleUndo = () => {
        // super
        game.onUndo();
        // remove last from scene
        game.removePreviousFromScene();
        // remove last from data
        game.setGameData(game.gameData().slice(0, -1));

        console.log("UNDO! ->>", game.gameData());
    };


    const handleSave = async () => {
        // save data
        await game.saveGameData();
        // reset
        setLastSavedGameData([...game.gameData()]);
    };


    /*
    * SETUP SCENE
    */
    function setupScene() {
        switch (game.appMode) {
            case "save":
                Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET);
                Reticle.setVisible(true);
                break;

            case "load":
                if (config.debugOnDesktop) {
                    Reticle.setWorkingMode(Reticle.WORKING_MODE.TARGET);
                    Reticle.setVisible(true);
                }
                else {
                    Reticle.setEnabled(false);
                }
                setPlayerState(PLAYER_STATE.RUNNING)
                break;
        }
        // wait a little before to spawn loaded models
        setTimeout(() => {
            if (game.gameData().length > 0)
                loadAllModels();
        }, 250)
    }

    //#region [LOOP]
    /*
    * LOOP
    */
    function loop() {
        // if (game.loader.loaded()) {

        //     game.loader.animate();

        //     balloonLoader.animate();

        //     if (game.appMode == "load") {

        //         if (playerState() === PLAYER_STATE.RUNNING) {

        //             updateArrow();



        //             if (currentTime() <= 0) endGameLooser();


        //             // // ✅ NUOVO: Aggiorna posizione freccia se non sta volando
        //             // if (!isArrowFlying && arrow) {
        //             //     const offset = new THREE.Vector3(0, -0.2, -0.3);
        //             //     arrow.position.copy(SceneManager.camera.position).add(offset.applyQuaternion(SceneManager.camera.quaternion));
        //             //     arrow.rotation.copy(SceneManager.camera.rotation);
        //             // }

        //         }
        //     }
        // }
        if (props.enabled) {

            // game.loader.animate();

            // balloonLoader.animate();

            balloonGlb.animate();

            if (game.appMode == "load") {

                if (playerState() === PLAYER_STATE.RUNNING) {

                    updateArrow();



                    if (currentTime() <= 0) endGameLooser();


                    // // ✅ NUOVO: Aggiorna posizione freccia se non sta volando
                    // if (!isArrowFlying && arrow) {
                    //     const offset = new THREE.Vector3(0, -0.2, -0.3);
                    //     arrow.position.copy(SceneManager.camera.position).add(offset.applyQuaternion(SceneManager.camera.quaternion));
                    //     arrow.rotation.copy(SceneManager.camera.rotation);
                    // }

                }
            }
        }

    }




    /*
    * STYLE
    */


    //#region [Load models]
    /*
    * Spawn loaded models
    */
    function loadAllModels() {
        const gameData = game.gameData();
        let currentIndex = 0;

        function loadNextBatch() {
            const batchSize = 1; // Carica 1 modello per frame
            const endIndex = Math.min(currentIndex + batchSize, gameData.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const assetData = gameData[i];


                // let newModel = game.loader.clone({ randomizeTime: true });
                let newModel = balloonGlb.clone({ randomizeTime: true });


                // console.log(">>>>>>>>>", balloonModel)
                // const CLONETEST = balloonModel.createClone({ aaaaa: true });
                // console.log(">>>>>>>>>>>>>>>>>>>", CLONETEST)



                // newModel = RecreateMaterials(newModel); // Important!!!
                newModel.matrixAutoUpdate = false;

                // position
                const diffMatrix = new Matrix4();
                diffMatrix.fromArray(assetData.diffMatrix.elements);
                const globalMatrix = game.getGlobalMatrixFromOffsetMatrix
                    (props.referenceMatrix, diffMatrix);
                newModel.matrix.copy(globalMatrix);

                // rotation
                newModel.rotation.y = Math.random() * Math.PI * 2;

                // color
                const colorIndex = assetData.color;
                newModel.traverse((child) => {
                    if (child.isMesh && child.material && child.material.name === "balloon") {
                        const newModelColor = balloonColors[colorIndex];
                        child.material = child.material.clone();
                        child.material.color = new Color(newModelColor);
                    }
                });

                // audio
                const audio = new PositionalAudio(SceneManager.listener);
                audio.setBuffer(popAudioBuffer);
                newModel.add(audio);





                game.addToScene(newModel);
                balloons.push(newModel);


                // const balloonGeometry = new THREE.SphereGeometry(0.2, 16, 16);
                // const balloonMaterial = new THREE.MeshLambertMaterial();
                // const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
                // // Posiziona i palloncini in modo sparso
                // balloon.position.x = 0;
                // balloon.position.y = 0;
                // balloon.position.z = -1;
                // SceneManager.scene.add(balloon);
                // balloons.push(balloon);






                console.log("PLAY AUDIO")
                audio.play();
            }

            currentIndex = endIndex;

            // Se ci sono ancora modelli da caricare, continua nel prossimo frame
            if (currentIndex < gameData.length) {
                // requestAnimationFrame(loadNextBatch);
                setTimeout(() => {
                    loadNextBatch()
                }, 200)
            } else {
                console.log("Tutti i modelli caricati!");

                // Init GAME!!!
                if (game.appMode == "load") {
                    // arrowsLeft = balloons.length + ARROW_BONUS;
                    setArrowsLeft(balloons.length + ARROW_BONUS);
                    // Crea freccia iniziale
                    createArrow();
                }
            }
        }

        loadNextBatch();
    }


    //#region [Spawn on TAP]
    /*
    * Spawn on TAP
    */
    function spawnModelOnTap() {
        if (!props.enabled) return;
        const p = new Vector3().setFromMatrixPosition(Reticle.getHitMatrix())
        console.log("SPAWN...", p)

        // clone model on hitMatrix with random Y rotation
        const newModel = balloonGlb.clone({
            position: new Vector3().setFromMatrixPosition(Reticle.getHitMatrix()),
            rotation: new Euler(0, Math.random() * Math.PI * 2, 0),
            randomizeTime: true
        });

        // random color
        let colorIndex;
        newModel.traverse((child) => {
            if (child.isMesh && child.material && child.material.name === "balloon") {
                colorIndex = Math.floor(Math.random() * balloonColors.length);
                const newModelColor = balloonColors[colorIndex];
                child.material = child.material.clone(); // clone per non cambiare il materiale originale
                child.material.color = new Color(newModelColor);
            }
        });

        // add model to scene
        game.addToScene(newModel);

        // pop sound
        const audio = new PositionalAudio(SceneManager.listener);
        audio.setBuffer(popAudioBuffer);
        newModel.add(audio);
        audio.play();

        // Set gameData
        const diffMatrix = game.getObjOffsetMatrix(props.referenceMatrix, newModel);
        const newData = {
            color: colorIndex,
            diffMatrix: diffMatrix
        };
        game.setGameData((prev) => [...prev, newData]);

        console.log("UNDO VISIBLE:", game.gameData().length > 0)
    }



    //#region [Game Logics]

    function loadEnv() {
        const rgbeLoader = new RGBELoader();
        const fileUrl = "images/hdr/empty_warehouse_1k.hdr";
        rgbeLoader.load(fileUrl, (envMap) => {
            envMap.mapping = THREE.EquirectangularReflectionMapping;
            SceneManager.scene.environment = envMap;
            SceneManager.scene.environmentIntensity = 1.2;
        });
    }



    function createArrow() {
        // console.log("*********START************")

        if (playerState() !== PLAYER_STATE.RUNNING) {
            return;
        }


        if (arrow) {
            // Se era attaccata alla camera, rimuovila da lì
            if (arrow.parent === SceneManager.camera) {
                SceneManager.camera.remove(arrow);
            } else {
                SceneManager.scene.remove(arrow);
            }
        }

        // const arrowGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.2);
        // const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        // arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

        // const arrowGeometry = new THREE.BoxGeometry(0.001, 0.001, 0.2);
        // const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        // arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);


        arrow = arrowModel;

        // ✅ POSIZIONE RELATIVA alla camera (coordinate locali)
        // arrow.position.set(0, -0.2, -0.3); // Offset dalla camera
        arrow.position.copy(ARROW_OFFSET); // Offset dalla camera
        arrow.rotation.set(0, 0, 0);   // Rotazione relativa alla camera




        // arrowModel.position.copy(ARROW_OFFSET); // Offset dalla camera
        // arrowModel.rotation.set(0, 0, 0);   // Rotazione relativa alla camera
        // SceneManager.camera.add(arrowModel);
        // console.log("------ arrow ------ ")
        // console.log(arrow)
        // console.log(arrowModel)
        // console.log("------ end ------ ")



        // ✅ ATTACCA alla camera!
        SceneManager.camera.add(arrow);

        arrow.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            isFlying: false
        };

        isArrowFlying = false;
    }

    function launchArrow() {
        if (isArrowFlying || arrowsLeft() <= 0) return;

        if (playerState() !== PLAYER_STATE.RUNNING) return;


        console.log("launchArrow")

        whooshAudio.play();

        // ✅ PRIMA ottieni i valori mondiali
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();

        arrow.getWorldPosition(worldPosition);
        arrow.getWorldQuaternion(worldQuaternion);  // ← PRIMA ottieni il quaternion!

        // ✅ POI calcola la direzione con il quaternion CORRETTO
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(worldQuaternion);  // ← ORA ha i valori giusti!


        // ✅ DOPO stacca dalla camera
        SceneManager.camera.remove(arrow);
        SceneManager.scene.add(arrow);

        // ✅ Imposta posizione e rotazione
        arrow.position.copy(worldPosition);
        arrow.quaternion.copy(worldQuaternion);  // ← Usa direttamente il quaternion!



        // arrowsLeft--;
        setArrowsLeft(prev => prev - 1);
        // document.getElementById('arrows').textContent = arrowsLeft;


        // Velocità nella direzione della camera
        const horizontalSpeed = ARROW_SPEED;
        const verticalBoost = ARROW_HEIGHT;

        arrow.userData.velocity.set(
            direction.x * horizontalSpeed,
            direction.y * horizontalSpeed + verticalBoost, // Componente Y + boost verticale
            direction.z * horizontalSpeed
        );



        arrow.userData.isFlying = true;
        isArrowFlying = true;
    }


    function updateArrow() {
        if (!isArrowFlying || !arrow.userData.isFlying) return;

        // Applica la gravità
        arrow.userData.velocity.y -= GRAVITY;

        // Aggiorna la posizione
        arrow.position.add(arrow.userData.velocity);

        // Ruota leggermente la freccia per seguire la traiettoria
        arrow.rotation.x += 0.01;

        // Controlla le collisioni con i palloncini
        checkCollisions();

        // Rimuovi la freccia se va troppo in basso o troppo lontano
        if (arrow.position.y < GROUND_Y || arrow.position.z < -15) {
            setTimeout(() => {
                // console.log("arrowLeft:", arrowsLeft())
                if (arrowsLeft() > 0) {
                    createArrow();
                } else {
                    endGameLooser();
                }
            }, 500);
        }
    }



    function checkCollisions() {
        const arrowBox = new THREE.Box3().setFromObject(arrow);

        for (let i = balloons.length - 1; i >= 0; i--) {

            const balloon = balloons[i];
            const balloonBox = new THREE.Box3().setFromObject(balloon);

            if (arrowBox.intersectsBox(balloonBox)) {


                setExplodedBalloons(prev => prev + 1);

                // Collisione! Rimuovi il palloncino
                const mat = findMaterialByName(balloon, "balloon")
                const color = mat.color;

                // play audio explosion
                const audio = new PositionalAudio(SceneManager.listener);
                audio.setBuffer(balloonExplosionAudioBuffer);
                balloon.add(audio);
                audio.play();

                SceneManager.scene.remove(balloon);
                balloons.splice(i, 1);

                // // Aggiorna il punteggio
                // score++;
                // document.getElementById('score').textContent = score;

                // Effetto di "pop" - piccola animazione
                createPopEffect(balloon.position, color);


                if (explodedBalloons() == game.gameData().length) {
                    // console.log("HAI VINTO!")

                    endGameWinner();
                }

                // // Se tutti i palloncini sono stati colpiti
                // if (balloons.length === 0) {
                //     setTimeout(() => {
                //         alert('Congratulazioni! Hai colpito tutti i palloncini!');
                //     }, 500);
                // }
            }
        }
    }


    function createPopEffect(position, color) {
        // Crea un effetto visivo semplice quando un palloncino viene colpito
        const particles = [];
        const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);

        for (let i = 0; i < 20; i++) {
            const particleMaterial = new THREE.MeshLambertMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);

            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random(),
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(0.1);

            particle.userData = { velocity: direction, life: 1.0 };
            SceneManager.scene.add(particle);
            particles.push(particle);
        }

        // Anima e rimuovi le particelle
        const animateParticles = () => {
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.y -= 0.005; // Gravità sulle particelle
                particle.userData.life -= 0.05;
                particle.material.opacity = particle.userData.life;

                if (particle.userData.life <= 0) {
                    SceneManager.scene.remove(particle);
                    particles.splice(i, 1);
                }
            }

            if (particles.length > 0) {
                requestAnimationFrame(animateParticles);
            }
        };
        animateParticles();
    }


    function endGameWinner() {
        setTimeout(() => {
            setPlayerState(PLAYER_STATE.WINNER);
            console.log("HAI VINTO!!!")
        }, 500);

    }


    function endGameLooser() {
        setTimeout(() => {
            setPlayerState(PLAYER_STATE.LOOSER);
            console.log("HAI PERSO!!!")
        }, 500);

    }













    /*
    * RENDER
    */


    const Info = styled('div')`
        display: flex;
        /* width: 100%; */
        box-sizing: border-box;
        align-items: center;
        gap: 2rem;
        justify-content: center;
      `;



    //#region [Author UI]


    const AuthorUI = () => {
        return (
            <>
                <button onClick={() => spawnModelOnTap()}>SPAWN!</button>
                <Info>
                    <Info style={{ gap: '0.5rem' }}>
                        <SvgIcon src={'icons/balloon.svg'} color={'var(--color-secondary)'} size={25} />
                        {game.gameData().length}
                    </Info>
                </Info>
                <Toolbar
                    buttons={["undo", "save"]}
                    onUndo={handleUndo}
                    onSave={handleSave}
                    undoActive={game.gameData().length > 0}
                    saveActive={hasUnsavedChanges()}
                />
            </>
        )
    }


    //#region [User UI]


    const UserUI = () => {
        return (
            <Container>
                <button onClick={() => launchArrow()}>ARROW</button>

                {(() => {
                    switch (playerState()) {
                        case PLAYER_STATE.WINNER:
                            return <div>HAI VINTO!</div>;
                        case PLAYER_STATE.LOOSER:
                            return <div>HAI PERSO!</div>;
                        default:
                            return (
                                <Info>
                                    <Info style={{ gap: '0.5rem' }}>
                                        <SvgIcon src={'icons/dart.svg'} color={'var(--color-secondary)'} size={25} />
                                        {arrowsLeft()}
                                    </Info>
                                    <Info style={{ gap: '0.5rem' }}>
                                        <SvgIcon src={'icons/balloon.svg'} color={'var(--color-secondary)'} sizeY={25} />
                                        {explodedBalloons()} / {game.gameData().length}
                                    </Info>
                                    <Info style={{ gap: '0.5rem' }}>
                                        <SvgIcon src={'icons/time.svg'} color={'var(--color-secondary)'} size={20} />
                                        {remainingTime() / 1000}
                                    </Info>
                                </Info>
                            );
                    }
                })()}
            </Container>
        )
    }




    //#region [RETURN]

    return (
        <>
            {
                props.enabled && (
                    (() => {
                        switch (game.appMode) {
                            case "save":
                                return <AuthorUI />;
                            case "load":
                                return <UserUI />;
                        }
                    })()
                )
            }
        </>
    );
}