



// @gips_version=1 @coord=rel

precision mediump float;

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float mixAmount;     //label=blend strength, value=1.0, min=0.0, max=1.0, step=0.01, desc=blend strength with original
uniform int blendMode;       //label=blend mode, value=5, min=0, max=6, step=1, desc=blend mode: 0=normal, 1=multiply, 2=screen, 3=overlay, 4=soft light, 5=white mask, 6=divide
uniform vec3 thresholdColor; //label=color, ui=color, desc=threshold layer color

vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec4 pixelThreshold(in vec2 pos) {
    vec2 uv = fromRelCoord(pos);
    uv = offset + uv * texScale;
    return textureLod(iChannel0, uv, 0.0); 
}

vec4 pixelOriginal(in vec2 pos) {
    vec2 uv = fromRelCoord(pos);
    uv = offset + uv * texScale;
    return textureLod(iChannel7, uv, 0.0); 
}


vec3 normalBlend(vec3 base, vec3 blend) {
    return blend;
}

vec3 multiplyBlend(vec3 base, vec3 blend) {
    return base * blend;
}

vec3 screenBlend(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 overlayBlend(vec3 base, vec3 blend) {
    return vec3(
        (base.r < 0.5) ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
        (base.g < 0.5) ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
        (base.b < 0.5) ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
    );
}

vec3 softLightBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r < 0.5) ? (2.0 * base.r * blend.r + base.r * base.r * (1.0 - 2.0 * blend.r)) :
                         (sqrt(base.r) * (2.0 * blend.r - 1.0) + 2.0 * base.r * (1.0 - blend.r)),
        (blend.g < 0.5) ? (2.0 * base.g * blend.g + base.g * base.g * (1.0 - 2.0 * blend.g)) :
                         (sqrt(base.g) * (2.0 * blend.g - 1.0) + 2.0 * base.g * (1.0 - blend.g)),
        (blend.b < 0.5) ? (2.0 * base.b * blend.b + base.b * base.b * (1.0 - 2.0 * blend.b)) :
                         (sqrt(base.b) * (2.0 * blend.b - 1.0) + 2.0 * base.b * (1.0 - blend.b))
    );
}

vec3 whiteMaskBlend(vec3 base, vec3 blend) {
    
    
    float luminance = dot(blend, vec3(0.299, 0.587, 0.114));
    float mask = 1.0 - smoothstep(0.9, 1.0, luminance); 
    return mix(base, blend, mask);
}

vec3 divideBlend(vec3 base, vec3 blend) {
    
    return vec3(
        (blend.r > 0.001) ? min(base.r / blend.r, 1.0) : 1.0,
        (blend.g > 0.001) ? min(base.g / blend.g, 1.0) : 1.0,
        (blend.b > 0.001) ? min(base.b / blend.b, 1.0) : 1.0
    );
}

vec3 applyBlendMode(vec3 base, vec3 blend, int mode) {
    if (mode == 0) return normalBlend(base, blend);
    if (mode == 1) return multiplyBlend(base, blend);
    if (mode == 2) return screenBlend(base, blend);
    if (mode == 3) return overlayBlend(base, blend);
    if (mode == 4) return softLightBlend(base, blend);
    if (mode == 5) return whiteMaskBlend(base, blend);
    if (mode == 6) return divideBlend(base, blend);
    return normalBlend(base, blend); 
}


vec3 applyThresholdColor(vec3 thresholdMask, vec3 color) {
    
    float intensity = 1.0 - dot(thresholdMask, vec3(0.299, 0.587, 0.114));
    return mix(thresholdMask, color, intensity);
}

vec4 run(vec2 pos) {
    vec4 thresholdMask = pixelThreshold(pos);
    vec4 originalColor = pixelOriginal(pos);

    
    vec3 coloredThreshold = applyThresholdColor(thresholdMask.rgb, thresholdColor);

    
    vec3 blendedColor = applyBlendMode(originalColor.rgb, coloredThreshold, blendMode);

    
    vec3 finalColor = mix(originalColor.rgb, blendedColor, mixAmount);

    
    return vec4(finalColor, originalColor.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
