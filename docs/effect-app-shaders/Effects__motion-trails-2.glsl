


uniform float trace_intensity; // label=intensity, value=1.0, min=0.0, max=3.0, step=0.01
uniform float source_dim;      // label=source dim, value=0.75, min=0.0, max=1.0, step=0.01, desc=dims the incoming source before motion trails are applied
uniform int blend_mode;        // ui=dropdown, label="Blend mode", options=[Add:0|Multiply:1|Screen:2|Overlay:3|Soft light:4|Hard light:5|Color dodge:6|Lighten:7], value=2

vec3 sRGBToLinear(vec3 col) {
    bvec3 cutoff = lessThanEqual(col, vec3(0.04045));
    vec3 lower = col / 12.92;
    vec3 higher = pow((col + 0.055) / 1.055, vec3(2.4));
    return mix(higher, lower, vec3(cutoff));
}

vec3 linearToSRGB(vec3 col) {
    col = max(col, vec3(0.0));
    bvec3 cutoff = lessThanEqual(col, vec3(0.0031308));
    vec3 lower = col * 12.92;
    vec3 higher = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
    return mix(higher, lower, vec3(cutoff));
}

vec3 screenBlend(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 multiplyBlend(vec3 base, vec3 blend) {
    return base * blend;
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

vec3 hardLightBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r < 0.5) ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
        (blend.g < 0.5) ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
        (blend.b < 0.5) ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
    );
}

vec3 colorDodgeBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r >= 1.0) ? 1.0 : min(base.r / (1.0 - blend.r), 1.0),
        (blend.g >= 1.0) ? 1.0 : min(base.g / (1.0 - blend.g), 1.0),
        (blend.b >= 1.0) ? 1.0 : min(base.b / (1.0 - blend.b), 1.0)
    );
}

vec3 applyBlendMode(vec3 base, vec3 motionTrails, int mode) {
    if (mode == 0) return base + motionTrails;
    if (mode == 1) return multiplyBlend(base, motionTrails);
    if (mode == 2) return screenBlend(base, motionTrails);
    if (mode == 3) return overlayBlend(base, motionTrails);
    if (mode == 4) return softLightBlend(base, motionTrails);
    if (mode == 5) return hardLightBlend(base, motionTrails);
    if (mode == 6) return colorDodgeBlend(base, motionTrails);
    if (mode == 7) return max(base, motionTrails);
    return screenBlend(base, motionTrails);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec3 motionTrailsLin = sRGBToLinear(texture(iChannel0, uv).rgb);
    vec4 base = texture(iChannel7, uv);
    vec3 baseLin = sRGBToLinear(base.rgb);

    vec3 dimmedBaseLin = baseLin * source_dim;
    vec3 resultLin = applyBlendMode(dimmedBaseLin, motionTrailsLin * trace_intensity, blend_mode);
    fragColor = vec4(linearToSRGB(resultLin), base.a);
}
