import { Audio, AudioLoader, PositionalAudio } from 'three';

export class LoadAudio {
    constructor(filePath, listener, options = {}) {
        this.filePath = filePath;
        this.listener = listener;

        this.loop = options.loop ?? false;
        this.volume = options.volume ?? 1;
        this.autoPlay = options.play ?? false;

        this.sound = null;
        return this._init();
    }

    async _init() {
        this.sound = await this._loadAudio();
        return this.sound;
    }

    _loadAudio() {
        console.log("loading audio...");
        return new Promise((resolve, reject) => {
            const sound = new Audio(this.listener);
            const audioLoader = new AudioLoader();

            audioLoader.load(
                this.filePath,
                (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setLoop(this.loop);
                    sound.setVolume(this.volume);

                    if (this.autoPlay) {
                        sound.play();
                    }

                    resolve(sound);
                },
                function (progress) {
                    // console.log('Caricamento audio:', (progress.loaded / progress.total * 100) + '%');
                },
                function (error) {
                    reject(new Error(`Errore nel caricamento del file audio: ${error}`));
                }
            );
        });
    }
}


export class LoadPositionalAudio {
    constructor(filePath, listener, options = {}) {
        this.filePath = filePath;
        this.listener = listener;

        this.model = options.model ?? null;
        this.loop = options.loop ?? false;
        this.volume = options.volume ?? 1;
        this.autoPlay = options.play ?? false;
        this.refDistance = options.refDistance ?? 0.5;
        this.maxDistance = options.maxDistance ?? 0.1;

        this.sound = null;
        return this._init();
    }

    async _init() {
        this.sound = await this._loadPositionalAudio();
        return this.sound;
    }

    _loadPositionalAudio() {
        console.log("loading positional audio...");
        return new Promise((resolve, reject) => {
            const sound = new PositionalAudio(this.listener);
            const audioLoader = new AudioLoader();

            audioLoader.load(
                this.filePath,
                (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setLoop(this.loop);
                    sound.setRefDistance(this.refDistance);
                    sound.setMaxDistance(this.maxDistance);
                    sound.setVolume(this.volume);   

                    if (this.autoPlay) {
                        sound.play();
                    }

                    if (this.model) {
                        this.model.add(sound);
                    }

                    resolve(sound);
                },
                function (progress) {
                    // console.log('Caricamento audio:', (progress.loaded / progress.total * 100) + '%');
                },
                function (error) {
                    reject(new Error(`Errore nel caricamento del file audio: ${error}`));
                }
            );
        });
    }
}
