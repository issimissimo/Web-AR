/**
 * ContactShadowsXR
 * 
 * @example
 * let shadows = new ContactShadowsXR(scene, renderer);
 * 
 * @example
 * let shadows = new ContactShadowsXR(scene, renderer, {
 *   position: new Vector3(0, -1, 0),
 *   size: 3,
 *   resolution: 1024,
 *   blur: 2,
 *   darkness: 0.8,
 *   opacity: 0.9,
 *   animate: true,
 *   updateFrequency: 25
 * });
 * 
 * // In rennder loop
 * shadows.update();
 * renderer.render(scene, camera);
 * 
 * // Clean
 * shadows.dispose();
 */


import {
    Vector3, Scene, Group, Mesh, WebGLRenderTarget,
    PlaneGeometry, MeshBasicMaterial, OrthographicCamera,
    MeshDepthMaterial, ShaderMaterial, WebGLRenderer,
    DataTexture, RGBAFormat, UnsignedByteType
} from 'three';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';


class ContactShadowsXR {

    /**
     * Crea una nuova istanza di ContactShadows
     * 
     * @param {THREE.Scene} scene - Main scene
     * @param {THREE.WebGLRenderer} renderer - Main XR renderer
     * @param {THREE.Vector3} position - Shadow plane origin
     * @param {Object} [options={}] - Options
     * @param {number} [options.size=2] - Shadow plane size
     * @param {number} [options.resolution=512] - Shadow resolution (512, 1024, 2048...)
     * @param {number} [options.cameraHeight=1.5] - Shadow camera height (put on the top of the model)
     * @param {number} [options.blur=3] - Shadow blur intensity (0 = blur, more efficient)
     * @param {number} [options.darkness=1] - Shadow darkness
     * @param {number} [options.opacity=1] - Shadow opacity
     * @param {boolean} [options.animate=false] - Update shadow with model animation
     * @param {number} [options.updateFrequency=5] - If animate=true set the update frequency (increase for performances)
     */

