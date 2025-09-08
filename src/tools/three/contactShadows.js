import { Vector3, Group, Mesh, WebGLRenderTarget, PlaneGeometry, MeshBasicMaterial, OrthographicCamera, CameraHelper, MeshDepthMaterial, ShaderMaterial } from 'three';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

/**
 * ContactShadows - Classe per generare ombre di contatto su un piano
 * 
 * Crea ombre proiettate su un piano orizzontale utilizzando depth buffer e blur.
 * Le ombre vengono renderizzate in tempo reale e seguono la geometria della scena.
 * 
 * @example
 * // Esempio base
 * const shadows = new ContactShadows(scene, renderer, new Vector3(0, 0, 0));
 * 
 * @example
 * // Con opzioni personalizzate
 * const shadows = new ContactShadows(scene, renderer, new Vector3(0, -1, 0), {
 *   size: 5,
 *   resolution: 1024,
 *   blur: 2.5,
 *   darkness: 0.8,
 *   opacity: 0.9
 * });
 * 
 * // Nel loop di rendering
 * shadows.render();
 * renderer.render(scene, camera);
 * 
 * // Pulizia risorse quando non serve più
 * shadows.dispose();
 */

class ContactShadows {

    /**
     * Crea una nuova istanza di ContactShadows
     * 
     * @param {THREE.Scene} scene - La scena Three.js dove aggiungere le ombre
     * @param {THREE.WebGLRenderer} renderer - Il renderer WebGL
     * @param {THREE.Vector3} position - Posizione del piano delle ombre (solitamente Y = 0 o sotto gli oggetti)
     * @param {Object} [options={}] - Opzioni di configurazione
     * @param {number} [options.size=2] - Dimensione del piano delle ombre (larghezza/altezza in unità scene)
     * @param {number} [options.resolution=512] - Risoluzione texture ombre (512, 1024, 2048... potenze di 2)
     * @param {number} [options.cameraHeight=1.5] - Altezza camera ortografica per depth rendering
     * @param {number} [options.blur=3] - Intensità blur delle ombre (0 = nessun blur, valori alti = più blur)
     * @param {number} [options.darkness=1] - Intensità scurezza ombre (0 = trasparenti, 1 = molto scure)
     * @param {number} [options.opacity=1] - Opacità generale del piano ombre (0 = invisibile, 1 = completamente opaco)
     * @param {boolean} [options.showWireframe=false] - Mostra wireframe per debug (non implementato)
     */

    constructor(scene, renderer, options = {}) {
        this.scene = scene;
        this.renderer = renderer;
        this.offset = options.position ?? new Vector3();
        this.size = options.size ?? 2;
        this.shadowResolution = options.resolution ?? 512;
        this.cameraHeight = options.cameraHeight ?? 1.5;
        this.blur = options.blur ?? 3;
        this.darkness = options.darkness ?? 1;
        this.opacity = options.opacity ?? 1;
        this.showWireframe = options.showWireframe ?? false;

        this.shadowGroup = null;
        this.renderTarget = null;
        this.renderTargetBlur = null;
        this.shadowCamera = null;
        this.cameraHelper = null;
        this.depthMaterial = null;
        this.horizontalBlurMaterial = null;
        this.verticalBlurMaterial = null;
        this.plane = null;
        this.blurPlane = null;
        this.fillPlane = null;
        this.initialized = false;

        this._init();
    }

    _init() {
        // the container, if you need to move the plane just move this
        this.shadowGroup = new Group();
        this.shadowGroup.position.add(this.offset);
        this.scene.add(this.shadowGroup);

        // the render target that will show the shadows in the plane texture
        this.renderTarget = new WebGLRenderTarget(this.shadowResolution, this.shadowResolution);
        this.renderTarget.texture.generateMipmaps = false;

        // the render target that we will use to blur the first render target
        this.renderTargetBlur = new WebGLRenderTarget(this.shadowResolution, this.shadowResolution);
        this.renderTargetBlur.texture.generateMipmaps = false;

        // make a plane and make it face up
        const planeGeometry = new PlaneGeometry(this.size, this.size).rotateX(Math.PI / 2);
        const planeMaterial = new MeshBasicMaterial({
            map: this.renderTarget.texture,
            opacity: this.opacity,
            transparent: true,
            depthWrite: false,
        });
        this.plane = new Mesh(planeGeometry, planeMaterial);
        // make sure it's rendered after the fillPlane
        this.plane.renderOrder = 1;
        this.shadowGroup.add(this.plane);

        // the y from the texture is flipped!
        this.plane.scale.y = -1;

        // the plane onto which to blur the texture
        this.blurPlane = new Mesh(planeGeometry);
        this.blurPlane.visible = false;
        this.shadowGroup.add(this.blurPlane);

        // the plane with the color of the ground
        const fillPlaneMaterial = new MeshBasicMaterial({
            color: '#ffffff',
            opacity: 0,
            transparent: true,
            depthWrite: false,
        });
        this.fillPlane = new Mesh(planeGeometry, fillPlaneMaterial);
        this.fillPlane.rotateX(Math.PI);
        this.shadowGroup.add(this.fillPlane);

        // the camera to render the depth material from
        this.shadowCamera = new OrthographicCamera(-this.size / 2, this.size / 2, this.size / 2, -this.size / 2, 0, this.cameraHeight);
        this.shadowCamera.rotation.x = Math.PI / 2; // get the camera to look up
        this.shadowGroup.add(this.shadowCamera);

        this.cameraHelper = new CameraHelper(this.shadowCamera);

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

        this.initialized = true;
    }

    _blurShadow(amount) {
        this.blurPlane.visible = true;

        // blur horizontally and draw in the renderTargetBlur
        this.blurPlane.material = this.horizontalBlurMaterial;
        this.blurPlane.material.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.horizontalBlurMaterial.uniforms.h.value = amount * 1 / this.shadowResolution;

        this.renderer.setRenderTarget(this.renderTargetBlur);
        this.renderer.render(this.blurPlane, this.shadowCamera);

        // blur vertically and draw in the main renderTarget
        this.blurPlane.material = this.verticalBlurMaterial;
        this.blurPlane.material.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
        this.verticalBlurMaterial.uniforms.v.value = amount * 1 / this.shadowResolution;

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.blurPlane, this.shadowCamera);

        this.blurPlane.visible = false;
    }

    render() {
        if (!this.initialized) return;

        // remove the background
        const initialBackground = this.scene.background;
        this.scene.background = null;

        // force the depthMaterial to everything
        this.cameraHelper.visible = false;
        this.scene.overrideMaterial = this.depthMaterial;

        // set renderer clear alpha
        const initialClearAlpha = this.renderer.getClearAlpha();
        this.renderer.setClearAlpha(0);

        // render to the render target to get the depths
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.shadowCamera);

        // and reset the override material
        this.scene.overrideMaterial = null;
        this.cameraHelper.visible = true;

        this._blurShadow(this.blur);

        // a second pass to reduce the artifacts
        // (0.4 is the minimum blur amount so that the artifacts are gone)
        this._blurShadow(this.blur * 0.4);

        // reset and render the normal scene
        this.renderer.setRenderTarget(null);
        this.renderer.setClearAlpha(initialClearAlpha);
        this.scene.background = initialBackground;
    }

    dispose() {
        if (this.shadowGroup) {
            this.scene.remove(this.shadowGroup);
        }
        if (this.renderTarget) {
            this.renderTarget.dispose();
        }
        if (this.renderTargetBlur) {
            this.renderTargetBlur.dispose();
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

        this.initialized = false;
    }
}

export default ContactShadows;