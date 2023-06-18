import type { Material } from "@babylonjs/core";

import { PmxObject } from "@/loader/parser/PmxObject";

import type { ILogger } from "./ILogger";
import type { IMmdMaterialProxyConstructor } from "./IMmdMaterialProxy";
import type { MmdBone, MmdMesh } from "./MmdMesh";
import { MmdMorphController } from "./MmdMorphController";

export class MmdModel {
    public readonly mesh: MmdMesh;
    public readonly morph: MmdMorphController;

    public constructor(
        mmdMesh: MmdMesh,
        materialProxyConstructor: IMmdMaterialProxyConstructor<Material>,
        logger: ILogger
    ) {
        this.mesh = mmdMesh;
        this.morph = new MmdMorphController(
            mmdMesh.morphTargetManager,
            mmdMesh.skeleton,
            mmdMesh.material,
            materialProxyConstructor,
            mmdMesh.metadata.sortedBoneIndexMap,
            mmdMesh.metadata.morphs,
            logger
        );
    }

    public beforePhysics(): void {
        this.mesh.skeleton.returnToRest();
        this.morph.update();

        this._update(false);
    }

    public afterPhysics(): void {
        this._update(true);
    }

    private _update(afterPhysicsStage: boolean): void {
        const bones = this.mesh.skeleton.bones;

        // todo: apply bone animation

        for (let i = 0; i < bones.length; ++i) {
            const bone = bones[i];
            const boneMetadata = bone.metadata;
            const isTransformAfterPhysics = (bone.metadata.flag & PmxObject.Bone.Flag.TransformAfterPhysics) !== 0;
            if (isTransformAfterPhysics !== afterPhysicsStage) continue;

            if (boneMetadata.appendTransform !== undefined) {
                // todo: solve append transform
            }

            if (boneMetadata.ik !== undefined) {
                this._updateWorldTransform(bone);

                // todo: solve ik
                // optimize: skip ik if affected bones are physically simulated
            }
        }

        if (!afterPhysicsStage) {
            for (let i = 0; i < bones.length; ++i) {
                const bone = bones[i];
                const isTransformAfterPhysics = (bone.metadata.flag & PmxObject.Bone.Flag.TransformAfterPhysics) !== 0;
                if (isTransformAfterPhysics) continue;

                if (bone.getParent() === null) {
                    this._updateWorldTransform(bone);
                }
            }
        }
    }

    private _updateWorldTransform(bone: MmdBone): void {
        const initialSkinMatrix = this.mesh.getPoseMatrix();

        bone._childUpdateId += 1;
        const parentBone = bone.getParent();

        if (parentBone) {
            bone.getLocalMatrix().multiplyToRef(parentBone.getWorldMatrix(), bone.getWorldMatrix());
        } else {
            if (initialSkinMatrix) {
                bone.getLocalMatrix().multiplyToRef(initialSkinMatrix, bone.getWorldMatrix());
            } else {
                bone.getWorldMatrix().copyFrom(bone.getLocalMatrix());
            }
        }

        const chindren = bone.children;
        for (let index = 0; index < chindren.length; index++) {
            const child = chindren[index];
            if (child._childUpdateId !== bone._childUpdateId) {
                this._updateWorldTransform(child);
            }
        }
    }
}