    constructor(scene, renderer, options = {}) {
        this.scene = scene;
        this.mainRenderer = renderer;
        this.offset = options.position ?? new Vector3();
        this.size = options.size ?? 2;
        this.shadowResolution = options.resolution ?? 512;
        this.cameraHeight = options.cameraHeight ?? 1.5;
        this.blur = options.blur ?? 3;
        this.darkness = options.darkness ?? 1;
        this.opacity = options.opacity ?? 1;
        this.shouldAnimate = options.animate ?? false;
        this.updateFrequency = options.updateFrequency ?? 5;

        //
        // Internal properties
        //
        this.shadowRenderer = new WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "low-power"
        });
        this.shadowRenderer.setSize(this.shadowResolution, this.shadowResolution);
        this.shadowRenderer.autoClear = false;

        this.shadowScene = new Scene();
        this.shadowGroup = null;
        this.renderTarget = null;
        this.renderTargetBlur = null;
        this.shadowCamera = null;
        this.cameraHelper = null;
        this.depthMaterial = null;
        this.horizontalBlurMaterial = null;
        this.verticalBlurMaterial = null;
        this.blurPlane = null;
        this.planeWithShadow = null;
        this.finalTexture = null;
        this.frame = 0;

        this._init();
    }

    _init() {

        // Add models from the main scene
        this.scene.children.forEach(child => {
            this.shadowScene.add(child.clone(true));
        });

        // The main container. If you want to move everything just move this!
        this.shadowGroup = new Group();
        this.shadowGroup.position.add(this.offset);
        this.shadowScene.add(this.shadowGroup);

        // Render target per le ombre
        this.renderTarget = new WebGLRenderTarget(this.shadowResolution, this.shadowResolution);
        this.renderTarget.texture.generateMipmaps = false;

        // The render target that we will use to blur the first render target
        this.renderTargetBlur = new WebGLRenderTarget(this.shadowResolution, this.shadowResolution);
        this.renderTargetBlur.texture.generateMipmaps = false;

        // Create plane to blur the texture
        this.blurPlane = new Mesh(new PlaneGeometry(this.size, this.size).rotateX(Math.PI / 2));
        this.blurPlane.visible = false;
        this.shadowGroup.add(this.blurPlane);


        // Create new camera
        this.shadowCamera = new OrthographicCamera(
            -this.size / 2, this.size / 2,
            this.size / 2, -this.size / 2,
            0, this.cameraHeight
        );
        this.shadowCamera.rotation.x = Math.PI / 2;
        this.shadowGroup.add(this.shadowCamera);


        // like MeshDepthMaterial, but goes from black to transparent
        this.depthMaterial = new MeshDepthMaterial();
        this.depthMaterial.userData.darkness = { value: this.darkness };
        this.depthMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.darkness = this.depthMaterial.userData.darkness;
            shader.fragmentShader = /* glsl */`
                uniform float darkness;
                ${shader.fragmentShader.replace(
                'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
                'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
            )}
            `;
        };

        this.depthMaterial.depthTest = false;
        this.depthMaterial.depthWrite = false;

        this.horizontalBlurMaterial = new ShaderMaterial(HorizontalBlurShader);
        this.horizontalBlurMaterial.depthTest = false;

        this.verticalBlurMaterial = new ShaderMaterial(VerticalBlurShader);
        this.verticalBlurMaterial.depthTest = false;


        // Crea finalTexture delle stesse dimensioni del renderTarget
        this.finalTexture = new DataTexture(
            new Uint8Array(this.shadowResolution * this.shadowResolution * 4),
            this.shadowResolution,
            this.shadowResolution,
            RGBAFormat,
            UnsignedByteType
        );

        const planeWithShadowGeo = new PlaneGeometry(this.size, this.size);
        const planeWithShadowMat = new MeshBasicMaterial({
            map: this.finalTexture,
            opacity: this.opacity,
            transparent: true,
            depthWrite: false,
        });
        this.planeWithShadow = new Mesh(planeWithShadowGeo, planeWithShadowMat);
        this.planeWithShadow.position.add(this.offset);
        this.planeWithShadow.rotation.x = - Math.PI / 2;
        this.planeWithShadow.scale.y = -1;
        this.scene.add(this.planeWithShadow)
    }

    _blurShadow(amount) {
        this.blurPlane.visible = true;

        // blur horizontally and draw in the renderTargetBlur
        this.blurPlane.material = this.horizontalBlurMaterial;
        this.blurPlane.material.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.horizontalBlurMaterial.uniforms.h.value = amount * 1 / this.shadowResolution;

        this.shadowRenderer.setRenderTarget(this.renderTargetBlur);
        this.shadowRenderer.render(this.blurPlane, this.shadowCamera);

        // blur vertically and draw in the main renderTarget
        this.blurPlane.material = this.verticalBlurMaterial;
        this.blurPlane.material.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
        this.verticalBlurMaterial.uniforms.v.value = amount * 1 / this.shadowResolution;

        this.shadowRenderer.setRenderTarget(this.renderTarget);
        this.shadowRenderer.render(this.blurPlane, this.shadowCamera);

        this.blurPlane.visible = false;
    }

    _render() {

        // Move objects from main scene to shadowScene
        const originalObjects = [];
        this.scene.children.forEach(child => {
            if (child !== this.shadowGroup && child !== this.planeWithShadow) {
                originalObjects.push(child);
            }
        });
        originalObjects.forEach(obj => {
            this.scene.remove(obj);
            this.shadowScene.add(obj);
        });

        // Render        
        this.shadowScene.overrideMaterial = this.depthMaterial;
        this.shadowRenderer.setRenderTarget(this.renderTarget);
        this.shadowRenderer.clear();
        this.shadowRenderer.render(this.shadowScene, this.shadowCamera);
        this.shadowScene.overrideMaterial = null;

        if (this.blur > 0) this._blurShadow(this.blur);

        // Read pixel from render target
        const pixels = new Uint8Array(this.shadowResolution * this.shadowResolution * 4);
        this.shadowRenderer.readRenderTargetPixels(
            this.renderTarget,
            0, 0,
            this.shadowResolution,
            this.shadowResolution,
            pixels
        );
        this.finalTexture.image.data = pixels;
        this.finalTexture.needsUpdate = true;

        // Reset
        this.shadowRenderer.setRenderTarget(null);

        // Restore objects in main scene
        originalObjects.forEach(obj => {
            this.shadowScene.remove(obj);
            this.scene.add(obj);
        });
    }

    update() {
        this.frame++;

        if (this.shouldAnimate) {

            if (this.frame < this.updateFrequency) {
                return false;
            }
            this.frame = 0;
            this._render();
        }
        else {
            // Not clear to me why we have to render for 5 frames,
            // otherwise we get just a black plane
            if (this.frame < 5) {
                this._render();
            }
        }
    }

    dispose() {

        if (this.planeWithShadow) {
            this.scene.remove(this.planeWithShadow);

            if (this.planeWithShadow.geometry) {
                this.planeWithShadow.geometry.dispose();
            }
            if (this.planeWithShadow.material) {
                this.planeWithShadow.material.dispose();
            }
        }

        if (this.renderTarget) {
            this.renderTarget.dispose();
        }
        if (this.renderTargetBlur) {
            this.renderTargetBlur.dispose();
        }

        if (this.finalTexture) {
            this.finalTexture.dispose();
        }

        if (this.depthMaterial) {
            this.depthMaterial.dispose();
        }
        if (this.horizontalBlurMaterial) {
            this.horizontalBlurMaterial.dispose();
        }
        if (this.verticalBlurMaterial) {
            this.verticalBlurMaterial.dispose();
        }

        if (this.blurPlane) {
            if (this.blurPlane.geometry) {
                this.blurPlane.geometry.dispose();
            }
        }

        if (this.shadowRenderer) {
            this.shadowRenderer.dispose();
        }

        if (this.shadowScene) {
            while (this.shadowScene.children.length > 0) {
                this.shadowScene.remove(this.shadowScene.children[0]);
            }
        }

        this.scene = null;
        this.mainRenderer = null;
        this.shadowRenderer = null;
        this.shadowScene = null;
        this.shadowGroup = null;
        this.renderTarget = null;
        this.renderTargetBlur = null;
        this.shadowCamera = null;
        this.depthMaterial = null;
        this.horizontalBlurMaterial = null;
        this.verticalBlurMaterial = null;
        this.blurPlane = null;
        this.planeWithShadow = null;
        this.finalTexture = null;
    }
}

export default ContactShadowsXR;