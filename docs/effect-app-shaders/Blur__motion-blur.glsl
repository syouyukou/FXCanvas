



// @gips_version=1 @coord=pixel @filter=off



const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);
const float PI = 3.14159265359;

uniform float strength;  // value=20, min=.3, max=50, step=0.01
uniform float angle;  // value=0, max=360, step=1
uniform float box;    // value=0, ui=switch, desc=box blur (instead of Gaussian)
uniform float bothDirections; // label=both directions, value=1.0, min=0.0, max=1.0, step=1.0, ui=switch, desc=sample both forward and backward blur directions
uniform int blendMode;    // ui=dropdown, label="Blend mode", options=[Normal:0|Multiply:1|Lighten:2|Screen:3], value=0
uniform float opacity;    // label=opacity, value=1.0, min=0.0, max=1.0, step=0.01, desc=opacity of blurred layer
uniform float maskEnabled;  // label=enable mask, value=0.0, min=0.0, max=1.0, step=1.0, ui=switch
uniform vec2 center;        // label=mask center, value=(0.5, 0.5), min=0, max=1, pickable
uniform float radius;       // label=mask radius, value=0.35, min=0.01, max=4.0, step=0.01
uniform float falloff;      // label=mask falloff, value=2.0, min=0.5, max=6.0, step=0.1
uniform float maskAspect;   // label=mask aspect stretch, value=0.0, min=0.0, max=5.0, step=0.05
uniform float maskRotation; // label=mask rotation, value=0.0, min=-180, max=180, step=1.0
uniform float invertMask;   // label=invert mask, value=0.0, min=0.0, max=1.0, step=1.0, ui=switch
uniform float debugMask;    // label=debug mask, value=0.0, min=0.0, max=1.0, step=1.0, ui=switch, random=0

vec4 pixel(in vec2 pos) {
    vec2 uv = offset + pos * texScale / iResolution.xy;
    return textureLod(iChannel0, uv, 0.0);
}

vec4 pixelOriginal(in vec2 pos) {
    vec2 uv = offset + pos * texScale / iResolution.xy;
    return textureLod(iChannel7, uv, 0.0);
}

vec3 srgbToLinear(vec3 c) {
    vec3 lo = c / 12.92;
    vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
    return mix(lo, hi, step(vec3(0.04045), c));
}

vec3 linearToSrgb(vec3 c) {
    c = max(c, vec3(0.0));
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), c));
}

float deg2rad(float d) {
    return d * (PI / 180.0);
}

mat2 rot2(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

float radialMask(vec2 uv) {
    if (maskEnabled < 0.5) return 1.0;

    vec2 p = uv - center;
    float ar = iResolution.x / max(iResolution.y, 1e-6);
    p.x *= ar;
    p = rot2(-deg2rad(maskRotation)) * p;
    p /= max(radius, 1e-6);

    if (maskAspect > 0.0) {
        float stretch = 1.0 + maskAspect;
        float normalize = 1.0 / sqrt(stretch);
        p.x *= stretch * normalize;
        p.y *= normalize;
    }

    float t = clamp(length(p), 0.0, 1.0);
    float mask = pow(smoothstep(0.0, 1.0, t), max(falloff, 1e-6));
    return mix(mask, 1.0 - mask, invertMask);
}

vec3 noBlend(vec3 base, vec3 blend) {
    return blend;
}

vec3 multiplyBlend(vec3 base, vec3 blend) {
    return base * blend;
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
    if (mode == 2) return lightenBlend(base, blend);
    if (mode == 3) return screenBlend(base, blend);
    return blend;
}

vec4 run(vec2 pos) {
    vec4 original = pixelOriginal(pos);
    vec3 originalLinear = srgbToLinear(original.rgb);
    vec3 color = srgbToLinear(pixel(pos).rgb);
    float wsum = 1.0;
    float radius = max(1.0, original.a) * strength * 2.6412;
    vec2 dir = vec2(cos(radians(angle)), sin(radians(angle)));
    for (float dist = 1.0;  dist < radius;  dist += 1.0) {
        float w = 1.0 - dist / radius;
        w = 1.0 - w * w;
        w = 1.0 - w * w;
        w = max(w, box);
        color += w * srgbToLinear(pixel(pos + dist * dir).rgb);
        wsum += w;
        if (bothDirections > 0.5) {
            color += w * srgbToLinear(pixel(pos - dist * dir).rgb);
            wsum += w;
        }
    }
    vec3 blurred = color / max(wsum, 1e-6);
    vec3 blendedColor = applyBlendMode(originalLinear, blurred, blendMode);
    vec3 effectColor = mix(originalLinear, blendedColor, opacity);
    float mask = radialMask(pos / iResolution.xy);
    vec3 finalLinear = mix(originalLinear, effectColor, mask);
    return vec4(linearToSrgb(finalLinear), original.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    if (debugMask > 0.5) {
        float m = radialMask(fragCoord / iResolution.xy);
        fragColor = vec4(vec3(m), 1.0);
        return;
    }
    fragColor = run(fragCoord);
}
