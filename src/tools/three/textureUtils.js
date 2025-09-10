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