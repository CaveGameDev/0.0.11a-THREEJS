import * as THREE from "./lib/three.js";

// Export the main THREE object
export { THREE };

// Export individual components for other loaders
export const {
    // RGBELoader components
    DataTextureLoader,
    DataUtils,
    FloatType,
    HalfFloatType,
    LinearFilter,
    LinearSRGBColorSpace,
    
    // GLTFLoader components
    AnimationClip,
    Bone,
    Box3,
    BufferAttribute,
    BufferGeometry,
    ClampToEdgeWrapping,
    Color,
    ColorManagement,
    DirectionalLight,
    DoubleSide,
    FileLoader,
    FrontSide,
    Group,
    ImageBitmapLoader,
    InstancedMesh,
    InterleavedBuffer,
    InterleavedBufferAttribute,
    Interpolant,
    InterpolateDiscrete,
    InterpolateLinear,
    Line,
    LineBasicMaterial,
    LineLoop,
    LineSegments,
    LinearMipmapLinearFilter,
    LinearMipmapNearestFilter,
    Loader,
    LoaderUtils,
    Material,
    MathUtils,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    MirroredRepeatWrapping,
    NearestFilter,
    NearestMipmapLinearFilter,
    NearestMipmapNearestFilter,
    NumberKeyframeTrack,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    PointLight,
    Points,
    PointsMaterial,
    PropertyBinding,
    Quaternion,
    QuaternionKeyframeTrack,
    RepeatWrapping,
    Skeleton,
    SkinnedMesh,
    Sphere,
    SpotLight,
    Texture,
    TextureLoader,
    TriangleFanDrawMode,
    TriangleStripDrawMode,
    Vector2,
    Vector3,
    VectorKeyframeTrack,
    SRGBColorSpace,
    InstancedBufferAttribute,
    
    // BufferGeometryUtils components
    Float32BufferAttribute,
    TrianglesDrawMode
} = THREE;

export async function loadRGBELoader() {
    const o = await import("./RGBELoader.js");
    return o.RGBELoader || o.default || o;
}
export async function loadGLTFLoader() {
    const o = await import("./GLTFLoader.js");
    return o.GLTFLoader || o.default || o;
}
