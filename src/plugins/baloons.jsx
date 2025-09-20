import { onMount, createEffect, createSignal, createMemo } from 'solid-js';
import { useGame } from '@js/gameBase';
import { styled } from 'solid-styled-components';
import { MathUtils, Color, Matrix4, Vector3, Quaternion, PositionalAudio, Euler } from 'three';
import Reticle from '@js/reticle';
import { LoadAudioBuffer } from '@tools/three/audioTools';
import { RecreateMaterials, findMaterialByName } from "@tools/three/materialTools";
import Toolbar from '@views/ar-overlay/Toolbar';
import SceneManager from "@js/sceneManager"
import { Container } from '@components/smallElements';
import SvgIcon from '@components/SvgIcon';
import * as THREE from 'three';
import { config } from '@js/config';



const balloonColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff, 0xffa500, 0x800080, 0x000000];
let balloons = [];
let arrow = null;
let isArrowFlying = false;
let score = 0;
let arrowsLeft = 10;
let isPlaying = true;

// GAME parameters
const ARROW_HEIGHT = 0.1;
const ARROW_SPEED = 0.04;
const GRAVITY = 0.008;
const GROUND_Y = -1.5;
const BALLOON_COUNT = 8;


export default function Baloons(props) {
    const [lastSavedGameData, setLastSavedGameData] = createSignal([]);

    let maxGameTime = 30000;
    const dartBonus = 5;

    // GAME variables
    const [remainingArrow, setRemainingArrow] = createSignal(0);
    const [explodedBalloons, setExplodedBalloons] = createSignal(0);
    const [remainingTime, setRemainingTime] = createSignal(maxGameTime);
    const [currentTime, setCurrentTime] = createSignal(maxGameTime);

    // decrease game time
    createEffect(() => {
        if (props.enabled && game.appMode === "load") {
            const interval = setInterval(() => {
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


    /*
    * Default DATA
    */
    const defaultGameData = [];


    let popAudioBuffer;
    let balloonExplosionAudioBuffer;
    //  const spawnedBalloons = [];
    // class SpawnedBalloon {
    //     constructor(model, revealSound, explodeSound = null){

    //     }
    // }


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

        // load model
        await game.loader.load("models/balloon.glb");

        // load audio
        popAudioBuffer = await new LoadAudioBuffer("sounds/pop.ogg");
        balloonExplosionAudioBuffer = await new LoadAudioBuffer("sounds/balloon-explosion.ogg");

        // Setup data
        await game.loadGameData();
        if (!game.gameData()) {
            console.log("siccome non abbiamo caricato niente settiamo i dati di default")
            game.setGameData(defaultGameData);
        }

        // setup game
        setRemainingArrow(game.gameData().length + dartBonus);

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
                break;
        }
        // wait a little before to spawn loaded models
        setTimeout(() => {
            if (game.gameData().length > 0)
                loadAllModels();
        }, 250)
    }


    /*
    * LOOP
    */
    function loop() {
        if (game.loader.loaded()) {

            game.loader.animate();

            if (game.appMode == "load") {

                if (isPlaying) {

                    updateArrow();


                    // ✅ NUOVO: Aggiorna posizione freccia se non sta volando
                    if (!isArrowFlying && arrow) {
                        const offset = new THREE.Vector3(0, -0.2, -0.3);
                        arrow.position.copy(SceneManager.camera.position).add(offset.applyQuaternion(SceneManager.camera.quaternion));
                        arrow.rotation.copy(SceneManager.camera.rotation);
                    }

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

                let newModel = game.loader.clone({ randomizeTime: true });
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
                    arrowsLeft = balloons.length;
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
        const p = new Vector3().setFromMatrixPosition(Reticle.getHitMatrix())
        console.log("SPAWN...", p)

        // clone model on hitMatrix with random Y rotation
        const newModel = game.loader.clone({
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

    function createArrow() {
        console.log("*********START************")
        if (arrow) {
            SceneManager.scene.remove(arrow);
        }

        // Crea un piccolo cubo come placeholder della freccia
        const arrowGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.2);
        const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        // arrow.position.set(0, -0.2, -0.3);


        // Posizione relativa alla camera
        const offset = new THREE.Vector3(0, -0.2, -0.3); // Sotto e davanti alla camera
        arrow.position.copy(SceneManager.camera.position).add(offset.applyQuaternion(SceneManager.camera.quaternion));

        console.log(SceneManager.camera.position)
        console.log(arrow.position)



        // Rotazione come la camera
        arrow.rotation.copy(SceneManager.camera.rotation);


        SceneManager.scene.add(arrow);

        // Reset delle proprietà di volo
        arrow.userData = {
            velocity: new THREE.Vector3(0, 0, 0),
            isFlying: false
        };

        isArrowFlying = false;
        console.log("*********END*************")
    }

    function launchArrow() {
        if (isArrowFlying || arrowsLeft <= 0) return;

        arrowsLeft--;
        // document.getElementById('arrows').textContent = arrowsLeft;




        // // Imposta la velocità iniziale della freccia
        // arrow.userData.velocity.set(0, 0.15, -ARROW_SPEED);


        // Calcola direzione basata sulla rotazione della camera
        const direction = new THREE.Vector3(0, 0, -1); // Direzione forward
        direction.applyQuaternion(SceneManager.camera.quaternion);   // Ruota secondo la camera

        // Velocità nella direzione della camera
        const horizontalSpeed = ARROW_SPEED;
        const verticalBoost = ARROW_HEIGHT; // L'altezza che hai impostato prima

        arrow.userData.velocity.set(
            direction.x * horizontalSpeed,
            direction.y * horizontalSpeed + verticalBoost, // Componente Y + boost verticale
            direction.z * horizontalSpeed
        );



        arrow.userData.isFlying = true;
        isArrowFlying = true;
    }

    function launchArrow() {
        if (isArrowFlying || arrowsLeft <= 0) return;

        arrowsLeft--;
        // document.getElementById('arrows').textContent = arrowsLeft;

        // Imposta la velocità iniziale della freccia
        arrow.userData.velocity.set(0, ARROW_HEIGHT, -ARROW_SPEED);
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
        arrow.rotation.x = Math.atan2(-arrow.userData.velocity.y, -arrow.userData.velocity.z);

        // Controlla le collisioni con i palloncini
        checkCollisions();

        // Rimuovi la freccia se va troppo in basso o troppo lontano
        if (arrow.position.y < GROUND_Y || arrow.position.z < -15) {
            setTimeout(() => {
                console.log("arrowLeft:", arrowsLeft)
                if (arrowsLeft > 0) {
                    createArrow();
                } else {
                    endGame();
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

                // Aggiorna il punteggio
                score++;
                // document.getElementById('score').textContent = score;

                // Effetto di "pop" - piccola animazione
                createPopEffect(balloon.position, color);

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


    function endGame() {
        setTimeout(() => {
            console.log(`Gioco finito! Hai colpito ${score} palloncini su ${BALLOON_COUNT}. Premi R per ricominciare.`);
        }, 1000);
        isPlaying = false;
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
                        <SvgIcon src={'icons/balloon.svg'} color={'var(--color-secondary)'} sizeY={40} />
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
                <button onClick={() => spawnModelOnTap()}>SPAWN</button>
                <button onClick={() => launchArrow()}>ARROW</button>
                <Info>
                    <Info style={{ gap: '0.5rem' }}>
                        <SvgIcon src={'icons/dart.svg'} color={'var(--color-secondary)'} size={25} />
                        {remainingArrow()}
                    </Info>
                    <Info style={{ gap: '0.5rem' }}>
                        <SvgIcon src={'icons/balloon.svg'} color={'var(--color-secondary)'} sizeY={40} />
                        {explodedBalloons()} / {game.gameData().length}
                    </Info>
                    <Info style={{ gap: '0.5rem' }}>
                        <SvgIcon src={'icons/time.svg'} color={'var(--color-secondary)'} size={25} />
                        {remainingTime() / 1000}
                    </Info>
                </Info>
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