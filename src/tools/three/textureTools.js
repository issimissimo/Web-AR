import { TextureLoader } from "three";

export class LoadTexture {
    constructor(filePath, options = {}) {
        this.filePath = filePath;
        this.flipY = options.flipY || false;
        this.texture = null;
        return this._init();
    }

    async _init() {
        this.texture = await this._loadTexture();
        return this.texture;
    }

    _loadTexture() {
        return new Promise((resolve, reject) => {
            new TextureLoader().load(
                this.filePath,
                (texture) => {
                    texture.flipY = this.flipY;
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }
}