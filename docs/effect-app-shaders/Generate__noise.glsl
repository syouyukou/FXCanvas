// @animated


// @gips_version=1

uniform float strength;      // label=amount, value=0.9, max=3,   desc=Amount (log)
uniform float grainSize;     // label=size, value=1.0, min=0.5, max=3, desc=Grain size in pixels
uniform float minGrain;      // label=floor, value=0.02, min=0, max=0.3, desc=Minimum grain floor
uniform float chroma;        // label=chroma, value=0.8, min=0,   max=1,   desc=Colour contrast
uniform float shadowWeight;   // label=shadow, value=1.0, min=0, max=1, desc=Shadow grain
uniform float midWeight;      // label=mid-tone, value=0.5, min=0, max=1, desc=Mid-tone grain
uniform float highlightWeight;// label=highlight, value=0.8, min=0, max=1, desc=Highlight grain
uniform float grainSpeed;     // label=speed, value=0, step=1, min=0, max=60, desc=Animation speed


vec3 srgbToLinear(vec3 c) {
    return pow(c, vec3(2.2));
}
vec3 linearToSrgb(vec3 c) {
    return pow(c, vec3(1.0 / 2.2));
}

vec3 softLight(vec3 B, vec3 L) {
    vec3 D = step(L, vec3(0.5));
    vec3 m1 = B - (1.0 - 2.0 * L) * B * (1.0 - B);
    vec3 m2 = B + (2.0 * L - 1.0) *
        (mix(((16.0 * B - 12.0) * B + 4.0) * B, sqrt(B), step(B, vec3(0.25))) - B);
    return mix(m2, m1, D);
}


float hash(vec2 p) {
    const uint k = 1103515245u;
    uvec2 x = uvec2(floatBitsToUint(p.x), floatBitsToUint(p.y));
    x = ((x >> 8u) ^ x.yx) * k;
    x = ((x >> 8u) ^ x.yx) * k;
    return uintBitsToFloat((x.x & 0x007FFFFFu) | 0x3F800000u) - 1.0;
}


float frameHash(vec2 p, int frameIdx) {
    const uint k = 1103515245u;
    uvec2 x = uvec2(floatBitsToUint(p.x), floatBitsToUint(p.y));
    x += uvec2(frameIdx * 16807, frameIdx * 48271);
    x = ((x >> 8u) ^ x.yx) * k;
    x = ((x >> 8u) ^ x.yx) * k;
    return uintBitsToFloat((x.x & 0x007FFFFFu) | 0x3F800000u) - 1.0;
}


float valueNoise(vec2 px, float cell, int frameIdx) {
    vec2 g = px / cell;
    vec2 i = floor(g), f = fract(g);
    float n00 = frameHash(i, frameIdx);
    float n10 = frameHash(i + vec2(1, 0), frameIdx);
    float n01 = frameHash(i + vec2(0, 1), frameIdx);
    float n11 = frameHash(i + vec2(1, 1), frameIdx);
    return mix(mix(n00, n10, f.x), mix(n01, n11, f.x), f.y);
}


float fractalNoise(vec2 p, float cell, int frameIdx) {
    const int OCTAVES = 3;
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    float norm = 0.0;
    for(int i = 0; i < OCTAVES; ++i) {
        
        float v = valueNoise(p, cell * freq, frameIdx) * 2.0 - 1.0;
        sum += v * amp;
        norm += amp;
        freq *= 2.0;
        amp  *= 0.5;
    }
    return sum / norm;
}


vec3 filmGrain(vec2 fragPx, float cell, int frameIdx) {
    
    float n  = fractalNoise(fragPx, cell, frameIdx);

    
    float nR = fractalNoise(fragPx + vec2(19.3, 37.7), cell, frameIdx);
    float nG = fractalNoise(fragPx + vec2(73.1, 11.9), cell, frameIdx);
    float nB = fractalNoise(fragPx + vec2(45.4, 62.3), cell, frameIdx);

    vec3 colourNoise = vec3(nR, nG, nB);
    return mix(vec3(n), colourNoise, chroma);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 texSrgb = texture(iChannel0, uv).rgb;
    vec3 base = srgbToLinear(texSrgb);

    float cell = max(grainSize, 0.5);

    
    int grainFrame;
    if(grainSpeed <= 0.0) {
        grainFrame = 0;
    } else if(grainSpeed >= 60.0) {
        grainFrame = iFrame;
    } else {
        float interval = max(1.0, 61.0 - grainSpeed);
        grainFrame = int(floor(float(iFrame) / interval));
    }

    vec3 grain = filmGrain(fragCoord, cell, grainFrame);

    float luma = dot(texSrgb, vec3(0.2126, 0.7152, 0.0722));
    float sh = smoothstep(0.40, 0.00, luma);
    float hl = smoothstep(0.60, 1.00, luma);
    float md = clamp(1.0 - sh - hl, 0.0, 1.0);
    float toneGain = pow(sh * shadowWeight + md * midWeight + hl * highlightWeight, 0.6);

    grain *= toneGain;
    grain *= exp2(strength) - 1.0;

    float weight = base.x * (1.0 - base.x);
    weight = min(weight, 0.25);
    float w = clamp(weight + minGrain * (1.0 - 4.0 * weight), minGrain, 0.25);

    vec3 outCol = base + grain * w;
    fragColor = vec4(linearToSrgb(outCol), 1.0);
}
