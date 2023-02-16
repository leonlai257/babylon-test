class Vector {
    x: number;
    y: number;
    z: number;
    constructor(a: number, b: number,c:number) {
        var _a, _b, _c, _d, _e, _f;
        if (Array.isArray(a)) {
            this.x = (_a = a[0]) !== null && _a !== void 0 ? _a : 0;
            this.y = (_b = a[1]) !== null && _b !== void 0 ? _b : 0;
            this.z = (_c = a[2]) !== null && _c !== void 0 ? _c : 0;
            return;
        }
        if (!!a && typeof a === 'object') {
            this.x = (_d = a.x) !== null && _d !== void 0 ? _d : 0;
            this.y = (_e = a.y) !== null && _e !== void 0 ? _e : 0;
            this.z = (_f = a.z) !== null && _f !== void 0 ? _f : 0;
            return;
        }
        this.x = a !== null && a !== void 0 ? a : 0;
        this.y = b !== null && b !== void 0 ? b : 0;
        this.z = c !== null && c !== void 0 ? c : 0;
    }
    add(v) {
        if (v instanceof Vector)
            return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
        else return new Vector(this.x + v, this.y + v, this.z + v);
    }
    subtract(v) {
        if (v instanceof Vector)
            return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
        else return new Vector(this.x - v, this.y - v, this.z - v);
    }
    multiply(v) {
        if (v instanceof Vector)
            return new Vector(this.x * v.x, this.y * v.y, this.z * v.z);
        else return new Vector(this.x * v, this.y * v, this.z * v);
    }
    lerp(v, fraction) {
        return v.subtract(this).multiply(fraction).add(this);
    }
    distance(v, d = 3) {
        //2D distance
        if (d === 2)
            return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
        //3D distance
        else
            return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2) + Math.pow(this.z - v.z, 2));
    }
}

const clamp = (val, min, max) => {
    return Math.max(Math.min(val, max), min);
};
const remap = (val, min, max) => {
    //returns min to max -> 0 to 1
    return (clamp(val, min, max) - min) / (max - min);
};
/**
 * Landmark points labeled for eye, brow, and pupils
 */
const RIGHT = 'Right';
const LEFT = 'Left';
const points = {
    eye: {
        [LEFT]: [130, 133, 160, 159, 158, 144, 145, 153],
        [RIGHT]: [263, 362, 387, 386, 385, 373, 374, 380],
    },
};
/**
 * Calculate eye open ratios and remap to 0-1
 * @param {Array} lm : array of results from tfjs or mediapipe
 * @param {Side} side : designate left or right
 * @param {Number} high : ratio at which eye is considered open
 * @param {Number} low : ratio at which eye is comsidered closed
 */
export const getEyeOpen = (
    lm: {x: number,y: number,z: number}[],
    side = LEFT,
    { high = 0.85, low = 0.55 } = {}
) => {
    const eyePoints = points.eye[side];
    const eyeDistance = eyeLidRatio(
        lm[eyePoints[0]],
        lm[eyePoints[1]],
        lm[eyePoints[2]],
        lm[eyePoints[3]],
        lm[eyePoints[4]],
        lm[eyePoints[5]],
        lm[eyePoints[6]],
        lm[eyePoints[7]]
    );
    // human eye width to height ratio is roughly .3
    const maxRatio = 0.285;
    // compare ratio against max ratio
    const ratio = clamp(eyeDistance / maxRatio, 0, 2);
    // remap eye open and close ratios to increase sensitivity
    const eyeOpenRatio = remap(ratio, low, high);
    return {
        // remapped ratio
        norm: eyeOpenRatio,
        // ummapped ratio
        raw: ratio,
    };
};
/**
 * Calculate eyelid distance ratios based on landmarks on the face
 */
export const eyeLidRatio = (
    eyeOuterCorner,
    eyeInnerCorner,
    eyeOuterUpperLid,
    eyeMidUpperLid,
    eyeInnerUpperLid,
    eyeOuterLowerLid,
    eyeMidLowerLid,
    eyeInnerLowerLid
) => {
    eyeOuterCorner = new Vector(eyeOuterCorner);
    eyeInnerCorner = new Vector(eyeInnerCorner);
    eyeOuterUpperLid = new Vector(eyeOuterUpperLid);
    eyeMidUpperLid = new Vector(eyeMidUpperLid);
    eyeInnerUpperLid = new Vector(eyeInnerUpperLid);
    eyeOuterLowerLid = new Vector(eyeOuterLowerLid);
    eyeMidLowerLid = new Vector(eyeMidLowerLid);
    eyeInnerLowerLid = new Vector(eyeInnerLowerLid);
    //use 2D Distances instead of 3D for less jitter
    const eyeWidth = eyeOuterCorner.distance(eyeInnerCorner, 2);
    const eyeOuterLidDistance = eyeOuterUpperLid.distance(eyeOuterLowerLid, 2);
    const eyeMidLidDistance = eyeMidUpperLid.distance(eyeMidLowerLid, 2);
    const eyeInnerLidDistance = eyeInnerUpperLid.distance(eyeInnerLowerLid, 2);
    const eyeLidAvg =
        (eyeOuterLidDistance + eyeMidLidDistance + eyeInnerLidDistance) / 3;
    const ratio = eyeLidAvg / eyeWidth;
    return ratio;
};
/**
 * Calculate pupil position [-1,1]
 * @param {Results} lm : array of results from tfjs or mediapipe
 * @param {Side} side : left or right
 */
export const stabilizeBlink = (
    eye,
    headY,
    { enableWink = true, maxRot = 0.5 } = {}
) => {
    eye.r = clamp(eye.r, 0, 1);
    eye.l = clamp(eye.l, 0, 1);
    //difference between each eye
    const blinkDiff = Math.abs(eye.l - eye.r);
    //theshold to which difference is considered a wink
    const blinkThresh = enableWink ? 0.8 : 1.2;
    //detect when both eyes are closing
    const isClosing = eye.l < 0.3 && eye.r < 0.3;
    //detect when both eyes are opening
    const isOpen = eye.l > 0.6 && eye.r > 0.6;
    // sets obstructed eye to the opposite eye value
    if (headY > maxRot) {
        return { l: eye.r, r: eye.r };
    }
    if (headY < -maxRot) {
        return { l: eye.l, r: eye.l };
    }
    // returns either a wink or averaged blink values
    return {
        l:
            blinkDiff >= blinkThresh && !isClosing && !isOpen
                ? eye.l
                : eye.r > eye.l
                ? Vector.lerp(eye.r, eye.l, 0.95)
                : Vector.lerp(eye.r, eye.l, 0.05),
        r:
            blinkDiff >= blinkThresh && !isClosing && !isOpen
                ? eye.r
                : eye.r > eye.l
                ? Vector.lerp(eye.r, eye.l, 0.95)
                : Vector.lerp(eye.r, eye.l, 0.05),
    };
};
/**
 * Calculate Eyes
 * @param {Array} lm : array of results from tfjs or mediapipe
 */
export const calcEyes = (lm, { high = 0.75, low = 0.25 } = {}) => {
    //open [0,1]
    const leftEyeLid = getEyeOpen(lm, LEFT, { high: high, low: low });
    const rightEyeLid = getEyeOpen(lm, RIGHT, { high: high, low: low });
    return {
        l: leftEyeLid.norm || 0,
        r: rightEyeLid.norm || 0,
    };
};
