import { MultiMaterial, Scene } from "@babylonjs/core";
import { PmxObject } from "./parser/PmxObject";

export interface IMmdMaterialBuilder {
    buildMaterials(
        uniqueId: number,
        pmxObject: PmxObject,
        rootUrl: string,
        scene: Scene,
        indices: Uint16Array | Uint32Array,
        uvs: Float32Array,
        multiMaterial: MultiMaterial,
        onComplete?: () => void
    ): Promise<void> | void;
}
