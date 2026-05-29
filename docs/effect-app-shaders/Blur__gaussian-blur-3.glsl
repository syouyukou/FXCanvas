



// @gips_version=1 @coord=pixel @filter=off

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float opacity;    // label=opacity, value=1.0, min=0.0, max=1.0, step=0.01, desc=opacity of blurred layer
uniform int blendMode;    // ui=dropdown, label="Blend mode", options=[Normal:0|Multiply:1|Subtract:2|Divide:3|Lighten:4|Screen:5], value=0

vec4 pixelBlurred(in vec2 pos) {
    vec2 uv = offset + pos * texScale / iResolution.xy;
    return textureLod(iChannel0, uv, 0.0); 
}

vec4 pixelOriginal(in vec2 pos) {
    vec2 uv = offset + pos * texScale / iResolution.xy;
    return textureLod(iChannel7, uv, 0.0); 
}




vec3 noBlend(vec3 base, vec3 blend) {
    return blend;
}


vec3 multiplyBlend(vec3 base, vec3 blend) {
    return base * blend;
}


vec3 subtractBlend(vec3 base, vec3 blend) {
    return max(base - blend, 0.0);
}


vec3 divideBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r > 0.001) ? min(base.r / blend.r, 1.0) : 1.0,
        (blend.g > 0.001) ? min(base.g / blend.g, 1.0) : 1.0,
        (blend.b > 0.001) ? min(base.b / blend.b, 1.0) : 1.0
    );
}


vec3 lightenBlend(vec3 base, vec3 blend) {
    return max(base, blend);
}


vec3 screenBlend(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 applyBlendMode(vec3 base, vec3 blend, int mode) {
    if (mode == 0) return noBlend(base, blend);
    if (mode == 1) return multiplyBlend(base, blend);
    if (mode == 2) return subtractBlend(base, blend);
    if (mode == 3) return divideBlend(base, blend);
    if (mode == 4) return lightenBlend(base, blend);
    if (mode == 5) return screenBlend(base, blend);
    return blend; 
}

vec4 run(vec2 pos) {
    vec4 blurred = pixelBlurred(pos);
    vec4 original = pixelOriginal(pos);

    
    vec3 blendedColor = applyBlendMode(original.rgb, blurred.rgb, blendMode);

    
    vec3 finalColor = mix(original.rgb, blendedColor, opacity);

    
    return vec4(finalColor, original.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = run(fragCoord);
}
