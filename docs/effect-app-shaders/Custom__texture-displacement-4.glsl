


const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float amount;   // label=amount, value=1.0, min=0.0, max=10.0, step=0.01, desc=overall displacement strength
uniform int direction;  // applied in this pass; declared without ui (metadata on pass 1)
uniform float debugMap;  // label=debug map, value=0.0, min=0.0, max=1.0, step=1.0, desc=visualize the displacement map, ui=switch, random=0




vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0
        ? vec2(aspect, 1.0)
        : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0
        ? vec2(aspect, 1.0)
        : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec3 srgbToLinear(vec3 c) {
    vec3 lo = c / 12.92;
    vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
    return mix(lo, hi, step(0.04045, c));
}

vec3 linearToSrgb(vec3 c) {
    c = max(c, vec3(0.0));
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(0.0031308, c));
}

vec3 Bg(vec2 uv) {
    vec2 texel = 1.0 / vec2(textureSize(iChannel7, 0));
    vec2 halfTexel = 0.5 * texel;
    vec2 minUV = halfTexel;
    vec2 maxUV = vec2(1.0) - halfTexel;
    vec2 clampedUV = clamp(uv, minUV, maxUV);
    const float softness = 4.0;

    vec2 sampleUV = offset + clampedUV * texScale;
    vec3 center = srgbToLinear(texture(iChannel7, sampleUV).rgb);
    if (softness <= 0.0) {
        return center;
    }

    float edgeDist = min(min(clampedUV.x - minUV.x, maxUV.x - clampedUV.x),
                         min(clampedUV.y - minUV.y, maxUV.y - clampedUV.y));
    float feather = softness * 2.0 * max(texel.x, texel.y);
    float edgeBlend = 1.0 - smoothstep(0.0, feather, edgeDist);

    vec2 uvR = offset + clamp(clampedUV + vec2(texel.x, 0.0), minUV, maxUV) * texScale;
    vec2 uvL = offset + clamp(clampedUV - vec2(texel.x, 0.0), minUV, maxUV) * texScale;
    vec2 uvU = offset + clamp(clampedUV + vec2(0.0, texel.y), minUV, maxUV) * texScale;
    vec2 uvD = offset + clamp(clampedUV - vec2(0.0, texel.y), minUV, maxUV) * texScale;

    vec3 blur = center;
    blur += srgbToLinear(texture(iChannel7, uvR).rgb);
    blur += srgbToLinear(texture(iChannel7, uvL).rgb);
    blur += srgbToLinear(texture(iChannel7, uvU).rgb);
    blur += srgbToLinear(texture(iChannel7, uvD).rgb);
    blur *= 0.2;

    return mix(center, blur, edgeBlend);
}

float getDisplacement(vec2 uv) {
    return textureLod(iChannel0, uv, 0.0).r;
}




vec4 run(vec2 pos) {
    vec2 uv = fromRelCoord(pos);

    if (debugMap > 0.5) {
        float d = getDisplacement(uv);
        return vec4(vec3(d), 1.0);
    }

    float displacementValue = getDisplacement(uv);
    float s = (displacementValue - 0.5) * 2.0;
    vec2 displacement = direction == 0 ? vec2(s, s) : direction == 1 ? vec2(s, 0.0) : vec2(0.0, s);
    vec2 displacedUV = uv + displacement * amount * 0.05;
    vec3 color = Bg(displacedUV);

    return vec4(linearToSrgb(color), 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 pos = toRelCoord(fragCoord);
    fragColor = run(pos);
}
