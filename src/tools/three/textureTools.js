import { TextureLoader } from "three";

export async function LoadTexture(url, options = {}) {
    return new Promise((resolve, reject) => {
        new TextureLoader().load(
            url,
            (texture) => {
                texture.flipY = options.flipY ?? true;
                resolve(texture);
            },
            undefined,
            reject
        );
    });
}



export class LoadTexture2 {
    constructor(filePath, options = {}) {
        this.filePath = filePath;
        this.flipY = options.flipY ?? false;
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